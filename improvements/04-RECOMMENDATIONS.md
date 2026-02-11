# What to Build Next: Prioritized by Revenue Impact

## Principle: Build What Makes the Next Dollar Possible

Every hour of engineering should be judged by: "Does this unblock the next unit of revenue?"

The current system has ~26,700 lines of code, 201 tests, and 30 tool functions. It is simultaneously impressive and useless -- impressive because the pipeline architecture is genuinely well-designed, useless because a `console.log` in the delivery step means no audit has ever been sent to a real person.

## Tier 1: Revenue-Blocking Fixes (Do This Week)

These are not features. They are bugs that prevent the existing system from generating revenue.

### 1.1 Delete Scaffold Packages (30 min)
- Delete `packages/query-engine/`, `packages/site-crawler/`, `packages/report-generator/`
- Update `pnpm-workspace.yaml`
- Verify `pnpm build` passes
- **Why:** Build is broken. Nothing else works until this is fixed.

### 1.2 Wire Email Delivery (2 hours)
- Replace stub in `apps/audit-runner/src/steps/deliver.ts` with real Resend call
- Import from `packages/core/src/tools/send-report.ts`
- Test with a real email address
- **Why:** Audits complete but never reach the client. The product literally doesn't deliver.

### 1.3 Store PDFs (3 hours)
- After Puppeteer generates PDF buffer, write to local filesystem (`/data/reports/{auditId}.pdf`)
- Populate `reportPdfUrl` in `auditResults` table
- Add API route to serve stored PDFs
- **Why:** Reports are lost on server restart. Can't email what you can't retrieve.

### 1.4 Wire Audit Rerun (1 hour)
- `apps/web/app/api/admin/audits/[id]/rerun/route.ts` -> call `inngest.send()`
- **Why:** Operator can't retry failed audits. Manual intervention required.

### 1.5 Fix Core Package Exports (2 hours)
- Add barrel export in `packages/core/src/tools/index.ts`
- Add subpath exports in `packages/core/package.json` for `./tools`, `./scoring`, `./config`
- **Why:** Tools can't be imported by `apps/web`. Blocks every future feature.

**Tier 1 total: ~8 hours. Unblocks all revenue.**

## Tier 2: First Client Enablers (Do This Month)

These turn the system from "technically functional" into "can serve a paying client."

### 2.1 Website Homepage + Intake Form (8 hours)
- Build homepage at `/` following `WEBSITE_SPEC.md` blocks
- Build audit intake form at `/audit` with fields: business name, URL, email, vertical
- Wire Stripe Checkout for $750 payment
- Wire successful payment -> `audit/requested` Inngest event
- **Revenue impact:** Enables inbound leads. Without this, all sales are manual.

### 2.2 Mini-Audit Mode (4 hours)
- Add `auditType: 'mini'` handling to pipeline
- Crawl 5 pages instead of 20, query 3 prompts instead of 5
- 1-page PDF template (score, 5 pillars, top 3 findings, CTA)
- Cost: ~$0.50 per mini-audit vs ~$3 for full audit
- **Revenue impact:** Lead magnet. Free mini-audit -> "want the full picture?" -> $750 full audit.

### 2.3 Admin Audit Trigger (2 hours)
- "New Audit" button on admin dashboard
- Form: domain, business name, vertical, competitors, email
- Triggers pipeline directly (no Stripe, for operator-initiated audits)
- **Revenue impact:** Operator can run audits for prospects during sales calls.

### 2.4 PDF Report Polish (6 hours)
- Review and refine the 9-page audit HTML template
- Add competitor comparison section
- Add prioritized action plan section
- Ensure charts render correctly (inline SVG, not JS)
- Test with real data for edge cases (0 scores, missing GBP, long names)
- **Revenue impact:** The report IS the product. A polished report closes deals. A rough report kills credibility.

**Tier 2 total: ~20 hours. Enables serving first 3 clients.**

## Tier 3: Sprint Delivery Accelerators (Build While Serving First Clients)

### 3.1 Verification Engine + Delta Report (12 hours)
- Tool: Compare two audit results, produce delta per pillar
- Template: 2-page "Before & After" PDF
- Admin page: `/admin/audits/[id]/verify` with "Run Verification" button
- Wire `parentAuditId` -- verification audit references the original
- **Revenue impact:** The sprint only proves value with a before/after. Without this, the $5K sprint price is hard to justify.

