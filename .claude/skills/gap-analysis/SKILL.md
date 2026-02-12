---
name: gap-analysis
description: >
  Orient in the domain, then scan the codebase. Understanding-first gap analysis
  that assesses epistemic state, classifies complexity, identifies hypotheses to
  test, and produces both domain gaps and code gaps.
argument-hint: "[focus-area]"
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
context: fork
---

# Gap Analysis — Orientation First

You are orienting in the GEO domain AND scanning the Pare Engine codebase. Orientation comes first — understand what's true about the world before cataloging what's missing in the code.

**The pipeline's #1 failure mode is building before understanding.** This skill exists to prevent that. 80% of its value is domain orientation. 20% is code scanning.

## Inputs

Read these in order (order matters — domain understanding before code):

**Domain context (read first):**
- `knowledge/` — All durable knowledge files. This is what we know across cycles.
- `VISION.md` — The aspirational vision and market thesis
- `PRODUCT_PLAN.md` — Feature inventory with status columns
- `improvements/` — Previously identified strategic ideas

**Pipeline feedback (if exists):**
- Most recent file in `pipeline/7-confirm/` — "Feedback for next cycle" section
- `pipeline/6-build/` build logs — deviations and issues encountered

**Architecture constraints:**
- `CLAUDE.md` — Immutable constraints and conventions

If a focus area was provided: narrow the analysis to $ARGUMENTS

## Process

### 0. Pipeline Cleanup (Start of Every Cycle)

Before doing any analysis, clean up artifacts from previous cycles. Gap analysis is always the start of a new cycle, so this is where rotation happens.

**Steps:**

1. **Read feedback first**: Before archiving, read `pipeline/7-confirm/` and `pipeline/6-build/` for feedback from the last cycle.

2. **Archive previous cycle**: If any files exist in `pipeline/1-gap-analysis/` through `pipeline/7-confirm/` (excluding `pipeline/archive/`), move them all into `pipeline/archive/YYYY-MM-DD/`:
   ```bash
   mkdir -p pipeline/archive/$(date +%Y-%m-%d)
   for dir in 1-gap-analysis 1.5-dispatch 2-research 3-synthesis 4-search-tools 5-decompose 5.5-prepare 6-build 7-confirm; do
     if [ -d "pipeline/$dir" ] && [ "$(ls -A pipeline/$dir 2>/dev/null)" ]; then
       mkdir -p "pipeline/archive/$(date +%Y-%m-%d)/$dir"
       mv pipeline/$dir/* "pipeline/archive/$(date +%Y-%m-%d)/$dir/"
     fi
   done
   ```

3. **Prune old archives**: Keep only the 2 most recent archive directories. Delete the rest:
   ```bash
   cd pipeline/archive && ls -d */ 2>/dev/null | head -n -2 | xargs rm -rf
   ```

4. **Verify clean state**: Working directories should now be empty and ready for the new cycle.

**Skip cleanup if**: This is the first-ever cycle (no `pipeline/archive/` exists yet) or the working directories are already empty.

After cleanup, proceed with orientation:

### 1. Epistemic State Assessment

Before scanning code, assess what we know and don't know about the domain:

**What we KNOW (high confidence):**
- Facts verified across multiple sources or direct testing
- Pull from `knowledge/` files with `Confidence: high`
- Pull from CLAUDE.md settled decisions

**What we BELIEVE (medium confidence):**
- Assumptions embedded in VISION.md or PRODUCT_PLAN.md
- Single-source claims from previous research
- Pull from `knowledge/` files with `Confidence: medium`

**What we DON'T KNOW (low confidence or gaps):**
- Questions from previous confirm feedback that weren't answered
- `knowledge/` files with `Confidence: low` or `Last verified` >90 days ago
- Domains where we have no knowledge files at all
- Assumptions that haven't been tested against reality

**What we might be WRONG about:**
- Where has the market/domain/technology moved since last cycle?
- Are there beliefs in VISION.md that new evidence contradicts?
- Are there assumptions in the scoring model that don't match GEO research?

### 2. Domain Complexity Classification

For each major domain area (audit pipeline, scoring, intelligence layer, prospecting, delivery), classify using Cynefin:

| Domain | Clear | Complicated | Complex |
|--------|-------|-------------|---------|
| **Clear** | Known solution, just wire it up | — | — |
| **Complicated** | — | Analyzable, needs expert knowledge | — |
| **Complex** | — | — | No known solution, need to probe-sense-respond |

