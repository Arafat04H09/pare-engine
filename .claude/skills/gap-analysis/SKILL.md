---
name: gap-analysis
description: >
  Analyze the repository against VISION.md and PRODUCT_PLAN.md to identify
  capability gaps, broken features, and missing functionality. Use when starting
  a new development cycle or when the user asks what to build next.
argument-hint: "[focus-area]"
allowed-tools: Read, Grep, Glob, Bash(git status *), Bash(git log *), Bash(git diff *), Bash(ls *), Bash(wc *)
context: fork
agent: Explore
---

# Gap Analysis

You are performing a gap analysis of the Pare Engine codebase against its stated vision.

## Inputs

Read these files to understand the target state:
- `VISION.md` — The aspirational vision
- `PRODUCT_PLAN.md` — The complete feature inventory with status columns
- `CLAUDE.md` — Architectural constraints and conventions

Read previous pipeline outputs if they exist:
- Most recent file in `pipeline/7-confirm/` — Shows what was last verified

If a focus area was provided: narrow the analysis to $ARGUMENTS

## Process

1. **Inventory Current State**: Scan `packages/core/src/tools/`, `apps/audit-runner/src/steps/`, `apps/web/app/`, and `packages/core/src/scoring/`. Count files, identify stubs (grep for TODO, FIXME, stub, mock, throw new Error).

2. **Map Against Vision**: For each domain in PRODUCT_PLAN.md, compare the STATUS column against what actually exists in code:
   - **SHIPPED but broken** — Code exists but has critical issues
   - **WIRED but unused** — Tool exists but nothing calls it
   - **PLANNED but blocking revenue** — Missing feature that prevents client delivery
   - **PLANNED but deferrable** — Missing feature that can wait

3. **Identify Latent Gaps**: Things neither VISION.md nor PRODUCT_PLAN.md mention but that are implied by the architecture or market position. Check `/improvements/` and `/suggestions/` for previously identified ideas.

4. **Prioritize**: Rank gaps by revenue impact (what unblocks the next dollar).

## Output

Write to `pipeline/1-gap-analysis/gap-YYYY-MM-DD.md` using the template at [templates/gap-report.md](templates/gap-report.md).

The output MUST contain:
- Executive summary (3-5 sentences)
- Table: Domain | Feature | Status | Gap Description | Revenue Impact (1-5)
- "Critical Path" section: ordered list of what to fix/build, with estimated hours
- "Research Questions" section: topics that need external research before building
- "Deferred" section: gaps that exist but should not be addressed now, with reasoning

## Rules
- Never propose changes that violate CLAUDE.md immutable constraints
- Score weights are always 30/30/15/10/15 — do not question or propose changes
- Focus on gaps that move toward first revenue, not perfection
- Be honest about what is broken vs what is merely unpolished
