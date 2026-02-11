# SPEC: C12 & C13 — Sentiment & Competitive Intelligence Dashboards

## Priority
C — Parallel

## Dependencies
- Blocks: []
- Blocked by: [A6, B4]

## Files OWNED (may create or modify)
- apps/web/app/admin/audits/[id]/sentiment/page.tsx
- apps/web/app/admin/audits/[id]/competitors/page.tsx

## Files READ-ONLY (may import from, never modify)
- packages/core/src/tools/analyze-review-semantics.js
- packages/core/src/tools/analyze-competitor.js

## Acceptance Criteria
1. [ ] `Sentiment Dashboard`: Visualize review themes and brand sentiment over time.
2. [ ] `Competitive Intelligence`: Compare client scores against 3-5 competitors.
3. [ ] Use charts (Chart.js or similar) to show Share of Voice.
4. [ ] List top positive and negative sentiment drivers.

## Implementation Notes
- Reference `packages/core/src/report-templates/charts.ts` for consistent styling.
- Data comes from `monitoring_results` and `competitor_snapshots` tables.

## Verification Command
pnpm build --filter=web
