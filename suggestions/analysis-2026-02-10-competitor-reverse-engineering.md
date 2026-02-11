# Competitor Reverse-Engineering & Innovation Strategy

## 1. Competitor Product Scope & Analysis

We are entering a market defined by high-cost, SaaS-based "black boxes." Competitors charge for *access* to data that is fundamentally cheap to retrieve, relying on the user's inability to build their own pipelines.

### The Landscape

| Competitor | Core Proposition | Pricing Model | Key Features (The "Secret Sauce") | Weakness |
| :--- | :--- | :--- | :--- | :--- |
| **Otterly.ai** | "AI Share of Voice" | $29 - $989/mo | Tracks brand mentions in ChatGPT/Perplexity. Simple prompt tracking. | **Per-prompt pricing.** High friction for scale. No "fix it" tools. |
| **AthenaHQ** | "GEO Platform" | $295 - $595+/mo | GEO Score, Sentiment Analysis, Competitor Monitoring. | **Enterprise gatekeeping.** High entry price. "Optimization" is vague advice. |
| **Profound.ai** | "Enterprise GEO" | $499 - Custom/mo | Deep analytics, 10+ models, historical data. | **Overkill.** Focused on F500. $499 floor excludes most agencies. |
| **ZipTie.dev** | "AI Overviews" | Varies | Tracks Google AIO visibility. | **Platform-locked.** Heavy focus on Google, less on chat engines. |

### Feature Analysis: What are they actually selling?

1.  **"AI Share of Voice"**: They run a set of prompts ("best dentist in austin") through 3-5 LLMs and count how often the brand appears.
    *   *Reverse Engineering:* This is just an LLM API call + Regex/fuzzy matching.
    *   *Cost:* ~$0.01 per query.
    *   *Markup:* They charge ~$2/query (implied by credit limits). **99% Margin.**
2.  **"Sentiment Analysis"**: They feed the LLM response back into another LLM: "Is this positive or negative?"
    *   *Reverse Engineering:* Standard LLM classification task.
3.  **"GEO Score"**: A composite metric (Likely: Mentions * Sentiment * Rank).
    *   *Reverse Engineering:* Arbitrary weighted sum. We can build better.
4.  **"Blindspot Detection"**: "What queries are competitors ranking for that you aren't?"
    *   *Reverse Engineering:* Run competitor brand names as queries → extract topics → check client visibility on those topics.

## 2. Exploitable IP & Reverse Engineering Findings

The competitors' IP is thin. It relies on:
1.  **Prompt Orchestration:** Running the same query across multiple engines.
2.  **Parsing Logic:** Extracting company names from unstructured text.
3.  **Visualization:** Making the data look scary/impressive.

**Exploitable Gap:** They are all **SaaS**. They hoard the data. They charge per "credit."
**Our Move:** We are **Self-Hosted**. We give the *engine* to the user.
*   **Their cost:** $499/mo for 200 queries.
*   **Our cost:** $2 for 200 queries (paid directly to OpenAI/Perplexity).

## 3. Novel Tools & Innovation

We can build tools that SaaS competitors *cannot* offer because of their architecture (centralized, expensive) or business model (subscription-based).

### A. The "Agentic Deep-Dive" (The "Otterly Killer")
Competitors stop at the *mention*. "You appeared."
**Our Tool:** `AgenticVerifier`.
*   **Logic:** If the AI says "Dr. Smith offers great whitening," an agent visits Dr. Smith's site to verify *if that is actually true* or an AI hallucination.
*   **Value:** "Your competitor is winning on a lie. Here is the proof."
*   **Tech:** Puppeteer + LLM Verification.

### B. "The Poison Pill" Detector (Anti-RAG)
Competitors focus on *getting* mentions. We focus on *blocking* bad data.
**Our Tool:** `RagPoisonCheck`.
*   **Logic:** Scan the client's site for text segments that might confuse an LLM (e.g., conflicting pricing tables, old PDFs, weird JSON-LD).
*   **Value:** "ChatGPT thinks you are closed on Sundays because of this PDF from 2019. Delete it."

### C. The "Local Graph Builder" (Knowledge Graph)
Competitors mention "Knowledge Graphs" as a buzzword.
**Our Tool:** `GraphVisualizer`.
*   **Logic:** Crawl the site + JSON-LD → Visualize the *actual* entity graph Google sees. Highlight broken connections (e.g., "Service" not linked to "AreaServed").
*   **Tech:** D3.js + JSON-LD parsing.

### D. "Review Hallucination" Monitor
**Our Tool:** `ReviewTruth`.
*   **Logic:** Feed the AI's "summary of reviews" against the *actual* Google Maps reviews.
*   **Value:** "Gemini says you have 'long wait times,' but 0 reviews say that. This is a hallucination. Report it."

## 4. Prioritized R&D Initiatives

### Priority 1: The "Share of Voice" Matrix (Commodity Killer)
*   **Goal:** Replicate the $499/mo feature of Athena/Profound for $0.
*   **Action:** Implement the "Competitor Matrix" spec (already written).
*   **Differentiation:** Ours is "pay-per-use" (cheap) vs. "pay-per-month" (expensive).

### Priority 2: "Review Truth" (Novelty)
*   **Goal:** A feature no competitor has.
*   **Action:** Build `packages/core/src/tools/verify-reviews.ts`.
*   **Why:** High emotional impact. Clients hate being lied about by AI.

### Priority 3: "Knowledge Graph Visualizer" (Visuals)
*   **Goal:** The "AgencyAnalytics" replacement.
*   **Action:** Add a force-directed graph to the HTML report.
*   **Why:** It looks incredibly sophisticated and justifies the $3,000 sprint.

### Priority 4: "Agentic Verifier" (Advanced)
*   **Goal:** The "Deep Research" angle.
*   **Action:** Use Puppeteer to validate claims made by AI.

## 5. Strategic Synthesis
We don't need to invent new physics. We just need to democratize access to the physics engine.
*   **Competitors:** Sell the *fish* (at markup).
*   **Pare:** Sells the *fishing rod* (at cost).

**Next Steps:**
1.  Implement the **Competitor Matrix** (it kills the core value prop of the $499 tools).
2.  Build the **Review Truth** tool (it's the unique "hook" they can't ignore).
