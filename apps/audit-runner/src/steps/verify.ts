/**
 * Verify Step — Audit-Fix-Verify Cycle
 * Owner: S20 (Verify Loop + Score History)
 *
 * Triggers a re-audit for an existing client, compares the new score
 * to the previous audit, calculates per-pillar deltas, and writes
 * score history to the monitoringResults table for trend tracking.
 *
 * This step can be used as:
 * - A standalone Inngest step (triggered by 'audit/verify-requested')
 * - Called directly after an audit pipeline completes
 *
 * Architecture:
 * - Imports contracts from @pare-engine/core/contracts
 * - Uses scoreDelta from @pare-engine/core/tools/score-delta (dynamic import)
 * - Writes to auditResults and monitoringResults via Drizzle ORM
 * - Follows graceful degradation: if previous audit lookup fails,
 *   treats as first audit with no comparison
 */

import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { desc, eq } from 'drizzle-orm';
import { auditResults, monitoringResults } from '@pare-engine/core';
import type { CompositeScore, AuditRequest } from '@pare-engine/core/contracts';

// ---------------------------------------------------------------------------
// Re-exported types from score-delta (for consumers of this module)
// These mirror the types in packages/core/src/tools/score-delta.ts.
// We define them here so TypeScript consumers don't need a dynamic import.
// ---------------------------------------------------------------------------

/** Delta for a single pillar score. */
export interface PillarDelta {
  pillar: string;
  before: number;
  after: number;
  delta: number;
  maxScore: number;
  percentageChange: number;
  direction: 'improved' | 'declined' | 'unchanged';
}

/** Result when no previous audit exists (first audit). */
export interface FirstAuditDelta {
  isFirstAudit: true;
  currentScore: number;
  currentGrade: string;
  pillarDeltas: null;
  overallDelta: null;
  gradeChange: null;
  calculatedAt: Date;
}

/** Full delta result comparing two audits. */
export interface ScoreDeltaResult {
  isFirstAudit: false;
  pillarDeltas: PillarDelta[];
  overallDelta: {
    before: number;
    after: number;
    delta: number;
    percentageChange: number;
    direction: 'improved' | 'declined' | 'unchanged';
  };
  gradeChange: {
    before: string;
    after: string;
    changed: boolean;
    improved: boolean;
  };
  biggestImprovement: PillarDelta | null;
  biggestDecline: PillarDelta | null;
  pillarsImproved: number;
  pillarsDeclined: number;
  pillarsUnchanged: number;
  calculatedAt: Date;
}

// ---------------------------------------------------------------------------
// Error Class
// ---------------------------------------------------------------------------

export class VerifyError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'VerifyError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Input for the verify step. */
export interface VerifyStepInput {
  /** The client being re-audited. */
  clientId: string;
  /** The new audit's composite score (from the just-completed re-audit). */
  currentScore: CompositeScore;
  /** The audit request that triggered this verify. */
  auditRequest: AuditRequest;
  /** ID of the new audit result row (from the deliver step). */
  newAuditResultId: string;
}

/** Output of the verify step. */
export interface VerifyStepOutput {
  /** The computed delta result. */
  delta: ScoreDeltaResult | FirstAuditDelta;
  /** ID of the previous audit used for comparison (null if first audit). */
  previousAuditId: string | null;
  /** ID of the current audit. */
  currentAuditId: string;
  /** Whether score history was written to the monitoring table. */
  historyRecorded: boolean;
  /** When the verify step completed. */
  verifiedAt: Date;
}

// ---------------------------------------------------------------------------
// Dynamic Import: Score Delta Tool
// ---------------------------------------------------------------------------

/**
 * Loads the scoreDelta tool at runtime via dynamic import.
 *
 * NOTE: @pare-engine/core does not yet export a ./tools/* subpath.
 * We use a dynamic import with a constructed path (same pattern as
 * report.ts uses for generate-pdf) to bypass TypeScript's compile-time
 * package.json exports check. At runtime, pnpm's workspace link resolves
 * this to the built dist/ file.
 *
 * When core adds a ./tools subpath export, replace with a static import.
 */
interface ScoreDeltaModule {
  scoreDelta: (
    before: CompositeScore | null,
    after: CompositeScore,
  ) => ScoreDeltaResult | FirstAuditDelta;
  formatDelta: (delta: number) => string;
  deltaArrowHtml: (direction: 'improved' | 'declined' | 'unchanged') => string;
  deltaColorHex: (direction: 'improved' | 'declined' | 'unchanged') => string;
}

