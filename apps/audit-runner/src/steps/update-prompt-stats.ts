// Task 1.4: Vertical Intelligence Engine — Prompt Stats Updater
// Updates prompt performance stats after an audit completes.
// For each query used, increments runCount and (if brand was mentioned)
// successCount, then recalculates performanceScore.
// Designed as an Inngest step: typed input -> typed output.

import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and, sql } from 'drizzle-orm';
import { promptLibrary } from '@pare-engine/core';
import type { ParsedMention } from '@pare-engine/core/contracts';

// ---------------------------------------------------------------------------
// Error Class
// ---------------------------------------------------------------------------

export class UpdatePromptStatsError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'UpdatePromptStatsError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UpdatePromptStatsInput {
  /** The prompts that were used during the audit (with city already substituted). */
  queries: string[];
  /** The vertical for this audit. */
  vertical: string;
  /** Parsed mentions from the analyze step — one per query. */
  mentions: ParsedMention[];
  /** PostgreSQL connection string. */
  databaseUrl: string;
}

export interface UpdatePromptStatsOutput {
  /** Number of prompt rows that were updated. */
  updatedCount: number;
  /** Timestamp of when the update was performed. */
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Attempts to match a city-substituted query back to a DB prompt template.
 * Strategy: try to find an exact match on the prompt text (city already substituted),
 * or look for a row where the prompt template is contained in the query (with [city]
 * replaced by any text via SQL LIKE pattern).
 */
async function findPromptRow(
  db: ReturnType<typeof drizzle>,
  vertical: string,
  queryText: string,
): Promise<{ id: string; successCount: number; runCount: number } | null> {
  // Strategy 1: Exact match on promptText (if the query was stored as-is, e.g. non-location prompts)
  const exact = await db
    .select({
      id: promptLibrary.id,
      successCount: promptLibrary.successCount,
      runCount: promptLibrary.runCount,
    })
    .from(promptLibrary)
    .where(
      and(
        eq(promptLibrary.vertical, vertical),
        eq(promptLibrary.promptText, queryText),
      ),
    )
    .limit(1);

  if (exact.length > 0) {
    return {
      id: exact[0].id,
      successCount: exact[0].successCount ?? 0,
      runCount: exact[0].runCount ?? 0,
    };
  }

  // Strategy 2: Find prompts with [city] placeholder and check if the query matches
  // when we replace [city] with a SQL LIKE wildcard (%).
  // We query all location-template prompts for this vertical and check each one.
  const templates = await db
    .select({
      id: promptLibrary.id,
      promptText: promptLibrary.promptText,
      successCount: promptLibrary.successCount,
      runCount: promptLibrary.runCount,
    })
    .from(promptLibrary)
    .where(
      and(
        eq(promptLibrary.vertical, vertical),
        eq(promptLibrary.locationTemplate, true),
      ),
    );

  for (const template of templates) {
    if (!template.promptText) continue;

    // Build a regex from the template by replacing [city] with a wildcard pattern
    const escapedTemplate = template.promptText
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\\\[city\\\]/g, '.+');

    const regex = new RegExp('^' + escapedTemplate + '$', 'i');

    if (regex.test(queryText)) {
      return {
        id: template.id,
        successCount: template.successCount ?? 0,
        runCount: template.runCount ?? 0,
      };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main Function
// ---------------------------------------------------------------------------

/**
 * Updates prompt performance stats after an audit completes.
 *
 * For each query used:
 * 1. Find the matching prompt in the DB (match on vertical + prompt text).
 * 2. Increment runCount.
 * 3. If the query resulted in a brand mention, increment successCount.
 * 4. Recalculate performanceScore = successCount / runCount.
 * 5. Update lastUsedAt.
 *
 * @param input - Queries used, vertical, mentions from analysis, and DB URL.
 * @returns Count of updated prompt rows and timestamp.
 */
export async function executeUpdatePromptStats(
  input: UpdatePromptStatsInput,
): Promise<UpdatePromptStatsOutput> {
  const { queries, vertical, mentions, databaseUrl } = input;

  if (!databaseUrl) {
    throw new UpdatePromptStatsError(
      'Database URL is required',
      'MISSING_DATABASE_URL',
    );
  }

  if (!vertical) {
    throw new UpdatePromptStatsError(
      'Vertical is required',
      'MISSING_VERTICAL',
    );
  }

  const pool = new pg.Pool({ connectionString: databaseUrl });

  try {
    const db = drizzle(pool);
    let updatedCount = 0;
    const now = new Date();
    const normalizedVertical = vertical.toLowerCase().trim();

    // Build a query->mention map. Each query may map to multiple mentions
    // across providers, so we check if ANY mention for that query had the
    // brand mentioned.
    const queryMentionMap = new Map<string, boolean>();

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      // mentions array may be shorter than queries (if some queries failed)
      // or may be indexed differently. Use modular approach: check if any
      // mention for this query index has brandMentioned=true.
      const mention = mentions[i];
      const wasMentioned = mention ? mention.brandMentioned : false;

      // Aggregate across all appearances of this query
      const existing = queryMentionMap.get(query);
      queryMentionMap.set(query, existing === true || wasMentioned);
    }

    // Process each unique query
    for (const [queryText, wasMentioned] of queryMentionMap) {
      const promptRow = await findPromptRow(db, normalizedVertical, queryText);

      if (!promptRow) {
        // Query doesn't match any known prompt — skip (could be a generic/default query)
        continue;
      }

      const newRunCount = promptRow.runCount + 1;
      const newSuccessCount = wasMentioned
        ? promptRow.successCount + 1
        : promptRow.successCount;
      const newPerformanceScore = (newSuccessCount / newRunCount).toFixed(4);

      await db
        .update(promptLibrary)
        .set({
          runCount: newRunCount,
          successCount: newSuccessCount,
          performanceScore: newPerformanceScore,
          lastUsedAt: now,
        })
        .where(eq(promptLibrary.id, promptRow.id));

      updatedCount++;
    }

    return {
      updatedCount,
      updatedAt: now,
    };
  } catch (err) {
    if (err instanceof UpdatePromptStatsError) {
      throw err;
    }
    throw new UpdatePromptStatsError(
      `Failed to update prompt stats: ${err instanceof Error ? err.message : String(err)}`,
      'UPDATE_FAILED',
    );
  } finally {
    await pool.end();
  }
}
