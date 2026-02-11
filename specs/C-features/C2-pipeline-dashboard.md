# SPEC: C2 — Pipeline Status Dashboard

## Priority
C — Parallel

## Dependencies
- Blocks: []
- Blocked by: [A6, B4]

## Files OWNED (may create or modify)
- apps/web/app/admin/pipeline/page.tsx
- apps/web/app/api/admin/pipeline/route.ts

## Files READ-ONLY (may import from, never modify)
- apps/audit-runner/src/inngest.js

## Acceptance Criteria
1. [ ] Real-time visualization of Inngest pipeline progress (Crawling... Querying... Scoring...).
2. [ ] List of active audits with current step and duration.
3. [ ] Ability to view detailed logs for each step.
4. [ ] Visual indicator for failed platforms / steps.

## Implementation Notes
- Use Inngest's `step.run()` events to track progress.
- Implement polling or WebSockets (if supported by infra) for real-time updates.

## Verification Command
pnpm build --filter=web
