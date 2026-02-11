// API routes for remediation management (Implementation Workbench).
//
// GET  ?auditId=xxx — List all remediation items for an audit
// POST { remediationId, auditId } — Generate content for a draft remediation
// PATCH { remediationId, status, currentContent? } — Update status (approve/reject)

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../../../lib/db';
import { remediationItems, auditResults, clients } from '@pare-engine/core';
import { validateSession } from '@/lib/session';

const PostBodySchema = z.object({
  remediationId: z.string().min(1),
  auditId: z.string().min(1),
});

const PatchBodySchema = z.object({
  remediationId: z.string().min(1),
  status: z.enum(['approved', 'rejected']),
  currentContent: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Error Helpers
// ---------------------------------------------------------------------------

function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

// ---------------------------------------------------------------------------
// GET /api/remediation?auditId=xxx
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<NextResponse> {
  try {
    if (!(await validateSession())) { return errorResponse('Unauthorized', 401); }
    const url = new URL(request.url);
    const auditId = url.searchParams.get('auditId');

    if (!auditId) {
      return errorResponse('Missing auditId query parameter', 400);
    }

    const items = await db
      .select()
      .from(remediationItems)
      .where(eq(remediationItems.auditId, auditId));

    return NextResponse.json({ remediations: items });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse(`Failed to fetch remediations: ${message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/remediation — Generate content for a remediation item
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<NextResponse> {
  try {
    if (!(await validateSession())) { return errorResponse('Unauthorized', 401); }
    const raw = await request.json();
    const parsed = PostBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 });
    }
    const body = parsed.data;

    // 1. Fetch the remediation item
    const remRows = await db
      .select()
      .from(remediationItems)
      .where(eq(remediationItems.id, body.remediationId))
      .limit(1);

    const remediation = remRows[0];
    if (!remediation) {
      return errorResponse('Remediation not found', 404);
    }

    if (remediation.auditId !== body.auditId) {
      return errorResponse('Remediation does not belong to this audit', 400);
    }

    // 2. Fetch the audit result (for analysis data and client info)
    const auditRows = await db
      .select()
      .from(auditResults)
      .where(eq(auditResults.id, body.auditId))
      .limit(1);

    const audit = auditRows[0];
    if (!audit) {
      return errorResponse('Audit not found', 404);
    }

    // 3. Fetch the client info (for business data context)
    let clientData: { businessName: string; domain: string; vertical: string } | null = null;
    if (audit.clientId) {
      const clientRows = await db
        .select({
          businessName: clients.businessName,
          domain: clients.domain,
          vertical: clients.vertical,
        })
        .from(clients)
        .where(eq(clients.id, audit.clientId))
        .limit(1);

      clientData = clientRows[0] ?? null;
    }

    if (!clientData) {
      return errorResponse('Client not found for this audit', 404);
    }

    const detailedResults = audit.detailedResults as Record<string, unknown> | null;

    // 4. Generate content based on remediation type
    let generatedContent: string;

    switch (remediation.type) {
      case 'jsonld': {
        generatedContent = await generateJsonLdContent(detailedResults, clientData);
        break;
      }
      case 'faq': {
        generatedContent = await generateFaqContent(detailedResults, clientData);
        break;
      }
      case 'llmstxt': {
        generatedContent = await generateLlmsTxtContent(detailedResults, clientData);
        break;
      }
      default: {
        return errorResponse(`Unsupported remediation type: ${remediation.type}`, 400);
      }
    }

    // 5. Update the remediation item with generated content
    await db
      .update(remediationItems)
      .set({
        currentContent: generatedContent,
        presentationMarkdown: generatedContent,
        updatedAt: new Date(),
      })
      .where(eq(remediationItems.id, body.remediationId));

    return NextResponse.json({
      success: true,
      remediationId: body.remediationId,
      content: generatedContent,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[remediation/POST] Error: ${message}`);
    return errorResponse(`Failed to generate remediation: ${message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/remediation — Update status (approve/reject)
// ---------------------------------------------------------------------------

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    if (!(await validateSession())) { return errorResponse('Unauthorized', 401); }
    const raw = await request.json();
    const parsed = PatchBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 });
    }
    const body = parsed.data;

    // Verify the remediation exists
    const remRows = await db
      .select()
      .from(remediationItems)
      .where(eq(remediationItems.id, body.remediationId))
      .limit(1);

    if (remRows.length === 0) {
      return errorResponse('Remediation not found', 404);
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      status: body.status,
      updatedAt: new Date(),
    };

    if (body.currentContent !== undefined) {
      updatePayload.currentContent = body.currentContent;
    }

    await db
      .update(remediationItems)
      .set(updatePayload)
      .where(eq(remediationItems.id, body.remediationId));

    return NextResponse.json({
      success: true,
      remediationId: body.remediationId,
      status: body.status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse(`Failed to update remediation: ${message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// Content Generators (dynamic imports to keep the route bundle small)
// ---------------------------------------------------------------------------

interface ClientInfo {
  businessName: string;
  domain: string;
  vertical: string;
}

/**
 * Generates JSON-LD content using the generate-jsonld tool from core.
 * Uses dynamic import to avoid bundling the AI SDK in the route unless needed.
 */
async function generateJsonLdContent(
  detailedResults: Record<string, unknown> | null,
  client: ClientInfo,
): Promise<string> {
  // Dynamic import to keep cold start fast
  const { generateJsonLd } = await import('@pare-engine/core/tools/generate-jsonld') as {
    generateJsonLd: (
      analysis: import('@pare-engine/core/contracts').SchemaAnalysisOutput,
      businessData: { name: string; domain: string; vertical: string },
    ) => Promise<string>;
  };

  // Extract schema analysis from detailed results
  const analysisData = detailedResults?.analysisData as Record<string, unknown> | undefined;
  const schemaTypesFound = (analysisData?.schemaTypesFound as string[]) ?? [];
  const schemaMissing = (analysisData?.schemaMissing as string[]) ?? [];

  // Reconstruct a minimal SchemaAnalysisOutput for the generator
  const schemaAnalysis = {
    pages: [],
    allPresentTypes: schemaTypesFound,
    allMissingRequired: schemaMissing,
    allMissingRecommended: [],
    totalValidationErrors: 0,
    vertical: client.vertical,
    analyzedAt: new Date(),
  };

  const businessData = {
    name: client.businessName,
    domain: client.domain,
    vertical: client.vertical,
  };

  return await generateJsonLd(schemaAnalysis, businessData);
}

/**
 * Generates FAQ content using the generate-faq tool from core.
 */
async function generateFaqContent(
  detailedResults: Record<string, unknown> | null,
  client: ClientInfo,
): Promise<string> {
  const { generateFaq } = await import('@pare-engine/core/tools/generate-faq') as {
    generateFaq: (
      contentAnalysis: import('@pare-engine/core/contracts').ContentAnalysisOutput,
      vertical: string,
      businessData: { name: string; domain: string; vertical: string },
    ) => Promise<string>;
  };

  // Extract content analysis summary from detailed results
  const analysisData = detailedResults?.analysisData as Record<string, unknown> | undefined;
  const contentPageCount = (analysisData?.contentPageCount as number) ?? 0;

  // Reconstruct a minimal ContentAnalysisOutput for the generator
  const contentAnalysis = {
    pages: [],
    averageAnswerFirstScore: 0,
    faqPageCount: 0,
    averageStatsDensity: 0,
    authorAttributionRate: 0,
    analyzedAt: new Date(),
  };

  // If we have page count, create placeholder entries
  if (contentPageCount > 0) {
    contentAnalysis.pages = Array.from({ length: Math.min(contentPageCount, 5) }, (_, i) => ({
      url: `https://${client.domain}/page-${i + 1}`,
      answerFirstScore: 3,
      faqPresent: false,
      statsCount: 0,
      hasAuthorAttribution: false,
      wordCount: 500,
      depthScore: 4,
    }));
  }

  const businessData = {
    name: client.businessName,
    domain: client.domain,
    vertical: client.vertical,
  };

  return await generateFaq(contentAnalysis, client.vertical, businessData);
}

/**
 * Generates llms.txt content using the generate-llmstxt tool from core.
 */
async function generateLlmsTxtContent(
  detailedResults: Record<string, unknown> | null,
  client: ClientInfo,
): Promise<string> {
  const { generateLlmsTxt } = await import('@pare-engine/core/tools/generate-llmstxt') as {
    generateLlmsTxt: (
      crawlData: import('@pare-engine/core/contracts').CrawlOutput,
      businessData: { name: string; domain: string; vertical: string },
    ) => Promise<string>;
  };

  // Reconstruct a minimal CrawlOutput for the generator.
  // We create a simple representation from audit data since the full crawl
  // data is not stored in detailedResults (only summaries).
  const queryResult = detailedResults?.queryResult as Record<string, unknown> | undefined;
  const domain = (queryResult?.domain as string) ?? client.domain;

  const crawlData = {
    domain,
    pages: [
      {
        url: `https://${domain}`,
        title: `${client.businessName} - Home`,
        markdown: `# ${client.businessName}\n\nA ${client.vertical} business located at ${domain}.`,
        html: `<h1>${client.businessName}</h1>`,
        statusCode: 200,
        contentType: 'text/html',
        crawledAt: new Date(),
      },
    ],
    totalPages: 1,
    crawledAt: new Date(),
  };

  const businessData = {
    name: client.businessName,
    domain: client.domain,
    vertical: client.vertical,
  };

  return await generateLlmsTxt(crawlData, businessData);
}
