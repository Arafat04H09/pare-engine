# Pare Engine: Deployment Task Specification

> Generated: 2026-02-10
> Source: Repository latent intent analysis + 24 suggestion files (de-duplicated to 14 unique features)

---

## Repository State Summary

### What's REAL (Production-Grade)
| Component | Evidence |
|-----------|----------|
| **Pipeline orchestration** | `pipeline.ts` — 387-line fully wired Inngest function, 6 durable steps, `Promise.allSettled()`, graceful degradation |
| **23 core tools** | `packages/core/src/tools/` — crawl, query, parse, generate (jsonld/faq/llmstxt/pdf), score, alerts, commerce, optimizer |
| **11 step implementations** | All 4 analyzers + crawl + query + score + report + deliver + verify + sync-notion |
| **5-pillar scoring** | Real implementations in `packages/core/src/scoring/` with correct 30/30/15/10/15 weights |
| **Database schema** | 5 tables (clients, auditResults, monitoringResults, deliverables, promptLibrary) with indexes |
| **Admin dashboard** | Login, dashboard, clients list, client detail, audit detail pages |
| **Contracts** | 7 contract files as source of truth with Zod schemas |

### What's BROKEN or INCOMPLETE
| Issue | Location | Impact |
|-------|----------|--------|
| **BUILD FAILS** | `packages/query-engine` uses invalid Platform types (`'claude'`, `'google_aio'`) | **CRITICAL: pnpm build broken** |
| **Email delivery stubbed** | `apps/audit-runner/src/steps/deliver.ts` — `sendReportEmail()` is a console.log stub | Audits complete but never email reports |
| **PDF never persisted** | `deliver.ts` generates PDF in memory but never uploads/stores URL | Reports lost on server restart |
| **Audit rerun not wired** | `/api/admin/audits/[id]/rerun` route exists but doesn't trigger Inngest | Users can't retry audits |
| **Core exports locked** | `package.json` only exports `.`, `./contracts`, `./tools/crawler-analytics.js` | Tools can't be imported by web/admin |
| **138 TODO/FIXME/stub markers** | 63 files across the codebase | Technical debt scattered throughout |
| **Pipeline config bypasses core** | `loadPipelineConfig()` reads `process.env` directly instead of core config | Architecture violation |
| **`promptLibrary` table unused** | Schema exists but no seeding mechanism, no dynamic fetching | Static prompt files used instead |
| **`parentAuditId` exists but no delta logic** | Column in schema, no tool consumes it | Verify loop is wired but hollow |
| **No `./tools` barrel export** | No `tools/index.ts`, no subpath pattern in package.json | Biggest blocker for next features |
| **3 scaffold packages still in tree** | `packages/query-engine`, `packages/site-crawler`, `packages/report-generator` | Marked for deletion, still present |

### Deployment Readiness: ~65%
The core pipeline works (crawl → query → analyze → score → report) but 4 critical gaps block production:
1. Build blocker (query-engine types) — ~30 min fix
2. Email stub (deliver.ts) — ~2 hour fix
3. PDF storage (no persistence) — ~3 hour fix
4. API gaps (rerun, PDF endpoint) — ~2 hour fix

### Latent Intent Pattern

The codebase has completed Loop 1 but Loops 2 and 3 are hollow:

```
LOOP 1 (Built):   Audit → Score → Report        ($750 — "You're invisible")
LOOP 2 (Hollow):  Fix → Verify → Delta Report    ($3,000 — "I fixed it, here's proof")
LOOP 3 (Missing): Monitor → Alert → Retain       ($1,500/mo — "I'm watching the battlefield")
```

---

## Suggestion De-Duplication

24 suggestion files collapse into **14 unique features** across **5 strategic themes**:

