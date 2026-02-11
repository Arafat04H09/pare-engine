# Development Pipeline

This directory stores artifacts from the development automation pipeline. Eight skills drive the cycle:

```
/gap-analysis → /research ──┐
                             ├→ /synthesize → /decompose → /prepare → /build → /confirm
              /search-tools ─┘
```

The pipeline is a DAG, not a chain. `/research` and `/search-tools` can run in parallel. Multiple specs can `/build` in parallel within a wave. `/confirm` findings feed back into the next `/gap-analysis` cycle.

## Directory Structure

| Stage | Directory | Output Format | Skill |
|-------|-----------|--------------|-------|
| 1 | `1-gap-analysis/` | `gap-YYYY-MM-DD.md` | `/gap-analysis` |
| 2 | `2-research/` | `research-YYYY-MM-DD.md` | `/research` |
| 3 | `3-synthesis/` | `strategy-YYYY-MM-DD.md` | `/synthesize` |
| 4 | `4-search-tools/` | `tools-YYYY-MM-DD.md` | `/search-tools` |
| 5 | `5-decompose/` | `manifest-YYYY-MM-DD.md` | `/decompose` (specs go to `/specs/`) |
| 5.5 | `5.5-prepare/` | `brief-YYYY-MM-DD.md` | `/prepare` |
| 6 | `6-build/` | `build-log-YYYY-MM-DD.md` | `/build <spec-path>` |
| 7 | `7-confirm/` | `confirm-YYYY-MM-DD.md` | `/confirm` |

## How It Works

- Each skill reads from the previous stage's directory automatically
- Pass arguments to override (e.g., `/research "Perplexity API changes"`)
- Enter at any stage: `/build specs/B1.1-tools-crawling.md` works standalone
- Files are date-stamped; re-running overwrites same-day output
- Skills exist in both `.claude/skills/` (Claude Code) and `.agent/skills/` (Gemini)
- `/prepare` is optional but recommended — it makes `/build` significantly faster

## I/O Contracts

| Skill | Reads From | Writes To |
|-------|-----------|-----------|
| gap-analysis | VISION.md, PRODUCT_PLAN.md, codebase | `pipeline/1-gap-analysis/` |
| research | `pipeline/1-gap-analysis/` | `pipeline/2-research/` |
| synthesize | `pipeline/1-*` + `pipeline/2-*` + `pipeline/4-*` | `pipeline/3-synthesis/` |
| search-tools | `pipeline/3-synthesis/` | `pipeline/4-search-tools/` |
| decompose | `pipeline/3-*` + `pipeline/4-*` | `/specs/` + `pipeline/5-decompose/` |
| prepare | `/specs/` + contracts + codebase | `pipeline/5.5-prepare/` |
| build | spec + build brief + contracts | code + `pipeline/6-build/` |
| confirm | spec + code + VISION.md | `pipeline/7-confirm/` |

## Model Recommendations

Uses the cognitive team model defined in VISION.md:

| Skill | Role | Recommended Model | Reasoning |
|-------|------|------------------|-----------|
| gap-analysis | Analyst | Gemini 2.5 Pro | Large-context structural analysis |
| research | Analyst | Gemini 2.5 Pro x N | Parallel web search, grounded |
| synthesize | Strategist | Claude Opus | Deep reasoning, tradeoff analysis |
| search-tools | Analyst | Gemini 2.5 Pro | Structured lookup, fast |
| decompose | Analyst | Gemini 2.5 Pro | Template-based spec generation |
| prepare | Strategist | Claude Opus | Pattern recognition, approach selection |
| build (simple) | Specialist | Claude Haiku / Gemini Flash | Boilerplate, patterns |
| build (complex) | Strategist | Claude Opus | Architecture, cross-cutting |
| confirm | Strategist | Claude Opus | Semantic verification |
