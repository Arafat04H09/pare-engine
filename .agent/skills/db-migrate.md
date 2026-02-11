---
name: db-migrate
description: Generate and run Drizzle ORM database migrations
user-invocable: true
---

# Database Migration

Generate and apply Drizzle ORM schema changes.

## Steps

1. Review the current schema in `packages/core/src/database/schema.ts`
2. If changes are needed, edit the schema file
3. Run migration:
   - Development: `pnpm --filter @pare-engine/core drizzle-kit push`
   - Production: `pnpm --filter @pare-engine/core drizzle-kit generate` then `drizzle-kit migrate`
4. Verify the migration was applied successfully
5. If using Drizzle MCP, use it to introspect the database and confirm the schema matches

## Rules
- Always use push-based migrations in development (faster iteration)
- Generate file-based migrations only for production deployments
- Never drop tables or columns without explicit user confirmation
- All new tables must follow the patterns in `.agent/rules/database.md`
