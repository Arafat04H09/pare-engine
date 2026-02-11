---
name: hotfix
description: >
  Quick single-file fix that skips the full 7-stage pipeline. For bugs,
  typos, and small patches that don't need gap analysis or decomposition.
argument-hint: "[file-path-or-description]"
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Hotfix

You are performing a quick, targeted fix on the Pare Engine codebase.

## When to Use

Use `/hotfix` instead of the full pipeline when:
- Fixing a single bug or typo
- Correcting a broken import or missing export
- Patching a runtime error discovered in testing
- Small adjustments that touch 1-3 files max

Do NOT use for: new features, refactors, or changes spanning >3 files. Use the full pipeline for those.

## Inputs

The user provides either:
- A file path with a description of the issue: $ARGUMENTS
- A bug description or error message

Also read for context:
- `CLAUDE.md` — Coding conventions (must still follow all rules)

## Process

1. **Identify the Problem**: If a file path was given, read it. If an error was given, search the codebase to find the source.

2. **Understand Context**: Read the file(s) involved and any contracts they import from. Understand the data flow.

3. **Fix**: Make the minimal change needed to resolve the issue.
   - Follow all coding conventions (named exports, async/await, Zod, etc.)
   - Do not refactor surrounding code
   - Do not add features beyond the fix

4. **Verify**: Run the verification command:
   ```bash
   pnpm build && pnpm test
   ```

5. **Report**: Summarize what was wrong and what was changed.

## Rules
- Maximum 3 files modified. If more are needed, use `/decompose` instead.
- Follow all CLAUDE.md coding conventions even for small fixes.
- Do not introduce new dependencies without asking.
- If the fix reveals a deeper problem, document it but don't fix it — flag it for the full pipeline.
- Never modify contract files for a hotfix. If a contract change is needed, it's not a hotfix.
