// Owner: S11 (Scoring Test Suite)
// Tests for content-quality.ts (S5's real implementation)
// scoreContentQuality takes optional ContentAnalysisOutput, returns ContentQualityScore (0-30).

import { describe, it, expect } from 'vitest';
import { scoreContentQuality } from './content-quality.js';
import { SCORING_WEIGHTS } from '../contracts/scoring.contract.js';
import type { ContentAnalysisOutput, ContentPageAnalysis } from '../contracts/analysis.contract.js';

// --- Test data factories ---

function makePage(overrides: Partial<ContentPageAnalysis> = {}): ContentPageAnalysis {
  return {
    url: overrides.url ?? 'https://example.com/page',
    answerFirstScore: overrides.answerFirstScore ?? 0,
    faqPresent: overrides.faqPresent ?? false,
    statsCount: overrides.statsCount ?? 0,
    hasAuthorAttribution: overrides.hasAuthorAttribution ?? false,
    wordCount: overrides.wordCount ?? 0,
    depthScore: overrides.depthScore ?? 0,
  };
}

function makeAnalysis(overrides: Partial<ContentAnalysisOutput> = {}, pages?: ContentPageAnalysis[]): ContentAnalysisOutput {
  const resolvedPages = pages ?? overrides.pages ?? [];
  return {
    pages: resolvedPages,
    averageAnswerFirstScore: overrides.averageAnswerFirstScore ?? 0,
    faqPageCount: overrides.faqPageCount ?? 0,
    averageStatsDensity: overrides.averageStatsDensity ?? 0,
    authorAttributionRate: overrides.authorAttributionRate ?? 0,
    analyzedAt: overrides.analyzedAt ?? new Date(),
  };
}

// --- Tests ---

