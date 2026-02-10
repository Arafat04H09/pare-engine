# Competitive Analysis & Integration Strategy

## Layer 1: Competitive Teardown

We analyzed tools distinct to the "GEO" (Generative Engine Optimization) space and broader agency operating systems. The market is bifurcated: "Observational" tools (GEO trackers) and "Container" tools (Agency OS).

| Tool | Core Value Prop | Data Sources | Technical Complexity | Replicability |
| :--- | :--- | :--- | :--- | :--- |
| **Otterly.ai**<br>($29-$189/mo) | **"The Rank Tracker for AI"**<br>Monitors brand visibility across ChatGPT, Perplexity, Gemini. Provides a "Share of Voice" metric. | Perplexity API, OpenAI API, Google Custom Search (or SerpAPI). | **Low/Moderate**<br>Wrapper around LLM APIs + scheduled cron jobs + basic sentiment analysis. | **Trivial**<br>Core value is simply automated querying + regex/LLM parsing of results. |
| **ZipTie.dev**<br>($99-$799/mo) | **"Technical SEO for AI"**<br>Indexing checks + AI visibility. Differentiates with "live" checks (no cached data). | Google Search Console API, LLM APIs, Headless Browsers (for rendering). | **Moderate**<br>Requires robust scraping infra (headless browsers) to see what AI *actually* renders. | **Moderate**<br>Replicating the *infra* is 80% of the work. The *logic* is simple. |
| **GoHighLevel**<br>($97-$497/mo) | **"The Agency Operating System"**<br>CRM, Email, SMS, Landing Pages in one. White-label everything. | Twilio (SMS), SendGrid/Mailgun (Email), Stripe (Payments). | **High**<br>Massive surface area. Not a wrapper; a sprawling CRUD monolith. | **Hard**<br>Do not replicate. Integrate with it. |
| **BrightLocal**<br>($39-$149/mo) | **"Local SEO Authority"**<br>Citations, Reputation Management, Rank Tracking. | Google Business Profile API, Scraping (Yelp, YellowPages, etc.), DataForSEO/SerpAPI. | **Moderate**<br>Value is in the *connectors* to 100+ directories. | **Hard (Data)**<br>Replicating the directory scraping network is waste. Buy their API. |
| **Geoptie**<br>($49/mo) | **"Optimization Assistant"**<br>Content optimizer + rank tracker. Focus on "how to fix" via content suggestions. | NLP libraries (keyword extraction), LLM APIs for "rewriting" suggestions. | **Low**<br>Standard wrapper pattern: Input URL -> LLM Analysis -> Output "Fixes". | **Trivial**<br>This is a single prompt chain in our `query-engine`. |

## Layer 2: Reverse Engineering Targets

We filter for high-margin, low-complexity targets. These are features users pay $200+/mo for that we can build with <500 lines of glue code.

### 1. The "Share of Voice" Monitor (Target: Otterly/ZipTie)
*   **Revenue Impact:** High (Powers the $1,500/mo retainer).
*   **Build Effort:** Low.
*   **The Build:**
    *   **Input:** List of 25 "buying intent" queries (e.g., "best dentist seattle").
    *   **Process:** `query-engine` sends prompts to Perplexity/ChatGPT/Gemini -> captures output.
    *   **Analysis:** `core` uses a cheap LLM (GPT-4o-mini) to specific "Mentioned? (Y/N)", "Sentiment (1-10)", "Rank (1-5)".
    *   **Output:** JSON stored in DB; trend line in UI.
    *   **Secret Sauce:** Don't just track *if* mentioned. Track *what specific text* was cited.

### 2. The "AI Readiness" Auditor (Target: Geoptie)
*   **Revenue Impact:** High (The wedge product).
*   **Build Effort:** Moderate.
*   **The Build:**
    *   **Input:** Business URL.
    *   **Process:** `site-crawler` (Firecrawl) extracts raw text + metadata.
    *   **Analysis:** `query-engine` runs 5-pillar rubric (Technical, Content, Authority, Schema, Visibility).
    *   **Output:** `report-generator` produces the 9-page PDF.

