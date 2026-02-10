// Owner: S2 (stub). S8 implements the real scorer.
// Local/GBP + Third-Party pillar: 0-15 points

import type { GBPScore } from '../contracts/scoring.contract.js';

/**
 * TODO: implement in S8
 */
export function scoreLocalGBP(): GBPScore {
  // TODO: implement in S8
  return {
    score: 0,
    maxScore: 15,
    breakdown: {
      gbpProfile: 0,
      reviewSignals: 0,
      napConsistency: 0,
      thirdPartyMentions: 0,
    },
    notes: ['Stub: not yet implemented (S8)'],
    gbpComplete: false,
    reviewScore: 0,
    napConsistent: false,
  };
}