describe('scoreContentQuality', () => {
  describe('zero input (no analysis provided)', () => {
    it('returns score 0 when no argument provided', () => {
      const result = scoreContentQuality();
      expect(result.score).toBe(0);
    });

    it('returns maxScore of 30', () => {
      const result = scoreContentQuality();
      expect(result.maxScore).toBe(30);
    });

    it('maxScore matches canonical weight', () => {
      const result = scoreContentQuality();
      expect(result.maxScore).toBe(SCORING_WEIGHTS.contentQuality);
    });

    it('returns all zero breakdown values', () => {
      const result = scoreContentQuality();
      for (const [, value] of Object.entries(result.breakdown)) {
        expect(value).toBe(0);
      }
    });

    it('returns informative note when no data', () => {
      const result = scoreContentQuality();
      expect(result.notes.length).toBeGreaterThan(0);
    });

    it('returns zero metadata fields', () => {
      const result = scoreContentQuality();
      expect(result.avgAnswerFirstScore).toBe(0);
      expect(result.faqCoverage).toBe(0);
      expect(result.statsDensity).toBe(0);
      expect(result.authorAttributionRate).toBe(0);
    });
  });

  describe('zero input (empty pages array)', () => {
    it('returns score 0 for empty pages', () => {
      const result = scoreContentQuality(makeAnalysis({ pages: [] }));
      expect(result.score).toBe(0);
    });

    it('generates a note about no pages analyzed', () => {
      const result = scoreContentQuality(makeAnalysis({ pages: [] }));
      expect(result.notes.some((n) => n.toLowerCase().includes('no page') || n.toLowerCase().includes('no content'))).toBe(true);
    });
  });

  describe('zero input (all-zero page data)', () => {
    it('returns low score for pages with all zeros', () => {
      const pages = [makePage(), makePage()];
      const analysis = makeAnalysis({
        averageAnswerFirstScore: 0,
        faqPageCount: 0,
        averageStatsDensity: 0,
        authorAttributionRate: 0,
      }, pages);
      const result = scoreContentQuality(analysis);
      // With all zeros, the only possible contribution is from freshness (min 1 if pages exist)
      expect(result.score).toBeLessThanOrEqual(5);
    });
  });

  describe('perfect input', () => {
    it('returns maxScore (30) for perfect data', () => {
      const pages = Array.from({ length: 10 }, (_, i) =>
        makePage({
          url: `https://example.com/page-${i}`,
          answerFirstScore: 10,
          faqPresent: true,
          statsCount: 10,
          hasAuthorAttribution: true,
          wordCount: 1500,
          depthScore: 10,
        }),
      );
      const analysis = makeAnalysis({
        averageAnswerFirstScore: 10,
        faqPageCount: 10,
        averageStatsDensity: 10,
        authorAttributionRate: 1.0,
      }, pages);
      const result = scoreContentQuality(analysis);
      expect(result.score).toBe(30);
    });

    it('score does not exceed 30 even with extreme values', () => {
      const pages = Array.from({ length: 20 }, (_, i) =>
        makePage({
          url: `https://example.com/page-${i}`,
          answerFirstScore: 10,
          faqPresent: true,
          statsCount: 50,
          hasAuthorAttribution: true,
          wordCount: 5000,
          depthScore: 10,
        }),
      );
      const analysis = makeAnalysis({
        averageAnswerFirstScore: 10,
        faqPageCount: 20,
        averageStatsDensity: 50,
        authorAttributionRate: 1.0,
      }, pages);
      const result = scoreContentQuality(analysis);
      expect(result.score).toBeLessThanOrEqual(30);
    });
  });

  describe('typical input', () => {
    it('scores mid-range for typical business site', () => {
      const pages = [
        makePage({ url: 'https://example.com/', answerFirstScore: 5, faqPresent: false, statsCount: 2, hasAuthorAttribution: false, wordCount: 400, depthScore: 5 }),
        makePage({ url: 'https://example.com/about', answerFirstScore: 3, faqPresent: false, statsCount: 3, hasAuthorAttribution: true, wordCount: 800, depthScore: 6 }),
        makePage({ url: 'https://example.com/services', answerFirstScore: 6, faqPresent: true, statsCount: 4, hasAuthorAttribution: false, wordCount: 600, depthScore: 5 }),
        makePage({ url: 'https://example.com/faq', answerFirstScore: 8, faqPresent: true, statsCount: 1, hasAuthorAttribution: false, wordCount: 500, depthScore: 4 }),
        makePage({ url: 'https://example.com/contact', answerFirstScore: 2, faqPresent: false, statsCount: 0, hasAuthorAttribution: false, wordCount: 200, depthScore: 2 }),
      ];
      const analysis = makeAnalysis({
        averageAnswerFirstScore: 4.8,
        faqPageCount: 2,
        averageStatsDensity: 2.0,
        authorAttributionRate: 0.2,
      }, pages);
      const result = scoreContentQuality(analysis);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(30);
      // A typical mediocre site should land roughly 8-18
      expect(result.score).toBeGreaterThanOrEqual(5);
      expect(result.score).toBeLessThanOrEqual(25);
    });
  });

  describe('edge cases', () => {
    it('handles single page', () => {
      const pages = [makePage({ answerFirstScore: 7, faqPresent: true, statsCount: 3, hasAuthorAttribution: true, wordCount: 1000, depthScore: 7 })];
      const analysis = makeAnalysis({
        averageAnswerFirstScore: 7,
        faqPageCount: 1,
        averageStatsDensity: 3,
        authorAttributionRate: 1.0,
      }, pages);
      const result = scoreContentQuality(analysis);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(30);
    });

    it('returns integer score', () => {
      const pages = [
        makePage({ answerFirstScore: 3.7, faqPresent: false, statsCount: 1, hasAuthorAttribution: false, wordCount: 450, depthScore: 3.5 }),
        makePage({ answerFirstScore: 6.3, faqPresent: true, statsCount: 2, hasAuthorAttribution: true, wordCount: 700, depthScore: 5.5 }),
      ];
      const analysis = makeAnalysis({
        averageAnswerFirstScore: 5.0,
        faqPageCount: 1,
        averageStatsDensity: 1.5,
        authorAttributionRate: 0.5,
      }, pages);
      const result = scoreContentQuality(analysis);
      expect(Number.isInteger(result.score)).toBe(true);
    });

    it('handles very large page count', () => {
      const pages = Array.from({ length: 100 }, (_, i) =>
        makePage({ url: `https://example.com/page-${i}`, answerFirstScore: 5, wordCount: 500, depthScore: 5 }),
      );
      const analysis = makeAnalysis({
        averageAnswerFirstScore: 5,
        faqPageCount: 5,
        averageStatsDensity: 1.0,
        authorAttributionRate: 0.1,
      }, pages);
      const result = scoreContentQuality(analysis);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(30);
    });

    it('handles zero word count pages', () => {
      const pages = [makePage({ wordCount: 0, depthScore: 0 })];
      const analysis = makeAnalysis({
        averageAnswerFirstScore: 0,
        faqPageCount: 0,
        averageStatsDensity: 0,
        authorAttributionRate: 0,
      }, pages);
      const result = scoreContentQuality(analysis);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('max score cap', () => {
    it('never returns score above 30', () => {
      // Even with maximally inflated sub-scores
      const pages = Array.from({ length: 5 }, (_, i) =>
        makePage({
          url: `https://example.com/${i}`,
          answerFirstScore: 10,
          faqPresent: true,
          statsCount: 100,
          hasAuthorAttribution: true,
          wordCount: 10000,
          depthScore: 10,
        }),
      );
      const analysis = makeAnalysis({
        averageAnswerFirstScore: 10,
        faqPageCount: 5,
        averageStatsDensity: 100,
        authorAttributionRate: 1.0,
      }, pages);
      const result = scoreContentQuality(analysis);
      expect(result.score).toBeLessThanOrEqual(30);
    });
  });

  describe('breakdown structure', () => {
    it('has expected sub-score keys', () => {
      const result = scoreContentQuality();
      expect(result.breakdown).toHaveProperty('answerFirst');
      expect(result.breakdown).toHaveProperty('faqPresence');
      expect(result.breakdown).toHaveProperty('statisticsDensity');
      expect(result.breakdown).toHaveProperty('authorAttribution');
      expect(result.breakdown).toHaveProperty('contentDepth');
      expect(result.breakdown).toHaveProperty('freshness');
    });

    it('all breakdown values are non-negative', () => {
      const pages = [makePage({ answerFirstScore: 5, wordCount: 500, depthScore: 5 })];
      const analysis = makeAnalysis({
        averageAnswerFirstScore: 5,
        faqPageCount: 0,
        averageStatsDensity: 2,
        authorAttributionRate: 0.5,
      }, pages);
      const result = scoreContentQuality(analysis);
      for (const [, value] of Object.entries(result.breakdown)) {
        expect(value).toBeGreaterThanOrEqual(0);
      }
    });

    it('answerFirst sub-score capped at 8', () => {
      const pages = [makePage({ answerFirstScore: 10, wordCount: 500, depthScore: 5 })];
      const analysis = makeAnalysis({ averageAnswerFirstScore: 10 }, pages);
      const result = scoreContentQuality(analysis);
      expect(result.breakdown['answerFirst']).toBeLessThanOrEqual(8);
    });

    it('faqPresence sub-score capped at 5', () => {
      const pages = Array.from({ length: 10 }, (_, i) =>
        makePage({ url: `https://example.com/${i}`, faqPresent: true, wordCount: 500, depthScore: 5 }),
      );
      const analysis = makeAnalysis({ faqPageCount: 10 }, pages);
      const result = scoreContentQuality(analysis);
      expect(result.breakdown['faqPresence']).toBeLessThanOrEqual(5);
    });

    it('statisticsDensity sub-score capped at 5', () => {
      const pages = [makePage({ statsCount: 100, wordCount: 500, depthScore: 5 })];
      const analysis = makeAnalysis({ averageStatsDensity: 100 }, pages);
      const result = scoreContentQuality(analysis);
      expect(result.breakdown['statisticsDensity']).toBeLessThanOrEqual(5);
    });

    it('authorAttribution sub-score capped at 4', () => {
      const pages = [makePage({ hasAuthorAttribution: true, wordCount: 500, depthScore: 5 })];
      const analysis = makeAnalysis({ authorAttributionRate: 1.0 }, pages);
      const result = scoreContentQuality(analysis);
      expect(result.breakdown['authorAttribution']).toBeLessThanOrEqual(4);
    });

    it('contentDepth sub-score capped at 4', () => {
      const pages = [makePage({ wordCount: 10000, depthScore: 10 })];
      const analysis = makeAnalysis({}, pages);
      const result = scoreContentQuality(analysis);
      expect(result.breakdown['contentDepth']).toBeLessThanOrEqual(4);
    });

    it('freshness sub-score capped at 4', () => {
      const pages = Array.from({ length: 20 }, (_, i) =>
        makePage({ url: `https://example.com/${i}`, depthScore: 10, wordCount: 500 }),
      );
      const analysis = makeAnalysis({}, pages);
      const result = scoreContentQuality(analysis);
      expect(result.breakdown['freshness']).toBeLessThanOrEqual(4);
    });
  });

  describe('sub-score formulas from SCORING_ALGORITHM.md', () => {
    it('answer-first: scales averageAnswerFirstScore (0-10) to 0-8', () => {
      // averageAnswerFirstScore of 5 out of 10 => approx 4 out of 8
      const pages = [makePage({ answerFirstScore: 5, wordCount: 500, depthScore: 5 })];
      const analysis = makeAnalysis({ averageAnswerFirstScore: 5 }, pages);
      const result = scoreContentQuality(analysis);
      expect(result.breakdown['answerFirst']).toBeGreaterThanOrEqual(3);
      expect(result.breakdown['answerFirst']).toBeLessThanOrEqual(5);
    });

    it('FAQ: min(faqCount/totalPages * 10, 5)', () => {
      // 2 FAQ pages out of 4 total => 2/4 * 10 = 5, capped at 5
      const pages = Array.from({ length: 4 }, (_, i) =>
        makePage({ url: `https://example.com/${i}`, wordCount: 500, depthScore: 5 }),
      );
      const analysis = makeAnalysis({ faqPageCount: 2 }, pages);
      const result = scoreContentQuality(analysis);
      expect(result.breakdown['faqPresence']).toBe(5);
    });

    it('stats density: min(avg_stats_per_page, 5)', () => {
      // avg stats density of 3 => score of 3
      const pages = [makePage({ statsCount: 3, wordCount: 500, depthScore: 5 })];
      const analysis = makeAnalysis({ averageStatsDensity: 3 }, pages);
      const result = scoreContentQuality(analysis);
      expect(result.breakdown['statisticsDensity']).toBe(3);
    });

    it('author attribution: rate * 4', () => {
      // rate of 0.5 => 0.5 * 4 = 2
      const pages = [makePage({ hasAuthorAttribution: true, wordCount: 500, depthScore: 5 })];
      const analysis = makeAnalysis({ authorAttributionRate: 0.5 }, pages);
      const result = scoreContentQuality(analysis);
      expect(result.breakdown['authorAttribution']).toBe(2);
    });
  });

  describe('notes generation', () => {
    it('adds note when answer-first is weak', () => {
      const pages = [makePage({ answerFirstScore: 1, wordCount: 500, depthScore: 5 })];
      const analysis = makeAnalysis({ averageAnswerFirstScore: 1 }, pages);
      const result = scoreContentQuality(analysis);
      expect(result.notes.some((n) => n.toLowerCase().includes('answer-first') || n.toLowerCase().includes('answer first'))).toBe(true);
    });

    it('adds note when no FAQ content detected', () => {
      const pages = [makePage({ wordCount: 500, depthScore: 5 })];
      const analysis = makeAnalysis({ faqPageCount: 0 }, pages);
      const result = scoreContentQuality(analysis);
      expect(result.notes.some((n) => n.toLowerCase().includes('faq') || n.toLowerCase().includes('q&a'))).toBe(true);
    });

    it('adds note when stats density is low', () => {
      const pages = [makePage({ statsCount: 0, wordCount: 500, depthScore: 5 })];
      const analysis = makeAnalysis({ averageStatsDensity: 0.5 }, pages);
      const result = scoreContentQuality(analysis);
      expect(result.notes.some((n) => n.toLowerCase().includes('statistic'))).toBe(true);
    });
  });
});
