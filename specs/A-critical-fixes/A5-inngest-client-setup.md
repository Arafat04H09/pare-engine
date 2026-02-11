# SPEC: A5 — Inngest Client Setup

## Priority
A — Sequential

## Dependencies
- Blocks: [A6, B3, C2]
- Blocked by: [A1, A2]

## Files OWNED (may create or modify)
- apps/audit-runner/src/inngest.ts

## Files READ-ONLY (may import from, never modify)
- packages/core/src/contracts/index.ts

## Acceptance Criteria
1. [ ] `PareEvents` interface correctly typed with all events needed for the pipeline.
2. [ ] `inngest` client correctly initialized with ID `pare-engine`.
3. [ ] `audit/requested` event payload matches `AuditRequest` contract.
4. [ ] Inngest server can discover the function (verification via local Inngest dev server).

## Implementation Notes
- Ensure all event names follow the `domain/event` pattern (e.g., `audit/requested`).
- Reference Rule #11: All API routes live in `apps/web/app/api/`. Verify Inngest serve route is in `apps/web/app/api/inngest/route.ts`.

## Verification Command
pnpm build
