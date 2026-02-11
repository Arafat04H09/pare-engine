# Pare Engine — Project Constitution

> Pare Consulting is a GEO (Generative Engine Optimization) consulting agency.
> This monorepo is the audit engine that powers the business.

## What This System Does

Pare audits how AI engines (ChatGPT, Perplexity, Gemini) see local businesses, scores their AI readiness on a 0-100 scale across 5 pillars, generates branded PDF reports, and delivers actionable recommendations. The audit-to-implement-to-verify loop is the core value proposition — no competitor does this.

## Repo State

The repo is being built via 28 parallel sessions coordinated through a contract-first architecture. Read these before making changes:

- `COORDINATION.md` — Session ownership map, merge protocol, round launch order
- `BOOTSTRAP.md` — Round 0 checklist (git init, workspace fixes, app scaffolds)
- `sessions/S{N}/SPEC.md` — Per-session launcher specs
- `.claude/rules/coordination.md` — Auto-loaded rules for every session

### What Exists Now

```
packages/core/         → Shared foundation (types, contracts, scoring, DB schema)
packages/core/src/contracts/  → Contract-first interfaces (Zod schemas, source of truth)
packages/query-engine/  → SCAFFOLD (reference only, being replaced)
packages/site-crawler/  → SCAFFOLD (reference only, being replaced)
packages/report-generator/ → SCAFFOLD (reference only, being replaced)
sessions/              → 28 session SPEC.md files
docs/                  → Architecture, scoring, pipeline, business docs
```

### What Gets Created (via Bootstrap + Sessions)

```
apps/audit-runner/     → Inngest worker for the audit pipeline
apps/web/              → Next.js 15: public website + audit form + admin panel
```

There is no `apps/api` — API routes and webhooks live inside `apps/web/app/api/`.

### Scaffold Packages (Reference Only)

`packages/query-engine`, `packages/site-crawler`, and `packages/report-generator` are Gemini-generated scaffolds with mocked implementations. They are deleted after Round 2. During the transition:
- Treat their code as reference, not production
- Salvageable logic is documented in each session's SPEC.md under "Scaffold Salvage"

## Architecture

```
packages/core/src/
├── contracts/          → Type-only interfaces + Zod schemas (source of truth)
├── config.ts           → Zod-validated environment config
├── types.ts            → Legacy types (being migrated to contracts)
├── scoring/            → 5-pillar scoring functions + composite
├── tools/              → Typed tool functions (crawl, query, parse, score)
├── database/           → Drizzle ORM schema
├── report-templates/   → HTML/CSS → Puppeteer PDF
├── email-templates/    → React Email templates
├── prompt-library/     → Vertical-specific query prompts
└── index.ts            → Re-exports

apps/audit-runner/src/
├── pipeline.ts         → Inngest function (6 durable steps)
├── inngest.ts          → Inngest client setup
└── steps/
    ├── crawl.ts             → Firecrawl integration
    ├── query-engines.ts     → AI SDK multi-provider queries
    ├── analyze-content.ts   → LLM-based content quality analysis
    ├── analyze-technical.ts → PageSpeed + robots.txt + llms.txt checks
    ├── analyze-schema.ts    → JSON-LD extraction + gap analysis
    ├── analyze-gbp.ts       → Google Business Profile analysis
    ├── score.ts             → Orchestrates all 5 scorers
    ├── report.ts            → PDF generation orchestration
    └── deliver.ts           → Email delivery + DB write

apps/web/
├── app/(public)/       → Marketing pages (/, /audit, /services, etc.)
├── app/admin/          → Operator dashboard (auth-gated)
├── app/api/            → API routes (webhooks, Stripe, audit trigger)
├── middleware.ts       → Auth middleware (protects /admin/*)
└── lib/auth.ts         → Session-based auth (single operator account)
```

**Note:** The analyze step is split into 4 separate files (not one `analyze.ts`) to allow parallel development by different sessions.

### Contract-First Development

All shared types live in `packages/core/src/contracts/`. Sessions import contracts, never sibling implementations:

```typescript
import { CrawlOutput } from '@pare-engine/core/contracts';     // ✅ Correct
import { crawlSite } from '../../../audit-runner/src/steps/';   // ❌ Never
```

Contract files contain: types, interfaces, Zod schemas, and `z.infer` type derivations. The one exception: `scoring.contract.ts` exports `scoreToGrade()` and `SCORING_WEIGHTS` because these are shared constants.

