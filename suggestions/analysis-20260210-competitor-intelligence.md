# [Competitor Intelligence Graph]: Strategic Analysis & Spec

## 1. Structural Insight (The "Why")
**Latent Need:** The `MASTER_BUILD_PLAN.md` states: *"FEAR sells better than features."* (A2).
Currently, `pare-engine` captures competitor data transiently during an audit. It knows "Dr. Smith" beat the client *today*. But it cannot answer: *"Is Dr. Smith rising or falling over the last 3 months?"* or *"Who is the new threat appearing in the Austin Dental market?"*

By treating Competitors as ephemeral JSON blobs, we lose the **Market Intelligence** asset. A Consultant doesn't just watch the client; they watch the *war zone*.
Transforming competitor data from "audit metadata" to "first-class entities" allows the engine to generate **"Market Threat Alerts"**.
*Example:* "Alert: 3 new competitors have appeared in the Top 5 for 'Emergency Dentist' this month."
This justifies the retainer ($1,500/mo) far better than a static score report.

## 2. The Gap (Null Space)
*   **Current State:**
    *   `packages/core/src/database/schema.ts`: `monitoring_results` table has a `competitor_mentions` JSONB column. This is a "write-only" graveyard. You cannot efficiently query across all audits to find a specific competitor's trend.
    *   `packages/core/src/scoring/ai-visibility.ts`: Extracts mentions but doesn't normalize or persist them as entities.

*   **Missing:**
    *   A canonical `competitors` table (to dedupe "Smith Dental" vs "Dr. Smith").
    *   A `competitor_snapshots` table to track *their* visibility score history alongside the client's.
    *   Logic to "upsert" competitors during every audit run.

## 3. Proposed Specification

### User Story
> **As a Consultant**, I want to see a "Market Share Velocity" chart showing my client vs. top 3 competitors over time, **so that** I can prove that our work is outcompeting the market (or alert the client to new threats).

### Technical Implementation

#### A. Database Changes (`packages/core/src/database/schema.ts`)
Create two new tables to normalize the JSONB data:

```typescript
export const competitors = pgTable('competitors', {
  id: uuid('id').defaultRandom().primaryKey(),
  domain: text('domain').notNull(), // The canonical identifier
  businessName: text('business_name').notNull(),
  vertical: text('vertical'), // e.g., 'dental'
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  domainIdx: unique('idx_competitors_domain').on(table.domain),
}));

export const competitorSnapshots = pgTable('competitor_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  competitorId: uuid('competitor_id').references(() => competitors.id),
  auditId: uuid('audit_id').references(() => auditResults.id), // Link to the run where we saw them
  clientId: uuid('client_id').references(() => clients.id), // The client we were auditing when we saw them
  date: timestamp('date').defaultNow(),
  rankPosition: integer('rank_position'), // e.g., 1, 2, 3
  shareOfVoice: integer('share_of_voice'), // Derived metric
  sourceEngine: text('source_engine'), // 'perplexity', 'google', etc.
});
```

#### B. New Tool: Competitor Normalizer (`packages/core/src/tools/normalize-competitor.ts`)
During the `AI Visibility` scoring phase, we often get messy names ("Smith Dental Clinic", "Smith Dental").
*   **Input:** List of raw competitor names/URLs found in AI responses.
*   **Logic:**
    1.  Clean URLs (strip UTM, www).
    2.  Check `competitors` table for existing match.
    3.  If new, use simple heuristic or cheap LLM call to canonicalize name.
    4.  Upsert to `competitors`.
    5.  Insert into `competitorSnapshots`.

#### C. Integration (`packages/core/src/scoring/ai-visibility.ts`)
Modify the existing scoring logic. currently, it calculates the client's score.
*   **Add:** A side-effect step `persistCompetitorData()`.
*   **Trigger:** After the client's visibility is scored, iterate through the "Other Entities" found in the response and save them to the new tables.

#### D. UI Changes (`apps/web/app/admin/...`)
*   **New View:** `/admin/market-intelligence`
*   **Widget:** "Rising Threats" (Competitors with +Velocity in rank).

## 4. Pre-Mortem (Risks & Mitigations)

*   **Risk: Data Explosion.**
    *   *Scenario:* Every audit finds 10 random businesses. After 100 audits, we have 1,000 "competitors" that are just irrelevant noise.
    *   *Mitigation:* **Top-K Filter.** Only persist competitors that appear in the **Top 5** results. Ignore the "also ran" tail.

*   **Risk: Entity Duplication.**
    *   *Scenario:* "google.com/maps?cid=..." vs "smithdental.com".
    *   *Mitigation:* Prioritize Domain as the unique key. If a result only has a map link, try to resolve the domain via Google Places API (already in Tier 2 integrations).

*   **Risk: Cost.**
    *   *Scenario:* Resolving domains for every competitor costs API credits.
    *   *Mitigation:* Lazy resolution. Store the raw URL first. Only resolve/enrich if they appear >3 times (become a "Recurring Threat").