### 3.2 Implementation Workbench MVP (16 hours)
- Admin page: `/admin/audits/[id]/workbench`
- List all gaps from audit (missing schema, content issues, technical fixes)
- "Generate Fix" button per item -> calls appropriate tool -> shows result
- Edit/approve/reject workflow
- Export as ZIP (JSON-LD files, llms.txt, content markdown, robots.txt rules)
- **Revenue impact:** Reduces sprint delivery from 15h to 8h. Margin doubles.

### 3.3 Proposal Generator (8 hours)
- Tool: audit findings -> auto-generate SOW with pricing
- Map gaps to sprint modules: schema ($500), content ($1,500), technical ($150/hr)
- HTML template -> PDF proposal
- Admin page: `/admin/audits/[id]/proposal`
- **Revenue impact:** Reduces proposal creation from 2h to 15min. Enables faster close.

**Tier 3 total: ~36 hours. Increases delivery efficiency 2x.**

## Tier 4: Retainer Infrastructure (Build After 3 Clients)

### 4.1 Monitoring Pipeline (12 hours)
- New Inngest function: `monitoring/execute` -- queries only, no crawl
- Input: clientId, queries, platforms
- Compare results to previous run, compute deltas
- Store in `monitoringResults` table
- **Revenue impact:** Enables $1,500/month retainer offering.

### 4.2 Weekly Monitoring Email (6 hours)
- React Email template: score + 5 pillar trend arrows + notable changes
- Scheduled via n8n -> Inngest event weekly per retainer client
- **Revenue impact:** Client touchpoint. Prevents churn.

### 4.3 Monthly Report Template (8 hours)
- 4-6 page PDF: trend charts, competitive changes, recommendations
- Auto-generated from monitoring data + LLM narrative (Claude Haiku)
- **Revenue impact:** Monthly retainer deliverable. Without it, retainer clients ask "what am I paying for?"

### 4.4 Alert Pipeline (4 hours)
- Score drop >20% -> email operator + client
- New competitor detected -> email operator
- Sentiment shift -> email operator
- **Revenue impact:** Proactive alerts justify premium retainer pricing.

**Tier 4 total: ~30 hours. Enables retainer revenue stream.**

## Tier 5: Competitive Moat (Build After 10 Clients)

### 5.1 Share of Voice Matrix (8 hours)
- Visualize: "You appear in 23% of queries. Competitor A: 45%. Competitor B: 18%."
- Pie chart + head-to-head battle table
- Track over time -> trend line

### 5.2 Competitor Gap Analyzer (10 hours)
- Crawl competitor site -> compare schema, content, technical signals
- Generate "Why They're Winning" narrative
- Admin page with side-by-side comparison

### 5.3 Vertical Benchmarks (6 hours)
- Aggregate scores by vertical/geography
- "Average dentist in Austin scores 31/100. Top performer: 72/100."
- Use in sales materials and blog content

### 5.4 Prompt Learning Loop (8 hours)
- Seed promptLibrary from static files
- Dynamic selection during query step
- Post-audit feedback: update success/run counts
- Experimental prompt injection (20% of queries)

**Tier 5 total: ~32 hours. Builds long-term moat.**

## Tier 6: Blue Ocean Features (Build After 20 Clients)

### 6.1 Adversarial Brand Audit
- "What does ChatGPT say when someone complains about you?"
- Red-team queries: bad reviews, competitors, closure rumors

### 6.2 Multimodal/Video Audit
- Video SEO: are YouTube videos schema-marked? Transcripts available?
- Image audit: alt text quality, image schema

### 6.3 Persona-Driven Queries
- Query from different user perspectives: "new parent seeking dentist" vs "senior seeking dentist"
- Reveals audience-specific visibility gaps

### 6.4 Citation Graph Visualization
- Visual map of who cites who in AI responses
- Reveals the "knowledge graph" that AI engines use for a given vertical/geography

**Tier 6: Build when the core business is stable and growing.**

## The 90-Day Plan

```
WEEK 1-2:    Tier 1 (production fixes) + Tier 2.1 (website)
WEEK 3-4:    Tier 2.2-2.4 (mini-audit, admin trigger, PDF polish)
WEEK 5-6:    First free case study client (manual delivery)
WEEK 7-8:    Tier 3.1 (verification engine -- need delta for case study)
WEEK 9-10:   Tier 3.2-3.3 (workbench + proposal -- need for paid clients)
WEEK 11-12:  First 1-2 paid sprints
WEEK 13+:    Tier 4 (monitoring infra -- need before first retainer)
```

**Revenue milestone targets:**
- Week 8: First case study completed with measurable results
- Week 10: First paid audit ($750)
- Week 12: First paid sprint ($3-5K)
- Week 16: First retainer client ($1,500/month)
- Month 6: $10K/month run rate
