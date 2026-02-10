/**
 * Score Delta Tool
 * Owner: S20 (Verify Loop + Score History)
 *
 * Calculates per-pillar and overall score deltas between two audit snapshots.
 * Typed input -> typed output. Designed as a typed tool function
 * that can be wrapped as an MCP tool or Inngest step.
 *
 * Usage:
 *   import { scoreDelta } from '@pare-engine/core/tools/score-delta';
 *   const delta = scoreDelta(beforeScore, afterScore);
 *
 * Handles:
 *   - First audit (no "before"): pass null for `before`, returns all deltas as null
 *   - Identical scores: deltas are 0
 *   - Grade changes: tracked via `gradeChange`
 */

import type { CompositeScore } from '../contracts/scoring.contract.js';
import { SCORING_WEIGHTS, scoreToGrade } from '../contracts/scoring.contract.js';

// ---------------------------------------------------------------------------
// Error Class
// ---------------------------------------------------------------------------

export class ScoreDeltaError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'ScoreDeltaError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Delta for a single pillar score. */
export interface PillarDelta {
  /** Name of the pillar. */
  pillar: string;
  /** Score from the previous audit. */
  before: number;
  /** Score from the current audit. */
  after: number;
  /** Absolute change (after - before). Positive = improvement. */
  delta: number;
  /** Maximum possible score for this pillar. */
  maxScore: number;
  /** Percentage change relative to max score: delta / maxScore * 100. */
  percentageChange: number;
  /** Direction of change: 'improved' | 'declined' | 'unchanged'. */
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
  /** Per-pillar deltas in canonical order. */
  pillarDeltas: PillarDelta[];
  /** Overall score delta. */
  overallDelta: {
    before: number;
    after: number;
    delta: number;
    percentageChange: number;
    direction: 'improved' | 'declined' | 'unchanged';
  };
  /** Grade change details. */
  gradeChange: {
    before: string;
    after: string;
    changed: boolean;
    improved: boolean;
  };
  /** Pillar with the biggest improvement (or null if all declined/unchanged). */
  biggestImprovement: PillarDelta | null;
  /** Pillar with the biggest decline (or null if all improved/unchanged). */
  biggestDecline: PillarDelta | null;
  /** Total number of pillars that improved. */
  pillarsImproved: number;
  /** Total number of pillars that declined. */
  pillarsDeclined: number;
  /** Total number of pillars unchanged. */
  pillarsUnchanged: number;
  /** When this delta was calculated. */
  calculatedAt: Date;
}

// ---------------------------------------------------------------------------
// Grade Ordering (for comparing grade improvements)
// ---------------------------------------------------------------------------

const GRADE_ORDER: Record<string, number> = {
  F: 0,
  D: 1,
  C: 2,
  B: 3,
  A: 4,
};

// ---------------------------------------------------------------------------
// Direction Helper
// ---------------------------------------------------------------------------

