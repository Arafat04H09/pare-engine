# Database Rules

When working on database schema, queries, or migrations:

## ORM
- Use **Drizzle ORM** exclusively. No raw SQL except in migration files.
- Schema defined in `packages/core/src/database/schema.ts`
- Migrations via `drizzle-kit push` (push-based, not file-based for development)

## Schema Design
- All tables use UUID primary keys (`uuid('id').defaultRandom().primaryKey()`)
- All tables have `createdAt` timestamp with `defaultNow()`
- Tables with mutable data also have `updatedAt` timestamp
- Use `jsonb` for flexible/nested data (audit details, competitor mentions)
- Use `text` for enum-like fields with Zod validation at the application level
- Foreign keys cascade on delete (`{ onDelete: 'cascade' }`)

## Current Tables
- `clients` — business info, engagement tracking, scores
- `auditResults` — audit snapshots with JSONB details
- `monitoringResults` — time-series query executions
- `deliverables` — sprint implementation tracking
- `promptLibrary` — vertical-specific query templates

## Missing Indexes (to add)
- `clients.domain` — frequently filtered
- `clients.vertical` — frequently filtered
- `auditResults.clientId + auditDate` — for time-series queries

## Adding New Tables
When adding tables, follow existing patterns:
1. Define in `packages/core/src/database/schema.ts`
2. Export from `packages/core/src/index.ts`
3. Add indexes for columns used in WHERE clauses
4. Run `drizzle-kit push` to apply

## Ownership
- `packages/core/src/database/schema.ts` is owned by **S2**. Other sessions should not modify it directly.
- If you need a schema change, document it in your `sessions/S{N}/STATUS.md` under "Deviations".

## Development Tool
The Drizzle MCP server (`drizzle-mcp`) lets Claude Code manage schema, run migrations, and query the database directly. Use it for rapid iteration during development.
