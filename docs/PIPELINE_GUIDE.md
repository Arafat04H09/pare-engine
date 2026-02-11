# Pare Engine — Development Pipeline Guide

> The definitive reference for how the development pipeline works. Read this before your first development cycle.

## Overview

The Pare Engine development pipeline is an 8-stage iterative cycle that takes you from "what should we build?" to "is it built correctly?" Each stage is a skill (`/command`) that reads the previous stage's output and produces artifacts for the next.

The pipeline mirrors Pare's own consulting thesis — **audit, implement, verify** — applied to its own development. The pipeline IS the product, used on itself.

```
┌─────────────────────────────────────────────────────────────────┐
│                    THE DEVELOPMENT CYCLE                        │
│                                                                 │
│  ┌──────────────┐                                               │
│  │ /gap-analysis │ ─── "What's missing?"                        │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌────────────┐    ┌───────────────┐                            │
│  │ /research   │    │ /search-tools  │  ◄── Run in parallel     │
│  └──────┬─────┘    └──────┬────────┘                            │
│         │                 │                                     │
│         └────────┬────────┘                                     │
│                  ▼                                              │
│         ┌──────────────┐                                        │
│         │ /synthesize   │ ─── "What's the plan?"                │
│         └──────┬───────┘                                        │
│                ▼                                                │
│         ┌──────────────┐                                        │
│         │ /decompose    │ ─── "What are the work units?"        │
│         └──────┬───────┘                                        │
│                ▼                                                │
│         ┌──────────────┐                                        │
│         │ /prepare      │ ─── "How should we build each one?"   │
│         └──────┬───────┘                                        │
│                ▼                                                │
│         ┌──────────────┐                                        │
│         │ /build        │ ─── "Build it." (per spec, parallel)  │
│         └──────┬───────┘                                        │
│                ▼                                                │
│         ┌──────────────┐                                        │
│         │ /confirm      │ ─── "Is it correct?"                  │
│         └──────┬───────┘                                        │
│                │                                                │
│                └──────────────────── feedback ──► next cycle    │
└─────────────────────────────────────────────────────────────────┘
```

## The 8 Stages

### Stage 1: Gap Analysis (`/gap-analysis`)

**Question answered:** "Where are we vs where we want to be?"

**What it does:**
- Scans the codebase against VISION.md and PRODUCT_PLAN.md
- Identifies broken features, missing capabilities, stale code
- Reads feedback from the previous cycle's `/confirm` reports
- Prioritizes gaps by revenue impact (what unblocks the next dollar)

**Input:** VISION.md, PRODUCT_PLAN.md, codebase, previous confirm reports
**Output:** `pipeline/1-gap-analysis/gap-YYYY-MM-DD.md`
**Duration:** 30-60 minutes

**When to run:**
- Start of every development cycle
- After major vision changes
- When you're unsure what to build next

**Example:**
```
/gap-analysis
/gap-analysis scoring          # Focus on scoring system only
/gap-analysis workspace        # Focus on workspace/UI only
```

---

### Stage 2: Research (`/research`)

**Question answered:** "What do we need to know before building?"

**What it does:**
- Takes research questions from the gap analysis
- Conducts web searches for APIs, pricing, competitors, best practices
- Cross-references multiple sources, flags single-source claims
- Extracts actionable data: endpoints, schemas, pricing tables

**Input:** `pipeline/1-gap-analysis/` research questions
**Output:** `pipeline/2-research/research-YYYY-MM-DD.md`
**Duration:** 60-120 minutes

**Can run in parallel with:** `/search-tools` (both feed into `/synthesize`)

**When to run:**
- When gap analysis identifies unknowns
- When exploring a new technology or API
- When competitive landscape may have changed

**Example:**
```
/research
/research "Vercel AI SDK v6 gateway routing"     # Specific topic
/research "competitor GEO tools 2026"             # Market research
```

---

