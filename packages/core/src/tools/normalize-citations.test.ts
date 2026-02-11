// D2: Unit tests for normalize-citations tool functions
import { describe, it, expect } from 'vitest';
import {
  normalizeUrl,
  urlBelongsToDomain,
  normalizeCitations,
} from './normalize-citations.js';
import type { MultiProviderResult, EngineResponse } from '../contracts/query.contract.js';

// ---------------------------------------------------------------------------
// normalizeUrl
// ---------------------------------------------------------------------------

describe('normalizeUrl', () => {
  it('should lowercase hostname', () => {
    expect(normalizeUrl('https://EXAMPLE.COM/Page')).toBe('https://example.com/Page');
  });

  it('should remove www prefix', () => {
    expect(normalizeUrl('https://www.example.com/page')).toBe('https://example.com/page');
  });

  it('should remove trailing slash', () => {
    expect(normalizeUrl('https://example.com/')).toBe('https://example.com');
  });

  it('should remove fragment', () => {
    expect(normalizeUrl('https://example.com/page#section')).toBe('https://example.com/page');
  });

  it('should remove UTM parameters', () => {
    const url = 'https://example.com/page?utm_source=google&utm_medium=cpc&foo=bar';
    const normalized = normalizeUrl(url);
    expect(normalized).not.toContain('utm_source');
    expect(normalized).not.toContain('utm_medium');
    expect(normalized).toContain('foo=bar');
  });

  it('should remove fbclid parameter', () => {
    const url = 'https://example.com?fbclid=abc123&real=param';
    const normalized = normalizeUrl(url);
    expect(normalized).not.toContain('fbclid');
    expect(normalized).toContain('real=param');
  });

  it('should sort remaining params', () => {
    const url = 'https://example.com/page?z=1&a=2';
    const normalized = normalizeUrl(url);
    expect(normalized).toBe('https://example.com/page?a=2&z=1');
  });

  it('should handle invalid URLs with basic normalization', () => {
    const result = normalizeUrl('not a url');
    expect(result).toBe('not a url');
  });

  it('should handle URL with all tracking params removed', () => {
    const url = 'https://example.com?utm_source=x&utm_medium=y&utm_campaign=z';
    const normalized = normalizeUrl(url);
    expect(normalized).toBe('https://example.com');
  });
});

// ---------------------------------------------------------------------------
// urlBelongsToDomain
// ---------------------------------------------------------------------------

