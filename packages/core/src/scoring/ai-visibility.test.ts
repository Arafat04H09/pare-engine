// Owner: S11 (Scoring Test Suite)
// Tests for ai-visibility.ts (S2 stub — S9 implements the real scorer)
// Current stub takes 0 args, returns 0/30 with zeroed-out fields.

import { describe, it, expect } from 'vitest';
import { scoreAIVisibility } from './ai-visibility.js';
import { SCORING_WEIGHTS } from '../contracts/scoring.contract.js';
import type { MultiProviderResult } from '../contracts/query.contract.js';

const emptyProviderResult: MultiProviderResult = {
  brand: 'test',
  domain: 'test.com',
  responses: [],
  failedPlatforms: [],
  queriedAt: new Date(),
};

describe('scoreAIVisibility (zero input)', () => {
  const result = scoreAIVisibility([], emptyProviderResult);

  describe('zero input (stub returns zero)', () => {
    it('returns score of 0', () => {
      expect(result.score).toBe(0);
    });

    it('returns maxScore of 30', () => {
      expect(result.maxScore).toBe(30);
    });

    it('maxScore matches canonical weight', () => {
      expect(result.maxScore).toBe(SCORING_WEIGHTS.aiVisibility);
    });

    it('returns mentionRate of 0', () => {
      expect(result.mentionRate).toBe(0);
    });

    it('returns citationRate of 0', () => {
      expect(result.citationRate).toBe(0);
    });

    it('returns avgPosition as null', () => {
      expect(result.avgPosition).toBeNull();
    });

    it('returns zeroed sentimentBreakdown', () => {
      expect(result.sentimentBreakdown).toEqual({
        positive: 0,
        neutral: 0,
        negative: 0,
      });
    });

    it('returns platformCoverage object', () => {
      expect(result.platformCoverage).toBeDefined();
      expect(typeof result.platformCoverage).toBe('object');
    });

    it('returns providersUsed >= 1', () => {
      expect(result.providersUsed).toBeGreaterThanOrEqual(1);
    });

    it('returns providersAvailable >= providersUsed', () => {
      expect(result.providersAvailable).toBeGreaterThanOrEqual(result.providersUsed);
    });
  });

  describe('score constraints', () => {
    it('score is not negative', () => {
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('score does not exceed maxScore (30)', () => {
      expect(result.score).toBeLessThanOrEqual(30);
    });

    it('breakdown values are all numbers', () => {
      for (const [key, value] of Object.entries(result.breakdown)) {
        expect(typeof value).toBe('number');
      }
    });

    it('breakdown values are non-negative', () => {
      for (const [key, value] of Object.entries(result.breakdown)) {
        expect(value).toBeGreaterThanOrEqual(0);
      }
    });

    it('notes is an array of strings', () => {
      expect(Array.isArray(result.notes)).toBe(true);
      for (const note of result.notes) {
        expect(typeof note).toBe('string');
      }
    });

    it('notes is an array', () => {
      expect(Array.isArray(result.notes)).toBe(true);
    });
  });

  describe('type conformance', () => {
    it('has all required AIVisibilityScore fields', () => {
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('maxScore');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('notes');
      expect(result).toHaveProperty('mentionRate');
      expect(result).toHaveProperty('citationRate');
      expect(result).toHaveProperty('avgPosition');
      expect(result).toHaveProperty('sentimentBreakdown');
      expect(result).toHaveProperty('platformCoverage');
      expect(result).toHaveProperty('providersUsed');
      expect(result).toHaveProperty('providersAvailable');
    });

    it('mentionRate is between 0 and 1', () => {
      expect(result.mentionRate).toBeGreaterThanOrEqual(0);
      expect(result.mentionRate).toBeLessThanOrEqual(1);
    });

    it('citationRate is between 0 and 1', () => {
      expect(result.citationRate).toBeGreaterThanOrEqual(0);
      expect(result.citationRate).toBeLessThanOrEqual(1);
    });

    it('sentimentBreakdown values are non-negative integers', () => {
      expect(Number.isInteger(result.sentimentBreakdown.positive)).toBe(true);
      expect(Number.isInteger(result.sentimentBreakdown.neutral)).toBe(true);
      expect(Number.isInteger(result.sentimentBreakdown.negative)).toBe(true);
      expect(result.sentimentBreakdown.positive).toBeGreaterThanOrEqual(0);
      expect(result.sentimentBreakdown.neutral).toBeGreaterThanOrEqual(0);
      expect(result.sentimentBreakdown.negative).toBeGreaterThanOrEqual(0);
    });

    it('providersUsed is a positive integer', () => {
      expect(Number.isInteger(result.providersUsed)).toBe(true);
      expect(result.providersUsed).toBeGreaterThanOrEqual(1);
    });

    it('providersAvailable is a positive integer', () => {
      expect(Number.isInteger(result.providersAvailable)).toBe(true);
      expect(result.providersAvailable).toBeGreaterThanOrEqual(1);
    });
  });
});
