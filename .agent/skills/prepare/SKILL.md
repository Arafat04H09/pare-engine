---
name: prepare
description: >
  Implementation intelligence — analyze specs and generate build briefs with
  optimal tooling, patterns, and approach for each work unit. Sits between
  decompose and build.
argument-hint: "[spec-path | --wave N | --next]"
allowed-tools: Read, Write, Grep, Glob, Bash(git log *), Bash(git diff *), Bash(ls *), Bash(pnpm *)
context: fork
---

# Prepare — Implementation Intelligence

You are preparing specs for efficient implementation. Your job is to analyze what needs to be built and produce a **build brief** — a tactical implementation guide that makes the build phase faster, more accurate, and less error-prone.

This is the consulting "pre-flight checklist" applied to agent work: you don't just hand someone a spec and say "go." You brief them, equip them, and define their approach.

## Inputs

Determine what to prepare:

**If a spec path was provided:** Prepare that single spec.
**If `--wave N` was provided:** Read `specs/index.md` and prepare all specs in wave N.
**If `--next` was provided:** Find the next unprepared spec(s) that have all dependencies met.
**If no argument:** Read the most recent manifest from `pipeline/5-decompose/` and prepare all specs in the first wave.

For each spec, also read:
- `CLAUDE.md` — Architectural constraints and conventions
- `VISION.md` — Three-layer architecture, cognitive team pattern
- `references/known-mcps.md` (in search-tools skill) — Available MCP servers
- `references/conventions.md` (in build skill) — Coding conventions quick reference
- All contract files referenced in the spec's READ-ONLY section
- All FILES OWNED (if they exist) — to understand current state

## Process

For each spec, run these 5 analyses:

### 1. Classify Work Type

Categorize the spec into one or more work types:

| Type | Indicators | Example Specs |
|------|-----------|---------------|
| **ui** | Files in `apps/web/app/`, `components/`, page routes | B4, C1, C2, C12-C13 |
| **api** | Files in `app/api/`, route handlers, middleware | B5, C3-C4 |
| **backend** | Files in `packages/core/src/tools/`, scoring, analysis | B1.x, B2.x, B3.x |
| **data** | Schema files, migrations, database queries | A3, C5 |
| **integration** | External API calls, MCP wrappers, provider code | B1.1, B1.2, B3.1 |
| **pipeline** | Inngest steps, orchestration, durable workflows | B1.5, B3.x, C8 |
| **template** | HTML/CSS templates, PDF generation, email templates | B6-B7 |
| **config** | Environment config, build config, deployment | A1, A2, C1 |
| **test** | Test files, test utilities, E2E tests | D |

A spec can have multiple types (e.g., `backend + integration` for a tool that calls an external API).

### 2. Select Optimal Toolkit

For each work type, recommend which tools accelerate implementation:

**UI work:**
- Activate: `playwright` MCP (for testing), `context7` (for Next.js/React docs)
- Reference: `apps/web/components/` for existing patterns, shadcn/ui component library
- Pattern: Server Components by default, Client Components only for interactivity
- Check: Does `apps/web/package.json` have the needed dependencies?

**API work:**
- Activate: `context7` (for Next.js App Router API docs)
- Reference: Existing routes in `apps/web/app/api/` for patterns (auth, error handling, response format)
- Pattern: Named export functions (`GET`, `POST`, etc.), Zod validation on request body
- Check: Does the route need auth middleware? Check `apps/web/middleware.ts`

**Backend / Tool work:**
- Activate: `context7` (for AI SDK docs if LLM-involved)
- Reference: Existing tools in `packages/core/src/tools/` for the typed-function pattern
- Pattern: Typed input → typed output, contracts as source of truth
- Scaffold: If tool doesn't exist yet, `/scaffold` can generate stubs from contracts

**Data work:**
- Activate: `drizzle` MCP (for schema management)
- Reference: `packages/core/src/database/schema.ts` for table patterns
- Pattern: UUID PKs, createdAt/updatedAt, jsonb for flexible data, cascade deletes
- Check: Will this need a migration? What tables are affected?

**Integration work:**
- Activate: Relevant service MCP (`firecrawl`, `stripe`, `notion`, etc.)
- Reference: `references/known-mcps.md` for available MCPs and their capabilities
- Pattern: `Promise.allSettled()`, error isolation, graceful degradation
- Check: What environment variables are needed? Are they in config.contract.ts?

