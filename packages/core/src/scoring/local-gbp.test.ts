// Owner: S11 (Scoring Test Suite)
// Tests for local-gbp.ts (S2 stub -- S8 implements the real scorer)
// Current stub takes 0 args, returns 0/15 with zeroed-out fields.

import { describe, it, expect } from 'vitest';
import { scoreLocalGBP } from './local-gbp.js';
import { SCORING_WEIGHTS } from '../contracts/scoring.contract.js';

describe('scoreLocalGBP (stub)', () => {
  const result = scoreLocalGBP();

  describe('zero input (stub returns zero)', () => {
    it('returns score of 0', () => {
      expect(result.score).toBe(0);
    });

    it('returns maxScore of 15', () => {
      expect(result.maxScore).toBe(15);
    });

    it('maxScore matches canonical weight', () => {
      expect(result.maxScore).toBe(SCORING_WEIGHTS.localGbp);
    });

    it('returns gbpComplete as false', () => {
      expect(result.gbpComplete).toBe(false);
    });

    it('returns reviewScore of 0', () => {
      expect(result.reviewScore).toBe(0);
    });

    it('returns napConsistent as false', () => {
      expect(result.napConsistent).toBe(false);
    });
  });

  describe('score constraints', () => {
    it('score is not negative', () => {
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('score does not exceed maxScore (15)', () => {
      expect(result.score).toBeLessThanOrEqual(15);
    });

    it('breakdown values are all numbers', () => {
      for (const [, value] of Object.entries(result.breakdown)) {
        expect(typeof value).toBe('number');
      }
    });

    it('breakdown values are non-negative', () => {
      for (const [, value] of Object.entries(result.breakdown)) {
        expect(value).toBeGreaterThanOrEqual(0);
      }
    });

    it('notes is an array of strings', () => {
      expect(Array.isArray(result.notes)).toBe(true);
      for (const note of result.notes) {
        expect(typeof note).toBe('string');
      }
    });

    it('stub includes an implementation note', () => {
      expect(result.notes.length).toBeGreaterThan(0);
      expect(result.notes.some((n) => n.toLowerCase().includes('stub') || n.toLowerCase().includes('not yet'))).toBe(true);
    });
  });

  describe('type conformance', () => {
    it('has all required GBPScore fields', () => {
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('maxScore');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('notes');
      expect(result).toHaveProperty('gbpComplete');
      expect(result).toHaveProperty('reviewScore');
      expect(result).toHaveProperty('napConsistent');
    });

    it('gbpComplete is a boolean', () => {
      expect(typeof result.gbpComplete).toBe('boolean');
    });

    it('reviewScore is a number', () => {
      expect(typeof result.reviewScore).toBe('number');
    });

    it('napConsistent is a boolean', () => {
      expect(typeof result.napConsistent).toBe('boolean');
    });
  });

  describe('breakdown sub-scores', () => {
    it('has breakdown keys', () => {
      expect(Object.keys(result.breakdown).length).toBeGreaterThan(0);
    });

    it('all sub-scores are 0 in stub', () => {
      for (const [, value] of Object.entries(result.breakdown)) {
        expect(value).toBe(0);
      }
    });

    it('all sub-scores sum to total score', () => {
      const sum = Object.values(result.breakdown).reduce((a, b) => a + b, 0);
      expect(sum).toBe(result.score);
    });
  });

  describe('max score cap verification', () => {
    it('maxScore is exactly 15 (per SCORING_ALGORITHM.md)', () => {
      expect(result.maxScore).toBe(15);
    });

    it('score never exceeds maxScore', () => {
      expect(result.score).toBeLessThanOrEqual(result.maxScore);
    });
  });

  describe('graceful degradation', () => {
    // When S8 implements the real scorer, it should handle:
    // - Missing GBP data (no Place ID)
    // - Missing NAP sources
    // - Zero reviews
    // For the stub, all these return 0

    it('stub returns valid score structure even without input', () => {
      // Stub takes 0 args, so graceful by definition
      const stubResult = scoreLocalGBP();
      expect(stubResult.score).toBe(0);
      expect(stubResult.maxScore).toBe(15);
      expect(stubResult.gbpComplete).toBe(false);
      expect(stubResult.napConsistent).toBe(false);
    });
  });
});
