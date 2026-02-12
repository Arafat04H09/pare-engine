# FAQ Schema Impact on AI Citations

> **Confidence:** high
> **Last verified:** 2026-02-11
> **Source:** SE Ranking 129K domain study, SearchVIU controlled test (Oct 2025), Google Search Central, Search Roundtable, cross-referenced with 10+ practitioner sources
> **Updated by:** research thread-2 -- 2026-02-11

## Key Finding

**FAQ schema is NOT causally harmful to AI citations.** The SE Ranking 129K domain study (3.6 avg citations with FAQ schema vs 4.2 without) is confounded: FAQ schema disproportionately appears on simpler support/product pages that independently earn fewer citations. The study authors themselves acknowledge this confounder. Their XGBoost predictive model actually treats FAQ *absence* as a negative signal, contradicting the raw averages.

**FAQ schema is also NOT meaningfully beneficial for AI citation.** AI engines (ChatGPT, Claude, Perplexity) do not read JSON-LD during content retrieval. The SearchVIU "GEO Bears" controlled test (October 2025) definitively showed that information present only in JSON-LD was not extracted by any tested AI system. FAQ schema's only path to impact is indirect, via Google's indexing pipeline feeding into AI Overviews.

**FAQ *content format* (Q&A text under clear headings) IS beneficial.** AI engines extract visible text and parse it by structure. Question-answer pairs in 40-60 word answers under H2/H3 headings are genuinely helpful for AI extraction, regardless of whether FAQPage schema markup is present.

## The "3.2x" Claim is Unreliable

Multiple marketing blogs claim "pages with FAQPage markup are 3.2x more likely to appear in AI Overviews." This statistic appears to be a misattribution. The original Search Engine Land article attributes "3.2x" to **content freshness** (content updated within 30 days earns 3.2x more citations), not FAQ schema. The FAQ-specific claim has no traceable original study with disclosed methodology.

## Google's FAQ Schema Policy Timeline

| Date | Change |
|------|--------|
| Aug 2023 | Google restricted FAQ rich results to authoritative government and health websites |
| Aug-Sep 2023 | HowTo rich results deprecated on mobile, then desktop |
| Dec 2025 | FAQ schema documentation still exists on Google Search Central but is marked as restricted |
| Jun 2025 | 7 structured data types retired (Book Actions, Course Info, Claim Review, Estimated Salary, Learning Video, Special Announcement, Vehicle Listing) — FAQ was NOT among them |

FAQ schema is not deprecated — it is still valid markup. But its SERP visibility benefit is effectively zero for non-government/health sites.

## How Schema Actually Works for AI Citations

The SearchVIU controlled test (Oct 2025) and the Mark Williams-Cook test established:

1. **AI engines do NOT read JSON-LD during direct page retrieval.** ChatGPT, Claude, Perplexity all extract visible text from HTML.
2. **ChatGPT and Perplexity treat structured data as plain text** — they read it like any other text on the page, without special parsing.
3. **Gemini (Google) is the only engine that partially executes JavaScript during retrieval** — found 50% of test prices.
4. **Schema works via the indexing pipeline**: Google crawls JSON-LD -> stores in Knowledge Graph / index -> AI Overviews query the index. This is an indirect path.
5. **Entity-linking schemas** (Organization + sameAs) help most because they feed entity disambiguation in Google's Knowledge Graph.

## Implications for Pare Scoring

1. **Remove FAQPage from "required" schema types.** It provides no direct AI citation benefit.
2. **Score FAQ content format under Content Quality**, not Schema. Reward extractable content (concise Q&A, fact-dense answers under clear headings), not markup.
3. **Reframe Schema pillar as "Entity & Structured Data."** Prioritize Organization + sameAs, Article (with dateModified/author), Product — schemas that feed entity recognition and metadata signals.
4. **FAQ generator tool should produce great Q&A content**, not FAQPage schema. The content format is what helps; the markup is neutral.
5. **Keep HowTo out of scoring entirely** — deprecated by Google since 2023.

## Minimum Effective Schema Set (Tiered)

| Tier | Schema Type | Why |
|------|------------|-----|
| **Always** | Organization + sameAs (Wikipedia, Wikidata, LinkedIn, Crunchbase) | Entity disambiguation. Highest-impact schema for AI via indexing. |
| **Always** | Article/BlogPosting (dateModified, author, publisher) | Feeds freshness + authorship signals — both confirmed citation factors |
| **If applicable** | Product (offers, aggregateRating, brand) | Enables AI comparison engines, shopping results |
| **If applicable** | LocalBusiness (NAP, geo, openingHours) | Essential for local businesses, cross-references GBP |
| **If applicable** | Review/AggregateRating | Social proof signals in index |
| **Neutral** | FAQPage | Not harmful, not helpful. Keep if already implemented, don't add for AI purposes |
| **Skip** | HowTo | Deprecated by Google |
| **Skip** | BreadcrumbList | No AI citation evidence |

## Open Questions

- Does dateModified in Article schema feed citation decisions, or is it the visible "Last updated" text?
- How quickly do AI systems reflect schema changes (latency of indirect indexing path)?
- Is there a point of diminishing returns for entity linking?
- Would the entity-linking benefit generalize specifically to B2B SaaS (evidence is from healthcare, finance, mixed B2B)?

## Sources

- [SE Ranking: Ranking Factors for ChatGPT (129K domains)](https://seranking.com/blog/ranking-factors-for-chatgpt/) -- observational study, FAQ finding confounded by page type
- [SEJ: Top Factors Influencing ChatGPT Citations](https://www.searchenginejournal.com/new-data-top-factors-influencing-chatgpt-citations/561954/) -- coverage of SE Ranking study, highlights confounder
- [SearchVIU: Schema Markup and AI in 2025](https://www.searchviu.com/en/schema-markup-and-ai-in-2025-what-chatgpt-claude-perplexity-gemini-really-see/) -- controlled test: AI engines don't read JSON-LD during retrieval
- [Search Roundtable: ChatGPT/Perplexity Structured Data as Text](https://www.seroundtable.com/chatgpt-perplexity-structured-data-text-40862.html) -- independent test confirming no special schema parsing
- [Google Search Central: FAQ/HowTo Changes (Aug 2023)](https://developers.google.com/search/blog/2023/08/howto-faq-changes) -- official policy restricting FAQ rich results
- [Schema App: Entity Linking Case Study](https://www.schemaapp.com/schema-markup/case-study-entity-linking-increases-aio-visibility/) -- +19.72% AI Overview visibility (observational, own site + 1 customer)
- [Schema App: What 2025 Revealed About AI Search and Schema](https://www.schemaapp.com/schema-markup/what-2025-revealed-about-ai-search-and-the-future-of-schema-markup/) -- InSinkErator +69% clicks, entity linking emphasis
- [Schema App: Scaling Entity Linking](https://www.schemaapp.com/schema-markup/measurable-impact-of-scaling-entity-linking-for-entity-disambiguation/) -- 60+ enterprise accounts tested
- [Search Engine Land: FAQ Schema Rise and Fall](https://searchengineland.com/faq-schema-rise-fall-seo-today-463993) -- timeline of FAQ schema decline
- [Frase.io: FAQ Schemas for AI Search](https://www.frase.io/blog/faq-schema-ai-search-geo-aeo) -- pro-FAQ argument (weak methodology, no original source for 3.2x claim)
