# Pare Engine: Strategic Analysis & competitive Teardown

## Layer 1: Competitive Teardown

We analyzed the tools solo consultants and agencies actually pay for. The pattern is clear: users pay high monthly fees for "monitoring" that is essentially an API wrapper, while complaining about the lack of actionable "fixing."

| Tool | Core Value Prop | Pricing | Data Sources (Likely) | Tech Complexity | Rebuild Rating |
|------|-----------------|---------|-----------------------|-----------------|----------------|
| **Otterly.ai** | "Rank tracking" for LLMs. Shows if you appear in ChatGPT/Perplexity. | $29 - $489/mo | OpenAI API, Perplexity API, SerpApi (for Google SGE) | Low. Cron job + LLM query + Regex parsing + Dashboard. | **Trivial** |
| **ZipTie** | Monitoring + basic "optimization" advice (content checklists). | $69 - $374/mo | SerpApi (Google SGE focus), Custom scrapers | Moderate. Adds content analysis to the monitoring loop. | **Easy** |
| **Geoptie** | "All-in-one" GEO platform. Monitoring + content studio. | $49 - $199/mo | Multi-LLM APIs, Common crawler (Playwright/Puppeteer) | Moderate. UI is the heaviest lift here. | **Easy** |
| **BrightLocal** | Local SEO reporting standard. Rank tracking + citation monitoring. | $39 - $90/mo | DataForSEO / SerpApi (or custom scraping infrastructure) | High (due to historical data & volume). Hard to beat on *price* for raw data. | **Hard** (Volume) |
| **GoHighLevel** | The "Agency OS." CRM, funnels, email, automation. | $97 - $497/mo | SMTP providers, Twilio (SMS), white-label website builders | Very High. It's a massive CRUD app + workflow engine. | **Don't Touch** |
| **Vendasta** | Marketplace for reselling other tools + basic agency admin. | $99 - $999/mo + fees | Aggregator of 3rd party APIs | High (Integration hell). | **Don't Touch** |

**Key Insight:** The "GEO" (Generative Engine Optimization) tools (Otterly, ZipTie, Geoptie) are charging premium SaaS prices ($100+/mo) for what is essentially: `Input -> LLM Query -> Parse Mention -> Save to DB`. This is the highest leverage target.

## Layer 2: Reverse Engineering Targets (Ranked)

These are the "trivially rebuildable" features that represent the highest revenue impact vs. build effort.

1.  **AI Visibility Monitor (The "Otterly Killer")**
    *   *Revenue Value:* Sells the retainer ($500-1,500/mo).
    *   *Build Path:* `Inngest Cron` -> `AI SDK (Perplexity/OpenAI/Gemini)` -> `Prompt: "Recommend 5 dentists in [City]"` -> `AI SDK generateObject (zod schema)` -> `Store Result`.
    *   *Effort:* < 2 days.

2.  **Competitor "Share of Voice" Matrix**
    *   *Revenue Value:* The "Fear" sale in the audit.
    *   *Build Path:* Same as above, but aggregate counts over 10 queries. `Winner = Count / Total Queries`.
    *   *Effort:* Part of #1.

3.  **Local "AI Grid" (BrightLocal for AI)**
    *   *Revenue Value:* Visual proof of invisible zones.
    *   *Build Path:* Loop #1 across 5 neighboring zip codes (modify prompt: "finding a dentist near [Zip Code]").
    *   *Effort:* Low (just a loop).

4.  **"Why You Lost" Analyzer (ZipTie feature)**
    *   *Revenue Value:* Justifies the sprint.
    *   *Build Path:* `Firecrawl (Competitor URL)` -> `Firecrawl (Client URL)` -> `LLM Compare`: "Why did you pick A over B?"
    *   *Effort:* Low.

5.  **Schema Gap Detector**
    *   *Revenue Value:* Technical validation.
    *   *Build Path:* `Firecrawl (Scrape)` -> `Cheerio (extract script[type="application/ld+json"])` -> `Zod Validate`.
    *   *Effort:* Trivial.

6.  **Review Sentiment Summarizer**
    *   *Revenue Value:* "What AI knows about your reputation."
    *   *Build Path:* `Google Places API (Reviews)` -> `LLM Summarize`.
    *   *Effort:* Trivial.

7.  **Content "Answer-First" Auditor**
    *   *Revenue Value:* Content optimization roadmap.
    *   *Build Path:* `Firecrawl (Service Page)` -> `LLM Evaluate`: "Does this answer 'How much is X' in the first <h1>?"
    *   *Effort:* Low.

