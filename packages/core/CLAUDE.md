# @pare-engine/core — Foundation Package

## Role
The single shared package. Contains contracts (source of truth for all types), database schema, scoring algorithms, configuration, report templates, tools, and prompt library. Has NO dependencies on other internal packages — everything else depends on this.

## Current State

### Already Built (contracts — type-only, no implementation)
- `src/contracts/*.ts` — 7 contract files with Zod schemas (see table below)
- `src/contracts/index.ts` — Barrel export

### Exists But Has Bugs (Gemini scaffold)
- `src/types.ts` — Interfaces need weight updates and Platform type fixes (S2 owns)
- `src/database/schema.ts` — Solid Drizzle schema, needs missing indexes (S2 owns)
- `src/scoring.ts` — **BUGGY**: wrong weights (35/25/20/10/10), wrong caps, B+/B- grades. S2 replaces entirely with `scoring/` directory.
- `src/index.ts` — Clean re-exports, S2 updates

### Does Not Exist Yet (built by sessions)
- `src/config.ts` — S1 builds (Zod-validated env config)
- `src/scoring/` — S2 builds (5 scorers + composite)
- `src/tools/` — S3-S10 build (typed tool functions)
- `src/report-templates/` — S10 builds (HTML/CSS + Puppeteer)
- `src/email-templates/` — S13 builds (React Email)
- `src/prompt-library/` — S21 builds (vertical-specific prompts)

## Contract Files

| File | Owner | Key Exports |
|------|-------|------------|
| `config.contract.ts` | S1 | `ConfigSchema`, `ValidatedConfig`, `MinimalAuditConfig` |
| `crawl.contract.ts` | S3 | `CrawlInput`, `CrawlOutput`, `CrawledPage` |
| `query.contract.ts` | S4 | `Platform` (chatgpt/perplexity/gemini), `MultiProviderResult` |
| `analysis.contract.ts` | S5-S8 | 4 analysis output types + `ParsedMention` |
| `scoring.contract.ts` | S2 | `SCORING_WEIGHTS`, `scoreToGrade()`, `CompositeScore`, 5 pillar schemas |
| `report.contract.ts` | S10 | `FullReportData`, `MiniReportData`, `PdfOutput` |
| `pipeline.contract.ts` | S12 | `AuditRequest`, 6 step interfaces, `AuditPipelineResult` |

## Target Structure (after all sessions complete)

```
src/
├── contracts/                  # Source of truth for all types (already exists)
│   ├── config.contract.ts
│   ├── crawl.contract.ts
│   ├── query.contract.ts
│   ├── analysis.contract.ts
│   ├── scoring.contract.ts
│   ├── report.contract.ts
│   ├── pipeline.contract.ts
│   └── index.ts
├── config.ts                   # Zod-validated environment config (S1)
├── types.ts                    # Refactored types (S2)
├── index.ts                    # Re-exports everything (S2 updates)
├── database/
│   └── schema.ts               # Drizzle ORM schema (S2 adds indexes)
├── scoring/
│   ├── index.ts                # calculateOverallScore, scoreToGrade (S2)
│   ├── ai-visibility.ts        # 0-30 points (S9)
│   ├── content-quality.ts      # 0-30 points (S5)
│   ├── schema-completeness.ts  # 0-15 points (S7)
│   ├── technical-readiness.ts  # 0-10 points (S6)
│   └── local-gbp.ts            # 0-15 points (S8)
├── tools/
│   ├── crawl-site.ts           # Firecrawl wrapper (S3)
│   ├── query-engines.ts        # AI SDK multi-provider (S4)
│   ├── parse-response.ts       # LLM response parser (S5)
│   ├── pagespeed.ts            # PageSpeed API (S6)
│   ├── parse-jsonld.ts         # JSON-LD extraction (S7)
│   ├── google-places.ts        # Google Places API (S8)
│   ├── normalize-citations.ts  # Cross-provider citation normalization (S9)
│   ├── generate-pdf.ts         # Puppeteer PDF generation (S10)
│   └── send-report.ts          # Resend email (S13)
├── report-templates/
│   ├── audit-full.html         # 9-page HTML template (S10)
│   ├── audit-mini.html         # 1-page HTML template (S10)
│   ├── styles.css              # Shared report CSS (S10)
│   └── render.ts               # Template rendering (S10)
├── email-templates/            # React Email templates (S13)
└── prompt-library/
    └── index.ts                # Vertical-specific query prompts (S21)
```

## Subpath Imports

After Bootstrap adds the `exports` field to `package.json`:

```typescript
import { CrawlOutput } from '@pare-engine/core/contracts';  // subpath import
import { loadConfig } from '@pare-engine/core';              // main import
```

## Key Rules

- Scoring weights: **30/30/15/10/15** (defined in `contracts/scoring.contract.ts`)
- Report generation: HTML/CSS + Puppeteer, NOT React-PDF
- Sentiment analysis: LLM-based (Claude Haiku via `generateObject()`), NOT keyword matching
- All functions must be pure where possible — typed input → typed output
- This package has ZERO runtime dependencies on external APIs (API calls live in `apps/audit-runner`)
- The `tools/` directory contains typed wrapper functions, but the actual API calls happen in `apps/audit-runner/src/steps/`

## Dependencies

- `drizzle-orm` + `pg` (database)
- `zod` (validation)
- `puppeteer` (PDF rendering — for report-templates)

## Build

```bash
pnpm --filter @pare-engine/core build    # TypeScript compilation
pnpm --filter @pare-engine/core test     # Vitest
```
