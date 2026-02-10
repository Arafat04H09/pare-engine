// Owner: S19 (Competitive Intelligence). Consumer: S12 (Pipeline Orchestration), S20 (Monitoring).
// Typed tool function for Serper.dev SERP position tracking.
// Returns organic results, local pack, People Also Ask, and AI overview presence.
// Typed input -> typed output. Designed to be wrappable as an Inngest step.

import { z } from 'zod';

// --- Custom Error ---

export class SerperError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'SerperError';
    this.code = code;
  }
}

// --- Input Schema ---

export const SerperInputSchema = z.object({
  query: z.string().min(1),
  domain: z.string().optional(),
  location: z.string().optional(),
  gl: z.string().length(2).default('us'),
  hl: z.string().default('en'),
  num: z.number().int().min(1).max(100).default(10),
});

export type SerperInput = z.infer<typeof SerperInputSchema>;

// --- Output Types ---

export const OrganicResultSchema = z.object({
  title: z.string(),
  link: z.string(),
  snippet: z.string(),
  position: z.number().int().min(1),
  domain: z.string(),
  sitelinks: z.array(z.object({
    title: z.string(),
    link: z.string(),
  })).default([]),
});

export type OrganicResult = z.infer<typeof OrganicResultSchema>;

export const LocalPackResultSchema = z.object({
  title: z.string(),
  address: z.string().optional(),
  phone: z.string().optional(),
  rating: z.number().nullable(),
  reviewCount: z.number().int().nullable(),
  position: z.number().int().min(1),
  cid: z.string().optional(),
});

export type LocalPackResult = z.infer<typeof LocalPackResultSchema>;

export const PeopleAlsoAskSchema = z.object({
  question: z.string(),
  snippet: z.string().optional(),
  link: z.string().optional(),
});

export type PeopleAlsoAsk = z.infer<typeof PeopleAlsoAskSchema>;

export const AIOverviewSchema = z.object({
  present: z.boolean(),
  snippet: z.string().optional(),
  citedUrls: z.array(z.string()).default([]),
});

export type AIOverview = z.infer<typeof AIOverviewSchema>;

export const DomainPositionSchema = z.object({
  found: z.boolean(),
  organicPosition: z.number().int().nullable(),
  localPackPosition: z.number().int().nullable(),
  inAIOverview: z.boolean(),
  urls: z.array(z.string()).default([]),
});

export type DomainPosition = z.infer<typeof DomainPositionSchema>;

export const SerperResultSchema = z.object({
  query: z.string(),
  success: z.boolean(),
  organic: z.array(OrganicResultSchema).default([]),
  localPack: z.array(LocalPackResultSchema).default([]),
  peopleAlsoAsk: z.array(PeopleAlsoAskSchema).default([]),
  aiOverview: AIOverviewSchema,
  domainPosition: DomainPositionSchema.nullable(),
  totalResults: z.number().int().nullable(),
  searchParameters: z.object({
    query: z.string(),
    gl: z.string(),
    hl: z.string(),
    num: z.number().int(),
    location: z.string().optional(),
  }),
  fetchedAt: z.date(),
  error: z.string().optional(),
});

export type SerperResult = z.infer<typeof SerperResultSchema>;

// --- Serper API Response Types (internal) ---

interface SerperApiOrganic {
  title?: string;
  link?: string;
  snippet?: string;
  position?: number;
  domain?: string;
  sitelinks?: Array<{ title?: string; link?: string }>;
}

interface SerperApiLocalPack {
  title?: string;
  address?: string;
  phone?: string;
  rating?: number;
  ratingCount?: number;
  cid?: string;
  position?: number;
}

interface SerperApiPAA {
  question?: string;
  snippet?: string;
  link?: string;
}

interface SerperApiAIOverview {
  text?: string;
  references?: Array<{ link?: string; title?: string }>;
}

interface SerperApiResponse {
  organic?: SerperApiOrganic[];
  places?: SerperApiLocalPack[];
  peopleAlsoAsk?: SerperApiPAA[];
  aiOverview?: SerperApiAIOverview;
  searchParameters?: {
    q?: string;
    gl?: string;
    hl?: string;
    num?: number;
    location?: string;
    type?: string;
  };
  searchInformation?: {
    totalResults?: number;
  };
  error?: string;
}

// --- Constants ---

const SERPER_API_URL = 'https://google.serper.dev/search';
const DEFAULT_TIMEOUT_MS = 15000;

// --- Helper Functions ---

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function normalizeDomain(domain: string): string {
  return domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '').toLowerCase();
}

function parseOrganicResults(raw: SerperApiOrganic[]): OrganicResult[] {
  return raw.map((item, index) => ({
    title: item.title ?? '',
    link: item.link ?? '',
    snippet: item.snippet ?? '',
    position: item.position ?? index + 1,
    domain: item.domain ?? extractDomain(item.link ?? ''),
    sitelinks: (item.sitelinks ?? [])
      .filter((sl) => sl.title && sl.link)
      .map((sl) => ({ title: sl.title!, link: sl.link! })),
  }));
}

function parseLocalPack(raw: SerperApiLocalPack[]): LocalPackResult[] {
  return raw.map((item, index) => ({
    title: item.title ?? '',
    address: item.address,
    phone: item.phone,
    rating: item.rating ?? null,
    reviewCount: item.ratingCount ?? null,
    position: item.position ?? index + 1,
    cid: item.cid,
  }));
}

function parsePeopleAlsoAsk(raw: SerperApiPAA[]): PeopleAlsoAsk[] {
  return raw
    .filter((item) => item.question)
    .map((item) => ({
      question: item.question!,
      snippet: item.snippet,
      link: item.link,
    }));
}

