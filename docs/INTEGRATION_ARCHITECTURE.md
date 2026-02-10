# Pare Engine — Integration Architecture

> Synthesized from findings-1 through findings-7. Deduplicated, conflicts reconciled, one coherent plan.

---

## 1. MCP Integration Tier List

### Tier 1 — Wire In Before Building

These are foundational. Other features, development workflows, or scoring pillars depend on them being configured first.

| # | Tool | What It Does | Dashboard Feature / Workflow It Powers | Connection Method |
|---|------|-------------|---------------------------------------|-------------------|
| 1 | **Context7** | Fetches live, version-specific library docs (AI SDK v6, Drizzle, Next.js 15, Inngest) and injects into context. Eliminates hallucinated API calls. 45K stars, Upstash-backed. | **Build-time: every session.** Prevents the #1 LLM coding failure mode — stale API signatures. | MCP server config: `npx -y @anthropic-ai/context7-mcp@latest` |
| 2 | **Drizzle MCP** | Query actual DB schema, run migrations, execute queries. Auto-detects `.env`. | **Build-time: schema development.** Agent-driven schema iteration against real Postgres. Also powers admin dashboard data queries at runtime. | MCP server config: `npx -y drizzle-mcp` |
| 3 | **Firecrawl MCP** | URL discovery (`map`), page crawling (`crawl`), markdown + HTML output. V3 live. | **Product: Audit Pipeline Step 1 (CRAWL).** Feeds every downstream scoring pillar. Also used during dev to test crawling against real sites. | MCP for dev: `npx -y firecrawl-mcp` with `FIRECRAWL_API_KEY`. API SDK wrapper for production pipeline. $16/mo Hobby tier. |
| 4 | **Vercel AI SDK v6** | Unified provider interface for OpenAI, Perplexity, Gemini, Anthropic. `generateText()`, `generateObject()`, native MCP client, agents, DevTools. | **Product: Audit Pipeline Step 2 (QUERY) + Step 3 (ANALYZE).** Every LLM interaction in the system. | npm: `ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`. Not an MCP — it's the SDK that consumes MCPs. |
| 5 | **OpenAI Responses API** (web_search) | Grounded answers with live web search. Inline citations. Highest user traffic among AI engines. | **Product: AI Visibility pillar (30 pts).** Primary monitoring target. ~$0.10-0.25 per 20-query audit. | Via AI SDK: `@ai-sdk/openai`. API key env var. |
| 6 | **Perplexity Sonar API** | Native citations in metadata. Citation tokens are FREE (2025+ change). Search-first platform. | **Product: AI Visibility pillar (30 pts).** Most important for citation tracking — explicit source URLs. ~$0.01-0.05 per audit. | Via AI SDK: `@ai-sdk/perplexity` or direct REST. API key env var. |
| 7 | **Google Gemini API** (grounding) | `groundingMetadata` with search queries + sources. Approximates Google AI Overviews. | **Product: AI Visibility pillar (30 pts).** The #1 AI surface for local businesses (Google users). Free within 500-1500 RPD tier. | Via AI SDK: `@ai-sdk/google`. API key env var. |
| 8 | **Google PageSpeed Insights API** | Lighthouse scores (performance, accessibility, SEO) + Core Web Vitals from real Chrome UX data. | **Product: Technical Readiness pillar (10 pts).** Direct scoring feed. Zero cost, zero reason to defer. | Direct REST fetch — no API key needed for basic use. Single `fetch()` call per URL. |
| 9 | **Inngest** | Durable background job orchestration. Each audit pipeline step is an independently retriable Inngest step. | **Product: Audit Pipeline orchestrator.** Connects CRAWL → QUERY → ANALYZE → SCORE → REPORT. Self-hosted on Postgres. | npm: `inngest`. Dev server or self-hosted on Hetzner. MCP dev server available for development. |
| 10 | **Puppeteer** | HTML/CSS → PDF via `page.pdf()`. Headless Chrome. | **Product: Audit Pipeline Step 5 (REPORT).** Generates branded 9-page PDF reports. NOT React-PDF. | npm: `puppeteer`. Self-hosted. No MCP needed for production; Playwright MCP available for dev/testing. |
| 11 | **cc-sdd** (or GitHub Spec Kit) | Spec-driven development commands: steering, requirements (EARS notation), design, task decomposition with dependency tracking. | **Build-time: every session.** Formalizes the spec → plan → tasks → implement workflow. Replaces ad-hoc spec reading. | Install: `npx cc-sdd@latest --claude --lang en`. OR use GitHub Spec Kit (`github/spec-kit`). Pick one. |
| 12 | **Anthropic Initializer Pattern** + **Precompact Hook** | `claude-progress.md` as session state machine + hook that fires before context compaction to capture state. | **Build-time: session continuity.** Zero-dependency. Prevents context loss across sessions and compaction events. | Create `claude-progress.md`, reference in CLAUDE.md. Add PreCompact hook (~50 lines shell script). |

**Reconciliation notes:**
- *Findings-4 recommended Neon MCP as #1 priority.* Rejected — Pare is committed to Drizzle + self-hosted Postgres on Hetzner. Neon's branching is nice but adds an unnecessary dependency.
- *Findings-4 recommended Trigger.dev over Inngest.* Rejected — CLAUDE.md mandates Inngest. Trigger.dev is a valid tool but switching creates churn with no benefit.
- *Findings-1 recommended Knowledge Graph Memory MCP; Findings-3 recommended claude-sessions.* Reconciled — use the Initializer Pattern (free, zero-dependency) as the foundation. Neither KG Memory nor claude-sessions is mandatory at Tier 1. Upgrade to semantic memory later.

---

### Tier 2 — Integrate During Build (Feature-Level)

These plug into specific dashboard modules or scoring pillars. Wire them in when you build that feature.

