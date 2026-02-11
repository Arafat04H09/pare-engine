// D2: Unit tests for query-engines tool functions
import { describe, it, expect } from 'vitest';
import {
  QueryError,
  validateQueryInput,
  validateMultiQueryInput,
  buildEngineResponse,
  buildMultiProviderResult,
  buildFailedEngineResponse,
} from './query-engines.js';

// ---------------------------------------------------------------------------
// QueryError
// ---------------------------------------------------------------------------

describe('QueryError', () => {
  it('should have correct name and code', () => {
    const err = new QueryError('query failed', 'PROVIDER_TIMEOUT');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('QueryError');
    expect(err.code).toBe('PROVIDER_TIMEOUT');
    expect(err.message).toBe('query failed');
  });
});

// ---------------------------------------------------------------------------
// validateQueryInput
// ---------------------------------------------------------------------------

describe('validateQueryInput', () => {
  it('should validate a correct query input', () => {
    const result = validateQueryInput({
      brand: 'Acme Dental',
      domain: 'acmedental.com',
      query: 'best dentist in Austin',
      platform: 'chatgpt',
    });
    expect(result.brand).toBe('Acme Dental');
    expect(result.platform).toBe('chatgpt');
    expect(result.competitors).toEqual([]);
  });

  it('should accept all valid platforms', () => {
    for (const platform of ['chatgpt', 'perplexity', 'gemini'] as const) {
      const result = validateQueryInput({
        brand: 'Test',
        domain: 'test.com',
        query: 'test query',
        platform,
      });
      expect(result.platform).toBe(platform);
    }
  });

  it('should reject invalid platform', () => {
    expect(() =>
      validateQueryInput({
        brand: 'Test',
        domain: 'test.com',
        query: 'test query',
        platform: 'claude' as any,
      }),
    ).toThrow();
  });

  it('should reject empty brand', () => {
    expect(() =>
      validateQueryInput({
        brand: '',
        domain: 'test.com',
        query: 'test query',
        platform: 'chatgpt',
      }),
    ).toThrow();
  });

  it('should reject empty query', () => {
    expect(() =>
      validateQueryInput({
        brand: 'Test',
        domain: 'test.com',
        query: '',
        platform: 'chatgpt',
      }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// validateMultiQueryInput
// ---------------------------------------------------------------------------

describe('validateMultiQueryInput', () => {
  it('should validate a correct multi-query input', () => {
    const result = validateMultiQueryInput({
      brand: 'Acme Dental',
      domain: 'acmedental.com',
      queries: ['best dentist', 'dentist reviews'],
    });
    expect(result.queries).toHaveLength(2);
    expect(result.platforms).toEqual(['chatgpt', 'perplexity', 'gemini']);
    expect(result.competitors).toEqual([]);
  });

  it('should accept specified platforms', () => {
    const result = validateMultiQueryInput({
      brand: 'Test',
      domain: 'test.com',
      queries: ['test'],
      platforms: ['chatgpt'],
    });
    expect(result.platforms).toEqual(['chatgpt']);
  });

  it('should accept empty queries array (validation is per-element)', () => {
    const result = validateMultiQueryInput({
      brand: 'Test',
      domain: 'test.com',
      queries: [],
    });
    expect(result.queries).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// buildEngineResponse
// ---------------------------------------------------------------------------

describe('buildEngineResponse', () => {
  it('should build a successful engine response', () => {
    const now = new Date();
    const result = buildEngineResponse({
      platform: 'chatgpt',
      query: 'best dentist',
      rawResponse: 'Acme Dental is a great choice...',
      citedUrls: ['https://acmedental.com'],
      executedAt: now,
      latencyMs: 1500,
      success: true,
    });

    expect(result.platform).toBe('chatgpt');
    expect(result.success).toBe(true);
    expect(result.citedUrls).toEqual(['https://acmedental.com']);
    expect(result.groundingSources).toEqual([]);
    expect(result.latencyMs).toBe(1500);
  });

  it('should build a response with grounding sources', () => {
    const result = buildEngineResponse({
      platform: 'gemini',
      query: 'test',
      rawResponse: 'response',
      citedUrls: [],
      groundingSources: [{ url: 'https://example.com', title: 'Source' }],
      executedAt: new Date(),
      latencyMs: 500,
      success: true,
    });

    expect(result.groundingSources).toHaveLength(1);
    expect(result.groundingSources[0].url).toBe('https://example.com');
  });

  it('should build a failed response with error', () => {
    const result = buildEngineResponse({
      platform: 'perplexity',
      query: 'test',
      rawResponse: '',
      citedUrls: [],
      executedAt: new Date(),
      latencyMs: 100,
      success: false,
      error: 'API timeout',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('API timeout');
  });
});

// ---------------------------------------------------------------------------
// buildMultiProviderResult
// ---------------------------------------------------------------------------

describe('buildMultiProviderResult', () => {
  it('should build a result with responses and failed platforms', () => {
    const result = buildMultiProviderResult({
      brand: 'Acme',
      domain: 'acme.com',
      responses: [
        buildEngineResponse({
          platform: 'chatgpt',
          query: 'test',
          rawResponse: 'ok',
          citedUrls: [],
          executedAt: new Date(),
          latencyMs: 100,
          success: true,
        }),
      ],
      failedPlatforms: [{ platform: 'perplexity', error: 'rate limited' }],
    });

    expect(result.brand).toBe('Acme');
    expect(result.responses).toHaveLength(1);
    expect(result.failedPlatforms).toHaveLength(1);
    expect(result.queriedAt).toBeInstanceOf(Date);
  });

  it('should build a result with all failures', () => {
    const result = buildMultiProviderResult({
      brand: 'Acme',
      domain: 'acme.com',
      responses: [],
      failedPlatforms: [
        { platform: 'chatgpt', error: 'timeout' },
        { platform: 'perplexity', error: 'rate limited' },
        { platform: 'gemini', error: 'auth error' },
      ],
    });

    expect(result.responses).toHaveLength(0);
    expect(result.failedPlatforms).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// buildFailedEngineResponse
// ---------------------------------------------------------------------------

describe('buildFailedEngineResponse', () => {
  it('should build a failed response with correct defaults', () => {
    const startTime = Date.now() - 500;
    const result = buildFailedEngineResponse({
      platform: 'chatgpt',
      query: 'test query',
      error: 'connection refused',
      startTime,
    });

    expect(result.platform).toBe('chatgpt');
    expect(result.success).toBe(false);
    expect(result.rawResponse).toBe('');
    expect(result.citedUrls).toEqual([]);
    expect(result.error).toBe('connection refused');
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
