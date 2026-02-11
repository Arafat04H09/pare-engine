// D2: Unit tests for parse-jsonld tool functions
import { describe, it, expect } from 'vitest';
import {
  JsonLdParseError,
  getRequiredSchemaTypes,
  getRecommendedSchemaTypes,
  parseJsonLd,
} from './parse-jsonld.js';

// ---------------------------------------------------------------------------
// JsonLdParseError
// ---------------------------------------------------------------------------

describe('JsonLdParseError', () => {
  it('should have correct name and code', () => {
    const err = new JsonLdParseError('parse failed', 'INVALID_JSON');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('JsonLdParseError');
    expect(err.code).toBe('INVALID_JSON');
  });
});

// ---------------------------------------------------------------------------
// getRequiredSchemaTypes
// ---------------------------------------------------------------------------

describe('getRequiredSchemaTypes', () => {
  it('should always include base required types', () => {
    const types = getRequiredSchemaTypes('unknown');
    expect(types).toContain('Organization');
    expect(types).toContain('LocalBusiness');
    expect(types).toContain('WebSite');
    expect(types).toContain('BreadcrumbList');
  });

  it('should include dental-specific types', () => {
    const types = getRequiredSchemaTypes('dental');
    expect(types).toContain('Dentist');
    expect(types).toContain('FAQPage');
    expect(types).toContain('MedicalProcedure');
  });

  it('should include legal-specific types', () => {
    const types = getRequiredSchemaTypes('legal');
    expect(types).toContain('LegalService');
    expect(types).toContain('Attorney');
  });

  it('should include hvac-specific types', () => {
    const types = getRequiredSchemaTypes('hvac');
    expect(types).toContain('HomeAndConstructionBusiness');
    expect(types).toContain('Service');
  });

  it('should handle case-insensitive verticals', () => {
    const types = getRequiredSchemaTypes('DENTAL');
    expect(types).toContain('Dentist');
  });

  it('should deduplicate types', () => {
    const types = getRequiredSchemaTypes('dental');
    const uniqueTypes = [...new Set(types)];
    expect(types).toEqual(uniqueTypes);
  });

  it('should return only base types for unknown vertical', () => {
    const types = getRequiredSchemaTypes('unknown_vertical');
    expect(types).toHaveLength(4); // Organization, LocalBusiness, WebSite, BreadcrumbList
  });
});

// ---------------------------------------------------------------------------
// getRecommendedSchemaTypes
// ---------------------------------------------------------------------------

describe('getRecommendedSchemaTypes', () => {
  it('should return the recommended types list', () => {
    const types = getRecommendedSchemaTypes();
    expect(types).toContain('Person');
    expect(types).toContain('AggregateRating');
    expect(types).toContain('Review');
    expect(types).toContain('Article');
    expect(types).toContain('HowTo');
    expect(types).toContain('VideoObject');
  });

  it('should return a new array each time', () => {
    const types1 = getRecommendedSchemaTypes();
    const types2 = getRecommendedSchemaTypes();
    expect(types1).toEqual(types2);
    expect(types1).not.toBe(types2); // different reference
  });
});

// ---------------------------------------------------------------------------
// parseJsonLd
// ---------------------------------------------------------------------------

describe('parseJsonLd', () => {
  it('should extract types from valid JSON-LD', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
          {"@context": "https://schema.org", "@type": "Organization", "name": "Test"}
        </script>
      </head><body></body></html>
    `;
    const result = parseJsonLd(html, 'https://example.com');
    expect(result.presentTypes).toContain('Organization');
    expect(result.url).toBe('https://example.com');
    expect(result.rawJsonLd).toHaveLength(1);
  });

  it('should handle multiple JSON-LD blocks', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
          {"@context": "https://schema.org", "@type": "Organization", "name": "Test"}
        </script>
        <script type="application/ld+json">
          {"@context": "https://schema.org", "@type": "LocalBusiness", "name": "Shop"}
        </script>
      </head><body></body></html>
    `;
    const result = parseJsonLd(html, 'https://example.com');
    expect(result.presentTypes).toContain('Organization');
    expect(result.presentTypes).toContain('LocalBusiness');
    expect(result.rawJsonLd).toHaveLength(2);
  });

  it('should handle @graph structure', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
          {"@context": "https://schema.org", "@graph": [
            {"@type": "WebSite", "name": "Example"},
            {"@type": "BreadcrumbList", "itemListElement": []}
          ]}
        </script>
      </head><body></body></html>
    `;
    const result = parseJsonLd(html, 'https://example.com');
    expect(result.presentTypes).toContain('WebSite');
    expect(result.presentTypes).toContain('BreadcrumbList');
  });

  it('should extract types from nested properties', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "aggregateRating": {"@type": "AggregateRating", "ratingValue": 4.5}
          }
        </script>
      </head><body></body></html>
    `;
    const result = parseJsonLd(html, 'https://example.com');
    expect(result.presentTypes).toContain('LocalBusiness');
    expect(result.presentTypes).toContain('AggregateRating');
  });

  it('should handle invalid JSON gracefully', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
          {invalid json here}
        </script>
      </head><body></body></html>
    `;
    const result = parseJsonLd(html, 'https://example.com');
    expect(result.presentTypes).toHaveLength(0);
    expect(result.validationErrors.length).toBeGreaterThan(0);
    expect(result.validationErrors.some((e) => e.includes('Invalid JSON-LD syntax'))).toBe(true);
  });

  it('should handle empty JSON-LD script block', () => {
    const html = `
      <html><head>
        <script type="application/ld+json"></script>
      </head><body></body></html>
    `;
    const result = parseJsonLd(html, 'https://example.com');
    expect(result.validationErrors).toContain('Empty JSON-LD script block');
  });

  it('should handle HTML with no JSON-LD', () => {
    const html = '<html><head></head><body><p>No schema</p></body></html>';
    const result = parseJsonLd(html, 'https://example.com');
    expect(result.presentTypes).toHaveLength(0);
    expect(result.rawJsonLd).toHaveLength(0);
  });

  it('should detect missing @context', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
          {"@type": "Organization", "name": "Test"}
        </script>
      </head><body></body></html>
    `;
    const result = parseJsonLd(html, 'https://example.com');
    expect(result.validationErrors.some((e) => e.includes('@context'))).toBe(true);
  });

  it('should detect missing @type', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
          {"@context": "https://schema.org", "name": "No type here"}
        </script>
      </head><body></body></html>
    `;
    const result = parseJsonLd(html, 'https://example.com');
    expect(result.validationErrors.some((e) => e.includes('@type'))).toBe(true);
  });

  it('should deduplicate extracted types', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
          {"@context": "https://schema.org", "@type": "Organization", "name": "A"}
        </script>
        <script type="application/ld+json">
          {"@context": "https://schema.org", "@type": "Organization", "name": "B"}
        </script>
      </head><body></body></html>
    `;
    const result = parseJsonLd(html, 'https://example.com');
    const orgCount = result.presentTypes.filter((t) => t === 'Organization').length;
    expect(orgCount).toBe(1);
  });

  it('should handle array @type', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
          {"@context": "https://schema.org", "@type": ["Organization", "LocalBusiness"], "name": "Test"}
        </script>
      </head><body></body></html>
    `;
    const result = parseJsonLd(html, 'https://example.com');
    expect(result.presentTypes).toContain('Organization');
    expect(result.presentTypes).toContain('LocalBusiness');
  });
});