describe('urlBelongsToDomain', () => {
  it('should match exact domain', () => {
    expect(urlBelongsToDomain('https://example.com/page', 'example.com')).toBe(true);
  });

  it('should match with www prefix', () => {
    expect(urlBelongsToDomain('https://www.example.com/page', 'example.com')).toBe(true);
  });

  it('should match subdomain', () => {
    expect(urlBelongsToDomain('https://blog.example.com/post', 'example.com')).toBe(true);
  });

  it('should not match different domain', () => {
    expect(urlBelongsToDomain('https://other.com/page', 'example.com')).toBe(false);
  });

  it('should handle domain with www', () => {
    expect(urlBelongsToDomain('https://example.com/page', 'www.example.com')).toBe(true);
  });

  it('should be case-insensitive', () => {
    expect(urlBelongsToDomain('https://EXAMPLE.COM/page', 'example.com')).toBe(true);
  });

  it('should handle invalid URL with fallback', () => {
    expect(urlBelongsToDomain('not-a-url-example.com', 'example.com')).toBe(true);
  });

  it('should not match partial domain names', () => {
    expect(urlBelongsToDomain('https://notexample.com/page', 'example.com')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// normalizeCitations
// ---------------------------------------------------------------------------

function makeResponse(overrides: Partial<EngineResponse> = {}): EngineResponse {
  return {
    platform: 'chatgpt',
    query: 'best dentist',
    rawResponse: 'Acme Dental is great',
    citedUrls: [],
    groundingSources: [],
    executedAt: new Date(),
    latencyMs: 500,
    success: true,
    ...overrides,
  };
}

function makeResult(overrides: Partial<MultiProviderResult> = {}): MultiProviderResult {
  return {
    brand: 'Acme Dental',
    domain: 'acmedental.com',
    responses: [],
    failedPlatforms: [],
    queriedAt: new Date(),
    ...overrides,
  };
}

describe('normalizeCitations', () => {
  it('should produce empty graph with no responses', () => {
    const graph = normalizeCitations(makeResult());
    expect(graph.edges).toHaveLength(0);
    expect(graph.nodes.size).toBe(0);
    expect(graph.summary.totalUniqueUrls).toBe(0);
  });

  it('should extract citations from citedUrls', () => {
    const result = makeResult({
      responses: [
        makeResponse({
          citedUrls: ['https://acmedental.com/about', 'https://other.com'],
        }),
      ],
    });
    const graph = normalizeCitations(result);
    expect(graph.edges).toHaveLength(2);
    expect(graph.summary.totalUniqueUrls).toBe(2);
  });

  it('should extract citations from grounding sources', () => {
    const result = makeResult({
      responses: [
        makeResponse({
          groundingSources: [{ url: 'https://acmedental.com', title: 'Acme' }],
        }),
      ],
    });
    const graph = normalizeCitations(result);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].fromGrounding).toBe(true);
  });

  it('should mark brand URLs correctly', () => {
    const result = makeResult({
      responses: [
        makeResponse({
          citedUrls: ['https://acmedental.com/about', 'https://competitor.com'],
        }),
      ],
    });
    const graph = normalizeCitations(result);
    expect(graph.summary.brandUrlCount).toBe(1);
    const brandNode = graph.nodes.get(normalizeUrl('https://acmedental.com/about'));
    expect(brandNode?.isBrandUrl).toBe(true);
  });

  it('should deduplicate normalized URLs within a response', () => {
    const result = makeResult({
      responses: [
        makeResponse({
          citedUrls: ['https://example.com', 'https://www.example.com/'],
        }),
      ],
    });
    const graph = normalizeCitations(result);
    // Both normalize to the same URL
    expect(graph.nodes.size).toBe(1);
  });

  it('should track cross-platform citations', () => {
    const result = makeResult({
      responses: [
        makeResponse({
          platform: 'chatgpt',
          citedUrls: ['https://shared.com/page'],
        }),
        makeResponse({
          platform: 'perplexity',
          query: 'best dentist',
          citedUrls: ['https://shared.com/page'],
        }),
      ],
    });
    const graph = normalizeCitations(result);
    expect(graph.summary.crossPlatformUrlCount).toBe(1);
    const node = graph.nodes.get(normalizeUrl('https://shared.com/page'));
    expect(node?.platforms).toContain('chatgpt');
    expect(node?.platforms).toContain('perplexity');
    expect(node?.totalCitations).toBe(2);
  });

  it('should track per-query citation counts', () => {
    const result = makeResult({
      responses: [
        makeResponse({
          query: 'query A',
          citedUrls: ['https://a.com', 'https://b.com'],
        }),
        makeResponse({
          query: 'query B',
          citedUrls: ['https://c.com'],
        }),
      ],
    });
    const graph = normalizeCitations(result);
    expect(graph.summary.citationsByQuery['query A']).toBe(2);
    expect(graph.summary.citationsByQuery['query B']).toBe(1);
  });

  it('should skip failed responses', () => {
    const result = makeResult({
      responses: [
        makeResponse({
          success: false,
          citedUrls: ['https://example.com'],
        }),
      ],
    });
    const graph = normalizeCitations(result);
    expect(graph.edges).toHaveLength(0);
  });

  it('should track per-platform citation counts', () => {
    const result = makeResult({
      responses: [
        makeResponse({
          platform: 'chatgpt',
          citedUrls: ['https://a.com'],
        }),
        makeResponse({
          platform: 'gemini',
          citedUrls: ['https://b.com', 'https://c.com'],
        }),
      ],
    });
    const graph = normalizeCitations(result);
    expect(graph.summary.citationsByPlatform.chatgpt).toBe(1);
    expect(graph.summary.citationsByPlatform.gemini).toBe(2);
  });
});
