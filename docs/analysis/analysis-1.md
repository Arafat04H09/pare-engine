# Pare Engine: Deep Research Analysis

## Layer 1: Competitive Teardown

We analyzed the top tools used by solo consultants and agencies. The market is bifurcated into "Legacy SEO/Agency Management" (red ocean) and "AI Visibility/GEO" (blue ocean).

| Tool | Monthly Cost (Agency) | Core Value Prop | Data/Tech Source | Complexity to Replicate | Verdict |
|------|----------------------|-----------------|------------------|-------------------------|---------|
| **GoHighLevel** | $297 - $497 | All-in-one agency OS (CRM, Sites, Automations) | Twilio (Comms), SendGrid (Email), Custom Builders | **Hard** (Massive surface area) | **Ignore.** Too big to kill. Integrate with it instead. |
| **BrightLocal** | $29 - $90 + fees | Local SEO citations & reputation | Data aggregators (Data Axle, Neustar), Google Maps API | **Trivial** (Aggregator wrapper) | **High leverage target.** Wrapper around commodity APIs. |
| **Vendasta** | $499 - $999 | White-label marketplace & fulfillment | Marketplace of 3rd party vendors | **Moderate** (Business logic heavy) | **Partial target.** "Snapshot Report" is easily rebuildable. |
| **Otterly.ai** | $29 - $189 | AI Visibility Monitoring | LLM APIs + SERP APIs | **Trivial** (API Wrapper) | **Primary target.** It's just prompts + charts. |
| **ZipTie** | $69 - $799 | AI Overview tracking & optimization | Google Search Console + Custom scraping | **Moderate** (Scraping is fragile) | **Primary target.** High price for diagnosis-only. |
| **Geoptie** | Free (Beta) | GEO Audit & Content Checks | NLP libs + LLM APIs | **Trivial** | **Direct competitor.** Logic is simple to replicate. |
| **Duda** | $44 - $149 | White-label website builder | Custom proprietary builder | **Hard** | **Ignore.** Don't build a site builder. |

## Layer 2: Reverse Engineering Targets

Ranked by **Revenue Leverage vs. Build Effort**. We want high-price tools that are essentially "API Wrappers + UI".

1.  **Otterly.ai / ZipTie (The "AI Monitor" Wrapper)**
    *   **Revenue Impact:** High ($200+/mo). Clients are terrified of AI invisibility.
    *   **The Build:** `Vercel AI SDK` (run prompts on Perplexity/GPT/Gemini) + `SerpAPI` (Google AIO) -> Store responses -> Sentiment Analysis (via GPT-4o-mini).
    *   **Effort:** Low. 2-3 weeks for MVP.
    *   **Verdict:** **Build immediately.** This is the "Audit" engine.

2.  **BrightLocal (The "Citation" Wrapper)**
    *   **Revenue Impact:** Moderate ($50-100/mo). Essential for local businesses.
    *   **The Build:** `Firecrawl` (audit existing citations) + `Google Maps API` (NAP consistency). For *building* citations, use an agency API (like WhiteSpark) or manual VAs initially.
    *   **Effort:** Very Low (for the audit part).
    *   **Verdict:** **Integrate.** Don't build the fulfillment network yet. Build the *audit* to show the gaps.

3.  **Vendasta "Snapshot Report" (The Sales Hook)**
    *   **Revenue Impact:** High (Lead Gen). This is how agencies close deals.
    *   **The Build:** Aggregation of `Lighthouse` (Speed), `Firecrawl` (Content), `Google Places` (Reviews), and our new `AI Visibility` score.
    *   **Effort:** Low. It's just a report generator.
    *   **Verdict:** **Core Feature.** This is our "Free Mini-Audit".

4.  **SEMrush "Keyword Magic" (The Consultant's Crutch)**
    *   **Revenue Impact:** Low (Utility).
    *   **The Build:** Keyword APIs (DataForSEO) are cheap.
    *   **Verdict:** **Skip.** Too commoditized. Focus on *Questions* (People Also Ask), not Keywords.

## Layer 3: Competitive Gaps (The Null Space)

Research into Reddit (`r/marketing`, `r/agency`, `r/freelance`) and forums reveals the "Null Space" where Pare Engine wins.

**1. The "Diagnosis vs. Cure" Gap (The #1 Complaint)**
*   **The Complaint:** "Otterly shows me I'm not in ChatGPT. Great. Now what?"
*   **The Reality:** Existing tools are *thermometers* (they measure the fever). Consultants need a *doctor* (prescribe and administer the cure).
*   **Pare Opportunity:** **Auto-Implementation.** Don't just report "Missing Schema". Generate the JSON-LD and provide the `copy/paste` block (or auto-inject via CMS integration).

**2. The "Solo-Scale" Gap**
*   **The Complaint:** "GoHighLevel is a beast. I spend more time configuring workflows than selling."
*   **The Reality:** Tools assume you have an "Ops Person". Solo consultants are drowning in config.
*   **Pare Opportunity:** **Opinionated Defaults.** No "drag and drop workflow builder". Just a "Run Audit -> Send Proposal" button. Hard-coded, optimized paths for the solo operator.

**3. The "AI-First" Gap**
*   **The Complaint:** "My SEO tools don't tell me why ChatGPT hates my site."
*   **The Reality:** Traditional SEO tools (Ahrefs/Semrush) track *links* and *keywords*. AI Engines care about *entities* and *facts*.
*   **Pare Opportunity:** **Entity-First Audits.** Analyze the site's `llms.txt`, `schema.org` density, and "Machine Readability" score. No competitor does this well yet.

## Layer 4: Integration Architecture & Build Order

Based on the existing `packages/` structure and the research above, here is the highest-leverage build sequence.

**Phase 1: The "Snapshot" Engine (Revenue Generator)**
*   **Goal:** Replicate Vendasta's "Snapshot Report" but for the AI Age.
*   **Build:**
    1.  **Refine `packages/site-crawler`:** Add `Firecrawl` Map/Crawl. Extract basic metadata (Title, Description, H1s).
    2.  **Build `packages/core/scoring/ai-visibility.ts`:** The "Otterly Killer". Use `AI SDK` to query Perplexity/GPT about the brand.
    3.  **Update `packages/report-generator`:** Generate the PDF "Teaser Audit".
*   **Result:** A tool that generates leads.

**Phase 2: The "Fixer" Engine (Differentiation)**
*   **Goal:** Fill the "Diagnosis vs. Cure" gap.
*   **Build:**
    1.  **Create `packages/core/schema-gen`:** A specialized module that takes business info and outputs perfect `LocalBusiness` + `Service` JSON-LD.
    2.  **Create `packages/core/content-opt`:** An analyzer that rewrites "Marketing Fluff" into "Answer-First" content (for AI snippets).
*   **Result:** The deliverables for the $3k sprint.

**Phase 3: The "Monitor" Engine (Retention)**
*   **Goal:** The monthly retainer value.
*   **Build:**
    1.  **Inngest Cron Jobs:** Schedule the Phase 1 checks weekly.
    2.  **Trend Reporting:** Show "AI Visibility Score" over time.
*   **Result:** Automated monthly reporting to justify the $1.5k/mo retainer.

**Summary:**
We are **not** rebuilding GoHighLevel. We are rebuilding the **Vendasta Snapshot Report** (for sales) and the **Otterly Monitoring Dashboard** (for retention), but gluing them together with an **Implementation Engine** (Schema/Content generators) that no competitor has.
