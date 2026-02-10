# System Architecture

## Overview

Pare Engine is a monorepo that powers the Pare Consulting audit-to-implementation pipeline. It takes a business domain + vertical as input and produces a scored, branded PDF audit report as output.

## Target Structure

```
pare-engine/
├── packages/
│   └── core/                  # Shared foundation (the only package)
│       ├── src/
│       │   ├── contracts/     # Source of truth: Zod schemas + type interfaces
│       │   │   ├── config.contract.ts
│       │   │   ├── crawl.contract.ts
│       │   │   ├── query.contract.ts
│       │   │   ├── analysis.contract.ts
│       │   │   ├── scoring.contract.ts
│       │   │   ├── report.contract.ts
│       │   │   ├── pipeline.contract.ts
│       │   │   └── index.ts
│       │   ├── types.ts       # Legacy types (being migrated to contracts)
│       │   ├── config.ts      # Zod-validated environment config
│       │   ├── database/
│       │   │   └── schema.ts  # Drizzle ORM schema
│       │   ├── scoring/
│       │   │   ├── index.ts   # Overall score calculator + scoreToGrade
│       │   │   ├── ai-visibility.ts      # 0-30 points
│       │   │   ├── content-quality.ts    # 0-30 points
│       │   │   ├── schema-completeness.ts # 0-15 points
│       │   │   ├── technical-readiness.ts # 0-10 points
│       │   │   └── local-gbp.ts          # 0-15 points
│       │   ├── tools/
│       │   │   ├── crawl-site.ts         # Firecrawl wrapper
│       │   │   ├── query-engines.ts      # AI SDK multi-provider
│       │   │   ├── parse-response.ts     # LLM response parser
│       │   │   ├── pagespeed.ts          # PageSpeed API
│       │   │   ├── parse-jsonld.ts       # JSON-LD extraction
│       │   │   ├── google-places.ts      # Google Places API
│       │   │   ├── normalize-citations.ts # Cross-provider citation normalization
│       │   │   ├── generate-pdf.ts       # Puppeteer PDF generation
│       │   │   └── send-report.ts        # Resend email
│       │   ├── report-templates/
│       │   │   ├── audit-full.html    # 9-page HTML template
│       │   │   ├── audit-mini.html    # 1-page HTML template
│       │   │   ├── styles.css         # Shared report styles
│       │   │   └── render.ts          # Template rendering
│       │   ├── email-templates/       # React Email templates
│       │   └── prompt-library/
│       │       └── index.ts   # Vertical-specific query templates
│       └── package.json
├── apps/
│   ├── web/                   # Next.js 15: public site + operator admin + API routes
│   │   ├── app/
│   │   │   ├── (public)/      # Marketing pages (/, /audit, /services, etc.)
│   │   │   ├── audit/         # Audit order form + Stripe checkout
│   │   │   ├── admin/         # Operator dashboard (auth-gated)
│   │   │   │   ├── login/             # Login page
│   │   │   │   ├── (dashboard)/       # Dashboard overview
│   │   │   │   ├── clients/           # Client list + detail
│   │   │   │   └── audits/            # Audit queue + history
│   │   │   └── api/
│   │   │       └── webhooks/stripe/   # Stripe webhook → Inngest event
│   │   ├── middleware.ts      # Auth middleware (protects /admin/*)
│   │   ├── lib/auth.ts        # Session-based auth (single operator)
│   │   └── components/        # Shared UI components (shadcn/ui)
│   └── audit-runner/          # Inngest worker for the audit pipeline
│       ├── src/
│       │   ├── inngest.ts     # Inngest client setup
│       │   ├── pipeline.ts    # Inngest function with 6 durable steps
│       │   ├── steps/
│       │   │   ├── crawl.ts              # Firecrawl API integration
│       │   │   ├── query-engines.ts      # AI SDK multi-provider queries
│       │   │   ├── analyze-content.ts    # LLM-based content quality analysis
│       │   │   ├── analyze-technical.ts  # PageSpeed + robots.txt + llms.txt
│       │   │   ├── analyze-schema.ts     # JSON-LD extraction + gap analysis
│       │   │   ├── analyze-gbp.ts        # Google Business Profile analysis
│       │   │   ├── score.ts              # Orchestrates all 5 scorers
│       │   │   ├── report.ts             # PDF generation orchestration
│       │   │   └── deliver.ts            # Email delivery + DB write
│       │   └── index.ts
│       └── package.json
├── sessions/                  # 28 parallel build session specs
│   ├── S1/SPEC.md ... S28/SPEC.md
│   └── S{N}/STATUS.md        # Per-session progress tracking
├── docs/                      # Project documentation (you are here)
├── .claude/
│   └── rules/                 # Auto-loaded rules for Claude Code sessions
│       ├── coordination.md    # Session ownership + import rules
│       ├── scoring.md         # Scoring weight rules
│       ├── llm-integration.md # AI SDK usage rules
│       ├── crawling.md        # Firecrawl rules
│       ├── reports.md         # PDF generation rules
│       └── database.md        # Drizzle ORM rules
├── CLAUDE.md                  # Project constitution (read first)
├── COORDINATION.md            # Session ownership map + merge protocol
├── BOOTSTRAP.md               # Round 0 checklist
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

**Key structural decisions:**
- There is no `apps/api` — API routes and webhooks live inside `apps/web/app/api/`.
- The analyze step is split into 4 separate files (not one `analyze.ts`) to allow parallel development by different sessions (S5, S6, S7, S8).
- Contracts (`packages/core/src/contracts/`) are the source of truth for all shared types. All sessions import from contracts, never from sibling implementations.

## Current State vs Target

| Current | Target | Status |
|---------|--------|--------|
| `packages/core` | `packages/core` (expanded with contracts, tools, scoring/) | Contracts exist, rest being built |
| `packages/query-engine` | `apps/audit-runner/src/steps/query-engines.ts` | Scaffold — deleted after Round 2 |
| `packages/site-crawler` | `apps/audit-runner/src/steps/analyze-*.ts` | Scaffold — deleted after Round 2 |
| `packages/report-generator` | `packages/core/src/report-templates/` | Scaffold — deleted after Round 2 |
| `packages/core/src/contracts/` | (same) | **Already built** — 7 contract files |
| `sessions/S{N}/SPEC.md` | (same) | **Already built** — 28 session specs |

## Contract-First Architecture

All shared types live in `packages/core/src/contracts/`. This enables:

1. **Parallel development** — Sessions import type interfaces before implementations exist
2. **No circular dependencies** — Contracts have zero runtime dependencies on implementations
3. **Compile-time safety** — TypeScript catches contract violations immediately
4. **Subpath imports** — `import { CrawlOutput } from '@pare-engine/core/contracts'`

```
┌──────────────────────────────────────────────────────────┐
│                     contracts/                             │
│  config ─ crawl ─ query ─ analysis ─ scoring ─ report ─ pipeline  │
└────────────┬──────────┬──────────┬───────────────────────┘
             │          │          │
    ┌────────┴──┐  ┌────┴────┐  ┌─┴──────────┐
    │ packages/ │  │  apps/  │  │   apps/    │
    │   core/   │  │ runner/ │  │    web/    │
    │ (scoring, │  │ (steps, │  │ (routes,  │
    │  tools)   │  │ pipeline)│  │  admin)   │
    └───────────┘  └─────────┘  └───────────┘
