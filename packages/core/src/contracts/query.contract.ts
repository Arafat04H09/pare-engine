// Owner: S4 (AI Engine Providers). Consumers: S5, S9, S12, S18, S20.
// This contract defines the AI engine query input/output types.
// NOTE: 'claude' removed from Platform — Claude has no web access.
// NOTE: 'google_aio' renamed to 'gemini' for clarity.

import { z } from 'zod';

export const PlatformSchema = z.enum(['chatgpt', 'perplexity', 'gemini']);
export type Platform = z.infer<typeof PlatformSchema>;

/** All platforms that may be monitored. */
export const ALL_PLATFORMS: Platform[] = ['chatgpt', 'perplexity', 'gemini'];

// --- Input ---

export const QueryInputSchema = z.object({
  brand: z.string().min(1),
  domain: z.string().min(1),
  query: z.string().min(1),
  platform: PlatformSchema,
  competitors: z.array(z.string()).default([]),
});

export type QueryInput = z.infer<typeof QueryInputSchema>;

export const MultiQueryInputSchema = z.object({
  brand: z.string().min(1),
  domain: z.string().min(1),
  queries: z.array(z.string().min(1)),
  platforms: z.array(PlatformSchema).default([...ALL_PLATFORMS]),
  competitors: z.array(z.string()).default([]),
});

export type MultiQueryInput = z.infer<typeof MultiQueryInputSchema>;

// --- Output ---

export const EngineResponseSchema = z.object({
  platform: PlatformSchema,
  query: z.string(),
  rawResponse: z.string(),
  citedUrls: z.array(z.string()),
  groundingSources: z.array(z.object({
    url: z.string(),
    title: z.string().optional(),
  })).default([]),
  executedAt: z.date(),
  latencyMs: z.number().int(),
  success: z.boolean(),
  error: z.string().optional(),
});

export type EngineResponse = z.infer<typeof EngineResponseSchema>;

export const MultiProviderResultSchema = z.object({
  brand: z.string(),
  domain: z.string(),
  responses: z.array(EngineResponseSchema),
  failedPlatforms: z.array(z.object({
    platform: PlatformSchema,
    error: z.string(),
  })),
  queriedAt: z.date(),
});

export type MultiProviderResult = z.infer<typeof MultiProviderResultSchema>;

// --- Cohort Query (Task 2.2: Share of Voice) ---

export const CohortQueryInputSchema = z.object({
  brand: z.string().min(1),
  domain: z.string().min(1),
  queries: z.array(z.string().min(1)),
  platforms: z.array(PlatformSchema).default([...ALL_PLATFORMS]),
  competitors: z.array(z.string()).min(1, 'At least one competitor required for cohort query'),
  vertical: z.string().optional(),
  location: z.string().optional(),
});

export type CohortQueryInput = z.infer<typeof CohortQueryInputSchema>;
