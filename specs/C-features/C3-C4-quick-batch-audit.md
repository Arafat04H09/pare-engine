# SPEC: C3 & C4 — Quick & Batch Audit Mode

## Priority
C — Parallel

## Dependencies
- Blocks: []
- Blocked by: [A6, B5]

## Files OWNED (may create or modify)
- apps/web/app/admin/quick-audit/page.tsx
- apps/web/app/api/audit/batch/route.ts

## Files READ-ONLY (may import from, never modify)
- apps/audit-runner/src/inngest.js

## Acceptance Criteria
1. [ ] `Quick Audit`: Domain + Business Name -> Mini audit in < 90 seconds.
2. [ ] `Batch Mode`: Paste 20+ domains -> Queue parallel audits.
3. [ ] Display a ranked results table for batch audits.
4. [ ] Link each result to the full audit report.

## Implementation Notes
- Use `auditRequest` with `auditType: 'mini'` for quick audits.
- Batch mode should trigger multiple Inngest events (concurrency control handled by Inngest).

## Verification Command
pnpm build --filter=web
