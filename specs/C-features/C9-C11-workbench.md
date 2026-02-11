# SPEC: C9, C10 & C11 — Implementation Workbench & Proposal Generator

## Priority
C — Parallel

## Dependencies
- Blocks: []
- Blocked by: [A6, B4, B6]

## Files OWNED (may create or modify)
- apps/web/app/admin/audits/[id]/workbench/page.tsx
- apps/web/app/api/admin/audits/[id]/remediations/route.ts
- packages/core/src/tools/generate-proposal.ts

## Files READ-ONLY (may import from, never modify)
- packages/core/src/tools/content-optimizer.js

## Acceptance Criteria
1. [ ] `Workbench`: Interface to approve/reject remediation items (JSON-LD, FAQ).
2. [ ] `Diff View`: Show side-by-side original vs optimized content.
3. [ ] `Proposal Generator`: Map remediation items to a branded SOW PDF with pricing.
4. [ ] Integrate `content-optimizer` tool to allow live edits/previews.

## Implementation Notes
- Use `remediation_items` table to track state.
- Proposal generator should follow the styling from `report-templates/proposal.html`.

## Verification Command
pnpm build --filter=web
