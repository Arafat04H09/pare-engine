---
name: hotfix
description: Quick single-file fix that skips the full 7-stage pipeline. For bugs, typos, and small patches.
---

# Skill: Hotfix

## Purpose
Perform a quick, targeted fix on the Pare Engine codebase without going through the full development pipeline. For bugs, typos, broken imports, and small patches touching 1-3 files max.

## When to Use
- Fixing a single bug or typo
- Correcting a broken import or missing export
- Patching a runtime error discovered in testing
- Small adjustments that touch 1-3 files max

Do NOT use for: new features, refactors, or changes spanning >3 files. Use the full pipeline for those.

## Inputs
The user provides either a file path with a description of the issue, or a bug description/error message.

Also read `CLAUDE.md` for coding conventions (must still follow all rules).

## Process

1. **Identify the Problem**: If a file path was given, read it. If an error was given, search the codebase to find the source.

2. **Understand Context**: Read the file(s) involved and any contracts they import from.

3. **Fix**: Make the minimal change needed to resolve the issue.
   - Follow all coding conventions
   - Do not refactor surrounding code
   - Do not add features beyond the fix

4. **Verify**: Run `pnpm build && pnpm test`

5. **Report**: Summarize what was wrong and what was changed.

## Rules
- Maximum 3 files modified. If more are needed, use the decompose skill instead.
- Follow all CLAUDE.md coding conventions even for small fixes.
- Do not introduce new dependencies without asking.
- If the fix reveals a deeper problem, document it but don't fix it.
- Never modify contract files for a hotfix.