8.  **Citation Consistency Checker**
    *   *Revenue Value:* Foundational hygiene.
    *   *Build Path:* `SerpApi (Google Search "Phone Number")` -> `Check for variance`.
    *   *Effort:* Moderate (data cleaning).

9.  **Automated "Fix It" Report**
    *   *Revenue Value:* The Deliverable.
    *   *Build Path:* `Puppeteer` -> `HTML Template` populated by data from #1-8.
    *   *Effort:* Moderate (CSS/Design).

10. **Agentic Commerce Readiness Check**
    *   *Revenue Value:* The "Future" Upsell ($5k+).
    *   *Build Path:* `Firecrawl` -> `Check for Product/Offer Schema` + `LLM Purchase Simulation`.
    *   *Effort:* Moderate.

## Layer 3: Competitive Gaps (The Null Space)

What are solo consultants complaining about?

1.  **"Vaporware / Hand-wavy Metrics":**
    *   *Complaint:* Otterly/ZipTie give a "score" but don't explain *why* it changed or *how* to fix it. "I can't sell a graph that goes down and I don't know why."
    *   *Opportunity:* **Causal Links.** "Your score dropped because Perplexity found this negative review" or "Your score rose because we added FAQ Schema."

2.  **"All Report, No Fix":**
    *   *Complaint:* "Great, I know I'm invisible. Now I have to go hire a dev to write JSON-LD?"
    *   *Opportunity:* **The "Implement" Button.** Generate the *exact* JSON-LD code, the *exact* HTML block for the FAQ, ready to copy-paste (or push via API).

3.  **"Agency Bloat" (GoHighLevel/Vendasta):**
    *   *Complaint:* "I just want to do SEO/GEO. Why am I paying $300/mo for a CRM/SMS/Email marketing suite I don't use?" "Support is terrible/non-existent."
    *   *Opportunity:* **Lean, Specialized OS.** A tool that does *one* thing (Audit -> Fix -> Verify) extremely well, with no CRM bloat.

4.  **"The Solo Scale Problem":**
    *   *Complaint:* "I can sell 5 audits, but I can't *deliver* 5 sprints without working 80 hours."
    *   *Opportunity:* **Automated Delivery Pipeline.** The software should do 80% of the fulfillment (crawl, analyze, generate schema, write content briefs). The consultant does the final 20% strategy/client comms.

5.  **"Client Confusion":**
    *   *Complaint:* Clients don't understand "LLM visibility." They understand "Competitor X is winning."
    *   *Opportunity:* **Competitor-Centric Reporting.** Every metric should be relative. "You are #4. Dr. Smith is #1. Here is exactly why Dr. Smith is winning."

## Layer 4: Integration Architecture & Build Sequence

We need to build the "Truth" layers first, then the "Reporting" layer, then the "Fixing" layer.

**Phase 1: The Truth Engine (High Leverage)**
*   **Goal:** Ability to accurately audit a domain and its visibility.
*   **Integration:** `Firecrawl` (Site Truth) + `AI SDK` (AI Truth).
*   **Why:** This powers the "Free Mini Audit" (Lead Magnet) and the "Paid Audit" (Revenue). Without this, we have nothing.
*   **Action:** Build `apps/audit-runner` to orchestrate Firecrawl -> AI SDK -> Database.

**Phase 2: The Reporter (Value Realization)**
*   **Goal:** Turn data into a branded PDF that justifies $750.
*   **Integration:** `Puppeteer` + `HTML Templates`.
*   **Why:** Data in a database is worthless to a consultant. A PDF they can email is money.
*   **Action:** Port `packages/report-generator` to Puppeteer HTML templates.

**Phase 3: The Fixer (Retention/Upsell)**
*   **Goal:** Generate the assets to solve the problems found in Phase 1.
*   **Integration:** `Core/Schema-Gen` + `Core/Content-Gen` (LLM-based).
*   **Why:** This turns a $750 audit into a $3,000 sprint. "Here is the code to fix the problems we found."
*   **Action:** Build the logic to transform `AuditResult` -> `FixAssets` (JSON-LD, HTML snippets).

**Phase 4: The Monitor (Recurring Revenue)**
*   **Goal:** Run Phase 1 on a schedule (Cron).
*   **Integration:** `Inngest` Cron Jobs.
*   **Why:** This powers the $1,500/mo retainer.
*   **Action:** Set up recurring Inngest functions.

**Recommendation:**
Start immediately on **Phase 1 (The Truth Engine)**. The `packages/site-crawler` and `packages/query-engine` are the foundations. We need to solidify them into a robust `apps/audit-runner`.