```

## Three-Mode Integration Layer

**Rule: MCP for development, API wrappers for production, custom code for IP.**

```
┌───────────────────────────────────────────────────────────────┐
│                      INTEGRATION LAYER                         │
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
│  │                   │  │  Google Places│  │              │   │
│  │  Used by Claude   │  │  Resend       │  │  Report      │   │
│  │  Code sessions    │  │  Stripe       │  │  Templates   │   │
│  │  during dev       │  │  Serper.dev   │  │              │   │
│  │                   │  │  DataForSEO   │  │  Analysis    │   │
│  └──────────────────┘  └───────────────┘  │  Logic       │   │
│                                            └──────────────┘   │
│  At deploy: mcp-to-ai-sdk vendors MCP definitions into        │
│  static AI SDK tool stubs. No MCP servers in production.      │
└───────────────────────────────────────────────────────────────┘
```

## Data Flow

```
1. TRIGGER
   Website form → Stripe checkout → webhook → Inngest event "audit/requested"
   OR: Admin panel re-run → Inngest event "audit/requested"
   OR: n8n schedule → Inngest event "audit/requested"

2. CRAWL (Inngest Step 1) — S3
   Firecrawl Map API → discover all URLs (limit: 50)
   Firecrawl Crawl API → extract content from top 20 pages
   → CrawlOutput { pages: CrawledPage[], discoveredUrls: string[] }

3. QUERY (Inngest Step 2) — S4
   AI SDK generateText() → OpenAI (with web_search)
   AI SDK generateText() → Perplexity Sonar
   AI SDK generateText() → Gemini (with grounding)
   Promise.allSettled() per provider (graceful degradation)
   → MultiProviderResult { responses: EngineResponse[], failedPlatforms: string[] }

4. ANALYZE (Inngest Step 3) — S5, S6, S7, S8
   4 parallel analyzers on crawl + query data:
   - Content analysis (LLM-based: answer-first, FAQ, stats) → ContentAnalysisOutput
   - Technical analysis (PageSpeed, robots.txt, llms.txt) → TechnicalAnalysisOutput
   - Schema analysis (JSON-LD extraction, gap analysis) → SchemaAnalysisOutput
   - GBP analysis (Google Places API, NAP consistency) → GBPAnalysisOutput

