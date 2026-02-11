---
name: test
description: >
  Generate Vitest tests for a specific module or file. Reads the source,
  understands contracts, and writes comprehensive tests with edge cases.
argument-hint: "packages/core/src/scoring/ai-visibility.ts"
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Test

You are generating comprehensive Vitest tests for a specific module in the Pare Engine codebase.

## Inputs

A file path or module name MUST be provided: $ARGUMENTS

Also read for context:
- Any contract files imported by the target module
- Existing test files nearby (to match patterns and avoid duplication)

## Process

1. **Read the Target**: Read the file at the provided path. Understand every exported function, its inputs, outputs, and edge cases.

2. **Read Contracts**: Read any contract files referenced by the module to understand the Zod schemas and type constraints.

3. **Find Existing Tests**: Search for existing test files:
   - `*.test.ts` or `*.spec.ts` adjacent to the target
   - `__tests__/` directories
   - Avoid duplicating tests that already exist

4. **Design Test Cases**: For each exported function, plan tests for:
   - **Happy path**: Typical valid input → expected output
   - **Zero/empty input**: What happens with no data?
   - **Perfect input**: Maximum scores, full data
   - **Edge cases**: Very long strings, special characters, missing optional fields
   - **Boundary values**: Score maximums (never exceeds pillar max), grade boundaries (89→B, 90→A)
   - **Error cases**: Invalid input, API failures, missing dependencies

5. **Write Tests**: Create a test file following Vitest conventions:
   ```typescript
   import { describe, it, expect, vi } from 'vitest';
   ```
   - Group tests with `describe()` blocks by function
   - Use clear test names: `it('returns 0 when no mentions found')`
   - Mock external dependencies (LLM calls, API calls, DB) with `vi.mock()`
   - Use `vi.fn()` for function mocks
   - Assert specific values, not just truthy/falsy

6. **Verify**: Run the tests:
   ```bash
   pnpm --filter @pare-engine/core test
   ```
   Or for apps:
   ```bash
   pnpm --filter @pare-engine/audit-runner test
   ```

## Output

- Test file written adjacent to source (e.g., `scoring.test.ts` next to `scoring.ts`)
- All tests passing
- Coverage summary reported

## Rules
- Use Vitest, not Jest (same API, different runner)
- Mock all external calls (LLM, APIs, DB) — tests must run without env vars
- Never modify the source file to make tests pass — the source is truth
- Scoring tests must verify pillar maximums are never exceeded
- Test that `scoreToGrade()` returns correct grades at boundaries
- Use `vi.mock()` at module level, not inside test blocks
- Import from `@pare-engine/core/contracts` for test data types
- Prefer explicit assertions over snapshot tests