| Unique Feature | Duplicate Files | Complexity |
|----------------|----------------|------------|
| **Core Exports Refactor** | `refactor-2026-02-10-core-exports.md` | S |
| **Verification Engine** | `analysis-1739224800-verify-loop.md` | L |
| **Implementation Workbench** | `analysis-20260210-implementation-workbench.md` | XL |
| **Proposal Engine** | `analysis-20260210-proposal-engine.md` | L |
| **Competitor Entity Graph** | `*-competitor-intelligence.md` (x3), `*-competitor-recon.md` | L |
| **Share of Voice Matrix** | `*-competitor-matrix.md` (x2) | L |
| **Competitor Gap Analyzer** | `*-competitor-gap-analyzer.md` | M |
| **Competitor Reverse-Eng** | `*-competitor-reverse-engineering.md` (x2), `*-reverse-engineering.md`, `*-novel-tools.md` | Research |
| **Adversarial Brand Audit** | `*-adversarial-brand-protection.md`, `*-adversarial-brand-audit.md` | M |
| **Multimodal/Video Audit** | `*-multimodal-audit.md` (x2), `*-multimedia-readiness.md` | L |
| **Persona-Driven Audit** | `*-persona-audit.md` | M |
| **Citation Graph** | `*-citation-graph.md` | M |
| **Semantic Review Orchestration** | `*-semantic-reviews.md` | M |
| **Vertical Intelligence Engine** | `*-vertical-intelligence.md` | L |
| **Agentic Commerce** | `*-agentic-commerce.md` | M |

---

## BATCH -1 — Critical Production Fixes (Before Everything)

> These are not features — they are bugs/gaps that block the existing pipeline from working in production. ~8 hours total.

### Task -1.1: Delete Scaffold Packages (Fixes Build)

**Files to DELETE:**
- `packages/query-engine/` — entire directory (invalid Platform types `'claude'`/`'google_aio'` break build)
- `packages/site-crawler/` — entire directory (replaced by Firecrawl in `tools/crawl-site.ts`)
- `packages/report-generator/` — entire directory (replaced by Puppeteer in `tools/generate-pdf.ts`)
- Update root `pnpm-workspace.yaml` if it references these packages

**Why:** CLAUDE.md explicitly states these are "Gemini-generated scaffolds... deleted after Round 2." They were never deleted. `query-engine` has hardcoded `Platform = 'claude'` which doesn't exist in the contract enum (`chatgpt | perplexity | gemini`), causing type errors that fail `pnpm build`.

**Complexity:** S | **Risk:** None (unused code) | **Blocks:** Everything

### Task -1.2: Wire Email Delivery

**Files to modify:**
- `apps/audit-runner/src/steps/deliver.ts` — Replace stub `sendReportEmail()` with real Resend call
- `packages/core/src/tools/send-report.ts` — Verify/complete Resend integration

**Current state:** `deliver.ts` line ~X:
```typescript
console.log(`[S12] Email delivery stubbed. Would send report to ${_email}...`);
return { emailSent: false, emailId: `stub-${Date.now()}` };
```

**Target:** Import and call `sendReportEmail` from core tools, pass PDF buffer + recipient.

**Complexity:** S | **Risk:** Low

### Task -1.3: Add PDF Storage

**Files to modify:**
- `apps/audit-runner/src/steps/deliver.ts` — Upload PDF buffer to storage, store URL
- `packages/core/src/database/schema.ts` — `reportPdfUrl` column already exists, just needs population
- `apps/web/app/api/admin/audits/[id]/pdf/route.ts` — Return stored PDF URL or redirect

**Current state:** PDF is generated in-memory by Puppeteer but never uploaded anywhere. `auditResults.reportPdfUrl` is always null.

**Options:** Upload to S3/Cloudflare R2/local filesystem. For Hetzner deployment, local filesystem + nginx static serve is simplest.

**Complexity:** M | **Risk:** Low

### Task -1.4: Wire Audit Rerun + Stripe Webhook

**Files to modify:**
- `apps/web/app/api/admin/audits/[id]/rerun/route.ts` — Call `inngest.send({ name: 'audit/requested', data: {...} })`
- `apps/web/app/api/webhooks/stripe/route.ts` — On successful payment, trigger audit pipeline

