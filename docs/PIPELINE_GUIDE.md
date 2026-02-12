# Pare Engine — Development Pipeline Guide

> The definitive reference for how the development pipeline works. Read this before your first development cycle.

## Overview

The Pare Engine development pipeline is a two-loop system that separates understanding from building. Each loop has distinct skills, outputs, and failure modes.

The pipeline mirrors Pare's own consulting thesis — **audit, implement, verify** — applied to its own development. The pipeline IS the product, used on itself.

```
┌─────────────────────────────────────────────────────────────────────┐
│                  UNDERSTANDING LOOP                                  │
│                  "Orient before building"                            │
│                                                                     │
│  ┌──────────────┐                                                   │
│  │ /gap-analysis │ ─── "What's true? What do we know/not know?"     │
│  └──────┬───────┘                                                   │
│         │                                                           │
│         ▼                                                           │
│  ┌──────────────┐                                                   │
│  │ /dispatch     │ ─── "What should we investigate in parallel?"     │
│  └──────┬───────┘                                                   │
│         │                                                           │
│         ▼                                                           │
│  ┌────────────┐    ┌───────────────┐                                │
│  │ /research   │    │ /search-tools  │  ◄── Run in parallel         │
│  │ (N threads) │    │               │                               │
│  └──────┬─────┘    └──────┬────────┘                                │
│         │                 │                                         │
│         └────────┬────────┘                                         │
│                  ▼                                                   │
│         ┌──────────────┐                                            │
│         │ /synthesize   │ ─── "What changed? What's the plan?"      │
│         └──────┬───────┘                                            │
│                │                                                    │
│                ▼                                                    │
│         ┌────────────┐                                              │
│         │ knowledge/  │ ─── Durable findings persist across cycles  │
│         └────────────┘                                              │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                  BUILD LOOP                                          │
│                  "Execute with confidence"                           │
│                                                                     │
│         ┌──────────────┐                                            │
│         │ /decompose    │ ─── "What are the work units?"            │
│         └──────┬───────┘                                            │
│                ▼                                                    │
│         ┌──────────────┐                                            │
│         │ /prepare      │ ─── "How should we build each one?"       │
│         └──────┬───────┘                                            │
│                ▼                                                    │
│         ┌──────────────┐                                            │
│         │ /build        │ ─── "Build it." (per spec, parallel)      │
│         └──────┬───────┘                                            │
│                ▼                                                    │
│         ┌──────────────┐                                            │
│         │ /confirm      │ ─── "Is it correct?"                      │
│         └──────┬───────┘                                            │
│                │                                                    │
│                └──────────────────── feedback ──► next cycle        │
└─────────────────────────────────────────────────────────────────────┘
```

## The Two Loops

### Understanding Loop: Orient Before Building

**Purpose:** Reduce uncertainty, update the domain model, accumulate durable knowledge.

**Failure mode:** Skipping to the build. If you don't understand the domain well enough, you'll build the wrong thing efficiently.

| Stage | Skill | Core Question |
|-------|-------|--------------|
| 1 | `/gap-analysis` | What do we know, believe, not know, and might be wrong about? |
| 1.5 | `/dispatch` | How should we split investigation across parallel threads? |
| 2 | `/research` | Does our hypothesis survive disconfirmation? |
| 2 | `/search-tools` | Can we buy this instead of building it? |
| 3 | `/synthesize` | What changed in our understanding? What should we build? |

### Build Loop: Execute With Confidence

**Purpose:** Turn a well-understood strategy into working code.

**Failure mode:** Implementing without a strategy. If you skip the Understanding Loop, you're optimizing for speed at the expense of direction.

| Stage | Skill | Core Question |
|-------|-------|--------------|
| 5 | `/decompose` | How do we divide the work into parallel, non-overlapping units? |
| 5.5 | `/prepare` | What's the fastest path to implementing each unit? |
| 6 | `/build` | Is it implemented? |
| 7 | `/confirm` | Is it correct? |

---

## Deep Parallelization

The pipeline is designed for **maximum parallelism**, not incremental iteration. A single cycle can and should produce 100+ specs.

**Design principles:**

