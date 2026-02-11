# SPEC: C1 — Admin Settings Page

## Priority
C — Parallel

## Dependencies
- Blocks: []
- Blocked by: [A6, B4]

## Files OWNED (may create or modify)
- apps/web/app/admin/settings/page.tsx
- apps/web/app/api/admin/settings/route.ts

## Files READ-ONLY (may import from, never modify)
- packages/core/src/config.js

## Acceptance Criteria
1. [ ] Implement a settings page to manage API keys, email config, and branding.
2. [ ] Settings are stored in the `database` (new table if needed, or structured settings row).
3. [ ] Ability to test API keys (Firecrawl, OpenAI) via the UI.
4. [ ] Branded UI for SOW and Report PDFs (color picker, logo upload).

## Implementation Notes
- Use `generateObject()` to validate API keys if possible.
- Ensure settings are encrypted or stored securely if they contain sensitive keys.

## Verification Command
pnpm build --filter=web