| # | Tool | What It Does | Dashboard Feature It Powers | Connection Method | Trigger |
|---|------|-------------|---------------------------|-------------------|---------|
| 1 | **Serper.dev** | Google SERP as JSON: organic results, AI overviews, local pack, PAA. Official MCP server. | **AI Visibility + Technical Readiness pillars.** SERP position tracking, local pack detection. Also validates whether AI engines cite traditional search results. | REST API. Free 2,500 queries, then $50/mo for 50K. Community MCP available. | When building SERP analysis module |
| 2 | **DataForSEO** | 15+ APIs: SERP, keywords, backlinks, on-page, AI Summary. Pay-as-you-go ($0.0006/req). MCP server available. | **Competitive analysis module.** Replaces Ahrefs ($1499/mo) and SEMrush ($450/mo) at 5% of cost. AI Summary endpoint directly useful for GEO. | REST API wrappers as typed tool functions. MCP for dev: `dataforseo/mcp-server-typescript`. $50 min deposit, no subscription. | When building competitive intelligence |
| 3 | **Xpoz MCP** | Multi-platform social data: X, Reddit, Instagram, TikTok. Sentiment analysis, influence scoring, bot detection. | **Social signals for AI Visibility pillar.** Extends monitoring beyond AI engines into social discourse. Free 100K results/mo covers 10+ clients. | Drop-in MCP. Add to `.claude/settings.json`. Free tier. | When building social monitoring |
| 4 | **Google Places API (New)** | GBP data: name, address, phone, website, reviews, ratings, hours, photos. | **Local/GBP pillar (15 pts).** Critical for GBP completeness scoring and review extraction. $200 free credit/mo covers it. | REST API. Requires Google Cloud project + API key. $17/1K requests after free credit. | When building GBP scoring |
| 5 | **Notion MCP** | Official hosted MCP with OAuth. CRUD on pages, databases, blocks. V2.0 with data sources abstraction. | **Operator dashboard: Client view layer.** Human-readable view of client data. Source of truth is Postgres `clients` table — Notion syncs from it, never the reverse. See Architecture Note below. | Official MCP: `npx -y @anthropic-ai/notion-mcp` with `NOTION_API_KEY`. | When onboarding first client |
| 6 | **Stripe MCP** | Official. Products, subscriptions, payments, invoices. `@stripe/agent-toolkit` supports AI SDK directly. | **Operator dashboard: Billing.** Dev: MCP for product/price setup. Prod: webhook API for payment confirmation. | MCP for dev: `npx -y @anthropic-ai/stripe-mcp` with `STRIPE_SECRET_KEY`. Prod: Stripe webhook API. | When setting up billing |
| 7 | **Resend + React Email 5.0** | Transactional email. 3K/mo free. React Email 5.0 adds Tailwind 4, dark mode. | **Product: Report delivery.** Sends branded audit PDFs to clients. Also handles audit receipt confirmations. | npm: `resend`, `@react-email/components`. MCP for dev: `npx -y resend-mcp`. | When building email delivery |
| 8 | **SEO Inspector MCP** | Validates Schema.org JSON-LD from live URLs. Reports missing types and properties. | **Schema/Structured Data pillar (15 pts).** Automates gap detection. Combine with custom JSON-LD parser. | MCP server. Free. | When building Schema scoring |
| 9 | **Claude Task Master** | AI-powered PRD-to-task decomposition. 36 MCP tools. Dependency tracking, "next unblocked task" queries. | **Build-time: task orchestration.** Feed it ARCHITECTURE.md + AUDIT_PIPELINE.md → get structured task graph with dependencies. | MCP with deferred loading (~21K tokens, save ~16% of context). | When breaking down complex features |
| 10 | **Serena** | LSP-powered symbol-level code navigation via MCP. `find_symbol`, `find_referencing_symbols`, `insert_after_symbol`. | **Build-time: code intelligence.** Eliminates grep-based discovery. "Find all callers of `scoreAIVisibility()`" → precise results. | MCP server config. Requires LSP for TypeScript (tsserver). | When codebase grows past ~30 files |
| 11 | **Apify MCP** (selective Actors) | Gateway to 10K+ scrapers. Google Maps, Reddit, Yelp, Twitter Actors. | **Product: Reviews, competitor data, directory scraping.** Google Maps Scraper for bulk competitor GBP data. Reddit Scraper for social signals. | MCP: `npx -y apify-mcp-server` with `APIFY_TOKEN`. $5 free, $49/mo paid. Use selective Actors, not the full platform. | When building review/directory analysis |
| 12 | **Playwright MCP** | Microsoft-maintained browser automation via accessibility tree. E2E testing. 24K stars. | **Build-time: E2E testing, PDF verification.** "Run the audit form flow and verify it works." Also useful for testing report template rendering. | MCP: `npx -y @anthropic-ai/playwright-mcp`. | When building E2E tests |
| 13 | **mcp-to-ai-sdk** | Vercel Labs. Generates static AI SDK tool stubs from MCP server definitions. "shadcn for MCP." | **Production safety.** Develop with MCP, vendor tool definitions for production. Prevents prompt injection from dynamic tool loading. | CLI: `npx mcp-to-ai-sdk`. Run before production deployment. | Before first production audit |
| 14 | **Dependency-MCP** | TypeScript dependency graphs, import/export analysis, architectural rule scoring. | **Build-time: architecture enforcement.** Validates monorepo boundaries (`packages/core` must not import from `apps/web`). | MCP server config. Answers "what breaks if I change this interface?" | When building across packages |

**Reconciliation notes:**
- *Findings-2 and Findings-5 both recommend SerpAPI.* Replaced with Serper.dev — cheaper ($0.30-1.00/1K vs $15/1K), more queries (50K vs 5K at similar price), covers the same use case.
- *Findings-4 recommends HubSpot MCP as #3 priority.* Rejected — CLAUDE.md mandates Notion for first 10 clients. HubSpot is enterprise overkill for a solo consultant.
- *Findings-5 recommends Supabase MCP for admin dashboard.* Rejected — Pare uses Drizzle + raw Postgres. Drizzle MCP covers this.
- *Multiple files treat Notion as the client data source of truth.* Corrected — Postgres `clients` table is the source of truth. Notion is a one-way sync target (view layer). See "Architecture Note: Client Data Ownership" above.
- *Multiple files mention dependency-cruiser (F1) vs Dependency-MCP (F3).* Reconciled — dependency-cruiser is a CLI tool for CI enforcement rules; Dependency-MCP is an MCP for interactive development. Use dependency-cruiser for CI, Dependency-MCP for dev-time queries. Both are Tier 2.

---

### Tier 3 — Post-Launch / Nice-to-Have

Valuable but not blocking. Can add without rearchitecting.

