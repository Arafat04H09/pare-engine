// Owner: S2 (stub). S7 implements the real scorer.
// Schema/Structured Data pillar: 0-15 points

import type { SchemaScore } from '../contracts/scoring.contract.js';

/**
 * TODO: implement in S7
 */
export function scoreSchemaCompleteness(): SchemaScore {
  // TODO: implement in S7
  return {
    score: 0,
    maxScore: 15,
    breakdown: {
      requiredTypes: 0,
      recommendedTypes: 0,
      validation: 0,
    },
    notes: ['Stub: not yet implemented (S7)'],
    requiredTypesPresent: 0,
    requiredTypesTotal: 0,
    recommendedTypesPresent: 0,
    validationErrorCount: 0,
  };
}
