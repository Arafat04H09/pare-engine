// Owner: S2 (stub). S9 implements the real scorer.
// AI Visibility pillar: 0-30 points

import type { AIVisibilityScore } from '../contracts/scoring.contract.js';

/**
 * TODO: implement in S9
 */
export function scoreAIVisibility(): AIVisibilityScore {
  // TODO: implement in S9
  return {
    score: 0,
    maxScore: 30,
    breakdown: {
      mentionRate: 0,
      citationRate: 0,
      positionQuality: 0,
      sentiment: 0,
    },
    notes: ['Stub: not yet implemented (S9)'],
    mentionRate: 0,
    citationRate: 0,
    avgPosition: null,
    sentimentBreakdown: {
      positive: 0,
      neutral: 0,
      negative: 0,
    },
    platformCoverage: {},
    providersUsed: 1,
    providersAvailable: 3,
  };
}