### Stage 3: Synthesize (`/synthesize`)

**Question answered:** "What's the optimal build plan?"

**What it does:**
- Maps research findings to identified gaps
- Assesses feasibility and estimates effort (hours, not days)
- Phases work into build order (Phase 0-4)
- Creates dependency graph (mermaid diagram)
- Enforces 40-hour budget cap per cycle

**Input:** `pipeline/1-gap-analysis/`, `pipeline/2-research/`, `pipeline/4-search-tools/` (if available)
**Output:** `pipeline/3-synthesis/strategy-YYYY-MM-DD.md`
**Duration:** 60-90 minutes

**When to run:**
- After gap analysis and research are complete
- When you need to re-prioritize mid-cycle

**Example:**
```
/synthesize
/synthesize scoring              # Focus area
```

---

### Stage 4: Search Tools (`/search-tools`)

**Question answered:** "Can we buy instead of build?"

**What it does:**
- Extracts capability needs from the synthesis strategy
- Searches MCP registries (smithery.ai, mcp.so, glama.ai)
- Searches npm for TypeScript packages with Zod compatibility
- Evaluates: fit, maturity, cost, lock-in risk
- Verdict: USE (adopt) / BUILD (custom) / DEFER (later)

**Input:** `pipeline/3-synthesis/` (or can run from gap analysis directly)
**Output:** `pipeline/4-search-tools/tools-YYYY-MM-DD.md`
**Duration:** 45-90 minutes

**Can run in parallel with:** `/research`

**When to run:**
- When the strategy identifies capabilities that might exist as tools
- When evaluating whether to adopt a new MCP server
- Periodically to check if the MCP ecosystem has new offerings

**Example:**
```
/search-tools
/search-tools "PDF generation"         # Specific capability
/search-tools "social media monitoring" # New capability
```

---

### Stage 5: Decompose (`/decompose`)

**Question answered:** "How do we divide the work?"

**What it does:**
- Breaks the strategy into atomic specs (2-8 hours each)
- Assigns file ownership (zero overlap between specs)
- Marks dependencies and groups into execution waves
- Writes spec files to `specs/{category}/`
- Updates `specs/index.md`

**Input:** `pipeline/3-synthesis/`, `pipeline/4-search-tools/`
**Output:** `specs/`, `pipeline/5-decompose/manifest-YYYY-MM-DD.md`
**Duration:** 90-120 minutes

**When to run:**
- After synthesis is complete
- When you need to re-decompose a strategy item that was too large

**Example:**
```
/decompose
/decompose scoring              # Focus on scoring specs only
```

---

### Stage 6: Prepare (`/prepare`)

**Question answered:** "What's the fastest path to implementing each spec?"

**What it does:**
- Classifies each spec by work type (UI, API, backend, data, integration, etc.)
- Selects optimal MCP servers and tools for each type
- Routes to the right cognitive team role (Analyst/Strategist/Specialist)
- Finds existing code patterns to follow (with file:line references)
- Identifies pitfalls and known issues
- Runs pre-flight checks (build passes, dirs exist, deps installed)
- Generates a build brief document per spec

**Input:** Specs, contracts, codebase
**Output:** `pipeline/5.5-prepare/brief-{spec-id}-YYYY-MM-DD.md`, wave summaries
**Duration:** 5-15 minutes per spec

**This stage is optional but highly recommended.** It makes `/build` significantly faster by frontloading the analysis work.

**When to run:**
- Before starting a build wave
- When a spec seems complex and you want clarity before implementing
- When onboarding a new agent to build a spec

**Example:**
```
/prepare specs/B-hardening/B2.1-my-spec.md               # Single spec
/prepare --wave 1                                         # All specs in wave 1
/prepare --next                                           # Next ready specs
```

---

### Stage 7: Build (`/build`)

**Question answered:** "Is it implemented?"