1. **The bottleneck is understanding, not building.** The Understanding Loop should be thorough and unhurried. The Build Loop should be massive and fast.

2. **Decompose aggressively.** Each spec should be 10-30 minutes of agent work, not hours. If a strategy item touches 5 independent files, that's 5 specs, not 1.

3. **Maximize wave width.** Specs within a wave run simultaneously via git worktrees. The wider the wave (more specs in parallel), the faster the cycle. File ownership is the only constraint — no two specs can own the same file.

4. **No artificial budget caps.** Don't defer work to "next cycle" unless it has genuine blockers (unresolved dependencies, unknowns requiring more research, Complex-domain items needing probes). If the understanding is clear, spec it and build it now.

5. **Scale is the default.** This repo was built by 28 parallel sessions in 5.5 hours. That velocity is the baseline. A cycle that produces 20 specs is underperforming — look for decomposition opportunities.

**What limits spec count:**
- File ownership conflicts (the only hard constraint)
- Genuinely unresolved dependencies between items
- Complex-domain items where the right approach isn't known yet (these get probes, not full specs)

**What does NOT limit spec count:**
- "Budget" or "hours per cycle" — these are meaningless at agent velocity
- "Too many specs to manage" — the manifest and index handle this
- "We should be conservative" — conservatism in the Build Loop wastes the Understanding Loop's investment

---

## The 10 Stages

### Stage 1: Gap Analysis (`/gap-analysis`)

**Question answered:** "What's true about the domain, and where are the gaps?"

**What it does:**
- Reads `knowledge/` first — starts from what we durably know
- Assesses epistemic state: what we know / believe / don't know / might be wrong about
- Classifies each domain area using Cynefin (Clear/Complicated/Complex) to determine routing
- THEN scans the codebase against VISION.md and PRODUCT_PLAN.md
- Generates testable hypotheses with disconfirmation criteria
- Frames specific, decision-relevant research questions

**Input:** knowledge/, VISION.md, PRODUCT_PLAN.md, codebase, previous confirm reports
**Output:** `pipeline/1-gap-analysis/gap-YYYY-MM-DD.md`, knowledge/ updates
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

### Stage 1.5: Dispatch (`/dispatch`)

**Question answered:** "How should we split investigation across parallel agents?"

**What it does:**
- Reads gap analysis hypotheses and research questions
- Clusters questions into coherent parallel threads by domain
- Sets anti-scope per thread (what each thread should NOT investigate)
- Estimates duration and balances thread workloads
- Produces self-contained thread briefs that agents can execute independently

**Input:** `pipeline/1-gap-analysis/`, knowledge/
**Output:** `pipeline/1.5-dispatch/dispatch-YYYY-MM-DD.md`
**Duration:** 10-20 minutes

**Why it exists:** Without dispatch, the operator must manually decide what each parallel research agent investigates. Dispatch automates that triage so the operator can launch N agents without being the bottleneck.

**When to run:**
- After gap analysis, before research
- When gap analysis produced 3+ research questions across different domains
- Skip if there are <3 research questions in a single domain (just run `/research` directly)

**Example:**
```
/dispatch
/dispatch pipeline/1-gap-analysis/gap-2026-02-11.md   # Specific gap file
```

---

### Stage 2: Research (`/research`)

**Question answered:** "Does our hypothesis survive investigation?"

**What it does:**
- Reads dispatch thread brief (if available) or gap analysis research questions
- Frames explicit hypotheses with disconfirmation criteria BEFORE searching
- Uses information foraging: breadth-first scan, then depth on signal
- Prioritizes disconfirmation over confirmation (ACH methodology)
- Tracks confidence levels and saturation (stops when returns diminish)
- Writes durable findings to `knowledge/`, not just pipeline artifacts

**Input:** `pipeline/1.5-dispatch/` thread brief or `pipeline/1-gap-analysis/`, knowledge/
**Output:** `pipeline/2-research/thread-N-[domain]-YYYY-MM-DD.md` or `research-YYYY-MM-DD.md`, knowledge/ updates
**Duration:** 15-60 minutes per thread

