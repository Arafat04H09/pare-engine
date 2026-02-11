# SPEC: A6 — E2E Pipeline Smoke Test

## Priority
A — Sequential

## Dependencies
- Blocks: [B*, C*]
- Blocked by: [A1, A2, A3, A4, A5]

## Files OWNED (may create or modify)
- apps/audit-runner/src/pipeline.ts
- apps/audit-runner/src/steps/verify.ts (new or existing)

## Files READ-ONLY (may import from, never modify)
- apps/audit-runner/src/steps/*
- packages/core/src/*

## Acceptance Criteria
1. [ ] Triggering an `audit/requested` event (via Inngest dev UI or curl) starts the pipeline.
2. [ ] All 6 steps (`crawl`, `query`, `analyze`, `score`, `report`, `deliver`) execute in order.
3. [ ] Step outputs are correctly passed to subsequent steps.
4. [ ] Pipeline completes (even if individual step logic is still stubbed/basic).

## Implementation Notes
- This is a sanity check. Ensure the orchestration logic in `pipeline.ts` is solid.
- Verify `rehydrateDates` helper works correctly.
- Ensure `step.run()` is used for every major block.

## Verification Command
# TBD: Inngest dev server command
npx inngest-cli@latest dev
