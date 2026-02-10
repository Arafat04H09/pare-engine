// Owner: S4 (AI Engine Providers). Consumer: S12 (Pipeline Orchestration).
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
} from '../contracts/query.contract.js';

export class QueryError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'QueryError';
    this.code = code;
  }
}

export function validateQueryInput(input: QueryInput): QueryInput {
  return QueryInputSchema.parse(input);
}

export function validateMultiQueryInput(input: MultiQueryInput): MultiQueryInput {
  return MultiQueryInputSchema.parse(input);
}

export function buildEngineResponse(params: {
  platform: Platform;
  query: string;
  rawResponse: string;
  citedUrls: string[];
  groundingSources?: Array<{ url: string; title?: string }>;
  executedAt: Date;
  latencyMs: number;
  success: boolean;
  error?: string;
}): EngineResponse {
  const response: EngineResponse = {
    platform: params.platform,
    query: params.query,
    rawResponse: params.rawResponse,
    citedUrls: params.citedUrls,
    groundingSources: params.groundingSources ?? [],
    executedAt: params.executedAt,
    latencyMs: params.latencyMs,
    success: params.success,
    error: params.error,
  };
  return EngineResponseSchema.parse(response);
}

export function buildMultiProviderResult(params: {
  brand: string;
  domain: string;
  responses: EngineResponse[];
  failedPlatforms: Array<{ platform: Platform; error: string }>;
}): MultiProviderResult {
  const result: MultiProviderResult = {
    brand: params.brand,
    domain: params.domain,
    responses: params.responses,
    failedPlatforms: params.failedPlatforms,
    queriedAt: new Date(),
  };
  return MultiProviderResultSchema.parse(result);
}

export function buildFailedEngineResponse(params: {
  platform: Platform;
  query: string;
  error: string;
  startTime: number;
}): EngineResponse {
  return buildEngineResponse({
    platform: params.platform,
    query: params.query,
    rawResponse: '',
    citedUrls: [],
    groundingSources: [],
    executedAt: new Date(),
    latencyMs: Date.now() - params.startTime,
    success: false,
    error: params.error,
  });
}

export type { QueryInput, MultiQueryInput, EngineResponse, MultiProviderResult, Platform };
