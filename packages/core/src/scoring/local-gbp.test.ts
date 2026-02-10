// Owner: S11 (Scoring Test Suite)
// Tests for local-gbp.ts (S8's real implementation)
// scoreLocalGBP takes optional GBPAnalysisOutput, returns GBPScore (0-15).

import { describe, it, expect } from 'vitest';
import { scoreLocalGBP } from './local-gbp.js';
import { SCORING_WEIGHTS } from '../contracts/scoring.contract.js';
import type { GBPAnalysisOutput } from '../contracts/analysis.contract.js';

// --- Test data factory ---

function makeGBPAnalysis(overrides: Partial<GBPAnalysisOutput> = {}): GBPAnalysisOutput {
  return {
    placeId: 'placeId' in overrides ? overrides.placeId : 'ChIJ_____test_place_id',
    businessName: overrides.businessName ?? 'Test Business',
    rating: overrides.rating ?? 0,
    reviewCount: overrides.reviewCount ?? 0,
    photoCount: overrides.photoCount ?? 0,
    hasDescription: overrides.hasDescription ?? false,
    descriptionOptimized: overrides.descriptionOptimized ?? false,
    categoryAccuracy: overrides.categoryAccuracy ?? false,
    primaryCategory: overrides.primaryCategory,
    additionalCategories: overrides.additionalCategories ?? [],
    hasQAndA: overrides.hasQAndA ?? false,
    hoursComplete: overrides.hoursComplete ?? false,
    websiteUrl: overrides.websiteUrl,
    phone: overrides.phone,
    address: overrides.address,
    napConsistent: overrides.napConsistent ?? false,
    napSources: overrides.napSources ?? [],
    analyzedAt: overrides.analyzedAt ?? new Date(),
  };
}

// --- Tests ---