**What it does:**
- Reads a spec and its build brief (if available)
- Implements code in OWNED files only
- Follows coding conventions and contract types
- Self-tests with `pnpm build && pnpm test`
- Verifies file ownership boundaries with `git diff --name-only`
- Logs the result
- **Batch mode:** Resolves a build queue, executes specs in dependency order, stops on failure

**Input:** Spec file (or folder, wave, queue selector), build brief, contracts, conventions
**Output:** Code changes, `pipeline/6-build/build-log-YYYY-MM-DD.md`, `pipeline/6-build/batch-YYYY-MM-DD.md` (batch mode)
**Duration:** 2-8 hours per spec

**Supports batch execution** — build an entire category folder, wave, or all ready specs in one command. Specs execute sequentially in dependency order. Batch stops on first failure to prevent cascading issues.

**When to run:**
- After decompose (and ideally prepare)
- Can be invoked directly with a spec path, skipping earlier stages
- Use batch modes when specs are already decomposed and ready

**Example:**
```
/build specs/B-hardening/B2.1-my-spec.md                 # Single spec
/build specs/B-hardening/                                # All ready specs in B-hardening folder
/build --wave 1                                          # All ready specs in wave 1
/build --next                                            # Next ready spec (default)
/build --next 5                                          # Next 5 ready specs
/build --all                                             # All ready specs in dependency order
/build                                                   # Same as --next
```

---

### Stage 8: Confirm (`/confirm`)

**Question answered:** "Is it correct?"

**What it does:**
- Runs 6-level verification:
  1. **Build** — `pnpm build && pnpm test` pass
  2. **Spec Compliance** — Every acceptance criterion verified with evidence
  3. **Boundary** — Only OWNED files modified (violation = instant FAIL)
  4. **Convention** — All coding rules followed
  5. **Vision Alignment** — Changes align with VISION.md principles
  6. **Regression** — No new TODOs, no broken imports, no secrets committed
- Produces feedback for the next gap analysis cycle

**Input:** Spec, build log, codebase, VISION.md
**Output:** `pipeline/7-confirm/confirm-YYYY-MM-DD.md`
**Duration:** 30-60 minutes

**When to run:**
- After every `/build` completion
- Before committing work to main

**Example:**
```
/confirm specs/B-hardening/B2.1-my-spec.md              # Specific spec
/confirm                                                  # Most recent build
```

---

## Pipeline Shortcuts

Not every task needs the full 8 stages. Here are the common patterns:

### Full Cycle (New Development Sprint)
```
/gap-analysis → /research + /search-tools → /synthesize → /decompose → /prepare → /build → /confirm
```
Use when: Starting a new development cycle. Takes 1-2 days for planning, then build time varies.

### Quick Build (Spec Already Exists)
```
/prepare specs/my-spec.md → /build specs/my-spec.md → /confirm specs/my-spec.md
```
Use when: Specs already exist and you want to implement one. Takes 3-10 hours.

### Batch Build (Wave or Category)
```
/prepare --wave 1 → /build --wave 1 → /confirm
```
Use when: Specs are decomposed and you want to build an entire wave or category. Stops on first failure. Takes hours per wave.

### Direct Build (Simple, Clear Spec)
```
/build specs/my-spec.md → /confirm specs/my-spec.md
```
Use when: The spec is simple and you don't need preparation. Takes 2-4 hours.

### Hotfix (Emergency)
```
/hotfix apps/web/lib/auth.ts
```
Use when: Single-file bug fix. Skips the entire pipeline. Takes 15-60 minutes.

### Research Only
```
/gap-analysis → /research
```
Use when: You need to understand the landscape before deciding what to build. Takes 2-4 hours.

### Vision Refinement
```
/vision → /gap-analysis
```
Use when: Strategic direction has changed and you need to realign. Takes 1-2 hours.

---

## Pipeline Artifacts

Every skill produces artifacts in the `pipeline/` directory:

