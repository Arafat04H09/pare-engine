---
name: review
description: Lightweight pre-commit convention check against Pare coding standards.
---

# Skill: Review

## Purpose
Perform a lightweight code review of recent changes against Pare Engine coding conventions. Faster than the confirm skill — use before committing to catch violations early.

## Inputs
If a file path or pattern was provided by the user, review only those files.

If no argument, review all changes visible via `git diff --name-only` and `git diff --cached --name-only`.

Also read `CLAUDE.md` — Coding conventions section.

## Process

1. **Identify Changed Files**: Get the list of modified files from git diff or the provided argument.

2. **Read Each File**: Read the full content of each changed file.

3. **Check 12 Convention Rules**:

   | # | Rule | Check |
   |---|------|-------|
   | 1 | Named exports | No `export default` (except Next.js pages) |
   | 2 | async/await | No `.then()` chains |
   | 3 | No raw process.env | Must use validated config |
   | 4 | generateObject + Zod | No manual JSON parsing for LLM output |
   | 5 | Promise.allSettled | No `Promise.all()` for multi-provider |
   | 6 | Custom errors | Must extend `Error` with `code` property |
   | 7 | Contract imports | Import from `@pare-engine/core/contracts`, not siblings |
   | 8 | Scoring weights | 30/30/15/10/15 = 100 (if scoring code) |
   | 9 | Puppeteer PDFs | No React-PDF imports |
   | 10 | LLM sentiment | No keyword-based sentiment |
   | 11 | Drizzle ORM | No raw SQL outside migrations |
   | 12 | Type safety | Explicit return types on exported functions |

4. **Check Import Hygiene**: No circular imports, no unused imports, no imports from deleted scaffold packages.

5. **Check for Common Mistakes**: `console.log` in production code (warn), hardcoded secrets, missing error handling on async calls, `any` type usage (warn).

6. **Report**: Output a summary with PASS or WARN, per-file findings with line numbers, and suggested fixes.

## Rules
- This is READ-ONLY — never modify files during review
- Warnings are advisory, violations are blockers
- Be specific: cite file:line for every finding
- Don't nitpick style — focus on convention violations that matter
- Skip convention checks on markdown/config files
