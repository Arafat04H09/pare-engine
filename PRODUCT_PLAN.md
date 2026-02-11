# Pare Engine — Complete Product Plan

> The definitive specification of what Pare is, what it does, and what it will become.
> Every future session should read this document first.

**Last Updated:** 2026-02-10
**Status:** 28 build sessions complete. 26,700 LOC. 201 tests passing.

---

## The Thesis

Pare is an **AI-native consulting operating system** for a solo GEO (Generative Engine Optimization) consultant. It's a three-layer system (Tools, Intelligence, Workspace) that audits how AI engines (ChatGPT, Perplexity, Gemini) perceive mid-sized businesses ($5M-$100M revenue), scores their AI readiness on a 0-100 scale across 5 pillars, generates branded PDF reports, implements fixes, verifies improvements, and retains clients through ongoing monitoring.

**Beachhead market:** B2B SaaS ($8M-$40M ARR), then PE-backed multi-location healthcare. See `VISION.md` for full market thesis.

The business model is three nested revenue loops:
1. **Audit** ($2,000-$5,000) — Score a business, show them they're invisible to AI
2. **Sprint** ($5,000-$15,000) — Implement fixes over 2-4 weeks, verify improvement
3. **Retainer** ($3,000-$10,000/month) — Monitor, report, optimize continuously

The moat compounds: after 20 clients in a vertical, the system knows which prompts surface businesses, which fixes move scores, and which patterns work. This knowledge is unreplicable without doing the work.

---

## Architecture Overview

```
packages/core/          Shared foundation (contracts, scoring, tools, DB, templates)
apps/audit-runner/      Inngest durable pipeline (crawl → query → analyze → score → report → deliver)
apps/web/               Next.js 15: public website + operator admin console + API routes
```

**No `apps/api`** — webhooks and API routes live in `apps/web/app/api/`.

**Contract-first:** All shared types in `packages/core/src/contracts/`. Sessions import contracts, never sibling implementations.

**Three integration modes:**
- MCP servers for dev-time tooling
- API wrappers for production (Firecrawl, AI SDK, Resend, Stripe)
- Custom IP for scoring, analysis, reports, templates

---

## Feature Status Legend

| Status | Meaning |
|--------|---------|
| SHIPPED | Complete, tested, deployed |
| WIRED | Code exists, needs integration/testing |
| PARTIAL | Some code exists, significant work remaining |
| PLANNED | Designed, not yet built |
| DEFERRED | Intentionally postponed (with reasoning) |
| KILLED | Decided against (with reasoning) |

---

# Domain 1: Audit Pipeline

The core value loop. Website domain in, scored PDF report out.

## 1.1 Site Crawling

| Feature | Status | Files | Description |
|---------|--------|-------|-------------|
| Firecrawl map + crawl | SHIPPED | `core/tools/crawl-site.ts`, `audit-runner/steps/crawl.ts` | Discover URLs (map, limit 50) then extract content (crawl, limit 20, markdown + HTML) |
| Domain normalization | SHIPPED | `core/contracts/crawl.contract.ts` | Strip protocol, trailing slash, lowercase |
| Crawl error tracking | SHIPPED | `audit-runner/steps/crawl.ts` | Per-URL error capture, never throws on single page failure |
| Crawl analytics | WIRED | `core/tools/crawler-analytics.ts` | Track page depth, crawl patterns, content quality signals |
| Crawl webhook logging | PARTIAL | `web/api/webhooks/crawler-log/route.ts` | Async Firecrawl event listener, partial implementation |
| Incremental recrawl | PLANNED | — | Only crawl pages changed since last audit, reduce API costs |
| Crawl budget optimization | PLANNED | — | Prioritize high-value pages (service pages, location pages) over blog archive |

## 1.2 AI Engine Querying

| Feature | Status | Files | Description |
|---------|--------|-------|-------------|
| Multi-provider orchestration | SHIPPED | `audit-runner/steps/query-engines.ts` | ChatGPT (Responses API + web_search), Perplexity (Sonar), Gemini (grounded) via AI SDK v6 |
| Promise.allSettled() | SHIPPED | All query code | Graceful degradation — failed providers tracked, never thrown |
| Latency tracking | SHIPPED | `core/contracts/query.contract.ts` | Per-response `latencyMs` field |
| Default query generation | SHIPPED | `audit-runner/pipeline.ts` | If no custom queries provided, generate from vertical + city |
| Vertical prompt library | SHIPPED | `core/prompt-library/` | 3 verticals (dental, legal, HVAC), 25 prompts each, 5 categories |
| Prompt performance tracking | WIRED | `core/tools/select-prompts.ts`, `audit-runner/steps/update-prompt-stats.ts` | Track successCount/runCount per prompt, select best performers. Tool exists but not called in pipeline |
| Prompt seeding CLI | WIRED | `core/tools/seed-prompts.ts` | Populate promptLibrary table with vertical templates. Tool exists, no CLI trigger |
| Prompt permutation engine | WIRED | `core/tools/generate-prompt-permutations.ts` | A/B test query variants for optimization |
| Additional verticals | PLANNED | — | Restaurant, real estate, home services, medical, accounting, ecommerce |
| Cohort queries | WIRED | `core/contracts/query.contract.ts` | `CohortQueryInput` for multi-brand comparison queries |
| Google AI Mode monitoring | PLANNED | — | Track Google's new AI Mode responses (distinct from AI Overviews) |
| ChatGPT Atlas monitoring | PLANNED | — | Monitor OpenAI's dedicated browser for live search results |

