# Research: Competitive Teardown & Reverse Engineering

## Layer 1: Competitive Teardown

We analyzed the top tools in the AI visibility and Agency OS space. The "Complexity" rating evaluates the technical difficulty of replicating the core value proposition (not the entire feature set) using modern LLMs and APIs (Firecrawl, Vercel AI SDK, etc.).

| Tool | Price | Core Value Prop | Data Sources | Complexity | Rebuildable? |
|------|-------|-----------------|--------------|------------|--------------|
| **Otterly.ai** | $29-$489/mo | "Track what AI says about you." Brand monitoring on ChatGPT, Perplexity, etc. | Firecrawl + Live LLM Queries | **Low** | **Yes (Trivial)** |
| **ZipTie.dev** | $29-$849/mo | Monitoring + Indexing checks. Ties AI visibility to GSC data. | GSC API + Live LLM Queries | **Moderate** | **Yes (High Leverage)** |
| **Geoptie** | ~$49/mo (Beta) | Monitoring + Basic Optimization (Schema/Content suggestions). | Live Crawl + NLP Analysis | **Moderate** | **Yes** |
| **Nightwatch** | $32-$699/mo | Rank Tracking (SEO + AI). "First AI rank tracker." | Scrapers + LLM Queries | **Moderate** | **Partial** (SEO tracking is hard) |
| **Goodie AI** | $399+/mo | Traffic & Attribution. Proving ROI. | Analytics + LLMs | **High** | **No** (Attribution is complex) |
| **BrightLocal** | Hybrid | Local SEO & Citations. | Data Aggregators (Data Axle, etc.) | **High** | **No** (Data moat) |
| **GoHighLevel** | $97-$297/mo | Agency "Business in a Box" (CRM, Sites, Funnels). | Internal DB + Twilio wrapper | **High** | **No** (Feature breadth moat) |
| **AthenaHQ** | $295+/mo | Enterprise AI search visibility. | LLM Queries | **Low** | **Yes** |
| **Profound** | Enterprise | Corporate governance & workflows. | LLM Queries | **High** | **No** (Sales/Process moat) |

### Key Insight
**The "Monitoring Tax" is high.** Tools like Otterly and AthenaHQ charge $200+/mo primarily for running prompts against ChatGPT and Perplexity and showing a chart. This is the definition of an "API Wrapper" business. Pare can commoditize this feature as a "retainer utility" rather than a core product.

---

## Layer 2: Reverse Engineering Targets

We ranked these based on **Leverage** (Revenue Impact vs. Build Effort). "Trivial" build effort means <1 week for a senior dev with our current stack.

1.  **Otterly's "Brand Monitoring" (Leverage: 10/10)**
    *   **The Feature:** Input domain -> Query 5 AI engines -> "You are mentioned in 3/5".
    *   **The Build:** `Inngest` cron job -> `Firecrawl` search -> `AI SDK` (Sonar, GPT-4o) -> Parse "Yes/No".
    *   **Why:** It's the "hook" that sells the retainer. Costs pennies to run, sells for $$$.

2.  **ZipTie's "Indexing Check" (Leverage: 9/10)**
    *   **The Feature:** "Is your URL actually in the AI's index?"
    *   **The Build:** `AI SDK` query: "Summarize this URL: [url]". If hallucinated = not indexed. If accurate = indexed.
    *   **Why:** Validates technical SEO work immediately.

3.  **Geoptie's "Schema Audit" (Leverage: 8/10)**
    *   **The Feature:** "You are missing 'sameAs' links."
    *   **The Build:** `Firecrawl` scrape -> Regex/Cheerio extraction of JSON-LD -> Zod validation against Google's spec.
    *   **Why:** The "scare tactic" that sells the sprint.

4.  **Otterly's "Sentiment Analysis" (Leverage: 7/10)**
    *   **The Feature:** "ChatGPT speaks positively about you."
    *   **The Build:** Feed LLM response to a cheap model (GPT-4o-mini) -> Classify Positive/Neutral/Negative.
    *   **Why:** Executive eye-candy for reports.

5.  **ZipTie's "Competitor Comparison" (Leverage: 7/10)**
    *   **The Feature:** "Competitor X is cited, you are not."
    *   **The Build:** Run the Monitoring flow (Target 1) for client + 3 competitors. Visualize side-by-side.
    *   **Why:** FEAR sells better than features.

6.  **Nightwatch's "Share of Voice" (Leverage: 6/10)**
    *   **The Feature:** "% of queries you appear in."
    *   **The Build:** Aggregate "Yes/No" results from Target 1 over time.
    *   **Why:** Retainer retention metric.

