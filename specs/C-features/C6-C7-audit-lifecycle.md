# SPEC: C6 & C7 — Audit Persistence & Lifecycle

## Priority
C — Parallel

## Dependencies
- Blocks: []
- Blocked by: [A6, B3]

## Files OWNED (may create or modify)
- apps/web/app/api/audit/[id]/rerun/route.ts
- apps/audit-runner/src/steps/deliver.ts (ownership adjustment or collaboration)

## Files READ-ONLY (may import from, never modify)
- packages/core/src/database/schema.js

## Acceptance Criteria
1. [ ] Save PDF buffer to local filesystem (or mock S3) and store URL in `reportPdfUrl`.
2. [ ] Implement "Rerun" button in admin UI that fires a new Inngest event.
3. [ ] Maintain parent/child relationship between audits (for delta tracking).
4. [ ] Delete old PDFs when audit records are purged.

## Implementation Notes
- Update `audit_results` record after PDF is saved.
- Use `parentAuditId` column to link reruns.

## Verification Command
pnpm build
