// Owner: S4 (AI Engine Providers). Consumer: S12 (Pipeline Orchestration).
// Inngest-compatible step function that queries AI engines using Vercel AI SDK v6.
// Uses Promise.allSettled() for multi-provider queries -- never Promise.all().

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createPerplexity } from '@ai-sdk/perplexity';
import {
  QueryInputSchema,
  MultiQueryInputSchema,
  EngineResponseSchema,
  MultiProviderResultSchema,
  type QueryInput,
  type MultiQueryInput,
  type EngineResponse,
  type MultiProviderResult,
  type Platform,
} from '@pare-engine/core/contracts';

export class QueryError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'QueryError';
    this.code = code;
  }
}

export interface QueryStepConfig {
  openaiApiKey: string;
  googleGenerativeAiApiKey: string;
  perplexityApiKey: string;
}

function createProviders(config: QueryStepConfig) {
  const openai = createOpenAI({ apiKey: config.openaiApiKey });
  const google = createGoogleGenerativeAI({ apiKey: config.googleGenerativeAiApiKey });
  const perplexity = createPerplexity({ apiKey: config.perplexityApiKey });
  return { openai, google, perplexity };
}

function buildQuerySystemPrompt(brand: string, domain: string): string {
  return [
    'You are a helpful assistant answering questions about local businesses and services.',
    'Provide detailed, factual answers based on your knowledge and any available web sources.',
    'Include specific details like business names, locations, services, and any relevant',
    'reviews or ratings when available.',
    'The user is asking about "' + brand + '" (' + domain + ') or related businesses in their area.',
  ].join(' ');
}

function extractSources(sources: ReadonlyArray<{ sourceType?: string; url?: string; title?: string }>): {
  citedUrls: string[];
  groundingSources: Array<{ url: string; title?: string }>;
} {
  const citedUrls: string[] = [];
  const groundingSources: Array<{ url: string; title?: string }> = [];
  for (const source of sources) {
    if (source.sourceType === 'url' && source.url) {
      citedUrls.push(source.url);
      groundingSources.push({ url: source.url, title: source.title ?? undefined });
    }
  }
  return { citedUrls, groundingSources };
}

function buildSuccessResponse(params: {
  platform: Platform;
  query: string;
  text: string;
  sources: ReadonlyArray<{ sourceType?: string; url?: string; title?: string }>;
  latencyMs: number;
}): EngineResponse {
  const { citedUrls, groundingSources } = extractSources(params.sources);
  const response: EngineResponse = {
    platform: params.platform,
    query: params.query,
    rawResponse: params.text,
    citedUrls,
    groundingSources,
    executedAt: new Date(),
    latencyMs: params.latencyMs,
    success: true,
  };
  return EngineResponseSchema.parse(response);
}

function buildFailureResponse(params: {
  platform: Platform;
  query: string;
  error: string;
  latencyMs: number;
}): EngineResponse {
  const response: EngineResponse = {
    platform: params.platform,
    query: params.query,
    rawResponse: '',
    citedUrls: [],
    groundingSources: [],
    executedAt: new Date(),
    latencyMs: params.latencyMs,
    success: false,
    error: params.error,
  };
  return EngineResponseSchema.parse(response);
}

