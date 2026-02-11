---
name: build
description: Implement a single spec file with strict file ownership boundaries and self-verification.
---

# Skill: Build

## Purpose
Implement a single spec from the Pare Engine spec library. Reads the spec, writes only owned files, self-tests with the verification command, and logs the result.

## Inputs

A spec file path MUST be provided by the user (e.g., `specs/B-hardening/B2.1-scoring-fix.md`).

If no argument was provided, read `specs/index.md` and select the next spec with status "ready" (all dependencies completed).

Also read for context:
- `CLAUDE.md` — Architectural constraints and coding conventions
- The `references/conventions.md` file in this directory — Quick reference for Pare coding rules
- All contract files referenced in the spec's READ-ONLY section

## Process

1. **Parse Spec**: Read the spec file at the provided path. Extract:
   - Files OWNED (your exclusive write list)
   - Files READ-ONLY (import from, never modify)
   - Acceptance criteria (your checklist)
   - Verification command

2. **Read Context**: Read all FILES OWNED (if they exist) and FILES READ-ONLY to understand current state. Read relevant contract files to understand type interfaces.

3. **Implement**: Write code following the spec's technical approach:
   - Only create or modify files in the OWNED list
   - Import types from `@pare-engine/core/contracts`
   - Follow all coding conventions (named exports, async/await, Zod for LLM, etc.)
   - Use `Promise.allSettled()` for multi-provider calls
   - Use `generateObject()` with Zod schemas for structured LLM output

4. **Self-Test**: Run the verification command from the spec:
   ```bash
   pnpm build && pnpm test
   ```
   If it fails, read the error output and fix. Repeat until passing.

5. **Verify Boundaries**: Confirm you only modified files in your OWNED list:
   ```bash
   git diff --name-only
   ```
   If you modified a file outside your OWNED list, revert those changes.

6. **Log Result**: Write a build log entry to `pipeline/6-build/build-log-YYYY-MM-DD.md` with:
   - Spec ID and title
   - Files created/modified
   - Acceptance criteria status (pass/fail per criterion)
   - Verification command result
   - Any deviations from the spec (with justification)

## Output

- Code changes in the OWNED files
- Build log in `pipeline/6-build/build-log-YYYY-MM-DD.md`
- Updated `specs/index.md` status for this spec (mark as "done")

## Rules
- **NEVER modify files outside your OWNED list.** This is the #1 rule.
- **NEVER modify contract files** unless the spec explicitly owns them.
- Import shared types from `@pare-engine/core/contracts`, never from sibling code.
- Named exports only. No default exports (exception: Next.js pages).
- `async/await` only. No `.then()` chains.
- All environment variables come from validated config. No raw `process.env`.
- Use `generateObject()` + Zod for all LLM structured output.
- Use `Promise.allSettled()` for multi-provider queries. Never `Promise.all()`.
- Custom error classes extend `Error` with a `code` property.
- Sentiment analysis must be LLM-based, not keyword matching.
- HTML/CSS + Puppeteer for PDFs. Never React-PDF.
- If the spec seems wrong or impossible, log the issue and stop. Do not improvise.
