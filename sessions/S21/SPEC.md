# S21: Vertical Intelligence + Accuracy Scorer

## Mission
Seed the vertical-specific prompt library (3 verticals: Dental, HVAC, Legal) and build the AI accuracy scorer that compares AI engine claims against known-truth data.

## Agent
HYBRID — CLAUDE designs the accuracy scorer logic. GEMINI generates 60+ prompts across 3 verticals (volume task benefiting from large context).

## Input Contracts (read from `@pare-engine/core/contracts`)
- `MultiProviderResult`, `EngineResponse` from `query.contract.ts`
- `GBPAnalysisOutput` from `analysis.contract.ts`

## Output Contracts (this session implements)
None — populates prompt library table and creates accuracy scoring tool.

## Files OWNED (exclusive write access)
- `packages/core/src/prompt-library/index.ts`
- `packages/core/src/prompt-library/dental.ts`
- `packages/core/src/prompt-library/hvac.ts`
- `packages/core/src/prompt-library/legal.ts`
- `packages/core/src/tools/accuracy-scorer.ts`

## Files READ-ONLY (import, do not modify)
- All contract files
- `packages/query-engine/src/prompts.ts` (scaffold — has 15 prompts across 3 verticals, good starting point)
- `packages/core/src/database/schema.ts` (promptLibrary table)

## Scaffold Salvage
- `packages/query-engine/src/prompts.ts` → Keep all 15 prompts and the `generatePrompts(vertical, city)` pattern → expand to 20+ per vertical in `prompt-library/*.ts`

## Dependencies
- S4 must complete first because the accuracy scorer needs the engine response format
- S8 must complete first because the accuracy scorer compares AI claims vs GBP known-truth

## Exit Criteria
- `prompt-library/dental.ts` exports 20+ GEO-specific prompts for dental vertical
- `prompt-library/hvac.ts` exports 20+ GEO-specific prompts for HVAC vertical
- `prompt-library/legal.ts` exports 20+ GEO-specific prompts for legal vertical
- `prompt-library/index.ts` exports `getPromptsForVertical(vertical: string, city: string): string[]`
- Each prompt is a template with `[city]` placeholder
- `scoreAccuracy(responses: EngineResponse[], knownTruth: GBPAnalysisOutput)` compares AI claims (address, hours, services, phone) against GBP data
- Accuracy scorer returns: `{ accuracyScore: number, inaccuracies: Array<{claim, truth, platform}> }`
- Prompts stored in code, can be seeded to `promptLibrary` DB table via migration script

## Known Bugs to Fix
None — greenfield code