**Can run in parallel:** Multiple threads from dispatch, plus `/search-tools`

**When to run:**
- When gap analysis identifies hypotheses to test
- When exploring a new technology, API, or market question
- When existing knowledge is stale (>90 days)

**Example:**
```
/research                                               # Auto-read gap analysis
/research "Perplexity citation patterns for B2B SaaS"   # Specific topic
/research thread-2-technical                            # Specific dispatch thread
```

---

### Stage 3: Synthesize (`/synthesize`)

**Question answered:** "What changed in our understanding? What should we build?"

**What it does:**
- Collects and reconciles all research thread outputs (handles contradictions)
- Updates the domain model: what we confirmed, disconfirmed, newly learned, still don't know
- THEN creates the build strategy (phases, dependencies, budget)
- Classifies items by Cynefin: Clear → just build, Complicated → analyze then build, Complex → probe
- Updates `knowledge/` with synthesis insights

**Input:** `pipeline/1-gap-analysis/`, all `pipeline/2-research/` threads, `pipeline/4-search-tools/`, knowledge/
**Output:** `pipeline/3-synthesis/strategy-YYYY-MM-DD.md`, knowledge/ updates
**Duration:** 60-90 minutes

**When to run:**
- After research and search-tools are complete
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
- Extracts capability needs from the gap analysis or synthesis strategy
- Searches MCP registries (smithery.ai, mcp.so, glama.ai)
- Searches npm for TypeScript packages with Zod compatibility
- Evaluates: fit, maturity, cost, lock-in risk
- Verdict: USE (adopt) / BUILD (custom) / DEFER (later)

**Input:** `pipeline/1.5-dispatch/` (runs in parallel with research at Stage 2)
**Output:** `pipeline/4-search-tools/tools-YYYY-MM-DD.md`
**Duration:** 45-90 minutes

**Can run in parallel with:** `/research` (both auto-spawned by the Conductor after dispatch)

**When to run:**
- When the dispatch manifest identifies capabilities that might exist as tools
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

**Question answered:** "How do we divide the work for maximum parallelism?"

**What it does:**
- Breaks the strategy into atomic specs (10-30 minutes each — as fine-grained as possible)
- Assigns file ownership (zero overlap between specs)
- Marks dependencies and groups into execution waves
- Writes spec files to `specs/{category}/`
- Updates `specs/index.md`
- **Targets 100+ specs per cycle.** More specs = wider waves = more parallelism.

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

### Stage 6: Build (`/build`)

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
**Output:** Code changes, `pipeline/6-build/build-log-YYYY-MM-DD.md`
**Duration:** 10-20 minutes per spec (at observed velocity)

**Supports batch execution** — build an entire category folder, wave, or all ready specs in one command. Specs execute sequentially in dependency order. Batch stops on first failure to prevent cascading issues.

**When to run:**
- After decompose (and ideally prepare)
- Can be invoked directly with a spec path, skipping earlier stages
- Use batch modes when specs are already decomposed and ready

**Example:**
```
/build specs/B-hardening/B2.1-my-spec.md                 # Single spec
/build specs/B-hardening/                                # All ready specs in folder
/build --wave 1                                          # All ready specs in wave 1
/build --next                                            # Next ready spec (default)
/build --next 5                                          # Next 5 ready specs
/build --all                                             # All ready specs in order
/build                                                   # Same as --next
```

---

### Stage 7: Confirm (`/confirm`)

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

Not every task needs the full pipeline. Here are the common patterns:

### Full Cycle (New Development Sprint)
```
/gap-analysis → /dispatch → /research + /search-tools → /synthesize → /decompose → /prepare → /build → /confirm
```
Use when: Starting a new development cycle. Understanding Loop takes 2-4 hours, then Build Loop varies.

### Understanding Only (No Build Yet)
```
/gap-analysis → /dispatch → /research (parallel threads) → /synthesize
```
Use when: You need to understand the landscape before deciding what to build. Ends with an updated domain model and strategy.

### Quick Build (Spec Already Exists)
```
/prepare specs/my-spec.md → /build specs/my-spec.md → /confirm specs/my-spec.md
```
Use when: Specs already exist and you want to implement one. Takes 30-60 minutes.