| Tool | What It Would Add | When to Evaluate |
|------|-------------------|-----------------|
| **mcp-memory-service** (doobidoo) | Semantic memory via ChromaDB. "What did I work on Tuesday?" → finds it. D3 dashboard. | When project outgrows MEMORY.md (~50+ files, ~10+ sessions) |
| **Probe** (probelabs) | Zero-setup semantic code search via ripgrep + tree-sitter. No indexing. | When grep becomes insufficient but before committing to Code-Index-MCP |
| **Code-Index-MCP** (ViperJuice) | 48-language tree-sitter indexing, hybrid search, sub-100ms queries. | When codebase exceeds ~100 files |
| **Browserbase MCP** | Cloud browser with stealth mode, proxy support. | If Firecrawl fails on specific JS-heavy client sites |
| **Crawl4AI** | Open-source self-hosted crawler. 58K stars. | If Firecrawl costs spike past 50+ audits/month — self-host on Hetzner for $0 |
| **BrightLocal** | Citation tracking, GBP audit, NAP consistency. | At 5+ retainer clients, when manual NAP checking becomes a bottleneck |
| **Composio** | 500+ managed integrations through a single MCP gateway. OAuth, rate limiting, retries. | At 7+ integrations, when managing auth/tokens becomes painful |
| **Pipedream MCP** | Gateway to 2,500+ APIs with built-in OAuth. | Same trigger as Composio — when integration management becomes a bottleneck |
| **Superpowers Skills** (obra) | 20+ skills: TDD enforcement, structured debugging, brainstorm/plan/execute. | When implementation quality or debugging discipline needs improvement |
| **Google Workspace MCP** | Gmail, Calendar, Drive, Docs, Sheets. 100+ tools. | When multiple clients need regular email updates from a shared workflow |
| **Google Analytics MCP** | GA4 reports, real-time metrics. | When clients want traffic data in audit reports (requires their GA access) |
| **Google Search Console MCP** | Real click/impression data. | When offering "verified audits" where clients grant Search Console access |
| **Otterly.AI Lite** | Third-party GEO visibility validation. | $29/mo. Use to validate your own audit accuracy against an independent source |
| **Sentry MCP** | Error triage from production. Stack traces, performance metrics. | When audit pipeline is in production and needs error monitoring |
| **Peec.ai API** | Multi-platform AI visibility tracking. 300+ prompts/day. | EUR 89/mo. Use as validation layer during launch, not as primary data source |
| **n8n Community MCP** | Cron triggers, webhook receiver. | Already using n8n for scheduling — MCP adds agent-driven workflow creation |
| **Sitemap MCP** | Fetch, parse, analyze sitemaps for SEO issues. | When you want automated sitemap analysis as part of Technical Readiness scoring |

---

### Skip — Low Leverage, Redundant, or Immature

| Tool | Reason to Skip | Recommended By |
|------|---------------|----------------|
| **Ahrefs API v3** | $1,499/mo minimum. DataForSEO covers 80% at 5% of cost. | F3 |
| **SEMrush API/MCP** | $130-450/mo. Overkill. DataForSEO + Serper cover the use case. | F3, F4, F5 |
| **Moz API** | $99+/mo. Domain Authority is a nice-to-have signal, not a scoring input. | F3 |
| **SerpAPI** | $75/mo for 5K searches. Serper gives 50K for $50. Redundant. | F2, F5 |
| **Supabase MCP** | Wrong stack. Pare uses Drizzle + raw Postgres. | F4, F5 |
| **Firebase MCP** | Wrong database architecture entirely. | F4, F5 |
| **Neon MCP** | Serverless Postgres branching — unnecessary when using self-hosted Postgres on Hetzner. | F4 |
| **E2B MCP** | Secure cloud sandboxes. Pare doesn't need remote code execution — audit pipeline runs on Hetzner. | F4 |
| **Trigger.dev MCP** | Inngest is mandated. Switching background job systems creates churn with no benefit. | F4 |
| **HubSpot MCP** | Enterprise CRM. Notion handles first 10 clients. Revisit only if client count demands it. | F4, F5 |
| **Salesforce MCP** | Enterprise. Not relevant until Pare is an agency with 50+ clients. | F4, F5 |
| **Brandwatch** | $800-15,000/mo. Enterprise social listening. Xpoz free tier covers the need. | F3 |
| **X API v2 direct** | $100-5,000/mo. Xpoz covers Twitter/X via its free tier. | F3 |
| **Bright Data MCP** | $500+/mo enterprise scraping. Firecrawl + Xpoz cover the use cases. | F1, F2 |
| **Goodie AI / AthenaHQ / Profound / Bluefish** | Competitors, not tools. Pare replicates their $300-500/mo offering for ~$100/mo in API costs plus consulting services they can't offer. | F1, F2, F3 |
| **Mem0 / OpenMemory** | Overkill for solo dev. Excellent for multi-tool memory sharing, but Pare only uses Claude Code. | F3, F4 |
| **Cognee MCP** | Full GraphRAG. 12K stars but heavy. Not needed until knowledge graph complexity warrants it. | F3 |
| **Continuous-Claude v3** | 32 agents, 109 capabilities. Study the PreCompact hook pattern, don't install the whole framework. | F1, F2, F3 |
| **Claude-Flow** | 60+ agent orchestration. Overkill. Claude Code's built-in Task tool + Agent Teams suffices. | F6/7 |
| **Sourcegraph MCP** | Enterprise SCIP search. Serena + Context7 covers the codebase intelligence need for a monorepo this size. | F4 |
| **Linear MCP** | Pare doesn't use Linear. If adopted later, this becomes useful. | F4, F5 |
| **Attio MCP** | Modern CRM alternative. Notion is mandated. | F4 |
| **PostHog MCP** | Product analytics. Premature — no client-facing product to track yet. | F4, F5 |
| **Mixpanel MCP** | Same as PostHog — premature. | F4, F5 |
| **PagerDuty MCP** | Incident management. Solo consultant doesn't need on-call rotation. | F4 |
| **Grafana MCP** | Metrics queries. Not needed until production monitoring dashboard exists. | F5 |
| **Kubernetes MCP** | Pare runs on Coolify, not K8s. | F5 |
| **Render MCP** | Pare deploys on Hetzner + Coolify, not Render. | F5 |
| **Vercel MCP** | Pare hosts on Hetzner + Coolify, not Vercel. | F4 |
| **Docker MCP Toolkit** | Useful but not high-leverage for Pare specifically. Local Docker Compose handles this. | F5 |
| **neo4j-mcp** | Graph DB for complex relationship data. Premature — JSONB in Postgres handles current needs. | F5 |
| **Pinecone MCP** | Vector search for "Chat with your Audit" feature. Deferred per CLAUDE.md. | F5 |
| **Vault MCP** | HashiCorp secrets management. Overkill — `.env` + Zod validation suffices for solo consultant. | F5 |

---

## 2. Dependency Map

### What Depends on What

