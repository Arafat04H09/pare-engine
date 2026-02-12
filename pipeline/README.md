# Development Pipeline

This directory stores artifacts from the development automation pipeline. The pipeline has two loops:

```
UNDERSTANDING LOOP (orient before building):
/gap-analysis → /dispatch → /research (N parallel) ──┐
                           → /search-tools (parallel) ┤→ /synthesize → knowledge/
                                                      └→ (re-orient if low confidence)

BUILD LOOP (execute with confidence):
/synthesize → /decompose → /prepare → /build → /confirm → feedback to next /gap-analysis
```

The Understanding Loop produces domain knowledge and a build strategy. The Build Loop executes that strategy. The loops feed back into each other — `/confirm` findings flow to the next `/gap-analysis`, and durable knowledge accumulates in `knowledge/`.

## Directory Structure

| Stage | Directory | Output Format | Skill |
|-------|-----------|--------------|-------|
| 1 | `1-gap-analysis/` | `gap-YYYY-MM-DD.md` | `/gap-analysis` |
| 1.5 | `1.5-dispatch/` | `dispatch-YYYY-MM-DD.md` | `/dispatch` |
| 2 | `2-research/` | `research-YYYY-MM-DD.md` or `thread-N-*.md` | `/research` |
| 3 | `3-synthesis/` | `strategy-YYYY-MM-DD.md` | `/synthesize` |
| 4 | `4-search-tools/` | `tools-YYYY-MM-DD.md` | `/search-tools` |
| 5 | `5-decompose/` | `manifest-YYYY-MM-DD.md` | `/decompose` (specs go to `/specs/`) |
| 5.5 | `5.5-prepare/` | `brief-YYYY-MM-DD.md` | `/prepare` |
| 6 | `6-build/` | `build-log-YYYY-MM-DD.md` | `/build <spec-path>` |
| 7 | `7-confirm/` | `confirm-YYYY-MM-DD.md` | `/confirm` |

## How It Works

### Understanding Loop
- `/gap-analysis` orients in the domain first, scans code second. Produces hypotheses and research questions.
- `/dispatch` triages research questions into parallel threads with anti-scope. Removes the operator as bottleneck.
- `/research` runs N parallel threads, each testing specific hypotheses. Writes durable findings to `knowledge/`.
- `/search-tools` evaluates build-vs-buy for needed capabilities (runs parallel with research).
- `/synthesize` updates the domain model (what changed?), then creates the build strategy.

### Build Loop
- `/decompose` breaks the strategy into atomic specs with file ownership.
- `/prepare` generates build briefs with optimal tooling and patterns (optional, recommended).
- `/build` implements specs (single or batch, parallel via worktrees).
- `/confirm` verifies correctness and produces feedback for the next cycle.

### Durable Knowledge
- `knowledge/` persists across cycles (unlike pipeline artifacts which are archived).
- Research findings, domain understanding, and synthesis insights accumulate there.
- Gap analysis reads `knowledge/` first to build on existing understanding.

## Entry Points

- **Full cycle:** `/gap-analysis` → `/dispatch` → parallel `/research` + `/search-tools` → `/synthesize` → `/decompose` → `/prepare` → `/build` → `/confirm`
- **Quick build:** `/build specs/my-spec.md` (standalone, skips understanding loop)
- **Research only:** `/research "topic"` (standalone investigation)
- **Tool search:** `/search-tools "capability"` (standalone evaluation)

Pass arguments to any skill to override defaults. Each skill auto-reads the previous stage's output when run without arguments.

## I/O Contracts

| Skill | Reads From | Writes To |
|-------|-----------|-----------|
| gap-analysis | knowledge/, VISION.md, PRODUCT_PLAN.md, codebase, confirm feedback | `pipeline/1-gap-analysis/`, knowledge/ |
| dispatch | `pipeline/1-gap-analysis/`, knowledge/ | `pipeline/1.5-dispatch/` |
| research | `pipeline/1.5-dispatch/` or `pipeline/1-gap-analysis/`, knowledge/ | `pipeline/2-research/`, knowledge/ |
| synthesize | `pipeline/1-*` + `pipeline/2-*` + `pipeline/4-*`, knowledge/ | `pipeline/3-synthesis/`, knowledge/ |
| search-tools | `pipeline/3-synthesis/` or `pipeline/1-gap-analysis/` | `pipeline/4-search-tools/` |
| decompose | `pipeline/3-*` + `pipeline/4-*` | `/specs/` + `pipeline/5-decompose/` |
| prepare | `/specs/` + contracts + codebase | `pipeline/5.5-prepare/` |
| build | spec + build brief + contracts | code + `pipeline/6-build/` |
| confirm | spec + code + VISION.md | `pipeline/7-confirm/` |

## Model Recommendations

Uses the cognitive team model defined in VISION.md:

| Skill | Role | Recommended Model | Reasoning |
|-------|------|------------------|-----------|
| gap-analysis | Strategist | Claude Opus | Epistemic assessment, hypothesis generation |
| dispatch | Analyst | Gemini 2.5 Pro | Structured triage, fast clustering |
| research | Analyst | Gemini 2.5 Pro x N | Parallel web search, grounded |
| synthesize | Strategist | Claude Opus | Deep reasoning, tradeoff analysis, domain model |
| search-tools | Analyst | Gemini 2.5 Pro | Structured lookup, fast |
| decompose | Analyst | Gemini 2.5 Pro | Template-based spec generation |
| prepare | Strategist | Claude Opus | Pattern recognition, approach selection |
| build (simple) | Specialist | Claude Haiku / Gemini Flash | Boilerplate, patterns |
| build (complex) | Strategist | Claude Opus | Architecture, cross-cutting |
| confirm | Strategist | Claude Opus | Semantic verification |