### Batch Build (Wave or Category)
```
/prepare --wave 1 → /build --wave 1 → /confirm
```
Use when: Specs are decomposed and you want to build an entire wave. Stops on first failure.

### Direct Build (Simple, Clear Spec)
```
/build specs/my-spec.md → /confirm specs/my-spec.md
```
Use when: The spec is simple and you don't need preparation. Takes 15-30 minutes.

### Hotfix (Emergency)
```
/hotfix apps/web/lib/auth.ts
```
Use when: Single-file bug fix. Skips the entire pipeline. Takes 15-60 minutes.

### Research Only
```
/research "Perplexity citation patterns"
```
Use when: You need to investigate a specific topic standalone. Writes to `knowledge/`.

### Vision Refinement
```
/vision → /gap-analysis
```
Use when: Strategic direction has changed and you need to realign. Takes 1-2 hours.

---

## Durable Knowledge

The `knowledge/` directory persists across pipeline cycles (unlike `pipeline/` which is archived):

```
knowledge/
├── README.md          → Format rules, what goes here vs. pipeline
├── domain/            → GEO discipline, AI engine behaviors, market dynamics
├── technical/         → API capabilities, tool evaluations, integration patterns
├── scoring/           → What actually affects AI visibility (evidence-based)
└── competitors/       → Competitor capabilities, gaps, positioning
```

**How skills interact with knowledge/:**
| Skill | Reads | Writes |
|-------|-------|--------|
| `/gap-analysis` | Reads all — builds epistemic state from durable knowledge | Updates verification dates, flags stale entries |
| `/research` | Reads relevant subdirectory — avoids re-investigating known facts | Writes durable findings, updates contradictions |
| `/synthesize` | Reads all — reconciles research against existing knowledge | Updates confidence levels, writes new domain models |
| `/confirm` | Does not read | Flags knowledge that didn't hold up in practice |

---

## Pipeline Artifacts

Every skill produces artifacts in the `pipeline/` directory:

```
pipeline/
├── 1-gap-analysis/         # Current cycle — orientation + gap reports
│   └── gap-YYYY-MM-DD.md
├── 1.5-dispatch/            # Current cycle — dispatch manifests
│   └── dispatch-YYYY-MM-DD.md
├── 2-research/              # Current cycle — research findings
│   ├── thread-1-geo-YYYY-MM-DD.md
│   ├── thread-2-technical-YYYY-MM-DD.md
│   └── research-YYYY-MM-DD.md
├── 3-synthesis/             # Current cycle — domain model + strategy
│   └── strategy-YYYY-MM-DD.md
├── 4-search-tools/          # Current cycle — tool evaluations
│   └── tools-YYYY-MM-DD.md
├── 5-decompose/             # Current cycle — decomposition manifests
│   └── manifest-YYYY-MM-DD.md
├── 5.5-prepare/             # Current cycle — build briefs
│   ├── brief-B2.1-YYYY-MM-DD.md
│   └── wave-1-YYYY-MM-DD.md
├── 6-build/                 # Current cycle — build logs
│   └── build-log-YYYY-MM-DD.md
├── 7-confirm/               # Current cycle — verification reports
│   └── confirm-YYYY-MM-DD.md
├── logs/                    # Conductor runtime state
│   ├── conductor-state.json # JSON state (stage status, timing)
│   ├── conductor.log        # Append-only backup log
│   └── conductor.lock       # PID lock (prevents concurrent instances)
└── archive/                 # Previous cycles (max 2 kept)
    └── 2026-02-10/
```

### Artifact Rotation

Pipeline artifacts are **ephemeral working files**, not permanent records. To keep the workspace clean:

- `pnpm conductor start` automatically **archives** the previous cycle's artifacts before starting a new one
- Archives go to `pipeline/archive/YYYY-MM-DD/`
- Only the **2 most recent** archives are kept — older ones are pruned
- The conductor reads state from existing artifacts, so archiving prevents stale data from contaminating new cycles

Durable findings go to `knowledge/` (persistent, not archived). Specs go to `specs/` (persistent, git-tracked).

