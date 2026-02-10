# S4: AI Engine Providers

## Mission
Wire OpenAI Responses API (web_search), Perplexity Sonar, and Gemini with grounding via Vercel AI SDK v6. Build the multi-provider query function with Promise.allSettled().

## Agent
CLAUDE — AI SDK v6 multi-provider wiring requires understanding provider patterns, Promise.allSettled, and error handling conventions.

## Input Contracts (read from `@pare-engine/core/contracts`)
- `QueryInput` from `query.contract.ts`
- `MultiQueryInput` from `query.contract.ts`
- `EngineResponse` from `query.contract.ts`
- `MultiProviderResult` from `query.contract.ts`
- `Platform` from `query.contract.ts`
- `ALL_PLATFORMS` from `query.contract.ts`
- `ValidatedConfig` from `config.contract.ts`

## Output Contracts (this session implements)
- `EngineResponse` from `query.contract.ts`
- `MultiProviderResult` from `query.contract.ts`

## Files OWNED (exclusive write access)
- `packages/core/src/tools/query-engines.ts`
- `apps/audit-runner/src/steps/query-engines.ts`

## Files READ-ONLY (import, do not modify)
- `packages/core/src/contracts/query.contract.ts`
- `packages/core/src/contracts/config.contract.ts`
- `packages/query-engine/src/providers/` (reference only — all mocked, see what NOT to do)
- `.claude/rules/llm-integration.md`

## Scaffold Salvage
- `packages/query-engine/src/providers/` → DELETE (all return "Mock [Provider] response"). Reference only for interface shape.

## Dependencies
- S1 must complete first because S4 needs config.ts for API keys. Can use dotenv directly for initial dev.

## Exit Criteria
- `queryEngine(input: QueryInput): Promise<EngineResponse>` works for each platform
- `queryAllEngines(input: MultiQueryInput): Promise<MultiProviderResult>` uses `Promise.allSettled()`
- Failed providers logged in `failedPlatforms`, not thrown — pipeline continues with available data
- OpenAI uses Responses API with `web_search` tool
- Perplexity uses Sonar API, extracts citations from metadata
- Gemini uses grounding, extracts `groundingMetadata` sources
- All responses include `latencyMs` and `executedAt`
- Minimum viable: 1 provider succeeding = valid result

## Known Bugs to Fix
None — greenfield (replacing mocked providers)