async function queryOpenAI(input: QueryInput, config: QueryStepConfig): Promise<EngineResponse> {
  const startTime = Date.now();
  const providers = createProviders(config);
  try {
    const result = await generateText({
      model: providers.openai.responses('gpt-4o'),
      tools: { web_search: providers.openai.tools.webSearch({ searchContextSize: 'medium' }) },
      system: buildQuerySystemPrompt(input.brand, input.domain),
      prompt: input.query,
    });
    return buildSuccessResponse({
      platform: 'chatgpt', query: input.query, text: result.text,
      sources: result.sources, latencyMs: Date.now() - startTime,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return buildFailureResponse({
      platform: 'chatgpt', query: input.query,
      error: 'OpenAI query failed: ' + errorMessage, latencyMs: Date.now() - startTime,
    });
  }
}

async function queryPerplexity(input: QueryInput, config: QueryStepConfig): Promise<EngineResponse> {
  const startTime = Date.now();
  const providers = createProviders(config);
  try {
    const result = await generateText({
      model: providers.perplexity('sonar'),
      system: buildQuerySystemPrompt(input.brand, input.domain),
      prompt: input.query,
    });
    return buildSuccessResponse({
      platform: 'perplexity', query: input.query, text: result.text,
      sources: result.sources, latencyMs: Date.now() - startTime,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return buildFailureResponse({
      platform: 'perplexity', query: input.query,
      error: 'Perplexity query failed: ' + errorMessage, latencyMs: Date.now() - startTime,
    });
  }
}

async function queryGemini(input: QueryInput, config: QueryStepConfig): Promise<EngineResponse> {
  const startTime = Date.now();
  const providers = createProviders(config);
  try {
    const result = await generateText({
      model: providers.google('gemini-2.0-flash'),
      tools: { google_search: providers.google.tools.googleSearch({}) },
      system: buildQuerySystemPrompt(input.brand, input.domain),
      prompt: input.query,
    });
    return buildSuccessResponse({
      platform: 'gemini', query: input.query, text: result.text,
      sources: result.sources, latencyMs: Date.now() - startTime,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return buildFailureResponse({
      platform: 'gemini', query: input.query,
      error: 'Gemini query failed: ' + errorMessage, latencyMs: Date.now() - startTime,
    });
  }
}

const PLATFORM_QUERY_MAP: Record<
  Platform,
  (input: QueryInput, config: QueryStepConfig) => Promise<EngineResponse>
> = {
  chatgpt: queryOpenAI,
  perplexity: queryPerplexity,
  gemini: queryGemini,
};

export async function queryEngine(input: QueryInput, config: QueryStepConfig): Promise<EngineResponse> {
  const validated = QueryInputSchema.parse(input);
  const queryFn = PLATFORM_QUERY_MAP[validated.platform];
  return queryFn(validated, config);
}

export async function queryAllEngines(input: MultiQueryInput, config: QueryStepConfig): Promise<MultiProviderResult> {
  const validated = MultiQueryInputSchema.parse(input);
  const queryTasks: Array<{ query: string; platform: Platform }> = [];
  for (const query of validated.queries) {
    for (const platform of validated.platforms) {
      queryTasks.push({ query, platform });
    }
  }

  const settledResults = await Promise.allSettled(
    queryTasks.map(async (task) => {
      const queryInput: QueryInput = {
        brand: validated.brand, domain: validated.domain,
        query: task.query, platform: task.platform, competitors: validated.competitors,
      };
      return queryEngine(queryInput, config);
    }),
  );

  const responses: EngineResponse[] = [];
  const failedPlatformMap = new Map<Platform, string[]>();

  for (let i = 0; i < settledResults.length; i++) {
    const settled = settledResults[i];
    const task = queryTasks[i];
    if (settled.status === 'fulfilled') {
      responses.push(settled.value);
      if (!settled.value.success && settled.value.error) {
        const existing = failedPlatformMap.get(task.platform) ?? [];
        existing.push(settled.value.error);
        failedPlatformMap.set(task.platform, existing);
      }
    } else {
      const errorMessage = settled.reason instanceof Error ? settled.reason.message : String(settled.reason);
      const existing = failedPlatformMap.get(task.platform) ?? [];
      existing.push(errorMessage);
      failedPlatformMap.set(task.platform, existing);
    }
  }

  const failedPlatforms: Array<{ platform: Platform; error: string }> = [];
  for (const platform of validated.platforms) {
    const platformResponses = responses.filter((r) => r.platform === platform);
    const successCount = platformResponses.filter((r) => r.success).length;
    if (successCount === 0) {
      const errors = failedPlatformMap.get(platform) ?? ['Unknown error'];
      failedPlatforms.push({ platform, error: errors.join('; ') });
    }
  }

  const result: MultiProviderResult = {
    brand: validated.brand, domain: validated.domain,
    responses, failedPlatforms, queriedAt: new Date(),
  };
  return MultiProviderResultSchema.parse(result);
}

export async function executeQueryStep(input: MultiQueryInput, config: QueryStepConfig): Promise<MultiProviderResult> {
  const result = await queryAllEngines(input, config);
  const successfulResponses = result.responses.filter((r) => r.success);
  if (successfulResponses.length === 0) {
    const failureSummary = result.failedPlatforms.map((f) => f.platform + ': ' + f.error).join('; ');
    throw new QueryError(
      'All providers failed for ' + input.brand + ' (' + input.domain + '). Failures: ' + (failureSummary || 'No details available'),
      'QUERY_ALL_PROVIDERS_FAILED',
    );
  }
  return result;
}
