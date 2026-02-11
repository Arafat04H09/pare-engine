// Owner: S22 (Production Deployment)
//
// Static vendored replacement for the Firecrawl MCP server.
// In development, the Firecrawl MCP server (npx firecrawl-mcp) provides
// tools like map, crawl, scrape. In production, we call the Firecrawl
// JS SDK directly via the typed tool functions in @pare-engine/core.
//
// MCP server replaced: firecrawl (from .claude/settings.json)
// Underlying library: @mendable/firecrawl-js

import { z } from 'zod';
import {
  validateCrawlInput,
  buildCrawlOutput,
  normalizeDomain,
  CrawlError,
} from '@pare-engine/core/tools/crawl-site';
import type { CrawlInput, CrawlOutput } from '@pare-engine/core/contracts';

/**
 * Tool definition: Map a domain to discover URLs.
 *
 * Replaces the MCP tool `firecrawl_map`.
 * In production, called directly by the pipeline crawl step.
 */
export const firecrawlMapInputSchema = z.object({
  domain: z.string().min(1).describe('Domain to map (e.g., "example.com")'),
  limit: z.number().int().min(1).max(500).default(50).describe('Max URLs to discover'),
});

export type FirecrawlMapInput = z.infer<typeof firecrawlMapInputSchema>;

export interface FirecrawlMapOutput {
  urls: string[];
  domain: string;
}

/**
 * Tool definition: Crawl pages from a domain.
 *
 * Replaces the MCP tool `firecrawl_crawl`.
 * In production, called directly by the pipeline crawl step.
 */
export const firecrawlCrawlInputSchema = z.object({
  domain: z.string().min(1).describe('Domain to crawl'),
  limit: z.number().int().min(1).max(100).default(20).describe('Max pages to crawl'),
  formats: z.array(z.enum(['markdown', 'html'])).default(['markdown', 'html']).describe('Content formats to extract'),
});

export type FirecrawlCrawlInput = z.infer<typeof firecrawlCrawlInputSchema>;

/**
 * Aggregated tool definitions for the Firecrawl MCP replacement.
 *
 * Each tool has:
 *   - name: stable identifier matching the MCP tool name
 *   - description: what the tool does
 *   - inputSchema: Zod schema for input validation
 *
 * The actual implementation is in apps/audit-runner/src/steps/crawl.ts,
 * which imports from @mendable/firecrawl-js. These stubs ensure the
 * type contracts are available without an MCP server.
 */
export const firecrawlTools = {
  map: {
    name: 'firecrawl_map' as const,
    description: 'Discover URLs on a domain using Firecrawl map endpoint',
    inputSchema: firecrawlMapInputSchema,
  },
  crawl: {
    name: 'firecrawl_crawl' as const,
    description: 'Crawl pages from a domain, extracting markdown and HTML content',
    inputSchema: firecrawlCrawlInputSchema,
  },
} as const;

// Re-export validation utilities from core for use by pipeline steps
export { validateCrawlInput, buildCrawlOutput, normalizeDomain, CrawlError };
export type { CrawlInput, CrawlOutput };
