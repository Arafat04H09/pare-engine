# Pare Engine: Competitive Research & Architecture Analysis

## Layer 1: Competitive Teardown

We analyzed the top tools utilized by solo consultants and agencies. The market is bifurcated between "Monitoring/Observation" tools (low complexity, high margin) and "Heavy Operations" tools (high complexity, lower margin).

| Tool | Core Value Prop | Data Sources | Complexity | Rebuildable? |
| :--- | :--- | :--- | :--- | :--- |
| **Otterly** | "What does AI say about me?" (Brand Monitoring) | LLM APIs (ChatGPT, Perplexity), SERP APIs | **Low** | **Yes (Trivial)** |
| **ZipTie** | "Why am I not indexed?" (Technical GEO) | Google Search Console, Site Crawler, SERP APIs | **Moderate** | **Yes** |
| **Geoptie** | "How optimized is my content?" (Content Scoring) | LLM Analysis of text vs. keywords | **Low** | **Yes (Trivial)** |
| **Nightwatch** | "Where do I rank?" (Traditional SEO) | Scraped Google SERPs (at scale) | **High** | No (Hard to scale) |
| **BrightLocal** | "Fix my citations" (Local SEO) | Aggregator APIs (Data Axle, etc.) | **High** | No (Ops heavy) |
| **GoHighLevel** | "Run my entire agency" (CRM/Ops) | Email, SMS, Landing Pages, Snapshots | **Very High** | No |
| **Vendasta** | "White-label marketplace" | Third-party integrations | **High** | No |
| **Semrush** | "All-in-one SEO data" | Proprietary crawling/clickstream data | **Very High** | No |

**Key Insight:** The "GEO Monitoring" tools (Otterly, ZipTie, Geoptie) are charging $30-$200/mo for what is essentially a **wrapper around LLM APIs**. They input a brand/keyword, query Perplexity/ChatGPT, and visualize the output. This is the "high leverage" zone for Pare to replicate.

---

## Layer 2: Reverse Engineering Targets

We identified the top 10 "Rebuildable" features that deliver 80% of the value of $200+/mo tools.

| Rank | Feature | Source Tool | Est. Build Effort | Revenue Impact | Technical Path |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **AI Visibility Score** | Otterly / ZipTie | 2 Days | High | Perplexity Sonar API + OpenAI (GPT-4) queries. Count mentions/citations. |
| **2** | **"Share of Voice" Tracking** | Otterly | 2 Days | High | Scheduled Cron Job -> LLM API -> Database. Chart results over time. |
| **3** | **Content Optimization Checker** | Geoptie / Surfer | 3 Days | High | Firecrawl (fetch content) -> LLM Prompt ("Analyze this text against these keywords"). |
| **4** | **Technical GEO Audit** | ZipTie | 4 Days | Med | Crawler -> Check for `llms.txt`, Schema, Robots.txt, JS rendering issues. |
| **5** | **Sentiment Analysis** | Otterly | 1 Day | Med | Pass LLM output to a lightweight classifier (or ask the LLM itself). |
| **6** | **Citation Tracking** | BrightLocal (Lite) | 5 Days | Med | Google Custom Search API / Serper.dev looking for NAP consistency. |
| **7** | **Competitor Comparison** | Otterly | 2 Days | High | Run the "Visibility Score" loop for 3 competitors. Display side-by-side. |
| **8** | **Review Summarization** | Birdeye (Lite) | 2 Days | Low | Scrape GMB Reviews -> LLM Summarizer ("What do people hate about this business?"). |
| **9** | **Schema Validator** | Schema.org Tools | 3 Days | Med | Crawl -> Extract JSON-LD -> Validate against Google's Rich Result rules. |
| **10** | **Keyword to Question Converter** | AnswerThePublic | 2 Days | Low | LLM Prompt ("Turn keyword 'dentist' into 20 questions users ask AI"). |

---

## Layer 3: Competitive Gaps (The "Null Space")

What are consultants complaining about? Where is the friction?

1.  **"Data Dumping" vs. Actionable Plans:**
    *   *Complaint:* Tools like Semrush and Nightwatch dump thousands of rows of data ("You have 4,000 backlinks").
    *   *Opportunity:* **The "Fix It" Button.** Don't just show the score. Generate the code (JSON-LD, HTML, `llms.txt`) to fix it. This is Pare's core differentiator.

2.  **The "Agency Tax" on Reporting:**
    *   *Complaint:* Reporting takes 5-10 hours/month per client. Manual copy-pasting from GSC, Analytics, and Rank Trackers into bespoke slides.
    *   *Opportunity:* **One-Click "Consultant Grade" Reports.** Generate a beautiful, branded PDF that *looks* like it took 10 hours, instantly. "Lead with fear, follow with hope."

3.  **Complexity for Small Biz:**
    *   *Complaint:* Enterprise tools (BrightEdge, Enterprise SEO) are too complex for a dentist or HVAC owner.
    *   *Opportunity:* **Simple, Binary Metrics.** "AI Readiness Score: 23/100". "You are Invisible." Simple narratives that sell.

4.  **No "Feedback Loop" for Implementation:**
    *   *Complaint:* "I optimized the site, but did it work?"
    *   *Opportunity:* **The Verification Loop.** Run the audit, apply the fix, run the audit again immediately. Show the "Before/After" delta.

5.  **Lack of "Agentic" Preparation:**
    *   *Complaint:* No tools are talking about "Agent Commerce" (AI buying on behalf of users).
    *   *Opportunity:* **Commerce Readiness.** specific checks for Product schema, pricing transparency, and API accessibility for future AI agents.

---

## Layer 4: Integration Architecture & Build Sequence

Based on the existing codebase (`packages/core`, `site-crawler`, `report-generator`) and the research above, here is the optimal build path.

### Phase 1: The "Visibility Engine" (Foundation)
*Goal: Replicate Otterly's core monitoring capability.*
1.  **Refine `site-crawler`:** Move from Playwright to **Firecrawl** (or robust Puppeteer) for reliable text extraction. We need "LLM-ready" markdown.
2.  **Build `query-engine`:** Integrate **Perplexity Sonar API** and **OpenAI**. Create the "Search" primitive: `checkVisibility(brand, keyword) -> { mentioned: boolean, sentiment: string, sources: list }`.
3.  **Database:** Store `Snapshots` of visibility over time.

### Phase 2: The "Audit Core" (The Product)
*Goal: Create the "Sales Asset" (The Audit PDF).*
1.  **Scoring Logic (`core`):** Implement the 5-Pillar Algorithm.
    *   *Inputs:* Crawl Data + Visibility Data.
    *   *Output:* 0-100 Score.
2.  **Report Generator (`report-generator`):** Move from `react-pdf` to **HTML + Puppeteer**.
    *   *Why:* Better styling (Tailwind), easier to debug, reusable for web UI later.
    *   *Template:* Create the "9-Page Consultant Report" template.

### Phase 3: The "Fixer" (Differentiation)
*Goal: Automate the implementation.*
1.  **Schema Generator:** LLM pipeline to take `Crawl Data` -> `Valid JSON-LD`.
2.  **Content Rewriter:** Pipeline to take `Weak Content` -> `Answer-Engine Ready Content`.
3.  **Artifact Generation:** Output `llms.txt` and `robots.txt` files for the user to upload.

### Integration Order
1.  **`site-crawler`** (Data In)
2.  **`query-engine`** (Analysis)
3.  **`core/scoring`** (Synthesis)
4.  **`report-generator`** (Output)
