# SPEC: C8 — Monthly Monitoring Cron

## Priority
C — Parallel

## Dependencies
- Blocks: []
- Blocked by: [A6, B3, B8]

## Files OWNED (may create or modify)
- apps/audit-runner/src/scheduled/monthly-report.ts
- apps/web/app/api/webhooks/n8n/route.ts (if needed)

## Files READ-ONLY (may import from, never modify)
- packages/core/src/database/schema.js

## Acceptance Criteria
1. [ ] Implement a scheduled Inngest function (cron) that runs monthly for all active clients.
2. [ ] Performance "delta" scoring: compare latest scores to previous month.
3. [ ] Alert if scores drop below a certain threshold.
4. [ ] Send summary email to clients with the monthly trend.

## Implementation Notes
- Use `app/api/webhooks/n8n/route.ts` as a trigger if using external cron.
- Reference `packages/core/src/scoring/score-delta.js`.

## Verification Command
pnpm build
