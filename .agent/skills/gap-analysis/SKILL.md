---
name: gap-analysis
description: Analyze the repository against VISION.md and PRODUCT_PLAN.md to identify capability gaps, broken features, and missing functionality.
---

# Skill: Gap Analysis

## Purpose
Analyze the Pare Engine codebase against its stated vision and product plan to identify capability gaps, broken features, and missing functionality. Use when starting a new development cycle or when the user asks what to build next.

## Inputs

Read these files to understand the target state:
- `VISION.md` — The aspirational vision
- `PRODUCT_PLAN.md` — The complete feature inventory with status columns
- `CLAUDE.md` — Architectural constraints and conventions

Read previous pipeline outputs if they exist:
- Check `pipeline/7-confirm/` for the most recent verification report

If a focus area was provided by the user, narrow the analysis to that area.

## Process

1. **Inventory Current State**: Scan these directories for actual implementation:
   - `packages/core/src/tools/` — Tool functions
   - `apps/audit-runner/src/steps/` — Pipeline steps
   - `apps/web/app/` — Web application pages and API routes
   - `packages/core/src/scoring/` — Scoring functions

   In each directory, count files and search for indicators of incomplete work:
   - `TODO` comments
   - `FIXME` comments
   - Functions containing `stub`, `mock`, or `throw new Error('not implemented')`

2. **Map Against Vision**: For each domain in PRODUCT_PLAN.md, compare the STATUS column against what actually exists in code:
   - **SHIPPED but broken** — Code exists but has critical issues
   - **WIRED but unused** — Tool exists but nothing calls it
   - **PLANNED but blocking revenue** — Missing feature that prevents client delivery
   - **PLANNED but deferrable** — Missing feature that can wait

3. **Identify Latent Gaps**: Things neither VISION.md nor PRODUCT_PLAN.md mention but that are implied by the architecture or market position. Check `improvements/` and `suggestions/` directories for previously identified ideas.

4. **Prioritize**: Rank gaps by revenue impact (what unblocks the next dollar).

## Output

Write to `pipeline/1-gap-analysis/gap-YYYY-MM-DD.md` using the template in `templates/gap-report.md` in this directory.

The output MUST contain:
- Executive summary (3-5 sentences)
- Table: Domain | Feature | Status | Gap Description | Revenue Impact (1-5)
- "Critical Path" section: ordered list of what to fix/build, with estimated hours
- "Research Questions" section: topics that need external research before building
- "Deferred" section: gaps that exist but should not be addressed now, with reasoning

## Rules
- Never propose changes that violate CLAUDE.md immutable constraints
- Scoring weights are always 30/30/15/10/15 — do not question or propose changes
- Focus on gaps that move toward first revenue, not perfection
- Be honest about what is broken vs what is merely unpolished
