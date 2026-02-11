# LLM Integration Rules

## Core Principles
1. **Source of Truth**: All LLM interfaces must be defined using Zod schemas in `packages/core/src/contracts/`.
2. **Structured Outputs**: Use `generateObject()` from Vercel AI SDK v6. Avoid manual JSON parsing from strings.
3. **Provider Agnostic**: Write code to support 'chatgpt', 'perplexity', and 'gemini'.

## Tool Integration
- All tools in `packages/core/src/tools/` that use LLMs must handle API failures gracefully.
- Rule #10: Track failures in a `failedPlatforms` array, skip and log, never throw.

## Advanced Patterns
- Use `Promise.allSettled()` for multi-engine queries to ensure one failure doesn't block others.
- Sentiment analysis must be LLM-based (Claude Haiku or Gemini Flash), never keyword-based.
