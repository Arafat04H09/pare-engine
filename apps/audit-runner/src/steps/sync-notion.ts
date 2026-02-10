// Owner: S17 (Notion Sync + Monitoring Setup).
// Inngest-compatible step function that syncs client + audit data to Notion.
//
// Architecture:
//   - Reads client and latest audit from Postgres (Drizzle ORM).
//   - Creates or updates a page in a Notion database.
//   - One-way sync: Postgres -> Notion. Notion is display-only.
//   - This is a NON-CRITICAL step: failures are caught and returned, never thrown,
//     so the audit pipeline can complete even if Notion is unreachable.
//   - Notion sync logic is duplicated from packages/core/src/tools/sync-notion.ts
//     because the core package.json does not yet export subpath ./tools/*.
//     Same pattern as S3's crawl.ts.

import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, desc } from 'drizzle-orm';
import { Client as NotionClient, isNotionClientError } from '@notionhq/client';
import { clients, auditResults } from '@pare-engine/core';

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class NotionStepError extends Error {
  public readonly code: string;

  constructor(message: string, code: string, cause?: unknown) {
    super(message);
    this.name = 'NotionStepError';
    this.code = code;
    if (cause) {
      this.cause = cause;
    }
  }
}

// ---------------------------------------------------------------------------
// Input / Output interfaces
// ---------------------------------------------------------------------------

export interface SyncNotionStepInput {
  clientId: string;
  notionApiKey?: string;
  notionDatabaseId?: string;
  databaseUrl: string;
}