**Pipeline work:**
- Activate: `context7` (for Inngest docs)
- Reference: `apps/audit-runner/src/pipeline.ts` for step pattern
- Pattern: Durable steps, retry policy, step.run() for each unit of work
- Check: Does this step need new Inngest events? Update event types.

**Template work:**
- Activate: `playwright` MCP (for visual testing)
- Reference: `packages/core/src/report-templates/` for existing HTML/CSS patterns
- Pattern: HTML/CSS → Puppeteer `page.pdf()`, inline SVG for charts
- Check: Brand colors (#1B2A4A, #00D4AA), print-friendly CSS

**Test work:**
- Activate: `context7` (for Vitest docs)
- Reference: Existing tests for patterns, `packages/core/src/tools/*.test.ts`
- Pattern: Vitest, describe/it blocks, edge cases (0, max, missing data, error paths)
- Check: What's the current test count? (`pnpm test` to baseline)

### 3. Route to Cognitive Team

Map the spec to the optimal cognitive team role from VISION.md:

| Spec Characteristic | Primary Role | Why |
|-------------------|-------------|-----|
| Large codebase comprehension needed | **Analyst** (Gemini) | 1M+ context for understanding existing code |
| Reasoning-heavy design decisions | **Strategist** (Claude) | Strong judgment, architectural decisions |
| Repetitive structured extraction | **Specialist** (Haiku) | Fast, cheap, accurate for grunt work |
| Standard implementation from spec | **Strategist** (Claude) | Default for most build work |
| Complex refactor across many files | **Analyst** (Gemini) → **Strategist** (Claude) | Analyst comprehends scope, Strategist executes |

For most specs, the Strategist (Claude) is the builder. Note when the Analyst should pre-process context (e.g., "read all 20 existing tool files to understand patterns before implementing this one").

### 4. Identify Patterns and Pitfalls

For each spec, search the codebase for:

**Patterns to follow:**
- Find 1-3 existing files that are the closest analog to what this spec creates
- Extract the specific pattern (imports, function signature, error handling, exports)
- Include file paths and line numbers as references

**Pitfalls to avoid:**
- Check `CLAUDE.md` for relevant constraints
- Check known issues from previous builds (stub tests, force-dynamic, default exports)
- Check if the spec touches files that other specs also need (boundary risk)
- Check if dependencies are actually installed (`pnpm ls <package>`)

**Pre-flight checks:**
- Do all FILES OWNED parent directories exist?
- Are all READ-ONLY contract files importable?
- Does `pnpm build` currently pass? (If not, the spec starts from a broken state)
- Are there uncommitted changes that might conflict?

### 5. Generate Build Brief

Synthesize everything into a build brief document.

## Output

Write build briefs to `pipeline/5.5-prepare/brief-{spec-id}-YYYY-MM-DD.md` using the template at [templates/build-brief.md](templates/build-brief.md).

If preparing a wave, also write a wave summary to `pipeline/5.5-prepare/wave-{N}-YYYY-MM-DD.md` containing:
- Total specs in wave
- Work type distribution (how many UI, backend, etc.)
- Shared dependencies across specs (contracts, packages)
- Recommended execution order within the wave
- Total estimated preparation savings (time the build phase will save)

## Refining Vision & Product Plan

VISION.md and PRODUCT_PLAN.md are **living documents**. If preparation reveals issues:

- If a spec requires tools or APIs that don't exist or are infeasible, flag it and update PRODUCT_PLAN.md
- If preparation reveals that the cognitive team routing doesn't work as described, update VISION.md's Layer 2 section
- If a spec's approach conflicts with architectural principles, flag for resolution before build

Add `<!-- Updated by prepare — YYYY-MM-DD -->` to any changed sections.

## Rules
- **Never modify spec files.** Prepare is read-only on specs — it produces briefs alongside them, not changes to them.
- **Never implement code.** Prepare analyzes and recommends. Build implements.
- If a spec is infeasible (missing dependencies, impossible constraints), flag it as BLOCKED in the brief with the specific reason. Do not attempt workarounds.
- If a spec has unresolved file ownership conflicts with other specs, flag as CONFLICT.
- Preparation should take 5-15 minutes per spec. If analysis is taking longer, the spec may need to be re-decomposed.
- Always run `pnpm build` as a pre-flight check. If the build is broken, report it — don't try to fix it.
- The build brief is for the BUILD agent. Write it as clear instructions, not analysis for humans.
- Include concrete code snippets in the "Pattern to Follow" section — the builder should be able to copy the pattern.
