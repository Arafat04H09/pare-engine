// Owner: Task 1.2 (Implementation Workbench).
// Determines which remediations to create based on audit analysis gaps,
// then inserts remediation items into the DB with status='draft'.
// Content generation happens on-demand from the workbench UI, not here.
//
// This step is independently retriable by Inngest.

import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { remediationItems } from '@pare-engine/core';
import type {
  AuditRequest,
  ContentAnalysisOutput,
  SchemaAnalysisOutput,
  TechnicalAnalysisOutput,
} from '@pare-engine/core/contracts';
import { SCORING_WEIGHTS } from '@pare-engine/core/contracts';

// ---------------------------------------------------------------------------
// Error Class
// ---------------------------------------------------------------------------

export class CreateRemediationsError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'CreateRemediationsError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateRemediationsInput {
  auditId: string;
  analysisData: {
    schema: SchemaAnalysisOutput;
    content: ContentAnalysisOutput;
    technical: TechnicalAnalysisOutput;
  };
  auditRequest: AuditRequest;
}

export interface CreateRemediationsOutput {
  remediationIds: string[];
  remediationTypes: string[];
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Gap Detection
// ---------------------------------------------------------------------------

interface DetectedGap {
  type: 'jsonld' | 'faq' | 'llmstxt';
  reason: string;
}

/**
 * Analyzes audit data to determine which remediations should be created.
 *
 * Thresholds:
 * - Schema score < 80% of max (15 * 0.8 = 12) -> create 'jsonld' remediation
 * - Content has 0 FAQ pages -> create 'faq' remediation
 * - Technical has no llms.txt -> create 'llmstxt' remediation
 */
function detectGaps(
  schema: SchemaAnalysisOutput,
  content: ContentAnalysisOutput,
  technical: TechnicalAnalysisOutput,
): DetectedGap[] {
  const gaps: DetectedGap[] = [];

  // Schema gap: if missing required types or many validation errors,
  // that means the schema pillar is weak. We use a heuristic based on
  // how many required types are missing relative to what's needed.
  const schemaMaxScore = SCORING_WEIGHTS.schemaStructuredData; // 15
  const schemaThreshold = schemaMaxScore * 0.8; // 12

  // Compute a rough schema score: penalize for missing required types and validation errors.
  // Each missing required type costs proportionally. This is a heuristic, not the formal scorer.
  const missingRequiredCount = schema.allMissingRequired.length;
  const totalRequiredEstimate = schema.allPresentTypes.length + missingRequiredCount;
  const requiredCoverage = totalRequiredEstimate > 0
    ? (totalRequiredEstimate - missingRequiredCount) / totalRequiredEstimate
    : 0;
  const roughSchemaScore = requiredCoverage * schemaMaxScore;

  if (roughSchemaScore < schemaThreshold || missingRequiredCount > 0) {
    gaps.push({
      type: 'jsonld',
      reason: `Missing ${missingRequiredCount} required schema type(s): ${schema.allMissingRequired.join(', ') || 'none'}.` +
        ` ${schema.totalValidationErrors} validation error(s) found.` +
        ` Estimated schema coverage: ${Math.round(requiredCoverage * 100)}%.`,
    });
  }

  // FAQ gap: no FAQ pages detected in the content analysis
  if (content.faqPageCount === 0) {
    gaps.push({
      type: 'faq',
      reason: `No FAQ pages detected across ${content.pages.length} analyzed page(s).` +
        ` Average answer-first score: ${content.averageAnswerFirstScore.toFixed(1)}/10.`,
    });
  }

  // llms.txt gap: technical analysis shows no llms.txt present
  if (!technical.llmsTxtPresent) {
    gaps.push({
      type: 'llmstxt',
      reason: `No llms.txt file found.` +
        (technical.llmsFullTxtPresent ? ' (llms-full.txt is present but llms.txt is missing.)' : '') +
        ` AI crawler access: ${technical.robotsTxt.aiFriendly ? 'friendly' : 'restricted'}.`,
    });
  }

  return gaps;
}

// ---------------------------------------------------------------------------
// Database Insert
// ---------------------------------------------------------------------------

async function insertRemediations(
  auditId: string,
  gaps: DetectedGap[],
  databaseUrl: string,
): Promise<string[]> {
  if (gaps.length === 0) {
    return [];
  }

  const pool = new pg.Pool({ connectionString: databaseUrl });

  try {
    const db = drizzle(pool);

    const values = gaps.map((gap) => ({
      auditId,
      type: gap.type,
      status: 'draft',
      originalContent: null,
      currentContent: null,
      presentationMarkdown: `**Gap detected:** ${gap.reason}`,
    }));

    const inserted = await db
      .insert(remediationItems)
      .values(values)
      .returning({ id: remediationItems.id });

    return inserted.map((row) => row.id);
  } finally {
    await pool.end();
  }
}

// ---------------------------------------------------------------------------
// Public API: Execute Create-Remediations Step
// ---------------------------------------------------------------------------

/**
 * Determines which remediations to create based on audit analysis gaps,
 * then inserts remediation items into the database with status='draft'.
 *
 * Content generation is NOT performed here -- it happens on-demand when
 * the operator clicks "Generate Fix" in the workbench UI.
 *
 * @param input - Audit ID, analysis data, and audit request
 * @param databaseUrl - PostgreSQL connection URL
 * @returns List of created remediation IDs and types
 * @throws CreateRemediationsError if DB insert fails
 */
export async function executeCreateRemediationsStep(
  input: CreateRemediationsInput,
  databaseUrl: string,
): Promise<CreateRemediationsOutput> {
  const { auditId, analysisData } = input;

  try {
    // Step 1: Detect gaps from analysis data
    const gaps = detectGaps(
      analysisData.schema,
      analysisData.content,
      analysisData.technical,
    );

    if (gaps.length === 0) {
      console.log(`[create-remediations] No gaps detected for audit ${auditId}. No remediations created.`);
      return {
        remediationIds: [],
        remediationTypes: [],
        createdAt: new Date(),
      };
    }

    console.log(`[create-remediations] Detected ${gaps.length} gap(s) for audit ${auditId}: ${gaps.map((g) => g.type).join(', ')}`);

    // Step 2: Insert draft remediation items
    const remediationIds = await insertRemediations(auditId, gaps, databaseUrl);

    return {
      remediationIds,
      remediationTypes: gaps.map((g) => g.type),
      createdAt: new Date(),
    };
  } catch (err) {
    if (err instanceof CreateRemediationsError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : String(err);
    throw new CreateRemediationsError(
      `Failed to create remediations: ${message}`,
      'CREATE_REMEDIATIONS_FAILED',
    );
  }
}