async function loadScoreDeltaModule(): Promise<ScoreDeltaModule> {
  const modulePath = ['@pare-engine', 'core', 'dist', 'tools', 'score-delta.js'].join('/');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any = await import(modulePath);
  return mod as ScoreDeltaModule;
}

// ---------------------------------------------------------------------------
// Previous Audit Retrieval
// ---------------------------------------------------------------------------

interface PreviousAuditSnapshot {
  id: string;
  overallScore: number;
  letterGrade: string;
  aiVisibilityScore: number | null;
  contentScore: number | null;
  schemaScore: number | null;
  technicalScore: number | null;
  gbpScore: number | null;
  detailedResults: unknown;
  auditDate: Date;
}

/**
 * Fetches the most recent completed audit for a client, excluding
 * the current audit being verified.
 *
 * @param clientId - UUID of the client
 * @param excludeAuditId - UUID of the current audit to exclude
 * @param databaseUrl - PostgreSQL connection URL
 * @returns Previous audit snapshot or null if none found
 */
async function fetchPreviousAudit(
  clientId: string,
  excludeAuditId: string,
  databaseUrl: string,
): Promise<PreviousAuditSnapshot | null> {
  const pool = new pg.Pool({ connectionString: databaseUrl });

  try {
    const db = drizzle(pool);

    const results = await db
      .select()
      .from(auditResults)
      .where(eq(auditResults.clientId, clientId))
      .orderBy(desc(auditResults.auditDate))
      .limit(2);

    // Filter out the current audit and return the most recent previous one
    const previous = results.find((r) => r.id !== excludeAuditId);

    if (!previous) {
      return null;
    }

    return {
      id: previous.id,
      overallScore: previous.overallScore,
      letterGrade: previous.letterGrade,
      aiVisibilityScore: previous.aiVisibilityScore,
      contentScore: previous.contentScore,
      schemaScore: previous.schemaScore,
      technicalScore: previous.technicalScore,
      gbpScore: previous.gbpScore,
      detailedResults: previous.detailedResults,
      auditDate: previous.auditDate,
    };
  } finally {
    await pool.end();
  }
}

// ---------------------------------------------------------------------------
// Reconstruct CompositeScore from DB Row
// ---------------------------------------------------------------------------

/**
 * Reconstructs a CompositeScore from the stored audit result row.
 *
 * The auditResults table stores individual pillar scores as integers
 * and the full pillar details in detailedResults JSONB. We reconstruct
 * the CompositeScore from the JSONB if available, or create a minimal
 * version from the integer columns as a fallback.
 */
function reconstructCompositeScore(snapshot: PreviousAuditSnapshot): CompositeScore {
  // Try to reconstruct from detailedResults JSONB (full pillar data)
  const detailed = snapshot.detailedResults as {
    pillars?: CompositeScore['pillars'];
  } | null;

  if (detailed?.pillars) {
    return {
      overallScore: snapshot.overallScore,
      letterGrade: snapshot.letterGrade as CompositeScore['letterGrade'],
      pillars: detailed.pillars,
      scoredAt: snapshot.auditDate,
    };
  }

  // Fallback: reconstruct minimal pillar data from integer columns.
  // This produces a CompositeScore with basic breakdown data but
  // no detailed sub-scores. The delta calculation only uses .score
  // from each pillar, so this is sufficient.
  const aiVisScore = snapshot.aiVisibilityScore ?? 0;
  const contentScoreVal = snapshot.contentScore ?? 0;
  const schemaScoreVal = snapshot.schemaScore ?? 0;
  const techScore = snapshot.technicalScore ?? 0;
  const gbpScoreVal = snapshot.gbpScore ?? 0;

  return {
    overallScore: snapshot.overallScore,
    letterGrade: snapshot.letterGrade as CompositeScore['letterGrade'],
    pillars: {
      aiVisibility: {
        score: aiVisScore,
        maxScore: 30,
        breakdown: {},
        notes: [],
        mentionRate: 0,
        citationRate: 0,
        avgPosition: null,
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
        platformCoverage: {},
        providersUsed: 1,
        providersAvailable: 3,
      },
      contentQuality: {
        score: contentScoreVal,
        maxScore: 30,
        breakdown: {},
        notes: [],
        avgAnswerFirstScore: 0,
        faqCoverage: 0,
        statsDensity: 0,
        authorAttributionRate: 0,
      },
      schemaStructuredData: {
        score: schemaScoreVal,
        maxScore: 15,
        breakdown: {},
        notes: [],
        requiredTypesPresent: 0,
        requiredTypesTotal: 0,
        recommendedTypesPresent: 0,
        validationErrorCount: 0,
      },
      technicalReadiness: {
        score: techScore,
        maxScore: 10,
        breakdown: {},
        notes: [],
        aiCrawlerAccess: false,
        llmsTxtPresent: false,
        sitemapPresent: false,
        httpsEnabled: false,
        mobileFriendly: false,
      },
      localGbp: {
        score: gbpScoreVal,
        maxScore: 15,
        breakdown: {},
        notes: [],
        gbpComplete: false,
        reviewScore: 0,
        napConsistent: false,
      },
    },
    scoredAt: snapshot.auditDate,
  };
}