### 3. The "Review Sentiment" Aggregator (Target: BrightLocal/BirdEye)
*   **Revenue Impact:** Moderate (Retention glue).
*   **Build Effort:** Low.
*   **The Build:**
    *   **Input:** Google Place ID.
    *   **Process:** `run_shell_command` curl Google Places API -> Fetch last 50 reviews.
    *   **Analysis:** LLM summarizes "What people love" vs "What people hate".
    *   **Output:** "Voice of Customer" section in the monthly report.

## Layer 3: Competitive Gaps (The Null Space)

Where are solo operators struggling?

1.  **"Diagnosis without Cure":**
    *   *Complaint:* "ZipTie tells me I'm not indexed. Otterly tells me I'm not mentioned. Now what? I still have to go write the code/content."
    *   *Pare Solution:* **The Sprint.** We don't just report the score; we generate the *files* (schema.json, llms.txt, FAQ content) ready to copy-paste.

2.  **"Agentic Commerce Blindness":**
    *   *Complaint:* E-commerce agencies are seeing traffic drop but don't know how to track "shopping agents."
    *   *Pare Solution:* **Merchant Center Optimization.** No competitor is checking if a product feed is "agent-ready" (UCP/ACP compliant).

3.  **"The Solo Scale Trap":**
    *   *Complaint:* "GoHighLevel is too complex. I spend more time configuring workflows than selling."
    *   *Pare Solution:* **Opinionated Defaults.** Don't give them a drag-and-drop builder. Give them *one* proven workflow that works out of the box.

4.  **"Generic Advice":**
    *   *Complaint:* "Tool told me to 'improve E-E-A-T'. That means nothing."
    *   *Pare Solution:* **Vertical Intelligence.** "For Dentists: You are missing a 'sedation dentistry' FAQ page. Here is the draft." (Specific > Generic).

## Layer 4: Integration Architecture

Based on `/packages`, here is the build order to unlock the most value fastest.

### Phase 1: The "Audit" Pipeline (Revenue Wedge)
*Goal: Generate the $750 PDF automatically.*
1.  **Connect `site-crawler` -> `core`:** Ensure crawled data (HTML/Metadata) saves correctly to the `Scrape` schema.
2.  **Connect `core` -> `query-engine`:** Build the logic where `Scrape` data triggers the 5-pillar analysis prompts.
3.  **Connect `query-engine` -> `report-generator`:** Feed the analysis results directly into the React-PDF templates.
*   *Result:* Enter URL -> Get PDF. (Replaces 2 hours of manual work).

### Phase 2: The "Fix" Generators ( DIFFERENTIATOR )
*Goal: Generate the Sprint deliverables.*
1.  **Schema Generator:** `core` function that takes business details + scraped content -> outputs `schema.json` (JSON-LD).
2.  **llms.txt Generator:** `query-engine` prompt that summarizes the business into the standard `llms.txt` format.
3.  **FAQ Generator:** `query-engine` prompt that reads "missing questions" from the audit -> generates answers.

### Phase 3: The "Monitor" Loop (Retainer)
*Goal: Automated weekly reporting.*
1.  **Scheduler:** Use `Inngest` (referenced in docs) to trigger `query-engine` jobs weekly.
2.  **Delta Tracking:** Update `core` schema to store *historical* scores, not just current ones.
3.  **Alerting:** Simple email (Resend) if score drops > 10%.

## Summary Recommendation

**Build the Audit Pipeline (Phase 1) immediately.**
The market is flooded with $99/mo monitoring tools. It is starving for **implementation** tools. By building the "Audit -> Fix" pipeline, Pare positions itself not as another SaaS subscription, but as a "Robotic Employee" that does the billable work.
