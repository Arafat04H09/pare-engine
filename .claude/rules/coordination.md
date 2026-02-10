# Session Coordination Rules

These rules apply to EVERY Claude Code session working on Pare Engine. They are auto-loaded.

## Identity

You are session **S{N}**. Your spec is at `sessions/S{N}/SPEC.md`. Read it first.

## File Ownership

1. **Never modify files outside your OWNED list.** Your SPEC.md has a "Files OWNED" section. Those are the ONLY files you may create or edit.
2. **Read-only files are read-only.** You may import from them. You may NOT edit them.
3. If you discover you need to modify a file you don't own, document it in `sessions/S{N}/STATUS.md` under "Deviations" and proceed only if it's a comment or re-export addition to `index.ts`.

## Imports

4. **Import shared types from contracts:**
   ```typescript
   import { CrawlOutput } from '@pare-engine/core/contracts';     // ✅
   ```
5. **Never import from sibling session code:**
   ```typescript
   import { crawlSite } from '../../audit-runner/src/steps/crawl'; // ❌
   ```
6. **Never invent types that duplicate contracts.** If a type exists in `packages/core/src/contracts/`, use it. If it doesn't exist and you need it, add it to the correct `*.contract.ts` file with a `// TODO: added by S{N}, verify with S{owner}` comment.

## Branch Discipline

7. **Branch naming:** `session/S{N}-{short-slug}` (e.g., `session/S3-firecrawl`)
8. **Branch from `main`** at the start of your round. Never branch from another session's branch.
9. **Rebase on `main`** before requesting merge. Never merge `main` into your branch (rebase only).

## Build Verification

10. Before marking your session complete, verify:
    - `pnpm build` succeeds
    - `pnpm test` passes (if your session has tests)
    - No files outside your OWNED list were modified (check with `git diff --name-only main`)

## Status Updates

11. On starting, create `sessions/S{N}/STATUS.md` with `Status: in_progress`
12. On completion, update to `Status: complete` and list all files created/modified.
13. If blocked, set `Status: blocked` and describe the blocker and which session must resolve it.

## Scoring Weights

14. The canonical scoring weights are **30/30/15/10/15 = 100**. These are defined in `packages/core/src/contracts/scoring.contract.ts`. Never use different weights anywhere.

## LLM Interaction

15. Use **Vercel AI SDK v6** for all LLM calls. Never write custom API wrappers.
16. Use **`generateObject()` with Zod schemas** for structured parsing. Never parse JSON manually.
17. Use **`Promise.allSettled()`** for multi-provider queries. Never `Promise.all()`.

## Error Handling

18. Failed external API calls (providers, Firecrawl, PageSpeed) should be caught, logged, and skipped — never thrown.
19. Track failures in the output data (e.g., `failedPlatforms` array) for the report.

## PDF Generation

20. Use **HTML/CSS + Puppeteer `page.pdf()`**. Never React-PDF.

## Coding Standards

21. Named exports only. No default exports.
22. `async/await` only. No `.then()` chains.
23. All environment variables come from the validated config object. No raw `process.env`.
24. Custom error classes must extend `Error` with a `code` property.

## Exit Protocol

When you believe your session is complete:
1. Run `pnpm build` and `pnpm test`
2. Verify `git diff --name-only main` shows only files in your OWNED list
3. Update `sessions/S{N}/STATUS.md` to `Status: complete`
4. Push your branch: `git push -u origin session/S{N}-{slug}`
