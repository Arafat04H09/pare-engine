# S14: Next.js Scaffold + Public Routes + Auth

## Mission
Scaffold the apps/web Next.js 15 application with public marketing routes and session-based admin authentication. This is the foundation that S15 and S16 build on.

## Agent
CLAUDE — Auth middleware and session security requires understanding bcrypt + cookie patterns and Next.js App Router middleware.

## Input Contracts (read from `@pare-engine/core/contracts`)
- `ValidatedConfig` from `config.contract.ts` (for admin credentials, session secret)

## Output Contracts (this session implements)
None — web application scaffold, no shared library types.

## Files OWNED (exclusive write access)
- `apps/web/app/layout.tsx`
- `apps/web/app/page.tsx` (home / landing)
- `apps/web/app/(public)/services/page.tsx`
- `apps/web/app/(public)/about/page.tsx`
- `apps/web/app/(public)/contact/page.tsx`
- `apps/web/app/admin/login/page.tsx`
- `apps/web/app/admin/layout.tsx`
- `apps/web/middleware.ts`
- `apps/web/lib/auth.ts`
- `apps/web/lib/session.ts`
- `apps/web/next.config.ts`
- `apps/web/tailwind.config.ts`
- `apps/web/tsconfig.json`

## Files READ-ONLY (import, do not modify)
- `packages/core/src/contracts/config.contract.ts`
- `docs/WEBSITE_SPEC.md`
- `CLAUDE.md` (admin auth requirements)

## Scaffold Salvage
None

## Dependencies
- S1 must complete first because it provides the config for admin credentials and session secret.
- Bootstrap must have created `apps/web/package.json`.

## Exit Criteria
- `pnpm --filter @pare-engine/web dev` serves the Next.js app
- Public routes render: `/`, `/services`, `/about`, `/contact`
- `/admin/*` routes redirect to `/admin/login` when not authenticated
- `/admin/login` page with email + password form
- Login validates against `ADMIN_EMAIL` + bcrypt-compared `ADMIN_PASSWORD_HASH` from config
- Session stored in HTTP-only cookie, validated by middleware on every `/admin/*` request
- Middleware at `apps/web/middleware.ts` checks session cookie
- `lib/auth.ts` exports `verifyPassword()`, `createSession()`, `validateSession()`
- Tailwind v4 + shadcn/ui configured
- No OAuth, no magic links, no multi-tenant — bcrypt + cookie only

## Known Bugs to Fix
None — greenfield code