## 1.3 Content Analysis

| Feature | Status | Files | Description |
|---------|--------|-------|-------------|
| LLM-based content scoring | SHIPPED | `audit-runner/steps/analyze-content.ts` | Claude Haiku evaluates answer-first format, FAQ presence, stats density, author attribution, depth |
| Per-page analysis | SHIPPED | Same | Each crawled page scored independently, then averaged |
| Word count + depth | SHIPPED | `core/contracts/analysis.contract.ts` | Tracks word count and content depth score per page |
| Content optimizer | SHIPPED | `core/tools/content-optimizer.ts` | Claude-based page rewriting for answer-first format, FAQ injection, stats enrichment (749 lines) |
| FAQ generator | SHIPPED | `core/tools/generate-faq.ts` | LLM generates FAQPage schema + markdown from page content |
| Media extraction | WIRED | `core/tools/extract-media.ts` | Image/video asset inventory from crawled pages |
| Video SEO analysis | WIRED | `core/tools/analyze-video-seo.ts` | Video schema scoring and optimization recommendations |
| Video schema generator | WIRED | `core/tools/generate-video-schema.ts` | Generate VideoObject JSON-LD for video content |
| Readability scoring | PLANNED | — | Flesch-Kincaid, Gunning Fog for content accessibility |
| E-E-A-T scoring | PLANNED | — | Experience, Expertise, Authoritativeness, Trust signals per Google guidelines |

## 1.4 Technical Analysis

| Feature | Status | Files | Description |
|---------|--------|-------|-------------|
| robots.txt AI crawler rules | SHIPPED | `audit-runner/steps/analyze-technical.ts` | Parse robots.txt for GPTBot, PerplexityBot, Googlebot rules |
| llms.txt detection | SHIPPED | Same | Check /.well-known/llms.txt and /llms-full.txt |
| Sitemap detection | SHIPPED | Same | Validate sitemap.xml presence and URL count |
| HTTPS validation | SHIPPED | Same | Verify all pages served over HTTPS |
| Mobile-friendly check | SHIPPED | Same | PageSpeed mobile usability score |
| Core Web Vitals | SHIPPED | Same | LCP, FID, CLS via PageSpeed Insights API |
| PageSpeed Insights | SHIPPED | `core/tools/pagespeed.ts` | Performance, accessibility, SEO scores |
| llms.txt generator | SHIPPED | `core/tools/generate-llmstxt.ts` | Claude generates /.well-known/llms.txt content |
| Bot access analysis | SHIPPED | `core/tools/bot-analyzer.ts` | Detect GPTBot, ClaudeBot, GoogleBot, BingBot access rules |
| AIO detection | WIRED | `core/tools/aio-detect.ts` | AI-only optimization pattern detection |
| Security header analysis | PLANNED | — | CSP, HSTS, X-Frame-Options for trust signals |
| Structured data validator | PLANNED | — | Google Rich Results Test API integration |

## 1.5 Schema / Structured Data Analysis

| Feature | Status | Files | Description |
|---------|--------|-------|-------------|
| JSON-LD extraction | SHIPPED | `audit-runner/steps/analyze-schema.ts`, `core/tools/parse-jsonld.ts` | Extract all JSON-LD from HTML, identify schema.org types |
| Required type gap analysis | SHIPPED | Same | Vertical-specific required types (LocalBusiness, FAQPage, Service, etc.) |
| Recommended type detection | SHIPPED | Same | Optional types (BreadcrumbList, Review, Person, etc.) |
| Validation error counting | SHIPPED | Same | Schema markup errors and warnings |
| JSON-LD generator | SHIPPED | `core/tools/generate-jsonld.ts` | Claude generates schema.org JSON-LD for vertical |
| Per-page schema analysis | SHIPPED | `core/contracts/analysis.contract.ts` | `SchemaPageAnalysis` with presentTypes, missingRequired, rawJsonLd |
| Vertical schema rules | SHIPPED | Scoring contract | Different required types per vertical (dental, legal, HVAC, ecommerce) |
| Schema diff (before/after) | PLANNED | — | Show exactly which schema types were added by sprint |

## 1.6 GBP / Local Analysis

| Feature | Status | Files | Description |
|---------|--------|-------|-------------|
| Google Places API integration | SHIPPED | `audit-runner/steps/analyze-gbp.ts`, `core/tools/google-places.ts` | Profile data: rating, reviews, photos, hours, categories, Q&A |
| NAP consistency checking | SHIPPED | Same | Name/Address/Phone match across multiple web sources |
| Profile completeness scoring | SHIPPED | Same | Description, photos, hours, Q&A, posts |
| Category accuracy | SHIPPED | Same | Primary + additional categories verification |
| Review sentiment analysis (LLM) | SHIPPED | `core/tools/analyze-review-semantics.ts` | Claude Haiku clusters review themes and sentiment |
| Review campaign generator | WIRED | `core/tools/generate-review-campaign.ts` | Generate review response templates + campaign plan |
| Review scraper | SHIPPED | `core/tools/review-scraper.ts` | Extract reviews from Google, Yelp, Facebook |
| Social media monitoring | SHIPPED | `core/tools/social-monitor.ts` | Track social mentions via DataForSEO |
| Foursquare listing check | PLANNED | — | Verify Foursquare data (ChatGPT pulls 70% of local data from Foursquare) |
| Reddit presence analysis | PLANNED | — | Check Reddit discussions (46.7% of Perplexity top citations come from Reddit) |
| Yelp profile audit | PLANNED | — | Dedicated Yelp profile completeness check (key for Perplexity) |
| Apple Maps listing check | PLANNED | — | Apple Maps/Siri data source verification |
| Directory citation audit | PLANNED | — | Check 20+ directory listings (BBB, YP, industry-specific) |

