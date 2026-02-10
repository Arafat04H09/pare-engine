# S16: Admin Dashboard

## Mission
Build the /admin dashboard routes for the solo operator: client list, audit history, score breakdowns, re-run audit action, and PDF download.

## Agent
GEMINI — Admin dashboard is UI-heavy with many routes, tables, and data displays. Benefits from 2M context for holding all admin spec + component patterns.

## Input Contracts (read from `@pare-engine/core/contracts`)
- `CompositeScore` from `scoring.contract.ts`
- `AuditPipelineResult` from `pipeline.contract.ts`
- `FullReportData` from `report.contract.ts`

## Output Contracts (this session implements)
None — web application routes.

## Files OWNED (exclusive write access)
- `apps/web/app/admin/(dashboard)/page.tsx` (dashboard home)
- `apps/web/app/admin/clients/page.tsx`
- `apps/web/app/admin/clients/[id]/page.tsx`
- `apps/web/app/admin/audits/page.tsx`
- `apps/web/app/admin/audits/[id]/page.tsx`
- `apps/web/app/admin/components/` (shared admin UI components)
- `apps/web/app/api/admin/clients/route.ts`
- `apps/web/app/api/admin/audits/route.ts`
- `apps/web/app/api/admin/audits/[id]/rerun/route.ts`
- `apps/web/app/api/admin/audits/[id]/pdf/route.ts`

## Files READ-ONLY (import, do not modify)
- All contract files
- `apps/web/middleware.ts` (S14 — auth)
- `apps/web/lib/auth.ts` (S14 — session validation)
- `apps/web/app/admin/layout.tsx` (S14 — admin layout with nav)
- `packages/core/src/database/schema.ts` (Drizzle queries)

## Scaffold Salvage
None

## Dependencies
- S14 must complete first because it provides admin auth middleware and admin layout
- S12 should complete first because re-triggering audits requires the Inngest pipeline
- Round 3 should complete first because scoring data is needed to display

## Exit Criteria
- Dashboard home shows: total clients, recent audits, average score
- Client list: sortable table with name, domain, score, engagement type, last audit date
- Client detail: audit history, score trend, pillar breakdown, contact info
- Audit detail: full score breakdown, findings, PDF download link
- Re-run audit: button on client detail that triggers new `'audit/requested'` Inngest event
- PDF download: streams stored PDF from audit result
- All data from Postgres via Drizzle — never from Notion
- Responsive layout with Tailwind + shadcn/ui components
- Protected by S14's auth middleware

## Known Bugs to Fix
None — greenfield code
