---
name: synthesize
description: Merge gap analysis findings and research into a prioritized build strategy with dependency graph and phased build order.
---

# Skill: Synthesize

## Purpose
Merge gap analysis and research findings into a prioritized, phased build strategy. Maps research insights to gaps, assesses feasibility, and creates a dependency-aware build order.

## Inputs

Read the most recent outputs from earlier pipeline stages:
- Most recent file in `pipeline/1-gap-analysis/` — gap inventory + critical path
- Most recent file in `pipeline/2-research/` — research findings + actionable data

Also read for context:
- `PRODUCT_PLAN.md` — Current feature inventory and status
- `CLAUDE.md` — Architectural constraints (never propose violating these)
- Scan `packages/core/src/contracts/` for existing contract definitions

If a focus area was provided by the user, narrow the synthesis to that area.

## Process

1. **Map Research to Gaps**: For each gap in the gap analysis, find the corresponding research finding. Identify gaps where research changed the recommended approach.

2. **Feasibility Assessment**: For each gap + research pair, assess:
   - Technical feasibility (do APIs/tools exist?)
   - Effort estimate (hours, not days)
   - Dependencies (what must exist first?)
   - Contract changes needed (new types, schema modifications)

3. **Phase into Build Order**: Assign each item to a phase:
   - **Phase 0**: Contract changes and shared infrastructure (must be sequential)
   - **Phase 1**: Independent features (can be parallelized)
   - **Phase 2**: Features that depend on Phase 1
   - **Phase 3**: Integration and polish
   - **Phase 4**: Testing and verification

4. **Dependency Graph**: Create a mermaid diagram showing which items block others. Identify the critical path (longest chain).

5. **Budget Check**: Total estimated hours must not exceed 40 hours per cycle. If over budget, move lowest-priority items to "Deferred" with reasoning.

## Output

Write to `pipeline/3-synthesis/strategy-YYYY-MM-DD.md` using the template in `templates/strategy.md` in this directory.

The output MUST contain:
- Executive summary (3-5 sentences)
- Strategy matrix: Gap | Research Finding | Approach | Phase | Hours | Dependencies
- Mermaid dependency graph
- Contract changes needed (specific fields/types to add)
- Build order with parallelization notes
- Deferred items with reasoning
- Total hour budget vs estimate

## Rules
- Never propose changes that violate CLAUDE.md immutable constraints
- Never exceed 40 hours per cycle — defer excess to next cycle
- Prefer extending existing contracts over creating new ones
- Prefer tools that already exist in the MCP ecosystem over custom code
- Phase 0 items must be sequential; Phase 1+ can be parallelized
- Every item must have a clear "done" definition