## 1.7 Scoring Engine

| Feature | Status | Files | Description |
|---------|--------|-------|-------------|
| 5-pillar composite scoring | SHIPPED | `core/scoring/index.ts` | Sum of weighted pillar scores → 0-100 → letter grade |
| AI Visibility (30 pts) | SHIPPED | `core/scoring/ai-visibility.ts` | Mention rate, citation rate, position quality, sentiment |
| Content Quality (30 pts) | SHIPPED | `core/scoring/content-quality.ts` | Answer-first, FAQ coverage, stats density, author attribution |
| Schema (15 pts) | SHIPPED | `core/scoring/schema-completeness.ts` | Required/recommended types present, validation errors |
| Technical (10 pts) | SHIPPED | `core/scoring/technical-readiness.ts` | robots.txt, llms.txt, sitemap, HTTPS, mobile |
| Local/GBP (15 pts) | SHIPPED | `core/scoring/local-gbp.ts` | GBP completeness, review score, NAP consistency |
| Score-to-grade conversion | SHIPPED | `core/contracts/scoring.contract.ts` | A: 90-100, B: 80-89, C: 70-79, D: 60-69, F: 0-59 |
| LLM-based sentiment (not keyword) | SHIPPED | `core/scoring/ai-visibility.ts` | Claude Haiku classifies sentiment, not regex patterns |
| Platform coverage tracking | SHIPPED | Same | Which of {chatgpt, perplexity, gemini} succeeded/failed |
| 109 scoring test cases | SHIPPED | `core/scoring/*.test.ts` | Comprehensive edge case coverage |
| Vertical weight presets | PLANNED | — | Different weights per vertical (restaurants care more about GBP, SaaS about content) |
| Weight A/B testing | DEFERRED | — | Test different weights across client cohorts. Defer until 20+ clients provide enough data |
| Score confidence interval | PLANNED | — | Report variability across multiple runs (AI responses are stochastic) |

## 1.8 Report Generation

| Feature | Status | Files | Description |
|---------|--------|-------|-------------|
| Full audit PDF (9 pages) | SHIPPED | `core/report-templates/audit-full.html`, `core/tools/generate-pdf.ts` | Cover, summary, 5 pillars, competitors, action plan |
| Mini audit PDF (1 page) | SHIPPED | `core/report-templates/audit-mini.html` | Score gauge, top 3 findings, CTA |
| Verification/delta PDF | SHIPPED | `core/report-templates/audit-verify.html` | Before/after scores, pillar deltas |
| Delta report PDF | SHIPPED | `core/report-templates/delta-report.html` | Remediation effectiveness, lift per pillar |
| Proposal PDF | SHIPPED | `core/report-templates/proposal.html` | Recommendations, implementation plan, timeline, pricing |
| Monthly trend PDF | SHIPPED | `core/report-templates/monthly-trend.html` | Score trend, week-over-week changes |
| SVG chart generators | SHIPPED | `core/report-templates/charts.ts` | Circular gauge, horizontal bars, sentiment donut, platform indicators |
| Brand styling | SHIPPED | `core/report-templates/styles.css` | Deep Navy #1B2A4A, Electric Teal #00D4AA |
| Citation graph component | SHIPPED | `core/report-templates/components/citation-graph.html` | Citation network visualization |
| Platform matrix component | SHIPPED | `core/report-templates/components/matrix.html` | Platform comparison matrix |
| Report customization layer | PLANNED | — | Toggle sections, add personal notes, override executive summary |
| Sprint summary PDF | PLANNED | — | Deliverables completed, score improvement, next steps |
| Competitive analysis PDF | PLANNED | — | Deep competitor comparison report |
| Executive briefing (1 slide) | PLANNED | — | Single-page format for quick sharing |
| Quarterly review PDF | PLANNED | — | 3-month trend, ROI calculation, next quarter priorities |

## 1.9 Delivery

| Feature | Status | Files | Description |
|---------|--------|-------|-------------|
| Resend email integration | SHIPPED | `core/tools/send-report.ts` | Renders React Email template, attaches PDF, sends via Resend API |
| Audit report email template | SHIPPED | `core/email-templates/audit-report.tsx` | Score summary, pillar breakdown, CTA |
| Audit receipt email template | SHIPPED | `core/email-templates/audit-receipt.tsx` | Confirmation, ETA, FAQ about GEO |
| Score alert email template | SHIPPED | `core/email-templates/score-alert.tsx` | Monthly score change notification |
| DB persistence | SHIPPED | `audit-runner/steps/deliver.ts` | Write auditResults row with all pillar scores + JSONB details |
| PDF storage | PARTIAL | — | PDF generated in memory. Needs filesystem or S3 persistence + URL storage in `reportPdfUrl` |
| Email retry logic | PLANNED | — | Retry failed sends with exponential backoff |
| Email open tracking | PLANNED | — | Track whether client opened report email |
| Branded email domain | PLANNED | — | Custom sending domain (vs default Resend domain) |

---

