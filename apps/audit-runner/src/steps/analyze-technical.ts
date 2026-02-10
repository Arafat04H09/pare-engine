// Owner: S6 (Technical Readiness). Consumer: S12 (Pipeline Orchestration).
// Inngest-compatible step function that performs technical readiness analysis.
// PageSpeed logic duplicated from packages/core/src/tools/pagespeed.ts (no subpath export yet).

import {
  TechnicalAnalysisOutputSchema,
  type TechnicalAnalysisOutput,
  type RobotsTxtAnalysis,
  type CrawledPage,
} from '@pare-engine/core/contracts';

export class TechnicalAnalysisError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'TechnicalAnalysisError';
    this.code = code;
  }
}

export const AI_BOTS = [
  'GPTBot', 'ChatGPT-User', 'ClaudeBot', 'anthropic-ai', 'PerplexityBot',
  'Google-Extended', 'Googlebot', 'Bingbot', 'Amazonbot', 'Bytespider',
  'Applebot-Extended', 'cohere-ai',
] as const;

async function fetchText(url: string, timeoutMs: number = 10000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'PareEngine/1.0 (audit)' },
      });
    } finally { clearTimeout(timeoutId); }
    if (!response.ok) return null;
    return await response.text();
  } catch { return null; }
}

function normalizeDomain(domain: string): string {
  let normalized = domain.trim().replace(/\/+$/, '');
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }
  return normalized;
}

// --- PageSpeed (duplicated from packages/core/src/tools/pagespeed.ts) ---

interface PageSpeedResult {
  performanceScore: number | null;
  accessibilityScore: number | null;
  seoScore: number | null;
  coreWebVitals: { lcp: number | null; fid: number | null; cls: number | null };
  testedUrl: string;
  success: boolean;
  error?: string;
}

interface PageSpeedApiResponse {
  lighthouseResult?: {
    categories?: {
      performance?: { score: number | null };
      accessibility?: { score: number | null };
      seo?: { score: number | null };
    };
    audits?: {
      'largest-contentful-paint'?: { numericValue?: number };
      'max-potential-fid'?: { numericValue?: number };
      'cumulative-layout-shift'?: { numericValue?: number };
    };
    finalUrl?: string;
  };
  error?: { message: string };
}

const PAGESPEED_API_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

function normalizeScore(score: number | null | undefined): number | null {
  if (score === null || score === undefined) return null;
  return Math.round(score * 100);
}

async function fetchPageSpeed(
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
    return { ...failureResult, error: isTimeout
      ? `PageSpeed API request timed out after ${timeoutMs}ms`
      : `PageSpeed API request failed: ${errorMessage}` };
  }
}

// --- robots.txt ---

async function checkRobotsTxt(domain: string): Promise<RobotsTxtAnalysis> {
  const content = await fetchText(`${domain}/robots.txt`);
  if (!content) {
    return { exists: false, aiFriendly: true, blockedBots: [], allowedBots: [...AI_BOTS] };
  }

  const blockedBots: string[] = [];
  const allowedBots: string[] = [];
  const lines = content.split('\n').map((l) => l.trim());
  const sections: Map<string, string[]> = new Map();
  let currentAgents: string[] = [];

  for (const line of lines) {
    if (line.startsWith('#') || line === '') {
      if (line === '' && currentAgents.length > 0) currentAgents = [];
      continue;
    }
    const lowerLine = line.toLowerCase();
    if (lowerLine.startsWith('user-agent:')) {
      const agent = line.substring('user-agent:'.length).trim().toLowerCase();
      currentAgents.push(agent);
      if (!sections.has(agent)) sections.set(agent, []);
    } else if (currentAgents.length > 0) {
      for (const agent of currentAgents) {
        const existing = sections.get(agent) ?? [];
        existing.push(line);
        sections.set(agent, existing);
      }
    }
  }

  for (const bot of AI_BOTS) {
    const botRules = sections.get(bot.toLowerCase()) ?? [];
    const wildcardRules = sections.get('*') ?? [];
    const rulesToCheck = botRules.length > 0 ? botRules : wildcardRules;
    let isBlocked = false;
    for (const rule of rulesToCheck) {
      const rl = rule.toLowerCase().trim();
      if (rl.startsWith('disallow:')) {
        const p = rl.substring('disallow:'.length).trim();
        if (p === '/' || p === '/*') isBlocked = true;
      }
      if (rl.startsWith('allow:')) {
        const p = rl.substring('allow:'.length).trim();
        if (p === '/' || p === '/*') isBlocked = false;
      }
    }
    if (isBlocked) blockedBots.push(bot);
    else allowedBots.push(bot);
  }

  return { exists: true, aiFriendly: blockedBots.length === 0, blockedBots, allowedBots };
}

