# Market Research & Technical Discovery (Analysis 5)

## Layer 1: Competitive Teardown

We focused on tools that solo consultants actually pay for—specifically those charging premium rates ($99-$499/mo) for functionality that is largely data aggregation + reporting.

| Tool | Monthly Price | Core Value Prop | Data Source | Technical Complexity | Rebuild Difficulty |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Otterly.ai** | $29 - $489 | "See what ChatGPT/Gemini says about you." Tracks brand mentions in AI answers. | SERP APIs (AI Overview), Direct LLM prompting | Low. Query dispatcher + response parser + dashboard. | **Trivial** |
| **ZipTie.dev** | $99 - $799 | "GEO Monitoring + Indexing." Checks if URL is indexed by AI bots + visibility score. | Google Indexing API, SERP APIs, Custom Crawlers | Moderate. Needs robust crawling infra for "indexing" checks. | **Moderate** |
| **Geoptie** | $49 (Beta) | "All-in-one GEO." Monitoring + basic content audit. | SERP APIs, NLP analysis of content. | Low/Moderate. Standard SEO audit logic applied to AI. | **Easy** |
| **BrightLocal** | $60 - $90+ | "Local SEO Reporting." Rank tracking, citations, reviews. | Local Data Aggregators, GBP API, SERP APIs. | Moderate. value is in the *history* and *integrations*, not deep tech. | **Hard** (due to ecosystem) |
| **Nightwatch** | $39 - $369 | "Accurate Rank Tracking." Local rank tracking down to zip code. | Distributed proxy networks, scraping. | High. Maintaining proxy networks is painful. | **Hard** |
| **GoHighLevel** | $97 - $497 | "Agency Operating System." CRM, funnels, automation. | AWS SES/Twilio wrappers, page builders. | Very High. It's a massive CRUD app suite. | **Impossible** (Don't try) |

**Conclusion:** **Otterly.ai** and **Geoptie** are the primary targets. They charge high premiums ($200+/mo for decent limits) for what is essentially: `Input Keyword` -> `Fetch AI Answer` -> `Check for Brand Name` -> `Report`.

---

## Layer 2: Reverse Engineering Targets

We can replicate the 80% value prop of the "Trivially Rebuildable" tools using off-the-shelf APIs and our existing architecture.

### Top Reverse Engineering Targets (Ranked by Leverage)

1.  **The "AI Visibility" Checker (Otterly Clone)**
    *   **Value:** "Am I visible in ChatGPT?"
    *   **Build Path:** `DataForSEO API` (AI Overview endpoint) + `OpenAI API` (with browsing).
    *   **Logic:** Query "Best dentist in [City]" -> Parse output for client name -> Score 1/0.
    *   **Cost:** ~$0.01 per query vs charging $100+/mo.

2.  **The "Crawlability" Auditor (ZipTie Lite)**
    *   **Value:** "Can AI bots actually read my site?"
    *   **Build Path:** `Firecrawl` (scrape) + `Robots.txt parser`.
    *   **Logic:** Check `robots.txt` for `GPTBot`, check `llms.txt`, render page with JS and compare to raw HTML (hydration check).

3.  **The "Competitor Intercept" Tool**
    *   **Value:** "Who is winning instead of me?"
    *   **Build Path:** `DataForSEO API` -> Extract all entities from the AI answer -> List them as competitors.

4.  **The "Citation Map"**
    *   **Value:** "Where does ChatGPT get its info?"
    *   **Build Path:** Parse the "Citations" / "Sources" array from `Perplexity` / `Bing Chat` responses.

5.  **The "Schema Validator"**
    *   **Value:** "Does Google understand my services?"
    *   **Build Path:** `Firecrawl` (extract) -> `Zod` schema validation. Existing SEO tools do this, but we focus strictly on *AI-relevant* schema (Service, Product, FAQ).

### Powering APIs
*   **DataForSEO:** The backbone. Offers specific "AI Overview" SERP endpoints (~$0.01/task).
*   **SerpApi:** Alternative backbone. Reliable `google_ai_overview` engine.
*   **Firecrawl:** For client site analysis. Replaces building our own Puppeteer farm.
*   **Vercel AI SDK:** For standardizing calls to Perplexity/OpenAI/Gemini.

---

## Layer 3: Competitive Gaps (Null Space)

What are solo consultants complaining about? What are the tools missing?

1.  **"Diagnosis without Cure"**: Otterly and ZipTie tell you *that* you are invisible. They don't tell you *why* (specifically) or *how to fix it*. They are monitoring tools, not consulting tools.
    *   *Opportunity:* Pare generates the **fix** (e.g., the exact JSON-LD code to paste, the exact `llms.txt` file).

2.  **"Agency Bloat"**: Tools like GoHighLevel or SEMrush are built for teams. Solo operators complain about "too many clicks," "confusing dashboards," and "paying for features I don't use."
    *   *Opportunity:* A "Run Once" workflow. Input Domain -> Get PDF -> Send Invoice. No dashboards to manage.

3.  **"The Implementation Gap"**: Clients don't want a report; they want results. Consultants struggle to translate "You need schema" into "Here is the schema file."
    *   *Opportunity:* Automated asset generation. We don't just audit; we produce the artifacts (files) ready for upload.

4.  **"Pricing Fatigue"**: "Why do I need Ahrefs ($99) + Otterly ($189) + ChatGPT Team ($30)?"
    *   *Opportunity:* Pay-per-audit model or "All-in-one Audit" that uses API credits, costing the operator $2 to run but sold for $500.

5.  **"Client-Facing Fear"**: Consultants fear showing raw data to clients because it might look bad or be confusing.
    *   *Opportunity:* Highly curated, "Sales-Ready" PDF reports. Not a dashboard dump, but a persuasive narrative.

---

## Layer 4: Integration Architecture

Based on the `packages/` folder and this research, here is the highest-leverage build order.

### 1. Consolidate & Refine Core (`packages/core`)
*   **Why:** We need a shared understanding of "What is a GEO Score?" before building tools.
*   **Action:** Define the `AuditResult` and `ScoringCriteria` types strictly. Move shared schema (Zod/Drizzle) here.

### 2. The "Eye" - Switch to Firecrawl (`packages/site-crawler`)
*   **Why:** Writing a custom crawler (currently in `site-crawler`) is a black hole of maintenance. Firecrawl handles JS rendering, anti-bot, and markdown conversion.
*   **Action:** Replace `puppeteer` logic with `Firecrawl` API calls. This captures the "Layer 2" value of "Crawlability" checks immediately.

### 3. The "Brain" - Multi-LLM Querying (`packages/query-engine`)
*   **Why:** We need to ask Perplexity, Google, and ChatGPT the same question to compare results.
*   **Action:** Use Vercel AI SDK to standardize requests. Integrate **DataForSEO** here for the "Google AI Overview" specific data (which standard LLM APIs don't give).

### 4. The "Mouth" - HTML-to-PDF Reporting (`packages/report-generator`)
*   **Why:** The "Null Space" opportunity is *sales-ready reports*.
*   **Action:** Ditch React-PDF. Use a simple HTML template + Puppeteer to generate beautiful, branded PDFs. This is the "product" the consultant sells.

### Build Sequence Summary
1.  **Infrastructure:** Set up Firecrawl + DataForSEO keys.
2.  **Crawler:** Implement "Extract Content" + "Extract Schema" using Firecrawl.
3.  **Analyzer:** Build the logic that compares *Extracted Content* vs *Competitor Content*.
4.  **Reporter:** Build the PDF generation pipeline.

This sequence prioritizes the **hardest technical challenges** (getting reliable data) first, then wraps it in the value layer (reporting).
