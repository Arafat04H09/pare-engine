# Reality vs Vision: Gap Analysis

## The Five-Gear Flywheel vs What Actually Exists

### Gear 1: Automated Prospecting Engine -- 0% Built

**Vision:** Batch audit 50 businesses/week, auto-rank, auto-generate personalized outreach.

**Reality:**
- No business discovery tool (no Google Maps API integration, no directory scraper)
- No batch audit trigger (the pipeline processes one audit at a time)
- No prospect ranking algorithm
- No email sequence generator
- No outreach template system
- No warm-up or deliverability management
- The website has 3 stub pages (about, contact, services) -- no homepage, no intake form

**What's needed to close the gap:**
1. Google Maps / Yelp API integration for business discovery
2. Batch audit mode in Inngest (process N audits in sequence with shared config)
3. Prospect scoring function (low_score * estimated_revenue = priority)
4. Email template generator using audit findings
5. A working website with intake form and Stripe checkout

**Critical insight:** This gear is 0% built but the pipeline that powers it (the audit) is 70% built. The bottleneck is wiring, not capability.

### Gear 2: Fear-Based Sales Accelerator -- 40% Built

**Vision:** Audit -> Branded PDF -> Walkthrough call -> Close.

**Reality -- What works:**
- Pipeline runs: crawl -> query -> analyze -> score -> report (all 6 steps execute)
- 5-pillar scoring with correct weights and sub-scores
- PDF generation via Puppeteer with HTML templates
- Admin dashboard shows audit results
- Competitor comparison data collected during query step

**Reality -- What's broken:**
- **Email delivery is `console.log`** (`deliver.ts` stubs out `sendReportEmail()`)
- **PDFs are ephemeral** (generated in memory, never stored -- `reportPdfUrl` is always null)
- **No intake form** on the website (no way for prospects to request an audit)
- **No Stripe payment -> audit trigger** wiring
- **No mini-audit variant** (the pipeline only does full audits)
- **Audit rerun button exists but doesn't trigger Inngest**

**What's needed to close the gap:**
1. Wire `sendReportEmail()` to Resend API (the tool exists at `tools/send-report.ts`)
2. Store PDF to filesystem/S3 and populate `reportPdfUrl`
3. Build audit intake form at `/audit` with Stripe checkout
4. Wire Stripe webhook -> `audit/requested` Inngest event
5. Add mini-audit mode (fewer pages crawled, 1-page PDF template)

**Critical insight:** The hardest part (the pipeline) works. The remaining work is plumbing -- connecting existing pieces.

### Gear 3: Productized Service Delivery -- 30% Built

**Vision:** Sprint delivery automated via schema generators, content restructurers, llms.txt generators, with human QA gates.

**Reality -- What exists:**
- `tools/generate-jsonld.ts` -- JSON-LD schema generator
- `tools/generate-faq.ts` -- FAQ content generator
- `tools/generate-llmstxt.ts` -- llms.txt generator
- `tools/content-optimizer.ts` -- Content restructurer for answer-first format
- `deliverables` table in database (tracks sprint items)
- `remediationItems` table (tracks fix review lifecycle: draft -> approved -> applied)

**Reality -- What's hollow:**
- **No implementation workbench** (no UI to review/approve generated fixes)
- **No verification engine** (`parentAuditId` column exists, no delta logic)
- **No CMS deployment automation** (no WordPress/Squarespace API integration)
- **No quality gates** (no Schema.org validator integration)
- **No sprint progress tracker** in admin UI
- Tools exist as functions but no workflow orchestrates them into a sprint

**What's needed to close the gap:**
1. Admin workbench page: list gaps -> generate fix -> edit -> approve -> export
2. Delta tool: compare two audits, produce before/after report
3. Sprint tracker: checklist of 5 delivery packages with status per item
4. Export capability: ZIP of all generated code (schema JSON-LD, llms.txt, content diffs)

**Critical insight:** The tools exist. What's missing is the workflow that chains them together and the UI that lets the operator review outputs.

### Gear 4: Dependency Lock-In via Monitoring -- 20% Built

**Vision:** Weekly automated monitoring, trend reports, alerts, monthly strategy deliverables.

