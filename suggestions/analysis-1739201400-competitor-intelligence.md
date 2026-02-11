# [Feature]: Competitor Intelligence & Narrative Engine

## 1. Structural Insight (The "Why")
The current `pare-engine` architecture operates on a "Known Knowns" model: it tracks the client and a pre-defined list of competitors. However, the core value of a $750 audit is **Discovery**. The client knows they are losing, but they often don't know *who* they are losing to in the eyes of the AI.

The "Consulting Engine" thesis relies on generating "Fear and Hope." 
*   **Fear:** "You thought Dr. Jones was your rival, but 'SmileDirectClub' is actually taking 60% of the AI recommendations."
*   **Hope:** "We can beat them because their sentiment is neutral, while yours is positive—you just lack visibility."

By shifting from "Competitor Tracking" (monitoring inputs) to "Market Discovery" (extracting outputs), we transform the tool from a tracker into a strategic advisor. This directly increases the spread between cost ($0.63) and value ($3,000 implementation), as it uncovers new threats that justify the retainer.

## 2. The Gap (Null Space)
*   **Current State:** `ParsedMentionSchema` in `packages/core/src/contracts/analysis.contract.ts` contains `competitorMentions`, which is a `Record<string, ...>`. This requires the operator to *guess* the competitors beforehand.
*   **The Void:** There is no schema field for `topRecommendedEntities`. If a completely new player dominates the results, the current system ignores them unless they were manually added to the input list.
*   **Missing Tool:** There is no aggregation logic to calculate "Market Share of Voice" across *all* entities found. `ai-visibility.ts` only scores the client.

## 3. Proposed Specification

### User Story
**As the Consultant,** I want the system to automatically identify the top 3 recommended entities for every query, **so that** I can show the client a "Market Landscape" report revealing their *actual* AI competitors, not just the ones they know about.

### Technical Implementation

#### A. Contract Changes (`packages/core/src/contracts/analysis.contract.ts`)
Update `ParsedMentionSchema` to include dynamic entity extraction:

```typescript
export const ParsedMentionSchema = z.object({
  // ... existing fields ...
  topRankedEntities: z.array(z.object({
    name: z.string(),
    position: z.number().int(),
    sentiment: z.enum(['positive', 'neutral', 'negative']),
    reason: z.string().optional().describe("Why the AI chose this entity"),
  })).describe("The top 3 entities recommended in this specific response"),
});
```

#### B. Tool Updates (`packages/core/src/tools/parse-response.ts`)
1.  **Prompt Engineering:** Update `buildParseSystemPrompt` and `buildParseUserPrompt` to instruct the LLM (Claude Haiku) to extract the "Top 3 Winners" regardless of whether they match the client/competitor list.
2.  **Extraction Logic:** Map the LLM output to the new `topRankedEntities` field.

#### C. New Tool: `competitor-intelligence.ts` (`packages/core/src/tools/`)
Create a new tool that runs *after* the analysis phase:

```typescript
interface MarketLeader {
  name: string;
  shareOfVoice: number; // % of queries where they appeared in top 3
  avgPosition: number;
  sentimentScore: number;
}

export function generateMarketLandscape(
  allMentions: ParsedMention[]
): MarketLeader[] {
  // Aggregate topRankedEntities across all queries
  // Normalize names (e.g., "Smile Direct" vs "SmileDirectClub")
  // Calculate frequency and position stats
  // Return sorted list of market dominators
}
```

#### D. Reporting (`apps/web/app/admin`)
*   **Admin Dashboard:** Add a "Market Landscape" table next to the "Score" card.
*   **PDF Report:** New section: "Who is Winning?" showing the Top 5 entities found in the audit, with the client highlighted (or missing).

### 4. Pre-Mortem (Risks & Mitigations)

*   **Risk:** **Name Normalization Hell.** "Dr. Smith Ortho", "Smith Orthodontics", and "Dr. John Smith" might be counted as 3 different entities.
    *   *Mitigation:* Use a lightweight LLM pass (or string similarity) in `competitor-intelligence.ts` to dedup/normalize entity names during aggregation.
*   **Risk:** **Token Cost Increase.** Extracting more fields might slightly increase input/output tokens.
    *   *Mitigation:* Negligible. We are already parsing the full response. Adding a list of 3 names is minimal overhead compared to the value.
*   **Risk:** **Hallucination.** LLM might invent rankings if the response is vague.
    *   *Mitigation:* Strict prompting: "If no clear ranking exists, return empty array."

## 5. Integration Plan
1.  **Step 1:** Modify `analysis.contract.ts` (Safe, additive).
2.  **Step 2:** Update `parse-response.ts` (Requires verifying prompt performance).
3.  **Step 3:** Build `competitor-intelligence.ts` (Pure function, easy to test).
4.  **Step 4:** Wire into `apps/audit-runner` pipeline.
