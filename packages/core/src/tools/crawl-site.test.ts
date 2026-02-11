// D2: Unit tests for crawl-site tool functions
import { describe, it, expect } from 'vitest';
import {
  CrawlError,
  normalizeDomain,
  validateCrawlInput,
  validateCrawlOutput,
  buildCrawlOutput,
} from './crawl-site.js';

// ---------------------------------------------------------------------------
// CrawlError
// ---------------------------------------------------------------------------

describe('CrawlError', () => {
  it('should have correct name and code', () => {
    const err = new CrawlError('test error', 'TEST_CODE');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('CrawlError');
    expect(err.code).toBe('TEST_CODE');
    expect(err.message).toBe('test error');
  });
});

// ---------------------------------------------------------------------------
// normalizeDomain
// ---------------------------------------------------------------------------

describe('normalizeDomain', () => {
  it('should add https:// to bare domain', () => {
    expect(normalizeDomain('example.com')).toBe('https://example.com');
  });

  it('should add https:// to www domain', () => {
    expect(normalizeDomain('www.example.com')).toBe('https://www.example.com');
  });

  it('should keep existing https://', () => {
    expect(normalizeDomain('https://example.com')).toBe('https://example.com');
  });

  it('should keep existing http://', () => {
    expect(normalizeDomain('http://example.com')).toBe('http://example.com');
  });

  it('should strip trailing slashes', () => {
    expect(normalizeDomain('https://example.com/')).toBe('https://example.com');
    expect(normalizeDomain('https://example.com///')).toBe('https://example.com');
  });

  it('should trim whitespace', () => {
    expect(normalizeDomain('  example.com  ')).toBe('https://example.com');
  });

  it('should handle domain with path', () => {
    expect(normalizeDomain('example.com/page')).toBe('https://example.com/page');
  });
});

// ---------------------------------------------------------------------------
// validateCrawlInput
// ---------------------------------------------------------------------------

describe('validateCrawlInput', () => {
  it('should validate a correct input with defaults', () => {
    const result = validateCrawlInput({ domain: 'example.com' });
    expect(result.domain).toBe('example.com');
    expect(result.maxPages).toBe(20);
    expect(result.formats).toEqual(['markdown', 'html']);
  });

  it('should validate a fully specified input', () => {
    const result = validateCrawlInput({
      domain: 'example.com',
      maxPages: 10,
      formats: ['markdown'],
    });
    expect(result.maxPages).toBe(10);
    expect(result.formats).toEqual(['markdown']);
  });

  it('should reject empty domain', () => {
    expect(() => validateCrawlInput({ domain: '' })).toThrow();
  });

  it('should reject zero maxPages', () => {
    expect(() => validateCrawlInput({ domain: 'example.com', maxPages: 0 })).toThrow();
  });

  it('should reject negative maxPages', () => {
    expect(() => validateCrawlInput({ domain: 'example.com', maxPages: -5 })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// validateCrawlOutput
// ---------------------------------------------------------------------------

describe('validateCrawlOutput', () => {
  const validOutput = {
    domain: 'example.com',
    pages: [
      {
        url: 'https://example.com',
        title: 'Example',
        markdown: '# Hello',
        html: '<h1>Hello</h1>',
        statusCode: 200,
      },
    ],
    discoveredUrls: ['https://example.com/about'],
    errors: [],
    crawledAt: new Date(),
  };

  it('should validate correct output', () => {
    const result = validateCrawlOutput(validOutput);
    expect(result.domain).toBe('example.com');
    expect(result.pages).toHaveLength(1);
  });

  it('should reject output without crawledAt', () => {
    const { crawledAt: _, ...invalid } = validOutput;
    expect(() => validateCrawlOutput(invalid as any)).toThrow();
  });

  it('should reject page with invalid url', () => {
    const invalid = {
      ...validOutput,
      pages: [{ ...validOutput.pages[0], url: 'not-a-url' }],
    };
    expect(() => validateCrawlOutput(invalid)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// buildCrawlOutput
// ---------------------------------------------------------------------------

describe('buildCrawlOutput', () => {
  it('should build and validate a complete CrawlOutput', () => {
    const result = buildCrawlOutput({
      domain: 'example.com',
      pages: [
        {
          url: 'https://example.com',
          markdown: '# Test',
          html: '<h1>Test</h1>',
          statusCode: 200,
        },
      ],
      discoveredUrls: ['https://example.com/about'],
      errors: [],
    });

    expect(result.domain).toBe('example.com');
    expect(result.pages).toHaveLength(1);
    expect(result.crawledAt).toBeInstanceOf(Date);
  });

  it('should include errors in the output', () => {
    const result = buildCrawlOutput({
      domain: 'example.com',
      pages: [],
      discoveredUrls: [],
      errors: [{ url: 'https://example.com/broken', error: 'timeout' }],
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toBe('timeout');
  });
});
