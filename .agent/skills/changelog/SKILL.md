---
name: changelog
description: Generate a changelog from git history grouped by category with breaking changes highlighted.
---

# Skill: Changelog

## Purpose
Generate a changelog from the Pare Engine git history. Groups commits by category, highlights breaking changes, and produces a release-ready summary.

## Inputs
If a reference was provided by the user (tag, commit hash, or date), generate changelog since that point.

If no argument, generate changelog since the last tag or last 50 commits.

## Process

1. **Gather Commits**: Get all commits since the reference point using `git log --oneline --no-merges`.

2. **Categorize**: Group by conventional commit prefix:
   - Features (`feat:`), Fixes (`fix:`), Performance (`perf:`), Refactor (`refactor:`), Docs (`docs:`), Tests (`test:`), Chore (`chore:`), Breaking (`BREAKING:` or `!:`)

3. **Summarize**: Write human-readable summaries for each category. Read diffs if commit messages are unclear.

4. **Highlight Breaking Changes**: Put them at the top with migration instructions.

5. **Statistics**: Files changed, lines added/removed, contributors.

## Output
Display changelog inline. Format as markdown with Breaking Changes, Features, Fixes, Other sections, and Stats.

## Rules
- Improve readability beyond raw commit messages
- Do not include merge commits
- Group related commits for one feature
- Breaking changes always get migration instructions
- Keep concise — operators care about impact, not implementation
