// Owner: S19 (Competitive Intelligence). Consumer: S12 (Pipeline Orchestration), S20 (Monitoring).
// Typed tool function for DataForSEO API — backlinks, keywords, and AI Overview data.
// Uses Basic auth (login:password). Typed input -> typed output.
// Designed to be wrappable as an Inngest step.

import { z } from 'zod';

// --- Custom Error ---

export class DataForSEOError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'DataForSEOError';
    this.code = code;
  }
}

// --- Input Schema ---

export const DataForSEOFetchTypeSchema = z.enum(['backlinks', 'keywords', 'ai-overview']);
export type DataForSEOFetchType = z.infer<typeof DataForSEOFetchTypeSchema>;

export const DataForSEOInputSchema = z.object({
  domain: z.string().min(1),
  type: DataForSEOFetchTypeSchema,
  location: z.string().optional(),
  language: z.string().default('en'),
  limit: z.number().int().min(1).max(1000).default(100),
});

export type DataForSEOInput = z.infer<typeof DataForSEOInputSchema>;

// --- Backlinks Output ---

export const BacklinkItemSchema = z.object({
  sourceUrl: z.string(),
  sourceDomain: z.string(),
  targetUrl: z.string(),
  anchorText: z.string(),
  dofollow: z.boolean(),
  pageRank: z.number().nullable(),
  firstSeen: z.string().nullable(),
  lastSeen: z.string().nullable(),
});

export type BacklinkItem = z.infer<typeof BacklinkItemSchema>;

export const BacklinksResultSchema = z.object({
  domain: z.string(),
  totalBacklinks: z.number().int(),
  totalReferringDomains: z.number().int(),
  backlinks: z.array(BacklinkItemSchema),
  domainRank: z.number().nullable(),
  success: z.boolean(),
  fetchedAt: z.date(),
  error: z.string().optional(),
});

export type BacklinksResult = z.infer<typeof BacklinksResultSchema>;

// --- Keywords Output ---

export const KeywordItemSchema = z.object({
  keyword: z.string(),
  position: z.number().int().nullable(),
  searchVolume: z.number().int().nullable(),
  cpc: z.number().nullable(),
  competition: z.number().nullable(),
  url: z.string(),
  trafficEstimate: z.number().nullable(),
});

export type KeywordItem = z.infer<typeof KeywordItemSchema>;

export const KeywordsResultSchema = z.object({
  domain: z.string(),
  totalKeywords: z.number().int(),
  keywords: z.array(KeywordItemSchema),
  estimatedTraffic: z.number().nullable(),
  success: z.boolean(),
  fetchedAt: z.date(),
  error: z.string().optional(),
});

export type KeywordsResult = z.infer<typeof KeywordsResultSchema>;

// --- AI Overview Output ---

export const AIOverviewItemSchema = z.object({
  keyword: z.string(),
  position: z.number().int().nullable(),
  aiOverviewPresent: z.boolean(),
  domainInAIOverview: z.boolean(),
  aiOverviewPosition: z.number().int().nullable(),
  aiOverviewSnippet: z.string().optional(),
  citedUrls: z.array(z.string()).default([]),
});

export type AIOverviewItem = z.infer<typeof AIOverviewItemSchema>;

export const AIOverviewResultSchema = z.object({
  domain: z.string(),
  totalKeywordsWithAIOverview: z.number().int(),
  domainAppearanceCount: z.number().int(),
  items: z.array(AIOverviewItemSchema),
  success: z.boolean(),
  fetchedAt: z.date(),
  error: z.string().optional(),
});

export type AIOverviewResult = z.infer<typeof AIOverviewResultSchema>;

// --- Union Result ---

export type DataForSEOResult = BacklinksResult | KeywordsResult | AIOverviewResult;

// --- DataForSEO API Types (internal) ---

interface DataForSEOApiTask<T> {
  id?: string;
  status_code?: number;
  status_message?: string;
  result?: T[];
  result_count?: number;
}

