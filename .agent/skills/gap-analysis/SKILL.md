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

Read previous pipeline outputs if they exist (feedback loop from last cycle):
- Check `pipeline/7-confirm/` for the most recent verification report — look for the "Feedback for next cycle" section
- Check `pipeline/6-build/` for build logs — look for deviations and issues encountered
- Check `specs/*/STATUS.md` for completed/blocked specs from the last cycle

If a focus area was provided by the user, narrow the analysis to that area.

## Process

### 0. Pipeline Cleanup (Start of Every Cycle)

Before doing any analysis, clean up artifacts from previous cycles. Gap analysis is always the start of a new cycle, so this is where rotation happens.

**Steps:**

1. **Read feedback first**: Before archiving, read `pipeline/7-confirm/` and `pipeline/6-build/` for feedback from the last cycle (you'll need this for Step 1 below).

2. **Archive previous cycle**: If any files exist in `pipeline/1-gap-analysis/` through `pipeline/7-confirm/` (excluding `pipeline/archive/`), move them all into `pipeline/archive/YYYY-MM-DD/`:
   ```bash
   # Create archive directory for today
   mkdir -p pipeline/archive/$(date +%Y-%m-%d)

   # Move all working artifacts into archive
   for dir in 1-gap-analysis 2-research 3-synthesis 4-search-tools 5-decompose 5.5-prepare 6-build 7-confirm; do
     if [ -d "pipeline/$dir" ] && [ "$(ls -A pipeline/$dir 2>/dev/null)" ]; then
       mkdir -p "pipeline/archive/$(date +%Y-%m-%d)/$dir"
       mv pipeline/$dir/* "pipeline/archive/$(date +%Y-%m-%d)/$dir/"
     fi
   done
   ```

3. **Prune old archives**: Keep only the 2 most recent archive directories. Delete the rest:
   ```bash
   # List archives oldest-first, delete all but the 2 newest
   cd pipeline/archive && ls -d */ 2>/dev/null | head -n -2 | xargs rm -rf
   ```

4. **Verify clean state**: Working directories should now be empty and ready for the new cycle.

**Skip cleanup if**: This is the first-ever cycle (no `pipeline/archive/` exists yet) or the working directories are already empty.

After cleanup, proceed with the gap analysis:

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

## Refining Vision & Product Plan

VISION.md and PRODUCT_PLAN.md are **living documents**. If gap analysis reveals assumptions are wrong, priorities have shifted, or features are miscategorized, update them:

- If a feature marked PLANNED is no longer relevant, update its status with reasoning
- If you discover gaps the vision doesn't mention, add them with `<!-- Updated by gap-analysis — YYYY-MM-DD -->`
- If scoring profiles, beachhead market, or revenue assumptions don't match codebase reality, update VISION.md
- If PRODUCT_PLAN.md statuses are wrong (e.g., SHIPPED but actually broken), correct them

**Stable** (don't change without user discussion): core thesis, three-layer architecture, unified principles.
**Fluid** (update with evidence): market targets, pricing, feature priorities, tool inventory, competitive positioning.

## Rules
- Never propose changes that violate CLAUDE.md immutable constraints
- Focus on gaps that move toward first revenue, not perfection
- Be honest about what is broken vs what is merely unpolished
