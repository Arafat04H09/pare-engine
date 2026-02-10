// Owner: S11 (Scoring Test Suite)
// Tests for technical-readiness.ts (S6's real implementation)
// scoreTechnicalReadiness requires TechnicalAnalysisOutput, returns TechnicalScore (0-10).

import { describe, it, expect } from 'vitest';
import { scoreTechnicalReadiness } from './technical-readiness.js';
import { SCORING_WEIGHTS } from '../contracts/scoring.contract.js';
import type { TechnicalAnalysisOutput, RobotsTxtAnalysis } from '../contracts/analysis.contract.js';

// --- Test data factory ---

function makeRobotsTxt(overrides: Partial<RobotsTxtAnalysis> = {}): RobotsTxtAnalysis {
  return {
    exists: overrides.exists ?? false,
    aiFriendly: overrides.aiFriendly ?? false,
    blockedBots: overrides.blockedBots ?? [],
    allowedBots: overrides.allowedBots ?? [],
  };
}

function makeTechnicalAnalysis(overrides: Partial<TechnicalAnalysisOutput> = {}): TechnicalAnalysisOutput {
  return {
    robotsTxt: overrides.robotsTxt ?? makeRobotsTxt(),
    llmsTxtPresent: overrides.llmsTxtPresent ?? false,
    llmsFullTxtPresent: overrides.llmsFullTxtPresent ?? false,
    sitemapPresent: overrides.sitemapPresent ?? false,
    sitemapUrlCount: overrides.sitemapUrlCount,
    httpsEnabled: overrides.httpsEnabled ?? false,
    mobileFriendly: overrides.mobileFriendly ?? false,
    pageSpeedScore: overrides.pageSpeedScore,
    performanceScore: overrides.performanceScore,
    accessibilityScore: overrides.accessibilityScore,
    seoScore: overrides.seoScore,
    coreWebVitals: overrides.coreWebVitals,
    analyzedAt: overrides.analyzedAt ?? new Date(),
  };
}

// --- Tests ---