interface DataForSEOApiResponse<T> {
  version?: string;
  status_code?: number;
  status_message?: string;
  tasks?: DataForSEOApiTask<T>[];
  tasks_count?: number;
  tasks_error?: number;
}

// Backlinks summary response
interface BacklinksSummaryApiResult {
  target?: string;
  total_backlinks?: number;
  referring_domains?: number;
  rank?: number;
}

// Backlinks list response
interface BacklinksListApiResult {
  total_count?: number;
  items_count?: number;
  items?: Array<{
    url_from?: string;
    domain_from?: string;
    url_to?: string;
    anchor?: string;
    dofollow?: boolean;
    page_from_rank?: number;
    first_seen?: string;
    last_seen?: string;
  }>;
}

// Ranked keywords response
interface RankedKeywordsApiResult {
  total_count?: number;
  items_count?: number;
  estimated_paid_traffic_cost?: number;
  items?: Array<{
    keyword_data?: {
      keyword?: string;
      search_volume?: number;
      cpc?: number;
      competition?: number;
    };
    ranked_serp_element?: {
      serp_item?: {
        rank_absolute?: number;
        url?: string;
        estimated_paid_traffic_cost?: number;
      };
    };
  }>;
}

// SERP result item — covers organic results, AI overview blocks, etc.
interface SerpResultItem {
  type?: string;
  rank_absolute?: number;
  position?: string;
  url?: string;
  title?: string;
  description?: string;
  domain?: string;
  items?: Array<{
    type?: string;
    url?: string;
    description?: string;
    position?: string;
  }>;
}

// SERP API response for a single keyword
interface SerpAIOverviewApiResult {
  keyword?: string;
  items_count?: number;
  items?: SerpResultItem[];
}

// --- Constants ---

const DATAFORSEO_API_BASE = 'https://api.dataforseo.com/v3';
const DEFAULT_TIMEOUT_MS = 30000;

// --- Helper Functions ---

function buildAuthHeader(login: string, password: string): string {
  // DataForSEO uses Basic auth with base64 encoded login:password
  const credentials = `${login}:${password}`;
  // Use Buffer for Node.js environments
  if (typeof Buffer !== 'undefined') {
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }
  // Fallback for environments with btoa
  return `Basic ${btoa(credentials)}`;
}

function normalizeDomain(domain: string): string {
  return domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '')
    .toLowerCase();
}

async function makeDataForSEORequest<T>(
  endpoint: string,
  body: unknown[],
  auth: { login: string; password: string },
  timeoutMs: number,
): Promise<DataForSEOApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${DATAFORSEO_API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': buildAuthHeader(auth.login, auth.password),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new DataForSEOError(
      `DataForSEO API returned HTTP ${response.status}: ${response.statusText}. ${errorBody}`,
      'API_HTTP_ERROR',
    );
  }

  return (await response.json()) as DataForSEOApiResponse<T>;
}

function extractFirstTaskResult<T>(apiResponse: DataForSEOApiResponse<T>): T | null {
  if (!apiResponse.tasks || apiResponse.tasks.length === 0) {
    return null;
  }
  const task = apiResponse.tasks[0];
  if (task.status_code !== 20000) {
    throw new DataForSEOError(
      `DataForSEO task failed: ${task.status_message ?? 'Unknown error'} (code: ${task.status_code})`,
      'TASK_ERROR',
    );
  }
  if (!task.result || task.result.length === 0) {
    return null;
  }
  return task.result[0];
}

// --- Backlinks Fetch ---