```
FOUNDATION LAYER (configure first — everything else depends on these)
├── packages/core/src/config.ts (Zod env validation)
│   ├── Every API integration needs env vars validated here
│   └── Must exist before: Firecrawl, AI SDK, Stripe, Resend, DataForSEO, etc.
│
├── Drizzle MCP + PostgreSQL
│   ├── Schema must exist before: audit pipeline, scoring storage, client management
│   └── Must exist before: Inngest steps (they read/write DB)
│
├── Vercel AI SDK v6
│   ├── Provider packages (@ai-sdk/openai, @ai-sdk/google, @ai-sdk/anthropic)
│   ├── Must exist before: AI engine monitoring, LLM-based scoring, content analysis
│   └── mcp-to-ai-sdk depends on this for production vendoring
│
└── Context7 + cc-sdd (build-time only)
    └── Every development session benefits from these being configured

CRAWLING LAYER (depends on Foundation)
├── Firecrawl API/MCP
│   ├── Depends on: config.ts (API key)
│   ├── Feeds: Schema analysis, Content analysis, Technical checks
│   └── Must exist before: any scoring pillar that analyzes page content
│
└── Google PageSpeed Insights API
    ├── Depends on: nothing (free, no key needed)
    └── Feeds: Technical Readiness pillar directly

MONITORING LAYER (depends on Foundation)
├── OpenAI Responses API (web_search)
│   ├── Depends on: AI SDK v6, config.ts (API key)
│   └── Feeds: AI Visibility pillar (mention rate, citation, position, sentiment)
│
├── Perplexity Sonar API
│   ├── Depends on: AI SDK v6, config.ts (API key)
│   └── Feeds: AI Visibility pillar (citation tracking — best source for this)
│
└── Google Gemini API (grounding)
    ├── Depends on: AI SDK v6, config.ts (API key)
    └── Feeds: AI Visibility pillar (Google's AI view)

SCORING LAYER (depends on Crawling + Monitoring)
├── AI Visibility scoring (30 pts)
│   ├── Depends on: OpenAI + Perplexity + Gemini responses
│   ├── Optionally enriched by: Xpoz (social), Serper (SERP position)
│   └── Sentiment analysis requires: Claude Haiku via AI SDK generateObject()
│
├── Content Quality scoring (30 pts)
│   ├── Depends on: Firecrawl HTML/markdown output
│   └── Analysis requires: Claude Haiku via AI SDK generateObject()
│
├── Schema/Structured Data scoring (15 pts)
│   ├── Depends on: Firecrawl HTML output (for JSON-LD extraction)
│   └── Optionally validated by: SEO Inspector MCP
│
├── Technical Readiness scoring (10 pts)
│   ├── Depends on: Firecrawl (robots.txt, sitemap check), PageSpeed API
│   └── Optionally enriched by: Serper (SERP visibility)
│
└── Local/GBP scoring (15 pts)
    ├── Depends on: Google Places API (GBP data)
    ├── Optionally enriched by: Apify Google Maps Scraper (competitor data)
    └── NAP consistency: Firecrawl on top 5 directories

REPORT LAYER (depends on Scoring)
├── HTML/CSS templates
│   ├── Depends on: scoring output (all 5 pillars)
│   └── Uses: brand guidelines, inline SVG charts
│
└── Puppeteer PDF generation
    ├── Depends on: rendered HTML templates
    └── Feeds: email delivery

DELIVERY LAYER (depends on Report)
├── Resend + React Email
│   ├── Depends on: config.ts (API key), PDF buffer
│   └── Sends: branded email with PDF attachment
│
├── Stripe (payment)
│   ├── Depends on: config.ts (keys)
│   └── Triggers: audit pipeline upon payment confirmation
│
└── Notion (client management)
    ├── Depends on: config.ts (API key)
    └── Updated: after audit delivery with scores + status

PIPELINE ORCHESTRATION (wraps everything above)
└── Inngest
    ├── Depends on: all layers above as individual steps
    ├── Step 1: CRAWL (Firecrawl)
    ├── Step 2: QUERY (OpenAI + Perplexity + Gemini)
    ├── Step 3: ANALYZE (Claude Haiku + custom parsers)
    ├── Step 4: SCORE (all 5 pillar functions)
    ├── Step 5: REPORT (HTML → Puppeteer → PDF)
    └── Step 6: DELIVER (Resend email + Notion update)
```

### The Critical Path

The **minimum set of integrations that unlock a working audit**:

```
config.ts → Firecrawl → OpenAI API → Claude Haiku (AI SDK) → Scoring functions → HTML template → Puppeteer → PDF
```

That's 7 integrations for a minimum viable audit. Everything else enriches or extends.

**The minimum viable audit runs with:**
1. Firecrawl (crawl the site)
2. OpenAI web_search (query one AI engine)
3. Claude Haiku (analyze/parse responses)
4. Scoring functions (hardcode missing pillar data, score what you have)
5. Puppeteer (generate PDF)

**What unlocks the most functionality per integration:**
- Adding Perplexity = citation tracking (unique data no other provider gives)
- Adding Gemini = Google's AI perspective (most important for local businesses)
- Adding Google Places API = unlocks entire GBP pillar (15 pts)
- Adding PageSpeed Insights = unlocks Technical Readiness sub-scores (free)
- Adding Serper = SERP position context for AI Visibility interpretation

---

## 3. Architecture Recommendations

### How MCPs, Direct APIs, and Custom Code Coexist

The integration layer has three distinct modes. The rule is: **MCP for development, API wrappers for production, custom code for IP.**

```
┌──────────────────────────────────────────────────────────┐
│                    INTEGRATION LAYER                      │
│                                                          │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  MCP Servers     │  │  API Wrappers │  │  Custom IP  │  │
│  │  (Dev-time only) │  │  (Production) │  │  (Build it) │  │
│  │                  │  │              │  │             │  │
│  │  Drizzle MCP     │  │  Firecrawl   │  │  Scoring    │  │
│  │  Firecrawl MCP   │  │  OpenAI      │  │  algorithm  │  │
│  │  Stripe MCP      │  │  Perplexity  │  │             │  │
│  │  Notion MCP      │  │  Gemini      │  │  Citation   │  │
│  │  Resend MCP      │  │  PageSpeed   │  │  tracker    │  │
│  │  Playwright MCP  │  │  Places API  │  │             │  │
│  │  Context7        │  │  Serper      │  │  JSON-LD    │  │
│  │  Serena          │  │  DataForSEO  │  │  parser     │  │
│  │  SEO Inspector   │  │  Stripe API  │  │             │  │
│  │  Xpoz MCP       │  │  Resend API  │  │  Prompt     │  │
│  │  Task Master     │  │  Inngest SDK │  │  library    │  │
│  │                  │  │              │  │             │  │
│  │  ↓ Development   │  │  ↓ Vendored  │  │  ↓ Core IP  │  │
│  │    exploration    │  │    via       │  │    in       │  │
│  │    & testing      │  │  mcp-to-     │  │  packages/  │  │
│  │                  │  │  ai-sdk      │  │  core       │  │
│  └─────────────────┘  └──────────────┘  └────────────┘  │
└──────────────────────────────────────────────────────────┘
```

