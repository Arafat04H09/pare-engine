# [Competitor Reverse-Engineering]: Strategic Analysis & Spec

## 1. Market Landscape Analysis
We analyzed the top 4 competitors in the GEO (Generative Engine Optimization) space: **Otterly.ai, ZipTie.dev, Profound, and AthenaHQ**.
**Thesis:** These are SaaS platforms selling dashboards ($29–$595/mo). Pare is a *Consulting Engine* selling outcomes ($750 audit + $3k implementation).
**Goal:** We do not want to be a "worse Otterly." We want to use their "Enterprise" features as standard components of our $750 audit, making their SaaS fees redundant for our clients.

### Key Competitor Features to commoditize:

| Feature | Competitor | Price Floor | The "Pare" Version |
| :--- | :--- | :--- | :--- |
| **Share of Voice (SoV)** | Otterly.ai | $189/mo | **Competitor Intelligence Graph** (Already spec'd). We give it away in the audit. |
| **AI Overview (AIO) Triggering** | ZipTie.dev | $199/mo | **AIO Trigger Detector**. Check if AIO appears, who is cited, and *why*. |
| **Agent Analytics** | Profound | $499/mo | **Bot Welcome Mat**. Analyze server logs for `GPTBot`, `ClaudeBot`. |
| **Citation Intelligence** | AthenaHQ | $295/mo | **Citation Network Graph**. Visualize the "referral web" feeding the AI. |

## 2. Reverse-Engineering Specs

### A. The "AIO Trigger Detector" (ZipTie Clone)
**Insight:** ZipTie charges a premium to tell you "Did Google show an AI Overview for this query?" and "Were you in it?".
**Implementation:**
*   **Tool:** `packages/core/src/tools/aio-detect.ts`
*   **Data Source:** DataForSEO or Serper.dev (both have flags for `ai_overview` or `knowledge_graph`).
*   **Logic:**
    1.  Input: Query List.
    2.  Fetch SERP.
    3.  Check JSON for `ai_overview` object.
    4.  Extract: `text`, `cited_urls`.
    5.  Match `cited_urls` against Client Domain vs Competitor Domains.
*   **Value:** "You appear in 0% of AI Overviews. Your competitor appears in 40%."

### B. The "Bot Welcome Mat" (Profound Clone)
**Insight:** Profound sells "Agent Analytics" to show if AI bots are hitting your site.
**Implementation:**
*   **Tool:** `packages/core/src/tools/bot-analyzer.ts`
*   **Mechanism:**
    1.  **Passive (Log Analysis):** If we have access to logs (unlikely in audit), parse for User-Agents (`GPTBot`, `ClaudeBot`, `FacebookBot`).
    2.  **Active (Verification):** Check `robots.txt` and `WAF` rules.
    3.  **Simulated:** Try to fetch the site pretending to be `GPTBot` (set User-Agent). If blocked (403), flag as "AI Invisible."
*   **Value:** "You are blocking the very sales agents trying to recommend you."

### C. Citation Network Graph (AthenaHQ Clone)
**Insight:** AthenaHQ traces "citations of citations." (e.g., Perplexity cites Forbes, Forbes cites You).
**Implementation:**
*   **Tool:** `packages/core/src/tools/citation-graph.ts`
*   **Logic:**
    1.  Ask Perplexity/SearchGPT a query.
    2.  Extract Citations (Tier 1).
    3.  **Recursion:** Visit Tier 1 URLs. Scrape their content. Find *their* external links (Tier 2).
    4.  Score Tier 1 sources by "Authority" (Domain Rating or simple backlink count via DataForSEO).
*   **Value:** "To get into Perplexity, you don't pitch Perplexity. You pitch *Forbes*."

## 3. Prioritized R&D Initiatives

1.  **Immediate:** Build the **AIO Trigger Detector**. It's a simple API call change to our existing SERP checks. (Low Effort, High Visual Impact).
2.  **Strategic:** Build the **Bot Welcome Mat** (Active Mode only). "Can GPTBot read your pricing page?" is a binary Pass/Fail that scares clients into action.
3.  **Deferred:** Citation Network Graph. High compute cost (recursive crawling). Save for "Retainer" clients (Tier C).

## 4. Pre-Mortem
*   **Risk:** Google/Perplexity change their citation formats constantly.
*   **Mitigation:** Use `generateObject` with "loose" schemas for parsing responses, rather than brittle regex.
*   **Risk:** Cost of recursive crawling for Citation Graph.
*   **Mitigation:** Limit recursion depth to 1 (Direct Citations only) for the standard audit. Upsell depth 2.
