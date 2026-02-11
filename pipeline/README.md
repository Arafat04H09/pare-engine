# Development Pipeline

This directory stores artifacts from the development automation pipeline. Seven skills drive the cycle:

```
/gap-analysis → /research → /synthesize → /search-tools → /decompose → /build → /confirm
```

## Directory Structure

| Stage | Directory | Output Format | Skill |
|-------|-----------|--------------|-------|
| 1 | `1-gap-analysis/` | `gap-YYYY-MM-DD.md` | `/gap-analysis` |
| 2 | `2-research/` | `research-YYYY-MM-DD.md` | `/research` |
| 3 | `3-synthesis/` | `strategy-YYYY-MM-DD.md` | `/synthesize` |
| 4 | `4-search-tools/` | `tools-YYYY-MM-DD.md` | `/search-tools` |
| 5 | `5-decompose/` | `manifest-YYYY-MM-DD.md` | `/decompose` (specs go to `/specs/`) |
| 6 | `6-build/` | `build-log-YYYY-MM-DD.md` | `/build <spec-path>` |
| 7 | `7-confirm/` | `confirm-YYYY-MM-DD.md` | `/confirm` |

## How It Works

- Each skill reads from the previous stage's directory automatically
- Pass arguments to override (e.g., `/research "Perplexity API changes"`)
- Enter at any stage: `/build specs/B1.1-tools-crawling.md` works standalone
- Files are date-stamped; re-running overwrites same-day output
- Skills exist in both `.claude/skills/` (Claude Code) and `.agent/skills/` (Gemini)

## I/O Contracts

| Skill | Reads From | Writes To |
|-------|-----------|-----------|
| gap-analysis | VISION.md, PRODUCT_PLAN.md, codebase | `pipeline/1-gap-analysis/` |
| research | `pipeline/1-gap-analysis/` | `pipeline/2-research/` |
| synthesize | `pipeline/1-gap-analysis/` + `pipeline/2-research/` | `pipeline/3-synthesis/` |
| search-tools | `pipeline/3-synthesis/` | `pipeline/4-search-tools/` |
| decompose | `pipeline/3-synthesis/` + `pipeline/4-search-tools/` | `/specs/` + `pipeline/5-decompose/` |
| build | `/specs/<spec-file>` | code + `pipeline/6-build/` |
| confirm | `/specs/` + `pipeline/6-build/` | `pipeline/7-confirm/` |

## Model Recommendations

| Skill | Recommended Model | Reasoning |
|-------|------------------|-----------|
| gap-analysis | Gemini Flash | Structural analysis, fast |
| research | Gemini Flash x N | Parallel web search, cheap |
| synthesize | Claude Opus | Deep reasoning, tradeoffs |
| search-tools | Gemini Flash | Structured lookup |
| decompose | Gemini Flash | Template-based spec generation |
| build (simple) | Gemini Flash | Boilerplate, patterns |
| build (complex) | Claude Opus | Architecture, cross-cutting |
| confirm | Claude Opus | Semantic verification |
