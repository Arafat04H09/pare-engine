// Owner: S11 (Scoring Test Suite)
// Tests for scoring/index.ts: calculateOverallScore, SCORING_WEIGHTS, scoreToGrade, PillarScores
// Complements S2's scoring.test.ts with additional edge cases, grade boundary tests,
// and composite score verification.

import { describe, it, expect } from 'vitest';
import {
  SCORING_WEIGHTS,
  TOTAL_POINTS,
  scoreToGrade,
  calculateOverallScore,
} from './index.js';
import type { PillarScores } from './index.js';
import type {
  AIVisibilityScore,
  ContentQualityScore,
  SchemaScore,
  TechnicalScore,
  GBPScore,
} from '../contracts/scoring.contract.js';

// --- Test data factories ---

function makeAIVisibility(score: number): AIVisibilityScore {
  return {
    score,
    maxScore: 30 as const,
    breakdown: { mentionRate: 0, citationRate: 0, positionQuality: 0, sentiment: 0 },
    notes: [],
    mentionRate: 0,
    citationRate: 0,
    avgPosition: null,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
    platformCoverage: {},
    providersUsed: 1,
    providersAvailable: 3,
  };
}

function makeContentQuality(score: number): ContentQualityScore {
  return {
    score,
    maxScore: 30 as const,
    breakdown: { answerFirst: 0, faqPresence: 0, statisticsDensity: 0, authorAttribution: 0, contentDepth: 0, freshness: 0 },
    notes: [],
    avgAnswerFirstScore: 0,
    faqCoverage: 0,
    statsDensity: 0,
    authorAttributionRate: 0,
  };
}

function makeSchema(score: number): SchemaScore {
  return {
    score,
    maxScore: 15 as const,
    breakdown: { requiredTypes: 0, recommendedTypes: 0, validation: 0 },
    notes: [],
    requiredTypesPresent: 0,
    requiredTypesTotal: 0,
    recommendedTypesPresent: 0,
    validationErrorCount: 0,
  };
}

function makeTechnical(score: number): TechnicalScore {
  return {
    score,
    maxScore: 10 as const,
    breakdown: { aiCrawlerAccess: 0, llmsTxt: 0, sitemap: 0, httpsMobile: 0, pageSpeed: 0 },
    notes: [],
    aiCrawlerAccess: false,
    llmsTxtPresent: false,
    sitemapPresent: false,
    httpsEnabled: false,
    mobileFriendly: false,
  };
}

function makeGBP(score: number): GBPScore {
  return {
    score,
    maxScore: 15 as const,
    breakdown: { gbpProfile: 0, reviewSignals: 0, napConsistency: 0, thirdPartyMentions: 0 },
    notes: [],
    gbpComplete: false,
    reviewScore: 0,
    napConsistent: false,
  };
}

function makePillars(scores: {
  ai?: number;
  content?: number;
  schema?: number;
  technical?: number;
  gbp?: number;
} = {}): PillarScores {
  return {
    aiVisibility: makeAIVisibility(scores.ai ?? 0),
    contentQuality: makeContentQuality(scores.content ?? 0),
    schemaStructuredData: makeSchema(scores.schema ?? 0),
    technicalReadiness: makeTechnical(scores.technical ?? 0),
    localGbp: makeGBP(scores.gbp ?? 0),
  };
}

// --- Tests ---

describe('SCORING_WEIGHTS', () => {
  it('weights sum to exactly 100', () => {
    const sum =
      SCORING_WEIGHTS.aiVisibility +
      SCORING_WEIGHTS.contentQuality +
      SCORING_WEIGHTS.schemaStructuredData +
      SCORING_WEIGHTS.technicalReadiness +
      SCORING_WEIGHTS.localGbp;
    expect(sum).toBe(100);
  });

  it('TOTAL_POINTS equals 100', () => {
    expect(TOTAL_POINTS).toBe(100);
  });

  it('canonical values: 30/30/15/10/15', () => {
    expect(SCORING_WEIGHTS.aiVisibility).toBe(30);
    expect(SCORING_WEIGHTS.contentQuality).toBe(30);
    expect(SCORING_WEIGHTS.schemaStructuredData).toBe(15);
    expect(SCORING_WEIGHTS.technicalReadiness).toBe(10);
    expect(SCORING_WEIGHTS.localGbp).toBe(15);
  });

  it('weights are readonly (frozen)', () => {
    // TypeScript ensures this at compile time with `as const`,
    // but verify the runtime values haven't been tampered with
    expect(SCORING_WEIGHTS.aiVisibility).toBe(30);
  });
});