# Domain 2: Competitive Intelligence

Understanding where the client stands relative to competitors.

| Feature | Status | Files | Description |
|---------|--------|-------|-------------|
| Competitor entity normalization | SHIPPED | `core/tools/normalize-competitor.ts` | Domain dedup, entity registry in `competitors` table |
| Competitor gap analysis (LLM) | SHIPPED | `core/tools/analyze-competitor.ts`, `audit-runner/steps/analyze-competitor.ts` | Claude generates narrative comparing brand vs competitor across dimensions |
| Share of voice calculation | SHIPPED | `core/tools/share-of-voice.ts` | Multi-brand SOV percentages across platforms |
| Competitor snapshots (time-series) | SHIPPED | DB: `competitorSnapshots` table | Track competitor position, SOV, sentiment over time |
| Citation graph visualization | SHIPPED | `core/tools/generate-citation-graph.ts` | SVG visualization of citation network |
| Admin competitor view | SHIPPED | `web/admin/audits/[id]/competitor/` | SOV matrix, per-engine breakdown |
| SERP data integration | SHIPPED | `core/tools/serper.ts` | Serper.dev API for traditional SERP rankings |
| Backlink data integration | SHIPPED | `core/tools/dataforseo.ts` | DataForSEO API for backlink and keyword data |
| Competitor watchlist management | PLANNED | — | Add/remove competitors per client, trigger alerts on movement |
| Competitor trend charts | PLANNED | — | Line charts showing SOV changes over months |
| Competitive playbook generation | PLANNED | — | LLM generates "how to beat [competitor]" based on gap analysis |
| Win/loss attribution | PLANNED | — | Track which fixes caused ranking changes vs competitors |

---

# Domain 3: Sprint Delivery (Implementation)

Turning audit findings into deployed fixes.

| Feature | Status | Files | Description |
|---------|--------|-------|-------------|
| Remediation item creation | SHIPPED | `audit-runner/steps/create-remediations.ts` | Auto-detect gaps → create draft items in DB |
| Remediation DB schema | SHIPPED | DB: `remediationItems` table | type, status (draft/approved/applied/rejected), originalContent, currentContent |
| Workbench admin page | SHIPPED | `web/admin/audits/[id]/workbench/` | View remediation items, side-by-side comparison |
| JSON-LD generator | SHIPPED | `core/tools/generate-jsonld.ts` | Generate schema markup for any vertical |
| FAQ generator | SHIPPED | `core/tools/generate-faq.ts` | Generate FAQ content + FAQPage schema |
| llms.txt generator | SHIPPED | `core/tools/generate-llmstxt.ts` | Generate AI crawler instruction file |
| Content optimizer | SHIPPED | `core/tools/content-optimizer.ts` | Rewrite pages for answer-first format |
| Proposal generator | SHIPPED | `core/tools/generate-proposal.ts` | Generate SOW with timeline, pricing, deliverables |
| Proposal admin page | SHIPPED | `web/admin/audits/[id]/proposal/` | View proposal, score cards, recommendations |
| Remediation API | PARTIAL | `web/api/remediation/` | Route exists, needs full CRUD handlers |
| Proposal API | PARTIAL | `web/api/admin/audits/[id]/proposal/` | Route exists, needs generation endpoint |
| Approve/reject workflow | PLANNED | — | Status transitions: draft → approved → applied / rejected |
| CMS-specific instructions | PLANNED | — | WordPress, Shopify, Squarespace, Wix deployment guides per fix type |
| Export as ZIP | PLANNED | — | Download all remediations as file structure + README.md |
| Deployment tracking | PLANNED | — | Mark fixes as deployed, track implementation dates |
| Client feedback loop | PLANNED | — | Client can approve/reject fixes via email or portal |
| Sprint milestone tracking | PLANNED | — | Week-by-week progress view with deliverable status |
| Deliverables DB tracking | SHIPPED | DB: `deliverables` table | Sprint week, type, status, targetUrl, generatedCode, cmsInstructions |

---

# Domain 4: Verification Loop

Proving that implementation worked.

| Feature | Status | Files | Description |
|---------|--------|-------|-------------|
| Verification audit step | SHIPPED | `audit-runner/steps/verify.ts` | Run full audit with `parentAuditId`, calculate deltas |
| Delta calculation | SHIPPED | `core/tools/score-delta.ts` | Per-pillar before/after comparison |
| Delta contract | SHIPPED | `core/contracts/delta.contract.ts` | `ScoreDelta`, `DeltaAnalysis`, `ActionItemDelta` |
| Verify admin page | SHIPPED | `web/admin/audits/[id]/verify/` | Before/after scores, grade change, biggest improvements/declines |
| Delta report template | SHIPPED | `core/report-templates/delta-report.html` | Visual before/after comparison PDF |
| Verification report template | SHIPPED | `core/report-templates/audit-verify.html` | 2-page comparison PDF |
| Accuracy scoring | SHIPPED | `core/tools/accuracy-scorer.ts` | Compare audit predictions against ground truth |
| Remediation effectiveness | WIRED | `core/contracts/delta.contract.ts` | `ActionItemDelta` tracks per-item effectiveness |
| Auto-case-study generation | PLANNED | — | Auto-generate case study from delta report (anonymized or named) |
| Scheduled re-verification | PLANNED | — | Monthly re-audit for retainer clients to track drift |
| Improvement attribution | PLANNED | — | Correlate specific fixes with specific score improvements |

