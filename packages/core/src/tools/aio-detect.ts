// Task 4.3: AIO Trigger Detector
// Detects when queries trigger Google's AI Overview (AIO) and whether
// the client's domain is cited. Uses existing Serper.dev integration.
// Typed input -> typed output. Designed to be wrappable as an Inngest step.

import { searchSerperBatch } from './serper.js';
import type { SerperResult } from './serper.js';

// ---------------------------------------------------------------------------
// Error Class
// ---------------------------------------------------------------------------

export class AioDetectError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'AioDetectError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Input / Output Types
// ---------------------------------------------------------------------------

export interface AioDetectInput {
  /** Queries to check for AIO triggers (e.g., "best dentist in Albany"). */
  queries: string[];
  /** The client's domain (e.g., "example.com"). */
  clientDomain: string;
  /** Serper.dev API key. */
  serperApiKey: string;
  /** Optional location for localized results. */
  location?: string;
}

export interface AioQueryResult {
  /** The query that was searched. */
  query: string;
  /** Whether this query triggered an AI Overview. */
  aioTriggered: boolean;
  /** Whether the client's domain is cited in the AI Overview. */
  clientCitedInAio: boolean;
  /** The AI Overview text snippet, if available. */
  aioSnippet: string | null;
  /** Whether the client appears in regular organic results. */
  clientInOrganicResults: boolean;
  /** Client's position in organic results (null if not found). */
  clientOrganicPosition: number | null;
}

export interface AioDetectOutput {
  /** Total number of queries checked. */
  totalQueries: number;
  /** Fraction of queries that triggered an AI Overview (0-1). */
  aioTriggerRate: number;
  /** Fraction of AIO results that cite the client (0-1). */
  clientAioCitationRate: number;
  /** Fraction of queries where the client appears in organic results (0-1). */
  clientOrganicRate: number;
  /** Per-query results. */
  queryResults: AioQueryResult[];
  /** Queries where AIO triggered but the client was NOT cited — optimization opportunities. */
  aioOpportunities: string[];
  /** Timestamp of detection. */
  detectedAt: Date;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeDomain(domain: string): string {
  return domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '')
    .toLowerCase();
}

function domainMatchesCited(clientDomain: string, citedUrl: string): boolean {
  const normalizedClient = normalizeDomain(clientDomain);
  try {
    const parsed = new URL(citedUrl);
    const citedHost = parsed.hostname.replace(/^www\./, '').toLowerCase();
    return citedHost === normalizedClient || citedHost.endsWith(`.${normalizedClient}`);
  } catch {
    // If the URL can't be parsed, fall back to string containment
    const normalized = normalizeDomain(citedUrl);
    return normalized.includes(normalizedClient) || normalizedClient.includes(normalized);
  }
}

function mapSerperResultToQueryResult(
  result: SerperResult,
  clientDomain: string,
): AioQueryResult {
  const aioTriggered = result.aiOverview.present;

  // Check if client is cited in AIO
  const clientCitedInAio = aioTriggered && result.aiOverview.citedUrls.some(
    (url) => domainMatchesCited(clientDomain, url),
  );

  // Use domain position data if available, otherwise compute from organics
  const clientInOrganicResults = result.domainPosition?.found ?? false;
  const clientOrganicPosition = result.domainPosition?.organicPosition ?? null;

  return {
    query: result.query,
    aioTriggered,
    clientCitedInAio,
    aioSnippet: result.aiOverview.snippet ?? null,
    clientInOrganicResults,
    clientOrganicPosition,
  };
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

/**
 * Detects AI Overview triggers for a set of client-relevant queries.
 *
 * Uses the existing Serper.dev batch search to check each query, then
 * aggregates results into trigger rates, citation rates, and identifies
 * optimization opportunities (AIO exists but client is not cited).
 *
 * Graceful degradation: individual query failures are skipped, not thrown.
 * The function only throws an AioDetectError for invalid inputs.
 */
export async function detectAioTriggers(input: AioDetectInput): Promise<AioDetectOutput> {
  const { queries, clientDomain, serperApiKey, location } = input;

  if (!queries || queries.length === 0) {
    throw new AioDetectError('At least one query is required', 'EMPTY_QUERIES');
  }

  if (!clientDomain || !clientDomain.trim()) {
    throw new AioDetectError('Client domain is required', 'MISSING_DOMAIN');
  }

  if (!serperApiKey || !serperApiKey.trim()) {
    throw new AioDetectError('Serper API key is required', 'MISSING_API_KEY');
  }

  // Use existing Serper batch search with the client domain for position tracking
  const serperResults = await searchSerperBatch(queries, clientDomain, {
    apiKey: serperApiKey,
    location,
  });

  // Map Serper results to AIO query results, skipping failed queries
  const queryResults: AioQueryResult[] = [];
  for (const result of serperResults) {
    if (!result.success) {
      // Skip failed queries gracefully — don't count them in rates
      continue;
    }
    queryResults.push(mapSerperResultToQueryResult(result, clientDomain));
  }

  const totalQueries = queryResults.length;

  // Calculate aggregate rates
  const aioTriggeredCount = queryResults.filter((r) => r.aioTriggered).length;
  const aioTriggerRate = totalQueries > 0 ? aioTriggeredCount / totalQueries : 0;

  const aioCitedCount = queryResults.filter((r) => r.clientCitedInAio).length;
  const clientAioCitationRate = aioTriggeredCount > 0 ? aioCitedCount / aioTriggeredCount : 0;

  const organicCount = queryResults.filter((r) => r.clientInOrganicResults).length;
  const clientOrganicRate = totalQueries > 0 ? organicCount / totalQueries : 0;

  // Identify opportunities: AIO triggered but client NOT cited
  const aioOpportunities = queryResults
    .filter((r) => r.aioTriggered && !r.clientCitedInAio)
    .map((r) => r.query);

  return {
    totalQueries,
    aioTriggerRate,
    clientAioCitationRate,
    clientOrganicRate,
    queryResults,
    aioOpportunities,
    detectedAt: new Date(),
  };
}
