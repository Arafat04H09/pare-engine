---
name: review
description: >
  Lightweight pre-commit convention check. Scans modified files for violations
  of Pare coding standards. Faster than /confirm — use before committing.
argument-hint: "[file-path-or-git-diff]"
allowed-tools: Read, Grep, Glob, Bash(git diff *), Bash(git status *), Bash(git log *)
context: fork
---

# Review

You are performing a lightweight code review of recent changes against Pare Engine coding conventions.

## When to Use

Use `/review` before committing to catch convention violations early. This is lighter than `/confirm` — it checks conventions only, not spec compliance or vision alignment.

## Inputs

If a file path or pattern was provided, review only those files: $ARGUMENTS

If no argument, review all unstaged and staged changes:
```bash
git diff --name-only
git diff --cached --name-only
```

Also read for context:
- `CLAUDE.md` — Coding conventions section

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
   | 10 | LLM sentiment | No keyword-based sentiment (if applicable) |
   | 11 | Drizzle ORM | No raw SQL outside migrations |
   | 12 | Type safety | Explicit return types on exported functions |

4. **Check Import Hygiene**:
   - No circular imports
   - No unused imports
   - No imports from deleted scaffold packages (`packages/query-engine`, etc.)

5. **Check for Common Mistakes**:
   - `console.log` left in production code (warn)
   - Hardcoded API keys or secrets
   - Missing error handling on async calls
   - `any` type usage (warn)

6. **Report**: Output a summary with:
   - PASS (no violations) or WARN (has issues)
   - Per-file findings with line numbers
   - Suggested fixes for each violation

## Rules
- This is READ-ONLY — never modify files during review
- Warnings are advisory, violations are blockers
- Be specific: cite file:line for every finding
- Don't nitpick style — focus on convention violations that matter
- If a file is in `.claude/skills/` or `.agent/skills/`, skip convention checks (these are markdown)
