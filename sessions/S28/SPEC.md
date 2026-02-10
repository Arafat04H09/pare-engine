# S28: AI Crawler Analytics

## Mission
Build log parser and webhook system for tracking AI bot visits (GPTBot, ClaudeBot, PerplexityBot) to client websites. Verify against official IP ranges.

## Agent
CLAUDE — Log parsing, IP verification, webhook handling.

## Input Contracts (read from `@pare-engine/core/contracts`)
- `ValidatedConfig` from `config.contract.ts`

## Output Contracts (this session implements)
None — analytics tool producing visit reports.

## Files OWNED (exclusive write access)
- `packages/core/src/tools/crawler-analytics.ts`
- `apps/web/app/api/webhooks/crawler-log/route.ts`

## Files READ-ONLY (import, do not modify)
- All contract files
- `packages/core/src/database/schema.ts`

## Scaffold Salvage
None

## Dependencies
- S14 must complete (web app for webhook endpoint)
- Triggered by: scale monitoring need, client demand for crawler visibility

## Exit Criteria
- `parseCrawlerLog(logEntry: string)` identifies AI bot visits by user-agent string
- Recognizes: GPTBot, ChatGPT-User, ClaudeBot, anthropic-ai, PerplexityBot, Googlebot (AI), Bytespider, Applebot-Extended
- `verifyCrawlerIp(ip: string, botName: string)` checks against published IP ranges (fetch and cache official lists)
- Webhook at `/api/webhooks/crawler-log` accepts POST with log data, stores in database
- Can query: which bots visited, when, which pages, frequency over time
- Handles: unknown user agents (log but don't classify), IP verification failure (log as unverified)

## Known Bugs to Fix
None — greenfield code
