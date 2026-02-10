# S25: Score Delta Alerts

## Mission
Build automated score change detection and email alerting. When a weekly monitoring run detects a significant score change, email the operator with causal context.

## Agent
CLAUDE — Delta detection logic, Resend email integration, causal attribution.

## Input Contracts (read from `@pare-engine/core/contracts`)
- `CompositeScore` from `scoring.contract.ts`
- `ValidatedConfig` from `config.contract.ts`

## Output Contracts (this session implements)
None — alerting system.

## Files OWNED (exclusive write access)
- `packages/core/src/tools/score-alerts.ts`
- `packages/core/src/email-templates/score-alert.tsx`

## Files READ-ONLY (import, do not modify)
- All contract files
- `packages/core/src/database/schema.ts`
- `packages/core/src/tools/send-report.ts` (S13 — Resend pattern)

## Scaffold Salvage
None

## Dependencies
- S24 must complete (weekly monitoring generates the data this analyzes)
- S13 must complete (email delivery pattern)
- Triggered by: client demand for proactive alerts

## Exit Criteria
- `detectScoreDeltas(clientId: string)` compares latest monitoring result to previous week
- Alert triggered when: overall score changes by >=5 points, or any pillar changes by >=3 points
- `score-alert.tsx` email template shows: old score -> new score, which pillars changed, possible cause
- Causal attribution: correlates score changes with known events (new review, schema change, etc.)
- Email sent to operator (not client) via Resend
- Handles: first monitoring run (no previous to compare), no change (no alert)

## Known Bugs to Fix
None — greenfield code
