// Owner: S3 (Firecrawl Integration). Consumer: S12 (Pipeline Orchestration).
// Inngest-compatible step function that crawls a site using the Firecrawl API.
// This step is independently retriable by Inngest.
//
// Architecture:
//   - Types come from @pare-engine/core/contracts (CrawlInput, CrawlOutput, CrawledPage)
//   - Shared utilities (CrawlError, normalizeDomain, validation) are also defined in
//     packages/core/src/tools/crawl-site.ts. They are duplicated here because the core
//     package.json does not yet export subpath ./tools/*. Once it does, this file can
//     import from @pare-engine/core/tools/crawl-site.js instead.
//   - Firecrawl SDK is an audit-runner dependency (core has no external API deps)
//
// Pattern:
//   1. Validate input via Zod schema
//   2. Discover URLs via Firecrawl map()
//   3. Crawl pages via Firecrawl crawl()
//   4. Map Firecrawl documents to the CrawledPage contract
//   5. Validate output, throw if zero pages (triggering Inngest retry)

import Firecrawl from '@mendable/firecrawl-js';
import {
  CrawlInputSchema,
  CrawlOutputSchema,
  type CrawlInput,
  type CrawlOutput,
  type CrawledPage,
} from '@pare-engine/core/contracts';

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Configuration for the crawl step.
 * In production, firecrawlApiKey comes from the validated config (S1).
 * During development, it can be passed directly.
 */
