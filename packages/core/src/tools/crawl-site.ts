// Owner: S3 (Firecrawl Integration). Consumer: S12 (Pipeline Orchestration).
// Typed tool function interface for crawling a site.
//
// This file defines shared utilities for the crawl tool:
// - CrawlError: custom error class with code property
// - normalizeDomain: domain string normalization
// - validateCrawlInput / validateCrawlOutput: Zod-based validation
// - buildCrawlOutput: assembles a validated CrawlOutput
//
// The actual Firecrawl API calls live in apps/audit-runner/src/steps/crawl.ts,
// keeping packages/core free of external API runtime dependencies.
//
// NOTE: This file will be importable via @pare-engine/core/tools/crawl-site
// once the core package.json exports field is updated to include ./tools/*.
// Until then, the step file duplicates the critical utilities.
// See sessions/S3/STATUS.md for deviation details.

import {
  CrawlInputSchema,
  CrawlOutputSchema,
  type CrawlInput,
  type CrawlOutput,
  type CrawledPage,
} from '../contracts/crawl.contract.js';

/**
 * Custom error class for crawl-related failures.
 * Extends Error with a `code` property per coding conventions.
 */
export class CrawlError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'CrawlError';
    this.code = code;
  }
}

/**
 * Normalizes a domain string to a full URL suitable for Firecrawl.
 * Handles cases like "example.com", "www.example.com", "https://example.com".
 */
export function normalizeDomain(domain: string): string {
  let normalized = domain.trim();

  // Strip trailing slashes
  normalized = normalized.replace(/\/+$/, '');

  // Add protocol if missing
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }

  return normalized;
}

/**
 * Validates CrawlInput using the Zod schema.
 * Returns the validated and defaulted input.
 *
 * @throws ZodError if input is invalid
 */
export function validateCrawlInput(input: CrawlInput): CrawlInput {
  return CrawlInputSchema.parse(input);
}

/**
 * Validates CrawlOutput using the Zod schema.
 * Ensures output conforms to the contract before returning.
 *
 * @throws ZodError if output does not match the contract
 */
export function validateCrawlOutput(output: CrawlOutput): CrawlOutput {
  return CrawlOutputSchema.parse(output);
}

/**
 * Builds a CrawlOutput object from crawl results.
 * Centralizes the assembly logic so both the tool function and step can use it.
 */
export function buildCrawlOutput(params: {
  domain: string;
  pages: CrawledPage[];
  discoveredUrls: string[];
  errors: Array<{ url: string; error: string }>;
}): CrawlOutput {
  const output: CrawlOutput = {
    domain: params.domain,
    pages: params.pages,
    discoveredUrls: params.discoveredUrls,
    errors: params.errors,
    crawledAt: new Date(),
  };

  return validateCrawlOutput(output);
}

// Re-export contract types for convenience
export type { CrawlInput, CrawlOutput, CrawledPage };
