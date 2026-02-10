# S24: Monthly Trend Reports + Scheduled Monitoring

## Mission
Build the 2-page monthly trend report template and wire Inngest scheduled functions for weekly automated monitoring of retainer clients.

## Agent
CLAUDE — Inngest scheduling patterns and report template integration.

## Input Contracts (read from `@pare-engine/core/contracts`)
- `CompositeScore` from `scoring.contract.ts`
- `AuditPipelineResult` from `pipeline.contract.ts`
- `PdfOutput` from `report.contract.ts`

## Output Contracts (this session implements)
None — report template + scheduled function.

## Files OWNED (exclusive write access)
- `packages/core/src/report-templates/monthly-trend.html`
- `apps/audit-runner/src/scheduled/weekly-monitor.ts`
- `apps/audit-runner/src/scheduled/monthly-report.ts`

## Files READ-ONLY (import, do not modify)
- All contract files
- `packages/core/src/report-templates/styles.css` (S10)
- `packages/core/src/tools/generate-pdf.ts` (S10)
- `packages/core/src/tools/send-report.ts` (S13)
- `packages/core/src/database/schema.ts`

## Scaffold Salvage
None

## Dependencies
- S12 must complete (pipeline infrastructure)
- S10 must complete (report template patterns)
- S13 must complete (email delivery)
- Triggered by: first retainer client

## Exit Criteria
- `monthly-trend.html` renders 2 pages: score trend chart (inline SVG), week-over-week pillar changes, key events
- `weekly-monitor.ts` Inngest cron function runs AI visibility checks for all retainer clients weekly
- `monthly-report.ts` Inngest cron function generates + emails monthly trend PDF to each retainer client
- Score history queried from `monitoringResults` table grouped by week
- Trend chart shows 4-12 weeks of score history as inline SVG line chart
- Handles: client with <4 weeks history (show what's available), no score change

## Known Bugs to Fix
None — greenfield code
