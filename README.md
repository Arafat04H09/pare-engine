# Pare Engine

**B2B SaaS GEO auditing platform**: Audit how AI engines perceive businesses, score AI readiness across 5 pillars, and generate branded PDF reports.

**What it does:**
- Crawls business websites → queries AI engines (ChatGPT, Perplexity, Gemini) → analyzes content/schema/technical readiness → scores 0-100 across 5 pillars → delivers branded PDF report
- Inngest durable pipeline: each step independently retriable, persists to PostgreSQL
- Operator console: manage audits, track scores, schedule rescans
- Beachhead: B2B SaaS ($8M-$40M ARR), then PE-backed multi-location healthcare

## Architecture

```
packages/core/          Shared foundation (contracts, scoring, 45+ tools, DB schema, templates)
apps/audit-runner/      Inngest durable pipeline (crawl → query → analyze → score → report → deliver)
apps/web/               Next.js 15: public website + operator admin console + API routes
knowledge/              Durable domain knowledge (persists across pipeline cycles)
pipeline/               Development pipeline artifacts (ephemeral, per-cycle)
improvements/           Strategic analysis (latent intent, steelman, risks)
docs/                   Architecture, scoring, pipeline, business documentation
```

There is no `apps/api` — API routes and webhooks live inside `apps/web/app/api/`.

**Contract-first:** All shared types in `packages/core/src/contracts/`. Import contracts, never sibling implementations.

## Key Technical Highlights

- **Contract-first architecture:** All shared contracts in `packages/core/src/contracts/` — single source of truth for types across packages
- **5-pillar scoring:** AI Visibility (30) + Content Quality (30) + Schema/Structured Data (15) + Technical Readiness (10) + Local/GBP (15) = composite 0-100 score + letter grade
- **Durable pipeline:** Inngest with PostgreSQL backend — each step (crawl, query, analyze, score, report) independently retriable
- **40+ typed tools:** Firecrawl, multi-provider LLM queries, schema extraction, GBP analysis
- **1,900+ lines of tests:** Vitest (unit) + Playwright (E2E) across all packages
- **Turborepo monorepo:** 26,700 LOC across `packages/core`, `apps/audit-runner`, `apps/web`, knowledge, pipeline, improvements

## Quick Start

```bash
pnpm install          # Install all dependencies
pnpm build            # Build all packages (Turborepo)
pnpm test             # Run all tests
pnpm dev              # Watch mode for all packages
```

### Single package

```bash
pnpm --filter @pare-engine/core build
pnpm --filter @pare-engine/core test
pnpm --filter @pare-engine/web dev
```

## Stack

| Layer | Tool |
|-------|------|
| Language | TypeScript 5.x (strict), NodeNext module resolution |
| Monorepo | Turborepo + pnpm workspaces |
| Database | PostgreSQL 16 + Drizzle ORM (push-based migrations) |
| Web | Next.js 15 (App Router) + React 19 |
| UI | Tailwind v4 + shadcn/ui |
| PDF | HTML/CSS templates + Puppeteer `page.pdf()` |
| LLM | Vercel AI SDK v6 (unified provider interface) |
| Background Jobs | Inngest (durable steps, self-hosted on Postgres) |
| Email | Resend + React Email 5.0 |
| Payments | Stripe |
| Hosting | Hetzner CPX21 + Coolify |
| Testing | Vitest (unit) + Playwright (E2E) |

## Audit Pipeline

```
1. TRIGGER  →  Website form / CLI / n8n schedule → Inngest event
2. CRAWL    →  Firecrawl map + crawl → pages with markdown + HTML
3. QUERY    →  AI SDK → OpenAI + Perplexity + Gemini → multi-provider results
4. ANALYZE  →  4 parallel analyzers → content + schema + technical + GBP
5. SCORE    →  5 pillar scorers → composite score (0-100 + letter grade)
6. REPORT   →  HTML template + Puppeteer → branded PDF
7. DELIVER  →  Resend email + DB write → complete audit result
```

Each step is an Inngest durable step — independently retriable.

### Scoring Weights

| Pillar | Max Points |
|--------|-----------|
| AI Visibility | 30 |
| Content Quality | 30 |
| Schema/Structured Data | 15 |
| Technical Readiness | 10 |
| Local/GBP + Third-Party | 15 |
| **Total** | **100** |

Grades: A (90-100), B (80-89), C (70-79), D (60-69), F (0-59)

## Development Pipeline

Two-loop model for development automation:

```
UNDERSTANDING LOOP:
/gap-analysis → /dispatch → /research (N parallel) + /search-tools → /synthesize → knowledge/

BUILD LOOP:
/synthesize → /decompose → /prepare → /build → /confirm → feedback
```

19 pipeline and utility skills available. 16 MCP servers configured. Deep parallelization via git worktrees — 100+ specs per cycle.

### Conductor

The **Conductor** (`pnpm conductor`) automates the entire pipeline. It detects pipeline state from file globs, spawns agents for each stage, handles research fan-out (N parallel threads), validates outputs, and archives previous cycles. Fully autonomous by default. Routes thinking stages to Claude Opus and doing stages to Gemini.

```bash
pnpm conductor start          # Full cycle from gap-analysis
pnpm conductor                # Resume from current state
pnpm conductor status         # Show pipeline state
pnpm conductor watch          # React to file drops
pnpm conductor --dry-run      # Preview without executing
```

See `docs/PIPELINE_GUIDE.md` for the complete reference.

## Key Documentation

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` | Project constitution — architecture, conventions, tool decisions |
| `VISION.md` | Living vision — market thesis, three-layer architecture, cognitive team |
| `PRODUCT_PLAN.md` | Feature inventory with SHIPPED/WIRED/PARTIAL/PLANNED status |
| `docs/ARCHITECTURE.md` | System architecture and data flow |
| `docs/SCORING_ALGORITHM.md` | Complete scoring specification with formulas |
| `docs/AUDIT_PIPELINE.md` | Inngest pipeline step-by-step reference |
| `docs/PIPELINE_GUIDE.md` | Development pipeline with examples and decision trees |

## Quick Links

- **GitHub:** https://github.com/Arafat04H09/pare-engine
- **Support/Questions:** Open an issue or discussion on the repo
