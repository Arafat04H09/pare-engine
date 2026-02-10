# S18 Status

- **Status**: complete
- **Started**: 2026-02-10
- **Completed**: 2026-02-10
- **Branch**: session/S18-impl-engine

## Files Created
- `packages/core/src/tools/generate-jsonld.ts` — JSON-LD schema generator
- `packages/core/src/tools/generate-llmstxt.ts` — llms.txt and llms-full.txt generator
- `packages/core/src/tools/generate-faq.ts` — FAQ content generator (markdown + HTML + JSON-LD)

## Files Modified
- `packages/core/package.json` — Added `ai` and `@ai-sdk/anthropic` dependencies

## Deviations from Spec
- Added `ai` and `@ai-sdk/anthropic` as dependencies to `packages/core/package.json` (required for LLM calls in generators; no existing session owned these deps for the core package)

## Blockers
(none)

## Notes
All three "Fix It" generators implemented:

1. **generateJsonLd()** — Takes `SchemaAnalysisOutput` + `BusinessData`, identifies missing required/recommended schema types per vertical, uses Claude via AI SDK `generateObject()` to produce valid JSON-LD blocks. Output is copy-paste ready markdown with embedded `<script>` tags.

2. **generateLlmsTxt()** / **generateLlmsFullTxt()** — Takes `CrawlOutput` + `LlmsTxtBusinessData`, uses Claude via AI SDK `generateObject()` to summarize crawled pages and produce a llms.txt file following the llmstxt.org spec. Also generates llms-full.txt with expanded page content.

3. **generateFaq()** — Takes `ContentAnalysisOutput` + vertical + `FaqBusinessData`, uses Claude via AI SDK `generateObject()` with vertical-specific topic templates. Produces three output formats: markdown (for CMS), HTML with Microdata, and FAQPage JSON-LD schema. All answers use answer-first format.

All generators follow project conventions:
- Named exports only, no default exports
- async/await only, no .then() chains
- Custom error classes with `code` property
- Vercel AI SDK `generateObject()` with Zod schemas for structured LLM output
- Import contracts from `../contracts/`, never sibling code
- Build passes: `pnpm --filter @pare-engine/core build`
