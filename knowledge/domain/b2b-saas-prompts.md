# B2B SaaS Query Patterns & Prompt Library Design

> **Confidence:** high
> **Last verified:** 2026-02-11
> **Source:** GrackerAI (4 articles), Maximus Labs, Averi.ai (3 articles), Goodie (5.7M citations study), MarTech (2 articles), Altair Media, G2 Report, multiple corroborating sources
> **Updated by:** research thread-1 — 2026-02-11

## Key Finding

B2B SaaS buyers use 7 distinct query categories when evaluating software through AI engines. These map to buyer journey stages and can be templated for a prompt library. The templateable unit is the query CATEGORY (stable), not the individual query (variable). Queries average 10-11 words (conversational), vs 2-3 keywords for traditional Google search. Leading visibility frameworks build 50-100 prompt sets per category.

**Market context:**
- 94% of B2B buyers used LLMs during purchase journey (2025) — G2 Report
- 67% start with AI assistants before traditional search — GrackerAI
- AI-referred buyers convert 3-5x higher than traditional SEO traffic
- Purchase decisions are 73% complete before first sales contact
- Average B2B buying cycle dropped from 11.3 to 10.1 months (2024-2025)

## Query Categories

### 1. Category Definition (TOFU — Awareness)
Buyer is understanding the space. AI engines used as education tools.

**Template:** "What is [category]?" / "Do I need [category]?" / "[category] explained for [role]"

**Examples:**
- "What is marketing attribution software?"
- "What does a customer data platform do?"
- "Do I need a revenue operations platform?"
- "Explain demand generation platforms for B2B marketing directors"

**Content cited:** Wikipedia (47.9% of ChatGPT citations), educational articles, glossary definitions, authoritative technical content.

### 2. Category Exploration / Rankings (TOFU — Research)
Buyer knows the category, exploring options. The "shortlist generation" query.

**Template:** "Best [category] for [use case]" / "Top [category] tools in [year]" / "[category] for [constraint]"

**Examples:**
- "Best project management tools for remote teams"
- "Top CRM tools for small businesses in 2026"
- "What are the top marketing automation platforms for B2B SaaS?"
- "CRM tools for companies under 50 people"
- "What's the best ATS for healthcare startups?"

**Content cited:** Third-party editorial listicles (52.9% of all citations for these queries), G2 category pages, Reddit threads, PCMag/TechRadar roundups. **Vendor websites are rarely cited directly** — near-inverse correlation (r ~ -0.98) between Google rankings and ChatGPT citations for product recommendation queries.

### 3. Head-to-Head Comparison (MOFU — Evaluation)
Buyer has a shortlist, comparing specific tools.

**Template:** "[Tool A] vs [Tool B]" / "[Tool A] vs [Tool B] for [use case]" / "[Tool] alternatives"

**Examples:**
- "HubSpot vs Salesforce for mid-market SaaS"
- "Monday.com vs Asana for engineering teams"
- "Compare Pipedrive and HubSpot CRM pricing and features"
- "Salesforce alternatives for startups"
- "Alternative to Zendesk that supports multilingual"

**Content cited:** Both owned comparison pages (if objective, with feature matrices) AND third-party reviews (G2, Capterra). 82% citation rate — second only to FAQ-format content.

### 4. Feature & Capability Deep-Dive (MOFU — Technical Evaluation)
Buyer evaluating specific capabilities before commitment.

**Template:** "Does [Tool] integrate with [system]?" / "How does [Tool] handle [requirement]?" / "[category] with [feature]"

**Examples:**
- "Does HubSpot integrate with Salesforce and Slack?"
- "What's Stripe's API rate limit for custom integrations?"
- "How does Rippling handle multi-country payroll?"
- "Vanta SOC2 compliance automation features"
- "CRM with built-in sales forecasting for SaaS"

**Content cited:** Technical documentation, API docs, integration pages, feature specification pages. Owned content dominates — only vendor has authoritative technical details. 78% citation rate. Technical docs get 3x more AI citations than marketing pages.

### 5. Pricing & Commercial (BOFU — Decision)
Buyer evaluating cost before purchase decision.

**Template:** "[Tool] pricing" / "How much does [Tool] cost for [scale]?" / "[category] pricing comparison"

**Examples:**
- "Intercom pricing for 10,000 users"
- "How much does Snowflake cost per TB?"
- "Marketing automation pricing comparison 2026"
- "Does Notion offer non-profit discounts?"
- "Mixpanel vs Amplitude — which is more cost effective?"

**Content cited:** Owned pricing pages (when transparent), G2/Capterra pricing data, third-party pricing comparison articles. If pricing is ambiguous, third-party sources fill the gap.

