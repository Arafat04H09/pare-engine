# S6: Technical Readiness Scoring

## Mission
Build the Technical Readiness scoring function (10 points) with PageSpeed Insights API integration, robots.txt AI crawler checks, llms.txt detection, and sitemap validation.

## Agent
CLAUDE — PageSpeed API integration, scoring function with strict weight enforcement.

## Input Contracts (read from `@pare-engine/core/contracts`)
- `TechnicalAnalysisOutput` from `analysis.contract.ts`
- `RobotsTxtAnalysis` from `analysis.contract.ts`
- `TechnicalScore` from `scoring.contract.ts`
- `CrawledPage` from `crawl.contract.ts`

## Output Contracts (this session implements)
- `TechnicalAnalysisOutput` from `analysis.contract.ts`
- `TechnicalScore` from `scoring.contract.ts`

## Files OWNED (exclusive write access)
- `packages/core/src/tools/pagespeed.ts`
- `packages/core/src/scoring/technical-readiness.ts` (replaces S2's stub)
- `apps/audit-runner/src/steps/analyze-technical.ts`

## Files READ-ONLY (import, do not modify)
- All contract files
- `packages/site-crawler/src/technical.ts` (reference — good pattern, expand bot list)

## Scaffold Salvage
- `packages/site-crawler/src/technical.ts` → Keep `checkRobotsTxt()` pattern and AI bot list → expand with: `Amazonbot`, `Bytespider`, `Applebot-Extended`, `anthropic-ai`, `cohere-ai` → `steps/analyze-technical.ts`
- `packages/site-crawler/src/technical.ts` → Keep `checkLlmsTxt()` pattern → `steps/analyze-technical.ts`

## Dependencies
- S2 must complete first because S6 replaces the technical-readiness.ts stub S2 creates
- S3 must complete first because S6 needs CrawledPage output for robots.txt/sitemap from crawl data

## Exit Criteria
- `fetchPageSpeed(url: string)` returns Lighthouse scores via PageSpeed Insights API (no key needed at low volume)
- `analyzeTechnical(pages: CrawledPage[], domain: string): Promise<TechnicalAnalysisOutput>` checks: robots.txt AI rules, llms.txt, sitemap, HTTPS, mobile
- `scoreTechnicalReadiness(analysis: TechnicalAnalysisOutput): TechnicalScore` returns 0-10
- Score breakdown: AI crawler access (3pts), llms.txt (2pts), sitemap (2pts), HTTPS+mobile (2pts), PageSpeed (1pt)
- Tests for: 0 input, perfect site, typical site, site blocking all AI bots

## Known Bugs to Fix
None — greenfield (scaffold technical.ts is reference only)