// --- llms.txt ---

async function checkLlmsTxt(domain: string): Promise<{ standard: boolean; full: boolean }> {
  const [stdRes, fullRes] = await Promise.allSettled([
    fetchText(`${domain}/llms.txt`),
    fetchText(`${domain}/llms-full.txt`),
  ]);
  return {
    standard: stdRes.status === 'fulfilled' && stdRes.value !== null && stdRes.value.length > 0,
    full: fullRes.status === 'fulfilled' && fullRes.value !== null && fullRes.value.length > 0,
  };
}

// --- sitemap ---

async function checkSitemap(domain: string): Promise<{ present: boolean; urlCount?: number }> {
  const content = await fetchText(`${domain}/sitemap.xml`);
  if (!content) {
    const alt = await fetchText(`${domain}/sitemap_index.xml`);
    if (alt && (alt.includes('<sitemapindex') || alt.includes('<urlset'))) {
      const m = alt.match(/<loc>/gi);
      return { present: true, urlCount: m?.length ?? undefined };
    }
    return { present: false };
  }
  if (!content.includes('<urlset') && !content.includes('<sitemapindex')) return { present: false };
  const m = content.match(/<loc>/gi);
  return { present: true, urlCount: m?.length ?? undefined };
}

// --- HTTPS ---

function checkHttps(domain: string, pages: CrawledPage[]): boolean {
  if (domain.startsWith('https://')) return true;
  if (pages.length > 0) return pages.some((p) => p.url.startsWith('https://'));
  return normalizeDomain(domain).startsWith('https://');
}

// --- Mobile ---

function checkMobileFriendly(ps: PageSpeedResult | null): boolean {
  if (!ps || !ps.success) return false;
  return (ps.seoScore ?? 0) >= 80 && (ps.performanceScore ?? 0) >= 40;
}

// --- Public API ---

export async function analyzeTechnical(
  pages: CrawledPage[],
  domain: string,
): Promise<TechnicalAnalysisOutput> {
  const nd = normalizeDomain(domain);
  const [rr, lr, sr, pr] = await Promise.allSettled([
    checkRobotsTxt(nd), checkLlmsTxt(nd), checkSitemap(nd),
    fetchPageSpeed(nd, { strategy: 'mobile' }),
  ]);

  const robotsTxt: RobotsTxtAnalysis = rr.status === 'fulfilled'
    ? rr.value
    : { exists: false, aiFriendly: true, blockedBots: [], allowedBots: [...AI_BOTS] };
  const llms = lr.status === 'fulfilled' ? lr.value : { standard: false, full: false };
  const sitemap = sr.status === 'fulfilled' ? sr.value : { present: false };
  const ps: PageSpeedResult | null = pr.status === 'fulfilled' ? pr.value : null;

  const output: TechnicalAnalysisOutput = {
    robotsTxt,
    llmsTxtPresent: llms.standard,
    llmsFullTxtPresent: llms.full,
    sitemapPresent: sitemap.present,
    sitemapUrlCount: sitemap.urlCount,
    httpsEnabled: checkHttps(domain, pages),
    mobileFriendly: checkMobileFriendly(ps),
    pageSpeedScore: ps?.performanceScore ?? undefined,
    performanceScore: ps?.performanceScore ?? undefined,
    accessibilityScore: ps?.accessibilityScore ?? undefined,
    seoScore: ps?.seoScore ?? undefined,
    coreWebVitals: ps?.success
      ? { lcp: ps.coreWebVitals.lcp ?? undefined, fid: ps.coreWebVitals.fid ?? undefined, cls: ps.coreWebVitals.cls ?? undefined }
      : undefined,
    analyzedAt: new Date(),
  };

  return TechnicalAnalysisOutputSchema.parse(output);
}

export async function executeTechnicalAnalysisStep(
  pages: CrawledPage[],
  domain: string,
): Promise<TechnicalAnalysisOutput> {
  try {
    return await analyzeTechnical(pages, domain);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new TechnicalAnalysisError(
      `Technical analysis of ${domain} failed: ${msg}`,
      'TECHNICAL_ANALYSIS_FAILED',
    );
  }
}
