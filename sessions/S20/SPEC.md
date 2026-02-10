# S20: Verify Loop + Score History

## Mission
Build the audit→fix→verify cycle: re-run audit post-implementation, calculate score deltas, and display before/after comparison in the report. Track score history over time.

## Agent
CLAUDE — Pipeline orchestration for re-audit flow, delta calculation, and database time-series tracking.

## Input Contracts (read from `@pare-engine/core/contracts`)
- `AuditPipelineResult`, `AuditRequest` from `pipeline.contract.ts`
- `CompositeScore` from `scoring.contract.ts`

## Output Contracts (this session implements)
None — orchestration and reporting enhancement, not new library types.

## Files OWNED (exclusive write access)
- `apps/audit-runner/src/steps/verify.ts`
- `packages/core/src/tools/score-delta.ts`
- `packages/core/src/report-templates/audit-verify.html` (before/after delta page)

## Files READ-ONLY (import, do not modify)
- All contract files
- `apps/audit-runner/src/pipeline.ts` (S12 — the pipeline this extends)
- `packages/core/src/database/schema.ts`
- `packages/core/src/report-templates/styles.css` (S10)

## Scaffold Salvage
None

## Dependencies
- S12 must complete first because this extends the pipeline with a verify step
- S10 must complete first because the delta page needs report template patterns

## Exit Criteria
- `verify.ts` triggers a re-audit for an existing client, compares new score to previous
- `scoreDelta(before: CompositeScore, after: CompositeScore)` returns per-pillar and overall deltas
- `audit-verify.html` template shows before/after scores side-by-side with delta arrows
- Score history written to `monitoringResults` table with timestamp
- Can query score trend for a client over time
- Handles: first audit (no "before" to compare), identical scores (delta = 0)

## Known Bugs to Fix
None — greenfield code
