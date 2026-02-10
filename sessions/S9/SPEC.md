# S9: AI Visibility Scoring + Citation Normalizer

## Mission
Build the AI Visibility scoring function (30 points) and the cross-provider citation normalizer — both are core IP. Uses parsed responses from all 3 AI engines.

## Agent
CLAUDE — Citation normalization is core IP requiring cross-provider logic and careful scoring math.

## Input Contracts (read from `@pare-engine/core/contracts`)
- `EngineResponse`, `MultiProviderResult`, `Platform` from `query.contract.ts`
- `ParsedMention` from `analysis.contract.ts`
- `AIVisibilityScore`, `SCORING_WEIGHTS` from `scoring.contract.ts`

## Output Contracts (this session implements)
- `AIVisibilityScore` from `scoring.contract.ts`

## Files OWNED (exclusive write access)
- `packages/core/src/scoring/ai-visibility.ts` (replaces S2's stub)
- `packages/core/src/tools/normalize-citations.ts`

## Files READ-ONLY (import, do not modify)
- All contract files
- `docs/SCORING_ALGORITHM.md`

## Scaffold Salvage
None

## Dependencies
- S2 must complete first because it creates the `ai-visibility.ts` stub that this session replaces with the real implementation.
- S4 must complete first because it provides the `MultiProviderResult` format from AI engine queries.
- S5 must complete first because it provides the `ParsedMention` output from the LLM parser.

## Exit Criteria
- `scoreAIVisibility(mentions: ParsedMention[], providerResult: MultiProviderResult): AIVisibilityScore` returns 0-30
- Score breakdown: mention rate (12pts), citation rate (8pts), position quality (5pts), sentiment (5pts)
- Sub-scores sum to exactly 30 max (NOT 35 like old code)
- Graceful degradation: scores normalize to available providers (if only 2/3 respond, score out of 30 using those 2)
- `normalizeCitations(result: MultiProviderResult)` produces unified citation graph: which URLs cited, by which engine, for which queries
- `AIVisibilityScore.providersUsed` and `providersAvailable` track degradation
- Tests for: all 3 providers, 2/3 providers, 1/3 providers, 0 mentions, perfect visibility

## Known Bugs to Fix
- `scoring.ts:61` — old cap is Math.min(35) — this function replaces it entirely with 30-point cap
- `scoring.ts:52-60` — old sub-scores sum to 35 — new sub-scores sum to 30
