# S11: Scoring Test Suite

## Mission
Write comprehensive Vitest tests for all 5 pillar scoring functions plus the composite scorer. Verify weights, caps, edge cases, and grade thresholds.

## Agent
CLAUDE — Strict testing with edge cases, weight verification, and scoring algorithm compliance.

## Input Contracts (read from `@pare-engine/core/contracts`)
- All `*Score` types from `scoring.contract.ts`
- `SCORING_WEIGHTS`, `TOTAL_POINTS`, `scoreToGrade` from `scoring.contract.ts`
- All `*AnalysisOutput` types from `analysis.contract.ts`

## Output Contracts (this session implements)
None — test-only session.

## Files OWNED (exclusive write access)
- `packages/core/src/scoring/ai-visibility.test.ts`
- `packages/core/src/scoring/content-quality.test.ts`
- `packages/core/src/scoring/schema-completeness.test.ts`
- `packages/core/src/scoring/technical-readiness.test.ts`
- `packages/core/src/scoring/local-gbp.test.ts`
- `packages/core/src/scoring/index.test.ts` (composite + grade tests)

## Files READ-ONLY (import, do not modify)
- All `packages/core/src/scoring/*.ts` implementation files
- All contract files
- `docs/SCORING_ALGORITHM.md`

## Scaffold Salvage
None

## Dependencies
- S2 must complete first because the scoring directory and stub files must exist.
- S5, S6, S7 should complete first because pillar implementations are needed for meaningful tests.
- S8, S9 should complete first because the remaining pillar implementations are needed.
- Can start writing tests against stubs first, then verify against real implementations.

## Exit Criteria
- Every scoring function tested for: zero input, perfect input, typical input, edge cases
- No pillar score exceeds its maximum (30, 30, 15, 10, 15)
- Composite score never exceeds 100
- `SCORING_WEIGHTS` values sum to exactly 100
- Grade thresholds: A>=90, B>=80, C>=70, D>=60, F<60
- Graceful degradation tested: AI Visibility with 1/3 providers, GBP with no Place ID
- All tests pass: `pnpm --filter @pare-engine/core test`

## Known Bugs to Fix
None — greenfield test code
