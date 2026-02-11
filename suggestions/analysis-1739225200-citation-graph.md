# Feature: Citation Graph Visualizer (The "Source Intelligence" Map)

**Date:** February 10, 2026
**Status:** Proposed
**Owner:** System Architect
**Inspiration:** AthenaHQ "Source Intelligence", ZipTie "Detailed AI Response Analysis"

---

## 1. Structural Insight (The "Why")

**Market Reality:** Clients ask: "Why does Perplexity recommend my competitor?"
**The Answer:** "Because Perplexity read it on *Yelp*, and your Yelp profile is empty."
**Competitor Mechanism:** AthenaHQ provides "Source Intelligence" lists.
**The Exploit:** We can do better than a list. We can build a **Directed Graph** showing the flow of authority.
*   `Yelp (5 stars)` --> `Perplexity` --> `You`
*   `Reddit (Complaint)` --> `Google AI` --> `You`

**The "Spread" Thesis:** Visualizing the *path* of information proves that "fixing listings" (cheap) leads to "winning AI" (valuable). It connects the low-level work to the high-level goal.

## 2. The Gap (Null Space)

**Current Capabilities:**
- `monitoring_results`: We store the `cited_urls` array from Perplexity/OpenAI.
- `normalize-citations.ts`: We have a tool (planned/stubbed) to clean these URLs.

**Missing Logic:**
- **Graph Construction:** We don't aggregate citations to show *frequency* and *influence*.
- **Classification:** We don't classify sources (e.g., "Directory", "Social", "News", "Competitor Blog").
- **Visualization:** No data structure ready for a network graph (Nodes/Edges).

## 3. Proposed Specification

### User Story
> **As the Consultant,** I want to show a "Trust Map" in the audit
> **So that** the client sees exactly which 3rd-party sites are feeding the AI's opinion of them.

### Technical Implementation

#### A. Enhancement: `normalize-citations.ts`
*   **Add Classification:** Use a lookup list or lightweight LLM call to tag domains.
    *   `yelp.com` -> `Directory`
    *   `nytimes.com` -> `News`
    *   `reddit.com` -> `Social/UGC`
*   **Weighting:** Assign an "Authority Weight" (Perplexity cites Wikipedia more heavily than a random blog).

#### B. New Tool: `generate-citation-graph.ts`
*   **Input:** `monitoring_results` (last 30 days).
*   **Process:**
    1.  Extract all `cited_urls`.
    2.  Group by Domain.
    3.  Count frequency of citation.
    4.  Map Edges: `Source Domain` -> `AI Platform` -> `Client Brand`.
*   **Output:**
    ```typescript
    interface CitationGraph {
      nodes: { id: string; type: 'source' | 'platform' | 'brand'; weight: number }[];
      edges: { source: string; target: string; count: number }[];
    }
    ```

#### C. Report Visualization
*   **Force-Directed Graph:** (using D3.js or similar in the HTML template).
*   **Key Insight Text:** "80% of your AI visibility comes from your *LinkedIn* profile. We need to optimize that."

## 4. Pre-Mortem

**Risk:** Too many edges. Graph looks like spaghetti.
**Fix:** "Top 5 Sources Only" filter. Show the "Power Law" distribution (most citations come from few sources).

**Risk:** Missing data. OpenAI often doesn't cite sources explicitly in the text.
**Fix:** Rely heavily on Perplexity (Sonar) and Bing (Copilot) data for the graph, as they are citation-heavy. Use this to *infer* where OpenAI might be looking (correlation, not causation).
