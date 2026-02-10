// Owner: S24 (Monthly Trend Reports + Scheduled Monitoring)
// Inngest cron function: runs weekly AI visibility checks for all retainer clients.
//
// Triggered by: cron schedule (every Monday at 6:00 AM UTC)
// Flow:
//   1. Query DB for all active retainer clients
//   2. For each client, run AI engine queries (same as audit step 2)
//   3. Parse responses for brand mentions, position, sentiment
//   4. Write results to monitoringResults table
//
// Uses Promise.allSettled() for multi-provider queries (graceful degradation).
// Each client is processed independently — one failure does not block others.

import { inngest } from '../inngest.js';
import type {
  Platform,
  EngineResponse,
} from '@pare-engine/core/contracts';
import { ALL_PLATFORMS } from '@pare-engine/core/contracts';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import pg from 'pg';
import {
  clients,
  monitoringResults,
  promptLibrary,
} from '@pare-engine/core';

// ---------------------------------------------------------------------------
// Error Class
// ---------------------------------------------------------------------------

export class WeeklyMonitorError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'WeeklyMonitorError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RetainerClient {
  id: string;
  businessName: string;
  domain: string;
  vertical: string;
  locationCity: string | null;
  locationState: string | null;
  primaryContactEmail: string | null;
}

interface MonitoringQueryResult {
  clientId: string;
  platform: Platform;
  query: string;
  queryCategory: string | null;
  brandMentioned: boolean;
  brandPosition: number | null;
  brandSentiment: string | null;
  brandUrlCited: boolean;
  citedUrls: string[];
  competitorMentions: Record<string, boolean>;
  responseHash: string;
  fullResponse: string;
}

interface WeeklyMonitorResult {
  clientsProcessed: number;
  clientsFailed: number;
  totalQueries: number;
  completedAt: Date;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

interface MonitorConfig {
  databaseUrl: string;
  openaiApiKey: string;
  googleGenerativeAiApiKey: string;
  perplexityApiKey: string;
}

function loadMonitorConfig(): MonitorConfig {
  const get = (envKey: string): string => {
    const value = process.env[envKey];
    if (!value) {
      throw new WeeklyMonitorError(
        `Missing required environment variable: ${envKey}`,
        'CONFIG_MISSING',
      );
    }
    return value;
  };

  return {
    databaseUrl: get('DATABASE_URL'),
    openaiApiKey: get('OPENAI_API_KEY'),
    googleGenerativeAiApiKey: get('GOOGLE_GENERATIVE_AI_API_KEY'),
    perplexityApiKey: get('PERPLEXITY_API_KEY'),
  };
}

// ---------------------------------------------------------------------------
// Default Monitoring Queries
// ---------------------------------------------------------------------------

function getDefaultMonitoringQueries(
  businessName: string,
  vertical: string,
  city?: string | null,
): string[] {
  const location = city ? ` in ${city}` : '';
  return [
    `Best ${vertical}${location}`,
    `Who is the best ${vertical}${location}?`,
    `${vertical} recommendations${location}`,
    `${businessName} reviews`,
    `Top rated ${vertical} near me${location}`,
  ];
}

// ---------------------------------------------------------------------------
// Simple hash for response deduplication
// ---------------------------------------------------------------------------

function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// ---------------------------------------------------------------------------
// Brand mention detection (basic — LLM-based parsing handled by S5/S9)
// ---------------------------------------------------------------------------

function detectBrandMention(
  response: string,
  businessName: string,
  domain: string,
): { mentioned: boolean; position: number | null; urlCited: boolean } {
  const lowerResponse = response.toLowerCase();
  const lowerName = businessName.toLowerCase();
  const lowerDomain = domain.toLowerCase();

  const mentioned = lowerResponse.includes(lowerName) || lowerResponse.includes(lowerDomain);

  let position: number | null = null;
  if (mentioned) {
    // Attempt to find numbered list position (e.g., "1. BusinessName")
    const lines = response.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if ((line.includes(lowerName) || line.includes(lowerDomain))) {
        const match = lines[i].match(/^(\d+)\./);
        if (match) {
          position = parseInt(match[1], 10);
          break;
        }
        // If mentioned but not in numbered list, use line position as proxy
        if (position === null) {
          position = i + 1;
        }
      }
    }
  }

