---
name: decompose
description: Break a build strategy into atomic, parallelizable spec files with strict file ownership.
---

# Skill: Decompose

## Purpose
Break a build strategy into atomic, parallelizable spec files that can be executed by individual agents. Each spec is a self-contained work unit with strict file ownership boundaries.

## Inputs

Read the most recent synthesis and tool search outputs:
- Most recent file in `pipeline/3-synthesis/` — strategy with build order
- Most recent file in `pipeline/4-search-tools/` — tool recommendations (if exists)

Also read for context:
- `CLAUDE.md` — Architectural constraints and conventions
- `specs/index.md` — Existing spec index (if it exists)
- Scan `packages/core/src/contracts/` for current contract files (to verify file ownership)

If a specific strategy file or focus was provided by the user, use that instead.

## Process

1. **Assign Categories**: Group strategy items into categories:
   - **A**: Critical fixes (blocking build/deploy)
   - **B**: Production hardening (reliability, error handling)
   - **C**: Missing features (revenue-blocking)
   - **D**: Testing and verification
   - **E-Z**: Additional categories as needed

2. **Split into Atomic Specs**: Decompose aggressively for maximum parallelism. Each spec must be:
   - Completable in **10-30 minutes** by a single agent (the observed velocity — a spec is not a "project")
   - Self-contained (all context in the spec file)
   - Verifiable (has acceptance criteria and verification command)
   - If a strategy item has multiple independent files, split it — each file or tight file-group gets its own spec
   - 100+ specs per cycle is expected. Finer granularity = wider waves = more parallelism

3. **Assign File Ownership**: For each spec, define:
   - **Files OWNED**: Files this spec may create or modify (exclusive — no overlap between specs)
   - **Files READ-ONLY**: Files this spec may import from but not modify
   - **Zero overlap rule**: No two specs may own the same file. Check existing specs for conflicts.

4. **Mark Dependencies**: For each spec, identify:
   - Which specs must complete before this one can start
   - Which specs can run in parallel with this one
   - Group into execution waves

5. **Write Spec Files**: Create spec files in `specs/{category}/` using the template in `templates/spec.md` in this directory.

6. **Update Index**: Write or update `specs/index.md` with all specs, their status, dependencies, and wave assignments.

## Output

Write spec files to `specs/{category}/{id}.md`.

Write a manifest to `pipeline/5-decompose/manifest-YYYY-MM-DD.md` containing:
- Total specs created
- Category breakdown
- Dependency graph (mermaid)
- Execution waves (which specs can run in parallel)
- File ownership map (which spec owns which files)
- Estimated total hours

## Refining Vision & Product Plan

VISION.md and PRODUCT_PLAN.md are **living documents**. If decomposition reveals scope issues or architectural conflicts, update them:

- If splitting work reveals that a feature is much larger than estimated, update PRODUCT_PLAN.md to reflect realistic phasing
- If file ownership conflicts expose architectural issues, flag them and update VISION.md's architecture section if needed
- If file ownership conflicts prevent further decomposition, consolidate conflicting specs with reasoning

Add `<!-- Updated by decompose — YYYY-MM-DD -->` to any changed sections.

## Rules
- **Zero file overlap**: No two specs may own the same file. This is the #1 rule.
- Each spec must have a verification command (usually `pnpm build` or `pnpm test`)
- Specs should be ordered so sequential dependencies are in earlier waves
- Never create specs that violate CLAUDE.md constraints
- Contract files (`*.contract.ts`) should be owned by at most one spec per cycle
- Index file must be valid markdown with a parseable table
- Spec IDs follow the pattern: {Category}{Number}.{Sub} (e.g., B2.1, C4)
