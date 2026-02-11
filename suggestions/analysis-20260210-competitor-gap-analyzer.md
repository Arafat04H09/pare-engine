# [Competitor Gap Analyzer]: Strategic Analysis & Spec

## 1. Structural Insight (The "Why")
**From the Reasoning Pipeline:**
The "Consulting Engine" thesis relies on bridging the gap between a low-cost audit ($0.63) and a high-value implementation ($3,000+).
While a standard audit tells a client *what* is wrong with their site (Absolute Score: 34/100), it fails to create the urgency required to close a high-ticket sprint.
The strongest psychological driver for local business owners is **Competitive Anxiety** (FOMO). "Why is Dr. Smith ranking above me?"
A "Competitor Gap Analyzer" (or "Why You Lost" report) shifts the conversation from technical debt ("You need JSON-LD") to competitive survival ("Dr. Smith has FAQ Schema and you don't. That is why he owns the AI Answer.").
This feature directly justifies the sprint purchase by showing *specifically* what the competitor is doing that the client isn't, turning the "Implementation Engine" into a necessary weapon rather than a nice-to-have upgrade.

## 2. The Gap (Null Space)
**What exists now:**
- `packages/core/src/tools/crawl-site.ts`: Can crawl any domain.
- `packages/core/src/tools/parse-jsonld.ts`: Can extract Schema.
- `packages/core/src/tools/score-delta.ts`: Tracks historical progress (Self vs. Self).
- `packages/core/src/tools/generate-llmstxt.ts`: Helps fix the problem.

**What is missing:**
- **Comparative Logic:** No tool exists to take `Client Domain` + `Competitor Domain` and output a side-by-side analysis.
- **Narrative Generation:** No prompt structure exists to explain the *implications* of the gap (e.g., "Competitor has `PriceRange` schema, allowing AI to show their pricing in the initial response.").

**Reference:**
- `docs/MASTER_BUILD_PLAN.md`: Explicitly lists "B5. 'Why You Lost' Analyzer [Clone Rank 8]" as a Tier B differentiator.
- `packages/core/src/tools/`: Contains `accuracy-scorer.ts` and `score-delta.ts` but no `competitor-analyzer.ts`.

## 3. Proposed Specification

### User Story
As the Consultant, I want to input my client's domain and a top competitor's domain (or have the system auto-detect one), so that I can generate a "Gap Analysis" report that highlights exactly where the competitor is winning in Schema, Content, and Technical Readiness, enabling me to sell the specific fixes needed to close that gap.

### Technical Implementation

#### New Tool: `packages/core/src/tools/analyze-competitor.ts`
*   **Input:** `clientUrl`, `competitorUrl`, `vertical` (e.g., "Dentist").
*   **Process:**
    1.  **Parallel Crawl:** Run `crawlSite` on both domains (limit to ~5 pages each for speed/cost).
    2.  **Extraction (Parallel):**
        *   Extract JSON-LD (using `parse-jsonld.ts`).
        *   Check for `llms.txt` and `robots.txt` (using `crawl-site.ts` raw response).
        *   Analyze Content "Answer-First" ratio (using `content-optimizer.ts` logic if available, or raw text stats).
    3.  **Gap Calculation:**
        *   Compare Schema Types: `Client: [LocalBusiness]` vs `Competitor: [LocalBusiness, FAQPage, Service]`. -> **Gap: FAQ, Service.**
        *   Compare Content: `Client: 500 words` vs `Competitor: 2000 words`.
    4.  **LLM Narrative (Claude Sonnet):**
        *   Prompt: "You are a competitive intelligence expert. Compare these two profiles. Why does the Competitor likely rank better in AI Overviews? Be specific about Schema and Content Structure gaps. Do not be generic."
*   **Output:** Typed `CompetitorAnalysisResult` object with `gaps` array and `narrative` string.

#### Database Changes
*   New table `competitor_analyses` (or generic `analyses` with type='competitor') in Drizzle schema to store these snapshots for future reference ("Look how we beat them now").

#### UI Changes
*   **Location:** `apps/web/app/admin/audits/[id]/competitor` (New Route) or a Modal on the Audit view.
*   **Action:** "Add Competitor" button.
*   **Display:** Side-by-side comparison table (Red/Green indicators) + LLM Narrative block.

#### Integration
*   **Inngest:** Create a new step `analyze-competitor` that can be triggered optionally after a main audit or manually.

### 4. Pre-Mortem

**How might this fail?**
*   **Blocking:** Competitor site blocks Firecrawl (403/429).
    *   *Prevention:* Implement fallback to "External Signals Only" mode (using Google Places API public data if available) or report "Competitor Anti-Bot protections preventing deep analysis" (which is also a selling point: "They are hiding something/secure").
*   **Cost:** Doubling the crawl volume per "audit" (if run automatically).
    *   *Prevention:* Make this an *on-demand* action, not automatic for every audit. Only run when the consultant identifies a specific competitor to target.
*   **Hallucination:** LLM invents a reason why the competitor is winning.
    *   *Prevention:* Strictly ground the prompt in the *extracted data* (JSON-LD keys, word counts). Forbid the LLM from speculating on off-page SEO (backlinks) unless we feed that data (e.g., via DataForSEO, if integrated later).