```
pipeline/
├── 1-gap-analysis/         # Current cycle — gap reports
│   └── gap-YYYY-MM-DD.md
├── 2-research/              # Current cycle — research briefs
│   └── research-YYYY-MM-DD.md
├── 3-synthesis/             # Current cycle — build strategies
│   └── strategy-YYYY-MM-DD.md
├── 4-search-tools/          # Current cycle — tool evaluations
│   └── tools-YYYY-MM-DD.md
├── 5-decompose/             # Current cycle — decomposition manifests
│   └── manifest-YYYY-MM-DD.md
├── 5.5-prepare/             # Current cycle — build briefs
│   ├── brief-B2.1-YYYY-MM-DD.md
│   ├── brief-B2.2-YYYY-MM-DD.md
│   └── wave-1-YYYY-MM-DD.md
├── 6-build/                 # Current cycle — build logs
│   └── build-log-YYYY-MM-DD.md
├── 7-confirm/               # Current cycle — verification reports
│   └── confirm-YYYY-MM-DD.md
└── archive/                 # Previous cycles (max 2 kept)
    ├── 2026-02-10/          # Last completed cycle
    │   ├── 1-gap-analysis/
    │   ├── 2-research/
    │   ├── 3-synthesis/
    │   └── ...
    └── 2026-02-08/          # One before that
        └── ...
```

### Artifact Rotation

Pipeline artifacts are **ephemeral working files**, not permanent records. To keep the workspace clean:

- `/gap-analysis` automatically **archives** the previous cycle's artifacts at the start of every new cycle
- Archives go to `pipeline/archive/YYYY-MM-DD/`
- Only the **2 most recent** archives are kept — older ones are deleted
- `/gap-analysis` reads feedback from the last cycle's confirm reports **before** archiving them

This means at any point you have: the current cycle's working files + up to 2 archived cycles for reference. No stale clutter.

Specs are written to `specs/` (persistent, git-tracked — these are NOT archived):

```
specs/
├── index.md                  # Master index of all specs
├── A-critical-fixes/         # Category A specs
├── B-hardening/              # Category B specs
├── C-features/               # Category C specs
└── D-testing/                # Category D specs
```

---

## Feedback Loops

The pipeline isn't just linear — it has explicit feedback loops:

### Confirm → Gap Analysis (Primary Loop)
Every `/confirm` report includes a "Feedback for next cycle" section. The next `/gap-analysis` reads this to understand what issues remain, what patterns caused failures, and what should be prioritized.

### Build → Vision (Learning Loop)
When `/build` encounters a vision assumption that doesn't hold (API doesn't work as expected, feature is infeasible as designed), it logs the issue in the build log AND adds a note to VISION.md. This prevents the same wrong assumption from persisting.

### All Skills → VISION.md + PRODUCT_PLAN.md (Living Document Loop)
Every pipeline skill can update VISION.md and PRODUCT_PLAN.md when evidence warrants it. This keeps strategic documents aligned with reality:

| Skill | What It Can Update |
|-------|-------------------|
| `/gap-analysis` | Feature statuses, missing gaps, scoring profiles |
| `/research` | Market targets, competitive landscape, pricing |
| `/synthesize` | Critical path, feature priorities, phasing |
| `/search-tools` | Tool inventory, build-vs-buy decisions, cost architecture |
| `/decompose` | Phasing (if scope exceeds budget), architectural flags |
| `/prepare` | Cognitive team routing, architectural principles |
| `/build` | Any vision assumption that doesn't hold in practice |
| `/confirm` | Recommends updates (doesn't edit directly — flags for next cycle) |

When updating, skills add: `<!-- Updated by [skill] — YYYY-MM-DD -->`

**What's stable** (don't change without user discussion): Core thesis (audit → implement → verify), three-layer architecture, unified principles.

**What's fluid** (update with evidence): Market targets, pricing, feature priorities, tool inventory, competitive positioning, technical choices.

---

