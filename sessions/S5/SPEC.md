# S5: LLM Parser + Content Scoring

## Mission
Build the LLM-based response parser (replacing keyword heuristics) and the Content Quality scoring function (30 points). Both use Claude Haiku via AI SDK generateObject().

## Agent
CLAUDE — generateObject() + Zod schema patterns, LLM-based analysis per CLAUDE.md mandates.

## Input Contracts (read from `@pare-engine/core/contracts`)
- `EngineResponse` from `query.contract.ts`
- `ParsedMention` from `analysis.contract.ts`
- `ParsedMentionSchema` from `analysis.contract.ts`
- `ContentAnalysisOutput` from `analysis.contract.ts`
- `ContentPageAnalysis` from `analysis.contract.ts`
- `ContentQualityScore` from `scoring.contract.ts`
- `CrawledPage` from `crawl.contract.ts`

## Output Contracts (this session implements)
- `ParsedMention` from `analysis.contract.ts`
- `ContentAnalysisOutput` from `analysis.contract.ts`
- `ContentQualityScore` from `scoring.contract.ts`

## Files OWNED (exclusive write access)
- `packages/core/src/tools/parse-response.ts`
- `packages/core/src/scoring/content-quality.ts` (replaces S2's stub)
- `apps/audit-runner/src/steps/analyze-content.ts`

## Files READ-ONLY (import, do not modify)
- All contract files
- `packages/query-engine/src/parser.ts` (reference — URL regex extraction is fine, sentiment/position logic is wrong)
- `.claude/rules/scoring.md`

## Scaffold Salvage
- `packages/query-engine/src/parser.ts:extractUrls()` → Keep URL regex pattern → `tools/parse-response.ts`
- `packages/query-engine/src/parser.ts:analyzeSentiment()` → REPLACE with LLM-based via generateObject()

## Dependencies
- S2 must complete first because S5 replaces the content-quality.ts stub S2 creates
- S4's output format needed (but can mock EngineResponse for initial dev using contracts)

## Exit Criteria
- `parseEngineResponse(response: EngineResponse, brand, domain, competitors)` returns `ParsedMention` using Claude Haiku `generateObject()` — NOT keyword matching
- `scoreContentQuality(analysis: ContentAnalysisOutput): ContentQualityScore` returns 0-30
- `analyzeContent(pages: CrawledPage[]): Promise<ContentAnalysisOutput>` uses Haiku for per-page answer-first scoring
- Sentiment analysis is LLM-based, not keyword-based
- Content scorer weights: answer-first format, FAQ presence, stats density, author attribution, depth
- All outputs validated against Zod schemas

## Known Bugs to Fix
- `query-engine/src/parser.ts:72-88` — analyzeSentiment() uses keyword matching → replace with LLM
