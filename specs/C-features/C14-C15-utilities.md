# SPEC: C14 & C15 — CSV Export & Command Palette

## Priority
C — Parallel

## Dependencies
- Blocks: []
- Blocked by: [A6, B4]

## Files OWNED (may create or modify)
- apps/web/app/api/admin/export/route.ts
- apps/web/components/command-palette.tsx

## Files READ-ONLY (may import from, never modify)
- packages/core/src/database/schema.js

## Acceptance Criteria
1. [ ] `CSV Export`: Export client list + audit history + scores.
2. [ ] `Command Palette`: Ctrl+K to navigate globally, trigger audits, or lookup clients.
3. [ ] CSV export should handle thousands of rows using streaming if possible.
4. [ ] Command palette should be accessible from any admin page.

## Implementation Notes
- For Command Palette, use a library like `cmdk`.
- Ensure CSV export uses proper headers and handles special characters in business names.

## Verification Command
pnpm build --filter=web
