// Owner: S2 (Scoring Foundation). Consumers: S5, S6, S7, S8, S9, S10, S11, S12, S20.
// This contract defines the scoring system's types.
// Weights are CANONICAL: 30/30/15/10/15 = 100. Do not deviate.

import { z } from 'zod';

// --- Weights (immutable) ---

export const SCORING_WEIGHTS = {
  aiVisibility: 30,
  contentQuality: 30,
  schemaStructuredData: 15,
  technicalReadiness: 10,
  localGbp: 15,
} as const;

export const TOTAL_POINTS = 100;

// --- Letter Grades (simple A/B/C/D/F per SCORING_ALGORITHM.md) ---

export const LetterGradeSchema = z.enum(['A', 'B', 'C', 'D', 'F']);
export type LetterGrade = z.infer<typeof LetterGradeSchema>;

export function scoreToGrade(score: number): LetterGrade {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

// --- Pillar Score Types ---

export const PillarScoreSchema = z.object({
  score: z.number().min(0),
  maxScore: z.number().int().positive(),
  breakdown: z.record(z.number()),
  notes: z.array(z.string()).default([]),
});

export type PillarScore = z.infer<typeof PillarScoreSchema>;

export const AIVisibilityScoreSchema = PillarScoreSchema.extend({
  maxScore: z.literal(30),
  mentionRate: z.number().min(0).max(1),
  citationRate: z.number().min(0).max(1),
  avgPosition: z.number().nullable(),
  sentimentBreakdown: z.object({
    positive: z.number().int(),
    neutral: z.number().int(),
    negative: z.number().int(),
  }),
  platformCoverage: z.record(z.boolean()),
  providersUsed: z.number().int().min(1),
  providersAvailable: z.number().int().min(1),
});

export type AIVisibilityScore = z.infer<typeof AIVisibilityScoreSchema>;

export const ContentQualityScoreSchema = PillarScoreSchema.extend({
  maxScore: z.literal(30),
  avgAnswerFirstScore: z.number(),
  faqCoverage: z.number(),
  statsDensity: z.number(),
  authorAttributionRate: z.number(),
});

export type ContentQualityScore = z.infer<typeof ContentQualityScoreSchema>;

export const SchemaScoreSchema = PillarScoreSchema.extend({
  maxScore: z.literal(15),
  requiredTypesPresent: z.number().int(),
  requiredTypesTotal: z.number().int(),
  recommendedTypesPresent: z.number().int(),
  validationErrorCount: z.number().int(),
});

export type SchemaScore = z.infer<typeof SchemaScoreSchema>;

export const TechnicalScoreSchema = PillarScoreSchema.extend({
  maxScore: z.literal(10),
  aiCrawlerAccess: z.boolean(),
  llmsTxtPresent: z.boolean(),
  sitemapPresent: z.boolean(),
  httpsEnabled: z.boolean(),
  mobileFriendly: z.boolean(),
});

export type TechnicalScore = z.infer<typeof TechnicalScoreSchema>;

export const GBPScoreSchema = PillarScoreSchema.extend({
  maxScore: z.literal(15),
  gbpComplete: z.boolean(),
  reviewScore: z.number(),
  napConsistent: z.boolean(),
});

export type GBPScore = z.infer<typeof GBPScoreSchema>;

// --- Composite Score ---

export const CompositeScoreSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  letterGrade: LetterGradeSchema,
  pillars: z.object({
    aiVisibility: AIVisibilityScoreSchema,
    contentQuality: ContentQualityScoreSchema,
    schemaStructuredData: SchemaScoreSchema,
    technicalReadiness: TechnicalScoreSchema,
    localGbp: GBPScoreSchema,
  }),
  scoredAt: z.date(),
});

export type CompositeScore = z.infer<typeof CompositeScoreSchema>;