---

## Feedback Loops

### Confirm → Gap Analysis (Primary Loop)
Every `/confirm` report includes a "Feedback for next cycle" section. The next `/gap-analysis` reads this to understand what issues remain, what patterns caused failures, and what should be prioritized.

### Research → Knowledge (Accumulation Loop)
Every `/research` thread writes durable findings to `knowledge/`. The next `/gap-analysis` reads `knowledge/` first, so understanding compounds across cycles. This is the primary mechanism for avoiding re-investigation.

### Build → Vision (Learning Loop)
When `/build` encounters a vision assumption that doesn't hold, it logs the issue AND adds a note to VISION.md. This prevents wrong assumptions from persisting.

### Synthesize → Domain Model (Understanding Loop)
`/synthesize` updates `knowledge/` with what was confirmed, disconfirmed, and newly learned. This is how the pipeline's understanding of the GEO domain deepens over time.

### All Skills → VISION.md + PRODUCT_PLAN.md (Living Document Loop)
Every pipeline skill can update VISION.md and PRODUCT_PLAN.md when evidence warrants it:

| Skill | What It Can Update |
|-------|-------------------|
| `/gap-analysis` | Feature statuses, missing gaps, scoring profiles |
| `/research` | Market targets, competitive landscape, pricing |
| `/synthesize` | Critical path, feature priorities, phasing |
| `/search-tools` | Tool inventory, build-vs-buy decisions, cost architecture |
| `/decompose` | Phasing (if scope exceeds budget), architectural flags |
| `/prepare` | Cognitive team routing, architectural principles |
| `/build` | Any vision assumption that doesn't hold in practice |
| `/confirm` | Recommends updates (flags for next cycle) |

When updating, skills add: `<!-- Updated by [skill] — YYYY-MM-DD -->`

**What's stable** (don't change without user discussion): Core thesis, three-layer architecture, unified principles.
**What's fluid** (update with evidence): Market targets, pricing, feature priorities, tool inventory, competitive positioning.

---

## Conductor (Pipeline Orchestrator)

The Conductor (`scripts/conductor.ts`) automates stage transitions. Instead of manually invoking each skill, the conductor scans `pipeline/` for completed outputs, spawns agents for ready stages, and advances through the pipeline autonomously.

### Model Routing

| Stage | Model | Rationale |
|-------|-------|-----------|
| gap-analysis | Claude Opus | Orientation requires deep reasoning |
| dispatch | Claude Opus | Triage requires judgment about research scope |
| research | Gemini | Information gathering, large context window |
| search-tools | Gemini | Tool evaluation, web search heavy |
| synthesize | Claude Opus | Domain model update requires synthesis |
| decompose | Claude Opus | Spec design requires architectural thinking |
| prepare | Gemini | Pattern matching and brief generation |
| build | Gemini | Code implementation, large context |
| confirm | Claude Sonnet | Verification — balanced capability/cost |

### Safety Features

- **Cycle archiving:** `conductor start` moves previous cycle's artifacts to `pipeline/archive/YYYY-MM-DD/` before starting fresh
- **Output validation:** Every stage's output files are checked for non-empty content after agent completion
- **Append-only log:** `pipeline/logs/conductor.log` provides a durable audit trail independent of JSON state
- **PID lock file:** Prevents concurrent conductor instances; auto-cleans stale locks from dead processes
- **Fan-out completion gate:** Synthesize is blocked until ALL research threads have completed (count-based validation against dispatch thread briefs)

### Commands

```bash
pnpm conductor                      # Auto-detect state, run forward
pnpm conductor start                # Archive previous cycle, run full pipeline
pnpm conductor watch                # Reactive: auto-run stages when files appear
pnpm conductor status               # Show pipeline state
pnpm conductor --from=synthesize    # Resume from specific stage
pnpm conductor --understanding      # Understanding loop only (gap→synthesize)
pnpm conductor --build              # Build loop only (decompose→confirm)
pnpm conductor --dry-run            # Preview without executing
pnpm conductor --gate-all           # Prompt before each stage
```

---

## Parallel Execution

