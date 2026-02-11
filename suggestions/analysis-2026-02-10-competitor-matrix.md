# Competitor Intelligence Matrix: Turning "Fear" into Revenue

## 1. Structural Insight (The "Why")
**The Thesis:** "FEAR sells better than features." (Master Build Plan, A2).

A single score ("You are a 34") is abstract. A relative ranking ("Dr. Smith is #1. You are #4.") is visceral. The current pipeline analyzes the client in isolation. To close high-ticket retainers, we must prove not just that the client is *bad*, but that their specific competitors are *winning* and stealing their customers.

**The Leverage:**
By moving from a **Single-Target Pipeline** to a **Multi-Target Matrix**, we generate the "Share of Voice" metric. This is the single most effective slide in a sales deck: a heatmap showing exactly which queries the competitors own and which the client lost.

## 2. The Gap (Null Space)
*   **Existing:**
    *   `packages/core/src/contracts/pipeline.contract.ts`: `AuditRequest` accepts `competitors: string[]`, but the pipeline steps (`QueryStep`, `AnalyzeStep`) focus on a single input.
    *   `apps/audit-runner/src/steps`: Likely executes linearly for the primary domain only.
    *   `monitoringResults`: Stores single-run data.
*   **Missing:**
    *   **Fan-Out Architecture:** The `QUERY` step does not parallelize checks for competitors.
    *   **Aggregation Logic:** No tool to calculate "Share of Voice %" across a cohort.
    *   **Visualization:** No data structure to support a "You vs. Them" matrix in the report.

## 3. Proposed Specification

### User Story
**As a Consultant,** I want to generate a "Share of Voice Matrix" that compares my client against 3 top competitors across 20 high-value queries, **so that** I can show them exactly how much market share they are bleeding to specific rivals.

### Technical Implementation

#### A. Pipeline Update (`packages/core/src/contracts/query.contract.ts`)
Update `MultiQueryInput` to support a cohort:
```typescript
export interface CohortQueryInput {
  targets: Array<{ name: string; domain?: string }>; // Client + Competitors
  queries: string[];
  vertical: string;
  city: string;
}
```

#### B. Step Logic (`apps/audit-runner/src/steps/query-engines.ts`)
Refactor the Query Step to use **Fan-Out**:
1.  Receive `client` + `competitors`.
2.  **Parallel Execution:** Run `checkVisibility` (OpenAI/Perplexity/Gemini) for the *set* of queries.
    *   *Optimization:* Most AI engines (Perplexity, OpenAI Browsing) return *all* mentions in one pass. We don't need to run 4 separate checks if we structure the prompt correctly: "Rank the top 3 dentists in Austin."
    *   *Parsing:* The parser must identify if *any* of the defined competitors are mentioned, not just the client.
3.  **Result:** `CohortVisibilityResult` map.

#### C. Aggregation Tool (`packages/core/src/tools/share-of-voice.ts`)
New tool to calculate the matrix:
-   **Input:** `CohortVisibilityResult` (20 queries x 3 engines).
-   **Logic:**
    -   For each query, who won? (Position 1-3).
    -   Calculate `% Share of Voice` (Mentions / Total Queries).
    -   Calculate `Head-to-Head Win Rate` (How often did Client beat Comp A?).
-   **Output:** `ShareOfVoiceMatrix` object.

#### D. Database Schema (`packages/core/src/database/schema.ts`)
Add storage for the matrix:
```typescript
export const auditResults = pgTable('audit_results', {
  // ... existing ...
  competitorMatrix: jsonb('competitor_matrix'), // Stores the ShareOfVoiceMatrix
});
```

#### E. Report Template (`packages/core/src/report-templates/components/matrix.html`)
A new report section:
-   **Visual:** A heatmap grid. Rows = Competitors. Columns = Query Categories.
-   **Metric:** "You are invisible for 80% of 'Emergency' searches, while Dr. Smith owns 60%."

## 4. Pre-Mortem

*   **Failure Mode:** **Token Cost Explosion.** Running full checks for 4 domains x 20 queries x 3 engines = expensive.
    *   *Prevention:* **Single-Pass Extraction.** Do *not* run separate queries for each competitor. Run the query *once* ("Best dentist in Austin") and scan the *single response* for all 4 names. This costs the same as a single-client audit but yields 4x the value.
*   **Failure Mode:** **Name Collision.** "Smith Dental" matches "Smith Orthodontics".
    *   *Prevention:* Fuzzy matching with domain verification in the `parse-response` tool.
*   **Failure Mode:** **Missing Competitors.** Client doesn't know who their *real* digital competitors are.
    *   *Prevention:* Use the "Wildcard" queries from the Vertical Intelligence Engine to *discover* competitors first, then rank them.
