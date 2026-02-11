# Pare Engine — Project Constitution

> Pare is an AI-native consulting operating system for Generative Engine Optimization (GEO).
> This monorepo powers the entire consulting lifecycle — audit, implement, verify, retain.

## What This System Does

Pare is a three-layer system (Tools, Intelligence, Workspace) that helps a solo GEO consultant manage mid-sized clients ($5M-$100M revenue). It audits how AI engines (ChatGPT, Perplexity, Gemini) perceive businesses, scores AI readiness on a 0-100 scale across 5 pillars, generates branded PDF reports, delivers implementation tooling (schema generation, content optimization, remediation plans), and provides ongoing monitoring with verified score improvements. The audit-to-implement-to-verify loop is the core value proposition — no competitor closes this loop.

**Beachhead market:** B2B SaaS ($8M-$40M ARR), then PE-backed multi-location healthcare. See `VISION.md` for full market thesis.

## Repo State

The initial 28-session parallel build is complete and merged to `main`. Development now follows the pipeline-driven model (`/gap-analysis` → `/build` → `/confirm`). Read these before making changes:

- `VISION.md` — Living vision document, core thesis, market positioning
- `PRODUCT_PLAN.md` — Complete feature inventory with status (SHIPPED/WIRED/PARTIAL/PLANNED)
- `.claude/rules/coordination.md` — Auto-loaded rules for every session
- `docs/PIPELINE_GUIDE.md` — Development pipeline reference

### What Exists Now

```
packages/core/         → Shared foundation (contracts, scoring, tools, DB schema, templates)
packages/core/src/contracts/  → Contract-first interfaces (Zod schemas, source of truth)
apps/audit-runner/     → Inngest worker for the audit pipeline
apps/web/              → Next.js 15: public website + audit form + admin panel
docs/                  → Architecture, scoring, pipeline, business docs
improvements/          → Strategic analysis (latent intent, steelman, risks)
pipeline/              → Development pipeline artifacts (per-cycle, ephemeral)
```

There is no `apps/api` — API routes and webhooks live inside `apps/web/app/api/`.

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

**Note:** The analyze step is split into 4 separate files (not one `analyze.ts`) to allow parallel development.

### Contract-First Development

All shared types live in `packages/core/src/contracts/`. Import contracts, never sibling implementations:

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

**Known bugs in legacy code:** `src/scoring.ts` uses wrong weights (35/25/20/10/10), sums raw scores instead of applying weights, and has B+/B-/C+ grades that don't exist in the spec. The current `packages/core/src/scoring/` replaces this entirely.

### Platform Targets (Monitor These, Not Claude)
- **OpenAI** — Responses API with built-in `web_search` tool
- **Perplexity** — Sonar API (has native citations)
- **Gemini** — with grounding enabled
- **Serper.dev** — for traditional SERP data (replaces SerpAPI — better pricing)
- **DataForSEO** — for backlink/keyword data
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
| SERP | Serper.dev + DataForSEO | Competitive intelligence |

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

| File | What It Defines |
|------|----------------|
| `config.contract.ts` | `ConfigSchema`, `ValidatedConfig`, `MinimalAuditConfig` |
| `crawl.contract.ts` | `CrawlInput`, `CrawlOutput`, `CrawledPage` |
| `query.contract.ts` | `Platform`, `QueryInput`, `MultiProviderResult`, `EngineResponse` |
| `analysis.contract.ts` | `ContentAnalysisOutput`, `SchemaAnalysisOutput`, `TechnicalAnalysisOutput`, `GBPAnalysisOutput` |
| `scoring.contract.ts` | `SCORING_WEIGHTS`, `CompositeScore`, all 5 `PillarScore` schemas |
| `report.contract.ts` | `FullReportData`, `MiniReportData`, `PdfOutput`, `ReportFinding` |
| `pipeline.contract.ts` | `AuditRequest`, step interfaces, `AuditPipelineResult` |

## File References

### Build Planning
- `VISION.md` — Living vision document, market thesis, three-layer architecture
- `PRODUCT_PLAN.md` — Complete feature inventory with SHIPPED/WIRED/PARTIAL/PLANNED status
- `docs/MASTER_BUILD_PLAN.md` — Architecture decisions, costs, conflict resolutions
- `improvements/` — Strategic analysis: latent intent, steelman, risks, recommendations
- `pipeline/` — Development pipeline artifacts (ephemeral, per-cycle)

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

Eight skills drive the development cycle (available in both `.claude/skills/` and `.agent/skills/`):

```
/gap-analysis → /research ──┐
                             ├→ /synthesize → /decompose → /prepare → /build → /confirm
              /search-tools ─┘                                           ↑         │
                                                                         └─────────┘
                                                                        (feedback loop)
```

