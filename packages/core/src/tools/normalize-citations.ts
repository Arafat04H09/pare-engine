// Owner: S9 (AI Visibility + Citation Normalizer)
// Produces a unified citation graph from multi-provider query results.
// Shows which URLs were cited, by which engine, for which queries.

import type {
  MultiProviderResult,
  EngineResponse,
  Platform,
} from '../contracts/query.contract.js';

// --- Output Types ---

/** A single citation edge: one URL cited by one engine for one query. */
export interface CitationEdge {
  /** The URL that was cited. */
  url: string;
  /** Normalized URL (lowercase, no trailing slash, no fragment). */
  normalizedUrl: string;
  /** Which AI engine cited this URL. */
  platform: Platform;
  /** The query that triggered this citation. */
  query: string;
  /** Whether this URL was from grounding sources (vs inline citation). */
  fromGrounding: boolean;
}

/** Aggregated citation data for a single normalized URL. */
export interface CitationNode {
  /** The canonical (normalized) URL. */
  normalizedUrl: string;
  /** All raw URL variants observed for this canonical URL. */
  rawUrls: string[];
  /** Which platforms cited this URL. */
  platforms: Platform[];
  /** Which queries triggered citations of this URL. */
  queries: string[];
  /** Total number of times this URL was cited across all platforms/queries. */
  totalCitations: number;
  /** Per-platform citation count. */
  platformCounts: Partial<Record<Platform, number>>;
  /** Whether this URL belongs to the audited domain. */
  isBrandUrl: boolean;
}

/** The full citation graph produced by normalization. */
export interface CitationGraph {
  /** The brand domain being audited. */
  domain: string;
  /** All citation nodes, keyed by normalized URL. */
  nodes: Map<string, CitationNode>;
  /** All individual citation edges. */
  edges: CitationEdge[];
  /** Summary statistics. */
  summary: CitationSummary;
}

/** High-level citation statistics. */
export interface CitationSummary {
  /** Total unique URLs cited across all providers. */
  totalUniqueUrls: number;
  /** Total citation edges (URL + platform + query combinations). */
  totalCitations: number;
  /** URLs that belong to the audited domain. */
  brandUrlCount: number;
  /** URLs cited by more than one platform. */
  crossPlatformUrlCount: number;
  /** Per-platform total citations. */
  citationsByPlatform: Partial<Record<Platform, number>>;
  /** Per-query total citations. */
  citationsByQuery: Record<string, number>;
}

// --- URL Normalization ---

/**
 * Normalize a URL for deduplication:
 * - Lowercase the host
 * - Remove trailing slash
 * - Remove fragment (#...)
 * - Remove common tracking parameters (utm_*, fbclid, etc.)
 * - Remove www. prefix
 */
export function normalizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);

    // Lowercase the hostname
    url.hostname = url.hostname.toLowerCase();

    // Remove www. prefix
    if (url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.slice(4);
    }

    // Remove fragment
    url.hash = '';

    // Remove tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'msclkid', 'ref', 'source',
    ];
    for (const param of trackingParams) {
      url.searchParams.delete(param);
    }

    // Sort remaining params for consistent ordering
    url.searchParams.sort();

    // Build normalized string, remove trailing slash
    let normalized = url.toString();
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  } catch {
    // If URL parsing fails, do basic normalization
    return rawUrl.toLowerCase().replace(/\/$/, '').replace(/#.*$/, '');
  }
}

/**
 * Check whether a URL belongs to the given domain.
 * Handles www. prefix and subdomains.
 */
export function urlBelongsToDomain(rawUrl: string, domain: string): boolean {
  try {
    const url = new URL(rawUrl);
    let hostname = url.hostname.toLowerCase();
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }

    const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');

    // Exact match or subdomain match
    return hostname === normalizedDomain || hostname.endsWith('.' + normalizedDomain);
  } catch {
    // Fallback: check if the domain appears in the raw URL
    const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
    return rawUrl.toLowerCase().includes(normalizedDomain);
  }
}