  const urlCited = lowerResponse.includes(lowerDomain);

  return { mentioned, position, urlCited };
}

// ---------------------------------------------------------------------------
// Inngest Weekly Monitor Function
// ---------------------------------------------------------------------------

export const weeklyMonitor = inngest.createFunction(
  {
    id: 'weekly-monitor',
    retries: 2,
  },
  { cron: '0 6 * * 1' }, // Every Monday at 6:00 AM UTC
  async ({ step }) => {
    const config = loadMonitorConfig();

    // -----------------------------------------------------------------------
    // Step 1: Fetch retainer clients
    // -----------------------------------------------------------------------

    const retainerClients = await step.run('fetch-retainer-clients', async (): Promise<RetainerClient[]> => {
      const pool = new pg.Pool({ connectionString: config.databaseUrl });
      try {
        const db = drizzle(pool);
        const rows = await db
          .select({
            id: clients.id,
            businessName: clients.businessName,
            domain: clients.domain,
            vertical: clients.vertical,
            locationCity: clients.locationCity,
            locationState: clients.locationState,
            primaryContactEmail: clients.primaryContactEmail,
          })
          .from(clients)
          .where(eq(clients.engagementType, 'retainer'));

        return rows;
      } finally {
        await pool.end();
      }
    });

    if (retainerClients.length === 0) {
      console.log('[S24] No retainer clients found. Skipping weekly monitoring.');
      return {
        clientsProcessed: 0,
        clientsFailed: 0,
        totalQueries: 0,
        completedAt: new Date(),
      } satisfies WeeklyMonitorResult;
    }

    // -----------------------------------------------------------------------
    // Step 2: Process each client
    // -----------------------------------------------------------------------

    let clientsProcessed = 0;
    let clientsFailed = 0;
    let totalQueries = 0;

    for (const client of retainerClients) {
      const clientResult = await step.run(`monitor-${client.id}`, async () => {
        const pool = new pg.Pool({ connectionString: config.databaseUrl });
        try {
          const db = drizzle(pool);

          // Fetch custom prompts for this vertical (if any)
          const customPrompts = await db
            .select({ promptText: promptLibrary.promptText, promptCategory: promptLibrary.promptCategory })
            .from(promptLibrary)
            .where(eq(promptLibrary.vertical, client.vertical));

          const queries = customPrompts.length > 0
            ? customPrompts.map((p) => {
                let text = p.promptText;
                // Replace location template tokens
                if (client.locationCity) {
                  text = text.replace(/\{\{city\}\}/g, client.locationCity);
                }
                if (client.locationState) {
                  text = text.replace(/\{\{state\}\}/g, client.locationState);
                }
                text = text.replace(/\{\{business_name\}\}/g, client.businessName);
                return { text, category: p.promptCategory };
              })
            : getDefaultMonitoringQueries(
                client.businessName,
                client.vertical,
                client.locationCity,
              ).map((text) => ({ text, category: null as string | null }));

          // Query each platform with each query using Promise.allSettled
          const allTasks: Array<{
            platform: Platform;
            query: string;
            category: string | null;
            promise: Promise<EngineResponse>;
          }> = [];

          for (const platform of ALL_PLATFORMS) {
            for (const q of queries) {
              // We import executeQueryStep from steps but to keep it lightweight
              // for monitoring, we create a simplified inline query.
              // In production, this would call the same AI SDK wrapper as S4.
              // For now, we prepare the task structure and rely on the query-engines step.
              allTasks.push({
                platform,
                query: q.text,
                category: q.category,
                promise: executeMonitorQuery(platform, q.text, config),
              });
            }
          }

          const results = await Promise.allSettled(allTasks.map((t) => t.promise));

          const insertRows: Array<typeof monitoringResults.$inferInsert> = [];

          for (let i = 0; i < results.length; i++) {
            const task = allTasks[i];
            const result = results[i];

            if (result.status === 'fulfilled' && result.value.success) {
              const response = result.value;
              const detection = detectBrandMention(
                response.rawResponse,
                client.businessName,
                client.domain,
              );

              insertRows.push({
                clientId: client.id,
                executionDate: new Date(),
                platform: task.platform,
                queryText: task.query,
                queryCategory: task.category,
                responseHash: simpleHash(response.rawResponse),
                brandMentioned: detection.mentioned,
                brandPosition: detection.position,
                brandSentiment: null, // LLM-based sentiment done in separate analysis
                brandUrlCited: detection.urlCited,
                citedUrls: response.citedUrls,
                competitorMentions: {},
                fullResponse: response.rawResponse,
              });
            } else {
              // Log failure but continue — graceful degradation
              const reason = result.status === 'rejected' ? result.reason : 'Unknown error';
              console.error(
                `[S24] Monitor query failed: client=${client.businessName}, platform=${task.platform}, query="${task.query}": ${reason}`,
              );
            }
          }

          // Batch insert monitoring results
          if (insertRows.length > 0) {
            await db.insert(monitoringResults).values(insertRows);
          }

          return {
            queriesAttempted: allTasks.length,
            queriesSucceeded: insertRows.length,
          };
        } finally {
          await pool.end();
        }
      });

      if (clientResult) {
        clientsProcessed++;
        totalQueries += clientResult.queriesSucceeded;
      } else {
        clientsFailed++;
      }
    }

    return {
      clientsProcessed,
      clientsFailed,
      totalQueries,
      completedAt: new Date(),
    } satisfies WeeklyMonitorResult;
  },
);

