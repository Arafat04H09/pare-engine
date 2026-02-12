---
name: synthesize
description: >
  Merge orientation, research findings, and tool evaluations into an updated domain
  model and prioritized build strategy. Updates knowledge/ with synthesis insights.
  Understanding what changed comes before planning what to build.
argument-hint: "[focus-area]"
allowed-tools: Read, Write, Edit, Grep, Glob, Bash(git log *), Bash(git diff *), Bash(ls *)
context: fork
---

# Synthesize — Domain Model Update + Build Strategy

You are synthesizing everything the pipeline has learned in this cycle into two outputs: (1) an updated understanding of the domain, and (2) a build strategy. Understanding comes first — what changed in our knowledge determines what we should build.

**The synthesis failure mode is skipping to the task list.** If you produce a build strategy without first articulating what we LEARNED and how it changes our understanding, you've produced a sophisticated TODO list, not a strategy. Strategy requires understanding what's different now.

## Inputs

Read ALL outputs from earlier pipeline stages:

- Most recent file in `pipeline/1-gap-analysis/` — orientation, epistemic state, hypotheses, gaps
- All files in `pipeline/2-research/` — research findings (may be multiple parallel thread outputs)
- Most recent file in `pipeline/1.5-dispatch/` — dispatch manifest (if exists, shows what was investigated)
- Most recent file in `pipeline/4-search-tools/` — tool evaluations (if exists)

Also read for context:
- `knowledge/` — Current durable knowledge (you'll be updating this)
- `PRODUCT_PLAN.md` — Current feature inventory and status
- `CLAUDE.md` — Architectural constraints (never propose violating these)
- `packages/core/src/contracts/` — Current contract definitions (scan for existing types)

If a focus area was provided, narrow the synthesis to: $ARGUMENTS

## Process

### 1. Collect and Reconcile Research

If multiple research threads ran in parallel:
- Read ALL thread outputs
- Identify agreements (multiple threads confirmed the same thing)
- Identify contradictions (threads found conflicting evidence)
- Identify gaps (things no thread investigated, or all threads labeled "low confidence")
- Reconcile contradictions: which evidence is stronger? Note unresolved disagreements.

### 2. Domain Model Update — What Changed?

This is the most important step. Before planning what to build, articulate what we now understand differently:

**Confirmed beliefs:** What did research confirm that we previously only believed?
- Move these from "believed" to "known" in the epistemic state
- Update relevant `knowledge/` files to higher confidence

**Disconfirmed beliefs:** What did research disprove or complicate?
- This is the highest-value output. What were we wrong about?
- How does this change what we should build?
- Update VISION.md or PRODUCT_PLAN.md if affected

**New knowledge:** What did we learn that we didn't even have a hypothesis about?
- Emergent findings from research that open new possibilities or close off old ones
- Write to `knowledge/` as new entries

**Persistent unknowns:** What do we still not know despite investigation?
- Is this blocking any build decisions? If yes, flag for next cycle.
- If not blocking, accept the uncertainty and note it.

**Shifts in domain classification:**
- Did any area move between Clear/Complicated/Complex based on research?
- Complex areas may need probe-sense-respond (build a small thing, observe, iterate) rather than full analysis.

### 3. Map Research to Gaps

For each gap from the gap analysis, find corresponding research findings:

| Gap | Research Finding | Impact on Approach | Confidence |
|-----|-----------------|-------------------|------------|

Identify gaps where research CHANGED the recommended approach. These are the most strategically important items — the pipeline prevented a wrong build.

### 4. Feasibility Assessment

For each gap + research pair, assess:
- **Technical feasibility** — Do APIs/tools exist? Are there gotchas?
- **Effort estimate** — In specs, not hours (a spec = 10-20 min at observed velocity)
- **Dependencies** — What must exist first?
- **Contract changes needed** — New types, schema modifications
- **Risk level** — What could go wrong? (informed by research)

### 5. Phase into Build Order

Assign each item to a phase:
- **Phase 0**: Contract changes and shared infrastructure (must be sequential)
- **Phase 1**: Independent features (can be parallelized via worktrees)
- **Phase 2**: Features that depend on Phase 1
- **Phase 3**: Integration and polish
- **Phase 4**: Testing and verification

**Cynefin routing:**
- **Clear items** → Phase 1-2 (just build)
- **Complicated items** → Phase 1-3 (analyze then build)
- **Complex items** → Phase 0 as a probe (build small, observe, iterate in next cycle)

### 6. Dependency Graph

Create a mermaid diagram showing which items block others. Identify the critical path (longest dependency chain).

### 7. Budget Check

Total estimated specs must be reasonable for one cycle. If over budget:
- Move lowest-priority items to "Deferred" with reasoning
- Prefer fewer items done well over many items done partially
- Complex items count as 2-3x a standard spec for budgeting

## Output

Write to `pipeline/3-synthesis/strategy-YYYY-MM-DD.md`.

The output MUST contain:

1. **Domain Model Update** (most important section):
   - What we confirmed, disconfirmed, newly learned, and still don't know
   - How this changes our strategic understanding
   - Specific knowledge/ files created or updated

2. **Research-Gap Mapping:**
   | Gap | Research Finding | Approach Change | Confidence |

3. **Strategy Matrix:**
   | Item | Cynefin | Approach | Phase | Specs | Dependencies |

4. **Mermaid Dependency Graph**

5. **Contract Changes Needed** — Specific fields/types to add or modify

6. **Build Order** with parallelization notes

7. **Deferred Items** with reasoning and revisit criteria

8. **Spec Budget** — Total specs estimated vs budget

9. **Vision/Plan Updates** — Specific changes to make to VISION.md or PRODUCT_PLAN.md

## Updating Knowledge

After completing synthesis:
- Write confirmed findings to `knowledge/` with updated confidence levels
- Create new `knowledge/` files for newly discovered domain knowledge
- Add contradiction notes to existing files where research disagreed
- Update `Last verified` dates on knowledge files that were re-confirmed

## Refining Vision & Product Plan

VISION.md and PRODUCT_PLAN.md are **living documents**. If synthesis reveals strategic shifts:

- If the build strategy shows PRODUCT_PLAN.md critical path is wrong, rewrite it
- If feasibility assessment shows features should be re-prioritized, update statuses
- If research revealed the scoring model should change, flag for discussion (don't change weights silently)
- If synthesis reveals architectural patterns that should be captured as principles, add them

Add `<!-- Updated by synthesize — YYYY-MM-DD -->` to any changed sections.

**Stable** (don't change without user discussion): core thesis, three-layer architecture, unified principles, scoring weights.
**Fluid** (update with evidence): critical path, feature priorities, phasing, effort estimates, market positioning.

## Rules
- **Domain model update before build strategy.** Understanding what changed comes before planning what to build.
- **Never skip the "what we were wrong about" section.** If research disconfirmed nothing, either the research was confirmation-biased or there was nothing risky to investigate.
- **Never exceed cycle budget** — defer excess to next cycle
- **Prefer extending existing contracts over creating new ones**
- **Prefer tools in the MCP ecosystem over custom code**
- **Phase 0 items must be sequential; Phase 1+ can be parallelized**
- **Every item must have a clear "done" definition**
- **Complex-domain items get probes, not full implementations.** If we don't know the right approach, build the smallest thing that teaches us, then iterate next cycle.
