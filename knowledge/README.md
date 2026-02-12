# Knowledge Base

Durable knowledge that persists across pipeline cycles. Unlike `pipeline/` (ephemeral working files archived each cycle), knowledge files accumulate and compound.

## Structure

```
knowledge/
├── domain/        → GEO as a discipline, AI engine behaviors, market dynamics
├── technical/     → API capabilities, tool evaluations, integration patterns
├── scoring/       → What actually affects AI visibility (evidence-based)
└── competitors/   → Competitor capabilities, gaps, positioning
```

## File Format

Every knowledge file must include:

```markdown
# [Topic]

> **Confidence:** high | medium | low
> **Last verified:** YYYY-MM-DD
> **Source:** [pipeline cycle, research thread, or direct observation]
> **Updated by:** [skill name] — YYYY-MM-DD

[Content]

## Open Questions
- Things we still don't know about this topic

## Sources
- [URL or reference] — [what it established]
```

## Rules

- **Evidence required.** No speculative entries. Every claim needs a source or direct observation.
- **Confidence is mandatory.** High = verified across multiple sources or direct testing. Medium = single credible source. Low = inferred or partially verified.
- **Staleness matters.** If `last verified` is >90 days old, treat as medium confidence regardless of original rating. GEO moves fast.
- **Contradictions are valuable.** When new evidence contradicts existing knowledge, don't delete — add a "Contradiction" section with both views and dates. Resolution comes from the next research cycle.
- **Pipeline skills update this directory.** `/gap-analysis` reads it for orientation. `/research` writes durable findings here. `/synthesize` updates domain models here. `/confirm` flags knowledge that didn't hold up in practice.

## What Goes Here vs. Pipeline

| Content | Location | Why |
|---------|----------|-----|
| "Perplexity Sonar API costs $5/1K queries" | `knowledge/technical/` | Durable fact, reusable across cycles |
| "We should build Foursquare integration next" | `pipeline/3-synthesis/` | Cycle-specific decision, may change |
| "FAQ schema reduces AI citations by 14%" | `knowledge/scoring/` | Evidence-based finding, affects scoring model |
| "Gap #3: PDF not persisted" | `pipeline/1-gap-analysis/` | Cycle-specific gap, resolved when built |
| "BrightLocal added AI visibility in Q4 2025" | `knowledge/competitors/` | Durable competitive intelligence |

## Anti-Patterns

- Don't duplicate CLAUDE.md here. CLAUDE.md is for settled architectural decisions. Knowledge is for domain understanding.
- Don't store task lists or build plans. Those are pipeline artifacts.
- Don't create knowledge files for things you can verify by reading the codebase. Knowledge is for external/domain information.
