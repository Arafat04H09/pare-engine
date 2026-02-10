# S8: GBP/Local Scoring

## Mission
Build the Local/GBP scoring function (15 points) with Google Places API integration for business data, reviews, and NAP consistency checking.

## Agent
CLAUDE — Google Places API integration, GBP scoring function with data extraction.

## Input Contracts (read from `@pare-engine/core/contracts`)
- `GBPAnalysisOutput` from `analysis.contract.ts`
- `GBPScore` from `scoring.contract.ts`
- `ValidatedConfig` from `config.contract.ts` (for Google Places API key)

## Output Contracts (this session implements)
- `GBPAnalysisOutput` from `analysis.contract.ts`
- `GBPScore` from `scoring.contract.ts`

## Files OWNED (exclusive write access)
- `packages/core/src/tools/google-places.ts`
- `packages/core/src/scoring/local-gbp.ts` (replaces S2's stub)
- `apps/audit-runner/src/steps/analyze-gbp.ts`

## Files READ-ONLY (import, do not modify)
- All contract files

## Scaffold Salvage
None

## Dependencies
- S2 must complete first because it creates the `local-gbp.ts` stub that this session replaces with the real implementation.

## Exit Criteria
- `fetchGBPData(placeId: string): Promise<GBPAnalysisOutput>` fetches real data from Google Places API (New)
- `analyzeGBP(gbpData, domain, crawlPages?): GBPAnalysisOutput` checks: rating, reviews, photos, description, categories, hours, Q&A, NAP consistency
- `scoreLocalGBP(analysis: GBPAnalysisOutput): GBPScore` returns 0-15
- Score breakdown: GBP completeness (5pts), review quality (4pts), NAP consistency (3pts), directory presence (3pts)
- Handles missing GBP data gracefully (no Place ID = score 0 with note)
- Tests for: no GBP, perfect GBP, typical local business, missing fields

## Known Bugs to Fix
None — greenfield code
