# Feature: The Verification Engine (Audit → Fix → Verify)

**Date:** February 10, 2026
**Status:** Proposed
**Owner:** System Architect

---

## 1. Structural Insight (The "Why")

The `MASTER_BUILD_PLAN` explicitly states: **"We own the engine. Marginal cost is $0.63/audit. Everything below maximizes the spread."**

Currently, the spread relies on selling the *problem* (The Audit: "You are invisible").
The real revenue multiplier, however, is selling the *solution* (The Sprint: "I fixed it").

To charge $3,000+ for implementation, the consultant must prove **Causality**:
1.  **Baseline:** You were invisible (Score: 34).
2.  **Action:** I injected JSON-LD and fixed citations.
3.  **Result:** You are now visible (Score: 78).

Without a dedicated **Verification Engine**, this proof is manual, messy, and prone to "hand-waving." We need a cryptographic-level proof of value: a side-by-side "Before & After" artifact that makes the ROI undeniable.

## 2. The Gap (Null Space)

**What Exists:**
- `scoring/*`: We can generate a score.
- `tools/generate-jsonld.ts`: We can generate the fix.
- `database/schema.ts`: We store audits (presumably, though `parent_audit_id` is likely missing).

**What is Missing (The Null Space):**
- **State Tracking:** No concept of "Baseline" vs. "Verification" in the data model.
- **Delta Logic:** No tool to calculate `Score(T2) - Score(T1)` or identify specific wins (e.g., "Perplexity now cites you 3x").
- **Visual Proof:** The `apps/web` admin dashboard lacks a "Split View" to show the transformation.

We are currently building a tool that *diagnoses* (Doctor), but we need a tool that *validates the cure* (Surgeon).

## 3. Proposed Specification

### User Story
> **As the Consultant,** I want to run a "Verification Audit" linked to a previous "Baseline Audit"
> **So that** I can automatically generate a "Proof of Impact" report showing exactly how much the client's visibility improved after my work.

### Technical Implementation

#### A. Database Changes (`packages/core/src/database/schema.ts`)

We need to link audits to establish a causal chain.

```typescript
// Modify 'audits' table
export const audits = pgTable('audits', {
  // ... existing fields ...
  type: text('type').notNull().default('standard'), // 'standard', 'baseline', 'verification'
  parentAuditId: uuid('parent_audit_id').references(() => audits.id), // The baseline this verification compares against
  deltaSummary: jsonb('delta_summary'), // Snapshot of the improvement (e.g., { scoreDelta: +44, newCitations: 5 })
});
```

#### B. New Tool: Delta Engine (`packages/core/src/tools/generate-delta.ts`)

This tool takes two audit IDs and produces a semantic difference report.

```typescript
interface DeltaReport {
  score: {
    before: number;
    after: number;
    delta: number;
  };
  pillars: {
    [key in PillarName]: {
      before: number;
      after: number;
      delta: number;
      reason: string; // e.g., "Schema fixed (+15pts)"
    };
  };
  visibility: {
    newMentions: string[]; // "Perplexity now mentions you in 'Best Dentist'"
    lostMentions: string[];
  };
  narrative: string; // LLM-generated story: "After implementing the JSON-LD schema..."
}
```

*Logic:*
1.  Fetch both full audit results.
2.  Calculate numeric diffs.
3.  Use LLM (Claude Haiku) to summarize the *qualitative* changes (e.g., compare the `ai_visibility` reasoning text).
4.  Output the `DeltaReport`.

#### C. UI Changes (`apps/web/app/admin/audits/[id]/verify/page.tsx`)

A new view in the Operator Dashboard specifically for closing the sale/retainer.

- **Header:** Big green stats ("+44 Points", "Visible in 3 AI Engines").
- **Layout:** Split pane.
    - **Left:** "Feb 10 (Before)" - Greyed out, showing errors.
    - **Right:** "Feb 24 (After)" - Bright, showing fixes.
- **Action:** "Generate ROI PDF" (A specialized PDF template focusing solely on the delta).

#### D. Integration (Inngest)

Update the pipeline to handle verification runs.

1.  **Trigger:** `run_verification_audit` event.
2.  **Step 1:** Run standard audit (crawl -> score).
3.  **Step 2:** Detect `parentAuditId`.
4.  **Step 3:** Run `generate-delta`.
5.  **Step 4:** Save to `deltaSummary`.

## 4. Pre-Mortem (Risks & Mitigations)

**Risk 1: The Score Drops (The "Volatility" Problem)**
*Scenario:* We fix the schema, but Perplexity hallucinated a negative review that day, dropping the score.
*Mitigation:* **"Soft Fail" Logic.** The `generate-delta` tool should flag negative deltas and ask the operator for a manual override or "Contextual Explanation" (e.g., "Market fluctuation masked technical gains"). We never send a negative verification report automatically.

**Risk 2: Time Lag**
*Scenario:* We deploy fixes, but AI engines haven't re-indexed the site yet.
*Mitigation:* **"Technical Verification" vs. "Visibility Verification".**
- *Immediate:* Verify Technical fixes (Schema, llms.txt, Speed). This is deterministic.
- *Lagged:* Verify AI Visibility. The report should explicitly separate these: "Fixes deployed (Verified) — Awaiting AI Indexing (Pending)."

**Risk 3: False Causality**
*Scenario:* The score went up because a competitor went offline, not because of our fix.
*Mitigation:* The "Why You Lost/Won" tool (B5) needs to be integrated here to attribute gains correctly.

---

**Next Steps:**
1.  Migration: Add `parent_audit_id` to `audits` table.
2.  Tool: Implement `generate-delta.ts`.
3.  UI: Scaffold the comparison page.