**Complexity:** S | **Risk:** Low

### Task -1.5: Consolidate Pipeline Config

**Files to modify:**
- `apps/audit-runner/src/pipeline.ts` — Replace `loadPipelineConfig()` with import from `@pare-engine/core`

**Current state:** `pipeline.ts` has its own 30-line `loadPipelineConfig()` that reads `process.env` directly, duplicating the Zod-validated `loadConfig()` in `packages/core/src/config.ts`.

**Complexity:** S | **Risk:** Low

---

## BATCH 0 — Foundation (Must Run First)

> Unblocks every other batch. No feature value alone, but zero features work without it.

### Task 0.1: Core Package Exports Refactor

**Files to modify:**
- `packages/core/src/tools/index.ts` — CREATE barrel export of all 23 tools
- `packages/core/package.json` — Add `./tools`, `./tools/*`, `./scoring`, `./config` exports
- `packages/core/src/index.ts` — Add re-export of tools, config, prompt-library

**Acceptance Criteria:**
- `import { crawlSite } from '@pare-engine/core/tools/crawl-site'` works from apps/web
- `import { generateJsonLd } from '@pare-engine/core/tools'` works (barrel)
- `pnpm build` succeeds, no circular deps

**Complexity:** S | **Risk:** Low | **Blocks:** Everything in Batch 1-4

### Task 0.2: Database Schema Extensions (Shared Tables)

**Files to modify:**
- `packages/core/src/database/schema.ts` — Add new tables + extend existing

**New Tables:**
```
remediationItems { id, auditId, type, status, originalContent, currentContent, presentationMarkdown, createdAt, updatedAt }
competitors { id, domain, businessName, vertical, createdAt }  // unique on domain
competitorSnapshots { id, competitorId, auditId, clientId, date, rankPosition, shareOfVoice, sourceEngine }
```

**Extend existing:**
```
promptLibrary += { successCount, runCount, lastUsedAt, performanceScore, isExperimental }
```

**Complexity:** S | **Risk:** Low (additive only) | **Blocks:** Batches 1-2

---

## BATCH 1 — Revenue Loop Closure (4 parallel sessions)

> Closes the "Audit → Fix → Verify" loop. The $3,000 sprint enabler.

### Task 1.1: Verification Engine + Delta Tool

**Purpose:** Prove causality — "Before: 34, After: 78, because I fixed X"

**Files:**
- `packages/core/src/tools/generate-delta.ts` — NEW
- `packages/core/src/contracts/delta.contract.ts` — NEW
- `apps/audit-runner/src/steps/verify.ts` — MODIFY
- `apps/web/app/admin/audits/[id]/verify/page.tsx` — NEW
- `packages/core/src/report-templates/delta-report.html` — NEW

**Spec:**
- Input: baselineAuditId, verificationAuditId
- Output: DeltaReport { score.before/after/delta, pillars[5], visibility.newMentions/lostMentions, narrative }
- "Soft fail" — negative deltas flagged, not auto-sent
- Separate "Technical Verification" (deterministic) from "Visibility Verification" (lagged)

**Complexity:** L | **Risk:** Medium

### Task 1.2: Implementation Workbench

**Purpose:** Human-in-the-loop fix review cockpit

**Files:**
- `packages/core/src/tools/generate-jsonld.ts` — MODIFY: Return `GenerationResult<T>`
- `packages/core/src/tools/generate-faq.ts` — Same refactor
- `packages/core/src/tools/generate-llmstxt.ts` — Same refactor
- `apps/web/app/admin/audits/[id]/workbench/page.tsx` — NEW
- `apps/web/app/api/remediation/route.ts` — NEW
- `apps/audit-runner/src/steps/create-remediations.ts` — NEW