// ---------------------------------------------------------------------------
// Simplified AI Engine Query (for monitoring)
// ---------------------------------------------------------------------------
// NOTE: This is a lightweight wrapper. The full implementation lives in
// apps/audit-runner/src/steps/query-engines.ts (S4). For weekly monitoring,
// we use the same AI SDK pattern but with simpler error handling.
// In production, this should be refactored to share the S4 query function.

async function executeMonitorQuery(
  platform: Platform,
  query: string,
  config: MonitorConfig,
): Promise<EngineResponse> {
  const startTime = Date.now();

  try {
    // Dynamic import to avoid circular dependencies and keep the function
    // self-contained. The actual AI SDK calls follow the same pattern as S4.
    const { generateText } = await import('ai');

    let result: { text: string };

    switch (platform) {
      case 'chatgpt': {
        const { openai } = await import('@ai-sdk/openai');
        result = await generateText({
          model: openai('gpt-4o-mini'),
          prompt: query,
        });
        break;
      }
      case 'perplexity': {
        const { perplexity } = await import('@ai-sdk/perplexity');
        result = await generateText({
          model: perplexity('sonar'),
          prompt: query,
        });
        break;
      }
      case 'gemini': {
        const { google } = await import('@ai-sdk/google');
        result = await generateText({
          model: google('gemini-2.0-flash'),
          prompt: query,
        });
        break;
      }
      default: {
        throw new WeeklyMonitorError(
          `Unsupported platform: ${platform}`,
          'UNSUPPORTED_PLATFORM',
        );
      }
    }

    const latencyMs = Date.now() - startTime;

    // Extract URLs from response text (basic URL detection)
    const urlRegex = /https?:\/\/[^\s)>]+/g;
    const citedUrls = [...new Set(result.text.match(urlRegex) ?? [])];

    return {
      platform,
      query,
      rawResponse: result.text,
      citedUrls,
      groundingSources: [],
      executedAt: new Date(),
      latencyMs,
      success: true,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      platform,
      query,
      rawResponse: '',
      citedUrls: [],
      groundingSources: [],
      executedAt: new Date(),
      latencyMs,
      success: false,
      error: errorMessage,
    };
  }
}