## Parallel Execution

### Within a Cycle
```
Stage 1:  /gap-analysis                              (sequential)
Stage 2:  /research  ←→  /search-tools               (PARALLEL)
Stage 3:  /synthesize                                 (sequential — waits for both)
Stage 4:  /decompose                                  (sequential)
Stage 5:  /prepare --wave 1                           (sequential per wave)
Stage 6:  /build --wave 2                             (PARALLEL via worktrees)
Stage 7:  /confirm                                    (after each wave completes)
```

### How Parallel Builds Work (Git Worktrees)

When `/build` runs in batch mode with 2+ specs in a wave, it automatically uses **git worktrees** for isolation:

```
Main worktree (orchestrator)
├── .wt/B1.1/    ← Agent 1 (isolated checkout)
├── .wt/B1.2/    ← Agent 2 (isolated checkout)
├── .wt/B2.1/    ← Agent 3 (isolated checkout)
└── .wt/B2.2/    ← Agent 4 (isolated checkout)
```

Each sub-agent gets its own full filesystem checkout. They can `pnpm build`, `pnpm test`, and write files without interfering with each other. After all agents finish, the orchestrator merges their branches back and runs a final integration check.

**Why this works:** `/decompose` guarantees zero file overlap between specs in the same wave. Non-overlapping ownership means conflict-free merges.

**Failure handling:**
- If a sub-agent fails, its branch is not merged. Other agents continue.
- If the post-merge integration check fails, the orchestrator bisects to find which merge caused it.
- If worktree creation fails (disk space, Windows path limits), falls back to sequential mode.

### Across Waves
```
Wave 1:  /build --wave 1                              (sequential — dependencies)
Wave 2:  /build --wave 2                              (PARALLEL via worktrees)
Wave 3:  /build --wave 3                              (PARALLEL via worktrees)
Wave 4:  /build --wave 4                              (after all builds complete)
```

Waves execute sequentially (Wave 2 waits for Wave 1). Specs within each wave execute in parallel via worktrees. Use `/build --all` to automatically run all waves in order with parallelism within each wave.

---

## Utility Skills

These operate outside the main pipeline and can be used at any time:

| Skill | When to Use | Duration |
|-------|------------|----------|
| `/hotfix [file]` | Emergency bug fix, <3 files | 15-60 min |
| `/test [file]` | Add tests to existing code | 30-90 min |
| `/review [file]` | Pre-commit convention check | 5-15 min |
| `/demo [domain]` | Sales demo audit | ~2 min |
| `/security [scope]` | Security audit before deploy | 30-60 min |
| `/changelog [ref]` | Release notes from git history | 10-30 min |
| `/onboard [area]` | Brief a new agent | 10-20 min |
| `/perf [area]` | Profile performance bottlenecks | 30-60 min |
| `/scaffold [contract]` | Generate stubs from contracts | 10-30 min |
| `/vision [focus]` | Strategic vision workshop | 30-120 min |

---

## Decision Tree: Which Skill Do I Need?

```
"I need to..."

├─ "...know what to build next"
│   └─ /gap-analysis
│
├─ "...understand a technology/competitor/API"
│   └─ /research [topic]
│
├─ "...find tools to accelerate development"
│   └─ /search-tools [capability]
│
├─ "...create a build plan from research"
│   └─ /synthesize
│
├─ "...break a plan into work units"
│   └─ /decompose
│
├─ "...figure out how to implement a spec"
│   └─ /prepare [spec-path]
│
├─ "...implement a spec"
│   └─ /build [spec-path]
│
├─ "...implement a whole wave or category"
│   └─ /build --wave N  or  /build specs/B-hardening/
│
├─ "...verify a completed spec"
│   └─ /confirm [spec-path]
│
├─ "...fix a bug quickly"
│   └─ /hotfix [file-or-description]
│
├─ "...add tests"
│   └─ /test [file-path]
│
├─ "...check code before committing"
│   └─ /review
│
├─ "...run a quick demo audit"
│   └─ /demo [domain] [vertical]
│
├─ "...check for security issues"
│   └─ /security
│
├─ "...rethink the product direction"
│   └─ /vision [focus-area]
│
└─ "...onboard a new agent"
    └─ /onboard [area]
```

