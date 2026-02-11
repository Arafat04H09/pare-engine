# SPEC: A1 — Build Fix

## Priority
A — Sequential

## Dependencies
- Blocks: [A2, A3, A4, A5, A6, B*, C*, D*]
- Blocked by: []

## Files OWNED (may create or modify)
- tsconfig.json (root)
- packages/core/tsconfig.json
- apps/audit-runner/tsconfig.json
- apps/web/tsconfig.json

## Files READ-ONLY (may import from, never modify)
- All files (to fix imports)

## Acceptance Criteria
1. [ ] `pnpm build` succeeds from the root without errors.
2. [ ] No `any` types in newly added code.
3. [ ] All import paths are valid (relative within package, workspace protocol between packages).
4. [ ] No circular dependencies between packages.

## Implementation Notes
Fix any lingering TypeScript compilation errors. Common issues in this monorepo:
- Import mismatches (e.g., using `.ts` in imports instead of `.js` when using ESM).
- Missing exports in `package.json` `exports` field or `index.ts` barrel files.
- Type errors in stubbed implementations.

Check `pnpm build` output across all packages. Use `pnpm -r build` to build packages in dependency order.

## Verification Command
pnpm build