// ---------------------------------------------------------------------------
// Score History Writer
// ---------------------------------------------------------------------------

/**
 * Writes a score history entry to the monitoringResults table.
 *
 * We repurpose the monitoringResults table for score tracking by using:
 * - platform: 'score-history'
 * - queryText: a descriptive summary of the score event
 * - competitorMentions JSONB: stores the full delta data
 * - fullResponse: stores the serialized score data
 *
 * This enables time-series querying of score trends per client.
 */
async function writeScoreHistory(
  clientId: string,
  currentScore: CompositeScore,
  deltaResult: ScoreDeltaResult | FirstAuditDelta,
  formatDeltaFn: (delta: number) => string,
  databaseUrl: string,
): Promise<boolean> {
  const pool = new pg.Pool({ connectionString: databaseUrl });

  try {
    const db = drizzle(pool);

    const isFirst = deltaResult.isFirstAudit;

    const queryText = isFirst
      ? `Initial audit: score ${currentScore.overallScore}/100 (${currentScore.letterGrade})`
      : `Verify audit: score ${currentScore.overallScore}/100 (${currentScore.letterGrade}), delta ${formatDeltaFn((deltaResult as ScoreDeltaResult).overallDelta.delta)}`;

    await db.insert(monitoringResults).values({
      clientId,
      executionDate: new Date(),
      platform: 'score-history',
      queryText,
      queryCategory: 'verify-loop',
      brandMentioned: true,
      brandPosition: currentScore.overallScore,
      brandSentiment: currentScore.letterGrade,
      competitorMentions: {
        deltaType: isFirst ? 'first-audit' : 'comparison',
        overallScore: currentScore.overallScore,
        letterGrade: currentScore.letterGrade,
        pillarScores: {
          aiVisibility: Math.round(currentScore.pillars.aiVisibility.score),
          contentQuality: Math.round(currentScore.pillars.contentQuality.score),
          schemaStructuredData: Math.round(currentScore.pillars.schemaStructuredData.score),
          technicalReadiness: Math.round(currentScore.pillars.technicalReadiness.score),
          localGbp: Math.round(currentScore.pillars.localGbp.score),
        },
        delta: isFirst ? null : {
          overall: (deltaResult as ScoreDeltaResult).overallDelta,
          pillars: (deltaResult as ScoreDeltaResult).pillarDeltas,
          gradeChange: (deltaResult as ScoreDeltaResult).gradeChange,
        },
      },
      fullResponse: JSON.stringify({
        score: {
          overall: currentScore.overallScore,
          grade: currentScore.letterGrade,
          pillars: {
            aiVisibility: Math.round(currentScore.pillars.aiVisibility.score),
            contentQuality: Math.round(currentScore.pillars.contentQuality.score),
            schemaStructuredData: Math.round(currentScore.pillars.schemaStructuredData.score),
            technicalReadiness: Math.round(currentScore.pillars.technicalReadiness.score),
            localGbp: Math.round(currentScore.pillars.localGbp.score),
          },
        },
        scoredAt: currentScore.scoredAt.toISOString(),
      }),
    });

    return true;
  } catch (err) {
    // Log but don't throw — history write is not critical
    console.error(
      '[S20] Failed to write score history:',
      err instanceof Error ? err.message : String(err),
    );
    return false;
  } finally {
    await pool.end();
  }
}

// ---------------------------------------------------------------------------
// Score Trend Query
// ---------------------------------------------------------------------------

/** A single point in the score trend time series. */
export interface ScoreTrendPoint {
  date: Date;
  overallScore: number;
  letterGrade: string;
  pillarScores: {
    aiVisibility: number;
    contentQuality: number;
    schemaStructuredData: number;
    technicalReadiness: number;
    localGbp: number;
  };
}