#### Mode 1: MCP Servers (Development Only)

Used during Claude Code sessions to interact with real services. **Never in production code paths.**

- Drizzle MCP → iterate on schema, test queries
- Firecrawl MCP → test crawling against real sites
- Stripe MCP → set up products, test webhooks
- Context7 → pull live library docs into context
- Serena → navigate codebase symbols

**Security rule:** Use `mcp-to-ai-sdk` before production. This vendores MCP tool definitions into static AI SDK stubs, eliminating prompt injection risk from dynamic tool loading.

#### Mode 2: API Wrappers (Production Pipeline)

Typed tool functions in `packages/core/src/tools/` or `apps/audit-runner/src/steps/`. Each function:
- Takes typed input → returns typed output
- Validates input/output with Zod schemas
- Handles errors with custom error classes
- Is wrappable as an Inngest step or MCP tool

```typescript
// Pattern: typed tool function
interface CrawlSiteInput { domain: string; maxPages: number; }
interface CrawlSiteOutput { pages: CrawledPage[]; errors: CrawlError[]; }

export async function crawlSite(input: CrawlSiteInput): Promise<CrawlSiteOutput> {
  // Uses Firecrawl SDK directly, not via MCP
}
```

#### Mode 3: Custom IP (Never Buy)

These are Pare's competitive moat. Build them, don't outsource:

1. **Scoring algorithm** — 5 pillar functions with correct weights (30/30/15/10/15)
2. **Cross-provider citation tracker** — normalize citations from OpenAI/Perplexity/Gemini into unified citation graph
3. **AI accuracy scorer** — compare AI responses against known-truth data (GBP, client facts)
4. **JSON-LD parser + schema gap recommender** — extract, validate, recommend missing schema types
5. **Vertical-specific prompt library** — GEO prompts per business vertical
6. **GEO score history** — time-series tracking in `monitoringResults` table
7. **Prompt normalization** — make same prompt comparable across engines

### Architecture Note: Client Data Ownership

**Postgres is the source of truth. Notion is a view layer.**

The CLAUDE.md says "Notion MCP for client management (first 10 clients). No custom CRM until needed." This is fine as a human interface, but the moment you want automated status updates (audit completed → client record updated), audit-triggered record creation, or score history per client, you're fighting Notion's data model. The `clients` table in Drizzle schema already exists with the right structure (domain, vertical, scores, engagement tracking).

**The rule:**
- All client data writes go to Postgres via Drizzle (the `clients` and `auditResults` tables)
- Notion is a read-only sync target — a human-friendly dashboard that mirrors Postgres
- A simple Inngest step or n8n workflow syncs client records Postgres → Notion after each audit
- Never read from Notion to make pipeline decisions. Query Postgres.

This means the Notion MCP is a Tier 2 convenience tool, not a Tier 1 data dependency. If Notion goes down or you outgrow it, nothing breaks — you just lose the pretty view until you build the admin dashboard.

### Architecture Note: Admin Authentication

**Auth must exist before `/admin/*` routes deploy.** Even for a single operator.

CLAUDE.md specifies: "Admin routes (`/admin/*`) — operator dashboard behind simple auth (session-based, single operator account)." This is not optional — deploying an admin panel without auth on a public server is a security hole.

**Implementation (minimal, per CLAUDE.md):**
- Session-based auth, not JWT (simpler for single-user)
- Single operator account: email + hashed password in env vars or a `operators` table with one row
- Middleware on all `/admin/*` routes checking session cookie
- Login page at `/admin/login`
- No OAuth, no magic links, no multi-tenant — just bcrypt + cookie

**Where in the build sequence:** Auth must be wired into Phase 3 before the admin scaffold (step 3.7) deploys. It's a dependency of the admin dashboard, not a separate phase.

### Conflicts Identified and Resolved

| Conflict | Files | Resolution |
|----------|-------|------------|
| **Neon vs self-hosted Postgres** | F4 says Neon #1; F1/F2/F3 ignore it | Self-hosted Postgres on Hetzner as per CLAUDE.md. Neon is a detour. |
| **Trigger.dev vs Inngest** | F4 recommends Trigger.dev | Inngest is mandated in CLAUDE.md and stack table. No switch. |
| **Supabase vs Drizzle** | F4/F5 recommend Supabase MCP | Drizzle MCP is the correct choice. Supabase adds an unnecessary abstraction layer. |
| **SerpAPI vs Serper** | F2/F5 recommend SerpAPI; F3 recommends Serper | Serper wins — 10x more queries per dollar, same data quality. |
| **HubSpot vs Notion for CRM** | F4/F5 recommend HubSpot | Notion is mandated for first 10 clients per CLAUDE.md. HubSpot is enterprise overhead. |
| **firebase-mcp** | F4/F5 mention it | Skip — wrong database architecture entirely. |
| **Memory: KG Memory vs claude-sessions vs mcp-memory-service** | F1 recommends KG; F3 recommends claude-sessions; F2 recommends mcp-memory-service | Layered approach: Initializer Pattern (day 1) → claude-sessions (week 1) → mcp-memory-service (when project outgrows flat files). |
| **SDD: cc-sdd vs GitHub Spec Kit** | F1/F3 recommend cc-sdd; F3/F6 recommend Spec Kit | Pick one. cc-sdd is Claude Code native and more mature for this use case. Spec Kit is the alternative if cc-sdd proves insufficient. |
| **Codebase intelligence: Serena vs Code-Index-MCP vs Claude Context** | F2 recommends Serena + Context7; F3 recommends Code-Index-MCP | Context7 (Tier 1) + Serena (Tier 2). Code-Index-MCP is Tier 3 (requires Voyage AI API costs, indexing setup). |
| **dependency-cruiser vs Dependency-MCP** | F1 recommends cruiser; F3 recommends MCP | Both. dependency-cruiser for CI rules, Dependency-MCP for interactive dev queries. |
| **Crawling fallback: Crawl4AI vs Browserbase** | F2/F3 recommend both | Crawl4AI for cost-driven fallback (self-host). Browserbase for capability-driven fallback (JS-heavy sites). Neither needed at launch. |

