---
name: test
description: Generate Vitest tests for a specific module or file with comprehensive edge case coverage.
---

# Skill: Test

## Purpose
Generate comprehensive Vitest tests for a specific module in the Pare Engine codebase. Reads the source, understands contracts, and writes tests covering happy paths, edge cases, and error conditions.

## Inputs
A file path or module name must be provided by the user (e.g., `packages/core/src/scoring/ai-visibility.ts`).

Also read:
- `CLAUDE.md` — Testing conventions
- Any contract files imported by the target module
- Existing test files nearby (to match patterns and avoid duplication)

## Process

1. **Read the Target**: Read the file at the provided path. Understand every exported function, its inputs, outputs, and edge cases.

2. **Read Contracts**: Read any contract files referenced by the module to understand the Zod schemas and type constraints.

3. **Find Existing Tests**: Search for existing `*.test.ts` or `*.spec.ts` files adjacent to the target. Avoid duplicating tests that already exist.

4. **Design Test Cases**: For each exported function, plan tests for:
   - **Happy path**: Typical valid input
   - **Zero/empty input**: What happens with no data
   - **Perfect input**: Maximum scores, full data
   - **Edge cases**: Very long strings, special characters, missing optional fields
   - **Boundary values**: Score maximums, grade boundaries (89→B, 90→A)
   - **Error cases**: Invalid input, API failures

5. **Write Tests**: Create a test file using Vitest:
   ```typescript
   import { describe, it, expect, vi } from 'vitest';
   ```
   - Group tests with `describe()` by function
   - Use clear test names
   - Mock external dependencies with `vi.mock()`

6. **Verify**: Run `pnpm --filter @pare-engine/core test` (or appropriate package filter)

## Rules
- Use Vitest, not Jest
- Mock all external calls (LLM, APIs, DB) — tests must run without env vars
- Never modify the source file to make tests pass
- Scoring tests must verify pillar maximums are never exceeded
- Prefer explicit assertions over snapshot tests
- Import from `@pare-engine/core/contracts` for test data types
