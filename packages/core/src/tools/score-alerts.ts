// Owner: S25 (Score Delta Alerts). Consumers: S24 (weekly monitoring), S12 (pipeline).
// Detects significant score changes between monitoring runs and emails the operator.
// Alert thresholds: overall >=5 points, any pillar >=3 points.
// Uses Resend for email delivery (pattern from S13 send-report.ts).

import { Resend } from 'resend';
import { render } from '@react-email/components';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, desc } from 'drizzle-orm';
import { auditResults, clients } from '../database/schema.js';
import {
  SCORING_WEIGHTS,
  scoreToGrade,
} from '../contracts/scoring.contract.js';
import { ScoreAlertEmail } from '../email-templates/score-alert.js';
import type { PillarDelta } from '../email-templates/score-alert.js';

// --- Constants ---

/** Minimum overall score change (absolute) to trigger an alert. */
export const OVERALL_DELTA_THRESHOLD = 5;

/** Minimum per-pillar score change (absolute) to trigger an alert. */
export const PILLAR_DELTA_THRESHOLD = 3;

/** Sender address for operator alerts. */
const FROM_ADDRESS = 'Pare Consulting <alerts@pareconsulting.com>';

/** Reply-to address. */
const REPLY_TO_ADDRESS = 'hello@pareconsulting.com';

// --- Custom Error ---

export class ScoreAlertError extends Error {
  public readonly code: string;

  constructor(message: string, code: string, cause?: unknown) {
    super(message);
    this.name = 'ScoreAlertError';
    this.code = code;
    if (cause) {
      this.cause = cause;
    }
  }
}

// --- Types ---

/** Pillar keys as stored in the audit_results table columns. */
interface AuditScoreSnapshot {
  overallScore: number;
  letterGrade: string;
  aiVisibilityScore: number | null;
  contentScore: number | null;
  schemaScore: number | null;
  technicalScore: number | null;
  gbpScore: number | null;
  auditDate: Date;
}

/** Pillar name mapping for human-readable output. */
const PILLAR_NAMES: Record<string, string> = {
  aiVisibility: 'AI Visibility',
  contentQuality: 'Content Quality',
  schemaStructuredData: 'Schema & Structured Data',
  technicalReadiness: 'Technical Readiness',
  localGbp: 'Local/GBP & Third-Party',
};

/** Pillar config: DB column key -> display name + max score. */
const PILLAR_CONFIG: Array<{
  dbKey: keyof Pick<AuditScoreSnapshot, 'aiVisibilityScore' | 'contentScore' | 'schemaScore' | 'technicalScore' | 'gbpScore'>;
  name: string;
  maxScore: number;
}> = [
  { dbKey: 'aiVisibilityScore', name: PILLAR_NAMES.aiVisibility, maxScore: SCORING_WEIGHTS.aiVisibility },
  { dbKey: 'contentScore', name: PILLAR_NAMES.contentQuality, maxScore: SCORING_WEIGHTS.contentQuality },
  { dbKey: 'schemaScore', name: PILLAR_NAMES.schemaStructuredData, maxScore: SCORING_WEIGHTS.schemaStructuredData },
  { dbKey: 'technicalScore', name: PILLAR_NAMES.technicalReadiness, maxScore: SCORING_WEIGHTS.technicalReadiness },
  { dbKey: 'gbpScore', name: PILLAR_NAMES.localGbp, maxScore: SCORING_WEIGHTS.localGbp },
];

/** Result of the delta detection function. */
export interface ScoreDeltaResult {
  /** Whether an alert was triggered and sent. */
  alertSent: boolean;
  /** Resend email ID if alert was sent. */
  emailId: string | null;
  /** The overall score delta (new - old). Null if no previous result. */
  overallDelta: number | null;
  /** Pillar-level deltas that exceeded the threshold. */
  changedPillars: PillarDelta[];
  /** Reason no alert was sent, if applicable. */
  skipReason: string | null;
}

/** Input configuration for detectScoreDeltas. */
export interface DetectScoreDeltasInput {
  clientId: string;
  databaseUrl: string;
  resendApiKey: string;
  operatorEmail: string;
}

// --- Causal Attribution ---

/**
 * Infers possible causes for score changes based on which pillars changed and direction.
 * This is a heuristic-based attribution; more sophisticated causal analysis could
 * correlate with deliverables, crawl diffs, or monitoring event logs.
 */
