# Site Crawling Rules

When working on site crawling or content extraction code:

## Tool Choice
- Use **Firecrawl API** for all site crawling. Do NOT build a custom Playwright BFS/DFS crawler.
- Install: `@mendable/firecrawl-js`
- The current `packages/site-crawler/src/crawler.ts` is a stub — it returns hardcoded paths and will be replaced.

## Crawling Pattern
```typescript
import Firecrawl from '@mendable/firecrawl-js';
const firecrawl = new Firecrawl({ apiKey: config.firecrawlApiKey });

// Step 1: Discover URLs
const mapResult = await firecrawl.map(domain, { limit: 50 });

// Step 2: Crawl pages
const crawlResult = await firecrawl.crawl(domain, {
  limit: 20,
  formats: ['markdown', 'html'],
});
```

## What IS Custom Code (Our IP)
After Firecrawl extracts the content, we run custom analysis:
- Schema extraction: Parse JSON-LD from HTML, identify types, find gaps
- Content quality: Evaluate answer-first format, FAQ presence, stats density
- Technical checks: robots.txt AI crawler rules, llms.txt, sitemap
- These analysis functions live in separate files:
  - `apps/audit-runner/src/steps/analyze-content.ts` (S5)
  - `apps/audit-runner/src/steps/analyze-technical.ts` (S6)
  - `apps/audit-runner/src/steps/analyze-schema.ts` (S7)
  - `apps/audit-runner/src/steps/analyze-gbp.ts` (S8)
- Corresponding typed tool functions live in `packages/core/src/tools/`

## Content Analysis Rules
- Use Claude Haiku (via AI SDK) to evaluate content quality, not regex heuristics
- The current `packages/site-crawler/src/content.ts` uses naive string-length checks — replace with LLM evaluation
- Answer-first scoring should be per-page, then averaged across the site

## Contracts
- Input/output types: `packages/core/src/contracts/crawl.contract.ts` (`CrawlInput`, `CrawlOutput`, `CrawledPage`)
- Analysis outputs: `packages/core/src/contracts/analysis.contract.ts`
- Import via: `import { CrawlOutput } from '@pare-engine/core/contracts'`

## Reference
See `docs/AUDIT_PIPELINE.md` Step 1 (CRAWL) and Step 3 (ANALYZE).
