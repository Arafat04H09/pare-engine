// Owner: S6 (Technical Readiness). Consumer: S12 (Pipeline Orchestration).
// Typed tool function for fetching Google PageSpeed Insights data.

export class PageSpeedError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'PageSpeedError';
    this.code = code;
  }
}

export interface PageSpeedResult {
  performanceScore: number | null;
  accessibilityScore: number | null;
  seoScore: number | null;
  coreWebVitals: { lcp: number | null; fid: number | null; cls: number | null };
  testedUrl: string;
  success: boolean;
  error?: string;
}

interface LighthouseCategory { score: number | null }
interface LighthouseAudit { numericValue?: number }
interface PageSpeedApiResponse {
  lighthouseResult?: {
    categories?: { performance?: LighthouseCategory; accessibility?: LighthouseCategory; seo?: LighthouseCategory };
    audits?: { 'largest-contentful-paint'?: LighthouseAudit; 'max-potential-fid'?: LighthouseAudit; 'cumulative-layout-shift'?: LighthouseAudit };
    finalUrl?: string;
  };
  error?: { message: string };
}

const PAGESPEED_API_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

function normalizeScore(score: number | null | undefined): number | null {
  if (score === null || score === undefined) return null;
  return Math.round(score * 100);
}

export async function fetchPageSpeed(
  url: string,
  options: { strategy?: 'mobile' | 'desktop'; apiKey?: string; timeoutMs?: number } = {},
): Promise<PageSpeedResult> {
  const { strategy = 'mobile', apiKey, timeoutMs = 30000 } = options;
  const failureResult: PageSpeedResult = {
    performanceScore: null, accessibilityScore: null, seoScore: null,
    coreWebVitals: { lcp: null, fid: null, cls: null }, testedUrl: url, success: false,
  };
  try {
    const params = new URLSearchParams({ url, strategy, category: 'performance' });
    params.append('category', 'accessibility');
    params.append('category', 'seo');
    if (apiKey) params.set('key', apiKey);
    const apiUrl = `${PAGESPEED_API_URL}?${params.toString()}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try { response = await fetch(apiUrl, { signal: controller.signal }); }
    finally { clearTimeout(timeoutId); }
    if (!response.ok) return { ...failureResult, error: `PageSpeed API returned HTTP ${response.status}: ${response.statusText}` };
    const data = (await response.json()) as PageSpeedApiResponse;
    if (data.error) return { ...failureResult, error: `PageSpeed API error: ${data.error.message}` };
    const lighthouse = data.lighthouseResult;
    if (!lighthouse) return { ...failureResult, error: 'PageSpeed API returned no Lighthouse result' };
    const categories = lighthouse.categories ?? {};
    const audits = lighthouse.audits ?? {};
    return {
      performanceScore: normalizeScore(categories.performance?.score),
      accessibilityScore: normalizeScore(categories.accessibility?.score),
      seoScore: normalizeScore(categories.seo?.score),
      coreWebVitals: {
        lcp: audits['largest-contentful-paint']?.numericValue ?? null,
        fid: audits['max-potential-fid']?.numericValue ?? null,
        cls: audits['cumulative-layout-shift']?.numericValue ?? null,
      },
      testedUrl: lighthouse.finalUrl ?? url, success: true,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return { ...failureResult, error: isTimeout ? `PageSpeed API request timed out after ${timeoutMs}ms` : `PageSpeed API request failed: ${errorMessage}` };
  }
}