async function fetchBacklinks(
  domain: string,
  auth: { login: string; password: string },
  limit: number,
  timeoutMs: number,
): Promise<BacklinksResult> {
  const normalizedDomain = normalizeDomain(domain);
  const emptyResult: BacklinksResult = {
    domain: normalizedDomain,
    totalBacklinks: 0,
    totalReferringDomains: 0,
    backlinks: [],
    domainRank: null,
    success: false,
    fetchedAt: new Date(),
  };

  try {
    // Step 1: Get summary data (total counts + domain rank)
    const summaryResponse = await makeDataForSEORequest<BacklinksSummaryApiResult>(
      '/backlinks/summary/live',
      [{ target: normalizedDomain }],
      auth,
      timeoutMs,
    );
    const summary = extractFirstTaskResult(summaryResponse);

    // Step 2: Get individual backlinks
    const listResponse = await makeDataForSEORequest<BacklinksListApiResult>(
      '/backlinks/backlinks/live',
      [{
        target: normalizedDomain,
        limit,
        order_by: ['page_from_rank,desc'],
        mode: 'as_is',
      }],
      auth,
      timeoutMs,
    );
    const listResult = extractFirstTaskResult(listResponse);

    const backlinks: BacklinkItem[] = (listResult?.items ?? []).map((item) => ({
      sourceUrl: item.url_from ?? '',
      sourceDomain: item.domain_from ?? '',
      targetUrl: item.url_to ?? '',
      anchorText: item.anchor ?? '',
      dofollow: item.dofollow ?? false,
      pageRank: item.page_from_rank ?? null,
      firstSeen: item.first_seen ?? null,
      lastSeen: item.last_seen ?? null,
    }));

    return {
      domain: normalizedDomain,
      totalBacklinks: summary?.total_backlinks ?? listResult?.total_count ?? 0,
      totalReferringDomains: summary?.referring_domains ?? 0,
      backlinks,
      domainRank: summary?.rank ?? null,
      success: true,
      fetchedAt: new Date(),
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return {
      ...emptyResult,
      error: isTimeout
        ? `DataForSEO backlinks request timed out after ${timeoutMs}ms`
        : `DataForSEO backlinks request failed: ${errorMessage}`,
    };
  }
}

// --- Keywords Fetch ---

async function fetchKeywords(
  domain: string,
  auth: { login: string; password: string },
  location: string | undefined,
  language: string,
  limit: number,
  timeoutMs: number,
): Promise<KeywordsResult> {
  const normalizedDomain = normalizeDomain(domain);
  const emptyResult: KeywordsResult = {
    domain: normalizedDomain,
    totalKeywords: 0,
    keywords: [],
    estimatedTraffic: null,
    success: false,
    fetchedAt: new Date(),
  };

  try {
    const requestBody: Record<string, unknown> = {
      target: normalizedDomain,
      limit,
      language_code: language,
      order_by: ['keyword_data.search_volume,desc'],
    };
    if (location) {
      requestBody.location_name = location;
    }

    const response = await makeDataForSEORequest<RankedKeywordsApiResult>(
      '/dataforseo_labs/google/ranked_keywords/live',
      [requestBody],
      auth,
      timeoutMs,
    );
    const result = extractFirstTaskResult(response);

    const keywords: KeywordItem[] = (result?.items ?? []).map((item) => ({
      keyword: item.keyword_data?.keyword ?? '',
      position: item.ranked_serp_element?.serp_item?.rank_absolute ?? null,
      searchVolume: item.keyword_data?.search_volume ?? null,
      cpc: item.keyword_data?.cpc ?? null,
      competition: item.keyword_data?.competition ?? null,
      url: item.ranked_serp_element?.serp_item?.url ?? '',
      trafficEstimate: item.ranked_serp_element?.serp_item?.estimated_paid_traffic_cost ?? null,
    }));

    const estimatedTraffic = result?.estimated_paid_traffic_cost ?? null;

    return {
      domain: normalizedDomain,
      totalKeywords: result?.total_count ?? keywords.length,
      keywords,
      estimatedTraffic,
      success: true,
      fetchedAt: new Date(),
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return {
      ...emptyResult,
      error: isTimeout
        ? `DataForSEO keywords request timed out after ${timeoutMs}ms`
        : `DataForSEO keywords request failed: ${errorMessage}`,
    };
  }
}

// --- AI Overview Fetch ---

async function fetchAIOverview(
  domain: string,
  auth: { login: string; password: string },
  location: string | undefined,
  language: string,
  limit: number,
  timeoutMs: number,
): Promise<AIOverviewResult> {
  const normalizedDomain = normalizeDomain(domain);
  const emptyResult: AIOverviewResult = {
    domain: normalizedDomain,
    totalKeywordsWithAIOverview: 0,
    domainAppearanceCount: 0,
    items: [],
    success: false,
    fetchedAt: new Date(),
  };

  try {
    // First get ranked keywords to know which keywords to check for AI overview
    const keywordsRequestBody: Record<string, unknown> = {
      target: normalizedDomain,
      limit,
      language_code: language,
      order_by: ['keyword_data.search_volume,desc'],
    };
    if (location) {
      keywordsRequestBody.location_name = location;
    }

    const keywordsResponse = await makeDataForSEORequest<RankedKeywordsApiResult>(
      '/dataforseo_labs/google/ranked_keywords/live',
      [keywordsRequestBody],
      auth,
      timeoutMs,
    );
    const keywordsResult = extractFirstTaskResult(keywordsResponse);

    // Extract keywords to check
    const topKeywords = (keywordsResult?.items ?? [])
      .map((item) => item.keyword_data?.keyword)
      .filter((kw): kw is string => Boolean(kw))
      .slice(0, Math.min(limit, 50)); // Cap at 50 to avoid excessive SERP calls

    if (topKeywords.length === 0) {
      return {
        ...emptyResult,
        success: true,
      };
    }

    // Check SERP results for AI overview presence using regular SERP endpoint
    // DataForSEO SERP API returns AI overview items when present
    const serpTasks = topKeywords.map((keyword) => {
      const task: Record<string, unknown> = {
        keyword,
        language_code: language,
        device: 'desktop',
        depth: 10,
      };
      if (location) {
        task.location_name = location;
      }
      return task;
    });

    // Batch the SERP requests (DataForSEO supports up to 100 tasks per POST)
    const serpResponse = await makeDataForSEORequest<SerpAIOverviewApiResult>(
      '/serp/google/organic/live/regular',
      serpTasks,
      auth,
      timeoutMs,
    );

    const items: AIOverviewItem[] = [];
    let totalWithAIOverview = 0;
    let domainAppearanceCount = 0;

    // Process each task result
    const tasks = serpResponse.tasks ?? [];
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      if (task.status_code !== 20000 || !task.result || task.result.length === 0) {
        continue;
      }

      const serpResult = task.result[0];
      const serpItems = serpResult.items ?? [];

      // Look for AI overview items in the SERP results
      const aiOverviewItem = serpItems.find(
        (item) => item.type === 'ai_overview',
      );

      const keyword = topKeywords[i] ?? '';
      const hasAIOverview = Boolean(aiOverviewItem);

      if (hasAIOverview) {
        totalWithAIOverview++;
      }

      // Check if domain is cited in AI overview
      const aiOverviewSubItems = aiOverviewItem?.items ?? [];
      const citedUrls = aiOverviewSubItems
        .map((sub) => sub.url)
        .filter((url): url is string => Boolean(url));

      const domainInAI = citedUrls.some(
        (url) => {
          try {
            const urlDomain = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
            return urlDomain.includes(normalizedDomain) || normalizedDomain.includes(urlDomain);
          } catch {
            return false;
          }
        },
      );

      if (domainInAI) {
        domainAppearanceCount++;
      }

      // Find domain's organic position in this SERP
      const organicItems = serpItems.filter((item) => item.type === 'organic');
      const domainOrganic = organicItems.find((item) => {
        if (!item.url) return false;
        try {
          const itemDomain = new URL(item.url).hostname.replace(/^www\./, '').toLowerCase();
          return itemDomain.includes(normalizedDomain) || normalizedDomain.includes(itemDomain);
        } catch {
          return false;
        }
      });

      items.push({
        keyword,
        position: domainOrganic?.rank_absolute ?? null,
        aiOverviewPresent: hasAIOverview,
        domainInAIOverview: domainInAI,
        aiOverviewPosition: aiOverviewItem?.rank_absolute ?? null,
        aiOverviewSnippet: aiOverviewItem?.items?.[0]?.description,
        citedUrls,
      });
    }

    return {
      domain: normalizedDomain,
      totalKeywordsWithAIOverview: totalWithAIOverview,
      domainAppearanceCount,
      items,
      success: true,
      fetchedAt: new Date(),
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return {
      ...emptyResult,
      error: isTimeout
        ? `DataForSEO AI overview request timed out after ${timeoutMs}ms`
        : `DataForSEO AI overview request failed: ${errorMessage}`,
    };
  }
}

// --- Main Export ---

/**
 * Fetches competitive intelligence data from DataForSEO.
 *
 * Supports three data types:
 * - `backlinks`: Domain backlink profile (top backlinks by page rank, totals, domain rank)
 * - `keywords`: Ranked keywords with search volume, position, and traffic estimates
 * - `ai-overview`: Which keywords trigger Google AI Overview and whether the domain is cited
 *
 * Uses Basic auth (login:password). Gracefully handles API failures — returns
 * partial data with `success: false` and an `error` message instead of throwing.
 */
export async function fetchDataForSEO(
  domain: string,
  type: DataForSEOFetchType,
  options: {
    login: string;
    password: string;
    location?: string;
    language?: string;
    limit?: number;
    timeoutMs?: number;
  } = { login: '', password: '' },
): Promise<DataForSEOResult> {
  const {
    login,
    password,
    location,
    language = 'en',
    limit = 100,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  const normalizedDomain = normalizeDomain(domain);

  if (!login || !password) {
    const base = {
      domain: normalizedDomain,
      success: false as const,
      fetchedAt: new Date(),
      error: 'DataForSEO credentials are not configured',
    };

    switch (type) {
      case 'backlinks':
        return { ...base, totalBacklinks: 0, totalReferringDomains: 0, backlinks: [], domainRank: null };
      case 'keywords':
        return { ...base, totalKeywords: 0, keywords: [], estimatedTraffic: null };
      case 'ai-overview':
        return { ...base, totalKeywordsWithAIOverview: 0, domainAppearanceCount: 0, items: [] };
    }
  }

  if (!domain.trim()) {
    const base = {
      domain: '',
      success: false as const,
      fetchedAt: new Date(),
      error: 'Domain is empty',
    };

    switch (type) {
      case 'backlinks':
        return { ...base, totalBacklinks: 0, totalReferringDomains: 0, backlinks: [], domainRank: null };
      case 'keywords':
        return { ...base, totalKeywords: 0, keywords: [], estimatedTraffic: null };
      case 'ai-overview':
        return { ...base, totalKeywordsWithAIOverview: 0, domainAppearanceCount: 0, items: [] };
    }
  }

  const auth = { login, password };

  switch (type) {
    case 'backlinks':
      return await fetchBacklinks(normalizedDomain, auth, limit, timeoutMs);
    case 'keywords':
      return await fetchKeywords(normalizedDomain, auth, location, language, limit, timeoutMs);
    case 'ai-overview':
      return await fetchAIOverview(normalizedDomain, auth, location, language, limit, timeoutMs);
  }
}

// --- Type Guards ---

export function isBacklinksResult(result: DataForSEOResult): result is BacklinksResult {
  return 'backlinks' in result && 'totalBacklinks' in result;
}

export function isKeywordsResult(result: DataForSEOResult): result is KeywordsResult {
  return 'keywords' in result && 'totalKeywords' in result;
}

export function isAIOverviewResult(result: DataForSEOResult): result is AIOverviewResult {
  return 'items' in result && 'totalKeywordsWithAIOverview' in result;
}