7.  **Geoptie's "Content Gap" (Leverage: 6/10)**
    *   **The Feature:** "Competitor mentions 'Pricing' and you don't."
    *   **The Build:** Extract text from both sites -> LLM "Compare these two businesses, what is missing from A?"
    *   **Why:** Generates the "to-do list" for the sprint.

8.  **Automated "llms.txt" Generator (Leverage: 8/10)**
    *   **The Feature:** Not a competitor tool, but a missing standard.
    *   **The Build:** Scrape site -> Summarize services/pricing -> Format as Markdown -> "Download llms.txt".
    *   **Why:** Instant "we did something" win.

---

## Layer 3: Competitive Gaps (Null Space)

What solo consultants hate about the current landscape:

1.  **The "Implementation Gap" (Critical Differentiator)**
    *   **Complaint:** "Tool tells me I'm missing Schema. It doesn't give me the code to fix it."
    *   **Opportunity:** **Pare generates the artifact.** We don't just say "Missing Schema". We provide the `schema.json` file ready to copy-paste. We don't just say "Rewrite content". We provide the `optimized-page.md`.
    *   **Why:** Solo operators are time-poor. They pay for *done*, not *diagnosed*.

2.  **The "Agency Pricing" Trap**
    *   **Complaint:** "I have 5 small clients. Otterly wants $489/mo to track them. GoHighLevel is $297. I'm bleeding cash."
    *   **Opportunity:** **Usage-based / Self-hosted economics.** Pare is an engine you own. The marginal cost is API credits ($5/client), not seat pricing ($200/seat).

3.  **The "Ugly Report" Problem**
    *   **Complaint:** "Nightwatch reports look like spreadsheets. I can't send this to a dental practice owner."
    *   **Opportunity:** **Designer-grade PDFs.** The report must look like a $5,000 consulting deliverable, not a SaaS export. (This validates our move to HTML+Puppeteer).

4.  **The "Generic Advice" Issue**
    *   **Complaint:** "Tools give generic SEO advice (H1 tags, meta desc) that doesn't matter for AI."
    *   **Opportunity:** **Vertical-Specific Patterns.** "For Dentists, AI cares about 'Emergency Services' schema." Hard-coding these patterns into the audit engine creates a moat vs. generic tools.

5.  **The "Workflow Disconnect"**
    *   **Complaint:** "I audit in Tool A, write content in ChatGPT, validate in Tool B."
    *   **Opportunity:** **Unified Pipeline.** Audit -> Fix -> Verify in one CLI command.

---

## Layer 4: Integration Architecture

Based on the existing `/packages`, here is the highest-leverage build order:

**Phase 1: The "Audit & Scare" Engine (Current Focus)**
*   **Goal:** Generate the "Money Document" (The Audit PDF) that sells the deal.
*   **Action:**
    1.  Migrate `query-engine` to Vercel AI SDK (Reliable "Scare" data).
    2.  Migrate `site-crawler` to Firecrawl (Reliable site data).
    3.  Build `report-generator` (HTML->PDF).
    4.  **Result:** `pnpm audit run` produces a $750 value PDF.

**Phase 2: The "Fix" Generator (The Differentiator)**
*   **Goal:** Close the "Implementation Gap".
*   **Action:**
    1.  Build `schema-generator` in Core: Takes audit data -> Outputs valid JSON-LD.
    2.  Build `content-optimizer`: Takes page text -> Outputs "Answer Engine Optimized" text.
    3.  **Result:** Operator can deliver the "Technical Infrastructure" package in <1 hour.

**Phase 3: The "Retainer" Robot (Recurring Revenue)**
*   **Goal:** Automate the $1,500/mo service.
*   **Action:**
    1.  Setup `Inngest` cron jobs.
    2.  Run "Phase 1" logic weekly.
    3.  Email "Weekly Alert" if visibility drops.
    4.  **Result:** "Passive" income for the operator; high-touch feel for the client.

**Phase 4: The Operator Dashboard**
*   **Goal:** Management.
*   **Action:** Next.js Admin UI to view all audits and clients.

### Recommendation
**Do NOT build a SaaS Dashboard yet.** Focus entirely on **Phase 1 & 2**. The *Output Artifacts* (PDFs, JSON files, Markdown content) are the product. The UI is secondary. A CLI that produces a $5,000 deliverable is worth infinite more than a Dashboard that shows a chart.
