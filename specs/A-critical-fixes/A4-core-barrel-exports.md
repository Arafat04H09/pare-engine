# SPEC: A4 — Core Barrel Exports

## Priority
A — Sequential

## Dependencies
- Blocks: [B*, C*, D*]
- Blocked by: [A1]

## Files OWNED (may create or modify)
- packages/core/src/index.ts
- packages/core/src/contracts/index.ts

## Files READ-ONLY (may import from, never modify)
- All files in packages/core/src/tools/
- All files in packages/core/src/scoring/
- All files in packages/core/src/contracts/

## Acceptance Criteria
1. [ ] `packages/core/src/index.ts` re-exports all public types and functions.
2. [ ] External apps (`web`, `audit-runner`) can import everything from `@pare-engine/core`.
3. [ ] No default exports are used.
4. [ ] Build succeeds.

## Implementation Notes
- Systematically add `export * from './tools/file.js'` (or selective exports) to `index.ts`.
- Ensure all Zod schemas from `contracts/` are exported.
- Follow Rule #1: Named exports only. No default exports.

## Verification Command
pnpm build
