// Owner: S20 (Verify Loop + Score History). Consumers: S10, S12, S24.
// This contract formalizes the delta/verification types as Zod schemas.
// The underlying computation lives in packages/core/src/tools/score-delta.ts;
// this file provides the validation layer for serialization boundaries
// (DB writes, API responses, report template injection).

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Direction Enum
// ---------------------------------------------------------------------------

export const DeltaDirectionSchema = z.enum(['improved', 'declined', 'unchanged']);
export type DeltaDirection = z.infer<typeof DeltaDirectionSchema>;

// ---------------------------------------------------------------------------
// Pillar Delta
// ---------------------------------------------------------------------------

export const PillarDeltaSchema = z.object({
  /** Name of the pillar (human-readable). */
  pillar: z.string(),
  /** Score from the previous audit. */
  before: z.number().int().min(0),
  /** Score from the current audit. */
  after: z.number().int().min(0),
  /** Absolute change (after - before). Positive = improvement. */
  delta: z.number().int(),
  /** Maximum possible score for this pillar. */
  maxScore: z.number().int().positive(),
  /** Percentage change relative to max score: delta / maxScore * 100. */
  percentageChange: z.number().int(),
  /** Direction of change. */
  direction: DeltaDirectionSchema,
});

export type PillarDelta = z.infer<typeof PillarDeltaSchema>;

// ---------------------------------------------------------------------------
// Overall Delta
// ---------------------------------------------------------------------------

export const OverallDeltaSchema = z.object({
  before: z.number().int().min(0).max(100),
  after: z.number().int().min(0).max(100),
  delta: z.number().int(),
  percentageChange: z.number().int(),
  direction: DeltaDirectionSchema,
});

export type OverallDelta = z.infer<typeof OverallDeltaSchema>;

// ---------------------------------------------------------------------------
// Grade Change
// ---------------------------------------------------------------------------

export const GradeChangeSchema = z.object({
  before: z.string(),
  after: z.string(),
  changed: z.boolean(),
  improved: z.boolean(),
});

export type GradeChange = z.infer<typeof GradeChangeSchema>;

// ---------------------------------------------------------------------------
// First Audit Delta (no previous audit to compare against)
// ---------------------------------------------------------------------------

export const FirstAuditDeltaSchema = z.object({
  isFirstAudit: z.literal(true),
  currentScore: z.number().int().min(0).max(100),
  currentGrade: z.string(),
  pillarDeltas: z.null(),
  overallDelta: z.null(),
  gradeChange: z.null(),
  calculatedAt: z.date(),
});

export type FirstAuditDelta = z.infer<typeof FirstAuditDeltaSchema>;

// ---------------------------------------------------------------------------
// Score Delta Result (full comparison between two audits)
// ---------------------------------------------------------------------------

export const ScoreDeltaResultSchema = z.object({
  isFirstAudit: z.literal(false),
  /** Per-pillar deltas in canonical order. */
  pillarDeltas: z.array(PillarDeltaSchema),
  /** Overall score delta. */
  overallDelta: OverallDeltaSchema,
  /** Grade change details. */
  gradeChange: GradeChangeSchema,
  /** Pillar with the biggest improvement (or null if all declined/unchanged). */
  biggestImprovement: PillarDeltaSchema.nullable(),
  /** Pillar with the biggest decline (or null if all improved/unchanged). */
  biggestDecline: PillarDeltaSchema.nullable(),
  /** Total number of pillars that improved. */
  pillarsImproved: z.number().int().min(0),
  /** Total number of pillars that declined. */
  pillarsDeclined: z.number().int().min(0),
  /** Total number of pillars unchanged. */
  pillarsUnchanged: z.number().int().min(0),
  /** When this delta was calculated. */
  calculatedAt: z.date(),
});

export type ScoreDeltaResult = z.infer<typeof ScoreDeltaResultSchema>;

// ---------------------------------------------------------------------------
// Union: Either a first audit or a comparison
// ---------------------------------------------------------------------------

export const DeltaResultSchema = z.discriminatedUnion('isFirstAudit', [
  FirstAuditDeltaSchema,
  ScoreDeltaResultSchema,
]);

export type DeltaResult = z.infer<typeof DeltaResultSchema>;

// ---------------------------------------------------------------------------
// Delta Report — wraps delta + metadata for report generation & API responses
// ---------------------------------------------------------------------------

export const DeltaReportSchema = z.object({
  /** UUID of the baseline (previous) audit. Null if first audit. */
  baselineAuditId: z.string().uuid().nullable(),
  /** UUID of the verification (current) audit. */
  verificationAuditId: z.string().uuid(),
  /** The client this delta belongs to. */
  clientId: z.string().uuid(),
  /** Business name (for display in reports). */
  businessName: z.string(),
  /** Domain (for display in reports). */
  domain: z.string(),
  /** The computed delta result. */
  delta: DeltaResultSchema,
  /** Human-readable narrative summarizing the changes. */
  narrative: z.string().optional(),
  /** When the verification was performed. */
  verifiedAt: z.date(),
});

export type DeltaReport = z.infer<typeof DeltaReportSchema>;
