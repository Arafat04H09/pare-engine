// Owner: S17 (Notion Sync + Monitoring Setup).
// Typed tool function: Notion API wrapper for one-way Postgres -> Notion sync.
//
// This function creates or updates a page in a Notion database with client
// and audit data. It is designed as a pure typed tool (input -> output) that
// can be wrapped as an MCP tool or called from an Inngest step.
//
// Architecture notes:
//   - One-way sync: Postgres is source of truth, Notion is display-only.
//   - Uses Notion SDK v5.x: dataSources.query() (not databases.query()) for
//     querying, with data_source_id (not database_id).
//   - All Notion API failures are caught and returned in the output -- never
//     thrown -- so that pipeline steps can continue.
//   - The core package does not yet export ./tools/* subpath, so the
//     audit-runner step duplicates this logic (same pattern as S3's crawl).

import { Client as NotionClient, isNotionClientError } from '@notionhq/client';

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

/**
 * Custom error class for Notion sync failures.
 * Extends Error with a `code` property per coding conventions.
 */
export class NotionSyncError extends Error {
  public readonly code: string;

  constructor(message: string, code: string, cause?: unknown) {
    super(message);
    this.name = 'NotionSyncError';
    this.code = code;
    if (cause) {
      this.cause = cause;
    }
  }
}

// ---------------------------------------------------------------------------
// Input / Output interfaces
// ---------------------------------------------------------------------------

/**
 * Input for the Notion sync tool.
 * Client and audit data come from the Postgres database.
 */
export interface NotionSyncInput {
  notionApiKey: string;
  notionDatabaseId: string;
  client: {
    id: string;
    businessName: string;
    domain: string;
    vertical: string;
    locationCity?: string | null;
    locationState?: string | null;
    engagementType?: string | null;
    primaryContactEmail?: string | null;
    primaryContactName?: string | null;
  };
  latestAudit?: {
    overallScore: number;
    letterGrade: string;
    auditDate: Date;
    aiVisibilityScore?: number | null;
    contentScore?: number | null;
    schemaScore?: number | null;
    technicalScore?: number | null;
    gbpScore?: number | null;
  } | null;
}

/**
 * Output from the Notion sync tool.
 * Indicates whether the sync succeeded and what operation was performed.
 */
export interface NotionSyncOutput {
  success: boolean;
  notionPageId?: string;
  operation?: 'created' | 'updated';
  errorMessage?: string;
  syncedAt: Date;
}

// ---------------------------------------------------------------------------
// Notion property builders
// ---------------------------------------------------------------------------

function buildNotionProperties(
  input: NotionSyncInput,
): Record<string, unknown> {
  const { client, latestAudit } = input;

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

  if (latestAudit) {
    properties['Overall Score'] = { number: latestAudit.overallScore };
    properties['Letter Grade'] = {
      select: { name: latestAudit.letterGrade },
    };

    if (latestAudit.aiVisibilityScore != null) {
      properties['AI Visibility'] = { number: latestAudit.aiVisibilityScore };
    }
    if (latestAudit.contentScore != null) {
      properties['Content Score'] = { number: latestAudit.contentScore };
    }
    if (latestAudit.schemaScore != null) {
      properties['Schema Score'] = { number: latestAudit.schemaScore };
    }
    if (latestAudit.technicalScore != null) {
      properties['Technical Score'] = { number: latestAudit.technicalScore };
    }
    if (latestAudit.gbpScore != null) {
      properties['GBP Score'] = { number: latestAudit.gbpScore };
    }

    properties['Last Audit Date'] = {
      date: { start: latestAudit.auditDate.toISOString().split('T')[0] },
    };
  }

  return properties;
}

// ---------------------------------------------------------------------------
// Notion API helpers
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
// Public API
// ---------------------------------------------------------------------------

export async function syncToNotion(
  input: NotionSyncInput,
): Promise<NotionSyncOutput> {
  const now = new Date();

  try {
    const notion = new NotionClient({ auth: input.notionApiKey });
    const properties = buildNotionProperties(input);

    const existingPageId = await findExistingPage(
      notion,
      input.notionDatabaseId,
      input.client.id,
    );

    if (existingPageId) {
      await notion.pages.update({
        page_id: existingPageId,
        properties: properties as Parameters<typeof notion.pages.update>[0]['properties'],
      });

      return {
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
        success: true,
        notionPageId: response.id,
        operation: 'created',
        syncedAt: now,
      };
    }
  } catch (error: unknown) {
    let errorMessage: string;

    if (isNotionClientError(error)) {
      errorMessage = `Notion API error: ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = `Notion sync failed: ${error.message}`;
    } else {
      errorMessage = `Notion sync failed: ${String(error)}`;
    }

    console.error(`[S17] NotionSync: ${errorMessage}`);

    return {
      success: false,
      errorMessage,
      syncedAt: now,
    };
  }
}
