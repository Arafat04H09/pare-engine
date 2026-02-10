// Owner: S5 (LLM Parser + Content Scoring). Consumer: S12 (Pipeline Orchestration).
// Inngest-compatible step: content analysis + engine response parsing via Claude Haiku.
// Sentiment analysis is LLM-based (NOT keyword matching) per CLAUDE.md.
// Uses Promise.allSettled() for parallel page analysis.

import { z } from 'zod';
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { type EngineResponse, type ParsedMention, type ContentAnalysisOutput, type ContentPageAnalysis, ParsedMentionSchema, ContentPageAnalysisSchema, ContentAnalysisOutputSchema } from '@pare-engine/core/contracts';

export class ContentAnalysisError extends Error {
  readonly code: string;
  constructor(message: string, code: string) { super(message); this.name = 'ContentAnalysisError'; this.code = code; }
}

const HAIKU_MODEL = 'claude-3-5-haiku-20241022';
const MAX_CONCURRENT_PAGES = 5;

function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  const matches = text.match(urlRegex) || [];
  const cleaned = matches.map((url) => url.replace(/[.,;:!?)]+$/, ''));
  return [...new Set(cleaned)];
}

function countWords(markdown: string): number {
  const stripped = markdown.replace(/!\[.*?\]\(.*?\)/g, '').replace(/\[([^\]]*)\]\(.*?\)/g, '$1').replace(/#{1,6}\s/g, '').replace(/[*_~`]+/g, '').replace(/\|[^|]*\|/g, '').replace(/[-=]{3,}/g, '');
  return stripped.split(/\s+/).filter((w) => w.length > 0).length;
}

const LLMParsedMentionSchema = z.object({
  reasoning: z.string().describe('Brief explanation of brand mention, position, and sentiment determination'),
  brandMentioned: z.boolean().describe('Whether the brand/business is mentioned in the response'),
  brandPosition: z.number().int().nullable().describe('Rank position among businesses mentioned (1=first). Null if not mentioned.'),
  brandSentiment: z.enum(['positive', 'neutral', 'negative', 'not_mentioned']).describe('Sentiment toward the brand'),
  brandUrlCited: z.boolean().describe('Whether the brand domain URL appears in the response'),
  citedUrls: z.array(z.string()).describe('All URLs cited in the response'),
  competitorMentions: z.record(z.object({ mentioned: z.boolean(), position: z.number().int().nullable(), sentiment: z.enum(['positive', 'neutral', 'negative', 'not_mentioned']) })).describe('Competitor mention analysis'),
});

function buildParseSystemPrompt(): string {
  return `You are an expert at analyzing AI engine responses to extract brand mention data.
Determine: 1) brand mentioned 2) position among businesses (1=first) 3) sentiment 4) URL cited 5) all URLs 6) competitor analysis.
Sentiment rules: positive=recommends/praises, neutral=factual, negative=warns/criticizes, not_mentioned=absent.
Position rules: order of appearance, only distinct entities. Null if not mentioned.
Consider name variations (e.g., "Smith Dental" vs "Smith's Dental Practice").`;
}

function buildParseUserPrompt(response: EngineResponse, brand: string, domain: string, competitors: string[]): string {
  const cl = competitors.length > 0 ? `Competitors to track: ${competitors.join(', ')}` : 'No competitors specified.';
  return `Analyze this AI engine response for brand mentions.

Brand to find: "${brand}"
Brand domain: "${domain}"
${cl}

Platform: ${response.platform}
Query: "${response.query}"

Response text:
---
${response.rawResponse}
---

Known cited URLs: ${response.citedUrls.length > 0 ? response.citedUrls.join('\n') : '(none)'}
Grounding sources: ${response.groundingSources.length > 0 ? response.groundingSources.map((s) => s.url).join('\n') : '(none)'}`;
}

const LLMContentPageAnalysisSchema = z.object({
  reasoning: z.string().describe('Brief content quality assessment'),
  answerFirstScore: z.number().min(0).max(10).describe('How well the page leads with a direct answer (0-10)'),
  faqPresent: z.boolean().describe('Whether the page contains FAQ or Q&A content'),
  statsCount: z.number().int().min(0).describe('Number of concrete statistics/data points'),
  hasAuthorAttribution: z.boolean().describe('Whether the page has named author/byline/credentials'),
  depthScore: z.number().min(0).max(10).describe('Content depth and thoroughness (0-10)'),
});

function buildContentAnalysisSystemPrompt(): string {
  return `You are an expert at evaluating website content quality for AI engine optimization (GEO).
Score each page on: answerFirstScore (0-10: 0=fluff, 5-6=reasonable, 9-10=exemplary answer-first),
faqPresent (true if Q&A/FAQ content), statsCount (concrete data points only, not vague qualifiers),
hasAuthorAttribution (true if named author/byline/bio), depthScore (0-10: 0-2=thin, 5-6=decent, 9-10=comprehensive).
Most average business pages score 3-6 on answer-first and depth. Be fair and calibrated.`;
}

function buildContentAnalysisUserPrompt(url: string, markdown: string): string {
  const maxLen = 8000;
  const t = markdown.length > maxLen ? markdown.slice(0, maxLen) + '\n\n[... content truncated ...]' : markdown;
  return `Analyze the content quality of this webpage.

URL: ${url}

Page content (Markdown):
---
${t}
---

Evaluate across all dimensions. Be specific in your reasoning.`;
}

