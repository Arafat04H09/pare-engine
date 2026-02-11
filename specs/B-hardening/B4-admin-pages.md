# SPEC: B4 — Admin Pages

## Priority
B — Parallel

## Dependencies
- Blocks: []
- Blocked by: [A6]

## Files OWNED (may create or modify)
- apps/web/app/admin/layout.tsx
- apps/web/app/admin/page.tsx
- apps/web/app/admin/(dashboard)/*
- apps/web/app/admin/audits/*
- apps/web/app/admin/clients/*

## Files READ-ONLY (may import from, never modify)
- apps/web/lib/auth.ts
- apps/web/components/ui/*

## Acceptance Criteria
1. [ ] Implement loading states and error boundaries for all admin routes.
2. [ ] Use `force-dynamic` export for all admin pages (Rule #stack).
3. [ ] Implement empty states for client and audit lists.
4. [ ] Ensure auth checks are performed (middleware + server components).
5. [ ] UI follows Shadcn/UI standards + Tailwind v4.

## Implementation Notes
- Rule #1: Named exports only (except Next.js pages).
- All admin pages must be responsive.
- Reference `apps/web/middleware.ts` for auth logic.

## Verification Command
pnpm build --filter=web
