# SPEC: A2 — Config Consolidation

## Priority
A — Sequential

## Dependencies
- Blocks: [A6, B1, B5]
- Blocked by: [A1]

## Files OWNED (may create or modify)
- packages/core/src/config.ts
- packages/core/src/contracts/config.contract.ts

## Files READ-ONLY (may import from, never modify)
- All files using process.env (as list below)

## Files to Audit (Remove process.env usage):
- apps/web/app/api/webhooks/*
- apps/web/middleware.ts
- apps/web/lib/auth.ts
- apps/web/lib/db.ts
- apps/web/lib/stripe.ts
- apps/audit-runner/src/pipeline.ts (loadPipelineConfig must use core loadConfig)
- apps/audit-runner/src/inngest.ts
- apps/audit-runner/src/scheduled/*

## Acceptance Criteria
1. [ ] `process.env` is NEVER accessed outside of `packages/core/src/config.ts`.
2. [ ] All components use `loadConfig()` or `loadMinimalConfig()` from `@pare-engine/core`.
3. [ ] Zod validation in `config.contract.ts` covers all required variables.
4. [ ] Build succeeds with `pnpm build`.

## Implementation Notes
- Update `packages/core/src/config.ts` to include any missing environment variables identified during audit.
- Replace `process.env.VAR_NAME` with `config.varName`.
- Ensure `loadConfig()` is called once or appropriately cached (it's safe to call in server-side components).
- Follow Rule #7: Environment variables come from validated config object. No raw process.env.

## Verification Command
grep -r "process.env" . --exclude-dir=node_modules --exclude=packages/core/src/config.ts
