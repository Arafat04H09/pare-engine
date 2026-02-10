# S28 Status

- **Status**: complete
- **Started**: 2026-02-10
- **Completed**: 2026-02-10
- **Branch**: session/S28-crawler

## Files Created
- `packages/core/src/tools/crawler-analytics.ts` — AI bot log parser, IP verifier, analytics builder
- `apps/web/app/api/webhooks/crawler-log/route.ts` — POST/GET webhook for log ingestion and querying

## Files Modified
- `packages/core/package.json` — Added `./tools/crawler-analytics.js` subpath export (see Deviations)

## Deviations from Spec
- **Modified `packages/core/package.json`**: Added a subpath export entry `"./tools/crawler-analytics.js"` to the `exports` field. Without this, Next.js webpack cannot resolve the import `@pare-engine/core/tools/crawler-analytics.js`. This is a minimal, additive change (same pattern as `./contracts`). The existing `./tools/*` wildcard pattern does not work with Next.js webpack resolution, so an explicit entry was required. Other tool sessions (S3, etc.) will likely need similar entries added.

## Database Usage
- Uses the existing `monitoringResults` table with `platform='crawler-analytics'` to store bot visits, avoiding schema changes (S28 does not own schema.ts). Bot metadata stored in JSONB fields (`competitorMentions`). If a dedicated `crawler_visits` table is added by S2 later, the storage layer in the webhook route should migrate to it.

## Blockers
(none)

## Notes
- Recognized bots: GPTBot, ChatGPT-User, ClaudeBot, anthropic-ai, PerplexityBot, Google-Extended, Bytespider, Applebot-Extended
- IP verification supported for: GPTBot (openai.com/gptbot-ranges.txt), ChatGPT-User (openai.com/chatgpt-user.json), Googlebot-AI (Google published ranges)
- IP ranges are cached in-memory with a 24-hour TTL
- Webhook authentication via `X-Crawler-Log-Secret` header (env: `CRAWLER_LOG_WEBHOOK_SECRET`)
- Log parsing supports: Common Log Format, Combined Log Format, and JSON log formats
- GET endpoint supports query params: domain (required), start, end, bot, secret
- Unknown user agents are logged in responses but not persisted to DB