export interface SyncNotionStepOutput {
  attempted: boolean;
  success?: boolean;
  notionPageId?: string;
  operation?: 'created' | 'updated';
  errorMessage?: string;
  skipReason?: string;
  syncedAt?: Date;
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface ClientRow {
  id: string;
  businessName: string;
  domain: string;
  vertical: string;
  locationCity: string | null;
  locationState: string | null;
  engagementType: string | null;
  primaryContactEmail: string | null;
  primaryContactName: string | null;
}

interface AuditRow {
  overallScore: number;
  letterGrade: string;
  auditDate: Date;
  aiVisibilityScore: number | null;
  contentScore: number | null;
  schemaScore: number | null;
  technicalScore: number | null;
  gbpScore: number | null;
}

// ---------------------------------------------------------------------------
// Notion property builders (duplicated from core/tools/sync-notion.ts)
// ---------------------------------------------------------------------------

function buildNotionProperties(
  client: ClientRow,
  audit: AuditRow | null,
): Record<string, unknown> {
  const properties: Record<string, unknown> = {
    'Business Name': {
      title: [{ text: { content: client.businessName } }],
    },
    'Pare Client ID': {
      rich_text: [{ text: { content: client.id } }],
    },
    'Domain': {
      url: `https://${client.domain.replace(/^https?:\/\//, '')}`,
    },
    'Vertical': {
      select: { name: client.vertical },
    },
  };

  const locationParts: string[] = [];
  if (client.locationCity) {
    locationParts.push(client.locationCity);
  }
  if (client.locationState) {
    locationParts.push(client.locationState);
  }
  if (locationParts.length > 0) {
    properties['Location'] = {
      rich_text: [{ text: { content: locationParts.join(', ') } }],
    };
  }

  if (client.engagementType) {
    properties['Engagement Type'] = {
      select: { name: client.engagementType },
    };
  }

  if (client.primaryContactEmail) {
    properties['Contact Email'] = {
      email: client.primaryContactEmail,
    };
  }
  if (client.primaryContactName) {
    properties['Contact Name'] = {
      rich_text: [{ text: { content: client.primaryContactName } }],
    };
  }

  if (audit) {
    properties['Overall Score'] = { number: audit.overallScore };
    properties['Letter Grade'] = {
      select: { name: audit.letterGrade },
    };

    if (audit.aiVisibilityScore != null) {
      properties['AI Visibility'] = { number: audit.aiVisibilityScore };
    }
    if (audit.contentScore != null) {
      properties['Content Score'] = { number: audit.contentScore };
    }
    if (audit.schemaScore != null) {
      properties['Schema Score'] = { number: audit.schemaScore };
    }
    if (audit.technicalScore != null) {
      properties['Technical Score'] = { number: audit.technicalScore };
    }
    if (audit.gbpScore != null) {
      properties['GBP Score'] = { number: audit.gbpScore };
    }

    properties['Last Audit Date'] = {
      date: { start: audit.auditDate.toISOString().split('T')[0] },
    };
  }

  return properties;
}

// ---------------------------------------------------------------------------
// Notion API helper
// ---------------------------------------------------------------------------

async function findExistingPage(
  notion: NotionClient,
  databaseId: string,
  clientId: string,
): Promise<string | null> {
  const response = await notion.dataSources.query({
    data_source_id: databaseId,
    filter: {
      property: 'Pare Client ID',
      rich_text: { equals: clientId },
    },
    page_size: 1,
  });

  if (response.results.length > 0) {
    return response.results[0].id;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Public API: Inngest step function
// ---------------------------------------------------------------------------

export async function executeSyncNotionStep(
  input: SyncNotionStepInput,
): Promise<SyncNotionStepOutput> {
  const now = new Date();

  // Guard: skip if Notion is not configured (Tier 2, optional until Round 5)
  if (!input.notionApiKey || !input.notionDatabaseId) {
    return {
      attempted: false,
      skipReason: 'Notion API key or database ID not configured',
    };
  }

  try {
    const pool = new pg.Pool({ connectionString: input.databaseUrl });
    const db = drizzle(pool);

    try {
      // Fetch the client row
      const clientRows = await db
        .select()
        .from(clients)
        .where(eq(clients.id, input.clientId))
        .limit(1);

      if (clientRows.length === 0) {
        await pool.end();
        return {
          attempted: true,
          success: false,
          errorMessage: `Client not found: ${input.clientId}`,
          syncedAt: now,
        };
      }

      const clientRow = clientRows[0];

      // Fetch the latest audit result for this client
      const auditRows = await db
        .select()
        .from(auditResults)
        .where(eq(auditResults.clientId, input.clientId))
        .orderBy(desc(auditResults.auditDate))
        .limit(1);

      const auditRow: AuditRow | null = auditRows.length > 0
        ? {
            overallScore: auditRows[0].overallScore,
            letterGrade: auditRows[0].letterGrade,
            auditDate: auditRows[0].auditDate,
            aiVisibilityScore: auditRows[0].aiVisibilityScore,
            contentScore: auditRows[0].contentScore,
            schemaScore: auditRows[0].schemaScore,
            technicalScore: auditRows[0].technicalScore,
            gbpScore: auditRows[0].gbpScore,
          }
        : null;

      await pool.end();

      // Build properties and sync to Notion
      const notion = new NotionClient({ auth: input.notionApiKey });
      const properties = buildNotionProperties(
        {
          id: clientRow.id,
          businessName: clientRow.businessName,
          domain: clientRow.domain,
          vertical: clientRow.vertical,
          locationCity: clientRow.locationCity,
          locationState: clientRow.locationState,
          engagementType: clientRow.engagementType,
          primaryContactEmail: clientRow.primaryContactEmail,
          primaryContactName: clientRow.primaryContactName,
        },
        auditRow,
      );

      const existingPageId = await findExistingPage(
        notion,
        input.notionDatabaseId,
        input.clientId,
      );

      if (existingPageId) {
        await notion.pages.update({
          page_id: existingPageId,
          properties: properties as Parameters<typeof notion.pages.update>[0]['properties'],
        });

        return {
          attempted: true,
          success: true,
          notionPageId: existingPageId,
          operation: 'updated',
          syncedAt: now,
        };
      } else {
        const response = await notion.pages.create({
          parent: { database_id: input.notionDatabaseId },
          properties: properties as Parameters<typeof notion.pages.create>[0]['properties'],
        });

        return {
          attempted: true,
          success: true,
          notionPageId: response.id,
          operation: 'created',
          syncedAt: now,
        };
      }
    } catch (innerError: unknown) {
      await pool.end().catch(() => { /* ignore */ });
      throw innerError;
    }
  } catch (error: unknown) {
    let errorMessage: string;

    if (isNotionClientError(error)) {
      errorMessage = `Notion API error: ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = `Notion sync step failed: ${error.message}`;
    } else {
      errorMessage = `Notion sync step failed: ${String(error)}`;
    }

    console.error(`[S17] SyncNotionStep: ${errorMessage}`);

    return {
      attempted: true,
      success: false,
      errorMessage,
      syncedAt: now,
    };
  }
}