export interface CrawlStepConfig {
  firecrawlApiKey: string;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Normalizes a domain string to a full URL suitable for Firecrawl.
 * Handles cases like "example.com", "www.example.com", "https://example.com".
 */
function normalizeDomain(domain: string): string {
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
 * Creates a Firecrawl client instance.
 * Separated for testability.
 */
function createFirecrawlClient(apiKey: string): Firecrawl {
  return new Firecrawl({ apiKey });
}

// ---------------------------------------------------------------------------
// Firecrawl integration: URL discovery
// ---------------------------------------------------------------------------

/**
 * Discovers URLs on a domain using Firecrawl's sitemap-aware map endpoint.
 * Returns discovered URLs. Errors are caught and recorded (not thrown),
 * per the graceful degradation rules.
 */
async function discoverUrls(
  client: Firecrawl,
  domain: string,
  maxPages: number,
): Promise<{ urls: string[]; errors: Array<{ url: string; error: string }> }> {
  const errors: Array<{ url: string; error: string }> = [];

  try {
    // Firecrawl v2 map() returns MapData { links: SearchResultWeb[] }
    // Each SearchResultWeb has { url, title?, description?, category? }
    const mapResult = await client.map(domain, {
      limit: Math.min(maxPages * 3, 100), // Discover more URLs than we'll crawl
    });

    const urls = mapResult.links
      .map((link) => link.url)
      .filter((url): url is string => typeof url === 'string' && url.length > 0);

    return { urls, errors };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    errors.push({ url: domain, error: `URL discovery failed: ${errorMessage}` });
    // Return domain as fallback so crawl can still proceed
    return { urls: [domain], errors };
  }
}

// ---------------------------------------------------------------------------
// Firecrawl integration: page crawling
// ---------------------------------------------------------------------------

/**
 * Crawls pages on a domain using Firecrawl and maps documents to CrawledPage.
 * Errors per-page are captured in the errors array (not thrown).
 */
async function crawlPages(
  client: Firecrawl,
  domain: string,
  maxPages: number,
  formats: Array<'markdown' | 'html'>,
): Promise<{ pages: CrawledPage[]; errors: Array<{ url: string; error: string }> }> {
  const pages: CrawledPage[] = [];
  const errors: Array<{ url: string; error: string }> = [];

  try {
    // Firecrawl v2 crawl() returns CrawlJob { id, status, total, completed, data: Document[] }
    // It internally polls until the job is complete.
    const crawlResult = await client.crawl(domain, {
      limit: maxPages,
      scrapeOptions: {
        formats: formats,
        onlyMainContent: true,
      },
      // 5-minute timeout for the crawl job to complete
      timeout: 300,
    });

    if (crawlResult.status !== 'completed') {
      errors.push({
        url: domain,
        error: `Crawl job ended with status: ${crawlResult.status}`,
      });
    }

    for (const doc of crawlResult.data) {
      try {
        // Firecrawl v2 Document stores the source URL in metadata
        const pageUrl = doc.metadata?.sourceURL
          ?? doc.metadata?.url
          ?? '';

        if (!pageUrl) {
          errors.push({
            url: 'unknown',
            error: 'Document returned without a URL in metadata',
          });
          continue;
        }

        const page: CrawledPage = {
          url: pageUrl,
          title: doc.metadata?.title,
          markdown: doc.markdown ?? '',
          html: doc.html ?? '',
          statusCode: doc.metadata?.statusCode ?? 200,
          metadata: doc.metadata as Record<string, unknown> | undefined,
        };

        pages.push(page);
      } catch (pageErr) {
        const pageErrorMessage = pageErr instanceof Error ? pageErr.message : String(pageErr);
        errors.push({
          url: doc.metadata?.sourceURL ?? 'unknown',
          error: `Failed to process page: ${pageErrorMessage}`,
        });
      }
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    errors.push({ url: domain, error: `Crawl failed: ${errorMessage}` });
  }

  return { pages, errors };
}

// ---------------------------------------------------------------------------
// Public API: crawlSite tool function
// ---------------------------------------------------------------------------

/**
 * Core crawl function: discovers URLs then crawls pages.
 * Typed tool function: CrawlInput -> CrawlOutput.
 * Designed to be wrappable as an MCP tool or Inngest step.
 *
 * Uses Firecrawl SDK:
 *   - firecrawl.map() for URL discovery
 *   - firecrawl.crawl() for page content extraction
 *
 * Returns markdown + HTML per page, matching CrawledPage schema.
 * Errors are caught per-page and included in CrawlOutput.errors, not thrown.
 *
 * @param input - CrawlInput (domain, maxPages, formats)
 * @param firecrawlApiKey - Firecrawl API key from validated config
 * @returns CrawlOutput with pages, discovered URLs, and any errors
 */
export async function crawlSite(
  input: CrawlInput,
  firecrawlApiKey: string,
): Promise<CrawlOutput> {
  // Validate input with Zod (applies defaults for maxPages and formats)
  const validated = CrawlInputSchema.parse(input);

  const domain = normalizeDomain(validated.domain);
  const client = createFirecrawlClient(firecrawlApiKey);

  // Step 1: Discover URLs via Firecrawl map
  const discovery = await discoverUrls(client, domain, validated.maxPages);

  // Step 2: Crawl pages for content (markdown + HTML)
  const crawl = await crawlPages(
    client,
    domain,
    validated.maxPages,
    validated.formats,
  );

  // Combine errors from both steps
  const allErrors = [...discovery.errors, ...crawl.errors];

  // Build output
  const output: CrawlOutput = {
    domain: validated.domain,
    pages: crawl.pages,
    discoveredUrls: discovery.urls,
    errors: allErrors,
    crawledAt: new Date(),
  };

  // Validate output matches contract schema
  return CrawlOutputSchema.parse(output);
}

// ---------------------------------------------------------------------------
// Public API: Inngest step wrapper
// ---------------------------------------------------------------------------

/**
 * Executes the crawl step of the audit pipeline.
 *
 * This function is designed to be called from an Inngest step:
 * ```typescript
 * const crawlOutput = await step.run('crawl-site', () =>
 *   executeCrawlStep(crawlInput, { firecrawlApiKey: config.firecrawlApiKey })
 * );
 * ```
 *
 * Error handling:
 * - Per-page errors are captured in CrawlOutput.errors (not thrown)
 * - Total crawl failure (e.g., invalid API key, network down) throws CrawlError
 *   so Inngest can retry the entire step
 * - A crawl that returns 0 pages is treated as a failure and throws
 *
 * @param input - CrawlInput with domain, maxPages, and formats
 * @param config - Step configuration with API key
 * @returns CrawlOutput with pages, discovered URLs, and errors
 * @throws CrawlError if the crawl produces zero pages (retriable by Inngest)
 */
export async function executeCrawlStep(
  input: CrawlInput,
  config: CrawlStepConfig,
): Promise<CrawlOutput> {
  const output = await crawlSite(input, config.firecrawlApiKey);

  // If no pages were crawled at all, this is a total failure.
  // Throw so Inngest retries the step rather than passing empty data downstream.
  if (output.pages.length === 0) {
    const errorSummary = output.errors.length > 0
      ? output.errors.map((e) => `${e.url}: ${e.error}`).join('; ')
      : 'No pages returned and no errors reported';

    throw new CrawlError(
      `Crawl of ${input.domain} returned 0 pages. Errors: ${errorSummary}`,
      'CRAWL_EMPTY_RESULT',
    );
  }

  return output;
}
