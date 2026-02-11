# SPEC: C5 — Client Onboarding Form

## Priority
C — Parallel

## Dependencies
- Blocks: []
- Blocked by: [A6, B4]

## Files OWNED (may create or modify)
- apps/web/app/admin/clients/onboarding/page.tsx
- apps/web/app/api/admin/clients/route.ts

## Files READ-ONLY (may import from, never modify)
- packages/core/src/database/schema.js

## Acceptance Criteria
1. [ ] Implement a multi-step onboarding form for new clients.
2. [ ] Fields: Business Name, Domain, Vertical, City, State, Primary Contact.
3. [ ] Submission auto-triggers an initial audit.
4. [ ] Create a `clients` record in the database.

## Implementation Notes
- Use `zod-resolver` for form validation.
- Trigger Inngest event `audit/requested` on successful client creation.

## Verification Command
pnpm build --filter=web
