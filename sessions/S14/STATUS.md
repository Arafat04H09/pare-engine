# S14: Web App Scaffold — Status

**Status: complete**

## Session Info
- Branch: `session/S14-web`
- Owner: S14
- Mission: Scaffold Next.js 15 app with public marketing routes and session-based admin auth

## Files Created/Modified

### New Files
- `apps/web/app/layout.tsx` — Root layout with Inter/Space Mono fonts, full SEO metadata
- `apps/web/app/page.tsx` — Landing page (hero, problem, solution, how-it-works, FAQ, CTA, footer)
- `apps/web/app/globals.css` — Tailwind v4 @theme with brand tokens
- `apps/web/app/(public)/services/page.tsx` — Services page with 3 pricing tiers
- `apps/web/app/(public)/about/page.tsx` — About page with GEO explanation, 5 pillars
- `apps/web/app/(public)/contact/page.tsx` — Contact form + sidebar info
- `apps/web/app/admin/layout.tsx` — Admin nav with logout
- `apps/web/app/admin/login/page.tsx` — Login page with Server Action
- `apps/web/app/admin/page.tsx` — Dashboard placeholder
- `apps/web/app/api/auth/logout/route.ts` — POST route to destroy session
- `apps/web/middleware.ts` — Protects /admin/* with HMAC session validation
- `apps/web/lib/auth.ts` — bcrypt password verification + admin authentication
- `apps/web/lib/session.ts` — HMAC-signed HTTP-only session cookies
- `apps/web/postcss.config.mjs` — @tailwindcss/postcss plugin
- `apps/web/tailwind.config.ts` — Brand colors and fonts for shadcn compatibility

### Modified Files
- `apps/web/tsconfig.json` — Fixed path alias @/* to ./* , added Next.js 15 settings
- `apps/web/next.config.ts` — Added reactStrictMode, poweredByHeader: false

## Build Verification
- `pnpm --filter @pare-engine/web build` succeeds (Next.js 15.5.12)
- All routes compile and generate:
  - `/` (static), `/about` (static), `/contact` (static), `/services` (static)
  - `/admin` (static), `/admin/login` (dynamic)
  - `/api/auth/logout` (dynamic)
  - Middleware: 33.3 kB
- Note: Build only succeeds when S16 untracked files (`admin/audits/`, `admin/clients/`, `admin/(dashboard)/`, `lib/db.ts`) are removed from the working directory. These files import modules that don't exist yet and cause webpack errors. They will be properly resolved when S16 merges with its full file set.

## Deviations
- `apps/web/package.json` also modified to add `bcryptjs`, `tailwindcss`, `@tailwindcss/postcss`, `@types/bcryptjs` dependencies.
- All page/layout components use `export default function` (required by Next.js App Router) instead of named exports.
- Middleware uses Web Crypto API (`crypto.subtle`) instead of Node.js `crypto` for Edge Runtime compatibility.
- Accidental S17 commit (`7659fee`) landed on this branch from concurrent session interference. It modifies only S17-owned files.
