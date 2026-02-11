# [Competitor Analysis]: Reverse-Engineering & Novelty Spec

## 1. Competitor Product Scope
We are positioning `pare-engine` against three tiers of competitors. Our "Unfair Advantage" is that we are a **Consulting Engine** (Audit+Fix), whereas they are **SaaS Monitors** (Audit Only).

| Feature | Otterly.ai ($29-489/mo) | Profound ($$$ Enterprise) | Pare Engine ($0.63/audit) | Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Core Value** | Monitoring & Sentiment | Enterprise Data & Logs | **Audit + Implementation** | **Build the "Fix" button.** |
| **Data Source** | API Wrappers | Proprietary Server Logs | API Wrappers + Direct Crawl | **Commoditize their data source.** |
| **Metric** | "Visibility Index" | "Share of Search" | "Revenue at Risk" | **Translate vanity metrics to $$.** |
| **Differentiation** | Dashboard UI | Scale of Data | **Implementation Workbench** | **Don't just show charts; ship code.** |

## 2. Reverse Engineering Targets (Exploitable IP)

### Target A: The "Prompt Permutation Engine" (Clone of Otterly's "AI Keyword Research")
**The Feature:** Otterly converts a single keyword (e.g., "Best Dentist") into 10-20 "Natural Language Permutations" that users actually ask chatbots (e.g., "I need a dentist in Austin who is gentle and takes Delta Dental").
**Why Reverse Engineer:** Using only 1 keyword gives a false positive. We need to check the *long tail* of intent to prove "Invisibility."
**Implementation Plan:**
*   **Tool:** `packages/core/src/tools/generate-prompt-permutations.ts`
*   **Logic:** Use an LLM (Claude Haiku) to generate 10 variations of a user intent based on:
    *   *Specificity:* "Best X" -> "X for [specific condition]"
    *   *Urgency:* "Emergency X"
    *   *Constraint:* "Cheap X", "X near me", "X open now"
*   **Integration:** Feed these 10 prompts into the `A1` (AI Visibility) scanner instead of just the seed keyword.

### Target B: "AI Crawler Trap" (Lite version of Profound's Server Logs)
**The Feature:** Profound analyzes billions of server logs to see if `GPTBot` or `ClaudeBot` actually visited a site.
**Why Reverse Engineer:** Clients love "Proof." Seeing "OpenAI visited your pricing page yesterday" is a powerful sales hook.
**Implementation Plan:**
*   **Tool:** `packages/core/src/tools/crawler-analytics.ts` (Already in file list, needs expansion).
*   **Logic:**
    *   We cannot access server logs directly (we are external consultants).
    *   **Novel Twist:** We create a "Honey Pot" or "Canary Token" strategy.
    *   *Technique:* The "Fix" sprint installs a specific pixel or unique URL structure (e.g., `/ai-sitemap.xml`) that we monitor. When `GPTBot` hits it, we alert the client.
    *   *Benefit:* "We installed the beacon, and we saw them come."

## 3. Novel Tools (The "Blue Ocean")

### Novelty 1: Hyper-Local AI Grid
**The Gap:** Competitors check visibility from "Austin, TX." But AI results, especially "Google Grounding" and "Google Maps" integrations, change based on *neighborhood*.
**The Tool:** A "Grid Search" for AI.
**User Story:** "As a consultant, I want to check ChatGPT's response for 'Coffee Shop' from 5 different lat/long coordinates in the city to show the client they only exist in a 2-mile radius."
**Tech Stack:**
*   **Google Places API:** Verify coordinates.
*   **Serper/OpenAI:** Pass `location` parameter (where supported) or inject "near [Landmark]" into the prompt context to force location awareness.
*   **Visualization:** A Heatmap Overlay on a Map (using `leaflet` or similar in the Report).

### Novelty 2: Agentic Commerce Validator (UCP/ACP)
**The Gap:** No competitor is currently checking for **Google UCP (Universal Commerce Protocol)** or **OpenAI ACP (Agent Commerce Protocol)** compliance for SMBs. This is the future of "Shopping."
**The Tool:** `packages/core/src/tools/agentic-commerce.ts`
**Features:**
*   **Schema Check:** Does `Product` schema have `merchantReturnPolicy`, `shippingDetails`? (Required for AI shopping).
*   **API Check:** Is there a machine-readable endpoint for inventory?
*   **Outcome:** A "Shopping Agent Readiness Score" (0-100).
*   **Why it wins:** It positions the consultant as a "Futurist" preparing the client for 2027, justifying higher retainers.

## 4. Prioritized R&D Initiatives

1.  **Immediate (Sprint 1): Prompt Permutation Engine.**
    *   *Effort:* Low (1 day).
    *   *Impact:* High. It makes our "Invisibility" argument 10x stronger immediately.
2.  **Near-Term (Sprint 2): Hyper-Local AI Grid.**
    *   *Effort:* Medium (2-3 days).
    *   *Impact:* High. Visuals sell. A heatmap is the best visual.
3.  **Mid-Term (Sprint 3): Agentic Commerce Validator.**
    *   *Effort:* Medium.
    *   *Impact:* Strategic. Opens up the "E-commerce" vertical which is currently untouched by our plan.
4.  **Long-Term: Crawler Canary Tokens.**
    *   *Effort:* High (Requires hosting/client install).
    *   *Impact:* Medium. Nice to have, but complex to sell/install.

## 5. Value Proposition Development
**Old Pitch:** "We do SEO for AI."
**New Pitch:** "We engineer your business to be machine-readable by the AI Agents that your customers use to buy."

**The "Killer Feature" isn't a chart.** It's the **"Fix Pack."**
Competitors give you a headache (a report saying you're failing).
We give you the aspirin (the JSON-LD code to fix it).
**Focus 80% of R&D on the Implementation Workbench.**