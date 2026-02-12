# AI Citation Factors — What Drives AI Engine Citations

> **Confidence:** high
> **Last verified:** 2026-02-11
> **Source:** GEO discipline research thread (agent a37ced5), cross-referencing SE Ranking (129K domains), Yext (6.8M citations), NOVASTACKS, arXiv GEO paper
> **Updated by:** research — 2026-02-11

## Confirmed Factors (Data-Backed)

Ranked by evidence strength and measured impact:

| # | Factor | Impact | Source |
|---|--------|--------|--------|
| 1 | **Referring domains / backlinks** | 3.5x more likely to be cited with 32K+ domains. Sites with 350K+ domains avg 8.4 citations vs 1.6-1.8 for <2,500 | SE Ranking 129K domain study |
| 2 | **Content freshness** | 95% of ChatGPT citations from content <10 months old. 76.4% of most-cited pages updated within 30 days. "Last updated" timestamps = 1.8x more citations | NOVASTACKS, Seer Interactive, arXiv:2509.11353 |
| 3 | **Brand search volume / mentions** | Strongest correlation (0.664) with AI Overview appearances. 0.334 correlation with AI citations overall | Exposure Ninja, ConvertMate |
| 4 | **Domain traffic** | 10M+ visitors: 8.5 citations avg vs ~2 for low-traffic | NOVASTACKS |
| 5 | **Content length and depth** | 2,900+ words: 5.1 citations avg vs 3.2 for <800 words | NOVASTACKS |
| 6 | **Page speed** | FCP <0.4s: 6.7 citations avg vs 2.1 for FCP >1.13s (3.2x diff) | NOVASTACKS |
| 7 | **Third-party editorial mentions** | 86% of citations from sources brands already control, but editorial mentions dramatically increase cross-platform citation probability | Yext 6.8M citation study |

## Nuanced Factors (Partially Supported)

| Factor | Evidence | Caveat |
|--------|----------|--------|
| **Schema/JSON-LD** | Boosts citation chances 30-36% via indexing phase, NOT direct retrieval. Entity linking +19.72% AIO visibility | FAQ schema actually HURTS (-14%: 3.6 avg vs 4.2 without). Organization + sameAs + Product schema help |
| **Extractable content format** | Fluency optimization +15-30% visibility. Statistics +41%. Quotations +28% | Format should be 40-60 word summaries under H2 headings, NOT rigid FAQ schema |
| **Review signals** | Google confirmed quality/quantity/recency affect local rankings. Review velocity, response rate, keyword mentions matter | More qualitative evidence than quantitative |

## Speculated Factors (Limited Evidence)

| Factor | Reality |
|--------|---------|
| **llms.txt** | No quantitative evidence it improves citations. Theoretically logical. |
| **Citation virtuous cycle** | Theory that being cited by one AI helps with others is logical but unproven |
| **Social media presence** | No direct evidence. May contribute to brand mentions indirectly |
| **XML sitemap for AI** | No evidence AI crawlers use sitemaps like traditional crawlers |
| **Keyword optimization for AI** | Topic targeting matters, keywords don't |

## Critical Finding: FAQ Schema Hurts

Pages WITH FAQ schema received fewer citations (3.6 avg) than pages without (4.2 avg) in the SE Ranking study. The key is **extractable content format** (short answer summaries under clear headings) not rigid FAQ schema.

## Open Questions

- Does llms.txt actually improve citation rates? No quantitative evidence yet.
- How fast does the "citation cliff" drop off? 95% at <10 months, but what's the curve shape?
- Does AI citation create a virtuous cycle (cited → more visible → cited more)?
- How will AI ads (Google Direct Offers, ChatGPT shopping) affect organic citations?

## Sources

- [NOVASTACKS: What Drives AI Citations (129K domains)](https://www.novastacks-ai.com/aeo/what-drives-ai-citations)
- [Yext AI Visibility Study (6.8M citations)](https://www.yext.com/blog/2025/10/ai-visibility-in-2025-how-gemini-chatgpt-perplexity-cite-brands)
- [arXiv GEO Paper (Aggarwal et al., 2023)](https://arxiv.org/abs/2311.09735)
- [Seer Interactive: AI Brand Visibility & Content Recency](https://www.seerinteractive.com/insights/study-ai-brand-visibility-and-content-recency)
- [arXiv: LLM Recency Bias Study](https://arxiv.org/abs/2509.11353)
- [Schema App: Entity Linking Case Study](https://www.schemaapp.com/schema-markup/case-study-entity-linking-increases-aio-visibility/)
- [SearchVIU: Schema Markup & AI in 2025](https://www.searchviu.com/en/schema-markup-and-ai-in-2025-what-chatgpt-claude-perplexity-gemini-really-see/)
- [Search Roundtable: ChatGPT/Perplexity Structured Data](https://www.seroundtable.com/chatgpt-perplexity-structured-data-text-40862.html)
- [Exposure Ninja AI Search Statistics 2026](https://exposureninja.com/blog/ai-search-statistics/)
- [ConvertMate AI Visibility Study 2026](https://www.convertmate.io/research/ai-visibility-2026)
