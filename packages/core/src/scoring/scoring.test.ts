import { describe, it, expect } from 'vitest';
import { SCORING_WEIGHTS, TOTAL_POINTS, scoreToGrade, calculateOverallScore } from './index.js';
import { scoreAIVisibility } from './ai-visibility.js';
import { scoreContentQuality } from './content-quality.js';
import { scoreSchemaCompleteness } from './schema-completeness.js';
import { scoreTechnicalReadiness } from './technical-readiness.js';
import { scoreLocalGBP } from './local-gbp.js';
import type { PillarScores } from './index.js';
import type { AIVisibilityScore, ContentQualityScore, SchemaScore, TechnicalScore, GBPScore } from '../contracts/scoring.contract.js';

function makePillarScores(o: { aiVisibility?: number; contentQuality?: number; schemaStructuredData?: number; technicalReadiness?: number; localGbp?: number; } = {}): PillarScores {
  return {
    aiVisibility: { score: o.aiVisibility ?? 0, maxScore: 30 as const, breakdown: { mentionRate: 0, citationRate: 0, positionQuality: 0, sentiment: 0 }, notes: [], mentionRate: 0, citationRate: 0, avgPosition: null, sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }, platformCoverage: {}, providersUsed: 1, providersAvailable: 3 } satisfies AIVisibilityScore,
    contentQuality: { score: o.contentQuality ?? 0, maxScore: 30 as const, breakdown: { answerFirst: 0, faqPresence: 0, statisticsDensity: 0, authorAttribution: 0, contentDepth: 0, freshness: 0 }, notes: [], avgAnswerFirstScore: 0, faqCoverage: 0, statsDensity: 0, authorAttributionRate: 0 } satisfies ContentQualityScore,
    schemaStructuredData: { score: o.schemaStructuredData ?? 0, maxScore: 15 as const, breakdown: { requiredTypes: 0, recommendedTypes: 0, validation: 0 }, notes: [], requiredTypesPresent: 0, requiredTypesTotal: 0, recommendedTypesPresent: 0, validationErrorCount: 0 } satisfies SchemaScore,
    technicalReadiness: { score: o.technicalReadiness ?? 0, maxScore: 10 as const, breakdown: { robotsTxtAiRules: 0, llmsTxt: 0, sitemap: 0, mobileFriendly: 0, https: 0, pageSpeed: 0 }, notes: [], aiCrawlerAccess: false, llmsTxtPresent: false, sitemapPresent: false, httpsEnabled: false, mobileFriendly: false } satisfies TechnicalScore,
    localGbp: { score: o.localGbp ?? 0, maxScore: 15 as const, breakdown: { gbpProfile: 0, reviewSignals: 0, napConsistency: 0, thirdPartyMentions: 0 }, notes: [], gbpComplete: false, reviewScore: 0, napConsistent: false } satisfies GBPScore,
  };
}

describe('SCORING_WEIGHTS', () => {
  it('weights sum to exactly 100', () => {
    expect(SCORING_WEIGHTS.aiVisibility + SCORING_WEIGHTS.contentQuality + SCORING_WEIGHTS.schemaStructuredData + SCORING_WEIGHTS.technicalReadiness + SCORING_WEIGHTS.localGbp).toBe(100);
  });
  it('TOTAL_POINTS equals 100', () => { expect(TOTAL_POINTS).toBe(100); });
  it('individual weights match canonical values', () => {
    expect(SCORING_WEIGHTS.aiVisibility).toBe(30);
    expect(SCORING_WEIGHTS.contentQuality).toBe(30);
    expect(SCORING_WEIGHTS.schemaStructuredData).toBe(15);
    expect(SCORING_WEIGHTS.technicalReadiness).toBe(10);
    expect(SCORING_WEIGHTS.localGbp).toBe(15);
  });
});

