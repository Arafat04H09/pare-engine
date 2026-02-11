# SPEC: D — Testing Suite

## Priority
D — Parallel

## Dependencies
- Blocks: []
- Blocked by: [A1]

## Files OWNED (may create or modify)
- packages/core/src/**/*.test.ts
- apps/audit-runner/src/**/*.test.ts
- apps/web/tests/

## Files READ-ONLY (may import from, never modify)
- All source files

## Acceptance Criteria
1. [ ] `Scoring Tests`: Unit tests for all scoring functions (D1).
2. [ ] `Tool Tests`: unit tests for all tool functions with mocked APIs (D2).
3. [ ] `Pipeline Tests`: Integration tests for Inngest steps (D3).
4. [ ] `E2E Tests`: Playwright tests for Admin and Public pages (D4, D5).
5. [ ] `Contract Tests`: Verify Zod schemas parse/reject data correctly (D6).

## Implementation Notes
- Use Vitest for unit/integration tests.
- Use Playwright for E2E tests.
- Follow Rule #10: Mock external API failures to verify error handling.
- Scoring tests must verify that scores never exceed 100 or pillar maximums.

## Verification Command
pnpm test
