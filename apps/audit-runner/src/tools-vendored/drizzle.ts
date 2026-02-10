// Owner: S22 (Production Deployment)
//
// Static vendored replacement for the Drizzle MCP server.
// In development, the Drizzle MCP server (npx drizzle-mcp) provides
// tools for managing database schema, running migrations, and executing
// queries interactively. In production, Drizzle ORM is used directly
// via the typed query functions and schema definitions.
//
// MCP server replaced: drizzle (from .claude/settings.json)
// Underlying library: drizzle-orm + pg
// Schema: packages/core/src/database/schema.ts
//
// Note: In production, there are no interactive database tools.
// All database access goes through Drizzle ORM queries in:
//   - apps/audit-runner/src/steps/ (pipeline steps write audit results)
//   - apps/web/app/api/ (API routes query for admin panel)
//   - apps/web/app/admin/ (server components query for dashboard)
//
// This stub documents the tool surface area for type safety
// and ensures the MCP server is never started in production.

import { z } from 'zod';

/**
 * Tool definition: Push schema changes to the database.
 *
 * Replaces the MCP tool `drizzle_push`.
 * In production, migrations are applied during deployment
 * via `pnpm drizzle-kit push` in the Docker entrypoint.
 */
export const drizzlePushInputSchema = z.object({
  schemaPath: z.string().default('packages/core/src/database/schema.ts')
    .describe('Path to the Drizzle schema file'),
  databaseUrl: z.string().url().describe('PostgreSQL connection string'),
});

export type DrizzlePushInput = z.infer<typeof drizzlePushInputSchema>;

/**
 * Tool definition: Run a Drizzle query.
 *
 * Replaces the MCP tool `drizzle_query`.
 * In production, queries are executed via Drizzle ORM typed methods.
 */
export const drizzleQueryInputSchema = z.object({
  table: z.string().min(1).describe('Table name to query'),
  where: z.record(z.unknown()).optional().describe('Filter conditions'),
  limit: z.number().int().min(1).max(1000).default(100).describe('Max rows to return'),
  orderBy: z.string().optional().describe('Column to order by'),
});

export type DrizzleQueryInput = z.infer<typeof drizzleQueryInputSchema>;

/**
 * Aggregated tool definitions for the Drizzle MCP replacement.
 *
 * These are NOT used at runtime in production. They document the
 * development-time MCP tool surface that was available via drizzle-mcp.
 * All production database access uses Drizzle ORM directly.
 */
export const drizzleTools = {
  push: {
    name: 'drizzle_push' as const,
    description: 'Push schema changes to the database (development only)',
    inputSchema: drizzlePushInputSchema,
  },
  query: {
    name: 'drizzle_query' as const,
    description: 'Run a typed query against the database',
    inputSchema: drizzleQueryInputSchema,
  },
} as const;
