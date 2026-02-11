// D2: Unit tests for pagespeed tool function (mocked fetch)
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PageSpeedError, fetchPageSpeed } from './pagespeed.js';

// ---------------------------------------------------------------------------
// Mock global fetch
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockPageSpeedResponse(overrides: Record<string, unknown> = {}) {
  return {
    lighthouseResult: {
      categories: {
        performance: { score: 0.85 },
        accessibility: { score: 0.92 },
        seo: { score: 0.88 },
      },
      audits: {
        'largest-contentful-paint': { numericValue: 2500 },
        'max-potential-fid': { numericValue: 120 },
        'cumulative-layout-shift': { numericValue: 0.1 },
      },
      finalUrl: 'https://example.com',
      ...overrides,
    },
  };
}

// ---------------------------------------------------------------------------
// PageSpeedError
// ---------------------------------------------------------------------------

describe('PageSpeedError', () => {
  it('should have correct name and code', () => {
    const err = new PageSpeedError('test error', 'API_ERROR');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('PageSpeedError');
    expect(err.code).toBe('API_ERROR');
  });
});

// ---------------------------------------------------------------------------
// fetchPageSpeed
// ---------------------------------------------------------------------------

describe('fetchPageSpeed', () => {
  it('should return successful result with valid API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPageSpeedResponse(),
    });

    const result = await fetchPageSpeed('https://example.com');
    expect(result.success).toBe(true);
    expect(result.performanceScore).toBe(85);
    expect(result.accessibilityScore).toBe(92);
    expect(result.seoScore).toBe(88);
    expect(result.coreWebVitals.lcp).toBe(2500);
    expect(result.coreWebVitals.fid).toBe(120);
    expect(result.coreWebVitals.cls).toBe(0.1);
    expect(result.testedUrl).toBe('https://example.com');
  });

  it('should handle non-OK HTTP response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    });

    const result = await fetchPageSpeed('https://example.com');
    expect(result.success).toBe(false);
    expect(result.error).toContain('429');
    expect(result.performanceScore).toBeNull();
  });

  it('should handle API error in response body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        error: { message: 'Quota exceeded' },
      }),
    });

    const result = await fetchPageSpeed('https://example.com');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Quota exceeded');
  });

  it('should handle missing Lighthouse result', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const result = await fetchPageSpeed('https://example.com');
    expect(result.success).toBe(false);
    expect(result.error).toContain('no Lighthouse result');
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchPageSpeed('https://example.com');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Network error');
  });

  it('should handle timeout (AbortError)', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValueOnce(abortError);

    const result = await fetchPageSpeed('https://example.com', { timeoutMs: 5000 });
    expect(result.success).toBe(false);
    expect(result.error).toContain('timed out');
    expect(result.error).toContain('5000');
  });

  it('should pass apiKey and strategy params', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPageSpeedResponse(),
    });

    await fetchPageSpeed('https://example.com', {
      strategy: 'desktop',
      apiKey: 'test-key-123',
    });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('strategy=desktop');
    expect(calledUrl).toContain('key=test-key-123');
  });

  it('should default to mobile strategy', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPageSpeedResponse(),
    });

    await fetchPageSpeed('https://example.com');

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('strategy=mobile');
  });

  it('should handle null scores gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        lighthouseResult: {
          categories: {
            performance: { score: null },
          },
          audits: {},
        },
      }),
    });

    const result = await fetchPageSpeed('https://example.com');
    expect(result.success).toBe(true);
    expect(result.performanceScore).toBeNull();
    expect(result.accessibilityScore).toBeNull();
    expect(result.coreWebVitals.lcp).toBeNull();
  });

  it('should handle missing categories', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        lighthouseResult: {},
      }),
    });

    const result = await fetchPageSpeed('https://example.com');
    expect(result.success).toBe(true);
    expect(result.performanceScore).toBeNull();
  });

  it('should use finalUrl when available', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPageSpeedResponse({ finalUrl: 'https://redirected.com' }),
    });

    const result = await fetchPageSpeed('https://example.com');
    expect(result.testedUrl).toBe('https://redirected.com');
  });

  it('should use input url when finalUrl is missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        lighthouseResult: {
          categories: {},
          audits: {},
        },
      }),
    });

    const result = await fetchPageSpeed('https://input-url.com');
    expect(result.testedUrl).toBe('https://input-url.com');
  });
});
