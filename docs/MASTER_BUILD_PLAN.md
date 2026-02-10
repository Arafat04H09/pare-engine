# MASTER BUILD PLAN

> **Final synthesis. Single source of truth. After this document, building starts.**
> Merged from: `INTEGRATION_ARCHITECTURE.md` (14-file MCP/integration research) and `SYNTHESIS.md` (7-file feature/competitive research). Conflicts logged in Section 7.

## How to Use This Document

- **Starting a build session?** → Section 5 (Build Sequence) + the relevant Round
- **Deciding what to build?** → Section 3 (What We Build, ranked A/B/C)
- **Checking a decision?** → Section 2 (Architecture Rules) + Section 4 (What We Skip)
- **Resolving a disagreement?** → Section 7 (Conflict Log, 21 entries)
- **Looking up an integration?** → Appendix A (Tier Reference) + Appendix B (Env Config)
- **Tracing a feature to its source?** → Appendix C (every feature mapped to source doc + disposition)

---

## 1. Thesis

**We own the engine. Marginal cost is $0.63/audit. Everything below maximizes the spread.**

Pare is not a SaaS platform. It is a self-hosted consulting engine where the operator owns every component and pays only API metering costs. Competitors sell dashboards at $29–$489/month per client. Pare sells audits at $750 and retainers at $1,500+/month — and the incremental cost of delivering each audit is $0.63 in API calls.

This means:
- **Every feature decision** traces to: does it increase the spread between the $0.63 cost and the $750+ revenue?
- **Every integration choice** traces to: does it reduce per-audit cost, increase audit quality (justifying the price), or reduce operator time (increasing throughput)?
- **Every build-vs-buy decision** traces to: does owning this create margin advantage, or does renting it eat into the spread?
- **Every phasing decision** traces to: does building this now get us to a sellable audit faster?

The audit-to-implement-to-verify loop is the core value proposition. No competitor does this because monitoring-only tools can't fix things, and implementation-only consultants can't prove impact. Pare does both, and the engine makes it repeatable at near-zero marginal cost.

| Metric | Pare Engine | Otterly.ai | AthenaHQ |
|--------|------------|------------|----------|
| Per-audit cost | $0.63 | N/A (SaaS) | N/A (SaaS) |
| Client price | $750 audit / $1,500+/mo retainer | $29–$489/mo | $295+/mo |
| Gross margin per audit | 99.9% | — | — |
| Monthly operating cost (10 clients) | ~$110–165 | $4,890 (10×$489) | $2,950+ |
| Delivers fixes? | Yes (JSON-LD, llms.txt, FAQ, content rewrites) | No | No |
| Proves impact? | Yes (audit→fix→verify loop) | No | No |

---

## 2. Architecture

### Three-Mode Integration Layer

The rule: **MCP for development, API wrappers for production, custom code for IP.**

```
┌──────────────────────────────────────────────────────────────┐
│                      INTEGRATION LAYER                        │
│                                                                │
│  ┌──────────────────┐  ┌───────────────┐  ┌──────────────┐   │
│  │  MCP Servers      │  │  API Wrappers  │  │  Custom IP    │   │
│  │  (Dev-time only)  │  │  (Production)  │  │  (Never buy)  │   │
│  │                   │  │               │  │              │   │
│  │  Context7         │  │  Firecrawl    │  │  5-Pillar    │   │
│  │  Drizzle MCP      │  │  OpenAI       │  │  Scoring     │   │
│  │  Firecrawl MCP    │  │  Perplexity   │  │              │   │
│  │  Stripe MCP       │  │  Gemini       │  │  Citation    │   │
│  │  Notion MCP       │  │  PageSpeed    │  │  Tracker     │   │
│  │  Resend MCP       │  │  Places API   │  │              │   │
│  │  Playwright MCP   │  │  Serper       │  │  JSON-LD     │   │
│  │  SEO Inspector    │  │  DataForSEO   │  │  Parser      │   │
│  │  Serena           │  │  Stripe API   │  │              │   │
│  │  Xpoz MCP         │  │  Resend API   │  │  Prompt      │   │
│  │  Task Master      │  │  Inngest SDK  │  │  Library     │   │
│  │                   │  │               │  │              │   │
│  │  ↓ Dev-time       │  │  ↓ Vendored   │  │  ↓ Core IP   │   │
│  │    exploration     │  │    via mcp-   │  │    in        │   │
│  │    & testing       │  │    to-ai-sdk  │  │  packages/   │   │
│  │                   │  │               │  │  core        │   │
│  └──────────────────┘  └───────────────┘  └──────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Mode 1: MCP Servers (Development Only)** — Used during Claude Code sessions to interact with real services. Never in production code paths. Security rule: run `mcp-to-ai-sdk` before production deployment to vendor tool definitions into static AI SDK stubs, eliminating prompt injection risk from dynamic tool loading.

**Mode 2: API Wrappers (Production Pipeline)** — Typed tool functions in `packages/core/src/tools/`. Each function: typed input → typed output, Zod-validated, custom error classes, wrappable as Inngest step or MCP tool.

**Mode 3: Custom IP (Never Buy)** — Pare's competitive moat. The seven things we build ourselves:
1. Scoring algorithm — 5 pillar functions with weights (30/30/15/10/15)
2. Cross-provider citation tracker — normalize citations into unified graph
3. AI accuracy scorer — compare AI responses against known-truth data
4. JSON-LD parser + schema gap recommender — extract, validate, recommend
5. Vertical-specific prompt library — GEO prompts per business vertical
6. GEO score history — time-series tracking in `monitoringResults`
7. Prompt normalization engine — make same prompt comparable across engines

### Dependency Map

```
FOUNDATION LAYER (configure first — everything depends on these)
├── packages/core/src/config.ts (Zod env validation)
│   ├── Every API integration needs env vars validated here
│   └── Must exist before: Firecrawl, AI SDK, Stripe, Resend, etc.
│
├── Drizzle + PostgreSQL
│   ├── Schema must exist before: audit pipeline, scoring storage
│   └── Must exist before: Inngest steps (they read/write DB)
│
├── Vercel AI SDK v6
│   ├── Provider packages (@ai-sdk/openai, @ai-sdk/google, @ai-sdk/anthropic)
│   └── Must exist before: AI engine monitoring, LLM-based scoring
│
└── Context7 + cc-sdd (build-time only)

CRAWLING LAYER (depends on Foundation)
├── Firecrawl API
│   ├── Depends on: config.ts (API key)
│   ├── Feeds: Schema analysis, Content analysis, Technical checks
│   └── Must exist before: any scoring pillar that analyzes page content
│
└── Google PageSpeed Insights API
    ├── Depends on: nothing (free, no key needed)
    └── Feeds: Technical Readiness pillar

