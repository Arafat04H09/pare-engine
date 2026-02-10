// Owner: S5 (LLM Parser + Content Scoring). Consumer: S12.
import { z } from 'zod';
import { ParsedMentionSchema, ContentPageAnalysisSchema, type ParsedMention, type ContentPageAnalysis } from '../contracts/analysis.contract.js';
import type { EngineResponse } from '../contracts/query.contract.js';

export class ParseResponseError extends Error {
  readonly code: string;
  constructor(message: string, code: string) { super(message); this.name = 'ParseResponseError'; this.code = code; }
}

export function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  const matches = text.match(urlRegex) || [];
  const cleaned = matches.map((url) => url.replace(/[.,;:!?)]+$/, ''));
  return [...new Set(cleaned)];
}

export function countWords(markdown: string): number {
  const stripped = markdown.replace(/!\[.*?\]\(.*?\)/g, '').replace(/\[([^\]]*)\]\(.*?\)/g, '$1').replace(/#{1,6}\s/g, '').replace(/[*_~`]+/g, '').replace(/\|[^|]*\|/g, '').replace(/[-=]{3,}/g, '');
  return stripped.split(/\s+/).filter((w) => w.length > 0).length;
}

export const LLMParsedMentionSchema = z.object({
  reasoning: z.string(),
  brandMentioned: z.boolean(),
  brandPosition: z.number().int().nullable(),
  brandSentiment: z.enum(['positive', 'neutral', 'negative', 'not_mentioned']),
  brandUrlCited: z.boolean(),
  citedUrls: z.array(z.string()),
  competitorMentions: z.record(z.object({ mentioned: z.boolean(), position: z.number().int().nullable(), sentiment: z.enum(['positive', 'neutral', 'negative', 'not_mentioned']) })),
});
export type LLMParsedMention = z.infer<typeof LLMParsedMentionSchema>;

export function buildParseSystemPrompt(): string {
  return 'You are an expert at analyzing AI engine responses to extract brand mention data. Determine: 1) brand mentioned 2) position among businesses 3) sentiment 4) URL cited 5) all URLs 6) competitor analysis. Sentiment: positive=recommends/praises, neutral=factual, negative=warns/criticizes, not_mentioned=absent. Position: order of appearance, 1=first.';
}

export function buildParseUserPrompt(response: EngineResponse, brand: string, domain: string, competitors: string[]): string {
  const cl = competitors.length > 0 ? 'Competitors: ' + competitors.join(', ') : 'No competitors.';
  return 'Brand: "' + brand + '"\nDomain: "' + domain + '"\n' + cl + '\nPlatform: ' + response.platform + '\nQuery: "' + response.query + '"\nResponse:\n---\n' + response.rawResponse + '\n---\nCited URLs: ' + (response.citedUrls.length > 0 ? response.citedUrls.join(', ') : 'none');
}

export function toLLMParsedMention(llmOutput: LLMParsedMention): ParsedMention {
  const { reasoning: _r, ...mention } = llmOutput;
  return ParsedMentionSchema.parse(mention);
}

export const LLMContentPageAnalysisSchema = z.object({
  reasoning: z.string(),
  answerFirstScore: z.number().min(0).max(10),
  faqPresent: z.boolean(),
  statsCount: z.number().int().min(0),
  hasAuthorAttribution: z.boolean(),
  depthScore: z.number().min(0).max(10),
});
export type LLMContentPageAnalysis = z.infer<typeof LLMContentPageAnalysisSchema>;

export function buildContentAnalysisSystemPrompt(): string {
  return 'You are an expert at evaluating website content quality for GEO. Score: answerFirstScore(0-10), faqPresent(bool), statsCount(int), hasAuthorAttribution(bool), depthScore(0-10). Most average pages score 3-6.';
}

export function buildContentAnalysisUserPrompt(url: string, markdown: string): string {
  const t = markdown.length > 8000 ? markdown.slice(0, 8000) + '\n[truncated]' : markdown;
  return 'URL: ' + url + '\n\nContent:\n---\n' + t + '\n---';
}

export function toContentPageAnalysis(llmOutput: LLMContentPageAnalysis, url: string, wordCount: number): ContentPageAnalysis {
  const { reasoning: _r, ...analysis } = llmOutput;
  return ContentPageAnalysisSchema.parse({ ...analysis, url, wordCount });
}

export type { ParsedMention, ContentPageAnalysis };
export { ParsedMentionSchema, ContentPageAnalysisSchema };
