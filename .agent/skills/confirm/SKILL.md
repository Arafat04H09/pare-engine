---
name: confirm
description: Semantic verification of a completed build spec with 6-level verification checks.
---

# Skill: Confirm

## Purpose
Perform semantic verification of a completed build spec for Pare Engine. Runs a 6-level verification: build, spec compliance, boundary, convention, vision alignment, and regression checks.

## Inputs

A spec file path should be provided by the user (e.g., `specs/B-hardening/B2.1-scoring-fix.md`).

If no argument was provided, read the most recent build log from `pipeline/6-build/` and verify all specs logged there.

Also read for context:
- `CLAUDE.md` — Architectural constraints and coding conventions
- `VISION.md` — Aspirational principles

## Process

Run a 6-level verification. ALL levels must pass for a PASS verdict.

### Level 1: Build Verification
Run these commands:
```bash
pnpm build
pnpm test
```
- Build must succeed with zero errors
- All tests must pass
- Record any warnings (warnings are not failures)

### Level 2: Spec Compliance
- Read the spec's acceptance criteria
- For each criterion, verify it is satisfied by reading the actual code
- Mark each criterion as PASS or FAIL with evidence (file:line references)

### Level 3: Boundary Verification
- Read the spec's Files OWNED list
- Run `git diff --name-only` to see what was actually modified
- Any file modified that is NOT in the OWNED list is a VIOLATION
- Any file in OWNED that was not touched is a WARNING (may indicate incomplete work)

### Level 4: Convention Compliance
Check all modified files for:
- Named exports only (no `export default` except Next.js pages)
- `async/await` only (no `.then()`)
- No raw `process.env` (must use validated config)
- `generateObject()` + Zod for LLM structured output (no manual JSON parsing)
- `Promise.allSettled()` for multi-provider (no `Promise.all()`)
- Custom errors extend `Error` with `code` property
- Imports from `@pare-engine/core/contracts` (not sibling code)
- Scoring weights match 30/30/15/10/15 (if scoring code was modified)
- HTML/CSS + Puppeteer for PDFs (no React-PDF)
- Sentiment analysis is LLM-based (no keyword matching)

### Level 5: Vision Alignment
- Read `VISION.md`
- Verify the changes align with the **stable** principles:
  - Core thesis: audit → implement → verify loop
  - Three-layer architecture: Tools, Intelligence, Workspace
  - Contract-driven architecture (Zod as source of truth)
  - Model-agnostic cognitive team (Analyst/Strategist/Specialist roles)
  - Platform agnostic (ChatGPT, Perplexity, Gemini — not hardcoded to one)
  - Transparency (scores backed by citations)
  - Aesthetics first (if UI/report changes)
- If the build exposed a vision assumption that doesn't hold, recommend a VISION.md update in the report (don't update it yourself — flag it for the next gap analysis cycle)

### Level 6: Regression Check
- Run `pnpm test` and compare against last known passing count
- Search for new `TODO`, `FIXME`, `HACK` comments that were not in the spec
- Verify no existing functionality was broken (check imports, exports)
- Verify no sensitive data (API keys, credentials) was committed

## Output

Write to `pipeline/7-confirm/confirm-YYYY-MM-DD.md` using the template in `templates/verification-report.md` in this directory.

The output MUST contain:
- Overall verdict: PASS or FAIL
- Per-level results with evidence
- Violations list (if any)
- Deviations list (if any)
- Recommendations for follow-up (if any)
- **Feedback for next cycle**: Issues found that should be flagged in the next `/gap-analysis` run. This closes the feedback loop — confirm findings flow back into the pipeline's start.

## Rules
- A single Level 3 (boundary) violation means FAIL — this is non-negotiable
- Convention violations are FAIL unless explicitly justified in the spec
- Vision misalignment is a WARNING, not a FAIL (unless egregious)
- New TODOs must be tracked — add them to specs/index.md if legitimate
- Never auto-fix issues during confirm — only report them
- Be specific: cite file paths and line numbers for every finding