---

# Domain 5: Monitoring & Retention

Keeping retainer clients engaged and proving ongoing value.

| Feature | Status | Files | Description |
|---------|--------|-------|-------------|
| Monitoring DB schema | SHIPPED | DB: `monitoringResults` table | Time-series query results with brand mention/position/sentiment |
| Score alert detection | SHIPPED | `core/tools/score-alerts.ts` | Threshold triggers: score drop > 5pts, grade change, pillar delta |
| Score alert email template | SHIPPED | `core/email-templates/score-alert.tsx` | Monthly score change notification |
| Monthly trend report template | SHIPPED | `core/report-templates/monthly-trend.html` | Score trend visualization |
| Review monitoring | SHIPPED | `core/tools/review-scraper.ts` | GBP review sentiment extraction |
| Social monitoring | SHIPPED | `core/tools/social-monitor.ts` | Social media mention tracking |
| Scheduled monitoring execution | PLANNED | — | n8n cron → Inngest event for all retainer clients (weekly queries) |
| Monthly report auto-generation | PLANNED | — | Cron triggers report generation on 1st of each month |
| Report approval queue | PLANNED | — | Admin page: pending reports, preview, edit, approve & send |
| Alert routing to admin | PLANNED | — | Notifications in admin dashboard for score drops, competitor gains |
| Alert email to operator | PLANNED | — | Email notification when alert threshold triggered |
| Retainer health dashboard | PLANNED | — | Per-client: months active, MRR, score sparkline, churn risk |
| Competitor movement alerts | PLANNED | — | Notify when competitor rises above client in AI visibility |
| Quarterly review auto-prep | PLANNED | — | Auto-generate quarterly review materials from 3 months of data |
| Review velocity tracking | PLANNED | — | Track review count growth rate as leading indicator |
| Churn prediction | DEFERRED | — | ML model to predict churn risk. Need 20+ churned clients for training data |

---

# Domain 6: Prospecting & Sales

Finding and converting new clients.

| Feature | Status | Files | Description |
|---------|--------|-------|-------------|
| Public audit form | SHIPPED | `web/(public)/audit/page.tsx` | Domain + email + business info → Stripe checkout |
| Stripe payment integration | SHIPPED | `web/api/audit/create/route.ts`, `web/api/webhooks/stripe/route.ts` | Checkout session creation, webhook processing, client creation |
| Quick query / demo mode | PLANNED | — | Admin page: type prompt, select platforms, see results with mentions highlighted. For live sales demos |
| Admin-triggered audit | PLANNED | — | "Quick Audit" button in admin: paste domain → fire Inngest event without Stripe |
| Batch mini audits | PLANNED | — | Paste 10-20 domains → queue mini audits → ranked table by opportunity score |
| Opportunity scoring | PLANNED | — | Lower score = bigger opportunity = hotter lead |
| Cold email draft generation | PLANNED | — | Auto-generate personalized outreach from audit findings |
| Email outreach sending | PLANNED | — | One-click send personalized emails via Resend |
| Prospect list import | PLANNED | — | CSV import of domains + business names for batch auditing |
| Lead nurture sequence | PLANNED | — | 4-email automated sequence after mini audit delivery |
| Website conversion optimization | PLANNED | — | Add social proof, testimonials, FAQ to public audit form |
| Self-audit as proof | PLANNED | — | Show Pare's own score (should be 90+) as credibility signal |
| Referral tracking | DEFERRED | — | Track which clients referred whom. Need referral program first |

---

# Domain 7: Operator Admin Console

The workstation where the solo operator manages everything.

## 7.1 Dashboard & Navigation

| Feature | Status | Files | Description |
|---------|--------|-------|-------------|
| Auth-gated admin routes | SHIPPED | `web/middleware.ts`, `web/lib/auth.ts` | Session-based single-operator auth |
| Login page | SHIPPED | `web/admin/login/` | Email + password login |
| Admin layout + nav | SHIPPED | `web/admin/layout.tsx` | Navy header, nav links, logout |
| Dashboard KPIs | SHIPPED | `web/admin/(dashboard)/page.tsx` | Client count, avg score, active sprints/retainers |
| Recent audits table | SHIPPED | Same | Last 10 audits with scores and dates |
| Stat card component | SHIPPED | `web/admin/components/stat-card.tsx` | Reusable KPI card |
| Score badge component | SHIPPED | `web/admin/components/score-badge.tsx` | Color-coded score + letter grade |
| Pillar breakdown component | SHIPPED | `web/admin/components/pillar-breakdown.tsx` | Horizontal bar chart for 5 pillars |
| Data table component | SHIPPED | `web/admin/components/data-table.tsx` | Sortable, filterable table |
| Empty state component | SHIPPED | `web/admin/components/empty-state.tsx` | No results fallback |
| Pipeline status indicators | PLANNED | — | Real-time step progress: Crawling... Querying... Done |
| Error/failure visibility | PLANNED | — | Surface pipeline failures in admin UI, not just console |
| Notification system | PLANNED | — | In-app notifications for completed audits, alerts, failures |

## 7.2 Client Management

