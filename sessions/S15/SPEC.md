# S15: Audit Form + Stripe

## Mission
Build the /audit page with a form for business info + payment via Stripe Checkout. Wire the Stripe webhook to trigger the Inngest audit pipeline on payment confirmation.

## Agent
CLAUDE — Stripe webhook handling and payment flow security requires careful implementation.

## Input Contracts (read from `@pare-engine/core/contracts`)
- `AuditRequest`, `AuditRequestSchema` from `pipeline.contract.ts`
- `ValidatedConfig` from `config.contract.ts`

## Output Contracts (this session implements)
None — web application routes.

## Files OWNED (exclusive write access)
- `apps/web/app/audit/page.tsx`
- `apps/web/app/audit/success/page.tsx`
- `apps/web/app/api/webhooks/stripe/route.ts`
- `apps/web/app/api/audit/create/route.ts`
- `apps/web/lib/stripe.ts`

## Files READ-ONLY (import, do not modify)
- All contract files
- `apps/web/middleware.ts` (S14 owns)
- `apps/web/app/layout.tsx` (S14 owns)
- `apps/audit-runner/src/pipeline.ts` (S12 owns — triggers via Inngest event)

## Scaffold Salvage
None

## Dependencies
- S14 must complete first because it provides the web app scaffold and layout
- S12 must complete first because the webhook triggers the Inngest pipeline
- S1 must complete first because Stripe keys live in config

## Exit Criteria
- `/audit` page renders form: business name, domain, vertical, city, state, email, competitors
- Form validates client-side using `AuditRequestSchema` via zodResolver
- Submit creates Stripe Checkout session with `$750` price
- Stripe webhook at `/api/webhooks/stripe` verifies signature, extracts payment data
- On `checkout.session.completed`: creates client record in Postgres via Drizzle, triggers `'audit/requested'` Inngest event
- `/audit/success` page shows confirmation
- Client record saved with all form data + `engagementType: 'audit'`
- Handles: failed payment (no trigger), duplicate webhook (idempotent)

## Known Bugs to Fix
None — greenfield code
