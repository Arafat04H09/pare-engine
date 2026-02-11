---
name: changelog
description: >
  Generate a changelog from git history. Groups commits by category,
  highlights breaking changes, and produces a release-ready summary.
argument-hint: "[since-ref (tag, commit, or date)]"
allowed-tools: Read, Grep, Glob, Bash(git log *), Bash(git diff *), Bash(git tag *)
context: fork
---

# Changelog

You are generating a changelog from the Pare Engine git history.

## Inputs

If a reference was provided (tag, commit hash, or date), generate changelog since that point: $ARGUMENTS

If no argument, generate changelog since the last tag or last 50 commits.

## Process

1. **Gather Commits**: Get all commits since the reference point:
   ```bash
   git log --oneline --no-merges {ref}..HEAD
   ```

2. **Categorize**: Group commits by type based on conventional commit prefixes:
   - **Features** (`feat:`) — New functionality
   - **Fixes** (`fix:`) — Bug fixes
   - **Performance** (`perf:`) — Performance improvements
   - **Refactor** (`refactor:`) — Code restructuring
   - **Docs** (`docs:`) — Documentation changes
   - **Tests** (`test:`) — Test additions/changes
   - **Chore** (`chore:`) — Build/tooling changes
   - **Breaking** (any commit with `BREAKING:` or `!:`) — Breaking changes

3. **Summarize Changes**: For each category, write human-readable summaries:
   - What changed (not just the commit message — read the diff if unclear)
   - What it means for users/operators
   - Any migration steps needed

4. **Highlight Breaking Changes**: If any commits contain breaking changes, put them at the top with migration instructions.

5. **Statistics**: Include:
   - Files changed count
   - Lines added/removed
   - Contributors

## Output

Display the changelog inline and optionally write to `CHANGELOG.md` if the user confirms.

Format:
```markdown
# Changelog — [date]

## Breaking Changes
- ...

## Features
- ...

## Fixes
- ...

## Other
- ...

### Stats
- X commits, Y files changed, +Z/-W lines
```

## Rules
- Use commit messages as starting point but improve readability
- Do not include merge commits or empty commits
- Group related commits (e.g., multiple commits for one feature)
- Breaking changes always get migration instructions
- Keep it concise — operators care about impact, not implementation details