**Spec:**
- Flow: Audit completes → Inngest emits "audit/scored" → createDraftRemediations → populates remediationItems
- UI: List gaps → "Generate Fix" → Editor with validation → "Approve & Package" → Download ZIP
- Markdown re-generated from currentContent (not stored stale)

**Complexity:** XL | **Risk:** Medium

### Task 1.3: Proposal Engine (Auto-SOW)

**Purpose:** Audit findings auto-generate a priced Statement of Work

**Files:**
- `packages/core/src/contracts/proposal.contract.ts` — NEW
- `packages/core/src/tools/generate-proposal.ts` — NEW
- `packages/core/src/report-templates/proposal.html` — NEW
- `apps/web/app/admin/audits/[id]/proposal/page.tsx` — NEW

**Spec:**
- Heuristic mapping: schema < 80% → $500 module; mentionRate < 0.2 → $1,500 module; technical issues → $150/hr
- ALL proposals are DRAFTS — operator must review
- LLM-generated executive summary per proposal (Claude Haiku)

**Complexity:** L | **Risk:** Low

### Task 1.4: Vertical Intelligence Engine (Feedback Loop)

**Purpose:** Prompts learn from audit results — stop wasting API calls

**Files:**
- `packages/core/src/tools/seed-prompts.ts` — NEW
- `packages/core/src/tools/select-prompts.ts` — NEW
- `apps/audit-runner/src/steps/query-engines.ts` — MODIFY
- `apps/audit-runner/src/steps/update-prompt-stats.ts` — NEW

**Spec:**
- Selection: top N by performanceScore (80%) + random low-runCount (20%)
- Fallback: If DB empty, use static files + trigger seed
- Templates stored with [city] placeholder, hydrated at runtime

**Complexity:** L | **Risk:** Low

---

## BATCH 2 — Competitive Intelligence (4 parallel sessions)

> The "$1,500/mo retainer justifier"

### Task 2.1: Competitor Entity Normalization

**Files:**
- `packages/core/src/tools/normalize-competitor.ts` — NEW
- `packages/core/src/scoring/ai-visibility.ts` — MODIFY (add persistCompetitorData)

**Spec:**
- Clean URLs → Check DB for match → LLM canonicalize if new → Upsert
- Only persist Top 5 results (ignore long tail)
- Lazy resolution: enrich only if appears >3 times

**Complexity:** M | **Risk:** Low

### Task 2.2: Share of Voice Matrix

**Files:**
- `packages/core/src/tools/share-of-voice.ts` — NEW
- `packages/core/src/contracts/query.contract.ts` — MODIFY (add CohortQueryInput)
- `packages/core/src/report-templates/components/matrix.html` — NEW
- `apps/audit-runner/src/steps/query-engines.ts` — MODIFY

**Spec:**
- ONE query reveals ALL competitors — single-pass multi-entity extraction (no 4x cost)
- Output: ShareOfVoiceMatrix { totalQueries, share: {[domain]: %}, headToHead }
- Visual: Pie chart + "Head-to-Head Battles" table

**Complexity:** L | **Risk:** Medium

### Task 2.3: Competitor Gap Analyzer ("Why You Lost")

**Files:**
- `packages/core/src/tools/analyze-competitor.ts` — NEW
- `apps/web/app/admin/audits/[id]/competitor/page.tsx` — NEW
- `apps/audit-runner/src/steps/analyze-competitor.ts` — NEW (optional Inngest step)

**Spec:**
- Parallel crawl both domains (5 pages each) → Extract → Gap calculation → LLM narrative
- On-demand only (not automatic per audit)
- Competitor blocking → fallback to "External Signals Only" mode

**Complexity:** M | **Risk:** Medium

### Task 2.4: Prompt Permutation Engine

**Files:**
- `packages/core/src/tools/generate-prompt-permutations.ts` — NEW
- `apps/audit-runner/src/steps/query-engines.ts` — MODIFY

**Spec:**
- Claude Haiku generates 10 variations across: specificity, urgency, constraint, comparison, conversational
- Cost: ~$0.001 per generation