function getDirection(delta: number): 'improved' | 'declined' | 'unchanged' {
  if (delta > 0) return 'improved';
  if (delta < 0) return 'declined';
  return 'unchanged';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculates the score delta between two audit snapshots.
 *
 * @param before - Previous audit score (null for first audit)
 * @param after - Current audit score (required)
 * @returns ScoreDeltaResult or FirstAuditDelta if no previous audit
 * @throws ScoreDeltaError if `after` is not provided
 */
export function scoreDelta(
  before: CompositeScore | null,
  after: CompositeScore,
): ScoreDeltaResult | FirstAuditDelta {
  if (!after) {
    throw new ScoreDeltaError(
      'Current audit score (after) is required',
      'MISSING_AFTER_SCORE',
    );
  }

  // First audit — no "before" to compare
  if (before === null) {
    return {
      isFirstAudit: true,
      currentScore: after.overallScore,
      currentGrade: after.letterGrade,
      pillarDeltas: null,
      overallDelta: null,
      gradeChange: null,
      calculatedAt: new Date(),
    };
  }

  // Calculate per-pillar deltas
  const pillarEntries: Array<{
    key: keyof typeof SCORING_WEIGHTS;
    name: string;
  }> = [
    { key: 'aiVisibility', name: 'AI Visibility' },
    { key: 'contentQuality', name: 'Content Quality' },
    { key: 'schemaStructuredData', name: 'Schema / Structured Data' },
    { key: 'technicalReadiness', name: 'Technical Readiness' },
    { key: 'localGbp', name: 'Local / GBP' },
  ];

  const pillarDeltas: PillarDelta[] = pillarEntries.map(({ key, name }) => {
    const beforeScore = Math.round(before.pillars[key].score);
    const afterScore = Math.round(after.pillars[key].score);
    const delta = afterScore - beforeScore;
    const maxScore = SCORING_WEIGHTS[key];
    const percentageChange = maxScore > 0
      ? Math.round((delta / maxScore) * 100)
      : 0;

    return {
      pillar: name,
      before: beforeScore,
      after: afterScore,
      delta,
      maxScore,
      percentageChange,
      direction: getDirection(delta),
    };
  });

  // Overall delta
  const overallBefore = before.overallScore;
  const overallAfter = after.overallScore;
  const overallDeltaValue = overallAfter - overallBefore;

  const overallDelta = {
    before: overallBefore,
    after: overallAfter,
    delta: overallDeltaValue,
    percentageChange: Math.round(overallDeltaValue), // already out of 100
    direction: getDirection(overallDeltaValue),
  };

  // Grade change
  const gradeBefore = before.letterGrade;
  const gradeAfter = after.letterGrade;
  const gradeChange = {
    before: gradeBefore,
    after: gradeAfter,
    changed: gradeBefore !== gradeAfter,
    improved: (GRADE_ORDER[gradeAfter] ?? 0) > (GRADE_ORDER[gradeBefore] ?? 0),
  };

  // Find biggest improvement and decline
  const improvements = pillarDeltas.filter((p) => p.direction === 'improved');
  const declines = pillarDeltas.filter((p) => p.direction === 'declined');

  const biggestImprovement = improvements.length > 0
    ? improvements.reduce((best, curr) => curr.delta > best.delta ? curr : best)
    : null;

  const biggestDecline = declines.length > 0
    ? declines.reduce((worst, curr) => curr.delta < worst.delta ? curr : worst)
    : null;

  return {
    isFirstAudit: false,
    pillarDeltas,
    overallDelta,
    gradeChange,
    biggestImprovement,
    biggestDecline,
    pillarsImproved: improvements.length,
    pillarsDeclined: declines.length,
    pillarsUnchanged: pillarDeltas.filter((p) => p.direction === 'unchanged').length,
    calculatedAt: new Date(),
  };
}

/**
 * Formats a delta value as a display string with direction indicator.
 *
 * Examples:
 *   formatDelta(5)  => "+5"
 *   formatDelta(-3) => "-3"
 *   formatDelta(0)  => "0"
 *
 * @param delta - The numeric delta value
 * @returns Formatted string with sign prefix
 */
export function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `${delta}`;
  return '0';
}

/**
 * Returns an HTML arrow indicator based on delta direction.
 *
 * @param direction - Direction of the score change
 * @returns HTML string for an up/down/neutral arrow
 */
export function deltaArrowHtml(direction: 'improved' | 'declined' | 'unchanged'): string {
  switch (direction) {
    case 'improved':
      return '<span style="color: #22C55E; font-size: 14px;">&#9650;</span>';
    case 'declined':
      return '<span style="color: #EF4444; font-size: 14px;">&#9660;</span>';
    case 'unchanged':
      return '<span style="color: #94A3B8; font-size: 14px;">&#9644;</span>';
  }
}

/**
 * Returns the CSS color class/hex for a delta direction.
 *
 * @param direction - Direction of the score change
 * @returns Hex color string
 */
export function deltaColorHex(direction: 'improved' | 'declined' | 'unchanged'): string {
  switch (direction) {
    case 'improved':
      return '#22C55E';
    case 'declined':
      return '#EF4444';
    case 'unchanged':
      return '#94A3B8';
  }
}