describe('scoreTechnicalReadiness', () => {
  describe('zero input (everything off/missing)', () => {
    it('returns score of 0 for completely bare site', () => {
      const analysis = makeTechnicalAnalysis({
        robotsTxt: makeRobotsTxt({ exists: false, aiFriendly: false, blockedBots: [], allowedBots: [] }),
        llmsTxtPresent: false,
        llmsFullTxtPresent: false,
        sitemapPresent: false,
        httpsEnabled: false,
        mobileFriendly: false,
      });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.score).toBe(0);
    });

    it('returns maxScore of 10', () => {
      const analysis = makeTechnicalAnalysis();
      const result = scoreTechnicalReadiness(analysis);
      expect(result.maxScore).toBe(10);
    });

    it('maxScore matches canonical weight', () => {
      const analysis = makeTechnicalAnalysis();
      const result = scoreTechnicalReadiness(analysis);
      expect(result.maxScore).toBe(SCORING_WEIGHTS.technicalReadiness);
    });
  });

  describe('perfect input (everything on)', () => {
    it('returns maxScore (10) for fully optimized site', () => {
      const analysis = makeTechnicalAnalysis({
        robotsTxt: makeRobotsTxt({
          exists: true,
          aiFriendly: true,
          blockedBots: [],
          allowedBots: ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'anthropic-ai', 'PerplexityBot', 'Google-Extended', 'Googlebot', 'Bingbot'],
        }),
        llmsTxtPresent: true,
        llmsFullTxtPresent: true,
        sitemapPresent: true,
        sitemapUrlCount: 50,
        httpsEnabled: true,
        mobileFriendly: true,
        coreWebVitals: { lcp: 1500 },
      });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.score).toBe(10);
    });

    it('score does not exceed 10 even with extra data', () => {
      const analysis = makeTechnicalAnalysis({
        robotsTxt: makeRobotsTxt({
          exists: true,
          aiFriendly: true,
          blockedBots: [],
          allowedBots: ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'anthropic-ai', 'PerplexityBot', 'Google-Extended', 'Googlebot', 'Bingbot', 'ExtraBot1', 'ExtraBot2'],
        }),
        llmsTxtPresent: true,
        llmsFullTxtPresent: true,
        sitemapPresent: true,
        sitemapUrlCount: 1000,
        httpsEnabled: true,
        mobileFriendly: true,
        pageSpeedScore: 100,
        coreWebVitals: { lcp: 500, fid: 10, cls: 0.01 },
      });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.score).toBeLessThanOrEqual(10);
    });
  });

  describe('typical input', () => {
    it('scores mid-range for average site', () => {
      const analysis = makeTechnicalAnalysis({
        robotsTxt: makeRobotsTxt({
          exists: true,
          aiFriendly: false,
          blockedBots: ['GPTBot', 'ClaudeBot'],
          allowedBots: ['Googlebot', 'Bingbot', 'PerplexityBot'],
        }),
        llmsTxtPresent: false,
        llmsFullTxtPresent: false,
        sitemapPresent: true,
        sitemapUrlCount: 20,
        httpsEnabled: true,
        mobileFriendly: true,
        coreWebVitals: { lcp: 3000 },
      });
      const result = scoreTechnicalReadiness(analysis);
      // robots: 3/5 allowed * 3 ~ 2 + llms: 0 + sitemap: 2 + https+mobile: 2 + pagespeed: 0 = ~6
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(10);
    });
  });

  describe('AI crawler access sub-score (0-3)', () => {
    it('returns 3 when all bots allowed', () => {
      const analysis = makeTechnicalAnalysis({
        robotsTxt: makeRobotsTxt({
          exists: true,
          aiFriendly: true,
          blockedBots: [],
          allowedBots: ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot', 'Googlebot'],
        }),
      });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.breakdown['aiCrawlerAccess']).toBe(3);
    });

    it('returns 0 when all bots blocked', () => {
      const analysis = makeTechnicalAnalysis({
        robotsTxt: makeRobotsTxt({
          exists: true,
          aiFriendly: false,
          blockedBots: ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot', 'Googlebot'],
          allowedBots: [],
        }),
      });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.breakdown['aiCrawlerAccess']).toBe(0);
    });

    it('gives partial credit for partial access', () => {
      const analysis = makeTechnicalAnalysis({
        robotsTxt: makeRobotsTxt({
          exists: true,
          aiFriendly: false,
          blockedBots: ['GPTBot', 'ClaudeBot'],
          allowedBots: ['Googlebot', 'Bingbot'],
        }),
      });
      const result = scoreTechnicalReadiness(analysis);
      // 2/4 * 3 = 1.5, rounded to 2
      expect(result.breakdown['aiCrawlerAccess']).toBeGreaterThan(0);
      expect(result.breakdown['aiCrawlerAccess']).toBeLessThan(3);
    });

    it('handles no robots.txt (all allowed by default)', () => {
      const analysis = makeTechnicalAnalysis({
        robotsTxt: makeRobotsTxt({
          exists: false,
          aiFriendly: false,
          blockedBots: [],
          allowedBots: [],
        }),
      });
      const result = scoreTechnicalReadiness(analysis);
      // No bots in either list, denominator falls back to AI_BOT_COUNT constant, 0/12 * 3 = 0
      expect(result.breakdown['aiCrawlerAccess']).toBe(0);
    });
  });

  describe('llms.txt sub-score (0-2)', () => {
    it('returns 0 when neither present', () => {
      const analysis = makeTechnicalAnalysis({ llmsTxtPresent: false, llmsFullTxtPresent: false });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.breakdown['llmsTxt']).toBe(0);
    });

    it('returns 1 for llms.txt only', () => {
      const analysis = makeTechnicalAnalysis({ llmsTxtPresent: true, llmsFullTxtPresent: false });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.breakdown['llmsTxt']).toBe(1);
    });

    it('returns 2 for both llms.txt and llms-full.txt', () => {
      const analysis = makeTechnicalAnalysis({ llmsTxtPresent: true, llmsFullTxtPresent: true });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.breakdown['llmsTxt']).toBe(2);
    });

    it('returns 1 for llms-full.txt only (edge case)', () => {
      const analysis = makeTechnicalAnalysis({ llmsTxtPresent: false, llmsFullTxtPresent: true });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.breakdown['llmsTxt']).toBe(1);
    });
  });

  describe('sitemap sub-score (0-2)', () => {
    it('returns 0 when no sitemap', () => {
      const analysis = makeTechnicalAnalysis({ sitemapPresent: false });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.breakdown['sitemap']).toBe(0);
    });

    it('returns 1 for sitemap present but no URL count', () => {
      const analysis = makeTechnicalAnalysis({ sitemapPresent: true });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.breakdown['sitemap']).toBe(1);
    });

    it('returns 2 for sitemap present with URLs', () => {
      const analysis = makeTechnicalAnalysis({ sitemapPresent: true, sitemapUrlCount: 25 });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.breakdown['sitemap']).toBe(2);
    });

    it('returns 1 for sitemap present with 0 URLs', () => {
      const analysis = makeTechnicalAnalysis({ sitemapPresent: true, sitemapUrlCount: 0 });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.breakdown['sitemap']).toBe(1);
    });
  });

  describe('HTTPS and mobile sub-score (0-2)', () => {
    it('returns 0 when neither enabled', () => {
      const analysis = makeTechnicalAnalysis({ httpsEnabled: false, mobileFriendly: false });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.breakdown['httpsMobile']).toBe(0);
    });

    it('returns 1 for HTTPS only', () => {
      const analysis = makeTechnicalAnalysis({ httpsEnabled: true, mobileFriendly: false });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.breakdown['httpsMobile']).toBe(1);
    });

    it('returns 1 for mobile only', () => {
      const analysis = makeTechnicalAnalysis({ httpsEnabled: false, mobileFriendly: true });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.breakdown['httpsMobile']).toBe(1);
    });

    it('returns 2 for both', () => {
      const analysis = makeTechnicalAnalysis({ httpsEnabled: true, mobileFriendly: true });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.breakdown['httpsMobile']).toBe(2);
    });
  });

  describe('PageSpeed sub-score (0-1)', () => {
    it('returns 0 when no core web vitals data', () => {
      const analysis = makeTechnicalAnalysis();
      const result = scoreTechnicalReadiness(analysis);
      expect(result.breakdown['pageSpeed']).toBe(0);
    });

    it('returns 1 when LCP < 2500ms', () => {
      const analysis = makeTechnicalAnalysis({ coreWebVitals: { lcp: 2000 } });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.breakdown['pageSpeed']).toBe(1);
    });

    it('returns 0 when LCP >= 2500ms', () => {
      const analysis = makeTechnicalAnalysis({ coreWebVitals: { lcp: 2500 } });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.breakdown['pageSpeed']).toBe(0);
    });

    it('returns 0 when LCP is well above threshold', () => {
      const analysis = makeTechnicalAnalysis({ coreWebVitals: { lcp: 5000 } });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.breakdown['pageSpeed']).toBe(0);
    });

    it('returns 1 when LCP is just under threshold', () => {
      const analysis = makeTechnicalAnalysis({ coreWebVitals: { lcp: 2499 } });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.breakdown['pageSpeed']).toBe(1);
    });

    it('handles LCP of 0', () => {
      const analysis = makeTechnicalAnalysis({ coreWebVitals: { lcp: 0 } });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.breakdown['pageSpeed']).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('returns integer score', () => {
      const analysis = makeTechnicalAnalysis({
        robotsTxt: makeRobotsTxt({
          exists: true,
          aiFriendly: false,
          blockedBots: ['GPTBot'],
          allowedBots: ['Googlebot', 'Bingbot'],
        }),
        llmsTxtPresent: true,
        sitemapPresent: true,
        sitemapUrlCount: 10,
        httpsEnabled: true,
        mobileFriendly: false,
        coreWebVitals: { lcp: 3500 },
      });
      const result = scoreTechnicalReadiness(analysis);
      expect(Number.isInteger(result.score)).toBe(true);
    });

    it('handles missing optional fields gracefully', () => {
      const analysis = makeTechnicalAnalysis({
        robotsTxt: makeRobotsTxt({ exists: true, aiFriendly: true, allowedBots: ['Googlebot'] }),
        sitemapPresent: true,
        httpsEnabled: true,
      });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(10);
    });
  });

  describe('max score cap', () => {
    it('never returns score above 10', () => {
      const analysis = makeTechnicalAnalysis({
        robotsTxt: makeRobotsTxt({
          exists: true,
          aiFriendly: true,
          blockedBots: [],
          allowedBots: Array.from({ length: 20 }, (_, i) => `Bot${i}`),
        }),
        llmsTxtPresent: true,
        llmsFullTxtPresent: true,
        sitemapPresent: true,
        sitemapUrlCount: 500,
        httpsEnabled: true,
        mobileFriendly: true,
        coreWebVitals: { lcp: 100 },
      });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.score).toBeLessThanOrEqual(10);
    });
  });

  describe('notes generation', () => {
    it('notes blocked AI bots', () => {
      const analysis = makeTechnicalAnalysis({
        robotsTxt: makeRobotsTxt({
          exists: true,
          aiFriendly: false,
          blockedBots: ['GPTBot', 'ClaudeBot'],
          allowedBots: ['Googlebot'],
        }),
      });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.notes.some((n) => n.includes('GPTBot') || n.includes('ClaudeBot'))).toBe(true);
    });

    it('notes missing robots.txt', () => {
      const analysis = makeTechnicalAnalysis({
        robotsTxt: makeRobotsTxt({ exists: false }),
      });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.notes.some((n) => n.toLowerCase().includes('no robots.txt'))).toBe(true);
    });

    it('notes missing llms.txt', () => {
      const analysis = makeTechnicalAnalysis({ llmsTxtPresent: false });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.notes.some((n) => n.toLowerCase().includes('llms.txt'))).toBe(true);
    });

    it('notes missing sitemap', () => {
      const analysis = makeTechnicalAnalysis({ sitemapPresent: false });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.notes.some((n) => n.toLowerCase().includes('sitemap'))).toBe(true);
    });

    it('notes missing HTTPS', () => {
      const analysis = makeTechnicalAnalysis({ httpsEnabled: false });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.notes.some((n) => n.toLowerCase().includes('https'))).toBe(true);
    });

    it('notes slow LCP', () => {
      const analysis = makeTechnicalAnalysis({ coreWebVitals: { lcp: 4000 } });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.notes.some((n) => n.toLowerCase().includes('lcp') || n.toLowerCase().includes('contentful'))).toBe(true);
    });
  });

  describe('metadata fields', () => {
    it('aiCrawlerAccess reflects robotsTxt.aiFriendly', () => {
      const analysis = makeTechnicalAnalysis({
        robotsTxt: makeRobotsTxt({ aiFriendly: true, allowedBots: ['GPTBot'] }),
      });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.aiCrawlerAccess).toBe(true);
    });

    it('llmsTxtPresent reflects input', () => {
      const analysis = makeTechnicalAnalysis({ llmsTxtPresent: true });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.llmsTxtPresent).toBe(true);
    });

    it('sitemapPresent reflects input', () => {
      const analysis = makeTechnicalAnalysis({ sitemapPresent: true });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.sitemapPresent).toBe(true);
    });

    it('httpsEnabled reflects input', () => {
      const analysis = makeTechnicalAnalysis({ httpsEnabled: true });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.httpsEnabled).toBe(true);
    });

    it('mobileFriendly reflects input', () => {
      const analysis = makeTechnicalAnalysis({ mobileFriendly: true });
      const result = scoreTechnicalReadiness(analysis);
      expect(result.mobileFriendly).toBe(true);
    });
  });
});