MONITORING LAYER (depends on Foundation)
├── OpenAI Responses API (web_search)
│   └── Feeds: AI Visibility pillar (mention rate, citation, position, sentiment)
│
├── Perplexity Sonar API
│   └── Feeds: AI Visibility pillar (citation tracking — best source)
│
└── Google Gemini API (grounding)
    └── Feeds: AI Visibility pillar (Google's AI view)

SCORING LAYER (depends on Crawling + Monitoring)
├── AI Visibility (30 pts) — needs all 3 engine responses + Claude Haiku
├── Content Quality (30 pts) — needs Firecrawl markdown + Claude Haiku
├── Schema/Structured Data (15 pts) — needs Firecrawl HTML (JSON-LD extraction)
├── Technical Readiness (10 pts) — needs Firecrawl + PageSpeed
└── Local/GBP (15 pts) — needs Google Places API

REPORT LAYER (depends on Scoring)
├── HTML/CSS templates + inline SVG charts
└── Puppeteer page.pdf()

DELIVERY LAYER (depends on Report)
├── Resend + React Email (send PDF)
├── Stripe (payment triggers pipeline)
└── Notion (one-way sync from Postgres)

PIPELINE ORCHESTRATION (wraps all layers)
└── Inngest: CRAWL → QUERY → ANALYZE → SCORE → REPORT → DELIVER
```

### Critical Path (Minimum Viable Audit)

```
config.ts → Firecrawl → OpenAI API → Claude Haiku → Scoring → HTML template → Puppeteer → PDF
```

7 integrations. Everything else enriches or extends.

### Architecture Rules

**Client Data Ownership:** Postgres is the source of truth. Notion is a read-only view layer. All writes go to Postgres via Drizzle. A simple Inngest step syncs to Notion. Never read from Notion to make pipeline decisions.

**Admin Authentication:** Session-based, single operator account, bcrypt + cookie, middleware on all `/admin/*` routes. Login at `/admin/login`. No OAuth, no magic links, no multi-tenant. Must be wired before admin dashboard deploys.

**Graceful Degradation:** If a provider is down mid-audit, score with available data and flag the gap. The pipeline uses `Promise.allSettled()` — failed providers are logged, not thrown. AI Visibility is scored out of 30 using whichever engines responded (normalize to the available set). The report must note which providers were unavailable. Minimum viable audit: 1 provider + 5 prompts. Never queue and wait — deliver what you have.

**Production MCP Safety:** Run `mcp-to-ai-sdk` before every production deployment. This vendors MCP tool definitions into static AI SDK stubs, eliminating prompt injection risk from dynamic tool loading. No MCP server runs in the production code path — ever. MCP is a development tool only.

**Canonical Pricing:** Audit price is $750 (standard) / $1,500 (multi-location), per `PRODUCT_SUITE.md`. The Integration doc's $497 figure was an earlier estimate and is superseded. All cost calculations in this document use $750 as the baseline.

---

## 3. What We Build (Ranked)

Ranking formula: **(revenue displacement × client visibility) / build effort**

Each item shows: what it replaces, build path, effort, AND which integrations it depends on.

### Tier A — Core Engine (Build First, Revenue Depends On These)

#### A1. AI Visibility Monitor [Clone Rank 1]
- **Replaces:** Otterly.ai ($29–$489/mo), AthenaHQ ($295+/mo)
- **Build path:** AI SDK → Perplexity Sonar + OpenAI Responses API + Gemini w/ grounding → `generateObject()` with Zod schema → store in `monitoringResults`
- **Effort:** 2–3 days
- **Integrations:** Tier 1 — OpenAI Responses API, Perplexity Sonar, Gemini API, Vercel AI SDK v6
- **Thesis link:** The atomic unit of monitoring. Every downstream feature reads from this data.

#### A2. Competitor Share of Voice Matrix [Clone Rank 2]
- **Replaces:** Otterly "Share of Voice," ZipTie competitor tracking
- **Build path:** Run A1 for client + 3 competitors across 10–25 queries → aggregate → percentage
- **Effort:** Free (loop + aggregation on A1 data)
- **Integrations:** Same as A1 (no new integrations)
- **Thesis link:** "FEAR sells better than features." Single most effective slide in sales deck.

#### A3. Schema Gap Detector [Clone Rank 3]
- **Replaces:** Geoptie schema audit, Merkle Schema Generator
- **Build path:** Firecrawl HTML → extract `<script type="application/ld+json">` → validate against required types (LocalBusiness, Service, FAQ, Product) → report gaps
- **Effort:** 1–2 days
- **Integrations:** Tier 1 — Firecrawl. Optionally Tier 2 — SEO Inspector MCP (validation)
- **Thesis link:** The "scare tactic" that sells the sprint. Pure parsing, no LLM needed.

#### A4. 5-Pillar Scoring Engine [Core IP]
- **Replaces:** Custom. No direct competitor equivalent.
- **Build path:** Five scoring functions (0→max each), composite sum, letter grade. Weights: 30/30/15/10/15. Claude Haiku for sentiment via `generateObject()`.
- **Effort:** 3–4 days (including tests)
- **Integrations:** Tier 1 — AI SDK (Claude Haiku for sentiment). Custom IP — never outsource.
- **Thesis link:** The score IS the product. Every report page, every trend chart, every delta alert reads from this.

#### A5. 9-Page Branded Audit PDF [Clone Rank 5]
- **Replaces:** Vendasta Snapshot Report, AgencyAnalytics ($12–$1,000/mo)
- **Build path:** HTML/CSS templates (brand: #1B2A4A navy, #00D4AA teal) → inject audit data → Puppeteer `page.pdf()`
- **Effort:** 5–7 days (design + 9 templates + edge cases)
- **Integrations:** Tier 1 — Puppeteer. No external service dependency.
- **Thesis link:** The report IS the revenue ($750). Everything upstream feeds it.

#### A6. Mini-Audit PDF (1-Page Lead Magnet) [Clone Rank 13]
- **Replaces:** Vendasta Snapshot Report (lead gen)
- **Build path:** Stripped-down audit (1 LLM query + schema check + Lighthouse) → single-page template → Puppeteer
- **Effort:** 2 days (IF full audit pipeline exists)
- **Integrations:** Same as A5 (subset of full pipeline)
- **Thesis link:** The "free taste" that converts prospects. Must exist before marketing site launches.

#### A7. Technical GEO Audit [Clone Rank 12]
- **Replaces:** ZipTie technical checks ($99–$799/mo), Screaming Frog lite
- **Build path:** robots.txt AI crawler rules + llms.txt detection + Firecrawl (sitemap, mobile, SSL) + PageSpeed Insights
- **Effort:** 2–3 days
- **Integrations:** Tier 1 — Firecrawl, PageSpeed Insights API (free)
- **Thesis link:** Feeds the Technical Readiness pillar (10 pts). Without this, the 5-pillar scoring engine cannot produce a complete score. Built in Round 2 (S6). Not optional.

### Tier B — Differentiation Features (Create Switching Costs)

#### B1. JSON-LD Schema Generator ("Fix It" Engine) [Clone Rank 6 + NS-1]
- **Replaces:** Manual dev work ($500–$2,000 per client), Merkle tools
- **Build path:** Client data + Firecrawl content → LLM `generateObject()` with Zod schema matching LocalBusiness/Service/FAQ spec → output valid JSON-LD
- **Effort:** 2–3 days
- **Integrations:** Tier 1 — Firecrawl, AI SDK (Claude Haiku)
- **Thesis link:** Bridges "diagnosis vs cure." Turns $750 audit into $3,000 sprint with near-zero additional effort.

#### B2. llms.txt + robots.txt Generator [Clone Rank 4 + NS-1]
- **Replaces:** Nothing (no competitor does this)
- **Build path:** Firecrawl content → LLM summarize → format as Markdown per llms.txt spec + robots.txt AI crawler rules
- **Effort:** 1 day
- **Integrations:** Tier 1 — Firecrawl, AI SDK
- **Thesis link:** Instant deliverable. Client gets a file to upload immediately. Fastest "we did something" win.
- **Why Tier B, not A (despite Rank 4):** High visibility and trivial effort, but zero revenue displacement — no competitor charges for this. It's a sprint deliverable, not an audit component. The audit can be sold without it; the sprint can't be delivered without it. Tier B (moat) is the correct home.

#### B3. Content Answer-First Auditor [Clone Rank 7]
- **Replaces:** Geoptie content scoring, SurferSEO/Frase ($49–$199/mo)
- **Build path:** Firecrawl markdown → Claude Haiku `generateObject()`: score answer-first format, FAQ presence, stats density, author signals → per-page scoring averaged across site
- **Effort:** 2 days
- **Integrations:** Tier 1 — Firecrawl, AI SDK (Claude Haiku)
- **Thesis link:** Replaces naive string-length checks. Content Quality is 30 points — needs LLM evaluation.
- **Build note:** The Content Quality *scoring function* (0–30) is built in Round 2 (S5) as part of A4. B3 refers to the enhanced standalone auditor that produces per-page breakdowns and detailed report sections — built in Round 6 (S18/S19). The scoring foundation ships first; the rich report output ships later.

#### B4. Review Sentiment Summarizer [Clone Rank 9]
- **Replaces:** BirdEye/Podium lite ($199+/mo), BrightLocal review monitoring
- **Build path:** Google Places API (reviews by Place ID) → LLM summarize "loves" vs "hates" → "Voice of Customer" report section
- **Effort:** 1–2 days
- **Integrations:** Tier 2 — Google Places API. Tier 1 — AI SDK (Claude Haiku)
- **Thesis link:** Feeds both the report and AI Accuracy scoring (what AI says vs what customers say).

#### B5. "Why You Lost" Analyzer [Clone Rank 8]
- **Replaces:** ZipTie optimization advice, manual competitor analysis
- **Build path:** Firecrawl (competitor + client URLs) → LLM compare: "Why would an AI recommend A over B? Be specific."
- **Effort:** 1–2 days
- **Integrations:** Tier 1 — Firecrawl, AI SDK
- **Thesis link:** Directly justifies the sprint purchase. Client sees exactly what competitor does better.

#### B6. FAQ Generator [Clone Rank 10 + NS-1]
- **Replaces:** AnswerThePublic ($99/mo), manual content strategy
- **Build path:** Audit findings + vertical context → LLM generate Q&A pairs → output as HTML/Markdown
- **Effort:** 1 day
- **Integrations:** Tier 1 — AI SDK. No external data dependency.
- **Thesis link:** Part of the Implementation Engine. Every missing FAQ becomes a deliverable.

#### B7. Audit → Fix → Verify Loop [NS-2]
- **Replaces:** Nothing (no competitor does this)
- **Build path:** Run audit → apply fixes → re-run audit → show before/after delta on same report page
- **Effort:** 2–3 days (orchestration + delta report template)
- **Integrations:** Requires A1–A5 to exist. No new integrations.
- **Thesis link:** The "proof of ROI" that justifies retainers. "Score: 23 → 67 after Sprint 1."

#### B8. Competitor-Centric Narrative Reporting [NS-4]
- **Replaces:** Generic dashboard charts
- **Build path:** Rewrite all report sections as relative comparisons. Fear → Hope → Proof arc.
- **Effort:** 2–3 days (report template rework + LLM narrative generation)
- **Integrations:** Tier 1 — AI SDK. Requires A2 (Share of Voice) data.
- **Thesis link:** Makes sales dramatically more effective. Not just "Score: 34" but "Dr. Smith is #1 at 78. You are #4 at 34. Here is why."

#### B9. Vertical-Specific Prompt Library [NS-3]
- **Replaces:** Nothing (no tool provides this)
- **Build path:** Seed 3 verticals (Dental, HVAC, Legal). Industry-specific query sets + recommendations. Store in `promptLibrary` table.
- **Effort:** 3–4 days (research + data entry + testing)
- **Integrations:** Custom IP — no external dependency. Gets better with each client.
- **Thesis link:** Network effect within verticals. Every audit for a dentist improves every future dentist audit.

### Tier C — Scale Features (Remove Operator From the Loop)

#### C1. Inngest Scheduled Monitoring
- **Build path:** Weekly cron runs AI visibility checks per retainer client. Stores snapshots in `monitoringResults`.
- **Effort:** 2–3 days
- **Integrations:** Tier 1 — Inngest. Uses A1 (AI Visibility) functions.
- **Thesis link:** Automated retainer justification. Runs without operator.

#### C2. Score Delta Alerts + Causal Attribution [NS-5]
- **Build path:** Compare weekly snapshots → detect significant changes → email via Resend: "Score dropped 12 pts — Perplexity found a new negative review."
- **Effort:** 2–3 days
- **Integrations:** Tier 2 — Resend. Tier 1 — Inngest (trigger). Requires score history.
- **Thesis link:** Makes retainer indispensable. Client sees *why* things change, not just *that* they changed.

#### C3. Monthly Trend Report PDF (2-Page)
- **Build path:** Template with score trend chart (inline SVG) + week-over-week changes + key events. Auto-generated, auto-emailed.
- **Effort:** 2–3 days (template + automation)
- **Integrations:** Tier 1 — Puppeteer, Inngest. Tier 2 — Resend.
- **Thesis link:** The retainer justification artifact. Proves ongoing value monthly.

#### C4. Operator Admin Dashboard
- **Build path:** Next.js `/admin/*` routes: client list, audit history, score trends, one-click re-audit, PDF download. Session-based auth.
- **Effort:** 5–7 days
- **Integrations:** No external. Reads from Postgres via Drizzle.
- **Thesis link:** Consolidated command center. Reduces per-client operator time.

#### C5. Content Optimizer / Rewriter [Clone Rank 15]
- **Build path:** Firecrawl (weak page) → LLM rewrite in answer-first format with stats + FAQ → output optimized markdown
- **Effort:** 3–5 days (prompt engineering + QA)
- **Integrations:** Tier 1 — Firecrawl, AI SDK
- **Thesis link:** Sprint automation. Reduces implementation time per client.

#### C6. Local AI Grid [Clone Rank 11]
- **Build path:** Run A1 across 5–9 zip codes → heatmap visualization
- **Effort:** 2 days
- **Integrations:** Same as A1
- **Thesis link:** Visual proof of "invisible zones." Powerful in sales presentations.

#### C7. Citation Consistency Checker [Clone Rank 14]
- **Build path:** Google Places API (canonical NAP) + DataForSEO (directory search) → compare NAP across top 20 results → flag inconsistencies
- **Effort:** 5–7 days (data cleaning is the hard part)
- **Integrations:** Tier 2 — Google Places API, DataForSEO
- **Thesis link:** Important for GBP pillar depth. Audit-only; citation *building* is deferred.

#### C8. Agentic Commerce Readiness [NS-6]
- **Build path:** Product/Offer schema check + pricing transparency + API accessibility + UCP/ACP compliance
- **Effort:** 3–5 days
- **Integrations:** Tier 1 — Firecrawl. Custom IP — define the audit criteria.
- **Thesis link:** E-commerce upsell. First mover in defining what "AI shopping agent ready" means.

#### C9. AI Crawler Analytics [Core IP]
- **Build path:** Track GPTBot, ClaudeBot, PerplexityBot visits to client websites. Verify against official IP ranges. Log parser + webhook.
- **Effort:** 2–3 days
- **Integrations:** Custom. No external API needed.
- **Thesis link:** Profound charges $499/mo for this. We include it in the retainer.

### Other Useful Features (Build When Needed)

| Feature | Rank | Effort | Trigger |
|---------|------|--------|---------|
| Keyword→Question Converter | 17 | Half day | When seeding prompt library |
| Indexing Check | 16 | 1 day | When A1 infrastructure exists |
| Stripe Integration | — | 3–5 days | Before accepting paid audits |
| Public Website | — | 5–7 days | Before marketing launches |
| Notion Sync | — | 1–2 days | When onboarding first client |

---

## 4. What We Skip

Merged from both documents. Deduplicated. One table.

### Products / Features We Don't Build

| Feature | Rationale |
|---------|-----------|
| **GoHighLevel clone** | Massive surface area. No technical moat. Integrate with it if clients use it. |
| **Semrush/Ahrefs keyword database** | Proprietary planetary-scale crawling. Buy data via DataForSEO ($0.01/query). |
| **Vendasta marketplace** | Business dev moat, not tech. Clone the Snapshot Report (A6), not the marketplace. |
| **Yext listings management** | Moat is direct API partnerships with publishers. Citation *auditing* is feasible; *syncing* is not. |
| **Duda website builder** | Don't build a site builder. |
| **Nightwatch rank tracking** | Commoditized. Requires distributed proxy networks. Use DataForSEO for the 5% we need. |
| **Goodie AI attribution** | Multi-touch attribution is complex, low relevance to solo GEO consulting. |
| **Profound enterprise workflows** | Enterprise sales/process moat. Not relevant to SMB solo consulting. |
| **Full BrightLocal citation network** | Fulfillment network requires ops teams + aggregator partnerships. We build the *audit*, not the fulfillment. |
| **Social Proof Monitor (Mention.com)** | Brittle social scraping, low signal-to-noise. AI brand mentions (A1) are the metric that matters. |
| **Meeting Intelligence (Fireflies)** | Orthogonal to GEO. Adds scope without adding to audit→fix→verify loop. |
| **SEMrush "Keyword Magic" clone** | Too commoditized. Keyword→Question converter (Rank 17) captures the useful slice. |
| **Client-facing dashboard** | Explicitly deferred per CLAUDE.md. PDFs + Loom walkthroughs until 10+ retainer clients. |
| **Batch prospecting tools** | Deferred per CLAUDE.md. |
| **Multi-tenant architecture** | Deferred. Single operator for now. |

### Tools / Integrations We Don't Wire

| Tool | Rationale |
|------|-----------|
| **Ahrefs API v3** | $1,499/mo minimum. DataForSEO covers 80% at 5% of cost. |
| **SEMrush API/MCP** | $130–450/mo. Overkill. DataForSEO + Serper cover the use case. |
| **Moz API** | $99+/mo. Domain Authority is nice-to-have, not a scoring input. |
| **SerpAPI** | $75/mo for 5K searches. Serper gives 50K for $50. Redundant. |
| **Supabase MCP** | Wrong stack. Pare uses Drizzle + self-hosted Postgres. |
| **Firebase MCP** | Wrong database architecture entirely. |
| **Neon MCP** | Serverless Postgres branching — unnecessary on self-hosted Hetzner. |
| **E2B MCP** | Cloud sandboxes. Audit pipeline runs on Hetzner. |
| **Trigger.dev MCP** | Inngest mandated. Switching creates churn. |
| **HubSpot MCP** | Enterprise CRM. Notion handles first 10 clients. |
| **Salesforce MCP** | Enterprise. Not relevant until 50+ clients. |
| **Brandwatch** | $800–15,000/mo. Xpoz free tier covers the need. |
| **X API v2 direct** | $100–5,000/mo. Xpoz covers Twitter/X for free. |
| **Bright Data MCP** | $500+/mo enterprise scraping. Firecrawl + Xpoz suffice. |
| **Mem0 / OpenMemory** | Overkill for solo dev. |
| **Cognee MCP** | Full GraphRAG. Not needed at this scale. |
| **Continuous-Claude v3** | Study the PreCompact hook pattern. Don't install 32 agents. |
| **Claude-Flow** | 60+ agent orchestration. Claude Code Task tool suffices. |
| **Sourcegraph MCP** | Enterprise SCIP search. Serena + Context7 covers it. |
| **Linear / Attio MCP** | Not using Linear. Notion mandated. |
| **PostHog / Mixpanel MCP** | Premature. No client-facing product to track. |
| **PagerDuty MCP** | Solo consultant doesn't need on-call rotation. |
| **Grafana / Kubernetes / Render / Vercel MCP** | Wrong hosting stack. Pare deploys on Hetzner + Coolify. |
| **Docker MCP Toolkit** | Local Docker Compose handles this. |
| **neo4j-mcp** | Graph DB premature. JSONB in Postgres handles current needs. |
| **Pinecone MCP** | Vector search for "Chat with Audit" feature. Deferred. |
| **Vault MCP** | HashiCorp overkill. `.env` + Zod validation suffices. |

---

## 5. Build Sequence

### Reconciliation Notes

The two source documents used fundamentally different timelines:
- **Integration doc:** 7 rounds in ~12 days, optimized for parallel Claude Code sessions
- **Synthesis doc:** 4 phases across ~12 weeks, sequential feature-based phasing

**Winner: The integration doc's session-based approach** with the synthesis doc's feature prioritization. Rationale: The session model is more actionable (it tells you exactly what to build in each session) and the parallelization halves wall-clock time. The synthesis doc's week-based phases are too conservative — these are Claude Code sessions, not handwritten code. However, the synthesis doc's feature ranking within phases is better (it prioritizes by revenue displacement, not just dependency order).

**Key conflict resolved:** The synthesis doc defers Inngest pipeline + admin dashboard + Stripe to Phase 4 (Weeks 9–12). The integration doc puts them in Rounds 4–5 (Days 5–9). **Winner: Integration doc.** You cannot sell audits without a pipeline to run them, a way to accept payment, or a dashboard to manage clients. These are not "scale features" — they are the product.

See Section 7 (Conflict Log) for all individual conflicts.

**On effort estimates vs session timelines:** Effort estimates in Section 3 (e.g., "5–7 days") are human-equivalent working days, not Claude Code session wall-clock time. A Claude Code session compresses roughly 3–5 human-days of implementation into a single session (hours, not days). A "5–7 day" feature like the 9-Page PDF (A5, session S10) fits within one round because the session does the work of a week. If a session runs long and spills past its round, it merges when ready — the round boundary is a target, not a hard gate.

---

### Round 1: Foundation (Day 1)

Three parallel sessions. Infrastructure and feature code start simultaneously.

| Session | Scope | Integrations Wired | Exit Criteria |
|---------|-------|-------------------|---------------|
| **S1: Config + Dev Infra** | `.env.example`, Zod config (`packages/core/src/config.ts`), MCP server config (`.claude/settings.json`), PreCompact hook, seed MEMORY.md, cc-sdd install | Context7, Drizzle MCP, Firecrawl MCP | `config.ts` exports validated env object. MCP servers connect. |
| **S2: Scoring Foundation** | Fix weights to 30/30/15/10/15. Implement composite scorer. Set up Vitest. Write tests for current buggy code to document the bugs. | — | Weights correct. `pnpm test` runs. Tests pass. |
| **S3: Firecrawl Integration** | Replace `site-crawler` stub with Firecrawl `map()` + `crawl()`. Typed tool function pattern. | **Firecrawl API** | Can crawl a real domain → markdown + HTML back. Zod-validated I/O. |

**Feature items delivered:** Foundation for A3 (Schema Gap), A4 (Scoring), A7 (Technical Audit).

---

### Round 2: AI Engines + Analysis (Days 2–3)

Four parallel sessions. Crawling and config merged. Wire the AI engines and build scoring pillars.

| Session | Scope | Integrations Wired | Exit Criteria |
|---------|-------|-------------------|---------------|
| **S4: AI Engine Providers** | AI SDK v6 wiring. OpenAI web_search, Perplexity Sonar, Gemini Grounding. `Promise.allSettled()` for multi-provider queries. | **OpenAI Responses API, Perplexity Sonar, Gemini API** | Query all 3 engines. Failed providers logged, not thrown. |
| **S5: LLM Parser + Content Scoring** | `generateObject()` + Zod schemas for mention/citation/sentiment extraction. Content Quality scoring (Firecrawl output + Haiku analysis). | **Claude Haiku via AI SDK** | Parser extracts mentions, citations, sentiment. Content scorer returns 0–30. |
| **S6: Technical Readiness Scoring** | PageSpeed Insights integration. robots.txt AI crawler rules. llms.txt detection. Sitemap validation. Mobile/SSL from Firecrawl. | **PageSpeed Insights API** | Technical scorer returns 0–10. Tests pass. |
| **S7: Schema Scoring** | Custom JSON-LD parser from Firecrawl HTML. Schema type identification, gap detection, completeness scoring. | — | Schema scorer returns 0–15. Tests pass. |

**Feature items delivered:** A1 (AI Visibility — core data), A3 (Schema Gap), A4 (Scoring — 3 of 5 pillars), B3 (Content Auditor — foundation), A7 (Technical Audit).

---

### Round 3: Complete Scoring + Reports (Days 3–5)

Four parallel sessions. All providers wired. All pillar scorers except GBP exist.

| Session | Scope | Integrations Wired | Exit Criteria |
|---------|-------|-------------------|---------------|
| **S8: GBP/Local Scoring** | Google Places API integration. GBP completeness (reviews, hours, photos, categories). NAP extraction. | **Google Places API** | GBP scorer returns 0–15. Tests pass. |
| **S9: AI Visibility Scoring + Citation Normalizer** | AI Visibility scorer (30 pts) using parsed responses from 3 engines. Cross-provider citation normalizer (core IP). | — (uses S4 output) | AI Visibility scorer returns 0–30. Citation normalizer produces unified graph. |
| **S10: Report Templates** | HTML/CSS templates: mini 1-page + full 9-page. Brand guidelines (#1B2A4A, #00D4AA). Inline SVG for gauges/charts. Puppeteer `page.pdf()`. | **Puppeteer** | Both templates render. PDFs generate. Layout handles edge cases. |
| **S11: Scoring Test Suite** | Comprehensive tests for all 5 pillars. Composite score tests. Verify weights sum to 100, no pillar exceeds max, composite ≤ 100. | — | All scoring tests pass. Edge cases covered. |

**Feature items delivered:** A1 (AI Visibility — complete), A2 (Share of Voice — data ready), A4 (Scoring — all 5 pillars), A5 (9-Page PDF), A6 (Mini-Audit PDF), B4 (Review Sentiment — foundation via GBP data).

---

### Round 4: Pipeline + Delivery (Days 5–7)

Two parallel sessions. All scoring works. Reports generate. Connect everything.

| Session | Scope | Integrations Wired | Exit Criteria |
|---------|-------|-------------------|---------------|
| **S12: Inngest Pipeline** | Full audit pipeline as Inngest steps: CRAWL → QUERY → ANALYZE → SCORE → REPORT. Each step independently retriable. | **Inngest** | Domain in → PDF buffer out via Inngest dev server. Each step logs success/failure. |
| **S13: Email Delivery** | React Email templates with Pare branding. Resend for PDF delivery (attachment + branded email). Receipt confirmation. | **Resend + React Email** | Branded email with PDF attachment sends to test address. |

**MILESTONE: After Round 4 merge, you have a sellable product.** Domain in → crawl → query 3 AI engines → analyze → score → PDF → email. This is the $750 audit.

**Feature items delivered:** Complete audit pipeline end-to-end.

---

### Round 5: Web + Sales Infrastructure (Days 7–10)

Four parallel sessions. Pipeline works headless. Now give it a face and a cash register.

| Session | Scope | Integrations Wired | Exit Criteria |
|---------|-------|-------------------|---------------|
| **S14: Next.js + Public Routes + Auth** | Scaffold `apps/web`. Public routes (`/`, `/audit`, `/services`, `/about`, `/contact`). Admin auth: session-based, bcrypt + cookie, middleware on `/admin/*`. | — | App serves. Public routes render. `/admin/*` requires login. |
| **S15: Audit Form + Stripe** | `/audit` form (domain + business info + payment). Stripe Checkout. Webhook: payment → trigger Inngest pipeline. Client record → Postgres. | **Stripe API** | Form → pay → webhook → pipeline triggers → client saved. |
| **S16: Admin Dashboard** | `/admin` routes: client list, audit history, score breakdown, re-run audit, PDF download. All from Postgres via Drizzle. | — | Operator can manage everything from dashboard. |
| **S17: Notion Sync** | One-way sync: Postgres `clients` → Notion database (after audit completion). n8n cron for weekly monitoring triggers. **n8n fires a webhook that triggers an Inngest function. n8n never runs the monitoring logic itself** — it is a scheduler only (avoids n8n's 5-min execution timeout). | **Notion MCP, n8n** | Client appears in Notion post-audit. Weekly cron fires. Inngest function receives webhook and runs. |

**Dependency:** S16 depends on S14's auth middleware. S14 and S15 can develop concurrently and merge together.

**Feature items delivered:** C4 (Admin Dashboard), Stripe integration, public website foundation, Notion sync.

---

### Round 6: Moat Features (Days 10–14)

Four parallel sessions. The core product is live. Now build the differentiation layer.

| Session | Scope | Integrations Wired | Exit Criteria |
|---------|-------|-------------------|---------------|
| **S18: Implementation Engine** | JSON-LD generator (B1), llms.txt generator (B2), FAQ generator (B6). The "Fix It" outputs. | Tier 1 — Firecrawl, AI SDK | Audit produces fix files alongside the report. |
| **S19: Competitive Intelligence** | "Why You Lost" analyzer (B5). Competitor-centric narrative reporting (B8). Serper.dev for SERP position. DataForSEO for backlinks/keywords. | **Serper API, DataForSEO API** | Reports tell stories, not just numbers. SERP data enriches visibility scoring. |
| **S20: Verify Loop + Score History** | Audit→Fix→Verify cycle (B7). GEO score history tracking. Before/after delta in report template. | — | Re-audit shows score improvement. History persists in DB. |
| **S21: Vertical Intelligence + Accuracy** | Vertical prompt library — 3 verticals (B9). AI accuracy scorer (core IP). | — | 20+ prompts across 3 verticals. Accuracy scorer compares AI claims vs facts. |

**Feature items delivered:** B1, B2, B5, B6, B7, B8, B9, plus core IP (citation tracker, accuracy scorer, score history).

---

### Round 7: Production + Polish (Days 14–18)

| Session | Scope | Integrations Wired | Exit Criteria |
|---------|-------|-------------------|---------------|
| **S22: Production Deployment** | `mcp-to-ai-sdk` for production safety. Coolify on Hetzner. Env vars. SSL. Domain. Smoke test full pipeline. | **mcp-to-ai-sdk** | Full audit runs in production. Site loads. Admin works. Email delivers. |
| **S23: Social + Review Enrichment** | Xpoz for social signals. Apify Google Maps for competitor reviews. SEO Inspector for schema validation. | **Xpoz, Apify, SEO Inspector** | Social mentions and competitor reviews feed into reports. |

**MILESTONE: Production launch.** Live website, working audit pipeline, admin dashboard, payment flow.

---

### Round 8: Scale (Week 4+)

Build as needed, triggered by client demand.

| Session | Trigger | Scope |
|---------|---------|-------|
| **S24** | First retainer client | Monthly trend report template (C3), scheduled monitoring (C1) |
| **S25** | Client demand | Score delta alerts + causal attribution (C2) |
| **S26** | E-commerce client | Agentic commerce readiness (C8) |
| **S27** | 5+ retainer clients | Content optimizer (C5), Local AI Grid (C6), Citation checker (C7) |
| **S28** | Scale pain | AI crawler analytics (C9), dev tooling upgrades |

---

### Sales Flow (What a Prospect Sees and When)

This is the sequence the business follows. The build sequence above is ordered to support this flow.

```
STAGE 1: ATTRACT (requires: public website + mini-audit)
─────────────────────────────────────────────────────
Prospect finds Pare via:
  → LinkedIn outreach with teaser finding
    ("I asked ChatGPT for the best dentist in Austin. Your competitor was #1. You weren't mentioned.")
  → Website mini-audit form (1-page free report)
  → Referral from existing client

Output: 1-page mini-audit PDF delivered instantly via email.
Built in: Rounds 1–5 (A6 + S15 public form)

STAGE 2: CONVERT (requires: full audit pipeline + Stripe)
─────────────────────────────────────────────────────
Prospect receives mini-audit → wants full picture.
  → Pays $750 via Stripe Checkout on /audit page
  → Full 9-page audit runs automatically (Inngest pipeline)
  → Branded PDF delivered via email within minutes
  → Operator schedules 30-45 min walkthrough call

Output: 9-page branded audit PDF + walkthrough call.
Built in: Rounds 1–5 (A5 + S12 pipeline + S15 Stripe)

STAGE 3: CLOSE SPRINT (requires: implementation engine + verify loop)
─────────────────────────────────────────────────────
During walkthrough call, operator presents:
  → Competitor comparison: "Here's who IS showing up instead of you"
  → Score gap: "You're at 34. Your competitor is at 78."
  → Fix preview: "Here's the exact JSON-LD we'll add to your site"
  → Sprint proposal: $3,000–$7,000 for 4-week implementation

Sprint deliverables generated by engine:
  → JSON-LD schema files (B1)
  → llms.txt file (B2)
  → FAQ content (B6)
  → Content rewrites (C5, if built)
  → Verify audit showing before/after delta (B7)

Output: Sprint proposal → signed → fixes delivered → verification report.
Built in: Round 6 (S18 implementation engine + S20 verify loop)

STAGE 4: RETAIN (requires: scheduled monitoring + trend reports)
─────────────────────────────────────────────────────
After sprint completion:
  → Weekly automated monitoring (C1)
  → Monthly trend report PDF auto-emailed (C3)
  → Score delta alerts when something changes (C2)
  → Quarterly strategy calls using trend data

Retainer price: $1,500+/mo. Engine cost: ~$10-15/mo per client in API calls.
Built in: Round 8 (S24–S25)

STAGE 5: EXPAND (requires: vertical intelligence + agentic commerce)
─────────────────────────────────────────────────────
For clients with demonstrated ROI:
  → Agentic commerce readiness audit (C8) — $5,000–$10,000
  → Multi-location expansion
  → Referrals to other businesses in the same vertical
  → Vertical prompt library improves with each client (B9)

Built in: Round 8 (S26+)
```

### Session Dependency Graph

```
Round 1 (Day 1):       S1 ──┐    S2 ──┐    S3 ──┐
                        config│   score│   crawl │
                              ▼       ▼        ▼
                           ┌────── MERGE ──────┐
                           │                    │
Round 2 (Days 2–3):  S4 ──┤  S5 ──┤  S6 ──┤  S7 ──┤
                     engine│  parse│  tech │  schema│
                           ▼      ▼       ▼       ▼
                           ┌────── MERGE ──────┐
                           │                    │
Round 3 (Days 3–5):  S8 ──┤  S9 ──┤  S10 ─┤  S11 ─┤
                     gbp  │  visib│  report│  tests │
                          ▼      ▼       ▼       ▼
                           ┌────── MERGE ──────┐
                           │                    │
Round 4 (Days 5–7):  S12 ─┤         S13 ─┤
                     inngest│         email│
                            ▼              ▼
                     ┌──── MERGE ────┐ ← SELLABLE PRODUCT ($750 audit)
                     │               │
Round 5 (Days 7–10): S14 ─┤  S15 ─┤  S16 ─┤  S17 ─┤
                     web+  │  audit│  admin│  notion│
                     auth  │  +pay │  panel│  sync │
                           ▼      ▼       ▼      ▼
                     ┌────── MERGE ──────┐ ← CAN ACCEPT PAYMENT
                     │                    │
Round 6 (Days 10–14):S18 ─┤  S19 ─┤  S20 ─┤  S21 ─┤
                     fix-it│  comp.│  verify│  vert.│
                     engine│  intel│  loop │  intel │
                           ▼      ▼       ▼      ▼
                     ┌────── MERGE ──────┐ ← FULL MOAT
                     │                    │
Round 7 (Days 14–18):S22 ─┤         S23 ─┤
                     deploy│         social│
                           ▼              ▼
                     ┌──── MERGE ────┐ ← PRODUCTION LAUNCH
                     │               │
Round 8 (Week 4+):   S24–S28 as triggered by client demand
```

**Critical path:** S1 → S4 → S9 → S12 → S14 → S22
**Maximum parallelism:** 4 sessions per round
**First sellable product:** After Round 4 merge (~Day 7)
**Production launch:** After Round 7 merge (~Day 18)

---

## 6. Costs

### Per-Audit API Cost

| Component | Cost | Notes |
|-----------|------|-------|
| Firecrawl (20 pages) | ~$0.32 | Hobby tier at $16/mo covers ~50 audits |
| OpenAI web_search (20 prompts) | ~$0.25 | Responses API with built-in search |
| Perplexity Sonar (20 prompts) | ~$0.01 | Citation tokens free (2025+ pricing change — if reverted, worst case adds ~$0.05/audit) |
| Gemini with Grounding (20 prompts) | $0.00 | Free within 500–1500 RPD tier |
| Claude Haiku analysis/parsing | ~$0.03 | ~$0.25/MTok input |
| PageSpeed Insights | $0.00 | Free, no key needed at low volume. Add API key at 50+ clients/weekly monitoring to avoid rate limits. |
| Google Places (1 lookup) | ~$0.02 | $200/mo free credit covers it |
| Puppeteer PDF | $0.00 | Self-hosted |
| Resend email | $0.00 | 3K/mo free tier |
| **Total per audit** | **~$0.63** | |

**Revenue per audit:** $750 (standard) / $1,500 (multi-location)
**Gross margin:** 99.9%

### Monthly Operating Costs (at 10 Clients)

| Category | Tool(s) | Monthly Cost |
|----------|---------|-------------|
| AI Engine Monitoring | OpenAI + Perplexity + Gemini | ~$20–40 |
| AI Analysis/Parsing | Claude Haiku (Anthropic) | ~$5–10 |
| Site Crawling | Firecrawl Hobby | $16 |
| GBP Data | Google Places API | ~$0–10 |
| PageSpeed | Google PageSpeed Insights | $0 |
| SERP Tracking | Serper.dev | $0–50 (free tier → paid) |
| SEO Data | DataForSEO | ~$5–15 |
| Social Monitoring | Xpoz free tier | $0 |
| Email | Resend free tier | $0 |
| Client Management | Notion | $0–12 |
| Hosting | Hetzner CPX21 + Coolify | ~$13 |
| **Total** | | **~$110–165/mo** |

**Revenue at 10 clients** (conservative: 5 audits + 5 retainers): $3,750 + $7,500 = **$11,250/mo**
**Operating margin:** ~98.5%

### Build-Time Tooling Costs

| Tool | Cost |
|------|------|
| All MCP servers (Context7, Drizzle, Firecrawl, Serena, etc.) | $0 |
| cc-sdd, mcp-to-ai-sdk, PreCompact Hook | $0 |
| Playwright MCP, SEO Inspector MCP, Dependency-MCP | $0 |
| **Total** | **$0/mo** |

### Cost at Scale

| Scale | Monthly API | Monthly Revenue (est.) | Margin |
|-------|------------|----------------------|--------|
| 5 clients | ~$60–90 | ~$5,000+ | ~98% |
| 10 clients | ~$110–165 | ~$11,000+ | ~98.5% |
| 25 clients | ~$250–400 | ~$28,000+ | ~98.5% |
| 50 clients | ~$500–800 | ~$56,000+ | ~98.5% |

At 50+ audits/month: evaluate self-hosting Crawl4AI on Hetzner to replace Firecrawl ($16/mo → $0/mo).

**Deployment risk note:** Hetzner CPX21 (2 vCPU / 4GB RAM) runs Next.js + Postgres + Inngest + Puppeteer. This is tight — Puppeteer alone can spike to 500MB+ per PDF render. Mitigations: (1) run Puppeteer with `--single-process` and limit concurrent renders to 1, (2) monitor memory via Coolify dashboard, (3) upgrade to CPX31 (3 vCPU / 8GB, ~$16/mo) if renders cause OOM kills. Not a launch blocker, but watch it after 5+ concurrent audits.

---

## 7. Conflict Log

Every place the two documents disagreed, even subtly. Nothing silently merged.

### C1: Build Timeline — Days vs Weeks

| | Integration Doc | Synthesis Doc | Master Plan Choice |
|-|----------------|--------------|-------------------|
| **Timeline** | 7 rounds in ~12 days | 4 phases across 12 weeks | **Integration doc wins.** |

**Rationale:** The integration doc's session-based approach reflects the reality of building with Claude Code — each session is a focused, parallelizable unit of work. The synthesis doc's 12-week timeline is calibrated for human-written code sprints. With 3–4 parallel Claude Code sessions per round, wall-clock time is days, not weeks.

### C2: Inngest Pipeline Phasing

| | Integration Doc | Synthesis Doc | Master Plan Choice |
|-|----------------|--------------|-------------------|
| **When** | Round 4 (Days 5–6) | Phase 4 (Weeks 9–12) | **Integration doc wins.** |

**Rationale:** You cannot sell audits without a pipeline to orchestrate them. The synthesis doc treats Inngest as a "scale" feature; the integration doc correctly identifies it as the backbone that connects crawling to delivery. The audit pipeline IS the product.

### C3: Admin Dashboard Phasing

| | Integration Doc | Synthesis Doc | Master Plan Choice |
|-|----------------|--------------|-------------------|
| **When** | Round 5 (Days 6–9) | Phase 4 (Weeks 9–12) | **Integration doc wins.** |

**Rationale:** The operator needs to manage clients from day one of selling audits. Without the dashboard, the operator is querying Postgres directly. The dashboard is not a luxury — it's operational infrastructure.

### C4: Stripe Integration Phasing

| | Integration Doc | Synthesis Doc | Master Plan Choice |
|-|----------------|--------------|-------------------|
| **When** | Round 5 (Days 6–9) | Phase 4 (Weeks 9–12) | **Integration doc wins.** |

**Rationale:** Can't accept payment without Stripe. Payment is part of the sales flow, not a scale optimization.

### C5: Public Website Phasing

| | Integration Doc | Synthesis Doc | Master Plan Choice |
|-|----------------|--------------|-------------------|
| **When** | Round 5 (Days 6–9) | Phase 4 (Weeks 9–12) | **Integration doc wins.** |

**Rationale:** The website hosts the audit form and mini-audit lead magnet. It's part of the sales funnel, not a post-launch nicety. However, the *marketing pages* (case studies, blog, etc.) can be populated later — the scaffold + audit form is what matters.

### C6: Per-Audit Cost Estimate

| | Integration Doc | Synthesis Doc | Master Plan Choice |
|-|----------------|--------------|-------------------|
| **Cost** | ~$0.63/audit | ~$2–5/audit (in NS-7 description) | **Integration doc wins.** |

**Rationale:** The integration doc itemizes every API call with current pricing. The synthesis doc's $2–5 range was an early estimate that predates the detailed cost breakdown. $0.63 is the audited number.

### C7: SERP Data Provider (Three-Way Disagreement)

| | Integration Doc | Synthesis Doc | Underlying Research (Files 1–7) | Master Plan Choice |
|-|----------------|--------------|-------------------------------|-------------------|
| **Choice** | Serper.dev (50K queries/$50). SerpAPI in Skip list. | OpenAI web_search as primary + DataForSEO as secondary. No Serper. No SerpAPI. | Files 1,2 recommend SerpAPI. Files 4,5 recommend DataForSEO. CLAUDE.md suggests OpenAI may suffice. | **Serper + DataForSEO. No SerpAPI.** |

**Rationale:** This is a three-way disagreement across all documents. The Synthesis doc says "no Serper" and uses OpenAI web_search as primary SERP source. The Integration doc says "Serper replaces SerpAPI" and skips SerpAPI entirely. The underlying research files split between SerpAPI and DataForSEO. Resolution: OpenAI web_search handles "what does the AI say" (already in the pipeline via A1). Serper.dev handles traditional SERP position tracking at best unit economics (10× more queries/dollar vs SerpAPI). DataForSEO handles specialized endpoints (AI Overview, backlinks, keyword data). Three tools, three jobs. SerpAPI is redundant.

### C8: Dev Infrastructure Tooling

| | Integration Doc | Synthesis Doc | Master Plan Choice |
|-|----------------|--------------|-------------------|
| **Covered** | Context7, cc-sdd, Initializer Pattern, PreCompact Hook, Serena, Task Master, Dependency-MCP, Playwright MCP — all explicitly placed in tiers and rounds | Not mentioned at all | **Integration doc wins.** |

**Rationale:** The synthesis doc focuses on product features and ignores build-time tooling entirely. The integration doc correctly identifies that dev infrastructure (live docs, session continuity, spec-driven development) is a force multiplier for every subsequent session.

### C9: Implementation Engine Phasing

| | Integration Doc | Synthesis Doc | Master Plan Choice |
|-|----------------|--------------|-------------------|
| **When** | Round 6 (Days 9–12) as "Core IP Features" | Phase 3 (Weeks 5–8) as "Moat" | **Synthesis doc's priority, integration doc's timeline → Round 6 (Days 10–14).** |

**Rationale:** Both agree this is critical. The synthesis doc correctly prioritizes it as a moat feature (not scale). The integration doc correctly sequences it after the core pipeline works. The master plan places it in Round 6 — after the pipeline is sellable but before production launch. This means the first paid audit can be delivered without fix files, but the sprint proposal (where the real money is) requires Round 6.

### C10: Verify Loop Phasing

| | Integration Doc | Synthesis Doc | Master Plan Choice |
|-|----------------|--------------|-------------------|
| **When** | Not explicitly scheduled as a session | Phase 3 (Weeks 5–8) | **Added as S20 in Round 6.** |

**Rationale:** The integration doc's appendix mentions it as core IP but doesn't give it a dedicated session. The synthesis doc correctly identifies it as the key differentiator (NS-2). The master plan gives it its own session (S20) in Round 6, parallel to the implementation engine it depends on.

### C11: Feature Ranking System

| | Integration Doc | Synthesis Doc | Master Plan Choice |
|-|----------------|--------------|-------------------|
| **Approach** | Organized by integration tier (Tier 1/2/3) and build round | Organized by revenue displacement ranking (1–18) with explicit formula | **Merged: Three tiers (A/B/C) that combine revenue ranking with integration dependencies.** |

**Rationale:** The synthesis doc's ranking formula is more rigorous for prioritization. The integration doc's tier system is more useful for understanding dependencies. The master plan uses both — features are ranked by value but annotated with their integration requirements.

### C12: Notion's Role

| | Integration Doc | Synthesis Doc | Master Plan Choice |
|-|----------------|--------------|-------------------|
| **Position** | Explicitly: "Postgres is source of truth. Notion is a view layer." Detailed architecture note. | Implicit: doesn't discuss Notion architecture | **Integration doc wins.** |

**Rationale:** The integration doc's architecture note is critical. Without it, developers might accidentally make Notion a data dependency, which would create fragility. Rule is clear: all writes to Postgres, one-way sync to Notion.

### C13: Auth Requirements

| | Integration Doc | Synthesis Doc | Master Plan Choice |
|-|----------------|--------------|-------------------|
| **Detail** | Explicit: "Auth must exist before `/admin/*` deploys." Specifies bcrypt + cookie, single operator, middleware. | Not mentioned | **Integration doc wins.** |

**Rationale:** Auth is a security requirement, not a feature. The integration doc correctly identifies it as a hard dependency of the admin dashboard. Deploying admin routes without auth on a public server is a vulnerability.

### C14: Scheduled Monitoring Phasing

| | Integration Doc | Synthesis Doc | Master Plan Choice |
|-|----------------|--------------|-------------------|
| **When** | Round 5 S17 (alongside web app) via n8n cron | Phase 4 (Weeks 9–12) as first item | **Split: n8n cron setup in Round 5 (S17). Full monitoring automation in Round 8.** |

**Rationale:** Setting up the n8n cron trigger is trivial and belongs alongside Notion sync (both are operational plumbing). But the full monitoring workflow (score history, delta detection, alerting) belongs in Round 8, triggered by the first retainer client — because there's no one to monitor until then.

### C15: Social Monitoring Priority

| | Integration Doc | Synthesis Doc | Master Plan Choice |
|-|----------------|--------------|-------------------|
| **When** | Round 6 S19 (Xpoz, Apify, SEO Inspector) | Not ranked in Clone List (social monitoring is in Skip List as "Social Proof Monitor") | **Integration doc wins, but demoted to Round 7.** |

**Rationale:** The synthesis doc skips "Social Proof Monitor (Mention.com clone)" — correctly. But Xpoz for social brand signals and Apify for competitor reviews are not the same as a Mention.com clone. They enrich the AI Visibility and GBP pillars respectively. However, they're not blocking for launch. Moved to Round 7 post-deploy polish.

### C16: LLM for Parsing — GPT-4o-mini vs Claude Haiku

| | Integration Doc | Synthesis Doc | Master Plan Choice |
|-|----------------|--------------|-------------------|
| **Choice** | Not discussed (assumes AI SDK) | Explicitly resolves: "Claude Haiku for all. No GPT-4o-mini." (Files 2,3,6 recommended GPT-4o-mini) | **Synthesis doc wins. Claude Haiku for all structured analysis.** |

**Rationale:** CLAUDE.md mandates Claude structured outputs with Zod schemas. Using two models for parsing creates inconsistency and doubles provider configuration. Haiku is comparably priced (~$0.25/MTok input) and natively supports structured outputs via AI SDK. One model, one pattern.

### C17: Phase Ordering — Crawl-First vs Market-Intelligence-First

| | Integration Doc | Synthesis Doc | Master Plan Choice |
|-|----------------|--------------|-------------------|
| **Priority** | Round 1 has Firecrawl (S3) and config (S1) in parallel. AI engines in Round 2 (S4). | Explicitly resolves: "Both in Phase 1, but AI visibility is the higher-priority primitive." (Files 5,7 said crawl-first; File 4 said market-intel-first) | **Both in Round 1–2. AI visibility is the higher-priority demo, crawl is the infrastructure dependency.** |

**Rationale:** The Synthesis doc is right that "showing the client they're invisible" is the highest-leverage sales move. But Firecrawl is the infrastructure dependency (schema, content, technical pillars all need it). Both ship in the first two rounds. If you had to demo one thing after Round 1, it would be the site crawl (it's complete). If you had to demo one thing after Round 2, it would be the AI visibility check (it's the sale).

### C18: Citation Data Source — SerpApi vs DataForSEO vs Apify

| | Integration Doc | Synthesis Doc | Master Plan Choice |
|-|----------------|--------------|-------------------|
| **Choice** | Apify Google Maps Scraper (Tier 2) + DataForSEO | Explicitly resolves: "Google Places API (canonical NAP) + DataForSEO (directory search). Apify adds a scraping dependency we don't need." | **Synthesis doc wins. Google Places + DataForSEO. Apify deferred to Round 7 for competitor review scraping only.** |

**Rationale:** Google Places API is the authoritative source for canonical NAP. DataForSEO's organic search endpoint finds the business across directories at $0.01/query. Apify remains in Tier 2 (Round 7, S23) for bulk competitor review data, but not for citation/NAP checking.

### C19: Crawling Fallback — Firecrawl vs Crawl4AI vs Browserbase

| | Integration Doc | Synthesis Doc | Master Plan Choice |
|-|----------------|--------------|-------------------|
| **Choice** | Both in Tier 3. Crawl4AI for cost-driven fallback. Browserbase for capability-driven fallback (JS-heavy sites). | Firecrawl primary. Crawl4AI "only if pricing becomes prohibitive at scale." Browserbase not mentioned. | **Integration doc wins. Both in Tier 3 with distinct triggers.** |

**Rationale:** Neither is needed at launch. Crawl4AI is the self-host escape hatch if Firecrawl costs spike past 50 audits/month. Browserbase is the capability escape hatch if specific client sites defeat Firecrawl's rendering. Different problems, different solutions. Both are Tier 3.

### C20: Report Generation — React-PDF vs HTML+Puppeteer

No conflict. All sources + CLAUDE.md unanimously agree: HTML + Puppeteer. React-PDF is explicitly called "the #1 time-waster risk." Logged here for completeness since the Synthesis doc formally resolves it.

### C21: Round Structure — 7 Rounds vs 8 Rounds

| | Integration Doc | Synthesis Doc | Master Plan Choice |
|-|----------------|--------------|-------------------|
| **Structure** | 7 rounds. Round 6 = Competitive Intel (S18) + Social (S19) + Core IP (S20) + Deploy (S21). | 4 phases. Phase 3 = Moat features (NS-1 through NS-4). Phase 4 = Scale. | **8 rounds. Moat features get their own round (6) before deployment (7).** |

**Rationale:** The Integration doc bundles deployment with competitive intelligence and core IP features in one round. The Synthesis doc correctly identifies the moat features (Implementation Engine, Verify Loop, Vertical Intelligence) as a distinct priority tier. The Master Plan inserts them as Round 6 — after the pipeline is sellable (Round 4) but before production deployment (Round 7). This means: the first paid audit can ship without fix files, but the sprint proposal (where the real money is) requires Round 6 to be complete. Deployment moves to Round 7 because shipping to production before the moat features exist means competing on audit-only value — the weakest position.

---

## Appendix A: Integration Tier Reference

### Tier 1 — Wire Before Building

| # | Tool | Connection | Used By |
|---|------|-----------|---------|
| 1 | Context7 | MCP: `npx -y @anthropic-ai/context7-mcp@latest` | Every dev session |
| 2 | Drizzle MCP | MCP: `npx -y drizzle-mcp` | Schema development |
| 3 | Firecrawl | MCP (dev) / API SDK (prod) | A3, A7, B1, B2, B3, B5, C5, C8 |
| 4 | Vercel AI SDK v6 | npm: `ai`, `@ai-sdk/*` | Every LLM interaction |
| 5 | OpenAI Responses API | Via AI SDK | A1, A2 |
| 6 | Perplexity Sonar | Via AI SDK | A1, A2 |
| 7 | Google Gemini | Via AI SDK | A1, A2 |
| 8 | PageSpeed Insights | REST fetch (no key) | A7, A4 (technical pillar) |
| 9 | Inngest | npm: `inngest` | S12 pipeline |
| 10 | Puppeteer | npm: `puppeteer` | A5, A6, C3 |
| 11 | cc-sdd | `npx cc-sdd@latest --claude --lang en` | Every dev session |
| 12 | Initializer Pattern | `claude-progress.md` + PreCompact hook | Session continuity |

### Tier 2 — Integrate During Build

| # | Tool | Connection | Used By |
|---|------|-----------|---------|
| 1 | Serper.dev | REST API | S19 competitive intel |
| 2 | DataForSEO | REST API | S19, C7 citation checker |
| 3 | Xpoz | MCP | S23 social monitoring |
| 4 | Google Places API | REST API | S8 GBP scoring, B4, C7 |
| 5 | Notion MCP | MCP (dev) / API (prod) | S17 client sync |
| 6 | Stripe | MCP (dev) / API (prod) | S15 payments |
| 7 | Resend + React Email | npm | S13 email delivery |
| 8 | SEO Inspector | MCP | S23 schema validation |
| 9 | Claude Task Master | MCP (deferred loading) | Complex feature planning |
| 10 | Serena | MCP | Codebase >30 files |
| 11 | Apify (selective Actors) | MCP | S23 reviews/directories |
| 12 | Playwright MCP | MCP | E2E testing |
| 13 | mcp-to-ai-sdk | CLI | S22 production safety |
| 14 | Dependency-MCP | MCP | Cross-package development |

### Tier 3 — Post-Launch / Nice-to-Have

| Tool | Trigger |
|------|---------|
| mcp-memory-service | Project outgrows MEMORY.md |
| Probe / Code-Index-MCP | Grep becomes insufficient |
| Browserbase | Firecrawl fails on JS-heavy sites |
| Crawl4AI | Firecrawl costs spike past 50 audits/mo |
| BrightLocal | 5+ retainer clients |
| Composio / Pipedream | 7+ integrations to manage |
| Otterly.AI Lite ($29/mo) | After 3 audits — cross-validate accuracy |
| Sentry MCP | Production error monitoring needed |
| Sitemap MCP | Automated sitemap analysis |
| Superpowers Skills (obra) | When implementation quality or debugging discipline needs improvement |
| Google Workspace MCP | When multiple clients need regular email updates from a shared workflow |
| Google Analytics MCP | When clients want traffic data in audit reports (requires their GA access) |
| Google Search Console MCP | When offering "verified audits" where clients grant Search Console access |
| Peec.ai API (EUR 89/mo) | Use as validation layer during launch, not as primary data source |
| n8n Community MCP | Already using n8n — MCP adds agent-driven workflow creation |
| Probe (probelabs) | Zero-setup semantic code search. When grep becomes insufficient but before Code-Index-MCP |

## Appendix B: Environment Configuration

### `.claude/settings.json` — Round 1 Starting Config

This is the initial set for S1. Additional MCP servers (Stripe, Playwright, SEO Inspector, Serena, Xpoz, Apify, Task Master, Dependency-MCP) are added in later rounds as their features are built. See Appendix A for the full tier list.

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/context7-mcp@latest"]
    },
    "drizzle": {
      "command": "npx",
      "args": ["-y", "drizzle-mcp"]
    },
    "firecrawl": {
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": { "FIRECRAWL_API_KEY": "${FIRECRAWL_API_KEY}" }
    },
    "stripe": {
      "command": "npx",
      "args": ["-y", "@stripe/agent-toolkit"],
      "env": { "STRIPE_SECRET_KEY": "${STRIPE_SECRET_KEY}" }
    },
    "notion": {
      "command": "npx",
      "args": ["-y", "@notionhq/notion-mcp-server"],
      "env": { "NOTION_API_KEY": "${NOTION_API_KEY}" }
    }
  }
}
```

### `.env.example`

```bash
# AI Engine Monitoring (Tier 1)
OPENAI_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
PERPLEXITY_API_KEY=
ANTHROPIC_API_KEY=          # Claude Haiku for analysis

# Crawling (Tier 1)
FIRECRAWL_API_KEY=

# SERP & SEO (Tier 2)
SERPER_API_KEY=
DATAFORSEO_LOGIN=
DATAFORSEO_PASSWORD=

# Google APIs (Tier 2)
GOOGLE_PLACES_API_KEY=

# Social (Tier 2)
XPOZ_API_KEY=               # Free tier

# CRM & Payments (Tier 2)
NOTION_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email (Tier 2)
RESEND_API_KEY=

# Database
DATABASE_URL=               # PostgreSQL connection string

# Admin Auth
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=        # bcrypt hash
SESSION_SECRET=

# Infrastructure
INNGEST_SIGNING_KEY=
INNGEST_EVENT_KEY=
```

## Appendix C: Feature → Source Traceability

Every feature from both source documents is accounted for.

| Feature | Source | Disposition in Master Plan |
|---------|--------|---------------------------|
| AI Visibility Monitor | Synthesis Rank 1, Integration Tier 1 | A1 |
| Share of Voice | Synthesis Rank 2 | A2 |
| Schema Gap Detector | Synthesis Rank 3 | A3 |
| 5-Pillar Scoring | Integration Core IP, Synthesis Phase 2e | A4 |
| 9-Page Audit PDF | Synthesis Rank 5, Integration S10 | A5 |
| Mini-Audit PDF | Synthesis Rank 13, Integration S10 | A6 |
| Technical GEO Audit | Synthesis Rank 12, Integration S6 | A7 |
| JSON-LD Generator | Synthesis Rank 6, Integration S20 | B1 |
| llms.txt Generator | Synthesis Rank 4 | B2 |
| Content Auditor | Synthesis Rank 7, Integration S5 | B3 |
| Review Sentiment | Synthesis Rank 9, Integration S8 | B4 |
| "Why You Lost" | Synthesis Rank 8 | B5 |
| FAQ Generator | Synthesis Rank 10 | B6 |
| Verify Loop | Synthesis NS-2 | B7 |
| Narrative Reports | Synthesis NS-4 | B8 |
| Vertical Prompts | Synthesis NS-3, Integration S20 | B9 |
| Scheduled Monitoring | Synthesis Phase 4a, Integration S17 | C1 |
| Score Delta Alerts | Synthesis Phase 4b, NS-5 | C2 |
| Monthly Trend Report | Synthesis Phase 4c, Integration S22 | C3 |
| Admin Dashboard | Synthesis Rank 18, Integration S16 | C4 |
| Content Optimizer | Synthesis Rank 15 | C5 |
| Local AI Grid | Synthesis Rank 11 | C6 |
| Citation Checker | Synthesis Rank 14 | C7 |
| Agentic Commerce | Synthesis NS-6, Phase 4h | C8 |
| AI Crawler Analytics | Integration Appendix #6 | C9 |
| Keyword→Question | Synthesis Rank 17 | Other (build when needed) |
| Indexing Check | Synthesis Rank 16 | Other (build when needed) |
| Cross-provider Citation Tracker | Integration Appendix #1 | Core IP (built in S9) |
| AI Accuracy Scorer | Integration Appendix #2 | Core IP (built in S21) |
| GEO Score History | Integration Appendix #3 | Core IP (built in S20) |
| Prompt Normalization | Integration Appendix #7 | Core IP (built in S21) |
| Usage-Based Economics | Synthesis NS-7 | Section 1 — elevated to thesis |
| Schema Gap Recommender | Integration Appendix #5 | Subsumed into A3 (detection) + B1 (generation) |
| Sentiment Analysis | Synthesis traceability, Files 2,3,6 | Subsumed into A1 — it's a field on the visibility result, not a separate feature |
| Competitor Comparison | Synthesis traceability, Files 1,2,3,6,7 | Subsumed into A2 (Share of Voice) + B5 ("Why You Lost") |
| Site Health Check | Synthesis traceability, Files 4,7 | Subsumed into A7 (Technical GEO Audit) |
| Agentic Commerce Check | Synthesis traceability, Files 2,7 | Subsumed into C8 (Agentic Commerce Readiness) |

---

*This is the last synthesis. Building starts now.*
