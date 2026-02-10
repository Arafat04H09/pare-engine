// Owner: S7 (Schema Scoring). Replaces S2's stub.
// Schema/Structured Data pillar: 0-15 points
// Score breakdown: required types (0-8), recommended types (0-4), validation (0-3) = 0-15

import type { SchemaAnalysisOutput } from '../contracts/analysis.contract.js';
import type { SchemaScore } from '../contracts/scoring.contract.js';
import { SCORING_WEIGHTS } from '../contracts/scoring.contract.js';
import { getRequiredSchemaTypes, getRecommendedSchemaTypes } from '../tools/parse-jsonld.js';

const MAX_REQUIRED_POINTS = 8;
const MAX_RECOMMENDED_POINTS = 4;
const MAX_VALIDATION_POINTS = 3;
const PILLAR_MAX = SCORING_WEIGHTS.schemaStructuredData; // 15

export function scoreSchemaCompleteness(analysis: SchemaAnalysisOutput): SchemaScore {
  const notes: string[] = [];
  const presentTypesSet = new Set(analysis.allPresentTypes);

  // Required types score (0-8)
  const requiredTypes = getRequiredSchemaTypes(analysis.vertical);
  const requiredTotal = requiredTypes.length;
  const requiredPresent = requiredTypes.filter((t) => presentTypesSet.has(t)).length;
  let requiredScore: number;
  if (requiredTotal === 0) {
    requiredScore = Math.round(MAX_REQUIRED_POINTS * 0.5);
    notes.push('No required types defined for vertical; partial credit given');
  } else {
    requiredScore = Math.round((requiredPresent / requiredTotal) * MAX_REQUIRED_POINTS);
  }
  if (analysis.allMissingRequired.length > 0) {
    notes.push('Missing required types: ' + analysis.allMissingRequired.join(', '));
  }

  // Recommended types score (0-4)
  const recommendedTypes = getRecommendedSchemaTypes();
  const recommendedTotal = recommendedTypes.length;
  const recommendedPresent = recommendedTypes.filter((t) => presentTypesSet.has(t)).length;
  let recommendedScore: number;
  if (recommendedTotal === 0) {
    recommendedScore = 0;
  } else {
    recommendedScore = Math.round((recommendedPresent / recommendedTotal) * MAX_RECOMMENDED_POINTS);
  }
  if (analysis.allMissingRecommended.length > 0 && analysis.allMissingRecommended.length <= 5) {
    notes.push('Missing recommended types: ' + analysis.allMissingRecommended.join(', '));
  } else if (analysis.allMissingRecommended.length > 5) {
    notes.push('Missing ' + analysis.allMissingRecommended.length + ' recommended types');
  }

  // Validation score (0-3): max(0, 3 - error_count)
  const validationScore = Math.max(0, MAX_VALIDATION_POINTS - analysis.totalValidationErrors);
  if (analysis.totalValidationErrors > 0) {
    notes.push(analysis.totalValidationErrors + ' validation error(s) found in JSON-LD');
  }

  // Composite
  const rawScore = requiredScore + recommendedScore + validationScore;
  const finalScore = Math.min(PILLAR_MAX, Math.round(rawScore));

  if (analysis.allPresentTypes.length === 0) {
    notes.push('No JSON-LD structured data found on any page');
  } else {
    notes.push('Found types: ' + analysis.allPresentTypes.join(', '));
  }

  return {
    score: finalScore,
    maxScore: 15 as const,
    breakdown: {
      requiredTypes: requiredScore,
      recommendedTypes: recommendedScore,
      validation: validationScore,
    },
    notes,
    requiredTypesPresent: requiredPresent,
    requiredTypesTotal: requiredTotal,
    recommendedTypesPresent: recommendedPresent,
    validationErrorCount: analysis.totalValidationErrors,
  };
}
