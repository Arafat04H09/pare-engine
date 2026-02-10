# S17: Notion Sync + Monitoring Setup

## Status: complete

## Branch
`session/S17-notion`

## Files Created
- `packages/core/src/tools/sync-notion.ts`
- `apps/audit-runner/src/steps/sync-notion.ts`
- `apps/web/app/api/webhooks/n8n/route.ts`

## Files Modified
- `packages/core/package.json` -- Added @notionhq/client ^5.9.0
- `apps/audit-runner/package.json` -- Added @notionhq/client ^5.9.0
- `pnpm-lock.yaml` -- Updated lockfile

## Deviations
- Notion sync logic duplicated in audit-runner step (core lacks ./tools/* export)
- Used Notion SDK v5.x API: dataSources.query() with data_source_id
