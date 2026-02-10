# S17: Notion Sync + Monitoring Setup

## Mission
Build one-way sync from Postgres clients table to Notion database after audit completion. Set up n8n cron webhook that triggers Inngest for weekly monitoring.

## Agent
CLAUDE — Notion API integration and n8n→Inngest webhook pattern per CLAUDE.md architecture rules.

## Input Contracts (read from `@pare-engine/core/contracts`)
- `AuditPipelineResult` from `pipeline.contract.ts`
- `ValidatedConfig` from `config.contract.ts`

## Output Contracts (this session implements)
None — integration plumbing.

## Files OWNED (exclusive write access)
- `packages/core/src/tools/sync-notion.ts`
- `apps/audit-runner/src/steps/sync-notion.ts`
- `apps/web/app/api/webhooks/n8n/route.ts`

## Files READ-ONLY (import, do not modify)
- All contract files
- `packages/core/src/database/schema.ts`

## Scaffold Salvage
None

## Dependencies
- S1 must complete first because Notion API key lives in config
- S12 should complete first because sync runs as final pipeline step or post-pipeline hook

## Exit Criteria
- `syncToNotion(clientId: string)` reads client + latest audit from Postgres, creates/updates page in Notion database
- Notion page includes: business name, domain, overall score, pillar scores, last audit date, engagement type
- Sync is one-way: Postgres → Notion. Never reads from Notion to make decisions.
- n8n webhook endpoint at `/api/webhooks/n8n` accepts POST, validates a simple shared secret, triggers `'monitoring/weekly'` Inngest event
- n8n fires the webhook; n8n never runs monitoring logic itself (avoids 5-min timeout)
- Handles: Notion API failures (log and continue, don't block pipeline)

## Known Bugs to Fix
None — greenfield code