### 6. Implementation & Integration (BOFU — Post-Decision)
Buyer has chosen or is very close, evaluating implementation.

**Template:** "How to set up [Tool] with [system]" / "[Tool] implementation guide" / "Migrate from [Tool A] to [Tool B]"

**Examples:**
- "How to set up HubSpot with Salesforce"
- "Zapier + Slack integration setup process"
- "Workday implementation guide for 500+ employees"
- "Migrate from Mailchimp to HubSpot"
- "How long does it take to implement Netsuite?"

**Content cited:** Owned documentation, help center articles, integration guides, YouTube tutorials. Technical documentation gets 3x more AI citations than marketing pages.

### 7. Problem-Solution (Cross-Funnel)
Buyer starts with a problem, not a category. These often lead to discovery.

**Template:** "How do I [solve problem]?" / "What tools help with [challenge]?" / "How to [outcome] for [context]"

**Examples:**
- "How do I stay HIPAA compliant while scaling my sales team?"
- "What tools help reduce customer churn for SaaS?"
- "How to automate lead qualification for B2B"
- "FinTech fraud detection solution for payments"
- "Best way to solve pipeline attribution at a Series B company"

**Content cited:** Problem-solving articles in "How to..." format with 40-60 word extractable summaries under H2 headers. More long-tail use-case content = more prompts matched.

## Citation Rates by Content Type

| Content Type | Citation Rate | Notes |
|-------------|---------------|-------|
| FAQ content (Q&A format) | 89% | FAQ *content format* works; FAQ *schema markup* hurts (-14%) |
| Comparison pages | 82% | "[Tool A] vs [Tool B]" and "best alternatives" content |
| Technical documentation | 78% | Integration guides, API docs, setup guides |
| Programmatic data pages | 71% | Structured feature matrices, pricing tables |
| Case studies | 68% | Results-focused with extractable metrics |

