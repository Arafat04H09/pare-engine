// Owner: S11 (Scoring Test Suite)
// Tests for schema-completeness.ts (S7's real implementation)
// scoreSchemaCompleteness requires SchemaAnalysisOutput, returns SchemaScore (0-15).

import { describe, it, expect } from 'vitest';
import { scoreSchemaCompleteness } from './schema-completeness.js';
import { SCORING_WEIGHTS } from '../contracts/scoring.contract.js';
import type { SchemaAnalysisOutput } from '../contracts/analysis.contract.js';

// --- Test data factory ---

function makeSchemaAnalysis(overrides: Partial<SchemaAnalysisOutput> = {}): SchemaAnalysisOutput {
  return {
    pages: overrides.pages ?? [],
    allPresentTypes: overrides.allPresentTypes ?? [],
    allMissingRequired: overrides.allMissingRequired ?? [],
    allMissingRecommended: overrides.allMissingRecommended ?? [],
    totalValidationErrors: overrides.totalValidationErrors ?? 0,
    vertical: overrides.vertical ?? 'dental',
    analyzedAt: overrides.analyzedAt ?? new Date(),
  };
}

// Dental required types: base (Organization, LocalBusiness, WebSite, BreadcrumbList) +
// vertical (Dentist, FAQPage, MedicalProcedure, OpeningHoursSpecification) = 8 types
const DENTAL_REQUIRED = [
  'Organization', 'LocalBusiness', 'WebSite', 'BreadcrumbList',
  'Dentist', 'FAQPage', 'MedicalProcedure', 'OpeningHoursSpecification',
];

const RECOMMENDED = [
  'Person', 'AggregateRating', 'Review', 'Article', 'HowTo',
  'Service', 'Offer', 'Event', 'VideoObject',
];

// --- Tests ---