function parseAIOverview(raw: SerperApiAIOverview | undefined): AIOverview {
  if (!raw) {
    return { present: false, citedUrls: [] };
  }
  const citedUrls = (raw.references ?? [])
    .map((ref) => ref.link)
    .filter((link): link is string => Boolean(link));

  return {
    present: true,
    snippet: raw.text,
    citedUrls,
  };
}

function findDomainPosition(
  targetDomain: string,
  organic: OrganicResult[],
  localPack: LocalPackResult[],
  aiOverview: AIOverview,
): DomainPosition {
  const normalizedTarget = normalizeDomain(targetDomain);

  // Find in organic results
  const organicMatches = organic.filter(
    (result) => normalizeDomain(result.domain).includes(normalizedTarget)
      || normalizedTarget.includes(normalizeDomain(result.domain)),
  );
  const organicPosition = organicMatches.length > 0
    ? Math.min(...organicMatches.map((m) => m.position))
    : null;

  // Find in local pack (match by domain is not possible — local pack doesn't have URLs)
  // We leave localPackPosition null since local pack results don't include domain info
  const localPackPosition: number | null = null;

  // Check if domain appears in AI overview citations
  const inAIOverview = aiOverview.citedUrls.some(
    (url) => normalizeDomain(extractDomain(url)).includes(normalizedTarget)
      || normalizedTarget.includes(normalizeDomain(extractDomain(url))),
  );

  const urls = organicMatches.map((m) => m.link);

  return {
    found: organicPosition !== null || inAIOverview,
    organicPosition,
    localPackPosition,
    inAIOverview,
    urls,
  };
}

// --- Main Export ---

/**
 * Searches Google via Serper.dev and returns structured SERP data.
 *
 * When a `domain` is provided, also calculates the domain's position
 * in organic results and whether it appears in the AI overview.
 *
 * Gracefully handles API failures — returns partial data with `success: false`
 * and an `error` message instead of throwing.
 */
export async function searchSerper(
  query: string,
  domain?: string,
  options: {
    apiKey: string;
    location?: string;
    gl?: string;
    hl?: string;
    num?: number;
    timeoutMs?: number;
  } = { apiKey: '' },
): Promise<SerperResult> {
  const {
    apiKey,
    location,
    gl = 'us',
    hl = 'en',
    num = 10,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  const emptyResult: SerperResult = {
    query,
    success: false,
    organic: [],
    localPack: [],
    peopleAlsoAsk: [],
    aiOverview: { present: false, citedUrls: [] },
    domainPosition: domain ? { found: false, organicPosition: null, localPackPosition: null, inAIOverview: false, urls: [] } : null,
    totalResults: null,
    searchParameters: { query, gl, hl, num, location },
    fetchedAt: new Date(),
  };

  if (!apiKey) {
    return { ...emptyResult, error: 'Serper API key is not configured' };
  }

  if (!query.trim()) {
    return { ...emptyResult, error: 'Search query is empty' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const requestBody: Record<string, unknown> = {
      q: query,
      gl,
      hl,
      num,
    };
    if (location) {
      requestBody.location = location;
    }

    let response: Response;
    try {
      response = await fetch(SERPER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      return {
        ...emptyResult,
        error: `Serper API returned HTTP ${response.status}: ${response.statusText}. ${errorBody}`,
      };
    }

    const data = (await response.json()) as SerperApiResponse;

    if (data.error) {
      return { ...emptyResult, error: `Serper API error: ${data.error}` };
    }

    const organic = parseOrganicResults(data.organic ?? []);
    const localPack = parseLocalPack(data.places ?? []);
    const peopleAlsoAsk = parsePeopleAlsoAsk(data.peopleAlsoAsk ?? []);
    const aiOverview = parseAIOverview(data.aiOverview);

    const domainPosition = domain
      ? findDomainPosition(domain, organic, localPack, aiOverview)
      : null;

    const totalResults = data.searchInformation?.totalResults ?? null;

    return {
      query,
      success: true,
      organic,
      localPack,
      peopleAlsoAsk,
      aiOverview,
      domainPosition,
      totalResults,
      searchParameters: {
        query,
        gl,
        hl,
        num,
        location,
      },
      fetchedAt: new Date(),
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return {
      ...emptyResult,
      error: isTimeout
        ? `Serper API request timed out after ${timeoutMs}ms`
        : `Serper API request failed: ${errorMessage}`,
    };
  }
}

/**
 * Batch search multiple queries via Serper.dev.
 * Uses Promise.allSettled to ensure partial failures don't lose successful results.
 */
export async function searchSerperBatch(
  queries: string[],
  domain?: string,
  options: {
    apiKey: string;
    location?: string;
    gl?: string;
    hl?: string;
    num?: number;
    timeoutMs?: number;
  } = { apiKey: '' },
): Promise<SerperResult[]> {
  const results = await Promise.allSettled(
    queries.map((query) => searchSerper(query, domain, options)),
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    // Promise.allSettled should never reject since searchSerper catches internally,
    // but handle it defensively
    return {
      query: queries[index],
      success: false,
      organic: [],
      localPack: [],
      peopleAlsoAsk: [],
      aiOverview: { present: false, citedUrls: [] } as AIOverview,
      domainPosition: domain
        ? { found: false, organicPosition: null, localPackPosition: null, inAIOverview: false, urls: [] } as DomainPosition
        : null,
      totalResults: null,
      searchParameters: {
        query: queries[index],
        gl: options.gl ?? 'us',
        hl: options.hl ?? 'en',
        num: options.num ?? 10,
        location: options.location,
      },
      fetchedAt: new Date(),
      error: `Unexpected rejection: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`,
    };
  });
}
