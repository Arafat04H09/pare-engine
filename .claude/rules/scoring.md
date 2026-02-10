# Scoring Rules

When working on scoring-related code (files in `packages/core/src/scoring/` or any file importing scoring functions):

## Weights (MUST match these exactly)
- AI Visibility: 30 points max
- Content Quality: 30 points max
- Schema/Structured Data: 15 points max
- Technical Readiness: 10 points max
- Local/GBP + Third-Party: 15 points max
- Total: 100 points

## Implementation Rules
- Each scoring function returns a number from 0 to its max (e.g., `scoreAIVisibility()` returns 0-30)
- The composite score is the SUM of all pillar scores (already weighted by their max)
- Never use floating point for final scores — always `Math.round()`
- Letter grades: A (90-100), B (80-89), C (70-79), D (60-69), F (0-59)
- Sentiment analysis MUST use LLM (Claude Haiku via AI SDK `generateObject()`), NOT keyword matching

## Testing
- Every scoring function needs test cases for: 0 input, perfect input, typical input, edge cases
- Test that no pillar score exceeds its maximum
- Test that composite score never exceeds 100

## Contracts
- Source of truth: `packages/core/src/contracts/scoring.contract.ts`
- Exports: `SCORING_WEIGHTS`, `scoreToGrade()`, `CompositeScore`, all 5 pillar score schemas
- Import via: `import { SCORING_WEIGHTS, CompositeScore } from '@pare-engine/core/contracts'`
- **Known bug in legacy code:** `src/scoring.ts` uses wrong weights (35/25/20/10/10). S2 replaces it entirely.

## Reference
See `docs/SCORING_ALGORITHM.md` for complete specification with formulas.