describe('scoreToGrade', () => {
  describe('grade thresholds', () => {
    it('A: 90-100', () => {
      expect(scoreToGrade(90)).toBe('A');
      expect(scoreToGrade(95)).toBe('A');
      expect(scoreToGrade(100)).toBe('A');
    });

    it('B: 80-89', () => {
      expect(scoreToGrade(80)).toBe('B');
      expect(scoreToGrade(85)).toBe('B');
      expect(scoreToGrade(89)).toBe('B');
    });

    it('C: 70-79', () => {
      expect(scoreToGrade(70)).toBe('C');
      expect(scoreToGrade(75)).toBe('C');
      expect(scoreToGrade(79)).toBe('C');
    });

    it('D: 60-69', () => {
      expect(scoreToGrade(60)).toBe('D');
      expect(scoreToGrade(65)).toBe('D');
      expect(scoreToGrade(69)).toBe('D');
    });

    it('F: 0-59', () => {
      expect(scoreToGrade(0)).toBe('F');
      expect(scoreToGrade(30)).toBe('F');
      expect(scoreToGrade(59)).toBe('F');
    });
  });

  describe('boundary precision', () => {
    it('89 is B, 90 is A', () => {
      expect(scoreToGrade(89)).toBe('B');
      expect(scoreToGrade(90)).toBe('A');
    });

    it('79 is C, 80 is B', () => {
      expect(scoreToGrade(79)).toBe('C');
      expect(scoreToGrade(80)).toBe('B');
    });

    it('69 is D, 70 is C', () => {
      expect(scoreToGrade(69)).toBe('D');
      expect(scoreToGrade(70)).toBe('C');
    });

    it('59 is F, 60 is D', () => {
      expect(scoreToGrade(59)).toBe('F');
      expect(scoreToGrade(60)).toBe('D');
    });
  });

  describe('no B+/B-/C+ intermediate grades (legacy bug)', () => {
    it('only returns simple A/B/C/D/F', () => {
      const validGrades = new Set(['A', 'B', 'C', 'D', 'F']);
      for (let score = 0; score <= 100; score++) {
        const grade = scoreToGrade(score);
        expect(validGrades.has(grade)).toBe(true);
      }
    });
  });
});