---

## Templates

Each pipeline skill has templates for its output format:

| Skill | Template Location |
|-------|------------------|
| `/gap-analysis` | `.agent/skills/gap-analysis/templates/gap-report.md` |
| `/research` | `.agent/skills/research/templates/research-brief.md` |
| `/synthesize` | `.agent/skills/synthesize/templates/strategy.md` |
| `/decompose` | `.agent/skills/decompose/templates/spec.md` |
| `/prepare` | `.agent/skills/prepare/templates/build-brief.md`, `wave-summary.md` |
| `/build` | `.agent/skills/build/templates/batch-summary.md` |
| `/confirm` | `.agent/skills/confirm/templates/verification-report.md` |

Templates are also available in `.claude/skills/` (mirrored).

---

## Best Practices

### Starting a New Cycle
1. Run `/gap-analysis` first — always start from reality
2. Run `/research` and `/search-tools` in parallel if both are needed
3. Don't skip `/synthesize` — it enforces the 40-hour budget cap
4. Use `/prepare` before complex builds — 15 minutes of preparation saves hours of rework

### During Build
1. Use batch mode (`--wave N`, `--all`, or folder path) to build multiple specs in sequence
2. Batch stops on first failure — fix the issue before continuing
3. Always run `/confirm` after each build or batch — catch issues early
4. If a build fails, read the error carefully before retrying
5. Never modify files outside your spec's OWNED list

### Maintaining Quality
1. Use `/review` before every commit
2. Use `/security` before every deployment
3. Keep VISION.md and PRODUCT_PLAN.md current — they're living documents
4. Every confirm report should have a "Feedback for next cycle" section

### When Things Go Wrong
1. Build broken? → `/hotfix` for single-file fixes, or go back to `/gap-analysis` for systemic issues
2. Spec seems wrong? → Don't improvise. Log the issue and flag it.
3. Vision outdated? → `/vision` to workshop updates, then `/gap-analysis` to realign
4. Unclear what to build? → Start with `/gap-analysis`, not `/build`

---

## Glossary

| Term | Definition |
|------|-----------|
| **Cycle** | One full pass through the pipeline (gap → confirm) |
| **Wave** | A group of specs that can execute in parallel |
| **Spec** | An atomic work unit with files owned, acceptance criteria, and verification |
| **Build Brief** | A tactical implementation guide produced by `/prepare` |
| **Contract** | A Zod schema in `packages/core/src/contracts/` — the source of truth for types |
| **Feedback Loop** | How outputs from later stages inform earlier stages in the next cycle |
| **DAG** | Directed Acyclic Graph — the pipeline's actual structure (not purely linear) |
| **OWNED files** | Files a spec is allowed to create or modify (exclusive, no overlap) |
| **READ-ONLY files** | Files a spec can import from but must not modify |
| **Living Document** | VISION.md and PRODUCT_PLAN.md — updated by any pipeline skill with evidence |
| **Worktree** | A separate git checkout in `.wt/` used for parallel builds. Each sub-agent gets its own worktree for full isolation. |
| **PreToolUse Hook** | Claude Code hook that validates Edit/Write operations. Enforces file ownership from spec's OWNED list when `PARE_SPEC_FILE` is set. |
| **Merge Driver** | `@pnpm/merge-driver` — auto-resolves `pnpm-lock.yaml` conflicts during parallel branch merges. |

---

*This guide is the reference for the development pipeline. When in doubt, follow the pipeline. When you don't need the full pipeline, use the shortcuts. When you need to go faster, use `/prepare` to frontload the thinking.*