Source: [GrackerAI](https://gracker.ai/blog/win-b2b-buyers-ai-search)

**Important distinction:** FAQ *content format* (question headings with direct answers) has 89% citation rate. FAQ *schema markup* (FAQPage JSON-LD) has -14% citation rate per SE Ranking study. Use the format, skip the schema.

## B2B SaaS Schema Requirements

### Required (Always include)

| Schema Type | Purpose | Key Properties |
|-------------|---------|----------------|
| Organization | Company identity + knowledge graph | name, url, logo, description, foundingDate, sameAs, contactPoint |
| WebApplication (browser SaaS) or SoftwareApplication (desktop) | Product definition | name, applicationCategory ("BusinessApplication"), operatingSystem ("all"), offers, aggregateRating, featureList, softwareVersion |
| AggregateRating (nested) | Social proof from G2/Capterra | ratingValue, reviewCount |

### Recommended (Include if applicable)

| Schema Type | Purpose | When |
|-------------|---------|------|
| Article/BlogPosting | Content credibility + freshness signals | Blog posts, docs (datePublished, dateModified critical — 95% of citations from <10mo content) |
| Person | Author authority, E-E-A-T | Blog posts, team pages (name, jobTitle, sameAs → LinkedIn) |
| HowTo | Implementation content in extractable steps | Guides, tutorials |
| BreadcrumbList | Site structure | All pages |

### Avoid

| Schema Type | Why |
|-------------|-----|
| FAQPage | -14% citation rate (SE Ranking), deprecated by Google (Aug 2023). Use Q&A content format instead. |
| LocalBusiness | Not applicable to B2B SaaS |
| Service | Local business schema type |

### SoftwareApplication vs WebApplication

- Use `WebApplication` for browser-accessed SaaS (Canva, MailChimp, HubSpot) — subset of SoftwareApplication
- Use `SoftwareApplication` for downloadable desktop/mobile apps (VS Code, Figma Desktop)
- Use `Product` nested inside for pricing tiers with `AggregateOffer` for subscription models
- Include `billingDuration` property (e.g., "P1M") for recurring charges

### Schema Impact Mechanism

Schema helps AI visibility through TWO indirect mechanisms:
1. **Indexing pathway:** Feeds Google Knowledge Graph, which Gemini/AI Overviews rely on (93.67% overlap with top-10 organic results)
2. **Text readability:** LLMs read JSON-LD as clean structured text — not parsed as structured data, but IS read as content

Evidence: ChatGPT and Perplexity treat JSON-LD schema as ordinary page text (SearchRoundtable). Microsoft confirmed schema helps LLMs understand content (SMX Munich, March 2025). Entity linking via Organization + sameAs = +19.72% AIO visibility (Schema App).

### sameAs Targets for B2B SaaS (ranked by citation impact)

| Platform | Importance | Rationale |
|----------|-----------|-----------|
| G2 profile | **High** | #2 most cited B2B SaaS domain (6,097 citations) |
| LinkedIn company page | **High** | Professional identity; cited by Perplexity |
| Crunchbase profile | **High** | Perplexity integrates Crunchbase API directly |
| Wikipedia page (if exists) | **High** | ChatGPT cites Wikipedia 47.9% of the time |
| Capterra profile | **Medium-High** | #4 most cited domain; #1 for Claude specifically |
| GitHub organization | **Medium** | Developer-focused SaaS; cited by Claude |
| YouTube channel | **Medium** | Cited by Perplexity; video content for tutorials |
| Twitter/X profile | **Medium** | Brand signal, indirect citation impact |
| Wikidata entry (if exists) | **Medium** | Knowledge graph connection for entity disambiguation |

## B2B SaaS Third-Party Scoring Rubric (15 points)

Replaces the Local/GBP + Third Party pillar for B2B SaaS vertical.

| Signal | Points | Criteria | Evidence |
|--------|--------|----------|----------|
| **G2 Presence & Quality** | 5 | Profile exists (1), complete profile with features/pricing/screenshots (1), 10+ reviews (1), 4.0+ avg rating (1), reviews within 90 days (1) | G2 = #2 most-cited domain (6,097 citations) + acquiring Capterra/GetApp |
| **Secondary Review Platforms** | 3 | Capterra profile + reviews (1), TrustRadius or Trustpilot (0.5), Product Hunt listing (0.5), Software Advice (0.5), GetApp (0.5) — max 3 | Capterra = #4 most cited; Claude's #1 source |
| **Crunchbase Completeness** | 2 | Profile exists with description (1), complete with funding/team/social links/recent updates (1) | Perplexity integrates Crunchbase API directly |
| **Editorial/Listicle Mentions** | 3 | Mentioned in 1+ "best of" roundups on authoritative domains (1 per mention, max 3). Check PCMag, TechRadar, Forbes, TechCrunch, Gartner | Listicles = 52.9% of category query citations |
| **Community Presence** | 2 | Reddit/community mentions in relevant subreddits (1), LinkedIn company page complete with employee activity (1) | Reddit = #1 cited domain (6,326); LinkedIn cited by Perplexity |
| **Total** | **15** | | |

**Weight rationale:**
- G2 at 5/15 (33%): #2 cited domain AND consolidating the review platform market
- Editorial at 3/15 (20%): Listicles are majority of category-query citations
- Secondary reviews at 3/15 (20%): Cross-platform presence matters (only 11% of domains cited by both ChatGPT and Perplexity)
- Crunchbase at 2/15 (13%): Direct Perplexity API integration
- Community at 2/15 (13%): Reddit #1 overall, LinkedIn for professional identity

**G2/Capterra Acquisition (Jan 2026):** G2 acquiring Capterra, Software Advice, and GetApp from Gartner. Expected to close Q1 2026. Combined: ~6M verified reviews, 200M+ annual buyers. Post-merger, scoring may need consolidation — but keep separate until domains are actually merged.

## Most-Cited Third-Party Domains in B2B SaaS AI Responses

(Goodie study, 5.7M citations, Feb-Jun 2025)

| Rank | Platform | Citations | Category | Key Citing Engines |
|------|----------|-----------|----------|--------------------|
| 1 | Reddit | 6,326 | Social/UGC | Perplexity (dominant, 46.7%), ChatGPT |
| 2 | G2 | 6,097 | Review/Affiliate | All four engines |
| 3 | PCMag | ~5,000+ | Editorial/Affiliate | Gemini (heavy), ChatGPT |
| 4 | Capterra | ~4,500+ | Review/Affiliate | Claude (#1), Gemini |
| 5 | TechRadar | ~4,000+ | Editorial | Gemini |
| 6 | Gartner | ~3,500+ | Analyst | ChatGPT, Gemini |
| 7 | Forbes | ~3,000+ | Editorial | ChatGPT |
| 8 | TechCrunch | ~2,500+ | News | ChatGPT, Perplexity |
| 9 | Wikipedia | ~2,000+ | Reference | ChatGPT (47.9% of all citations) |
| 10 | GetApp/CNET | varies | Review/Editorial | Perplexity/Claude |

"Actual brands are completely non-existent in the top 10" — AI engines cite aggregators and editorial sources for category queries.

## Implications for Pare Prompt Library

- Need 25-35 prompts across 7 categories (matching structure above)
- Prompts should be parameterized: `[category]`, `[tool]`, `[use case]`, `[company size]`, `[compliance requirement]`
- Each audit should run prompts from categories 1-4 minimum (awareness through decision)
- Categories 5-6 (pricing, implementation) are secondary for initial audit
- Category 7 (problem-solution) should be customized per client's positioning
- TOFU queries (categories 1-2) have highest citation likelihood but lowest conversion impact
- BOFU queries (categories 4-6) drive conversions but require owned content optimization
- For initial prompt library, prioritize categories 2-3-4 (exploration, comparison, capability) — highest audit value

## Open Questions

- How many prompts per category is optimal for an audit? (Currently 5 per category for local verticals = 25 total)
- Should prompt count scale with audit tier (mini vs full)?
- How to handle G2/Capterra merger in scoring logic?
- Should we score Reddit presence objectively (e.g., mentions in r/[category] subreddits)?
- Optimal "Share of Model" monitoring cadence and prompt set size?
- How to detect editorial listicle mentions programmatically?

## Sources

- [GrackerAI: Win B2B Buyers in AI Search](https://gracker.ai/blog/win-b2b-buyers-ai-search)
- [GrackerAI: B2B SaaS AEO Guide](https://gracker.ai/blog/b2b-saas-guide-answer-engine-optimization-chatgpt-search)
- [GrackerAI: AI Search Content Calendar Q1 2026](https://gracker.ai/blog/ai-search-content-calendar-b2b-saas-q1-2026)
- [GrackerAI: How AI Search Is Changing Software Buying](https://gracker.ai/blog/ai-search-software-buying-b2b)
- [Maximus Labs B2B SaaS AEO Strategies](https://www.maximuslabs.ai/answer-engine-optimizations/b2b-saas-aeo-strategies)
- [Goodie: Most Cited B2B SaaS Domains (5.7M citations)](https://higoodie.com/blog/most-cited-b2b-saas-domains-in-ai-search)
- [Averi.ai B2B SaaS Citation Benchmarks Report 2026](https://www.averi.ai/how-to/chatgpt-vs.-perplexity-vs.-google-ai-mode-the-b2b-saas-citation-benchmarks-report-(2026))
- [Averi.ai GEO Metrics Guide 2026](https://www.averi.ai/how-to/how-to-track-ai-citations-and-measure-geo-success-the-2026-metrics-guide)
- [MarTech: How ChatGPT Reshapes B2B Buyer Journey](https://martech.org/how-chatgpt-search-reshapes-the-b2b-buyers-journey/)
- [MarTech: AI Search Collapsing B2B Buyer Journey](https://martech.org/ai-search-is-collapsing-the-b2b-buyer-journey/)
- [Altair Media: AI Search & B2B SaaS Buyer Journey 2026](https://altair-media.com/posts/ai-search-zero-click-and-dark-sharing-how-the-b2b-saas-buyer-journey-is-evolving-in-2026)
- [G2 Report: AI Disrupting B2B Buying (May 2025)](https://www.businesswire.com/news/home/20250514382531/en/G2-Report-AI-Now-Means-Always-Included-Disrupting-All-Stages-of-the-B2B-Software-Buying-Journey)
- [G2 Acquires Capterra/GetApp/Software Advice (Jan 2026)](https://www.prnewswire.com/news-releases/g2-to-acquire-capterra-software-advice-and-getapp-from-gartner-302673901.html)
- [SearchRoundtable: ChatGPT/Perplexity Treat Schema as Text](https://www.seroundtable.com/chatgpt-perplexity-structured-data-text-40862.html)
- [SALT Agency: Schema for SaaS Companies](https://salt.agency/blog/schema-for-saas-companies-salt-agency/)
- [RankSight AI: SoftwareApplication Schema Guide](https://ranksightai.com/blog/software-app-schema-guide-2025)
- [Quoleady: Schema & Structured Data for LLM Visibility](https://www.quoleady.com/schema-structured-data-for-llm-visibility/)
- [Schema App: Entity Linking Case Study (+19.72% AIO)](https://www.schemaapp.com/schema-markup/case-study-entity-linking-increases-aio-visibility/)
- [SearchVIU: Schema Markup and AI in 2025](https://www.searchviu.com/en/schema-markup-and-ai-in-2025-what-chatgpt-claude-perplexity-gemini-really-see/)
- [Google Developers: Organization Schema](https://developers.google.com/search/docs/appearance/structured-data/organization)
- [Blastra: How to Get Ranked on G2](https://blastra.io/blog/how-to-get-ranked-on-g2)
- [Blastra: G2/Capterra Review Guidelines](https://blastra.io/blog/g2-capterra-review-guidelines)
- [Dan Taylor: Schema for SaaS Subscription Products](https://dantaylor.online/blog/schema-for-saas-subscription-products/)
