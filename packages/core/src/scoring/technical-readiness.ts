// Owner: S2 (stub). S6 implements the real scorer.
// Technical Readiness pillar: 0-10 points

import type { TechnicalScore } from '../contracts/scoring.contract.js';

/**
 * TODO: implement in S6
 */
export function scoreTechnicalReadiness(): TechnicalScore {
  // TODO: implement in S6
  return {
    score: 0,
    maxScore: 10,
    breakdown: {
      robotsTxtAiRules: 0,
      llmsTxt: 0,
      sitemap: 0,
      mobileFriendly: 0,
      https: 0,
      pageSpeed: 0,
    },
    notes: ['Stub: not yet implemented (S6)'],
    aiCrawlerAccess: false,
    llmsTxtPresent: false,
    sitemapPresent: false,
    httpsEnabled: false,
    mobileFriendly: false,
  };
}
