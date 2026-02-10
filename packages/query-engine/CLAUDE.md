# @pare-engine/query-engine — MIGRATION TARGET

## Status: TO BE REFACTORED

This package was scaffolded by Gemini with mocked provider implementations. It will be migrated to `apps/audit-runner/src/steps/query-llms.ts`.

## What's Here (Current)
- `src/providers/index.ts` — 5 custom provider classes (ALL MOCKED, returning hardcoded strings)
- `src/parser.ts` — Regex-based response parser with naive sentiment analysis
- `src/prompts.ts` — Vertical-specific prompt templates (dental, legal, HVAC only)
- `src/index.ts` — Sequential query execution (no concurrency)

## What Replaces It
**Vercel AI SDK v6** replaces the custom provider classes entirely:
```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
// One function call replaces an entire provider class
const { text } = await generateText({ model: openai('gpt-4o'), prompt: query });
```

**Claude structured outputs** replace the regex parser:
```typescript
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
// Guaranteed structured JSON output — no regex parsing needed
const { object } = await generateObject({
  model: anthropic('claude-3-5-haiku-20241022'),
  schema: queryResultSchema,
  prompt: `Analyze this response for brand mentions...`,
});
```

## What to Keep
- `src/prompts.ts` — The prompt templates are useful. Migrate to `packages/core/src/prompt-library/`
- The `BatchQueryConfig` interface from `src/index.ts` — good shape, keep in `packages/core/src/types.ts`
- The `parseResponse` function LOGIC (not implementation) — the what-to-extract is right, the how-to-extract is wrong

## What to Delete
- All 5 provider classes in `src/providers/` — replaced by AI SDK
- The `detectBrandMention()` fuzzy matching — too naive, LLM should handle this
- The `analyzeSentiment()` keyword lists — must be LLM-based
- The sequential for-loop execution — use `Promise.allSettled()`

## Migration Checklist
- [ ] Move prompt templates to `packages/core/src/prompt-library/`
- [ ] Create `apps/audit-runner/src/steps/query-llms.ts` with AI SDK
- [ ] Create `apps/audit-runner/src/providers/ai-sdk.ts` with provider config
- [ ] Implement structured parsing with `generateObject()` + Zod schema
- [ ] Add concurrency with `Promise.allSettled()` + p-limit
- [ ] Delete this package once migration is complete