describe('scoreToGrade', () => {
  it('returns A for 90-100', () => { expect(scoreToGrade(90)).toBe('A'); expect(scoreToGrade(100)).toBe('A'); });
  it('returns B for 80-89', () => { expect(scoreToGrade(80)).toBe('B'); expect(scoreToGrade(89)).toBe('B'); });
  it('returns C for 70-79', () => { expect(scoreToGrade(70)).toBe('C'); expect(scoreToGrade(79)).toBe('C'); });
  it('returns D for 60-69', () => { expect(scoreToGrade(60)).toBe('D'); expect(scoreToGrade(69)).toBe('D'); });
  it('returns F for 0-59', () => { expect(scoreToGrade(0)).toBe('F'); expect(scoreToGrade(59)).toBe('F'); });
  it('handles boundary values', () => {
    expect(scoreToGrade(89)).toBe('B'); expect(scoreToGrade(90)).toBe('A');
    expect(scoreToGrade(79)).toBe('C'); expect(scoreToGrade(80)).toBe('B');
    expect(scoreToGrade(69)).toBe('D'); expect(scoreToGrade(70)).toBe('C');
    expect(scoreToGrade(59)).toBe('F'); expect(scoreToGrade(60)).toBe('D');
  });
  it('only returns simple A/B/C/D/F grades', () => {
    for (let s = 0; s <= 100; s++) { expect(scoreToGrade(s)).toMatch(/^[A-F]$/); }
  });
});

describe('calculateOverallScore', () => {
  it('returns 0/F for all-zero', () => { const r = calculateOverallScore(makePillarScores()); expect(r.overallScore).toBe(0); expect(r.letterGrade).toBe('F'); });
  it('returns correct composite for mixed scores', () => { const r = calculateOverallScore(makePillarScores({ aiVisibility: 20, contentQuality: 20, schemaStructuredData: 10, technicalReadiness: 8, localGbp: 12 })); expect(r.overallScore).toBe(70); expect(r.letterGrade).toBe('C'); });
  it('returns perfect 100/A for max scores', () => { const r = calculateOverallScore(makePillarScores({ aiVisibility: 30, contentQuality: 30, schemaStructuredData: 15, technicalReadiness: 10, localGbp: 15 })); expect(r.overallScore).toBe(100); expect(r.letterGrade).toBe('A'); });
  it('caps composite at 100', () => { const r = calculateOverallScore(makePillarScores({ aiVisibility: 30, contentQuality: 30, schemaStructuredData: 15, technicalReadiness: 10, localGbp: 20 })); expect(r.overallScore).toBe(100); });
  it('rounds to integer', () => { const r = calculateOverallScore(makePillarScores({ aiVisibility: 15.4, contentQuality: 15.3, schemaStructuredData: 7.5, technicalReadiness: 5.2, localGbp: 7.3 })); expect(r.overallScore).toBe(51); expect(Number.isInteger(r.overallScore)).toBe(true); });
  it('includes scoredAt timestamp', () => { const before = new Date(); const r = calculateOverallScore(makePillarScores()); expect(r.scoredAt.getTime()).toBeGreaterThanOrEqual(before.getTime()); });
  it('preserves all pillar data', () => { const r = calculateOverallScore(makePillarScores({ aiVisibility: 25, contentQuality: 22, schemaStructuredData: 12, technicalReadiness: 9, localGbp: 13 })); expect(r.pillars.aiVisibility.score).toBe(25); expect(r.overallScore).toBe(81); expect(r.letterGrade).toBe('B'); });
});

describe('pillar scorer stubs', () => {
  // TODO: S11 rewrites — S9 replaced stub with real implementation requiring args
  it.skip('scoreAIVisibility returns 0/30', () => {});
  it('scoreContentQuality returns 0/30', () => { const r = scoreContentQuality(); expect(r.score).toBe(0); expect(r.maxScore).toBe(30); });
  // TODO: S11 rewrites — S6/S7 replaced stubs with real implementations requiring args
  it.skip('scoreSchemaCompleteness returns 0/15', () => {});
  it.skip('scoreTechnicalReadiness returns 0/10', () => {});
  it('scoreLocalGBP returns 0/15', () => { const r = scoreLocalGBP(); expect(r.score).toBe(0); expect(r.maxScore).toBe(15); });
  it.skip('stub maxScores sum to 100', () => {});
});
