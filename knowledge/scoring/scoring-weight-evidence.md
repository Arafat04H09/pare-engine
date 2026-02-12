# Scoring Weight Evidence — Data vs Current Model

> **Confidence:** high
> **Last verified:** 2026-02-11
> **Source:** Cross-referenced SE Ranking (129K domains), Yext (6.8M citations), arXiv GEO paper, NOVASTACKS, multiple case studies
> **Updated by:** research — 2026-02-11

## Current Model (CLAUDE.md canonical)

```
AI Visibility:           30 points
Content Quality:         30 points
Schema/Structured Data:  15 points
Technical Readiness:     10 points
Local/GBP + 3rd Party:  15 points
Total:                  100 points
```

**Note:** Per CLAUDE.md, scoring weights are "stable" — changes require user discussion. This file documents the evidence, not a recommendation to change silently.

## Evidence-Based Assessment Per Pillar

### AI Visibility (30) — Well-supported

- Brand search volume shows strongest correlation (0.664) with AI Overview appearances
- Platform-specific monitoring is critical (only 11% domain overlap between ChatGPT and Perplexity)
- **Suggested refinement:** Break into platform-specific subscores (ChatGPT, Gemini, Perplexity) rather than one aggregate score

### Content Quality (30) — Well-supported

Key evidence:
- Fact density / statistics: +41% visibility (arXiv GEO paper)
- Expert quotations: +28% visibility (arXiv GEO paper)
- Fluency/readability: +15-30% visibility (arXiv GEO paper)
- Content length >2,900 words: 5.1 citations avg vs 3.2 for <800 words
- Content freshness: 1.8x more citations with visible update timestamps
- **Suggested refinement:** Emphasize extractable format (40-60 word summaries under H2s), fact density, and freshness over keyword optimization

### Schema/Structured Data (15) — Evidence suggests overweighted

Key findings:
- JSON-LD is NOT read during direct content retrieval (Oct 2025 test)
- Schema helps indirectly via indexing phase: +30-36% citation boost
- **FAQ schema actually hurts** (3.6 avg citations with vs 4.2 without)
- Entity linking (Organization + sameAs) +19.72% AI Overview visibility
- **Suggested refinement:** Reduce to 10-12. Reframe as "Entity & Structured Data." Score Organization + sameAs + Product schema, NOT FAQ schema.

### Technical Readiness (10) — Evidence suggests underweighted

Key findings:
- Page speed FCP <0.4s: 6.7 citations avg vs 2.1 for FCP >1.13s (3.2x difference!)
- This is one of the largest measurable impacts in the citation data
- **Suggested refinement:** Increase to 12-15. Page speed as a major subfactor.

### Local/GBP + 3rd Party (15) — Well-supported but needs vertical variants

For local businesses:
- GBP signals (reviews, NAP consistency) confirmed important
- Review velocity, response rate, keyword mentions matter more than total count
- Top-ranking businesses: 50-200+ reviews with 4.3+ average rating

For B2B SaaS:
- Completely different signals: G2, Crunchbase, technical docs, editorial roundups
- 73% of B2B buyers use AI tools in research
- Technical documentation gets 3x more AI citations than marketing pages
- **Suggested refinement:** Keep at 15, but create B2B variant that replaces local signals with G2/Crunchbase/editorial mentions

## Potential Revised Weights (For Discussion)

| Pillar | Current | Evidence Suggests | Rationale |
|--------|---------|-------------------|-----------|
| AI Visibility | 30 | 30 (with platform subscores) | Well-supported at this level |
| Content Quality | 30 | 30 (reframe subfactors) | Extractable format + freshness + fact density |
| Schema/Structured Data | 15 | 10-12 | FAQ schema hurts. Entity schema helps but indirectly |
| Technical Readiness | 10 | 12-15 | Page speed has 3.2x citation impact |
| Local/GBP + 3rd Party | 15 | 15 (with vertical variants) | Needs B2B SaaS variant |

## Case Study Results (What Moves Scores in Practice)

| Intervention | Measured Impact | Source |
|-------------|-----------------|--------|
| Cornerstone content (fact-dense, 5-8 pages) | +43% AI traffic in 90 days | Go Fish Digital |
| Semantic SEO + modular content (42 pages in 3 months) | +8,337% AI visibility | The Rank Masters |
| Systematic optimization | +300% AI mentions | Geneo |
| B2B SaaS optimization | 15% of sales calls from ChatGPT within 2 months | Maximus Labs |
| B2B SaaS optimization (broader) | 8% of total signups from LLMs, some seeing 25% of pipeline | GrackerAI |

## Open Questions

- Should we add a "Content Freshness" sub-pillar or embed it in Content Quality?
- Should page speed be its own scoring component given the 3.2x impact?
- How should we weight the different platforms in AI Visibility? By market share? By conversion rate?
- Should B2B SaaS be a separate scoring profile or a variant of the same model?

## Sources

- [NOVASTACKS: What Drives AI Citations](https://www.novastacks-ai.com/aeo/what-drives-ai-citations)
- [arXiv GEO Paper](https://arxiv.org/abs/2311.09735)
- [Yext AI Visibility Study](https://www.yext.com/blog/2025/10/ai-visibility-in-2025-how-gemini-chatgpt-perplexity-cite-brands)
- [Go Fish Digital Case Study](https://gofishdigital.com/blog/generative-engine-optimization-geo-case-study-driving-leads/)
- [The Rank Masters Case Study](https://www.therankmasters.com/blog/generative-engine-optimization-geo-case-study-trm-chatgpt)
- [Schema App: Entity Linking Case Study](https://www.schemaapp.com/schema-markup/case-study-entity-linking-increases-aio-visibility/)
- [Search Roundtable: ChatGPT/Perplexity Structured Data](https://www.seroundtable.com/chatgpt-perplexity-structured-data-text-40862.html)