**The pipeline is a DAG, not a chain.** `/research` and `/search-tools` can run in parallel (both feed into `/synthesize`). Multiple specs can `/build` in parallel within a wave. `/confirm` findings feed back into the next `/gap-analysis` cycle.

Pipeline artifacts live in `pipeline/` (numbered subdirectories). Each skill auto-reads the previous step's output. Pass arguments to override. Entry at any point is supported — e.g., `/build specs/my-spec.md` works without running earlier steps.

See `docs/PIPELINE_GUIDE.md` for the complete reference with examples, shortcuts, and decision trees.

### Pipeline Skills

| # | Skill | What It Does | Reads From | Writes To |
|---|-------|-------------|------------|-----------|
| 1 | `/gap-analysis` | Scan repo vs VISION.md/PRODUCT_PLAN.md, identify gaps by revenue impact | Codebase, VISION.md, PRODUCT_PLAN.md | `pipeline/1-gap-analysis/` |
| 2 | `/research` | Deep web research on questions from gap analysis | `pipeline/1-gap-analysis/` | `pipeline/2-research/` |
| 3 | `/synthesize` | Merge gaps + research into phased build strategy (40hr budget cap) | `pipeline/1-*`, `pipeline/2-*`, `pipeline/4-*` | `pipeline/3-synthesis/` |
| 4 | `/search-tools` | Find MCPs/npm packages/APIs for needed capabilities | `pipeline/3-synthesis/` | `pipeline/4-search-tools/` |
| 5 | `/decompose` | Break strategy into atomic specs with strict file ownership | `pipeline/3-*`, `pipeline/4-*` | `specs/`, `pipeline/5-decompose/` |
| 6 | `/prepare` | Generate build briefs: classify work, select toolkit, identify patterns | `specs/`, contracts, codebase | `pipeline/5.5-prepare/` |
| 7 | `/build [spec\|folder\|--wave\|--all]` | Implement specs (single or batch) with boundary enforcement | Spec + build brief + contracts | Code, `pipeline/6-build/` |
| 8 | `/confirm [spec]` | 6-level semantic verification of completed spec | Spec + code + VISION.md | `pipeline/7-confirm/` |

**Key flows:**
- Steps 2 and 4 can run in parallel (both inform step 3)
- Step 6 (`/prepare`) is optional but recommended — it makes `/build` significantly faster
- Step 7 (`/build`) supports batch modes: `--wave N`, `--all`, folder path, or `--next N` — executes specs in dependency order, stops on failure
- Step 8 (`/confirm`) findings feed into the next cycle's `/gap-analysis`
- All pipeline skills may update VISION.md and PRODUCT_PLAN.md when evidence warrants it

### Utility Skills

- `/hotfix [file-or-description]` — Quick single-file fix, max 3 files, skips full pipeline
- `/test [file-path]` — Generate Vitest tests with edge cases for a specific module
- `/review [file-or-diff]` — Lightweight pre-commit convention check (12 rules)
- `/demo [domain] [vertical]` — Quick audit demo for sales (1 provider, 5 prompts, ~2 min)
- `/security [scope]` — Scan for secrets, OWASP vulns, missing validation
- `/changelog [since-ref]` — Generate changelog from git history grouped by category
- `/onboard [area]` — Context briefing for new agents (scoring, pipeline, web, tools, all)
- `/perf [area]` — Profile bottlenecks in audit pipeline or specific modules
- `/scaffold [contract-path]` — Generate typed implementation stubs from contract files
- `/vision [focus-area]` — Interactive vision workshop: asks questions, extracts latent intent, steelmans, updates VISION.md + PRODUCT_PLAN.md

### MCP Servers (16 configured)

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
| schema-org | Schema.org type lookup & JSON-LD generation | — |
| pagespeed | Google PageSpeed Insights analysis | `GOOGLE_API_KEY` |
| coolify | Deployment management (35 ops) | `COOLIFY_ACCESS_TOKEN`, `COOLIFY_BASE_URL` |
| git-worktree | Worktree creation, parallel workflow setup, cleanup | — |
| git | Full git operations (27 tools) — merge, rebase, cherry-pick | — |

### Build Infrastructure

| Tool | Purpose | Configuration |
|------|---------|---------------|
| PreToolUse hook | Blocks writes to files outside spec's OWNED list | `.claude/hooks/validate-file-ownership.sh` — activated when `PARE_SPEC_FILE` env var is set |
| @pnpm/merge-driver | Auto-resolves `pnpm-lock.yaml` conflicts during parallel merges | Installed globally, configured in `.git/info/attributes` |
| Git worktrees | Filesystem isolation for parallel `/build` agents | `.wt/{spec-id}` directories, gitignored |
| `core.longpaths` | Windows long path support for deep `node_modules` | Enabled globally via `git config --global core.longpaths true` |

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
