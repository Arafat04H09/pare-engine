# Vertical Intelligence Engine: From Static Code to Learning Database

## 1. Structural Insight (The "Why")
**The Thesis:** "Every audit for a dentist improves every future dentist audit." (Master Build Plan, Section 3, B9).

Currently, `pare-engine` operates as a stateless function. If we audit 50 dental practices, the 51st audit uses the exact same static list of queries (`DENTAL_PROMPTS` in `packages/core/src/prompt-library/dental.ts`) as the 1st. It does not "learn" which queries yield high-value signals (competitor mentions) and which are duds (zero results).

**The Leverage:**
By moving prompts from **Code (Static)** to **Database (Dynamic)** and implementing a feedback loop, we create a "Data Moat."
1.  **Efficiency:** Stop paying API costs for queries that never produce results.
2.  **Effectiveness:** Automatically surface "long-tail" queries that discovered competitors in previous audits.
3.  **Sales Value:** The Consultant can say, "We don't just guess keywords. We use a proprietary dataset of 5,000+ proven high-signal queries for the Dental industry."

## 2. The Gap (Null Space)
*   **Existing:**
    *   `packages/core/src/prompt-library/*.ts`: Static lists of prompts hardcoded in TypeScript.
    *   `packages/core/src/database/schema.ts`: A `promptLibrary` table exists but appears unused/unconnected to the execution flow.
    *   `packages/core/src/tools/score-delta.ts`: Tracks score changes, but not *query performance*.
*   **Missing:**
    *   **Seeding Mechanism:** No bridge to move the `.ts` prompts into the Postgres table.
    *   **Dynamic Fetching:** The `query-engines` tool likely imports `getPromptsForVertical` which reads from the static file, ignoring the DB.
    *   **Feedback Loop:** No mechanism to record "Did this query find a mention?" back to the `promptLibrary` table.
    *   **Optimization Logic:** No "Epsilon-Greedy" selection (Run best queries + test new ones).

## 3. Proposed Specification

### User Story
**As a Consultant,** I want the system to automatically select the highest-performing queries for a specific vertical (e.g., "Dental") and mix in a few experimental queries, **so that** I maximize the discovery of competitor "soft spots" while minimizing API costs on dead-end keywords.

### Technical Implementation

#### A. Database Schema Updates (`packages/core/src/database/schema.ts`)
Enhance `promptLibrary` to track performance:
```typescript
export const promptLibrary = pgTable('prompt_library', {
  // ... existing fields ...
  successCount: integer('success_count').default(0), // Number of times this query found a brand mention
  runCount: integer('run_count').default(0),         // Number of times this query has been used
  lastUsedAt: timestamp('last_used_at'),
  performanceScore: numeric('performance_score').default('0'), // (successCount / runCount) * 100
  isExperimental: boolean('is_experimental').default(false),   // For AI-generated "Wildcard" queries
});
```

#### B. Seeding Tool (`packages/core/src/tools/seed-prompts.ts`)
Create a script/tool to hydrate the DB from the existing static files:
1.  Import `getAllTemplates` from `prompt-library/index.ts`.
2.  Upsert into `promptLibrary` table (deduplicate by `promptText` + `vertical`).

#### C. Dynamic Prompt Selector (`packages/core/src/tools/select-prompts.ts`)
Replace the static `getPromptsForVertical` with a "Smart Selector":
1.  **Input:** `vertical`, `limit` (e.g., 20).
2.  **Logic (Epsilon-Greedy):**
    *   **Exploit (80%):** Fetch top 16 queries by `performanceScore`.
    *   **Explore (20%):** Fetch 4 random queries (either low `runCount` or `isExperimental`).
3.  **Fallback:** If DB is empty, fall back to static list (and trigger seed).

#### D. Feedback Loop (`apps/audit-runner/src/steps/analyze-results.ts`)
After `monitoringResults` are processed:
1.  Identify which queries yielded a `brandMentioned: true` or `competitorMentions` > 0.
2.  Async update `promptLibrary` for those specific prompt IDs:
    *   Increment `runCount`.
    *   If mention found, increment `successCount`.
    *   Recalculate `performanceScore`.

### Integration
*   **Inngest:** The `analyze-results` step triggers a side-effect event `prompt.stats.update` to handle the DB write (non-blocking).
*   **Admin UI:** A simple "Prompt Manager" page to view the leaderboard of queries per vertical.

## 4. Pre-Mortem

*   **Failure Mode:** **Cold Start.** The first few audits have 0 stats, so the "Top N" logic fails or returns nothing.
    *   *Prevention:* The `select-prompts` tool must default to "All" or "Static List" if `runCount` sum is low.
*   **Failure Mode:** **Echo Chamber.** The system keeps running the same 10 queries because they worked once, missing new trends.
    *   *Prevention:* Enforce the "Explore" parameter (min 20% random/new queries).
*   **Failure Mode:** **City Specificity.** "Best Dentist in Austin" works in Austin but not Dallas.
    *   *Prevention:* The prompt stored in DB must be the *Template* ("Best Dentist in [city]"), not the hydrated string. The `select-prompts` tool hydrates it *after* fetching.