**Reality -- What exists:**
- `monitoringResults` table with correct schema (platform, query, brandMentioned, position, sentiment, citations)
- `tools/score-alerts.ts` -- Alert generation logic
- `tools/social-monitor.ts` -- Social media monitoring
- `tools/review-scraper.ts` -- Review aggregation
- Audit-runner verify step exists (can re-run queries)

**Reality -- What's hollow:**
- **No scheduler** (no n8n workflow, no cron trigger for weekly monitoring)
- **No monitoring pipeline** (audit pipeline does one-shot; no recurring execution)
- **No weekly report template** (only full audit and mini-audit templates exist)
- **No alert delivery** (score-alerts generates alerts but doesn't email/Slack them)
- **No trend visualization** (no charts in admin dashboard showing score over time)
- **No client-facing email** (weekly status email not built)

**What's needed to close the gap:**
1. Monitoring Inngest function: simplified pipeline (query-only, no crawl, compare to baseline)
2. n8n scheduled trigger: weekly event for each retainer client
3. Weekly email template: score + trend arrows + top changes
4. Monthly PDF template: 4-6 page trend report
5. Alert pipeline: score-alerts -> email/Slack notification
6. Admin monitoring overview page with trend charts

**Critical insight:** This gear is the retainer justifier. Without it, retainer clients have no reason to keep paying.

### Gear 5: Vertical Intelligence -- 10% Built

**Vision:** Prompts learn from results. Vertical-specific patterns accumulate. Benchmark data compounds.

**Reality -- What exists:**
- `promptLibrary` table with performance tracking columns (`successCount`, `runCount`, `performanceScore`, `isExperimental`)
- `tools/seed-prompts.ts` -- Prompt seeding logic
- `tools/generate-prompt-permutations.ts` -- Query variation generator
- Static prompt files in `prompt-library/`

**Reality -- What's hollow:**
- **No prompt seeding mechanism** (table exists but is never populated)
- **No dynamic prompt selection** (pipeline uses static `getDefaultQueries()`, not DB-driven selection)
- **No feedback loop** (after audit completes, nothing updates prompt performance)
- **No benchmark aggregation** (no tool computes averages across audits by vertical)
- **No vertical pattern extraction** (no "what works for dentists" analysis)

**What's needed to close the gap:**
1. Seed script: populate promptLibrary from static files
2. Select function: top N by performanceScore (80%) + random experimental (20%)
3. Post-audit hook: update prompt success/run counts based on whether the brand was mentioned
4. Benchmark aggregation: average scores by vertical/geography
5. Pattern extraction: monthly analysis of which fixes produced the biggest deltas

**Critical insight:** This gear is the long-term moat but has near-zero urgency for the first 10 clients.

## Summary: Where the Architecture Stands

```
GEAR                    BUILT    STATUS
--------------------------------------------
1. Prospecting          0%       Not started
2. Sales (Audit)        40%      Pipeline works, delivery broken
3. Delivery (Sprint)    30%      Tools exist, workflow missing
4. Retention (Monitor)  20%      Schema exists, execution missing
5. Intelligence         10%      Tables exist, logic missing
```

## The Critical Path to First Dollar

Nothing else matters until this sequence completes:

```
1. Fix build                        30 min   <-- Delete scaffold packages
2. Wire email delivery              2 hours  <-- Replace console.log with Resend
3. Store PDFs                       3 hours  <-- Upload + populate reportPdfUrl
4. Build website intake form        4 hours  <-- /audit page + form + Stripe
5. Wire Stripe -> audit trigger     2 hours  <-- Webhook -> Inngest event
6. Run first real audit             1 hour   <-- Test end-to-end
7. Manually deliver first sprint    15 hours <-- Use tools manually, no workbench yet
8. Run verification audit           1 hour   <-- Prove the delta
9. Sign first retainer              0 hours  <-- Present delta report, close
```

**Total to first dollar: ~28 hours of work.**

Everything in Gears 3-5 can be built incrementally while serving real clients. The tools exist -- the operator can use them from CLI while the workbench UI gets built. Don't let perfection delay revenue.
