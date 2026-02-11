# SPEC: A3 — Database Migration

## Priority
A — Sequential

## Dependencies
- Blocks: [A6, B3, C14]
- Blocked by: [A1]

## Files OWNED (may create or modify)
- packages/core/src/database/schema.ts
- packages/core/drizzle.config.ts
- packages/core/drizzle/ (migrations folder)

## Files READ-ONLY (may import from, never modify)
- packages/core/src/config.ts (for DATABASE_URL)

## Acceptance Criteria
1. [ ] `pnpm drizzle-kit push` runs successfully against a local/temp Postgres instance.
2. [ ] All 8 tables (`clients`, `audit_results`, `monitoring_results`, `deliverables`, `prompt_library`, `remediation_items`, `competitors`, `competitor_snapshots`) exist.
3. [ ] All indexes and foreign keys from `schema.ts` are reflected in the DB.
4. [ ] `pnpm check-db` (custom script or just status check) passes.

## Implementation Notes
- Ensure Drizzle schema is fully aligned with the requirements (PostgreSQL 16).
- Verify all `uuid` fields use `.defaultRandom()`.
- Ensure `updatedAt` fields use appropriate triggers or application-level updates if necessary.
- Use `drizzle-kit push` for initial setup.

## Verification Command
cd packages/core && pnpm drizzle-kit push
