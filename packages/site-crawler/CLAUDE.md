# @pare-engine/site-crawler — MIGRATION TARGET

## Status: TO BE REFACTORED

This package was scaffolded by Gemini with a stub crawler. It will be split:
- Crawling → Firecrawl API (external service)
- Analysis → `apps/audit-runner/src/steps/analyze.ts` + `packages/core/src/scoring/`

## What's Here (Current)
- `src/crawler.ts` — **STUB**: `crawlPages()` returns hardcoded paths `[url, /about, /contact, /services]`. `fetchPageContent()` launches a new browser per page (inefficient).
- `src/schema.ts` — **GOOD**: Extracts JSON-LD from HTML correctly. Keep this logic.
- `src/content.ts` — **WEAK**: Binary answer-first scoring (50-300 char check), simple regex stats counting. Replace with LLM evaluation.
- `src/technical.ts` — **DECENT**: Checks 5 AI bots in robots.txt, checks llms.txt existence. Missing validation of llms.txt content, missing more bots.
- `src/index.ts` — Orchestrates analysis with parallel technical checks. Good pattern.

## What Replaces the Crawler
**Firecrawl API** handles all page fetching:
```typescript
import Firecrawl from '@mendable/firecrawl-js';
const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

// Discover all URLs
const map = await firecrawl.map(domain, { limit: 50 });

// Extract content
const crawl = await firecrawl.crawl(domain, { limit: 20, formats: ['markdown', 'html'] });
```

## What to Keep
- `src/schema.ts` — The JSON-LD extraction logic is correct. Migrate to analysis step.
- `src/technical.ts` — The robots.txt checker pattern is good. Expand the bot list and migrate.
- The `SiteAnalysisResult` interface from `src/index.ts`

## What to Replace
- `src/crawler.ts` entirely — Firecrawl replaces this
- `src/content.ts` — Replace with LLM-based content evaluation (Claude Haiku)
- The hardcoded `crawlPages()` function

## What to Add
- Microdata and RDFa extraction (currently only JSON-LD)
- Schema validation against schema.org spec
- More AI bot user-agents: `anthropic-ai`, `Googlebot`, `Bingbot`
- llms.txt content parsing (not just existence check)
- Content freshness detection (publication/modification dates)
- Word count analysis for content depth scoring

## Migration Checklist
- [ ] Set up Firecrawl API integration in `apps/audit-runner/src/steps/crawl.ts`
- [ ] Move schema extraction to `apps/audit-runner/src/steps/analyze.ts`
- [ ] Move technical checks to `apps/audit-runner/src/steps/analyze.ts`
- [ ] Replace content analysis with Claude Haiku evaluation
- [ ] Add missing checks (microdata, RDFa, more bots, content freshness)
- [ ] Delete this package once migration is complete
