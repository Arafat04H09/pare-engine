# S1: Config + Dev Infra

## Mission
Create the Zod-validated environment configuration that every other session depends on. Set up MCP servers and development hooks.

## Agent
CLAUDE — Config validation, MCP setup, and .claude/rules awareness requires understanding CLAUDE.md conventions.

## Input Contracts (read from `@pare-engine/core/contracts`)
- `ConfigSchema` from `config.contract.ts`
- `ValidatedConfig` from `config.contract.ts`
- `MinimalAuditConfig` from `config.contract.ts`

## Output Contracts (this session implements)
- `ConfigSchema` from `config.contract.ts`
- `ValidatedConfig` from `config.contract.ts`
- `MinimalAuditConfig` from `config.contract.ts`

## Files OWNED (exclusive write access)
- `packages/core/src/config.ts`
- `.env.example`
- `.claude/settings.json`

## Files READ-ONLY (import, do not modify)
- `packages/core/src/contracts/config.contract.ts`
- `CLAUDE.md`
- `docs/MASTER_BUILD_PLAN.md` (Appendix B for env vars)

## Scaffold Salvage
None

## Dependencies
None — can start immediately after bootstrap

## Exit Criteria
- `config.ts` exports a `loadConfig()` function that reads `process.env`, validates via `ConfigSchema`, and returns `ValidatedConfig`
- Calling `loadConfig()` with missing required keys throws a descriptive `ConfigError` with the missing key names
- Calling `loadConfig()` with all required keys returns a typed object matching `ValidatedConfig`
- `.env.example` lists every key from `ConfigSchema` with comments
- `.claude/settings.json` has Context7, Drizzle MCP, and Firecrawl MCP configured
- No raw `process.env` access anywhere in config.ts — all access goes through Zod

## Known Bugs to Fix
None — greenfield code