**Routing implications:**
- **Clear** → Skip research, go straight to build (e.g., "add a button")
- **Complicated** → Research specific technical questions, then build (e.g., "integrate Foursquare API")
- **Complex** → Hypothesis-driven research, possible multiple cycles (e.g., "what scoring weights maximize client value?")

### 3. Codebase Reality Check

NOW scan the code. Compare what exists against what VISION.md and PRODUCT_PLAN.md claim:

- Scan `packages/core/src/tools/`, `apps/audit-runner/src/steps/`, `apps/web/app/`, `packages/core/src/scoring/`
- Count files, identify stubs (grep for TODO, FIXME, stub, mock, throw new Error)
- Compare PRODUCT_PLAN.md STATUS column against what actually exists:
  - **SHIPPED but broken** — Code exists but has critical issues
  - **WIRED but unused** — Tool exists but nothing calls it
  - **PLANNED but blocking revenue** — Missing feature that prevents client delivery
  - **PLANNED but deferrable** — Missing feature that can wait

### 4. Hypothesis Generation

For each gap (domain or code), generate a testable hypothesis:

> "We believe [X] because [evidence]. This could be wrong if [conditions]. To verify, we need to [research action]."

Hypotheses should prioritize **disconfirmation** — what evidence would prove this wrong? This is more valuable than confirmation.

### 5. Research Question Framing

For each hypothesis that needs investigation, frame a specific research question:

- **What specifically do we need to learn?** (not "research Foursquare" but "does Foursquare's free tier return review data for businesses, and at what rate limit?")
- **What would change our decision?** (if the answer is X we build it, if Y we don't)
- **What domain does this belong to?** (GEO/market, technical/API, competitive, scoring)
- **Estimated investigation depth:** small (5 min web search), medium (15 min multi-source), large (30+ min deep dive)

### 6. Prioritize

Rank ALL gaps (domain understanding + code) by:
1. **Revenue impact** — What unblocks the next dollar?
2. **Uncertainty reduction** — What resolves the most unknowns?
3. **Compounding value** — What knowledge makes future cycles faster?

## Output

Write to `pipeline/1-gap-analysis/gap-YYYY-MM-DD.md`.

The output MUST contain:

1. **Epistemic State Summary** — What we know / believe / don't know / might be wrong about (1-2 paragraphs per category)

2. **Domain Classification Table** — Each area classified as Clear/Complicated/Complex with routing

3. **Gap Inventory Table:**
   | # | Type | Domain | Description | Cynefin | Revenue Impact (1-5) | Hypothesis |
   (Type = `domain` for understanding gaps, `code` for implementation gaps)

4. **Hypotheses to Test** — Numbered list of testable hypotheses with disconfirmation criteria

5. **Research Questions** — Specific, decision-relevant questions grouped by domain, with estimated depth

6. **Code Gaps** — Table: Feature | Status | Gap Description | Estimated effort

7. **Knowledge Updates** — Any existing `knowledge/` files that need updating, and why

8. **Deferred** — Gaps that exist but should not be addressed now, with reasoning

## Updating Knowledge

After completing the analysis:
- Update any `knowledge/` files where the gap analysis revealed new information
- Add `last verified: YYYY-MM-DD` to knowledge files you confirmed are still accurate
- Flag stale knowledge files (>90 days) in the output

## Refining Vision & Product Plan

VISION.md and PRODUCT_PLAN.md are **living documents**. If orientation reveals assumptions are wrong:

- If a feature marked PLANNED is no longer relevant, update its status with reasoning
- If you discover gaps the vision doesn't mention, add them with `<!-- Updated by gap-analysis — YYYY-MM-DD -->`
- If scoring profiles, beachhead market, or revenue assumptions don't match reality, update VISION.md
- If PRODUCT_PLAN.md statuses are wrong (e.g., SHIPPED but actually broken), correct them

**Stable** (don't change without user discussion): core thesis, three-layer architecture, unified principles.
**Fluid** (update with evidence): market targets, pricing, feature priorities, tool inventory, competitive positioning.

## Rules
- **Orientation before code scanning.** Read knowledge/ and assess the domain BEFORE grepping the codebase.
- Never propose changes that violate CLAUDE.md immutable constraints
- Focus on gaps that move toward first revenue, not perfection
- Be honest about what is broken vs what is merely unpolished
- Distinguish domain gaps (understanding) from code gaps (implementation) — they have different solutions
- Every research question must have a decision it would change — no curiosity-driven research
