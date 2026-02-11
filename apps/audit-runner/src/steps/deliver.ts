// Owner: S12 (Inngest Pipeline). Consumers: pipeline.ts
// Orchestrates email delivery and database write for completed audits.
//
// Email delivery uses Resend via @pare-engine/core's sendReport().
// PDF buffer is persisted as base64 in detailedResults for retrieval via the
// /api/admin/audits/[id]/pdf route.
//
// This step is independently retriable by Inngest.

import pg from 'pg';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { auditResults, sendReport } from '@pare-engine/core';
import type {
  AuditRequest,
  CompositeScore,
  PdfOutput,
  ContentAnalysisOutput,
  SchemaAnalysisOutput,
  TechnicalAnalysisOutput,
  GBPAnalysisOutput,
  MultiProviderResult,
} from '@pare-engine/core/contracts';

// ---------------------------------------------------------------------------
// Error Class
// ---------------------------------------------------------------------------

export class DeliverError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'DeliverError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Step Input
// ---------------------------------------------------------------------------

export interface DeliverStepInput {
  auditRequest: AuditRequest;
  score: CompositeScore;
  pdf: PdfOutput;
  analysisData: {
    content: ContentAnalysisOutput;
    schema: SchemaAnalysisOutput;
    technical: TechnicalAnalysisOutput;
    gbp: GBPAnalysisOutput;
  };
  queryResult: MultiProviderResult;
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Step Output
// ---------------------------------------------------------------------------

export interface DeliverStepOutput {
  emailSent: boolean;
  emailId: string;
  auditResultId: string;
  pdfUrl: string;
  deliveredAt: Date;
}

// ---------------------------------------------------------------------------
// Email Delivery via Resend
// ---------------------------------------------------------------------------

/**
 * Sends the audit report via Resend email.
 * Gracefully degrades if resendApiKey is not configured.
 */
async function sendReportEmail(
  auditRequest: AuditRequest,
  pdf: PdfOutput,
  score: CompositeScore,
  resendApiKey?: string,
): Promise<{ emailSent: boolean; emailId: string }> {
  if (!resendApiKey) {
    console.warn(
      `[deliver] RESEND_API_KEY not configured. Skipping email for ${auditRequest.businessName}.`,
    );
    return { emailSent: false, emailId: `no-key-${Date.now()}` };
  }

  try {
    const result = await sendReport(
      { auditRequest, pdf, score },
      resendApiKey,
    );
    return { emailSent: result.emailSent, emailId: result.emailId };
  } catch (err) {
    // Graceful degradation: log and continue without email
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[deliver] Email delivery failed: ${message}`);
    return { emailSent: false, emailId: `failed-${Date.now()}` };
  }
}

// ---------------------------------------------------------------------------
// Database Write
// ---------------------------------------------------------------------------

/**
 * Writes the audit result to the auditResults table.
 * Stores the PDF buffer as base64 in detailedResults for later retrieval.
 *
 * @param input - All pipeline outputs
 * @param databaseUrl - PostgreSQL connection URL from validated config
 * @returns The generated audit result ID
 */
async function writeAuditResult(
  input: DeliverStepInput,
  databaseUrl: string,
): Promise<string> {
  const pool = new pg.Pool({ connectionString: databaseUrl });

  try {
    const db = drizzle(pool);

    const { auditRequest, score, queryResult, analysisData, pdf, durationMs } = input;

    const detailedResults = {
      pillars: {
        aiVisibility: score.pillars.aiVisibility,
        contentQuality: score.pillars.contentQuality,
        schemaStructuredData: score.pillars.schemaStructuredData,
        technicalReadiness: score.pillars.technicalReadiness,
        localGbp: score.pillars.localGbp,
      },
      queryResult: {
        brand: queryResult.brand,
        domain: queryResult.domain,
        responseCount: queryResult.responses.length,
        failedPlatforms: queryResult.failedPlatforms,
        queriedAt: queryResult.queriedAt,
      },
      analysisData: {
        contentPageCount: analysisData.content.pages.length,
        schemaTypesFound: analysisData.schema.allPresentTypes,
        schemaMissing: analysisData.schema.allMissingRequired,
        technicalSummary: {
          robotsAiFriendly: analysisData.technical.robotsTxt.aiFriendly,
          llmsTxt: analysisData.technical.llmsTxtPresent,
          sitemap: analysisData.technical.sitemapPresent,
          https: analysisData.technical.httpsEnabled,
          mobile: analysisData.technical.mobileFriendly,
        },
        gbpSummary: {
          placeId: analysisData.gbp.placeId,
          rating: analysisData.gbp.rating,
          reviewCount: analysisData.gbp.reviewCount,
          napConsistent: analysisData.gbp.napConsistent,
        },
      },
      // Persist PDF buffer as base64 for retrieval via /api/admin/audits/[id]/pdf
      pdfBuffer: pdf.buffer.toString('base64'),
      pdfFilename: pdf.filename,
      pdfPageCount: pdf.pageCount,
      durationMs,
      pipelineVersion: '1.0',
    };

    // The PDF API endpoint URL for this audit
    const [inserted] = await db.insert(auditResults).values({
      clientId: auditRequest.clientId,
      auditDate: new Date(),
      auditType: auditRequest.auditType,
      overallScore: score.overallScore,
      letterGrade: score.letterGrade,
      aiVisibilityScore: Math.round(score.pillars.aiVisibility.score),
      contentScore: Math.round(score.pillars.contentQuality.score),
      schemaScore: Math.round(score.pillars.schemaStructuredData.score),
      technicalScore: Math.round(score.pillars.technicalReadiness.score),
      gbpScore: Math.round(score.pillars.localGbp.score),
      detailedResults,
    }).returning({ id: auditResults.id });

    if (!inserted) {
      throw new DeliverError(
        'Failed to insert audit result into database',
        'DB_INSERT_FAILED',
      );
    }

    // Set reportPdfUrl now that we have the audit result ID
    await db.update(auditResults)
      .set({ reportPdfUrl: `/api/admin/audits/${inserted.id}/pdf` })
      .where(eq(auditResults.id, inserted.id));

    return inserted.id;
  } finally {
    await pool.end();
  }
}

// ---------------------------------------------------------------------------
// Public API: Execute Deliver Step
// ---------------------------------------------------------------------------

/**
 * Executes the delivery step of the audit pipeline.
 *
 * Flow:
 * 1. Write audit result to the auditResults table (with PDF buffer in detailedResults)
 * 2. Send report email via Resend (graceful degradation if key missing)
 * 3. Return delivery confirmation with PDF URL
 *
 * @param input - All pipeline outputs including PDF buffer
 * @param databaseUrl - PostgreSQL connection URL
 * @param resendApiKey - Optional Resend API key for email delivery
 * @returns Delivery result with email status, audit result ID, and PDF URL
 * @throws DeliverError if DB write fails (retriable by Inngest)
 */
export async function executeDeliverStep(
  input: DeliverStepInput,
  databaseUrl: string,
  resendApiKey?: string,
): Promise<DeliverStepOutput> {
  try {
    // Step 1: Write to database (includes PDF buffer in detailedResults)
    const auditResultId = await writeAuditResult(input, databaseUrl);

    // Step 2: Send email (graceful degradation if key not set)
    const emailResult = await sendReportEmail(
      input.auditRequest,
      input.pdf,
      input.score,
      resendApiKey,
    );

    const pdfUrl = `/api/admin/audits/${auditResultId}/pdf`;

    return {
      emailSent: emailResult.emailSent,
      emailId: emailResult.emailId,
      auditResultId,
      pdfUrl,
      deliveredAt: new Date(),
    };
  } catch (err) {
    // If it's already a DeliverError, re-throw it
    if (err instanceof DeliverError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : String(err);
    throw new DeliverError(
      `Delivery failed: ${message}`,
      'DELIVER_STEP_FAILED',
    );
  }
}