### Within a Cycle
```
Stage 1:    /gap-analysis                              (sequential — orientation)
Stage 1.5:  /dispatch                                  (sequential — triage)
Stage 2:    /research x N  ←→  /search-tools           (PARALLEL — dispatched threads)
Stage 3:    /synthesize                                (sequential — reconciliation)
Stage 5:    /decompose                                 (sequential)
Stage 5.5:  /prepare --wave 1                          (sequential per wave)
Stage 6:    /build --wave 1                            (PARALLEL via worktrees)
Stage 7:    /confirm                                   (after each wave completes)
```

### How Parallel Research Works (Dispatch)

The **Conductor** (`pnpm conductor`) automatically handles research fan-out:

1. Globs `pipeline/1.5-dispatch/thread-*-{date}.md` to discover thread briefs
2. Spawns N+1 agents in parallel: one per thread brief + one search-tools agent
3. Monitors all child processes, reports completion as they finish
4. Validates all output files are non-empty
5. Only advances to synthesize when ALL threads complete (count-based validation)

```
  ▸ research — spawning 4 agents [gemini]
    thread-1-geo                   ⟳ running
    thread-2-technical             ⟳ running
    thread-3-competitive           ⟳ running
    search-tools                   ⟳ running

    thread-3-competitive           ✓ 2m 12s
    thread-2-technical             ✓ 3m 05s
    search-tools                   ✓ 3m 44s
    thread-1-geo                   ✓ 5m 31s
```

Each thread has anti-scope that prevents overlap. Threads write to separate output files. `/synthesize` reads all thread outputs and reconciles them.

**Manual override:** You can still launch research agents manually via `/research thread-path`. The conductor detects existing outputs and skips completed threads on resume.

### How Parallel Builds Work (Git Worktrees)

When `/build` runs in batch mode with 2+ specs in a wave, it automatically uses **git worktrees** for isolation:

```
Main worktree (orchestrator)
├── .wt/B1.1/    ← Agent 1 (isolated checkout)
├── .wt/B1.2/    ← Agent 2 (isolated checkout)
├── .wt/B2.1/    ← Agent 3 (isolated checkout)
├── .wt/B2.2/    ← Agent 4 (isolated checkout)
├── .wt/C1.1/    ← Agent 5
├── ...          ← As many as the wave requires
└── .wt/C4.3/    ← Agent N
```

Each sub-agent gets its own full filesystem checkout. They can `pnpm build`, `pnpm test`, and write files without interfering with each other. After all agents finish, the orchestrator merges their branches back and runs a final integration check.

**Target scale:** A single wave can run 20-40+ specs simultaneously. The only constraint is file ownership — no two specs in the same wave can own the same file. With aggressive decomposition (10-30 min per spec), a wave of 30 specs finishes in ~30 minutes wall clock.

**Why this works:** `/decompose` guarantees zero file overlap between specs in the same wave. Non-overlapping ownership means conflict-free merges.

**Failure handling:**
- If a sub-agent fails, its branch is not merged. Other agents continue.
- If the post-merge integration check fails, the orchestrator bisects to find which merge caused it.
- If worktree creation fails (disk space, Windows path limits), falls back to sequential mode.

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
├─ "...launch parallel research without being the bottleneck"
│   └─ /dispatch (after gap-analysis)
│
├─ "...investigate a hypothesis or technology"
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

## Epistemic Framework

The pipeline embeds an epistemic framework for decision quality:

### Cynefin Classification (from /gap-analysis)
- **Clear** — Known solution. Skip research, go straight to build. (e.g., "add a button")
- **Complicated** — Analyzable with expert knowledge. Research specific questions, then build. (e.g., "integrate Foursquare API")
- **Complex** — No known solution. Hypothesis-driven research, build probes, iterate. (e.g., "what scoring weights maximize client value?")

### Confidence Levels (used across all skills)
- **High** — Verified across multiple sources or direct testing. Act on it.
- **Medium** — Single credible source or reasonable inference. Flag alternatives but proceed.
- **Low** — Unverified or contradicted. Research before building on it.

