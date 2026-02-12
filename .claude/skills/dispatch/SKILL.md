---
name: dispatch
description: >
  Triage gap analysis output into parallel research threads. Groups questions by
  domain, sets anti-scope per thread, estimates duration, and produces a dispatch
  manifest the operator can launch without being the bottleneck.
argument-hint: "[gap-analysis-file]"
allowed-tools: Read, Write, Grep, Glob
context: fork
---

# Dispatch — Research Triage & Fan-Out

You are triaging the gap analysis output into parallel research threads. Your job is to maximize research throughput — the Conductor will auto-spawn one agent per thread, so more threads = more parallelism = faster understanding.

**Why this exists:** The gap analysis produces a rich orientation document with hypotheses, research questions, and domain gaps. Dispatch automates triage into parallel threads with anti-scope so they don't duplicate work. The Conductor handles all spawning, monitoring, and completion validation — dispatch just needs to produce well-scoped thread briefs.

## Inputs

Read the most recent gap analysis:
- Most recent file in `pipeline/1-gap-analysis/` — focus on "Research Questions" and "Hypotheses to Test" sections

Also read for context:
- `knowledge/` — What we already know (don't dispatch research for things we already have high-confidence answers to)
- `CLAUDE.md` — Settled decisions (don't dispatch research for alternatives to settled tools)
- `PRODUCT_PLAN.md` — What features are planned (helps prioritize which research matters most)

If a specific gap analysis file was provided: $ARGUMENTS

## Process

### 1. Extract Research Items

From the gap analysis, collect:
- All hypotheses that need testing
- All research questions with their domains and estimated depths
- All "What we DON'T KNOW" items that are decision-relevant
- Any "What we might be WRONG about" items that are high-stakes

Filter out:
- Questions answerable by reading the codebase (those are for /build, not /research)
- Questions about settled CLAUDE.md decisions (respect documented decisions)
- Questions where `knowledge/` already has high-confidence answers less than 90 days old

### 2. Cluster by Domain

Group research items into coherent threads. Each thread should be a self-contained investigation that one agent can complete:

**Domain categories:**
- **GEO/Market** — How AI engines work, citation patterns, market dynamics
- **Technical/API** — Specific API capabilities, pricing, integration patterns
- **Competitive** — What competitors do, their features, gaps, positioning
- **Scoring/Methodology** — What actually affects AI visibility, evidence-based weights
- **Product/Strategy** — Market fit, pricing, positioning questions

**Clustering rules:**
- Questions in the same domain that build on each other → same thread
- Questions that require the same type of search (e.g., all API docs lookups) → same thread
- Prefer fine-grained threads over coarse bundles — each hypothesis or independent question can be its own thread
- No artificial cap on thread count. 3 threads is fine if that's all the gap analysis warrants. 15 threads is fine if there are 15 genuinely independent research questions. The Conductor handles spawning and monitoring.
- If everything fits in one thread, dispatch is unnecessary — output a note saying to just run `/research` directly

### 3. Set Anti-Scope Per Thread

For EACH thread, explicitly define what it should NOT investigate. This prevents overlap:

```
Thread 2: Technical/API
  Investigate: Foursquare API free tier, Yelp Fusion API pricing, rate limits
  Anti-scope: Do NOT research GEO citation patterns (Thread 1 handles this).
              Do NOT evaluate alternative APIs (Thread 4 handles build-vs-buy).
              Do NOT research competitors that use these APIs (Thread 3 handles this).
```

### 4. Estimate Duration & Complexity

For each thread, estimate:
- **Duration:** small (5-15 min), medium (15-30 min), large (30-60 min)
- **Complexity:** how many sub-questions, how deep the investigation
- **Confidence target:** what confidence level should the thread aim for?

**Duration guidance:** If a thread is >45 min, consider splitting it — two 20-min threads finish faster and unblock synthesis sooner than one 45-min thread. Small threads (<10 min) are fine — they finish quickly and free up capacity. Don't merge small threads just to "balance" — uneven completion is fine when the Conductor is monitoring.

### 5. Generate Thread Briefs

For each thread, write a self-contained brief that a research agent can execute without reading the full gap analysis:

```markdown
## Thread N: [Domain Label]

**Hypothesis:** [What we believe and want to test]
**Key questions:**
1. [Specific question] — [what decision it changes]
2. [Specific question] — [what decision it changes]

**Search strategy:**
- Start with: [specific searches or sources]
- Go deeper if: [condition that warrants depth]
- Stop when: [saturation criteria — e.g., "3 sources agree" or "pricing confirmed"]

**Anti-scope:** [What this thread does NOT investigate]

**Duration target:** [small/medium/large]
**Output to:** `pipeline/2-research/thread-N-[domain]-YYYY-MM-DD.md`
**Knowledge update:** Write durable findings to `knowledge/[subdirectory]/`
```

### 6. Identify Routing Decisions

Some gap analysis items don't need research — they need a different skill:

- **Clear domain items** → Route to `/decompose` or `/build` directly (skip research)
- **Tool evaluation items** → Route to `/search-tools` (parallel with research threads)
- **Vision/strategy items** → Route to `/vision` workshop
- **Blocked items** → Flag as blocked with what unblocks them

## Output

Write TWO types of files:

1. **Manifest** — `pipeline/1.5-dispatch/dispatch-YYYY-MM-DD.md` (summary, routing, skip list, launch instructions)
2. **Per-thread briefs** — One file per thread: `pipeline/1.5-dispatch/thread-N-[domain]-YYYY-MM-DD.md`

Each thread brief file is self-contained — a research agent pointed at it can execute without reading the manifest or other threads.

The **manifest** MUST contain:

1. **Summary** — How many threads, total estimated duration, what's being investigated

2. **Thread Manifest:**
   | Thread | Domain | Brief File | Duration | Complexity |
   |--------|--------|------------|----------|------------|

3. **Routing Decisions** — Items that don't need research and where they should go instead

4. **Skip List** — Research questions filtered out (already known, settled decisions) with reasoning

5. **Thread Summary** — List of all thread briefs produced:
   ```
   pipeline/1.5-dispatch/thread-1-geo-YYYY-MM-DD.md
   pipeline/1.5-dispatch/thread-2-technical-YYYY-MM-DD.md
   pipeline/1.5-dispatch/thread-3-competitive-YYYY-MM-DD.md
   ...
   ```
   The Conductor automatically discovers these via glob and spawns one agent per brief, plus a search-tools agent.

6. **Expected Outputs** — What the Conductor validates before advancing to synthesis:
   ```
   pipeline/2-research/thread-*-YYYY-MM-DD.md  (count must match thread briefs)
   pipeline/4-search-tools/*.md                  (if search-tools was dispatched)
   ```

## Rules
- **Never dispatch research for settled CLAUDE.md decisions.** Respect documented architecture.
- **Every thread must have anti-scope.** Overlap between threads wastes time and creates contradictory findings.
- **Every question must have a decision it changes.** No curiosity-driven research — dispatch only investigates things that affect what we build.
- **No artificial cap on thread count.** The Conductor auto-spawns and monitors all agents. Dispatch as many threads as there are genuinely independent research questions. Split aggressively — each hypothesis can be its own thread.
- **Thread briefs must be self-contained.** A research agent should be able to execute a thread brief without reading the full gap analysis or other threads.
- **Don't dispatch if unnecessary.** If there's only 1 research question, tell the operator to just run `/research` directly. Dispatch adds value through parallelism and anti-scope — if there's nothing to parallelize, it's overhead.
- **Prefer many small threads over few large ones.** A 5-min thread that answers one question is better than a 45-min thread that answers six. Small threads finish fast and unblock downstream stages sooner.
