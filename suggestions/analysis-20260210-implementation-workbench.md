# [Implementation Workbench]: Strategic Analysis & Spec

## 1. Structural Insight (The "Why")
**Latent Intent:** The core business model relies on the "Audit → Fix → Verify" loop. The Audit ($750) identifies problems, but the Fix ($3,000 sprint) captures the real value.
**The Leverage Point:** Currently, we have excellent tools (`generate-jsonld.ts`, `generate-llmstxt.ts`) that produce raw artifacts. However, sending a raw LLM output to a client is risky. A single hallucinated `@type` or invalid URL destroys trust.
**The Spread:** To maximize the spread between cost ($0.63) and revenue ($3,000), the "Fix" phase must be as automated as the "Audit" phase, *but* with a zero-friction "Human-in-the-Loop" verification step. The Consultant needs a cockpit to review, tweak, and package these fixes without touching an IDE or manually copy-pasting from a Markdown file.

## 2. The Gap (Null Space)
**What Exists:**
*   **Generators:** `packages/core/src/tools/generate-jsonld.ts` (and friends) exist and are high-quality.
*   **Output:** They return a formatted Markdown *string* intended for a final PDF report.
*   **Logic:** They contain the structured data internally (`JsonLdOutput`) but discard it to return the presentation string.

**What is Missing:**
*   **State:** No database table to store "Draft Fixes" or "Remediation Plans."
*   **Interface:** No Admin UI to interactively edit the generated JSON-LD before it is "Approved."
*   **Structure:** The tools need to return structured data (JSON) *alongside* the presentation string so the UI can populate a code editor.

## 3. Proposed Specification

### User Story
> "As the Consultant, I want to view a 'Workbench' for a completed audit where I can generate, review, edit, and approve implementation assets (JSON-LD, robots.txt) so that I can deliver a verified 'Fix Pack' to the client with 100% confidence."

### Technical Implementation

#### A. Backend Tooling Refactor
Update `packages/core/src/tools/*.ts` to return a `GenerationResult` object instead of a raw string.
```typescript
// packages/core/src/types.ts
export interface GenerationResult<T = any> {
  markdown: string;       // The existing report-ready output
  raw: T;                 // The structured data (e.g. JsonLdOutput object)
  validationErrors: string[];
}
```
*Refactor `generate-jsonld.ts` to return this structure.*

#### B. Database Schema (Drizzle)
New table `remediation_items` to track the state of a fix.
```typescript
// packages/core/src/database/schema.ts
export const remediationItems = pgTable('remediation_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  auditId: uuid('audit_id').references(() => audits.id).notNull(),
  type: text('type').notNull(), // 'jsonld', 'llmstxt', 'faq', 'content_rewrite'
  status: text('status').default('draft').notNull(), // 'draft', 'approved', 'delivered'
  originalContent: jsonb('original_content'), // The LLM's first draft
  currentContent: jsonb('current_content'),   // The edited version
  presentationMarkdown: text('presentation_markdown'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

#### C. UI: The Workbench (`apps/web/app/admin/audits/[id]/workbench`)
A new Admin Route.
1.  **Overview Panel:** List of detected gaps (from Audit) vs. created Remediation Items.
2.  **Action:** "Generate Fix" button next to "Missing Schema."
3.  **Editor View:**
    *   **Left:** Diff view or Read-only context (e.g., "Analysis says: Missing FAQ").
    *   **Center:** Monaco Editor (JSON/Markdown) loaded with `currentContent`.
    *   **Right:** Preview / Validation Status.
4.  **Controls:** "Regenerate," "Save Draft," "Approve & Package."

#### D. Integration
1.  **Inngest:** A new step `createDraftRemediations` that runs *after* the audit score is finalized. It pre-populates the Workbench with drafts for all detected gaps.
2.  **Download:** A "Download Deliverables" button in the Dashboard that zips all 'approved' items.

## 4. Pre-Mortem (Risks & Mitigations)
*   **Risk:** The LLM generates valid JSON that is semantically wrong (e.g., wrong `@id` reference).
    *   *Mitigation:* The Workbench must include a "Validation" step that runs `parse-jsonld` logic on the *edited* content, not just the generated one.
*   **Risk:** The UI becomes too complex (building a full IDE).
    *   *Mitigation:* Keep it simple. Text area first, Monaco second. No multi-file dependency management yet.
*   **Risk:** Data desync between `markdown` report and `json` file.
    *   *Mitigation:* The `markdown` should be dynamically regenerated from the `currentContent` JSON when downloading the final report, rather than stored statically.