**Complexity:** S | **Risk:** Low

---

## BATCH 3 — Advanced Audit Modules (4 parallel sessions)

> "Blue Ocean" features no competitor offers.

### Task 3.1: Adversarial Brand Audit ("Red Team")

**Files:**
- `packages/core/src/tools/audit-adversarial.ts` — NEW
- `packages/core/src/tools/scan-hallucinations.ts` — NEW
- `packages/core/src/contracts/analysis.contract.ts` — MODIFY

**Spec:**
- Attack vectors: "Karen", "Competitor", "Closure", "Price Anchor"
- Judge: Claude Sonnet with Chain of Thought
- Hallucination scanner: Temporal/price conflicts, 404 pages
- Output: BrandResilienceScore (0-100)

**Complexity:** M | **Risk:** Low

### Task 3.2: Multimodal/Video Audit

**Files:**
- `packages/core/src/tools/extract-media.ts` — NEW
- `packages/core/src/tools/analyze-video-seo.ts` — NEW
- `packages/core/src/tools/generate-video-schema.ts` — NEW
- `packages/core/src/contracts/crawl.contract.ts` — MODIFY (add MediaAssetSchema)

**Spec:**
- Detect YouTube/Vimeo iframes, video tags → Check for VideoObject schema
- YouTube cross-ref: "You have 50 videos, only 2 are schema-marked"
- Transcript check: CC available? (critical for RAG)

**Complexity:** L | **Risk:** Medium

### Task 3.3: Persona-Driven Audit

**Files:**
- `packages/core/src/tools/generate-personas.ts` — NEW
- `packages/core/src/scoring/ai-visibility.ts` — MODIFY (optional persona param)

**Spec:**
- Claude Haiku → { name, description, searchStyle, topConcerns[] }
- Query wrapping: "Act as {persona}. Ask..."
- MUST VALIDATE: Do results actually differ across personas?
- Cost control: Top 5 queries only

**Complexity:** M | **Risk:** Medium

### Task 3.4: Citation Graph Visualizer

**Files:**
- `packages/core/src/tools/normalize-citations.ts` — MODIFY (add classification + authority)
- `packages/core/src/tools/generate-citation-graph.ts` — NEW
- `packages/core/src/report-templates/components/citation-graph.html` — NEW (D3.js)

**Spec:**
- Extract cited_urls → Group by domain → Count frequency → Classify → Map edges
- Output: CitationGraph { nodes[], edges[] }
- "Top 5 Sources Only" filter

**Complexity:** M | **Risk:** Low

---

## BATCH 4 — Engagement & Retention (3 parallel sessions)

> Long-tail features for $1,500/mo retainer.

### Task 4.1: Semantic Review Orchestration

**Files:**
- `packages/core/src/tools/analyze-review-semantics.ts` — NEW
- `packages/core/src/tools/generate-review-campaign.ts` — NEW
- `apps/web/app/admin/audits/[id]/reviews/page.tsx` — NEW

**Spec:**
- Compare client vs competitor review n-grams → Gap analysis → Target top 3 missing clusters
- Output: ReviewCampaignArtifacts { emailTemplate, smsTemplate, qaSeed }
- No review gating, no incentives. Psychological priming only. Include disclaimer.

**Complexity:** M | **Risk:** Low

### Task 4.2: Agentic Commerce Readiness

**Files:**
- `packages/core/src/tools/audit-agentic-commerce.ts` — MODIFY
- `packages/core/src/contracts/analysis.contract.ts` — MODIFY

