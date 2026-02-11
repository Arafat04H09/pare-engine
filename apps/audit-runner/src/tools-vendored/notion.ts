// Owner: S22 (Production Deployment)
//
// Static vendored replacement for the Notion MCP server.
// In development, the Notion MCP server (@notionhq/notion-mcp-server)
// provides tools for querying and updating Notion databases.
// In production, Notion is accessed via the @notionhq/client SDK
// through the syncToNotion() typed tool function.
//
// MCP server replaced: notion (from .claude/settings.json)
// Underlying library: @notionhq/client
// Core tool function: packages/core/src/tools/sync-notion.ts

import { z } from 'zod';
import type {
  NotionSyncInput,
  NotionSyncOutput,
} from '@pare-engine/core/tools/sync-notion';

/**
 * Tool definition: Sync client data to Notion.
 *
 * Replaces the MCP tool for creating/updating Notion pages.
 * In production, called by the pipeline deliver step.
 */
export const notionSyncInputSchema = z.object({
  notionApiKey: z.string().min(1).describe('Notion API integration token'),
  notionDatabaseId: z.string().min(1).describe('Target Notion database ID'),
  client: z.object({
    id: z.string().min(1),
    businessName: z.string().min(1),
    domain: z.string().min(1),
    vertical: z.string().min(1),
    locationCity: z.string().nullable().optional(),
    locationState: z.string().nullable().optional(),
    engagementType: z.string().nullable().optional(),
    primaryContactEmail: z.string().nullable().optional(),
    primaryContactName: z.string().nullable().optional(),
  }).describe('Client data from Postgres'),
  latestAudit: z.object({
    overallScore: z.number(),
    letterGrade: z.string(),
    auditDate: z.date(),
    aiVisibilityScore: z.number().nullable().optional(),
    contentScore: z.number().nullable().optional(),
    schemaScore: z.number().nullable().optional(),
    technicalScore: z.number().nullable().optional(),
    gbpScore: z.number().nullable().optional(),
  }).nullable().optional().describe('Latest audit results to sync'),
});

export type NotionSyncInputSchema = z.infer<typeof notionSyncInputSchema>;

/**
 * Tool definition: Query a Notion database.
 *
 * Replaces the MCP tool for querying Notion databases.
 * Used by the admin panel to list synced clients.
 */
export const notionQueryInputSchema = z.object({
  notionApiKey: z.string().min(1).describe('Notion API integration token'),
  databaseId: z.string().min(1).describe('Notion database ID to query'),
  filter: z.record(z.unknown()).optional().describe('Notion filter object'),
  pageSize: z.number().int().min(1).max(100).default(50).describe('Number of results'),
});

export type NotionQueryInput = z.infer<typeof notionQueryInputSchema>;

/**
 * Aggregated tool definitions for the Notion MCP replacement.
 *
 * The actual implementation lives in:
 *   - packages/core/src/tools/sync-notion.ts (syncToNotion function)
 *   - apps/audit-runner/src/steps/deliver.ts (pipeline integration)
 */
export const notionTools = {
  sync: {
    name: 'notion_sync_client' as const,
    description: 'Sync client and audit data from Postgres to Notion',
    inputSchema: notionSyncInputSchema,
  },
  query: {
    name: 'notion_query_database' as const,
    description: 'Query a Notion database for client records',
    inputSchema: notionQueryInputSchema,
  },
} as const;

// Re-export types from core for convenience
export type { NotionSyncInput, NotionSyncOutput };
