# S27: Content Optimizer

## Mission
Build the content optimizer that takes weak pages identified by the content audit and rewrites them in answer-first format with statistics, FAQ sections, and author attribution.

## Agent
GEMINI — Volume content generation and prompt engineering benefits from 2M context for holding multiple page examples and style guides simultaneously.

## Input Contracts (read from `@pare-engine/core/contracts`)
- `ContentAnalysisOutput`, `ContentPageAnalysis` from `analysis.contract.ts`
- `CrawlOutput`, `CrawledPage` from `crawl.contract.ts`

## Output Contracts (this session implements)
None — generates optimized content as markdown strings.

## Files OWNED (exclusive write access)
- `packages/core/src/tools/content-optimizer.ts`

## Files READ-ONLY (import, do not modify)
- All contract files
- `packages/core/src/tools/parse-response.ts` (S5 — content analysis patterns)

## Scaffold Salvage
- `packages/site-crawler/src/content.ts` — Reference only (binary 50-300 char heuristic is wrong). Shows what NOT to do.

## Dependencies
- S5 must complete (content analysis identifies weak pages)
- S3 must complete (crawl data provides page content to rewrite)
- Triggered by: sprint automation need

## Exit Criteria
- `optimizeContent(page: CrawledPage, analysis: ContentPageAnalysis, vertical: string)` returns optimized markdown
- Rewrite directives: answer-first format, add statistics, include FAQ section, add author attribution
- Uses Claude (via AI SDK generateText) for rewriting — not template-based
- Output is ready to paste into CMS
- Handles: very short pages (expand), very long pages (focus on key sections), pages with no clear question to answer

## Known Bugs to Fix
None — greenfield code