### Three-Mode Integration Layer

**MCP for development, API wrappers for production, custom code for IP.**

| Mode | When | Examples |
|------|------|---------|
| MCP Servers | Dev-time only | Context7, Drizzle MCP, Firecrawl MCP, Stripe MCP, Notion MCP |
| API Wrappers | Production | Firecrawl, OpenAI, Perplexity, Gemini, PageSpeed, Google Places, Resend, Stripe |
| Custom IP | Always | 5-pillar scoring, citation normalization, report templates, analysis logic |

**Production safety:** MCP tool definitions are vendored into static AI SDK tool stubs via `mcp-to-ai-sdk` before deployment. No MCP servers run in production.

### Tool Boundaries

| Tool | Role | Boundary |
|------|------|----------|
| **n8n** | Lightweight cron triggers | Fires Inngest events on schedule. NEVER executes business logic. |
| **Inngest** | Durable pipeline execution | Runs the 6-step audit pipeline with per-step retry. |
| **Vercel AI SDK v6** | All LLM interactions | Unified provider interface. No custom API wrappers. |
| **Firecrawl** | Site crawling | URL discovery + content extraction. Custom analysis happens AFTER. |
| **Custom code** | Our IP | Scoring, analysis, report templates, citation tracking. |

### Graceful Degradation

When external APIs fail mid-audit:
- Use `Promise.allSettled()` for multi-provider queries — never `Promise.all()`
- Track failed providers in `MultiProviderResult.failedPlatforms`
- Score with available data, flag incomplete coverage in the report
- Minimum viable audit: 1 provider + 5 prompts
- Never throw on a single provider failure

## Critical Decisions — Do NOT Deviate