/**
 * Queries the score trend for a client over time.
 *
 * Returns all score-history entries from monitoringResults, ordered
 * chronologically. Each entry contains the overall score, grade,
 * and per-pillar breakdown at that point in time.
 *
 * @param clientId - UUID of the client
 * @param databaseUrl - PostgreSQL connection URL
 * @returns Array of score trend points, oldest first
 */
export async function getScoreTrend(
  clientId: string,
  databaseUrl: string,
): Promise<ScoreTrendPoint[]> {
  const pool = new pg.Pool({ connectionString: databaseUrl });

  try {
    const db = drizzle(pool);

    const results = await db
      .select()
      .from(monitoringResults)
      .where(eq(monitoringResults.clientId, clientId))
      .orderBy(monitoringResults.executionDate);

    // Filter to score-history entries and extract trend data
    return results
      .filter((r) => r.platform === 'score-history')
      .map((r) => {
        const meta = r.competitorMentions as {
          overallScore?: number;
          letterGrade?: string;
          pillarScores?: {
            aiVisibility: number;
            contentQuality: number;
            schemaStructuredData: number;
            technicalReadiness: number;
            localGbp: number;
          };
        } | null;

        return {
          date: r.executionDate,
          overallScore: meta?.overallScore ?? (r.brandPosition ?? 0),
          letterGrade: meta?.letterGrade ?? (r.brandSentiment ?? 'F'),
          pillarScores: meta?.pillarScores ?? {
            aiVisibility: 0,
            contentQuality: 0,
            schemaStructuredData: 0,
            technicalReadiness: 0,
            localGbp: 0,
          },
        };
      });
  } finally {
    await pool.end();
  }
}

// ---------------------------------------------------------------------------
// Public API: Execute Verify Step
// ---------------------------------------------------------------------------

/**
 * Executes the verify step of the audit-fix-verify cycle.
 *
 * Flow:
 * 1. Load the scoreDelta module dynamically from @pare-engine/core
 * 2. Fetch the most recent previous audit for this client
 * 3. Reconstruct a CompositeScore from the previous audit data
 * 4. Calculate per-pillar and overall deltas using scoreDelta()
 * 5. Write score history to monitoringResults for trend tracking
 * 6. Return the delta result and metadata
 *
 * Graceful degradation:
 * - If no previous audit exists, returns a FirstAuditDelta
 * - If DB lookup fails, treats as first audit (logs warning)
 * - If score history write fails, logs error but returns successfully
 *
 * @param input - Verify step input with client ID and current score
 * @param databaseUrl - PostgreSQL connection URL
 * @returns VerifyStepOutput with delta, history status, and metadata
 * @throws VerifyError only if a critical unrecoverable error occurs
 */
export async function executeVerifyStep(
  input: VerifyStepInput,
  databaseUrl: string,
): Promise<VerifyStepOutput> {
  const { clientId, currentScore, newAuditResultId } = input;

  try {
    // Step 1: Load score-delta module
    const scoreDeltaModule = await loadScoreDeltaModule();

    // Step 2: Fetch previous audit (graceful degradation)
    let previousAudit: PreviousAuditSnapshot | null = null;
    try {
      previousAudit = await fetchPreviousAudit(clientId, newAuditResultId, databaseUrl);
    } catch (err) {
      console.warn(
        '[S20] Could not fetch previous audit, treating as first audit:',
        err instanceof Error ? err.message : String(err),
      );
    }

    // Step 3: Reconstruct previous CompositeScore (or null for first audit)
    const previousScore = previousAudit
      ? reconstructCompositeScore(previousAudit)
      : null;

    // Step 4: Calculate delta
    const deltaResult = scoreDeltaModule.scoreDelta(previousScore, currentScore);

    // Step 5: Write score history
    const historyRecorded = await writeScoreHistory(
      clientId,
      currentScore,
      deltaResult,
      scoreDeltaModule.formatDelta,
      databaseUrl,
    );

    // Step 6: Return result
    return {
      delta: deltaResult,
      previousAuditId: previousAudit?.id ?? null,
      currentAuditId: newAuditResultId,
      historyRecorded,
      verifiedAt: new Date(),
    };
  } catch (err) {
    if (err instanceof VerifyError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : String(err);
    throw new VerifyError(
      `Verify step failed: ${message}`,
      'VERIFY_STEP_FAILED',
    );
  }
}