describe('scoreSchemaCompleteness', () => {
  describe('zero input (no types present)', () => {
    it('returns low score for no schema data', () => {
      const analysis = makeSchemaAnalysis({
        allPresentTypes: [],
        allMissingRequired: DENTAL_REQUIRED,
        allMissingRecommended: RECOMMENDED,
        totalValidationErrors: 0,
      });
      const result = scoreSchemaCompleteness(analysis);
      // 0 required (0/8 * 8 = 0) + 0 recommended (0/9 * 4 = 0) + validation (3 - 0 = 3)
      // Total = 3 (only validation score since no errors)
      expect(result.score).toBeLessThanOrEqual(5);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('returns maxScore of 15', () => {
      const analysis = makeSchemaAnalysis();
      const result = scoreSchemaCompleteness(analysis);
      expect(result.maxScore).toBe(15);
    });

    it('maxScore matches canonical weight', () => {
      const analysis = makeSchemaAnalysis();
      const result = scoreSchemaCompleteness(analysis);
      expect(result.maxScore).toBe(SCORING_WEIGHTS.schemaStructuredData);
    });

    it('generates notes about missing types', () => {
      const analysis = makeSchemaAnalysis({
        allPresentTypes: [],
        allMissingRequired: DENTAL_REQUIRED,
        totalValidationErrors: 0,
      });
      const result = scoreSchemaCompleteness(analysis);
      expect(result.notes.some((n) => n.toLowerCase().includes('missing') || n.toLowerCase().includes('no json-ld'))).toBe(true);
    });
  });

  describe('perfect input (all types present, no errors)', () => {
    it('returns maxScore (15) for complete schema', () => {
      const allTypes = [...DENTAL_REQUIRED, ...RECOMMENDED];
      const analysis = makeSchemaAnalysis({
        allPresentTypes: allTypes,
        allMissingRequired: [],
        allMissingRecommended: [],
        totalValidationErrors: 0,
        vertical: 'dental',
      });
      const result = scoreSchemaCompleteness(analysis);
      // 8/8 * 8 = 8 required + 9/9 * 4 = 4 recommended + 3-0 = 3 validation = 15
      expect(result.score).toBe(15);
    });

    it('score does not exceed 15', () => {
      const allTypes = [...DENTAL_REQUIRED, ...RECOMMENDED, 'ExtraType1', 'ExtraType2'];
      const analysis = makeSchemaAnalysis({
        allPresentTypes: allTypes,
        allMissingRequired: [],
        allMissingRecommended: [],
        totalValidationErrors: 0,
      });
      const result = scoreSchemaCompleteness(analysis);
      expect(result.score).toBeLessThanOrEqual(15);
    });
  });

  describe('typical input', () => {
    it('scores mid-range for partial schema implementation', () => {
      // Only base types present, missing vertical-specific types
      const analysis = makeSchemaAnalysis({
        allPresentTypes: ['Organization', 'LocalBusiness', 'WebSite', 'BreadcrumbList', 'Person', 'AggregateRating'],
        allMissingRequired: ['Dentist', 'FAQPage', 'MedicalProcedure', 'OpeningHoursSpecification'],
        allMissingRecommended: ['Review', 'Article', 'HowTo', 'Service', 'Offer', 'Event', 'VideoObject'],
        totalValidationErrors: 1,
        vertical: 'dental',
      });
      const result = scoreSchemaCompleteness(analysis);
      // 4/8 * 8 = 4 required + 2/9 * 4 ~ 1 recommended + max(0, 3-1) = 2 validation ~ 7
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(15);
    });

    it('handles dental vertical correctly', () => {
      const analysis = makeSchemaAnalysis({ vertical: 'dental', allPresentTypes: [] });
      const result = scoreSchemaCompleteness(analysis);
      // Should evaluate against dental required types
      expect(result.requiredTypesTotal).toBe(8); // 4 base + 4 dental-specific
    });

    it('handles legal vertical correctly', () => {
      const analysis = makeSchemaAnalysis({ vertical: 'legal', allPresentTypes: [] });
      const result = scoreSchemaCompleteness(analysis);
      // base: 4, legal: LegalService, Attorney, FAQPage, Person = 4
      // But FAQPage is not in base. Person is not in base for legal vertical.
      // Actually: base (4) + legal (4) with dedup = should be 8 unique
      expect(result.requiredTypesTotal).toBe(8);
    });

    it('handles unknown vertical with base types only', () => {
      const analysis = makeSchemaAnalysis({ vertical: 'unknown_vertical', allPresentTypes: [] });
      const result = scoreSchemaCompleteness(analysis);
      // Only base types (4)
      expect(result.requiredTypesTotal).toBe(4);
    });
  });

  describe('edge cases', () => {
    it('handles many validation errors (score floors at 0)', () => {
      const analysis = makeSchemaAnalysis({
        allPresentTypes: DENTAL_REQUIRED,
        allMissingRequired: [],
        allMissingRecommended: RECOMMENDED,
        totalValidationErrors: 100,
      });
      const result = scoreSchemaCompleteness(analysis);
      // Validation sub-score: max(0, 3-100) = 0
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.validationErrorCount).toBe(100);
    });

    it('validation score is max(0, 3 - errors)', () => {
      // 0 errors => 3
      const r0 = scoreSchemaCompleteness(makeSchemaAnalysis({ totalValidationErrors: 0, allPresentTypes: [] }));
      expect(r0.breakdown['validation']).toBe(3);

      // 1 error => 2
      const r1 = scoreSchemaCompleteness(makeSchemaAnalysis({ totalValidationErrors: 1, allPresentTypes: [] }));
      expect(r1.breakdown['validation']).toBe(2);

      // 2 errors => 1
      const r2 = scoreSchemaCompleteness(makeSchemaAnalysis({ totalValidationErrors: 2, allPresentTypes: [] }));
      expect(r2.breakdown['validation']).toBe(1);

      // 3 errors => 0
      const r3 = scoreSchemaCompleteness(makeSchemaAnalysis({ totalValidationErrors: 3, allPresentTypes: [] }));
      expect(r3.breakdown['validation']).toBe(0);

      // 4+ errors => still 0
      const r4 = scoreSchemaCompleteness(makeSchemaAnalysis({ totalValidationErrors: 10, allPresentTypes: [] }));
      expect(r4.breakdown['validation']).toBe(0);
    });

    it('returns integer score', () => {
      const analysis = makeSchemaAnalysis({
        allPresentTypes: ['Organization', 'WebSite', 'Person'],
        allMissingRequired: ['LocalBusiness', 'BreadcrumbList', 'Dentist', 'FAQPage', 'MedicalProcedure', 'OpeningHoursSpecification'],
        allMissingRecommended: ['AggregateRating', 'Review', 'Article', 'HowTo', 'Service', 'Offer', 'Event', 'VideoObject'],
        totalValidationErrors: 1,
      });
      const result = scoreSchemaCompleteness(analysis);
      expect(Number.isInteger(result.score)).toBe(true);
    });

    it('handles duplicate types in allPresentTypes', () => {
      const analysis = makeSchemaAnalysis({
        allPresentTypes: ['Organization', 'Organization', 'LocalBusiness', 'LocalBusiness'],
        allMissingRequired: ['WebSite', 'BreadcrumbList', 'Dentist', 'FAQPage', 'MedicalProcedure', 'OpeningHoursSpecification'],
        totalValidationErrors: 0,
      });
      // Implementation uses Set, so duplicates should not double-count
      const result = scoreSchemaCompleteness(analysis);
      expect(result.requiredTypesPresent).toBe(2); // Organization + LocalBusiness
    });
  });

  describe('max score cap', () => {
    it('never returns score above 15', () => {
      // Even with all types present and perfect validation
      const allTypes = [...DENTAL_REQUIRED, ...RECOMMENDED, 'Extra1', 'Extra2', 'Extra3'];
      const analysis = makeSchemaAnalysis({
        allPresentTypes: allTypes,
        allMissingRequired: [],
        allMissingRecommended: [],
        totalValidationErrors: 0,
      });
      const result = scoreSchemaCompleteness(analysis);
      expect(result.score).toBeLessThanOrEqual(15);
    });
  });

  describe('breakdown structure', () => {
    it('has requiredTypes, recommendedTypes, and validation keys', () => {
      const analysis = makeSchemaAnalysis();
      const result = scoreSchemaCompleteness(analysis);
      expect(result.breakdown).toHaveProperty('requiredTypes');
      expect(result.breakdown).toHaveProperty('recommendedTypes');
      expect(result.breakdown).toHaveProperty('validation');
    });

    it('requiredTypes sub-score capped at 8', () => {
      const analysis = makeSchemaAnalysis({
        allPresentTypes: DENTAL_REQUIRED,
        allMissingRequired: [],
        totalValidationErrors: 0,
      });
      const result = scoreSchemaCompleteness(analysis);
      expect(result.breakdown['requiredTypes']).toBeLessThanOrEqual(8);
    });

    it('recommendedTypes sub-score capped at 4', () => {
      const analysis = makeSchemaAnalysis({
        allPresentTypes: RECOMMENDED,
        allMissingRecommended: [],
        totalValidationErrors: 0,
      });
      const result = scoreSchemaCompleteness(analysis);
      expect(result.breakdown['recommendedTypes']).toBeLessThanOrEqual(4);
    });

    it('validation sub-score capped at 3', () => {
      const analysis = makeSchemaAnalysis({
        totalValidationErrors: 0,
        allPresentTypes: [],
      });
      const result = scoreSchemaCompleteness(analysis);
      expect(result.breakdown['validation']).toBeLessThanOrEqual(3);
    });

    it('all breakdown values are non-negative', () => {
      const analysis = makeSchemaAnalysis({ totalValidationErrors: 50, allPresentTypes: [] });
      const result = scoreSchemaCompleteness(analysis);
      for (const [, value] of Object.entries(result.breakdown)) {
        expect(value).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('metadata fields', () => {
    it('tracks requiredTypesPresent count', () => {
      const analysis = makeSchemaAnalysis({
        allPresentTypes: ['Organization', 'LocalBusiness', 'WebSite'],
        allMissingRequired: ['BreadcrumbList', 'Dentist', 'FAQPage', 'MedicalProcedure', 'OpeningHoursSpecification'],
        totalValidationErrors: 0,
      });
      const result = scoreSchemaCompleteness(analysis);
      expect(result.requiredTypesPresent).toBe(3);
    });

    it('tracks requiredTypesTotal count', () => {
      const analysis = makeSchemaAnalysis({ vertical: 'dental', allPresentTypes: [] });
      const result = scoreSchemaCompleteness(analysis);
      expect(result.requiredTypesTotal).toBeGreaterThan(0);
    });

    it('tracks recommendedTypesPresent count', () => {
      const analysis = makeSchemaAnalysis({
        allPresentTypes: ['Person', 'AggregateRating', 'Review'],
        totalValidationErrors: 0,
      });
      const result = scoreSchemaCompleteness(analysis);
      expect(result.recommendedTypesPresent).toBe(3);
    });

    it('tracks validationErrorCount', () => {
      const analysis = makeSchemaAnalysis({ totalValidationErrors: 5, allPresentTypes: [] });
      const result = scoreSchemaCompleteness(analysis);
      expect(result.validationErrorCount).toBe(5);
    });
  });

  describe('vertical coverage', () => {
    const verticals = ['dental', 'legal', 'hvac', 'accounting', 'restaurant', 'real_estate', 'medical'];

    for (const vertical of verticals) {
      it(`produces valid score for ${vertical} vertical`, () => {
        const analysis = makeSchemaAnalysis({
          vertical,
          allPresentTypes: ['Organization', 'LocalBusiness'],
          totalValidationErrors: 0,
        });
        const result = scoreSchemaCompleteness(analysis);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(15);
        expect(result.requiredTypesTotal).toBeGreaterThanOrEqual(4); // At least base types
      });
    }
  });
});
