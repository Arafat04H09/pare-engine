// Owner: S2 (Scoring Foundation)
// Replaces the old packages/core/src/scoring.ts

import {
  SCORING_WEIGHTS,
  TOTAL_POINTS,
  scoreToGrade,
  type CompositeScore,
  type AIVisibilityScore,
  type ContentQualityScore,
  type SchemaScore,
  type TechnicalScore,
  type GBPScore,
  type LetterGrade,
} from '../contracts/scoring.contract.js';

export { SCORING_WEIGHTS, TOTAL_POINTS, scoreToGrade } from '../contracts/scoring.contract.js';
export type {
  CompositeScore,
  AIVisibilityScore,
  ContentQualityScore,
  SchemaScore,
  TechnicalScore,
  GBPScore,
  LetterGrade,
  PillarScore,
} from '../contracts/scoring.contract.js';

export { scoreAIVisibility } from './ai-visibility.js';
export { scoreContentQuality } from './content-quality.js';
export { scoreSchemaCompleteness } from './schema-completeness.js';
export { scoreTechnicalReadiness } from './technical-readiness.js';
export { scoreLocalGBP } from './local-gbp.js';

export interface PillarScores {
  aiVisibility: AIVisibilityScore;
  contentQuality: ContentQualityScore;
  schemaStructuredData: SchemaScore;
  technicalReadiness: TechnicalScore;
  localGbp: GBPScore;
}

export function calculateOverallScore(pillars: PillarScores): CompositeScore {
  const rawSum =
    pillars.aiVisibility.score +
    pillars.contentQuality.score +
    pillars.schemaStructuredData.score +
    pillars.technicalReadiness.score +
    pillars.localGbp.score;

  const overallScore = Math.min(TOTAL_POINTS, Math.round(rawSum));
  const letterGrade: LetterGrade = scoreToGrade(overallScore);

  return {
    overallScore,
    letterGrade,
    pillars: {
      aiVisibility: pillars.aiVisibility,
      contentQuality: pillars.contentQuality,
      schemaStructuredData: pillars.schemaStructuredData,
      technicalReadiness: pillars.technicalReadiness,
      localGbp: pillars.localGbp,
    },
    scoredAt: new Date(),
  };
}