// --- Citation Extraction ---

/**
 * Extract all citation edges from a single engine response.
 */
function extractEdgesFromResponse(response: EngineResponse): CitationEdge[] {
  if (!response.success) {
    return [];
  }

  const edges: CitationEdge[] = [];
  const seenUrls = new Set<string>();

  // Extract from citedUrls (inline citations)
  for (const url of response.citedUrls) {
    const normalizedUrl = normalizeUrl(url);
    if (!seenUrls.has(normalizedUrl)) {
      seenUrls.add(normalizedUrl);
      edges.push({
        url,
        normalizedUrl,
        platform: response.platform,
        query: response.query,
        fromGrounding: false,
      });
    }
  }

  // Extract from grounding sources
  for (const source of response.groundingSources) {
    const normalizedUrl = normalizeUrl(source.url);
    if (!seenUrls.has(normalizedUrl)) {
      seenUrls.add(normalizedUrl);
      edges.push({
        url: source.url,
        normalizedUrl,
        platform: response.platform,
        query: response.query,
        fromGrounding: true,
      });
    }
  }

  return edges;
}

// --- Main Normalizer ---

/**
 * Build a unified citation graph from multi-provider query results.
 *
 * The graph shows which URLs were cited, by which AI engine, for which queries.
 * URLs are normalized for deduplication (www removal, trailing slash removal,
 * tracking param stripping, etc.).
 *
 * @param result - The multi-provider query result from S4's query step
 * @returns A CitationGraph with nodes (per URL), edges (per citation event), and summary stats
 */
export function normalizeCitations(result: MultiProviderResult): CitationGraph {
  const domain = result.domain;
  const edges: CitationEdge[] = [];

  // Step 1: Extract all citation edges from all responses
  for (const response of result.responses) {
    const responseEdges = extractEdgesFromResponse(response);
    edges.push(...responseEdges);
  }

  // Step 2: Build citation nodes (aggregate by normalized URL)
  const nodeMap = new Map<string, CitationNode>();

  for (const edge of edges) {
    let node = nodeMap.get(edge.normalizedUrl);
    if (!node) {
      node = {
        normalizedUrl: edge.normalizedUrl,
        rawUrls: [],
        platforms: [],
        queries: [],
        totalCitations: 0,
        platformCounts: {},
        isBrandUrl: urlBelongsToDomain(edge.url, domain),
      };
      nodeMap.set(edge.normalizedUrl, node);
    }

    // Track raw URL variants
    if (!node.rawUrls.includes(edge.url)) {
      node.rawUrls.push(edge.url);
    }

    // Track platforms
    if (!node.platforms.includes(edge.platform)) {
      node.platforms.push(edge.platform);
    }

    // Track queries
    if (!node.queries.includes(edge.query)) {
      node.queries.push(edge.query);
    }

    // Increment counts
    node.totalCitations += 1;
    node.platformCounts[edge.platform] = (node.platformCounts[edge.platform] ?? 0) + 1;
  }

  // Step 3: Build summary statistics
  const citationsByPlatform: Partial<Record<Platform, number>> = {};
  const citationsByQuery: Record<string, number> = {};

  for (const edge of edges) {
    citationsByPlatform[edge.platform] = (citationsByPlatform[edge.platform] ?? 0) + 1;
    citationsByQuery[edge.query] = (citationsByQuery[edge.query] ?? 0) + 1;
  }

  let brandUrlCount = 0;
  let crossPlatformUrlCount = 0;

  for (const node of nodeMap.values()) {
    if (node.isBrandUrl) {
      brandUrlCount += 1;
    }
    if (node.platforms.length > 1) {
      crossPlatformUrlCount += 1;
    }
  }

  const summary: CitationSummary = {
    totalUniqueUrls: nodeMap.size,
    totalCitations: edges.length,
    brandUrlCount,
    crossPlatformUrlCount,
    citationsByPlatform,
    citationsByQuery,
  };

  return {
    domain,
    nodes: nodeMap,
    edges,
    summary,
  };
}
