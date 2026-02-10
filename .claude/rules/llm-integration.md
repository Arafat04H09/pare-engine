# LLM Integration Rules

When working on LLM-related code (querying AI engines, parsing responses, generating content):

## Provider Pattern
- Use **Vercel AI SDK v6** for ALL LLM calls. Import from `ai` and `@ai-sdk/[provider]`.
- Do NOT create custom provider wrapper classes. The AI SDK IS the abstraction.
- Provider config example:
  ```typescript
  import { openai } from '@ai-sdk/openai';
  import { anthropic } from '@ai-sdk/anthropic';
  import { google } from '@ai-sdk/google';
  ```

## Querying Pattern
- Use `generateText()` for raw responses from AI engines
- Use `generateObject()` with Zod schemas for structured parsing
- Use Claude Haiku for parsing (cheaper, fast, accurate with structured outputs)
- Use `Promise.allSettled()` for multi-provider queries — never `Promise.all()`

## Parsing Rules
- Define Zod schemas for all structured outputs (brand mention, sentiment, position, citations)
- Never parse JSON manually — AI SDK + structured outputs guarantee valid output
- Sentiment analysis must be LLM-based, not keyword-based

## Platforms to Query
- OpenAI (Responses API with web_search) — primary monitoring
- Perplexity Sonar — citations in metadata
- Gemini with grounding — Google's AI view
- Do NOT query Claude API for monitoring (no web access)

## Error Handling
- Failed provider queries should be logged and skipped, not thrown
- Track which providers succeeded/failed for the report
- Minimum viable audit: 1 provider with 5 prompts

## Contracts
- Query types: `packages/core/src/contracts/query.contract.ts` (`Platform`, `QueryInput`, `MultiProviderResult`, `EngineResponse`)
- Analysis outputs: `packages/core/src/contracts/analysis.contract.ts` (`ParsedMention`, `ContentAnalysisOutput`)
- Import via: `import { MultiProviderResult } from '@pare-engine/core/contracts'`

## Reference
See `docs/AUDIT_PIPELINE.md` for the full pipeline specification.
