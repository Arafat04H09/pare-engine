# Development Rules

These rules apply to EVERY Claude Code session working on Pare Engine. They are auto-loaded.

## Context

Read `VISION.md` and `PRODUCT_PLAN.md` before making significant changes. Development follows the pipeline model: `/gap-analysis` → `/research` → `/synthesize` → `/decompose` → `/prepare` → `/build` → `/confirm`.

When working on a build spec, your OWNED files are listed in that spec. When working outside the pipeline (hotfixes, ad-hoc tasks), use good judgment about scope.

## Imports

1. **Import shared types from contracts:**
   ```typescript
   import { CrawlOutput } from '@pare-engine/core/contracts';     // ✅
   ```
2. **Never import across app boundaries:**
   ```typescript
   import { crawlSite } from '../../audit-runner/src/steps/crawl'; // ❌
   ```
3. **Never invent types that duplicate contracts.** If a type exists in `packages/core/src/contracts/`, use it. If it doesn't exist and you need it, add it to the correct `*.contract.ts` file.

## Branch Discipline

4. **Branch from `main`** for new work.
5. **Rebase on `main`** before requesting merge. Never merge `main` into your branch (rebase only).

## Build Verification

6. Before considering work complete, verify:
    - `pnpm build` succeeds
    - `pnpm test` passes (if tests exist for changed code)

## Scoring Weights

7. The canonical scoring weights are **30/30/15/10/15 = 100**. These are defined in `packages/core/src/contracts/scoring.contract.ts`. Never use different weights anywhere.

## LLM Interaction

8. Use **Vercel AI SDK v6** for all LLM calls. Never write custom API wrappers.
9. Use **`generateObject()` with Zod schemas** for structured parsing. Never parse JSON manually.
10. Use **`Promise.allSettled()`** for multi-provider queries. Never `Promise.all()`.

## Error Handling

11. Failed external API calls (providers, Firecrawl, PageSpeed) should be caught, logged, and skipped — never thrown.
12. Track failures in the output data (e.g., `failedPlatforms` array) for the report.

## PDF Generation

13. Use **HTML/CSS + Puppeteer `page.pdf()`**. Never React-PDF.

## Coding Standards

14. Named exports only. No default exports.
15. `async/await` only. No `.then()` chains.
16. All environment variables come from the validated config object. No raw `process.env`.
17. Custom error classes must extend `Error` with a `code` property.
