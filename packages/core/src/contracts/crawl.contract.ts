// Owner: S3 (Firecrawl Integration). Consumers: S5, S6, S7, S8, S9, S10, S12, S18.
// This contract defines the input/output of the Firecrawl crawl step.

import { z } from 'zod';

// --- Input ---

export const CrawlInputSchema = z.object({
  domain: z.string().min(1),
  maxPages: z.number().int().positive().default(20),
  formats: z.array(z.enum(['markdown', 'html'])).default(['markdown', 'html']),
});

export type CrawlInput = z.infer<typeof CrawlInputSchema>;

// --- Output ---

export const CrawledPageSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  markdown: z.string(),
  html: z.string(),
  statusCode: z.number().int(),
  metadata: z.record(z.unknown()).optional(),
});

export type CrawledPage = z.infer<typeof CrawledPageSchema>;

export const CrawlOutputSchema = z.object({
  domain: z.string(),
  pages: z.array(CrawledPageSchema),
  discoveredUrls: z.array(z.string().url()),
  errors: z.array(z.object({
    url: z.string(),
    error: z.string(),
  })),
  crawledAt: z.date(),
});

export type CrawlOutput = z.infer<typeof CrawlOutputSchema>;

// --- Media Assets (Task 3.2: Multimodal Audit) ---

export const MediaAssetSchema = z.object({
  url: z.string(),
  type: z.enum(['youtube', 'vimeo', 'html5_video', 'image']),
  pageUrl: z.string(),
  title: z.string().optional(),
  hasVideoObjectSchema: z.boolean().default(false),
  hasTranscript: z.boolean().default(false),
  embedCode: z.string().optional(),
  videoId: z.string().optional(),
});

export type MediaAsset = z.infer<typeof MediaAssetSchema>;
