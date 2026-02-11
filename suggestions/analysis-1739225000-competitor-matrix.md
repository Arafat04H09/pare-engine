# Feature: Competitor Share of Voice Matrix

**Date:** February 10, 2026
**Status:** Proposed
**Owner:** System Architect
**Inspiration:** Otterly.ai "Share of Voice", ZipTie "Competitive Benchmarking"

---

## 1. Structural Insight (The "Why")

**Market Reality:** Clients don't care about absolute scores (e.g., "You scored 45"). They care about *relative* standing (e.g., "You are losing to Dr. Smith").
**Competitor Mechanism:** Otterly.ai and ZipTie both sell "Share of Voice" — a percentage metric showing how often a brand appears vs. others for a set of keywords.
**The Exploit:** These competitors charge $200–$500/mo for this data. We can calculate it *ad-hoc* during the audit for $0.15 (using `gpt-4o-mini` or `perplexity`) and give it away as the "hook" to sell the $3,000 sprint.

**The "Spread" Thesis:**
- Competitor Cost: $489/mo (Otterly Premium)
- Our Marginal Cost: $0.15 per run
- Value Add: "I'm not just telling you your rank; I'm showing you exactly *who* is stealing your customers."

## 2. The Gap (Null Space)

**Current Capabilities:**
- `ai-visibility.ts`: Checks *one* brand against *one* query. Returns "Mentioned / Not Mentioned".
- `monitoring_results`: Stores linear history.

**Missing Logic:**
- **Matrix Execution:** No logic to run `[Client, Comp1, Comp2, Comp3]` x `[Query1, ... Query10]`.
- **Aggregation:** No "Win Rate" calculation (e.g., "You won 2/10, Comp1 won 8/10").
- **Visual:** No "Share of Voice" pie chart in the PDF.

## 3. Proposed Specification

### User Story
> **As the Consultant,** I want to input 3 named competitors when setting up an audit
> **So that** the report shows a "Market Share" pie chart proving the client is invisible compared to their rivals.

### Technical Implementation

#### A. New Tool: `generate-share-of-voice.ts`
*   **Input:** `clientDomain`, `competitorDomains[]`, `queries[]`, `location`
*   **Process:**
    1.  Execute `search_queries` for the *generic* keywords (e.g., "best dentist austin").
    2.  Parse the *raw* text response from Perplexity/OpenAI.
    3.  Count mentions for *all* 4 domains (Client + 3 Competitors) in the same pass.
    4.  **Novelty:** We don't need 4x the API calls. One query ("Who is the best dentist?") reveals everyone. We just need to parse for multiple entities.
*   **Output:**
    ```typescript
    interface ShareOfVoiceResult {
      query: string;
      winner: string; // Domain of the #1 recommendation
      rankings: { domain: string; rank: number }[];
    }
    interface AggregateReport {
      totalQueries: number;
      share: { [domain: string]: number }; // percentage
    }
    ```

#### B. Database Updates (`audit_results` table)
*   Add `competitor_domains` (jsonb) to store who was compared.
*   Add `share_of_voice_data` (jsonb) to store the matrix result.

#### C. UI/PDF Visualization
*   **Pie Chart:** "AI Recommendation Share" (Client vs. Competitors).
*   **Table:** "Head-to-Head Battles"
    *   Row: "Best Dentist in Austin" | Winner: **Dr. Smith** | You: **Not Mentioned**

## 4. Pre-Mortem

**Risk:** Parsing ambiguity. AI might say "Dr. Smith is good, but Dr. Jones is closer."
**Fix:** Use `gpt-4o-mini` as a "Judge" to parse the Perplexity output. "Read this text and return the ordered list of recommended brands."

**Risk:** Cost explosion.
**Fix:** Limit "Head-to-Head" to the top 5 highest-intent queries only.
