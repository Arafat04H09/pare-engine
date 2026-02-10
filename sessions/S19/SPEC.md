# S19: Competitive Intelligence

## Mission
Wire Serper.dev for SERP position tracking and DataForSEO for backlink/keyword/AI Overview data. Enrich the competitive analysis in reports.

## Agent
CLAUDE — API wiring with typed tool functions per CLAUDE.md patterns.

## Input Contracts (read from `@pare-engine/core/contracts`)
- `ValidatedConfig` from `config.contract.ts`

## Output Contracts (this session implements)
None — produces enrichment data consumed by reports, not shared library types.

## Files OWNED (exclusive write access)
- `packages/core/src/tools/serper.ts`
- `packages/core/src/tools/dataforseo.ts`

## Files READ-ONLY (import, do not modify)
- All contract files

## Scaffold Salvage
None

## Dependencies
- S1 must complete first because API keys live in config

## Exit Criteria
- `searchSerper(query: string, domain?: string)` returns SERP results with organic positions, local pack, PAA, AI overview presence
- `fetchDataForSEO(domain: string, type: 'backlinks' | 'keywords' | 'ai-overview')` returns structured competitive data
- Both functions: typed input → typed output, Zod-validated, custom error classes
- Handles API errors gracefully (log, return partial data)
- Serper: uses REST API with `SERPER_API_KEY`
- DataForSEO: uses REST API with login/password auth

## Known Bugs to Fix
None — greenfield code