export function attributeCauses(changedPillars: PillarDelta[]): string[] {
  const causes: string[] = [];

  for (const pillar of changedPillars) {
    const improved = pillar.delta > 0;
    const pillarKey = pillar.pillarName;

    if (pillarKey === PILLAR_NAMES.aiVisibility) {
      if (improved) {
        causes.push('AI engines may be citing this business more frequently — check for new content indexed or recent media coverage.');
      } else {
        causes.push('AI visibility dropped — competitors may have improved, or content may have been de-indexed. Check recent crawl data.');
      }
    }

    if (pillarKey === PILLAR_NAMES.contentQuality) {
      if (improved) {
        causes.push('Content quality improved — likely due to new FAQ pages, answer-first formatting, or added author attribution.');
      } else {
        causes.push('Content quality declined — check if key pages were removed, restructured, or if CMS changes affected formatting.');
      }
    }

    if (pillarKey === PILLAR_NAMES.schemaStructuredData) {
      if (improved) {
        causes.push('Schema markup was added or corrected — verify new JSON-LD types are present on the site.');
      } else {
        causes.push('Schema markup issues detected — a CMS update or theme change may have removed or broken JSON-LD.');
      }
    }

    if (pillarKey === PILLAR_NAMES.technicalReadiness) {
      if (improved) {
        causes.push('Technical readiness improved — possible additions include llms.txt, updated robots.txt, or performance improvements.');
      } else {
        causes.push('Technical readiness dropped — check robots.txt for newly blocked AI crawlers, SSL issues, or site speed regression.');
      }
    }

    if (pillarKey === PILLAR_NAMES.localGbp) {
      if (improved) {
        causes.push('Local signals strengthened — new reviews, updated GBP profile, or improved NAP consistency across directories.');
      } else {
        causes.push('Local/GBP scores dropped — check for new negative reviews, GBP listing changes, or NAP inconsistencies.');
      }
    }
  }

  // Cap at 5 causes max
  return causes.slice(0, 5);
}

// --- Core Logic ---

/**
 * Fetches the two most recent audit results for a client and computes deltas.
 * Returns the snapshots and computed differences.
 */
async function fetchAndComputeDeltas(
  clientId: string,
  databaseUrl: string,
): Promise<{
  current: AuditScoreSnapshot;
  previous: AuditScoreSnapshot | null;
  overallDelta: number | null;
  changedPillars: PillarDelta[];
  businessName: string;
  domain: string;
}> {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  try {
    // Fetch client info
    const clientRows = await db
      .select({
        businessName: clients.businessName,
        domain: clients.domain,
      })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    if (clientRows.length === 0) {
      throw new ScoreAlertError(
        `Client not found: ${clientId}`,
        'CLIENT_NOT_FOUND',
      );
    }

    const client = clientRows[0];

    // Fetch the two most recent audit results for this client
    const recentResults = await db
      .select({
        overallScore: auditResults.overallScore,
        letterGrade: auditResults.letterGrade,
        aiVisibilityScore: auditResults.aiVisibilityScore,
        contentScore: auditResults.contentScore,
        schemaScore: auditResults.schemaScore,
        technicalScore: auditResults.technicalScore,
        gbpScore: auditResults.gbpScore,
        auditDate: auditResults.auditDate,
      })
      .from(auditResults)
      .where(eq(auditResults.clientId, clientId))
      .orderBy(desc(auditResults.auditDate))
      .limit(2);

    if (recentResults.length === 0) {
      throw new ScoreAlertError(
        `No audit results found for client: ${clientId}`,
        'NO_AUDIT_RESULTS',
      );
    }

    const current = recentResults[0];

    // If only one result exists, this is the first monitoring run
    if (recentResults.length < 2) {
      return {
        current,
        previous: null,
        overallDelta: null,
        changedPillars: [],
        businessName: client.businessName,
        domain: client.domain,
      };
    }

    const previous = recentResults[1];

    // Compute overall delta
    const overallDelta = current.overallScore - previous.overallScore;

    // Compute per-pillar deltas
    const changedPillars: PillarDelta[] = [];

    for (const config of PILLAR_CONFIG) {
      const oldVal = previous[config.dbKey];
      const newVal = current[config.dbKey];

      // Skip pillars where either value is null (data not available)
      if (oldVal === null || newVal === null) {
        continue;
      }

      const delta = newVal - oldVal;

      if (Math.abs(delta) >= PILLAR_DELTA_THRESHOLD) {
        changedPillars.push({
          pillarName: config.name,
          oldScore: oldVal,
          newScore: newVal,
          maxScore: config.maxScore,
          delta,
        });
      }
    }

    return {
      current,
      previous,
      overallDelta,
      changedPillars,
      businessName: client.businessName,
      domain: client.domain,
    };
  } finally {
    await pool.end();
  }
}