export async function parseEngineResponse(response: EngineResponse, brand: string, domain: string, competitors: string[]): Promise<ParsedMention> {
  if (!response.success || !response.rawResponse) {
    const emptyComp: Record<string, { mentioned: boolean; position: number | null; sentiment: 'positive' | 'neutral' | 'negative' | 'not_mentioned' }> = {};
    for (const c of competitors) { emptyComp[c] = { mentioned: false, position: null, sentiment: 'not_mentioned' }; }
    return { brandMentioned: false, brandPosition: null, brandSentiment: 'not_mentioned', brandUrlCited: false, citedUrls: [], competitorMentions: emptyComp };
  }

  try {
    const { object } = await generateObject({ model: anthropic(HAIKU_MODEL), schema: LLMParsedMentionSchema, system: buildParseSystemPrompt(), prompt: buildParseUserPrompt(response, brand, domain, competitors) });
    const platformUrls = [...response.citedUrls, ...response.groundingSources.map((s) => s.url)];
    const textUrls = extractUrls(response.rawResponse);
    const mergedUrls = [...new Set([...object.citedUrls, ...platformUrls, ...textUrls])];
    const domainNorm = domain.replace(/^www\./, '').toLowerCase();
    const brandUrlCited = object.brandUrlCited || mergedUrls.some((u) => u.toLowerCase().includes(domainNorm));
    const { reasoning: _r, ...mentionData } = object;
    return ParsedMentionSchema.parse({ ...mentionData, citedUrls: mergedUrls, brandUrlCited });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new ContentAnalysisError(`Failed to parse engine response from ${response.platform}: ${msg}`, 'PARSE_LLM_FAILED');
  }
}

async function analyzePageContent(url: string, markdown: string): Promise<ContentPageAnalysis> {
  const wordCount = countWords(markdown);
  if (wordCount < 50) {
    return ContentPageAnalysisSchema.parse({ url, answerFirstScore: 0, faqPresent: false, statsCount: 0, hasAuthorAttribution: false, wordCount, depthScore: 0 });
  }
  const { object } = await generateObject({ model: anthropic(HAIKU_MODEL), schema: LLMContentPageAnalysisSchema, system: buildContentAnalysisSystemPrompt(), prompt: buildContentAnalysisUserPrompt(url, markdown) });
  const { reasoning: _r, ...analysis } = object;
  return ContentPageAnalysisSchema.parse({ ...analysis, url, wordCount });
}

async function processBatched<T, R>(items: T[], processor: (item: T) => Promise<R>, concurrency: number): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map((item) => processor(item)));
    results.push(...batchResults);
  }
  return results;
}

export async function analyzeContent(pages: Array<{ url: string; markdown: string; html: string }>): Promise<ContentAnalysisOutput> {
  if (pages.length === 0) {
    return ContentAnalysisOutputSchema.parse({ pages: [], averageAnswerFirstScore: 0, faqPageCount: 0, averageStatsDensity: 0, authorAttributionRate: 0, analyzedAt: new Date() });
  }
  const results = await processBatched(pages, (page) => analyzePageContent(page.url, page.markdown), MAX_CONCURRENT_PAGES);
  const analyzedPages: ContentPageAnalysis[] = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled') { analyzedPages.push(result.value); }
    else { console.error(`[S5] Content analysis failed for ${pages[i]?.url ?? 'unknown'}: ${result.reason}`); }
  }
  const n = analyzedPages.length;
  const output: ContentAnalysisOutput = {
    pages: analyzedPages,
    averageAnswerFirstScore: n > 0 ? analyzedPages.reduce((s, p) => s + p.answerFirstScore, 0) / n : 0,
    faqPageCount: analyzedPages.filter((p) => p.faqPresent).length,
    averageStatsDensity: n > 0 ? analyzedPages.reduce((s, p) => s + p.statsCount, 0) / n : 0,
    authorAttributionRate: n > 0 ? analyzedPages.filter((p) => p.hasAuthorAttribution).length / n : 0,
    analyzedAt: new Date(),
  };
  return ContentAnalysisOutputSchema.parse(output);
}

export async function executeContentAnalysisStep(pages: Array<{ url: string; markdown: string; html: string }>): Promise<ContentAnalysisOutput> {
  const output = await analyzeContent(pages);
  if (output.pages.length === 0 && pages.length > 0) {
    throw new ContentAnalysisError(`Content analysis failed for all ${pages.length} pages. Likely API auth or rate limit issue.`, 'CONTENT_ANALYSIS_TOTAL_FAILURE');
  }
  return output;
}

export async function executeParseResponsesStep(responses: EngineResponse[], brand: string, domain: string, competitors: string[]): Promise<ParsedMention[]> {
  const results = await Promise.allSettled(responses.map((r) => parseEngineResponse(r, brand, domain, competitors)));
  const parsed: ParsedMention[] = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled') { parsed.push(result.value); }
    else {
      console.error(`[S5] Failed to parse response from ${responses[i]?.platform ?? 'unknown'}: ${result.reason}`);
      const emptyComp: Record<string, { mentioned: boolean; position: number | null; sentiment: 'positive' | 'neutral' | 'negative' | 'not_mentioned' }> = {};
      for (const c of competitors) { emptyComp[c] = { mentioned: false, position: null, sentiment: 'not_mentioned' }; }
      parsed.push({ brandMentioned: false, brandPosition: null, brandSentiment: 'not_mentioned', brandUrlCited: false, citedUrls: [], competitorMentions: emptyComp });
    }
  }
  return parsed;
}