### Integration Configuration Summary

**`.claude/settings.json` — MCP servers for development:**

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

**`.env.example` — all API keys needed:**

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
ADMIN_EMAIL=                # Single operator login
ADMIN_PASSWORD_HASH=        # bcrypt hash of operator password
SESSION_SECRET=             # Random string for cookie signing

# Infrastructure
INNGEST_SIGNING_KEY=
INNGEST_EVENT_KEY=
```

---

## 4. Build Sequence

> Philosophy: Infrastructure evolves alongside building. No gated "Phase 0" — dev tooling and feature code start the same day. Each round is a set of concurrent Claude Code sessions, each on its own git worktree or branch.

### How to Read This Section

Each **round** is a set of sessions that run simultaneously. Sessions within a round have no dependencies on each other. A round completes when all its sessions merge. The next round starts from the merged state.

Sessions are labeled `S1`, `S2`, etc. Each session is one Claude Code instance with a defined scope, owned files, and exit criteria.

---

### Round 1: Foundation + First Feature Code (Day 1)

Infrastructure and feature work start in parallel. Don't wait.

| Session | Scope | Owned Files | Integrations Wired | Exit Criteria |
|---------|-------|-------------|-------------------|---------------|
| **S1: Config + Dev Infra** | `.env.example`, Zod config, MCP server config, hooks, seed MEMORY.md, cc-sdd install, Precompact hook | `packages/core/src/config.ts`, `.env.example`, `.claude/settings.json`, `MEMORY.md` | Context7, Drizzle MCP, Firecrawl MCP | `config.ts` exports validated env object, MCP servers connect, hooks fire on edit |
| **S2: Scoring Foundation** | Fix weights (30/30/15/10/15), implement composite scorer, set up Vitest, write scoring tests for current buggy code | `packages/core/src/scoring/`, `packages/core/vitest.config.ts`, `vitest.config.ts` (root) | — | Weights correct, composite scorer works, `pnpm test` runs, tests document the bugs |
| **S3: Firecrawl Integration** | Replace crawler stub with Firecrawl `map()` + `crawl()`, typed tool function pattern | `packages/core/src/tools/crawl-site.ts`, replaces `packages/site-crawler/` | **Firecrawl API** | Can crawl a real domain and get markdown + HTML back. Typed input/output with Zod. |

**Why this works:** S1 creates config.ts which S3 needs for the API key — but S3 can hardcode a test key or use dotenv directly for its first pass. S2 is fully independent (scoring has no external dependencies). Merge, then config.ts becomes the canonical env source.

**Dev infra that evolves later (NOT blocking):** Feature specs (`.claude/specs/`), interface contracts (`packages/core/src/contracts/`), custom subagents. Create these as you discover the need, not as prerequisites.

---

### Round 2: AI Engine Monitoring + Analysis (Days 2-3)

The crawling and config are merged. Now wire the AI engines and start building scoring pillars.

| Session | Scope | Owned Files | Integrations Wired | Exit Criteria |
|---------|-------|-------------|-------------------|---------------|
| **S4: AI Engine Providers** | Replace mocked providers with AI SDK v6. Wire OpenAI web_search, Perplexity Sonar, Gemini Grounding. `Promise.allSettled()` for multi-provider queries. | `packages/core/src/tools/query-engines.ts`, provider config | **OpenAI Responses API, Perplexity Sonar, Gemini API** | Can query all 3 engines with a prompt, get structured responses. Failed providers logged, not thrown. |
| **S5: LLM Parser + Content Scoring** | Build `generateObject()` + Zod schemas for mention/citation/sentiment extraction. Implement Content Quality scoring using Firecrawl output + Haiku analysis. | `packages/core/src/tools/parse-response.ts`, `packages/core/src/scoring/content-quality.ts` | **Claude Haiku via AI SDK** | Parser extracts mentions, citations, sentiment from raw AI responses. Content scorer returns 0-30. Tests pass. |
| **S6: Technical Readiness Scoring** | PageSpeed Insights API integration. robots.txt AI crawler rules check. llms.txt detection. Sitemap validation. Mobile/SSL checks from Firecrawl data. | `packages/core/src/scoring/technical-readiness.ts`, `packages/core/src/tools/pagespeed.ts` | **PageSpeed Insights API** | Technical scorer returns 0-10. PageSpeed data feeds in. Tests for 0-input, perfect, typical, edge cases. |
| **S7: Schema Scoring** | Custom JSON-LD parser from Firecrawl HTML. Schema type identification, gap detection, completeness scoring. | `packages/core/src/scoring/schema-structured.ts`, `packages/core/src/tools/parse-jsonld.ts` | — | Schema scorer returns 0-15. Parses real JSON-LD from crawled HTML. Tests pass. |

**Dependency note:** S5 needs Firecrawl output format (from S3) and AI SDK (wired in S4 concurrently). S5 can mock the AI engine response format initially and integrate with S4's output after merge. S6 and S7 need Firecrawl output from S3 (already merged from Round 1).

---

### Round 3: Complete Scoring + Report Templates (Days 3-5)

All providers are wired. All pillar scorers except GBP exist. Now complete the scoring and start report design in parallel.

| Session | Scope | Owned Files | Integrations Wired | Exit Criteria |
|---------|-------|-------------|-------------------|---------------|
| **S8: GBP/Local Scoring** | Google Places API integration. GBP completeness scoring (reviews, hours, photos, categories). NAP extraction. | `packages/core/src/scoring/local-gbp.ts`, `packages/core/src/tools/google-places.ts` | **Google Places API** | GBP scorer returns 0-15. Can fetch real GBP data for a business. Tests pass. |
| **S9: AI Visibility Scoring + Citation Normalizer** | Implement AI Visibility scorer (30 pts) using parsed responses from all 3 engines. Build cross-provider citation normalizer (core IP). | `packages/core/src/scoring/ai-visibility.ts`, `packages/core/src/tools/normalize-citations.ts` | — (uses S4 output) | AI Visibility scorer returns 0-30. Citation normalizer produces unified citation graph from 3 providers. |
| **S10: Report Templates** | HTML/CSS report templates (mini 1-page + full 9-page). Brand guidelines (navy #1B2A4A, teal #00D4AA). Inline SVG for score gauges/charts. Wire Puppeteer `page.pdf()`. | `packages/core/src/report-templates/`, `packages/core/src/tools/generate-pdf.ts` | **Puppeteer** | Both templates render in browser. Puppeteer generates valid A4 PDFs. Layout handles edge cases (long names, 0 scores). |
| **S11: Scoring Test Suite + Integration Tests** | Comprehensive tests for all 5 pillar scorers. Composite score tests. Verify weights sum to 100, no pillar exceeds max, composite never exceeds 100. Integration test: mock data → all scorers → composite. | `packages/core/src/scoring/*.test.ts` | — | All scoring tests pass. 100% of documented edge cases covered. |

**Dependency note:** S8 is fully independent (new API integration). S9 depends on S4's provider output and S5's parser — both merged from Round 2. S10 needs the scoring output shape (from S2's composite scorer) but not actual scores — can use fixture data. S11 needs all scorers to exist — schedule it to start after S8 and S9 have their first passing tests, or run it at the tail end of this round.

---

### Round 4: Pipeline Orchestration (Days 5-6)

All scoring pillars work. Reports generate. Now connect everything into the Inngest pipeline.

| Session | Scope | Owned Files | Integrations Wired | Exit Criteria |
|---------|-------|-------------|-------------------|---------------|
| **S12: Inngest Pipeline** | Wire full audit pipeline as Inngest steps: CRAWL → QUERY → ANALYZE → SCORE → REPORT. Each step independently retriable. Error handling per step. | `apps/audit-runner/src/` (scaffold), Inngest function definitions | **Inngest** | Can trigger a full audit via Inngest dev server. Domain in → PDF buffer out. Each step logs success/failure. |
| **S13: Email Delivery** | React Email templates with Pare branding. Wire Resend for PDF delivery (attachment + branded email). Audit receipt confirmation email. | `packages/core/src/email-templates/`, `packages/core/src/tools/send-report.ts` | **Resend + React Email** | Can send a branded email with PDF attachment to a test address. Templates render correctly in major email clients. |

**These two can run concurrently.** S12 builds the pipeline that produces the PDF buffer. S13 builds the email that sends it. They connect at merge: the final Inngest step (DELIVER) calls the send function.

**Milestone: After Round 4 merge, you have a working audit pipeline.** Domain in → crawl → query 3 AI engines → analyze → score all 5 pillars → generate PDF → email to client. This is a sellable product.

---

### Round 5: Web Application + Admin (Days 6-9)

The pipeline works headless. Now give it a face.

| Session | Scope | Owned Files | Integrations Wired | Exit Criteria |
|---------|-------|-------------|-------------------|---------------|
| **S14: Next.js Scaffold + Public Routes + Auth** | Scaffold `apps/web` with Next.js 15 App Router. Public marketing routes (`/`, `/audit`, `/services`, `/about`, `/contact`). **Admin auth: session-based, single operator account, bcrypt + cookie, middleware on `/admin/*`.** Login page at `/admin/login`. | `apps/web/` (scaffold), auth middleware, login page | — | `pnpm dev` serves the app. Public routes render. `/admin/*` redirects to login. Login works with env-configured credentials. |
| **S15: Audit Form + Stripe** | Build `/audit` form (domain + business info + payment). Stripe Checkout integration. Webhook handler: payment confirmed → trigger Inngest audit pipeline. Client record created in Postgres. | `apps/web/app/audit/`, `apps/web/app/api/webhooks/stripe/` | **Stripe API** | Can submit audit form, pay via Stripe test mode, webhook fires, audit pipeline triggers, client record saved to DB. |
| **S16: Admin Dashboard** | Build `/admin` routes: client list (from Postgres `clients` table), audit history per client, score breakdown, re-run audit action, PDF download. All queries against Postgres via Drizzle, not Notion. | `apps/web/app/admin/` (behind auth from S14) | — | Operator can log in, see all clients, view audit results, download PDFs. Data comes from Postgres. |
| **S17: Notion Sync + Monitoring Setup** | One-way sync: Postgres `clients` table → Notion database (after audit completion). Set up n8n cron triggers for weekly monitoring runs. | `packages/core/src/tools/sync-notion.ts`, n8n workflow config | **Notion MCP, n8n** | After audit completes, client appears in Notion. Weekly monitoring cron fires and logs results. |

**Dependency note:** S14 must complete (or at least merge the auth middleware) before S16 can deploy. S15 and S14 can develop concurrently on separate branches — S15 builds the form/webhook, S14 builds the scaffold/auth, they merge together. S16 depends on S14's auth. S17 is fully independent.

**Auth is not optional.** S14 explicitly includes session-based admin auth. The admin dashboard (S16) cannot deploy without it. This is a hard dependency, not a nice-to-have.

---

### Round 6: Data Enrichment + Production (Days 9-12)

Pipeline runs, web app works, admin panel is live. Now enrich the data and ship.

| Session | Scope | Owned Files | Integrations Wired | Exit Criteria |
|---------|-------|-------------|-------------------|---------------|
| **S18: Competitive Intelligence** | Serper.dev for SERP position tracking. DataForSEO for backlink/keyword data. Feed into AI Visibility and Technical Readiness enrichment. | `packages/core/src/tools/serper.ts`, `packages/core/src/tools/dataforseo.ts` | **Serper API, DataForSEO API** | Can fetch SERP data and competitive metrics for a domain. Scoring functions accept enriched data optionally. |
| **S19: Social + Review Monitoring** | Xpoz for social brand signals. Apify Google Maps Actor for competitor review scraping. SEO Inspector for schema validation. | `packages/core/src/tools/social-monitor.ts`, `packages/core/src/tools/review-scraper.ts` | **Xpoz MCP, Apify MCP, SEO Inspector MCP** | Can pull social mentions and competitor reviews. Schema validation runs against live URLs. |
| **S20: Core IP Features** | AI accuracy scorer (compare AI responses vs GBP known-truth). Vertical-specific prompt library (first 3 verticals). Score history tracking in `monitoringResults`. | `packages/core/src/tools/accuracy-scorer.ts`, `packages/core/src/prompt-library/`, scoring history logic | — | Accuracy scorer compares AI claims vs facts. Prompt library has 20+ prompts across 3 verticals. Score history writes to DB. |
| **S21: Production Deployment** | Wire `mcp-to-ai-sdk` for production MCP safety. Coolify deployment config on Hetzner. Environment variable setup. SSL. Domain config. Smoke test full pipeline. | Deployment configs, `mcp-to-ai-sdk` vendored stubs | **mcp-to-ai-sdk** | Full audit runs in production. Public site loads. Admin panel works. Email delivers. |

---

### Round 7: Polish + Post-Launch (Week 3+)

System is live and selling audits. Now iterate based on real client feedback.

| Session | Scope | When |
|---------|-------|------|
| **S22** | Monthly update report template (2-page, score trends) | After first retainer client |
| **S23** | NAP consistency checker (top 5 directories via Firecrawl) | After first local business audit reveals NAP issues |
| **S24** | Evaluate Otterly.AI Lite for audit accuracy cross-validation | After 3 audits delivered — need data to compare against |
| **S25** | Google Alerts RSS for all clients (via n8n) | After 3+ retainer clients |
| **S26** | Upgrade to mcp-memory-service if flat files become limiting | After ~10 active development sessions |

---

### Session Dependency Graph (Visual)

```
Round 1 (Day 1):     S1 ─────┐    S2 ─────┐    S3 ─────┐
                      config  │    scoring │    crawl   │
                              ▼            ▼            ▼
                           ┌──────────── MERGE ──────────────┐
                           │                                  │
Round 2 (Days 2-3):  S4 ───┤    S5 ───┤    S6 ───┤    S7 ───┤
                     engines│    parser│    tech  │    schema│
                            ▼          ▼          ▼          ▼
                           ┌──────────── MERGE ──────────────┐
                           │                                  │
Round 3 (Days 3-5):  S8 ───┤    S9 ───┤   S10 ───┤   S11 ──┤
                     gbp   │    visib. │   reports │   tests │
                           ▼           ▼           ▼         ▼
                           ┌──────────── MERGE ──────────────┐
                           │                                  │
Round 4 (Days 5-6):  S12 ──┤          S13 ──┤
                     inngest│          email │
                            ▼                ▼
                     ┌──── MERGE ────┐ ← SELLABLE PRODUCT
                     │               │
Round 5 (Days 6-9):  S14 ──┤  S15 ──┤  S16 ──┤  S17 ──┤
                     web+   │  audit │  admin │  notion│
                     auth   │  +pay  │  panel │  +cron │
                            ▼        ▼        ▼        ▼
                     ┌──────────── MERGE ──────────────┐
                     │                                  │
Round 6 (Days 9-12): S18 ──┤  S19 ──┤  S20 ──┤  S21 ──┤
                     SEO   │  social│  IP    │  deploy│
                           ▼        ▼        ▼        ▼
                     ┌──── MERGE ────┐ ← PRODUCTION LAUNCH
                     │               │
Round 7 (Week 3+):   S22-S26 as needed
```

**Critical path (longest sequential chain):**
`S1 (config) → S4 (engines) → S9 (visibility scoring) → S12 (pipeline) → S14 (web+auth) → S21 (deploy)`

**Maximum parallelism per round:** 4 sessions (Rounds 2, 3, 5, 6).

**First sellable product:** After Round 4 merge (~Day 6). Everything after that is web UI, enrichment, and polish.

---

## Cost Summary

### Monthly Operating Costs (at 10 clients)

| Category | Tool(s) | Monthly Cost |
|----------|---------|-------------|
| AI Engine Monitoring | OpenAI + Perplexity + Gemini | ~$20-40 |
| AI Analysis/Parsing | Claude Haiku (Anthropic) | ~$5-10 |
| Site Crawling | Firecrawl Hobby | $16 |
| GBP Data | Google Places API | ~$0-10 |
| PageSpeed | Google PageSpeed Insights | $0 |
| SERP Tracking | Serper.dev | $50 (or free tier) |
| SEO Data | DataForSEO (Phase 4) | ~$5-15 |
| Social Monitoring | Xpoz free tier | $0 |
| Email | Resend free tier | $0 |
| Client Management | Notion | $0-12 |
| Hosting | Hetzner CPX21 + Coolify | ~$13 |
| **Total** | | **~$110-165/mo** |

### Per-Audit API Cost

| Component | Cost |
|-----------|------|
| Firecrawl (20 pages) | ~$0.32 |
| OpenAI web_search (20 prompts) | ~$0.25 |
| Perplexity Sonar (20 prompts) | ~$0.01 |
| Gemini with Grounding (20 prompts) | $0 (free tier) |
| Claude Haiku analysis/parsing | ~$0.03 |
| PageSpeed Insights | $0 |
| Google Places (1 lookup) | ~$0.02 |
| Puppeteer PDF | $0 (self-hosted) |
| Resend email | $0 (free tier) |
| **Total per audit** | **~$0.63** |

At $497/audit or $500/mo retainer, you're profitable from client #1. API cost is 0.13% of revenue.

### Build-Time Tooling Costs

| Tool | Cost |
|------|------|
| Context7, cc-sdd, Serena, Task Master, Dependency-MCP | $0 |
| mcp-to-ai-sdk, Precompact Hook, dependency-cruiser | $0 |
| Playwright MCP, SEO Inspector MCP, Drizzle MCP | $0 |
| **Total** | **$0/mo** |

---

## Appendix: Null Spaces — What to Build as Core IP

These are gaps no external tool fills. Building them is Pare's competitive moat.

1. **Cross-provider citation tracker** — Normalize citations from OpenAI (web_search sources), Perplexity (metadata citations), and Gemini (grounding sources) into a unified graph: which client URLs are cited, by which engine, for which queries, over time.

2. **AI accuracy scorer** — Compare what AI engines say about a business (address, hours, services, pricing) against known-truth data from GBP and client-provided facts. This powers page 8 of the audit report.

3. **GEO score history** — Track the 0-100 score and all 5 pillar scores over time. Weekly snapshots in `monitoringResults`. Trend visualization for retainer clients. This is what the $300-500/mo GEO platforms sell.

4. **Vertical-specific prompt library** — GEO-optimized prompts per business vertical. "Best dentist in Austin" variations, "emergency plumber near me" patterns. Stored in `promptLibrary` table. No external tool provides this.

5. **Schema gap recommender** — Tools validate existing schema. Nothing recommends *which specific types a local business should add* to improve AI visibility. Custom analysis combining schema audit + competitive data.

6. **AI crawler analytics** — Track GPTBot, ClaudeBot, PerplexityBot visits to client websites. Verify against official IP ranges. Simple log parser + webhook. Profound charges $499/mo for this.

7. **Prompt normalization engine** — Each AI engine interprets the same prompt differently. Build normalization logic so results are comparable across providers.