/**
 * Determines whether a score change meets the alerting threshold.
 */
export function shouldAlert(
  overallDelta: number | null,
  changedPillars: PillarDelta[],
): boolean {
  // No previous result — first run, no alert
  if (overallDelta === null) {
    return false;
  }

  // Overall score changed by threshold or more
  if (Math.abs(overallDelta) >= OVERALL_DELTA_THRESHOLD) {
    return true;
  }

  // Any pillar changed by threshold or more (already filtered in fetchAndComputeDeltas)
  if (changedPillars.length > 0) {
    return true;
  }

  return false;
}

// --- Main Exported Function ---

/**
 * Compares the latest monitoring/audit result to the previous one for a client.
 * If a significant score change is detected, sends an alert email to the operator.
 *
 * Thresholds:
 * - Overall score: >= 5 points change
 * - Any pillar: >= 3 points change
 *
 * Handles edge cases:
 * - First monitoring run (no previous data): returns gracefully, no alert
 * - No significant change: returns gracefully, no alert
 * - Missing pillar data (null): skips that pillar comparison
 *
 * @param input - Client ID, database URL, Resend API key, and operator email
 * @returns ScoreDeltaResult indicating whether an alert was sent
 */
export async function detectScoreDeltas(
  input: DetectScoreDeltasInput,
): Promise<ScoreDeltaResult> {
  const { clientId, databaseUrl, resendApiKey, operatorEmail } = input;

  if (!resendApiKey) {
    throw new ScoreAlertError(
      'Resend API key is required to send alert emails',
      'MISSING_API_KEY',
    );
  }

  // Fetch data and compute deltas
  const {
    current,
    previous,
    overallDelta,
    changedPillars,
    businessName,
    domain,
  } = await fetchAndComputeDeltas(clientId, databaseUrl);

  // Handle first-run case: no previous data
  if (previous === null) {
    return {
      alertSent: false,
      emailId: null,
      overallDelta: null,
      changedPillars: [],
      skipReason: 'First monitoring run — no previous result to compare against.',
    };
  }

  // Check if alert thresholds are met
  if (!shouldAlert(overallDelta, changedPillars)) {
    return {
      alertSent: false,
      emailId: null,
      overallDelta,
      changedPillars,
      skipReason: `Score change below threshold: overall delta ${overallDelta}, ${changedPillars.length} pillar(s) changed.`,
    };
  }

  // Generate causal attribution
  const possibleCauses = attributeCauses(changedPillars);

  // Format the monitoring date
  const monitoringDate = current.auditDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Determine letter grades
  const oldLetterGrade = previous.letterGrade || scoreToGrade(previous.overallScore);
  const newLetterGrade = current.letterGrade || scoreToGrade(current.overallScore);

  // Render the React Email template
  const emailHtml = await render(
    ScoreAlertEmail({
      businessName,
      domain,
      oldOverallScore: previous.overallScore,
      newOverallScore: current.overallScore,
      overallDelta: overallDelta!,
      oldLetterGrade,
      newLetterGrade,
      changedPillars,
      possibleCauses,
      monitoringDate,
    }),
  );

  // Send the alert email via Resend
  const resend = new Resend(resendApiKey);

  const direction = overallDelta! > 0 ? 'improved' : 'declined';
  const subject = `Score Alert: ${businessName} ${direction} by ${Math.abs(overallDelta!)} points (${previous.overallScore} -> ${current.overallScore})`;

  try {
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [operatorEmail],
      replyTo: REPLY_TO_ADDRESS,
      subject,
      html: emailHtml,
    });

    if (result.error) {
      throw new ScoreAlertError(
        `Resend API error: ${result.error.message}`,
        'RESEND_API_ERROR',
        result.error,
      );
    }

    if (!result.data?.id) {
      throw new ScoreAlertError(
        'Resend returned success but no email ID',
        'MISSING_EMAIL_ID',
      );
    }

    return {
      alertSent: true,
      emailId: result.data.id,
      overallDelta,
      changedPillars,
      skipReason: null,
    };
  } catch (error: unknown) {
    if (error instanceof ScoreAlertError) {
      throw error;
    }

    throw new ScoreAlertError(
      `Failed to send score alert email: ${error instanceof Error ? error.message : String(error)}`,
      'SEND_FAILED',
      error,
    );
  }
}
