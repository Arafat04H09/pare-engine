# [Feature Spec]: Automated Proposal Engine & SOW Generator

## 1. Structural Insight (The "Why")
**Latent Intent:** The `pare-engine` thesis ("Maximize the spread between $0.63 cost and $750 revenue") currently optimizes the *Audit* (Diagnosis) and the *Fix* (Cure). However, the critical bridge—the **Sale** (Proposal/SOW)—is manual.

**The Friction:**
1.  Consultant runs Audit ($0.63).
2.  Consultant sees "Missing JSON-LD" (Critical).
3.  Consultant *manually* writes a proposal: "I will fix your JSON-LD for $500."
4.  Consultant sends PDF.

**The Leverage Point:**
The Engine *already knows* exactly what is wrong and exactly how to fix it (via `generate-jsonld`). It should theoretically be able to write the Statement of Work (SOW) instantly.
*   **Current State:** Audit -> Manual Sales Call -> Manual Proposal -> Sprint.
*   **Desired State:** Audit -> Auto-Generated Proposal (Draft) -> Sales Call -> Sign.

This reduces the "Time to Quote" to zero, turning the Audit directly into a checkout flow for the $3,000 sprint.

## 2. The Gap (Null Space)
*   **Existing:** `tools/generate-pdf.ts` handles `audit-full` and `audit-mini`.
*   **Existing:** `tools/agentic-commerce.ts` and `tools/generate-jsonld.ts` identify and solve specific problems.
*   **Missing:** A dedicated `generate-proposal` tool that:
    1.  Ingests `FullReportData` (the audit).
    2.  Maps `findings` to `SprintModules` (standardized service units).
    3.  Applies a `PricingModel` (e.g., "$150/hr" or "Fixed Fee per Schema").
    4.  Outputs a signed-ready SOW PDF.

## 3. Proposed Specification

### User Story
**As the Consultant,**
I want to click "Generate Proposal" after an audit is complete,
**So that** I receive a pre-filled, priced Statement of Work that maps every "Critical" finding to a specific "Fix" line item,
**allowing me** to present a $3,000 solution immediately without manual scoping.

### Technical Implementation

#### A. New Contract: `packages/core/src/contracts/proposal.contract.ts`
Define the structure of a Proposal.

```typescript
export interface SprintModule {
  id: string;
  title: string;          // e.g., "Schema Implementation Package"
  description: string;    // e.g., "Implement JSON-LD for LocalBusiness and FAQ."
  linkedFindings: string[]; // IDs of findings this solves
  effortEstimate: string; // "3-5 hours"
  price: number;          // 500
}

export interface ProposalData {
  auditId: string;
  client: ClientInfo;
  generatedAt: Date;
  modules: SprintModule[];
  pricing: {
    subtotal: number;
    discount?: number;
    total: number;
    currency: string;
  };
  timeline: string;       // "2 weeks"
  terms: string;          // Standard legalese
}
```

#### B. New Tool: `packages/core/src/tools/generate-proposal.ts`
Logic to map Audit -> Proposal.

*   **Input:** `FullReportData`, `PricingConfig` (optional override).
*   **Logic:**
    *   If `schemaStructuredData.score < 80` -> Add "Schema Fix Module" ($500).
    *   If `aiVisibility.mentionRate < 0.2` -> Add "Competitor Displacement Module" ($1,500).
    *   If `technicalReadiness.issues.length > 0` -> Add "Technical SEO Clean-up" ($150/hr).
*   **Output:** `ProposalData` object.

#### C. Updated PDF Generator: `packages/core/src/tools/generate-pdf.ts`
Expand to handle `type: 'proposal'`.
*   New template: `packages/core/src/report-templates/proposal.html`.
*   Style: Clean, professional contract style (less graphical than the audit, more legal/commercial).

#### D. Integration (Web Admin)
*   **UI:** On `/admin/audit/[id]`, add a "Draft Proposal" button.
*   **Review Modal:** Operator reviews the auto-suggested line items, adjusts pricing, and clicks "Generate PDF".

### Pre-Mortem (Risks & Mitigations)
*   **Risk:** Proposal hallucinates scope (e.g., promising a fix for something vague).
    *   *Mitigation:* Strict mapping. Only specific, detectable failures trigger specific, defined modules. No "General Consulting" line items.
*   **Risk:** Pricing mismatch (Undercutting complex work).
    *   *Mitigation:* All generated proposals are **DRAFTS**. The Operator MUST review before sending. The UI should make this clear.
*   **Risk:** "Cookie Cutter" feel.
    *   *Mitigation:* Use LLM (Claude Haiku) to write a custom "Executive Summary" based on the specific audit findings, injecting it into the proposal template.

## 4. Immediate Action Plan
1.  Create `proposal.contract.ts`.
2.  Create `proposal.html` template.
3.  Implement `generate-proposal.ts` with basic heuristic mapping.
