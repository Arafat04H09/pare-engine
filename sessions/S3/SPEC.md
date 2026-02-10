# S3: Firecrawl Integration

## Mission
Replace the hardcoded site-crawler stub with a real Firecrawl integration using the typed tool function pattern. This is the foundation for all content analysis.

## Agent
CLAUDE — Firecrawl SDK wiring following CLAUDE.md's crawling rules and typed tool function pattern.

## Input Contracts (read from `@pare-engine/core/contracts`)
- `CrawlInput` from `crawl.contract.ts`
- `CrawlOutput` from `crawl.contract.ts`
- `CrawledPage` from `crawl.contract.ts`
- `ValidatedConfig` from `config.contract.ts` (for Firecrawl API key)

## Output Contracts (this session implements)
- `CrawlInput` from `crawl.contract.ts`
- `CrawlOutput` from `crawl.contract.ts`
- `CrawledPage` from `crawl.contract.ts`

## Files OWNED (exclusive write access)
- `packages/core/src/tools/crawl-site.ts`
- `apps/audit-runner/src/steps/crawl.ts`

## Files READ-ONLY (import, do not modify)
- `packages/core/src/contracts/crawl.contract.ts`
- `packages/core/src/contracts/config.contract.ts`
- `packages/site-crawler/src/crawler.ts` (reference only — see what it does wrong)
- `.claude/rules/crawling.md`

## Scaffold Salvage
- `packages/site-crawler/src/crawler.ts` → DELETE (returns hardcoded paths). Reference only to understand the interface shape.

## Dependencies
None — can start immediately after bootstrap. Uses dotenv or hardcoded test key for initial development. Integrates with S1's config.ts at merge time.

## Exit Criteria
- `crawlSite(input: CrawlInput): Promise<CrawlOutput>` works against a real domain
- Uses Firecrawl SDK: `firecrawl.map()` for URL discovery, `firecrawl.crawl()` for page content
- Returns markdown + HTML per page, matching `CrawledPage` schema
- Errors are caught per-page and included in `CrawlOutput.errors`, not thrown
- `apps/audit-runner/src/steps/crawl.ts` wraps `crawlSite` as an Inngest-compatible step function
- Zod validates input and output

## Known Bugs to Fix
None — greenfield code (the existing crawler.ts is a stub being replaced, not fixed)