### Use These Tools (Not Custom Code)
- **Vercel AI SDK v6** for ALL LLM interactions — replaces custom provider classes. One `generateText()`/`generateObject()` call per provider. Do NOT write custom OpenAI/Anthropic/Google API wrappers.
- **Firecrawl API** for site crawling — replaces custom Playwright crawler. Do NOT build a BFS/DFS crawler from scratch.
- **Inngest** for durable background jobs — the audit pipeline runs as Inngest steps. Do NOT put long-running jobs in n8n (5-min timeout).
- **Puppeteer `page.pdf()`** on HTML/CSS templates for PDF generation — Do NOT use React-PDF/@react-pdf/renderer (CSS limitations, #1 time-waster risk).
- **Claude structured outputs** with Zod schemas for all LLM parsing — Do NOT write JSON validation/retry loops.
- **Resend API + React Email** for transactional email — Do NOT build custom SMTP.
- **Stripe MCP** for development billing work, Stripe API for production webhooks.
- **Notion MCP** for client management (first 10 clients). No custom CRM until needed.

### Scoring Weights (Canonical — Defined in contracts)

```
AI Visibility:           30 points (mention rate, citation rate, position, sentiment)
Content Quality:         30 points (answer-first format, FAQ, stats, author, depth)
Schema/Structured Data:  15 points (required types, recommended types, validation)
Technical Readiness:     10 points (robots.txt AI rules, llms.txt, sitemap, mobile, SSL)
Local/GBP + 3rd Party:  15 points (GBP completeness, NAP, reviews, directory mentions)
Total:                  100 points → Letter grade A/B/C/D/F
```

Source of truth: `packages/core/src/contracts/scoring.contract.ts`

**Known bugs in legacy code:** `src/scoring.ts` uses wrong weights (35/25/20/10/10), sums raw scores instead of applying weights, and has B+/B-/C+ grades that don't exist in the spec. S2 replaces this entirely.

### Platform Targets (Monitor These, Not Claude)
- **OpenAI** — Responses API with built-in `web_search` tool
- **Perplexity** — Sonar API (has native citations)
- **Gemini** — with grounding enabled
- **Serper.dev** — for traditional SERP data (replaces SerpAPI — better pricing)
- **DataForSEO** — for backlink/keyword data (Round 6)
- Do NOT use Claude API for monitoring (no web access). Claude is for analysis/generation only.

## Stack

| Layer | Tool | Notes |
|-------|------|-------|
| Language | TypeScript 5.x (strict) | All strict flags, NodeNext module resolution |
| Monorepo | Turborepo + pnpm | `packages/*` + `apps/*` workspaces |
| Database | PostgreSQL 16 + Drizzle ORM | Push-based migrations (`drizzle-kit push`) |
| Web | Next.js 15 (App Router) + React 19 | `apps/web/` |
| UI | Tailwind v4 + shadcn/ui | Scaffold with v0.dev, refine here |
| PDF | HTML/CSS templates + Puppeteer `page.pdf()` | NOT React-PDF |
| LLM | Vercel AI SDK v6 | Unified provider interface |
| Background Jobs | Inngest | Durable steps, self-hosted on Postgres |
| Scheduling | n8n (self-hosted) | Cron triggers and webhooks ONLY |
| Email | Resend + React Email 5.0 | 3,000/mo free tier |
| Payments | Stripe | MCP for dev, API for prod |
| Hosting | Hetzner CPX21 + Coolify | ~$8-13/mo total |
| Testing | Vitest (unit) + Playwright (E2E) | |
| SERP | Serper.dev + DataForSEO | Round 6 (competitive intelligence) |

## Coding Conventions

- Named exports only. No default exports.
- `async/await` only. No `.then()` chains.
- Interfaces over type aliases (where possible). Explicit return types.
- Environment variables validated via Zod in `packages/core/src/config.ts`. No raw `process.env` deep in code.
- Custom error classes that extend `Error` with a `code` property.
- Drizzle ORM for all database interactions. No raw SQL except in migrations.
- Pure functions where possible. State lives in the database.
- All functions that interact with LLMs or external APIs must be designed as typed tool functions: typed input → typed output. This makes them wrappable as MCP tools or Inngest steps.
- Import shared types from `@pare-engine/core/contracts`, not from sibling session code.
- Sentiment analysis must be LLM-based (Claude Haiku via `generateObject()`), not keyword matching.

## Audit Pipeline (Data Flow)

```
1. TRIGGER  →  Website form / CLI / n8n schedule → Inngest event "audit/requested"
2. CRAWL    →  Firecrawl map + crawl → CrawlOutput (pages with markdown + HTML)
3. QUERY    →  AI SDK → OpenAI + Perplexity + Gemini → MultiProviderResult
4. ANALYZE  →  4 parallel analyzers → content + schema + technical + GBP outputs
5. SCORE    →  5 pillar scorers → CompositeScore (0-100 + letter grade)
6. REPORT   →  HTML template + Puppeteer → PdfOutput (branded PDF)
7. DELIVER  →  Resend email + DB write → AuditPipelineResult
```

Each step is an Inngest durable step — independently retriable. If step 3 fails, it retries from step 3, preserving crawl data from step 2.

## Contract Files (Source of Truth for Types)

| File | Owner | What It Defines |
|------|-------|----------------|
| `config.contract.ts` | S1 | `ConfigSchema`, `ValidatedConfig`, `MinimalAuditConfig` |
| `crawl.contract.ts` | S3 | `CrawlInput`, `CrawlOutput`, `CrawledPage` |
| `query.contract.ts` | S4 | `Platform`, `QueryInput`, `MultiProviderResult`, `EngineResponse` |
| `analysis.contract.ts` | S5-S8 | `ContentAnalysisOutput`, `SchemaAnalysisOutput`, `TechnicalAnalysisOutput`, `GBPAnalysisOutput` |
| `scoring.contract.ts` | S2 | `SCORING_WEIGHTS`, `CompositeScore`, all 5 `PillarScore` schemas |
| `report.contract.ts` | S10 | `FullReportData`, `MiniReportData`, `PdfOutput`, `ReportFinding` |
| `pipeline.contract.ts` | S12 | `AuditRequest`, step interfaces, `AuditPipelineResult` |

## File References

### Build Planning
- `docs/MASTER_BUILD_PLAN.md` — Single source of truth for all build decisions, costs, conflicts
- `COORDINATION.md` — Session ownership map, merge protocol, round launch order
- `BOOTSTRAP.md` — Round 0 checklist (git init → first commit)
- `sessions/S{N}/SPEC.md` — Per-session launcher specs (28 total)

### Technical
- `docs/ARCHITECTURE.md` — System architecture and data flow
- `docs/SCORING_ALGORITHM.md` — Complete scoring specification with formulas
- `docs/AUDIT_PIPELINE.md` — How the Inngest pipeline works step by step
- `docs/TOOLS_AND_SERVICES.md` — External tools, MCP servers, API details
- `docs/MARKET_EVIDENCE.md` — Per-provider API costs, MCP ecosystem, tool comparisons

### Business
- `docs/BUSINESS_CONTEXT.md` — What GEO is, why Pare exists, competitive landscape, target clients
- `docs/PRODUCT_SUITE.md` — What Pare sells, pricing tiers, upsell path
- `docs/CONSULTING_LIFECYCLE.md` — Prospect → Audit → Sprint → Retainer lifecycle
- `docs/OPERATOR_DASHBOARD.md` — Admin console spec for the solo operator
- `docs/WEBSITE_SPEC.md` — Public website sitemap, wireframes, brand guidelines
- `docs/DELIVERY_PLAYBOOK.md` — Sprint checklist, retainer cadence, agentic workflows
- `docs/STEELMAN_AND_RISKS.md` — Assumptions, risks, build/use/defer/kill matrix

## Commands

```bash
pnpm install          # Install all dependencies
pnpm build            # Build all packages (Turborepo)
pnpm test             # Run all tests
pnpm dev              # Watch mode for all packages
pnpm --filter @pare-engine/core build   # Build single package
pnpm --filter @pare-engine/core test    # Run core tests
```

## Development Pipeline

Seven skills drive the development cycle (available in both `.claude/skills/` and `.agent/skills/`):

```
/gap-analysis → /research → /synthesize → /search-tools → /decompose → /build → /confirm
```

Pipeline artifacts live in `pipeline/` (numbered subdirectories 1-7). Each skill auto-reads the previous step's output. Pass arguments to override.

- `/gap-analysis` — Scan repo vs VISION.md/PRODUCT_PLAN.md, identify gaps, prioritize by revenue impact
- `/research` — Deep web research on questions from gap analysis
- `/synthesize` — Merge gaps + research into phased build strategy (40hr budget cap)
- `/search-tools` — Find MCPs/npm packages/APIs for needed capabilities
- `/decompose` — Break strategy into atomic specs with strict file ownership
- `/build [spec-path]` — Implement a single spec (requires explicit invocation)
- `/confirm [spec-path]` — 6-level semantic verification of completed spec

Specs are written to `specs/` (not `pipeline/`). Entry at any point is supported — e.g., `/build specs/B-hardening/B2.1.md` works without running earlier steps.

### Utility Skills

- `/hotfix [file-or-description]` — Quick single-file fix, max 3 files, skips full pipeline
- `/test [file-path]` — Generate Vitest tests with edge cases for a specific module
- `/review [file-or-diff]` — Lightweight pre-commit convention check (12 rules)
- `/demo [domain] [vertical]` — Quick audit demo for sales (1 provider, 5 prompts, ~2 min)
- `/security [scope]` — Scan for secrets, OWASP vulns, missing validation
- `/changelog [since-ref]` — Generate changelog from git history grouped by category
- `/onboard [area]` — Context briefing for new agents (scoring, pipeline, web, tools, all)
- `/perf [area]` — Profile bottlenecks in audit pipeline or specific modules

### MCP Servers (11 configured)

| Server | Purpose | Env Vars Needed |
|--------|---------|-----------------|
| context7 | Documentation lookup | — |
| drizzle | DB schema management | — |
| firecrawl | Site crawling | `FIRECRAWL_API_KEY` |
| stripe | Billing (dev) | `STRIPE_SECRET_KEY` |
| notion | Client CRM (dev) | `NOTION_API_KEY` |
| playwright | E2E testing & browser automation | — |
| exa | Semantic web search | `EXA_API_KEY` |
| github | PR/issue management | `GITHUB_TOKEN` |
| resend | Email testing (dev) | `RESEND_API_KEY` |
| local-falcon | GBP ranking & local SEO scans | `LOCAL_FALCON_API_KEY` |
| dataforseo | Backlinks, keywords, SERP data | `DATAFORSEO_USERNAME`, `DATAFORSEO_PASSWORD` |

## What NOT To Build (Deferred)

- Client-facing dashboard (use PDF reports + Loom walkthroughs until 10+ retainer clients)
- Automated monitoring dashboard (weekly email reports suffice for first 3 retainers)
- Batch prospecting tools
- Multi-tenant architecture
- n8n delivery workflows (manual implementation for first 3 clients)
- Agentic commerce as standalone product (fold into sprint for e-commerce clients)
- Custom CMS deployment automation (provide written instructions + Loom per client)

**NOT deferred — build as part of `apps/web`:**
- Operator admin panel (`/admin/*`) — consolidated command center for solo operator
- See `docs/OPERATOR_DASHBOARD.md` for spec