**Spec:**
- UCP/ACP schema validation: price, currency, availability, MerchantReturnPolicy
- Bot access check: robots.txt allows GPTBot on /product/* paths
- Output: AgenticReadinessScore (0-100) with traffic light
- Conditional: Only run if vertical === 'ecommerce' or operator enables

**Complexity:** M | **Risk:** Low

### Task 4.3: AIO Trigger Detector + Bot Welcome Mat

**Files:**
- `packages/core/src/tools/aio-detect.ts` — NEW
- `packages/core/src/tools/bot-analyzer.ts` — NEW

**Spec:**
- AIO: Query Serper → Check for ai_overview → Match cited_urls against domains
- Bot Mat: Fetch with GPTBot User-Agent → If 403, flag "AI Invisible"

**Complexity:** S | **Risk:** Low

---

## Parallelization Matrix

```
TIME →

BATCH -1 ║ -1.1 Delete scaffolds ═╗
(Fixes)  ║ -1.2 Wire email ═══════╬══╗
         ║ -1.3 PDF storage ══════╬══╬══╗
         ║ -1.4 Wire rerun ═══════╬══╝  ║
         ║ -1.5 Config consolidate╝     ║
                                        ║
BATCH 0  ║ 0.1 Core Exports ═══════════╬══╗
(Found.) ║ 0.2 Schema Extend ══════════╬══╬══╗
                                       ║  ║  ║
BATCH 1  ║ 1.1 Verify Engine ═════════╬══╬══╬════════╗
(Revenue)║ 1.2 Workbench ═════════════╬══╬══╬════════╬══╗
         ║ 1.3 Proposal ══════════════╬══╝  ║        ║  ║
         ║ 1.4 Vertical Intel ════════╝     ║        ║  ║
                                            ║        ║  ║
BATCH 2  ║ 2.1 Competitor Norm ════════════╬════════╬══╬══╗
(Comp.)  ║ 2.2 Share of Voice ═════════════╬════════╬══╬══╬══╗
         ║ 2.3 Gap Analyzer ══════════════ ╬════════╬══╝  ║  ║
         ║ 2.4 Prompt Perms ══════════════ ╝        ║     ║  ║
                                                    ║     ║  ║
BATCH 3  ║ 3.1 Adversarial ═══════════════════════╬═════╬══╬══╗
(Blue    ║ 3.2 Multimodal ════════════════════════╬═════╬══╬══╬══╗
 Ocean)  ║ 3.3 Persona Audit ═════════════════════╬═════╬══╝  ║  ║
         ║ 3.4 Citation Graph ════════════════════╝     ║     ║  ║
                                                        ║     ║  ║
BATCH 4  ║ 4.1 Review Semantics ═══════════════════════╬═════╝  ║
(Retain) ║ 4.2 Agentic Commerce ══════════════════════╬═════════╝
         ║ 4.3 AIO + Bot Mat ═════════════════════════╝
                                                       DONE
```

**Within each batch, all tasks are parallelizable** (no intra-batch dependencies).

**Inter-batch dependencies:**
- Batch -1 **blocks** Batch 0 (can't export tools if build is broken)
- Batch 0 **blocks** Batches 1-4 (exports + schema)
- Batches 1, 2, 3 can run **in parallel** after Batch 0
- Batch 4 benefits from Batch 2 data but can start with manual input

---

## Summary

| Batch | Sessions | Description | Revenue Impact |
|-------|:--------:|-------------|----------------|
| **-1 — Production Fixes** | 5 (parallel) | Delete scaffolds, wire email/PDF/rerun, fix config | **Unblocks deployment** |
| **0 — Foundation** | 2 | Core exports refactor + shared DB tables | Unblocks features |
| **1 — Revenue Loop** | 4 parallel | Verify engine, workbench, proposal, learning prompts | Enables $3K sprints |
| **2 — Competitive Intel** | 4 parallel | Entity graph, share of voice, gap analysis, permutations | Justifies $1.5K/mo retainer |
| **3 — Blue Ocean** | 4 parallel | Adversarial, multimodal, persona, citation graph | Differentiation moat |
| **4 — Engagement** | 3 parallel | Review semantics, agentic commerce, AIO detection | Long-tail retention |
| **Total** | **22 tasks** | **~35 new files, ~20 modified** | **Full consulting engine** |