| Feature | Status | Files | Description |
|---------|--------|-------|-------------|
| Client list page | SHIPPED | `web/admin/clients/page.tsx` | All clients with search, sort, engagement type |
| Client detail page | SHIPPED | `web/admin/clients/[id]/page.tsx` | Contact info, engagement type, score history |
| Client creation via Stripe | SHIPPED | `web/api/webhooks/stripe/route.ts` | Idempotent client creation from payment webhook |
| Client list API | SHIPPED | `web/api/admin/clients/` | GET handler for client data |
| Create client from admin | PLANNED | — | Form: business name, domain, vertical, contact info → POST API |
| Edit client details | PLANNED | — | Inline edit or edit page for client fields |
| Delete client | PLANNED | — | Soft delete with confirmation |
| Client engagement lifecycle | PLANNED | — | Transition: prospect → sprint → retainer → completed/lost |
| Bulk client import | PLANNED | — | CSV upload for batch client creation |
| Client notes | PLANNED | — | Freeform notes field per client |

## 7.3 Audit Management

| Feature | Status | Files | Description |
|---------|--------|-------|-------------|
| Audit list page | SHIPPED | `web/admin/audits/page.tsx` | All audits with search, score, date |
| Audit detail page | SHIPPED | `web/admin/audits/[id]/page.tsx` | Score circle, 5-pillar breakdown, findings, action plan |
| Audit list API | SHIPPED | `web/api/admin/audits/` | GET handler with client enrichment |
| Rerun audit API | SHIPPED | `web/api/admin/audits/[id]/rerun/route.ts` | POST fires Inngest event |
| PDF download API | SHIPPED | `web/api/admin/audits/[id]/pdf/route.ts` | GET serves stored PDF |
| Rerun audit button | PLANNED | — | UI button on audit detail page to trigger rerun |
| Send report button | PLANNED | — | UI button to email PDF to client via Resend |
| Audit filtering | PLANNED | — | Filter by vertical, score range, date range, audit type |
| Audit comparison view | PLANNED | — | Side-by-side comparison of two audits for same client |

## 7.4 Specialized Admin Views

| Feature | Status | Files | Description |
|---------|--------|-------|-------------|
| Competitor analysis view | SHIPPED | `web/admin/audits/[id]/competitor/` | SOV matrix, per-engine breakdown, gap narrative |
| Proposal view | SHIPPED | `web/admin/audits/[id]/proposal/` | Score cards, recommendations, implementation plan |
| Workbench view | SHIPPED | `web/admin/audits/[id]/workbench/` | Remediation items, side-by-side content comparison |
| Verification view | SHIPPED | `web/admin/audits/[id]/verify/` | Before/after scores, grade change, improvements/declines |
| Review analysis view | SHIPPED | `web/admin/audits/[id]/reviews/` | Sentiment clustering, review campaign |
| Settings page | PLANNED | — | API key management, branding, scoring config |
| Integration health dashboard | PLANNED | — | Live connection tests for all external services |

## 7.5 Command-First UX

| Feature | Status | Description |
|---------|--------|-------------|
| Command palette (Ctrl+K) | DEFERRED | Every action reachable from keyboard. Defer until 10+ clients — buttons work fine at small scale |
| Keyboard shortcuts | DEFERRED | Navigation, quick actions. Same reasoning as above |
| Contextual sidebar actions | DEFERRED | Right sidebar showing relevant actions per current view |
| Actionable notifications | DEFERRED | Notifications with embedded action buttons (View, Send, Retry) |

---

# Domain 8: External Integrations

## 8.1 Current Integrations

| Integration | Status | Files | Purpose |
|-------------|--------|-------|---------|
| Firecrawl | SHIPPED | `audit-runner/tools-vendored/firecrawl.ts` | Site crawling + content extraction |
| OpenAI (ChatGPT) | SHIPPED | `audit-runner/steps/query-engines.ts` | AI engine querying via Responses API |
| Perplexity | SHIPPED | Same | AI engine querying via Sonar API |
| Google Generative AI (Gemini) | SHIPPED | Same | AI engine querying with grounding |
| Anthropic (Claude Haiku) | SHIPPED | Analysis steps | Content evaluation, sentiment analysis, structured parsing |
| Google Places API | SHIPPED | `core/tools/google-places.ts` | GBP profile data |
| Google PageSpeed | SHIPPED | `core/tools/pagespeed.ts` | Core Web Vitals, Lighthouse scores |
| Serper.dev | SHIPPED | `core/tools/serper.ts` | Traditional SERP data |
| DataForSEO | SHIPPED | `core/tools/dataforseo.ts` | Backlink + keyword data |
| Stripe | SHIPPED | `web/api/webhooks/stripe/` | Payment processing |
| Resend | SHIPPED | `core/tools/send-report.ts` | Email delivery |
| Inngest | SHIPPED | `audit-runner/pipeline.ts` | Durable background job execution |
| Notion | SHIPPED | `audit-runner/steps/sync-notion.ts`, `audit-runner/tools-vendored/notion.ts` | CRM sync for client management |
| Puppeteer | SHIPPED | `core/tools/generate-pdf.ts` | HTML → PDF rendering |

## 8.2 Planned Integrations