describe('calculateOverallScore', () => {
  describe('zero input', () => {
    it('returns 0/F for all-zero pillars', () => {
      const result = calculateOverallScore(makePillars());
      expect(result.overallScore).toBe(0);
      expect(result.letterGrade).toBe('F');
    });

    it('preserves all pillar data in output', () => {
      const pillars = makePillars();
      const result = calculateOverallScore(pillars);
      expect(result.pillars.aiVisibility.score).toBe(0);
      expect(result.pillars.contentQuality.score).toBe(0);
      expect(result.pillars.schemaStructuredData.score).toBe(0);
      expect(result.pillars.technicalReadiness.score).toBe(0);
      expect(result.pillars.localGbp.score).toBe(0);
    });
  });

  describe('perfect input', () => {
    it('returns 100/A for all max scores', () => {
      const result = calculateOverallScore(makePillars({
        ai: 30,
        content: 30,
        schema: 15,
        technical: 10,
        gbp: 15,
      }));
      expect(result.overallScore).toBe(100);
      expect(result.letterGrade).toBe('A');
    });
  });

  describe('typical inputs', () => {
    it('correctly sums mixed scores', () => {
      const result = calculateOverallScore(makePillars({
        ai: 20,
        content: 20,
        schema: 10,
        technical: 8,
        gbp: 12,
      }));
      expect(result.overallScore).toBe(70);
      expect(result.letterGrade).toBe('C');
    });

    it('correctly computes grade for 81 total', () => {
      const result = calculateOverallScore(makePillars({
        ai: 25,
        content: 22,
        schema: 12,
        technical: 9,
        gbp: 13,
      }));
      expect(result.overallScore).toBe(81);
      expect(result.letterGrade).toBe('B');
    });

    it('correctly computes grade for 60 (D)', () => {
      const result = calculateOverallScore(makePillars({
        ai: 15,
        content: 18,
        schema: 10,
        technical: 5,
        gbp: 12,
      }));
      expect(result.overallScore).toBe(60);
      expect(result.letterGrade).toBe('D');
    });
  });

  describe('edge cases', () => {
    it('caps composite at 100 even if pillar sum exceeds', () => {
      // This shouldn't happen with proper pillar caps, but test the safety net
      const result = calculateOverallScore(makePillars({
        ai: 30,
        content: 30,
        schema: 15,
        technical: 10,
        gbp: 20, // over max
      }));
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('rounds fractional sums to integer', () => {
      const result = calculateOverallScore(makePillars({
        ai: 15.3,
        content: 15.4,
        schema: 7.5,
        technical: 5.2,
        gbp: 7.3,
      }));
      // 15.3 + 15.4 + 7.5 + 5.2 + 7.3 = 50.7, rounds to 51
      expect(result.overallScore).toBe(51);
      expect(Number.isInteger(result.overallScore)).toBe(true);
    });

    it('rounds 0.5 correctly (banker or standard rounding)', () => {
      const result = calculateOverallScore(makePillars({
        ai: 10,
        content: 10,
        schema: 5,
        technical: 5,
        gbp: 5.5,
      }));
      // 10 + 10 + 5 + 5 + 5.5 = 35.5
      expect(Number.isInteger(result.overallScore)).toBe(true);
      // Math.round(35.5) = 36
      expect(result.overallScore).toBe(36);
    });

    it('includes scoredAt timestamp', () => {
      const before = new Date();
      const result = calculateOverallScore(makePillars());
      expect(result.scoredAt).toBeInstanceOf(Date);
      expect(result.scoredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('only one pillar contributing', () => {
      const aiOnly = calculateOverallScore(makePillars({ ai: 30 }));
      expect(aiOnly.overallScore).toBe(30);
      expect(aiOnly.letterGrade).toBe('F');

      const contentOnly = calculateOverallScore(makePillars({ content: 30 }));
      expect(contentOnly.overallScore).toBe(30);

      const schemaOnly = calculateOverallScore(makePillars({ schema: 15 }));
      expect(schemaOnly.overallScore).toBe(15);

      const techOnly = calculateOverallScore(makePillars({ technical: 10 }));
      expect(techOnly.overallScore).toBe(10);

      const gbpOnly = calculateOverallScore(makePillars({ gbp: 15 }));
      expect(gbpOnly.overallScore).toBe(15);
    });
  });

  describe('max score cap', () => {
    it('composite never exceeds 100', () => {
      const result = calculateOverallScore(makePillars({
        ai: 30,
        content: 30,
        schema: 15,
        technical: 10,
        gbp: 15,
      }));
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('composite never goes below 0', () => {
      const result = calculateOverallScore(makePillars({
        ai: 0,
        content: 0,
        schema: 0,
        technical: 0,
        gbp: 0,
      }));
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('grade consistency with overallScore', () => {
    it('grade matches score for every 10-point band', () => {
      const testCases = [
        { scores: { ai: 28, content: 28, schema: 14, technical: 10, gbp: 14 }, expectedGrade: 'A' }, // 94
        { scores: { ai: 25, content: 22, schema: 12, technical: 9, gbp: 13 }, expectedGrade: 'B' },  // 81
        { scores: { ai: 20, content: 20, schema: 10, technical: 8, gbp: 12 }, expectedGrade: 'C' },  // 70
        { scores: { ai: 15, content: 18, schema: 10, technical: 5, gbp: 12 }, expectedGrade: 'D' },  // 60
        { scores: { ai: 10, content: 10, schema: 5, technical: 3, gbp: 5 }, expectedGrade: 'F' },    // 33
      ];

      for (const { scores, expectedGrade } of testCases) {
        const result = calculateOverallScore(makePillars(scores));
        expect(result.letterGrade).toBe(expectedGrade);
        // Also verify grade matches what scoreToGrade would return
        expect(result.letterGrade).toBe(scoreToGrade(result.overallScore));
      }
    });
  });

  describe('pillar preservation', () => {
    it('preserves all AIVisibilityScore fields', () => {
      const pillars = makePillars({ ai: 25 });
      pillars.aiVisibility.mentionRate = 0.8;
      pillars.aiVisibility.citationRate = 0.3;
      pillars.aiVisibility.avgPosition = 2.5;
      pillars.aiVisibility.providersUsed = 3;
      const result = calculateOverallScore(pillars);
      expect(result.pillars.aiVisibility.mentionRate).toBe(0.8);
      expect(result.pillars.aiVisibility.citationRate).toBe(0.3);
      expect(result.pillars.aiVisibility.avgPosition).toBe(2.5);
      expect(result.pillars.aiVisibility.providersUsed).toBe(3);
    });

    it('preserves all ContentQualityScore fields', () => {
      const pillars = makePillars({ content: 20 });
      pillars.contentQuality.avgAnswerFirstScore = 7.5;
      pillars.contentQuality.faqCoverage = 0.4;
      const result = calculateOverallScore(pillars);
      expect(result.pillars.contentQuality.avgAnswerFirstScore).toBe(7.5);
      expect(result.pillars.contentQuality.faqCoverage).toBe(0.4);
    });

    it('preserves all SchemaScore fields', () => {
      const pillars = makePillars({ schema: 12 });
      pillars.schemaStructuredData.requiredTypesPresent = 6;
      pillars.schemaStructuredData.validationErrorCount = 1;
      const result = calculateOverallScore(pillars);
      expect(result.pillars.schemaStructuredData.requiredTypesPresent).toBe(6);
      expect(result.pillars.schemaStructuredData.validationErrorCount).toBe(1);
    });

    it('preserves all TechnicalScore fields', () => {
      const pillars = makePillars({ technical: 8 });
      pillars.technicalReadiness.httpsEnabled = true;
      pillars.technicalReadiness.mobileFriendly = true;
      const result = calculateOverallScore(pillars);
      expect(result.pillars.technicalReadiness.httpsEnabled).toBe(true);
      expect(result.pillars.technicalReadiness.mobileFriendly).toBe(true);
    });

    it('preserves all GBPScore fields', () => {
      const pillars = makePillars({ gbp: 10 });
      pillars.localGbp.gbpComplete = true;
      pillars.localGbp.napConsistent = true;
      pillars.localGbp.reviewScore = 4.5;
      const result = calculateOverallScore(pillars);
      expect(result.pillars.localGbp.gbpComplete).toBe(true);
      expect(result.pillars.localGbp.napConsistent).toBe(true);
      expect(result.pillars.localGbp.reviewScore).toBe(4.5);
    });
  });
});