5. SCORE (Inngest Step 4) — S2, S5-S9
   Apply 5-pillar scoring: 30 + 30 + 15 + 10 + 15 = 100
   → CompositeScore { overallScore, letterGrade, pillars: { ... } }

6. REPORT (Inngest Step 5) — S10
   Inject data into HTML template
   Puppeteer page.pdf() → branded PDF
   → PdfOutput { buffer, filename, pageCount }

7. DELIVER (Inngest Step 6) — S13
   Resend API → HTML email + PDF attachment
   Update client record + audit_results table
   → AuditPipelineResult { emailSent, completedAt, durationMs }
```

Each step is an Inngest durable step — independently retriable. If step 3 fails, it retries from step 3, preserving crawl data from step 2.

### Graceful Degradation

When external APIs fail mid-audit:
- `Promise.allSettled()` for multi-provider queries — never `Promise.all()`
- Track failed providers in `MultiProviderResult.failedPlatforms`
- Score with available data, flag incomplete coverage in the report
- Minimum viable audit: 1 provider + 5 prompts
- Never throw on a single provider failure

## Authentication

The admin panel uses simple session-based auth. No client login exists — this is operator-only.

**Approach:** bcrypt password hashing + signed HTTP-only cookie session. Single operator account. Credentials in environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`).

**Middleware:** `apps/web/middleware.ts` checks for valid session on all `/admin/*` routes. Unauthenticated requests redirect to `/admin/login`.

**Future:** Add employee accounts when hiring (Month 9-12). Switch to magic link or OAuth at that point.

## Key Architectural Principles

### Tool Boundaries

| Tool | Role | Boundary |
|------|------|----------|
| **n8n** | Lightweight cron triggers | Fires Inngest events on schedule. NEVER executes business logic. 5-min timeout makes it unsuitable for audits. |
| **Inngest** | Durable pipeline execution | Runs the 6-step audit pipeline with per-step retry. Self-hosts on PostgreSQL. |
| **Vercel AI SDK v6** | All LLM interactions | Unified provider interface. No custom API wrappers. |
| **Firecrawl** | Site crawling | URL discovery + content extraction. Custom analysis happens AFTER. |
| **Custom code** | Our IP | Scoring, analysis, citation tracking, report templates, schema generation. |

### Why Inngest, Not n8n for the Pipeline
n8n has a 5-minute MCP timeout. A full audit (20 pages crawl + 45 LLM queries + scoring + PDF) can take 10-30 minutes. Inngest's durable steps mean:
- Each step is independently retriable
- If Perplexity is down, it retries just that step (crawl data preserved)
- Progress is visible via Inngest dashboard
- Self-hosts on a single binary with our existing PostgreSQL

### Why AI SDK, Not Custom Provider Classes
The current `packages/query-engine/src/providers/` has 5 custom provider classes (all mocked). Vercel AI SDK v6 provides:
- Unified interface for 25+ providers
- Built-in rate limiting, retries, streaming
- `generateObject()` with Zod schema = guaranteed structured JSON
- Switch providers by changing one import line
- No custom retry/backoff/timeout code needed

### Why Firecrawl, Not Custom Playwright
The current `packages/site-crawler/src/crawler.ts` has a stub crawlPages() that returns hardcoded paths. Firecrawl provides:
- Map API: discover all URLs on a site (replaces BFS crawler)
- Crawl API: extract content with JS rendering (replaces Playwright)
- Extract API: LLM-powered structured data extraction
- Self-hostable or hosted ($9/mo for 3K credits)
- We only need custom code for the ANALYSIS, not the crawling

### Why HTML→PDF, Not React-PDF
The current `packages/report-generator` uses @react-pdf/renderer. Problems:
- Limited CSS model (no grid, limited flexbox, no custom fonts easily)
- #1 time-waster risk identified in feasibility analysis (80% likelihood of 1-2 weeks lost)
- Can't reuse web CSS/components

HTML+CSS→Puppeteer benefits:
- Full CSS support (grid, flexbox, custom fonts, SVG charts)
- Templates are debuggable in a browser
- Same CSS knowledge applies to web and PDFs
- Puppeteer `page.pdf()` is a single function call

## Build Coordination

This system is built by 28 parallel sessions organized into 9 rounds. See:
- `COORDINATION.md` — Session ownership map, merge protocol, round launch order
- `BOOTSTRAP.md` — Round 0 checklist
- `sessions/S{N}/SPEC.md` — Per-session specs
- `.claude/rules/coordination.md` — Auto-loaded session rules