| Integration | Priority | Purpose |
|-------------|----------|---------|
| Foursquare API | HIGH | Verify Foursquare listing data (ChatGPT's primary local data source) |
| Yelp API | HIGH | Review data for Perplexity optimization |
| Cal.com | MEDIUM | Scheduling links for strategy calls |
| Loom API | LOW | Auto-embed walkthrough links in emails |
| PandaDoc / Qwilr | LOW | E-signature on proposals |
| Sentry | MEDIUM | Error tracking and alerting |
| n8n webhooks | MEDIUM | Scheduled monitoring triggers |

---

# Domain 9: Advanced Capabilities

Features that differentiate Pare from competitors.

| Feature | Status | Files | Description |
|---------|--------|-------|-------------|
| Adversarial brand audit | SHIPPED | `core/tools/audit-adversarial.ts` | Red team 4 attack vectors (karen, competitor, closure, price_anchor). Brand resilience score |
| AI hallucination scanning | SHIPPED | `core/tools/scan-hallucinations.ts` | Detect factual errors in AI responses about the business (wrong address, fabricated reviews, etc.) |
| Persona-driven audit variants | WIRED | `core/tools/generate-personas.ts` | Generate customer personas, run audit from each perspective |
| Agentic commerce readiness | SHIPPED | `core/tools/agentic-commerce.ts` | 16-item checklist for AI shopping agent optimization (1087 lines). UCP/ACP detection, bot access, product schema |
| Citation normalization | SHIPPED | `core/tools/normalize-citations.ts` | Cross-provider URL dedup, source tracking |
| Per-platform optimization roadmap | PLANNED | — | Separate fix lists for ChatGPT (Foursquare), Perplexity (Yelp/Reddit), Gemini (website), Google AI (GBP) |
| AI accuracy monitoring | PLANNED | — | Ongoing tracking of factual accuracy in AI responses about client businesses |
| Multi-language support | DEFERRED | — | Audit sites in languages other than English. Need international clients first |
| Multi-location support | DEFERRED | — | Compare AI visibility across locations for multi-site businesses |

---

# Domain 10: Data Model & Infrastructure

## 10.1 Database

| Table | Status | Purpose |
|-------|--------|---------|
| clients | SHIPPED | Business master record + engagement lifecycle |
| auditResults | SHIPPED | Audit history, score snapshots, delta tracking |
| monitoringResults | SHIPPED | Time-series query execution data |
| deliverables | SHIPPED | Sprint implementation tracking |
| promptLibrary | SHIPPED | Vertical-specific prompts with performance tracking |
| remediationItems | SHIPPED | Fix tracking through approval workflow |
| competitors | SHIPPED | Normalized competitor entity registry |
| competitorSnapshots | SHIPPED | Time-series competitive intelligence |
| documents | PLANNED | Unified document table (see Steelman doc). Every output as a document with lifecycle: draft → reviewed → sent → archived |

## 10.2 Configuration

| Feature | Status | Files | Description |
|---------|--------|-------|-------------|
| Zod-validated config | SHIPPED | `core/contracts/config.contract.ts`, `core/config.ts` | All env vars validated at startup |
| Per-service config | PARTIAL | `audit-runner/pipeline.ts` | Pipeline has its own config loader (should import from core) |
| Settings admin UI | PLANNED | — | Visual config management with live connection tests |
| Vertical presets | PLANNED | — | Save/load scoring weight presets per vertical |

## 10.3 Deployment

| Feature | Status | Description |
|---------|--------|-------------|
| Hetzner CPX21 target | PLANNED | ~$8-13/mo, self-hosted via Coolify |
| Docker containerization | PLANNED | Dockerfile for audit-runner + web |
| Environment management | PLANNED | .env.example with all required keys documented |
| Health check endpoint | PLANNED | /api/health for uptime monitoring |
| Sentry error tracking | PLANNED | Free tier: 5K errors/month |
| Backup strategy | PLANNED | PostgreSQL daily backups |

---

# Domain 11: Testing

| Feature | Status | Description |
|---------|--------|-------------|
| Scoring unit tests (109 cases) | SHIPPED | All 5 pillar scorers + composite |
| Tool unit tests (~45 cases) | SHIPPED | Core tool functions |
| Contract validation tests (~20) | SHIPPED | Zod schema validation |
| Integration tests | PLANNED | Full pipeline: crawl → deliver |
| E2E tests (Playwright) | PLANNED | Admin workflows, audit form |
| API route tests | PLANNED | All endpoint handlers |
| Load testing | DEFERRED | Need production traffic first |

---

# Domain 12: Branding & Website

| Feature | Status | Description |
|---------|--------|-------------|
| Brand colors | SHIPPED | Deep Navy #1B2A4A, Electric Teal #00D4AA |
| Report branding | SHIPPED | Consistent across all 6 PDF templates |
| Email branding | SHIPPED | Consistent across all 3 email templates |
| Public homepage | PARTIAL | Scaffold exists, needs conversion optimization |
| Services pages | PARTIAL | Scaffold exists |
| Case study pages | PLANNED | Template for showcasing client results |
| Blog / thought leadership | PLANNED | GEO content marketing |
| White-label option | DEFERRED | Client sees "Powered by [Your Brand]" instead of Pare. Need agency resale demand first |
| Logo upload for reports | PLANNED | Operator uploads logo → appears on all PDFs and emails |
| Custom color themes | DEFERRED | Per-client branding on reports |

---

# Domain 13: Business Intelligence (The Moat)

These features compound over time and become the true competitive advantage.

| Feature | Status | Description |
|---------|--------|-------------|
| Prompt performance tracking | WIRED | promptLibrary.performanceScore, successCount, runCount. Schema exists, update step not called |
| Vertical benchmark database | PLANNED | "Average dentist in Austin scores 31/100" — aggregate anonymized data across clients |
| Fix-to-improvement correlation | PLANNED | Track which specific fixes (schema, FAQ, llms.txt) drive the most score improvement |
| Citation pattern analysis | PLANNED | Identify which content types get cited most by AI engines per vertical |
| AI behavior changelog | PLANNED | Track changes in AI engine citation preferences over time |
| Operator knowledge base | PLANNED | Document learnings per vertical for future client engagements |
| Win rate tracking | PLANNED | Track proposal → close rate, identify what improves it |

---

# Deferred Features (With Reasoning)

| Feature | Why Deferred | Build When |
|---------|-------------|-----------|
| Client-facing dashboard | PDF + Loom walkthroughs are sufficient for first 10 clients | 10+ retainer clients |
| Multi-tenant architecture | Solo operator, not needed | Hiring first employee |
| White-label agency resale | Focus on own clients first | 20+ clients or agency demand |
| Custom CRM | Notion CRM sufficient for first 10 clients | Notion friction becomes unbearable (~15 clients) |
| Command palette / keyboard shortcuts | Buttons work fine at 5 clients | 10+ clients, daily usage patterns clear |
| Batch prospecting at scale | Manual outreach works for first 20 prospects | Manual playbook proven |
| Employee accounts / RBAC | Solo operator | Hiring |
| Agentic commerce as standalone product | Fold into sprint for ecommerce clients | Market demand validated |
| AI agent integration | 2027+ feature | Agent ecosystem matures |
| Client portal | PDF + Loom sufficient for first 10 retainers | Clients request self-service |
| Multi-language support | English market first | International client demand |
| Multi-location support | Single-location businesses first | Multi-site client request |
| Weight A/B testing | Need 20+ clients for meaningful data | Statistical significance achievable |
| Churn prediction ML | Need churn data to train | 20+ churned clients |
| Score confidence intervals | Run 5x per query, report averages | Client questions about variability |

---

# Killed Features (With Reasoning)

| Feature | Why Killed |
|---------|-----------|
| Custom Playwright BFS/DFS crawler | Firecrawl is better: maintained, faster, handles JS rendering |
| React-PDF reports | CSS limitations, highest time-waster risk. Puppeteer + HTML/CSS is correct |
| Custom LLM provider wrappers | Vercel AI SDK v6 IS the abstraction. Never write custom OpenAI/Anthropic API wrappers |
| Copilot/Bing monitoring | Focus on ChatGPT/Perplexity/Gemini. Copilot uses Bing, low market share for local |
| Invoice Ninja | Stripe dashboard sufficient for billing |
| Custom SMTP email | Resend API + React Email handles everything |
| Keyword-based sentiment analysis | Must be LLM-based (Claude Haiku). Keyword matching is unreliable |
| JSON retry loops | Use `generateObject()` with Zod schemas. AI SDK guarantees valid output |
| n8n for business logic | n8n is for cron triggers and webhooks ONLY. Business logic lives in Inngest |
| Promise.all() for multi-provider | NEVER. Use Promise.allSettled(). Single provider failure must not kill the audit |

---

# Immutable Constraints

These are non-negotiable architectural decisions:

1. **Scoring weights: 30/30/15/10/15 = 100** — Defined in `scoring.contract.ts`. Never use different weights anywhere.
2. **Platform enum: chatgpt | perplexity | gemini** — No claude (no web access), no google_aio (redundant with gemini).
3. **Contract-first development** — All shared types in `packages/core/src/contracts/`. Import contracts, never sibling implementations.
4. **Promise.allSettled()** for multi-provider queries. Never Promise.all().
5. **Named exports only** — No default exports anywhere.
6. **async/await only** — No .then() chains.
7. **LLM-based sentiment** — Never keyword matching.
8. **Puppeteer + HTML/CSS for PDFs** — Never React-PDF.
9. **Vercel AI SDK v6 for all LLM calls** — Never custom API wrappers.
10. **Drizzle ORM for all DB access** — No raw SQL except migrations.
11. **Zod validation on all external inputs** — No unvalidated request.body.
12. **No apps/api** — Webhooks and API routes live in apps/web/app/api/.

---

# Critical Path: What To Build Next

## Immediate (Fix broken pipeline — 6 hours)
1. Delete scaffold packages (build blocker)
2. Wire email delivery (Resend API key, test send)
3. Add PDF storage (filesystem + URL in DB)
4. Consolidate pipeline config

## Phase 1 (Minimum viable operator console — 12 hours)
5. Admin-triggered audit (button + Inngest event)
6. Pipeline status view (polling)
7. Send report button (email from admin)
8. Create client form (POST handler)

## Phase 2 (First client capable — 10 hours)
9. Proposal generation backend
10. Verification audit trigger + delta display
11. Remediation generation endpoints

## Phase 3 (Sales acceleration — 8 hours)
12. Quick query / demo mode
13. Batch mini audits
14. Email draft generation

## Phase 4 (Retention machine — 14 hours)
15. Scheduled monitoring (n8n → Inngest)
16. Monthly report queue
17. Alert system
18. Retainer health dashboard

**Total to "first client capable": 28 hours**

---

# Market Context

- **GEO market:** $886M (2024) → $7.3B by 2031 (34% CAGR)
- **Only 1.2%** of business locations recommended by ChatGPT
- **Nobody** does audit + implement + verify as a connected workflow
- **AI-referred leads convert 6-27X** higher than traditional search
- **The window is open.** Early movers in each vertical establish compounding advantages

---

*This document is the single source of truth for what Pare is and what it will become. Read it before starting any new development session.*
