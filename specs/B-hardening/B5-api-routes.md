# SPEC: B5 — API Routes

## Priority
B — Parallel

## Dependencies
- Blocks: []
- Blocked by: [A6]

## Files OWNED (may create or modify)
- apps/web/app/api/admin/*
- apps/web/app/api/audit/*
- apps/web/app/api/remediation/*
- apps/web/app/api/webhooks/*

## Files READ-ONLY (may import from, never modify)
- packages/core/src/contracts/index.ts

## Acceptance Criteria
1. [ ] Implement input validation using Zod for all POST/PUT routes.
2. [ ] Return proper HTTP status codes (200, 201, 400, 401, 404, 500).
3. [ ] Implement auth checks for all `/api/admin/*` routes.
4. [ ] Standardize error responses (Rule #9: extend Error with code).
5. [ ] No `apps/api` directory — all API routes in `apps/web/app/api/`.

## Implementation Notes
- Rule #11: All API routes live in `apps/web/app/api/`.
- Use `generateObject()` for any API-based LLM parsing (Rule #12).

## Verification Command
pnpm build --filter=web
