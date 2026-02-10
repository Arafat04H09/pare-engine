# S2: Scoring Foundation

## Mission
Fix the broken scoring system: correct weights, restructure into per-pillar files, set up Vitest, and clean up types.ts. This session touches the most shared code.

## Agent
CLAUDE — Scoring algorithm is core IP with strict weight enforcement and testing requirements.

## Input Contracts (read from `@pare-engine/core/contracts`)
- `SCORING_WEIGHTS`, `CompositeScore`, all `*Score` types from `scoring.contract.ts`
- `Platform` from `query.contract.ts` (to fix types.ts)

## Output Contracts (this session implements)
- `SCORING_WEIGHTS` from `scoring.contract.ts`
- `scoreToGrade()` from `scoring.contract.ts`
- `CompositeScoreSchema` from `scoring.contract.ts`

## Files OWNED (exclusive write access)
- `packages/core/src/scoring/index.ts` (replaces `scoring.ts`)
- `packages/core/src/scoring/ai-visibility.ts` (STUB ONLY — returns 0, S9 implements)
- `packages/core/src/scoring/content-quality.ts` (STUB ONLY — returns 0, S5 implements)
- `packages/core/src/scoring/schema-completeness.ts` (STUB ONLY — returns 0, S7 implements)
- `packages/core/src/scoring/technical-readiness.ts` (STUB ONLY — returns 0, S6 implements)
- `packages/core/src/scoring/local-gbp.ts` (STUB ONLY — returns 0, S8 implements)
- `packages/core/src/types.ts` (refactor)
- `packages/core/src/index.ts` (update re-exports)
- `packages/core/src/database/schema.ts` (add missing indexes)
- `packages/core/vitest.config.ts`
- `vitest.config.ts` (root workspace config)

## Files READ-ONLY (import, do not modify)
- `packages/core/src/contracts/scoring.contract.ts`
- `packages/core/src/contracts/query.contract.ts`
- `docs/SCORING_ALGORITHM.md`

## Scaffold Salvage
- `packages/core/src/scoring.ts` → Extract `getRequiredSchemaTypes()` and `getRecommendedSchemaTypes()` → `scoring/schema-completeness.ts` (as reference for the stub)
- `packages/query-engine/src/prompts.ts` → Note the vertical prompt pattern → will be used by S21 later

## Dependencies
None — can start immediately after bootstrap

## Exit Criteria
- Old `scoring.ts` deleted. New `scoring/index.ts` exports `calculateOverallScore()` and `scoreToGrade()`
- `calculateOverallScore()` returns `Math.min(100, Math.round(sum of 5 pillar scores))`
- `scoreToGrade()` uses simple A/B/C/D/F thresholds (90/80/70/60)
- All 5 stub pillar files exist and return 0 with a `// TODO: implement in S{N}` comment
- `types.ts` removes `'claude'` and `'google_aio'` from Platform type, uses `Platform` from contracts
- `database/schema.ts` has indexes on `clients.domain`, `clients.vertical`, `auditResults(clientId, auditDate)`
- `pnpm test` runs via Vitest and passes (test that weights sum to 100, composite capped at 100, grade thresholds correct)
- `index.ts` re-exports from `./scoring/index.js` and `./types.js`

## Known Bugs to Fix
- `scoring.ts:4-8` — DEFAULT_WEIGHTS = {35, 25, 20, 10, 10} → must be {30, 30, 15, 10, 15}
- `scoring.ts:61` — scoreAIVisibility() caps at Math.min(35) → must be 30
- `scoring.ts:52-60` — AI Visibility sub-scores sum to 35 → must sum to 30
- `scoring.ts:83` — scoreSchema() caps at Math.min(25) → must be 15
- `scoring.ts:77-83` — Schema sub-scores sum to 25 → must sum to 15
- `scoring.ts:21-33` — Grade scale uses B+/B-/C+ → must be simple A/B/C/D/F
- `scoring.ts:11-18` — calculateOverallScore() doesn't cap at 100 → must use Math.min(100, ...)
- `types.ts:1` — Platform type includes 'claude' (shouldn't) and 'google_aio' (ambiguous)
