// Owner: S12 (Inngest Pipeline). Consumers: pipeline.ts
// Orchestrates email delivery and database write for completed audits.
//
// Email delivery is STUBBED until S13 (Email Delivery) merges.
// DB write saves the AuditPipelineResult to the auditResults table via Drizzle.
//
// This step is independently retriable by Inngest.

import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { auditResults } from '@pare-engine/core';
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
  deliveredAt: Date;
}

// ---------------------------------------------------------------------------
// Email Delivery -- STUB (S13 not merged yet)
// ---------------------------------------------------------------------------

/**
 * Sends the audit report via email.
 *
 * STUB: S13 (Email Delivery) has not merged yet.
 * When S13 merges, replace this with:
 *   import { sendReport } from '@pare-engine/core/tools/send-report.js';
 *
 * For now, logs a message and returns a placeholder email ID.
 */
async function sendReportEmail(
  _email: string,
  _businessName: string,
  _pdf: PdfOutput,
  _score: CompositeScore,
): Promise<{ emailSent: boolean; emailId: string }> {
  // TODO: Replace with actual email delivery once S13 merges
  console.log(
    `[S12] Email delivery stubbed. Would send report to ${_email} for ${_businessName}.`,
  );
  return {
    emailSent: false,
    emailId: `stub-${Date.now()}`,
  };
}

// ---------------------------------------------------------------------------
// Database Write
// ---------------------------------------------------------------------------

/**
 * Writes the audit result to the auditResults table.
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

    const { auditRequest, score, queryResult, analysisData, durationMs } = input;

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
      durationMs,
      pipelineVersion: '1.0',
    };

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
      reportPdfUrl: undefined, // PDF storage URL will be set when we add file storage
    }).returning({ id: auditResults.id });

    if (!inserted) {
      throw new DeliverError(
        'Failed to insert audit result into database',
        'DB_INSERT_FAILED',
      );
    }

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
 * 1. Write audit result to the auditResults table (Drizzle ORM)
 * 2. Send report email (STUBBED until S13 merges)
 * 3. Return delivery confirmation
 *
 * @param input - All pipeline outputs including PDF buffer
 * @param databaseUrl - PostgreSQL connection URL
 * @returns Delivery result with email status and audit result ID
 * @throws DeliverError if DB write fails (retriable by Inngest)
 */
export async function executeDeliverStep(
  input: DeliverStepInput,
  databaseUrl: string,
): Promise<DeliverStepOutput> {
  try {
    // Step 1: Write to database
    const auditResultId = await writeAuditResult(input, databaseUrl);

    // Step 2: Send email (STUBBED)
    const emailResult = await sendReportEmail(
      input.auditRequest.contactEmail,
      input.auditRequest.businessName,
      input.pdf,
      input.score,
    );

    return {
      emailSent: emailResult.emailSent,
      emailId: emailResult.emailId,
      auditResultId,
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
