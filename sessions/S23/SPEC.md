# S23: Social + Review Enrichment

## Mission
Wire Xpoz MCP for social brand signal monitoring and Apify Google Maps Actor for competitor review scraping. Enrich AI Visibility and GBP data.

## Agent
CLAUDE — API integration with typed tool functions per CLAUDE.md patterns.

## Input Contracts (read from `@pare-engine/core/contracts`)
- `ValidatedConfig` from `config.contract.ts`

## Output Contracts (this session implements)
None — enrichment data feeds into existing scoring and reports.

## Files OWNED (exclusive write access)
- `packages/core/src/tools/social-monitor.ts`
- `packages/core/src/tools/review-scraper.ts`

## Files READ-ONLY (import, do not modify)
- All contract files

## Scaffold Salvage
None

## Dependencies
- S1 must complete first because API keys live in config
- S8 should complete first because review data enriches GBP analysis
- S9 should complete first because social signals enrich AI visibility

## Exit Criteria
- `monitorSocial(brand: string)` uses Xpoz API to pull brand mentions from Twitter/X, Reddit, Instagram
- `scrapeCompetitorReviews(placeIds: string[])` uses Apify Google Maps Actor to pull competitor review data
- Both functions: typed input → typed output, graceful error handling
- Social data includes: mention count, sentiment breakdown, platform distribution
- Review data includes: rating, review count, recent review themes
- Free tier limits documented in function comments

## Known Bugs to Fix
None — greenfield code