describe('scoreLocalGBP', () => {
  describe('zero input (no analysis provided)', () => {
    it('returns score 0 when no argument provided', () => {
      const result = scoreLocalGBP();
      expect(result.score).toBe(0);
    });

    it('returns maxScore of 15', () => {
      const result = scoreLocalGBP();
      expect(result.maxScore).toBe(15);
    });

    it('maxScore matches canonical weight', () => {
      const result = scoreLocalGBP();
      expect(result.maxScore).toBe(SCORING_WEIGHTS.localGbp);
    });

    it('returns all zero breakdown values', () => {
      const result = scoreLocalGBP();
      for (const [, value] of Object.entries(result.breakdown)) {
        expect(value).toBe(0);
      }
    });

    it('returns informative note', () => {
      const result = scoreLocalGBP();
      expect(result.notes.length).toBeGreaterThan(0);
    });

    it('returns gbpComplete as false', () => {
      const result = scoreLocalGBP();
      expect(result.gbpComplete).toBe(false);
    });

    it('returns reviewScore of 0', () => {
      const result = scoreLocalGBP();
      expect(result.reviewScore).toBe(0);
    });

    it('returns napConsistent as false', () => {
      const result = scoreLocalGBP();
      expect(result.napConsistent).toBe(false);
    });
  });

  describe('zero input (no Place ID)', () => {
    it('returns 0 when placeId is missing', () => {
      const analysis = makeGBPAnalysis({ placeId: undefined });
      const result = scoreLocalGBP(analysis);
      expect(result.score).toBe(0);
    });

    it('returns note about creating GBP', () => {
      const analysis = makeGBPAnalysis({ placeId: undefined });
      const result = scoreLocalGBP(analysis);
      expect(result.notes.some((n) => n.toLowerCase().includes('no google business profile') || n.toLowerCase().includes('create'))).toBe(true);
    });
  });

  describe('zero input (all fields empty/false)', () => {
    it('returns very low score for bare GBP profile', () => {
      const analysis = makeGBPAnalysis({
        hasDescription: false,
        descriptionOptimized: false,
        categoryAccuracy: false,
        additionalCategories: [],
        hoursComplete: false,
        photoCount: 0,
        rating: 0,
        reviewCount: 0,
        hasQAndA: false,
        napSources: [],
      });
      const result = scoreLocalGBP(analysis);
      expect(result.score).toBeLessThanOrEqual(3);
    });
  });

  describe('perfect input', () => {
    it('returns maxScore (15) for fully optimized GBP', () => {
      const analysis = makeGBPAnalysis({
        hasDescription: true,
        descriptionOptimized: true,
        categoryAccuracy: true,
        primaryCategory: 'Dentist',
        additionalCategories: ['Emergency Dental Service', 'Cosmetic Dentist'],
        hoursComplete: true,
        phone: '555-0123',
        websiteUrl: 'https://example.com',
        photoCount: 15,
        rating: 4.8,
        reviewCount: 100,
        hasQAndA: true,
        napConsistent: true,
        napSources: [
          { source: 'Yelp', nameMatch: true, addressMatch: true, phoneMatch: true },
          { source: 'BBB', nameMatch: true, addressMatch: true, phoneMatch: true },
          { source: 'YellowPages', nameMatch: true, addressMatch: true, phoneMatch: true },
          { source: 'Healthgrades', nameMatch: true, addressMatch: true, phoneMatch: true },
          { source: 'Zocdoc', nameMatch: true, addressMatch: true, phoneMatch: true },
        ],
      });
      const result = scoreLocalGBP(analysis);
      expect(result.score).toBe(15);
    });

    it('score does not exceed 15', () => {
      const analysis = makeGBPAnalysis({
        hasDescription: true,
        descriptionOptimized: true,
        categoryAccuracy: true,
        primaryCategory: 'Dentist',
        additionalCategories: ['Emergency Dental Service', 'Cosmetic Dentist', 'Pediatric Dentist'],
        hoursComplete: true,
        phone: '555-0123',
        websiteUrl: 'https://example.com',
        photoCount: 100,
        rating: 5.0,
        reviewCount: 500,
        hasQAndA: true,
        napConsistent: true,
        napSources: Array.from({ length: 10 }, (_, i) => ({
          source: `Dir${i}`,
          nameMatch: true,
          addressMatch: true,
          phoneMatch: true,
        })),
      });
      const result = scoreLocalGBP(analysis);
      expect(result.score).toBeLessThanOrEqual(15);
    });
  });

  describe('typical input', () => {
    it('scores mid-range for average local business', () => {
      const analysis = makeGBPAnalysis({
        hasDescription: true,
        descriptionOptimized: false,
        categoryAccuracy: true,
        primaryCategory: 'Plumber',
        additionalCategories: ['Emergency Plumber'],
        hoursComplete: true,
        phone: '555-0100',
        websiteUrl: 'https://plumber.example.com',
        photoCount: 6,
        rating: 4.2,
        reviewCount: 30,
        hasQAndA: false,
        napConsistent: true,
        napSources: [
          { source: 'Yelp', nameMatch: true, addressMatch: true, phoneMatch: true },
          { source: 'BBB', nameMatch: true, addressMatch: false, phoneMatch: true },
        ],
      });
      const result = scoreLocalGBP(analysis);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(15);
    });
  });

  describe('GBP completeness sub-score (0-5)', () => {
    it('gives credit for description', () => {
      const withDesc = scoreLocalGBP(makeGBPAnalysis({ hasDescription: true }));
      const withoutDesc = scoreLocalGBP(makeGBPAnalysis({ hasDescription: false }));
      expect(withDesc.breakdown['gbpCompleteness']).toBeGreaterThan(withoutDesc.breakdown['gbpCompleteness']);
    });

    it('gives bonus for optimized description', () => {
      const optimized = scoreLocalGBP(makeGBPAnalysis({ hasDescription: true, descriptionOptimized: true }));
      const notOptimized = scoreLocalGBP(makeGBPAnalysis({ hasDescription: true, descriptionOptimized: false }));
      expect(optimized.breakdown['gbpCompleteness']).toBeGreaterThan(notOptimized.breakdown['gbpCompleteness']);
    });

    it('gives credit for photos', () => {
      const withPhotos = scoreLocalGBP(makeGBPAnalysis({ photoCount: 12 }));
      const noPhotos = scoreLocalGBP(makeGBPAnalysis({ photoCount: 0 }));
      expect(withPhotos.breakdown['gbpCompleteness']).toBeGreaterThan(noPhotos.breakdown['gbpCompleteness']);
    });

    it('gives credit for complete hours', () => {
      const withHours = scoreLocalGBP(makeGBPAnalysis({ hoursComplete: true }));
      const noHours = scoreLocalGBP(makeGBPAnalysis({ hoursComplete: false }));
      expect(withHours.breakdown['gbpCompleteness']).toBeGreaterThan(noHours.breakdown['gbpCompleteness']);
    });

    it('gives credit for phone and website', () => {
      const withContact = scoreLocalGBP(makeGBPAnalysis({ phone: '555-0123', websiteUrl: 'https://example.com' }));
      const noContact = scoreLocalGBP(makeGBPAnalysis({ phone: undefined, websiteUrl: undefined }));
      expect(withContact.breakdown['gbpCompleteness']).toBeGreaterThan(noContact.breakdown['gbpCompleteness']);
    });

    it('sub-score capped at 5', () => {
      const analysis = makeGBPAnalysis({
        hasDescription: true,
        descriptionOptimized: true,
        categoryAccuracy: true,
        primaryCategory: 'Test',
        additionalCategories: ['Cat1', 'Cat2'],
        hoursComplete: true,
        phone: '555-0123',
        websiteUrl: 'https://example.com',
        photoCount: 50,
      });
      const result = scoreLocalGBP(analysis);
      expect(result.breakdown['gbpCompleteness']).toBeLessThanOrEqual(5);
    });
  });

  describe('review quality sub-score (0-4)', () => {
    it('gives higher score for 4.5+ rating', () => {
      const excellent = scoreLocalGBP(makeGBPAnalysis({ rating: 4.8, reviewCount: 50, hasQAndA: true }));
      const good = scoreLocalGBP(makeGBPAnalysis({ rating: 4.0, reviewCount: 50, hasQAndA: true }));
      expect(excellent.breakdown['reviewQuality']).toBeGreaterThanOrEqual(good.breakdown['reviewQuality']);
    });

    it('gives credit for review count >= 50', () => {
      const manyReviews = scoreLocalGBP(makeGBPAnalysis({ rating: 4.5, reviewCount: 60 }));
      const fewReviews = scoreLocalGBP(makeGBPAnalysis({ rating: 4.5, reviewCount: 3 }));
      expect(manyReviews.breakdown['reviewQuality']).toBeGreaterThan(fewReviews.breakdown['reviewQuality']);
    });

    it('gives credit for Q&A presence', () => {
      const withQA = scoreLocalGBP(makeGBPAnalysis({ rating: 4.0, reviewCount: 20, hasQAndA: true }));
      const noQA = scoreLocalGBP(makeGBPAnalysis({ rating: 4.0, reviewCount: 20, hasQAndA: false }));
      expect(withQA.breakdown['reviewQuality']).toBeGreaterThan(noQA.breakdown['reviewQuality']);
    });

    it('sub-score capped at 4', () => {
      const analysis = makeGBPAnalysis({
        rating: 5.0,
        reviewCount: 500,
        hasQAndA: true,
      });
      const result = scoreLocalGBP(analysis);
      expect(result.breakdown['reviewQuality']).toBeLessThanOrEqual(4);
    });

    it('returns 0 review quality for 0 rating and 0 reviews', () => {
      const result = scoreLocalGBP(makeGBPAnalysis({ rating: 0, reviewCount: 0, hasQAndA: false }));
      expect(result.breakdown['reviewQuality']).toBe(0);
    });
  });

  describe('NAP consistency sub-score (0-3)', () => {
    it('gives full score for consistent NAP across directories', () => {
      const analysis = makeGBPAnalysis({
        napConsistent: true,
        napSources: [
          { source: 'Yelp', nameMatch: true, addressMatch: true, phoneMatch: true },
          { source: 'BBB', nameMatch: true, addressMatch: true, phoneMatch: true },
        ],
      });
      const result = scoreLocalGBP(analysis);
      expect(result.breakdown['napConsistency']).toBe(3);
    });

    it('gives partial score for partially consistent NAP', () => {
      const analysis = makeGBPAnalysis({
        napConsistent: false,
        napSources: [
          { source: 'Yelp', nameMatch: true, addressMatch: false, phoneMatch: true },
          { source: 'BBB', nameMatch: true, addressMatch: true, phoneMatch: false },
        ],
      });
      const result = scoreLocalGBP(analysis);
      expect(result.breakdown['napConsistency']).toBeGreaterThan(0);
      expect(result.breakdown['napConsistency']).toBeLessThan(3);
    });

    it('gives reduced score with no external sources', () => {
      const result = scoreLocalGBP(makeGBPAnalysis({ napSources: [], napConsistent: false }));
      expect(result.breakdown['napConsistency']).toBe(0);
    });

    it('gives partial credit when napConsistent true but no sources', () => {
      const result = scoreLocalGBP(makeGBPAnalysis({ napSources: [], napConsistent: true }));
      expect(result.breakdown['napConsistency']).toBeGreaterThan(0);
      expect(result.breakdown['napConsistency']).toBeLessThanOrEqual(3);
    });

    it('sub-score capped at 3', () => {
      const analysis = makeGBPAnalysis({
        napConsistent: true,
        napSources: Array.from({ length: 10 }, (_, i) => ({
          source: `Dir${i}`,
          nameMatch: true,
          addressMatch: true,
          phoneMatch: true,
        })),
      });
      const result = scoreLocalGBP(analysis);
      expect(result.breakdown['napConsistency']).toBeLessThanOrEqual(3);
    });
  });

  describe('directory presence sub-score (0-3)', () => {
    it('returns 0 for no directories', () => {
      const result = scoreLocalGBP(makeGBPAnalysis({ napSources: [] }));
      expect(result.breakdown['directoryPresence']).toBe(0);
    });

    it('returns 1 for 1-2 directories', () => {
      const analysis = makeGBPAnalysis({
        napSources: [
          { source: 'Yelp', nameMatch: true, addressMatch: true, phoneMatch: true },
        ],
      });
      const result = scoreLocalGBP(analysis);
      expect(result.breakdown['directoryPresence']).toBe(1);
    });

    it('returns 2 for 3-4 directories', () => {
      const analysis = makeGBPAnalysis({
        napSources: [
          { source: 'Yelp', nameMatch: true, addressMatch: true, phoneMatch: true },
          { source: 'BBB', nameMatch: true, addressMatch: true, phoneMatch: true },
          { source: 'YellowPages', nameMatch: true, addressMatch: true, phoneMatch: true },
        ],
      });
      const result = scoreLocalGBP(analysis);
      expect(result.breakdown['directoryPresence']).toBe(2);
    });

    it('returns 3 for 5+ directories', () => {
      const analysis = makeGBPAnalysis({
        napSources: Array.from({ length: 5 }, (_, i) => ({
          source: `Dir${i}`,
          nameMatch: true,
          addressMatch: true,
          phoneMatch: true,
        })),
      });
      const result = scoreLocalGBP(analysis);
      expect(result.breakdown['directoryPresence']).toBe(3);
    });

    it('sub-score capped at 3', () => {
      const analysis = makeGBPAnalysis({
        napSources: Array.from({ length: 20 }, (_, i) => ({
          source: `Dir${i}`,
          nameMatch: true,
          addressMatch: true,
          phoneMatch: true,
        })),
      });
      const result = scoreLocalGBP(analysis);
      expect(result.breakdown['directoryPresence']).toBeLessThanOrEqual(3);
    });
  });

  describe('edge cases', () => {
    it('returns integer score', () => {
      const analysis = makeGBPAnalysis({
        hasDescription: true,
        descriptionOptimized: false,
        categoryAccuracy: true,
        primaryCategory: 'Plumber',
        additionalCategories: ['Cat1'],
        hoursComplete: true,
        phone: '555-0123',
        photoCount: 7,
        rating: 3.7,
        reviewCount: 25,
        hasQAndA: false,
        napConsistent: true,
        napSources: [
          { source: 'Yelp', nameMatch: true, addressMatch: true, phoneMatch: false },
        ],
      });
      const result = scoreLocalGBP(analysis);
      expect(Number.isInteger(result.score)).toBe(true);
    });

    it('handles edge rating values', () => {
      // Rating exactly at 4.0 threshold
      const analysis = makeGBPAnalysis({ rating: 4.0, reviewCount: 50 });
      const result = scoreLocalGBP(analysis);
      expect(result.breakdown['reviewQuality']).toBeGreaterThan(0);
    });

    it('gbpComplete is true when completeness is >= 80% of max', () => {
      const analysis = makeGBPAnalysis({
        hasDescription: true,
        descriptionOptimized: true,
        categoryAccuracy: true,
        primaryCategory: 'Test',
        additionalCategories: ['Cat1', 'Cat2'],
        hoursComplete: true,
        phone: '555-0123',
        websiteUrl: 'https://example.com',
        photoCount: 12,
      });
      const result = scoreLocalGBP(analysis);
      expect(result.gbpComplete).toBe(true);
    });

    it('gbpComplete is false when completeness is low', () => {
      const analysis = makeGBPAnalysis({
        hasDescription: false,
        photoCount: 0,
      });
      const result = scoreLocalGBP(analysis);
      expect(result.gbpComplete).toBe(false);
    });
  });

  describe('max score cap', () => {
    it('never returns score above 15', () => {
      const analysis = makeGBPAnalysis({
        hasDescription: true,
        descriptionOptimized: true,
        categoryAccuracy: true,
        primaryCategory: 'Dentist',
        additionalCategories: ['Cat1', 'Cat2', 'Cat3'],
        hoursComplete: true,
        phone: '555-0123',
        websiteUrl: 'https://example.com',
        photoCount: 100,
        rating: 5.0,
        reviewCount: 1000,
        hasQAndA: true,
        napConsistent: true,
        napSources: Array.from({ length: 20 }, (_, i) => ({
          source: `Dir${i}`,
          nameMatch: true,
          addressMatch: true,
          phoneMatch: true,
        })),
      });
      const result = scoreLocalGBP(analysis);
      expect(result.score).toBeLessThanOrEqual(15);
    });
  });

  describe('breakdown structure', () => {
    it('has expected sub-score keys', () => {
      const result = scoreLocalGBP();
      expect(result.breakdown).toHaveProperty('gbpCompleteness');
      expect(result.breakdown).toHaveProperty('reviewQuality');
      expect(result.breakdown).toHaveProperty('napConsistency');
      expect(result.breakdown).toHaveProperty('directoryPresence');
    });

    it('all breakdown values are non-negative', () => {
      const analysis = makeGBPAnalysis();
      const result = scoreLocalGBP(analysis);
      for (const [, value] of Object.entries(result.breakdown)) {
        expect(value).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('type conformance', () => {
    it('has all required GBPScore fields', () => {
      const result = scoreLocalGBP();
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('maxScore');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('notes');
      expect(result).toHaveProperty('gbpComplete');
      expect(result).toHaveProperty('reviewScore');
      expect(result).toHaveProperty('napConsistent');
    });

    it('gbpComplete is a boolean', () => {
      expect(typeof scoreLocalGBP().gbpComplete).toBe('boolean');
    });

    it('reviewScore is a number', () => {
      expect(typeof scoreLocalGBP().reviewScore).toBe('number');
    });

    it('napConsistent is a boolean', () => {
      expect(typeof scoreLocalGBP().napConsistent).toBe('boolean');
    });
  });

  describe('notes generation', () => {
    it('generates notes about missing description', () => {
      const result = scoreLocalGBP(makeGBPAnalysis({ hasDescription: false }));
      expect(result.notes.some((n) => n.toLowerCase().includes('description'))).toBe(true);
    });

    it('generates notes about low review count', () => {
      const result = scoreLocalGBP(makeGBPAnalysis({ reviewCount: 3, rating: 4.0 }));
      expect(result.notes.some((n) => n.toLowerCase().includes('review'))).toBe(true);
    });

    it('generates notes about no directory listings', () => {
      const result = scoreLocalGBP(makeGBPAnalysis({ napSources: [] }));
      expect(result.notes.some((n) => n.toLowerCase().includes('directory') || n.toLowerCase().includes('listing'))).toBe(true);
    });
  });
});