### Disconfirmation Priority (from /research)
- Search for evidence AGAINST the hypothesis, not for it.
- If you can't disprove it after genuine effort, confidence goes up.
- The most valuable research output is "we were wrong about X because Y."

---

## Templates

Each pipeline skill has templates for its output format:

| Skill | Template Location |
|-------|------------------|
| `/gap-analysis` | `.claude/skills/gap-analysis/templates/gap-report.md` |
| `/research` | `.claude/skills/research/templates/research-brief.md` |
| `/synthesize` | `.claude/skills/synthesize/templates/strategy.md` |
| `/decompose` | `.claude/skills/decompose/templates/spec.md` |
| `/prepare` | `.claude/skills/prepare/templates/build-brief.md`, `wave-summary.md` |
| `/build` | `.claude/skills/build/templates/batch-summary.md` |
| `/confirm` | `.claude/skills/confirm/templates/verification-report.md` |

---

## Best Practices

### Starting a New Cycle

**Automated (recommended):**
```bash
pnpm conductor start    # Archives previous cycle, runs full pipeline autonomously
```

The conductor archives stale artifacts from the previous cycle, then runs gap-analysis → dispatch → research (fan-out) → synthesize → decompose → prepare → build → confirm in sequence, spawning agents and validating outputs at each step.

**Manual:**
1. Run `/gap-analysis` — orient in the domain, assess what's true
2. Run `/dispatch` to triage research into parallel threads
3. Launch parallel `/research` threads + `/search-tools`
4. Run `/synthesize` — update domain model, then create strategy
5. Don't skip understanding — it prevents building the wrong thing

### During Build
1. Use batch mode (`--wave N`, `--all`, or folder path) to build multiple specs
2. Batch stops on first failure — fix the issue before continuing
3. Always run `/confirm` after each build or batch — catch issues early
4. If a build fails, read the error carefully before retrying
5. Never modify files outside your spec's OWNED list

### Maintaining Quality
1. Use `/review` before every commit
2. Use `/security` before every deployment
3. Keep VISION.md, PRODUCT_PLAN.md, and `knowledge/` current
4. Every confirm report should have a "Feedback for next cycle" section

### When Things Go Wrong
1. Build broken? → `/hotfix` for single-file fixes, or `/gap-analysis` for systemic issues
2. Spec seems wrong? → Don't improvise. Log the issue and flag it.
3. Vision outdated? → `/vision` to workshop updates, then `/gap-analysis`
4. Knowledge stale? → Run `/research` on the specific topic. Update `knowledge/`.
5. Unclear what to build? → Start with `/gap-analysis`, not `/build`

---

## Glossary

| Term | Definition |
|------|-----------|
| **Understanding Loop** | The first half of the pipeline: orient, dispatch, research, synthesize |
| **Build Loop** | The second half: decompose, prepare, build, confirm |
| **Cycle** | One full pass through both loops |
| **Durable Knowledge** | Findings in `knowledge/` that persist across cycles |
| **Epistemic State** | What we know / believe / don't know / might be wrong about |
| **Cynefin** | Complexity classification: Clear, Complicated, Complex |
| **Dispatch** | Triage step that routes research into parallel threads with anti-scope |
| **Anti-scope** | What a research thread should NOT investigate (prevents overlap) |
| **Disconfirmation** | Searching for evidence against a hypothesis (more valuable than confirmation) |
| **Saturation** | The point where additional research stops reducing uncertainty |
| **Wave** | A group of specs that can execute in parallel |
| **Spec** | An atomic work unit with files owned, acceptance criteria, and verification |
| **Build Brief** | A tactical implementation guide produced by `/prepare` |
| **Contract** | A Zod schema in `packages/core/src/contracts/` — the source of truth for types |
| **Feedback Loop** | How outputs from later stages inform earlier stages in the next cycle |
| **DAG** | Directed Acyclic Graph — the pipeline's actual structure |
| **OWNED files** | Files a spec is allowed to create or modify (exclusive, no overlap) |
| **Worktree** | A separate git checkout in `.wt/` used for parallel builds |

---

*This guide is the reference for the development pipeline. When in doubt, follow the pipeline. When you don't need the full pipeline, use the shortcuts. Understand before you build.*
