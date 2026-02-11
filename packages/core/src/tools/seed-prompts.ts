// Task 1.4: Vertical Intelligence Engine — Prompt Seeder
// Seeds the promptLibrary DB table from the static prompt files in prompt-library/.
// Checks for existing rows (match on vertical + promptText) to avoid duplicates.
// Typed tool function: typed input -> typed output.

import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import { promptLibrary } from '../database/schema.js';
import {
  getAllTemplates,
  getTemplatesForVertical,
  type VerticalPrompt,
} from '../prompt-library/index.js';

// ---------------------------------------------------------------------------
// Error Class
// ---------------------------------------------------------------------------

export class SeedPromptsError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'SeedPromptsError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SeedPromptsInput {
  /** Seed a specific vertical, or all if omitted. */
  vertical?: string;
  /** PostgreSQL connection string. */
  databaseUrl: string;
}

export interface SeedPromptsOutput {
  /** Number of prompts newly inserted. */
  seededCount: number;
  /** Number of prompts skipped because they already exist. */
  skippedCount: number;
  /** Verticals that were processed. */
  verticals: string[];
}

// ---------------------------------------------------------------------------
// Main Function
// ---------------------------------------------------------------------------

/**
 * Seeds the promptLibrary DB table from static prompt templates.
 *
 * For each prompt, checks if it already exists in DB (match on vertical + promptText).
 * If not, inserts with default performance values (successCount=0, runCount=0,
 * performanceScore='0.5000', isExperimental=false).
 *
 * @param input - Vertical to seed (or all) and database URL.
 * @returns Counts of seeded and skipped prompts, plus list of verticals processed.
 */
export async function seedPrompts(input: SeedPromptsInput): Promise<SeedPromptsOutput> {
  const { databaseUrl, vertical } = input;

  if (!databaseUrl) {
    throw new SeedPromptsError('Database URL is required', 'MISSING_DATABASE_URL');
  }

  // Gather templates to seed
  let templateSets: Array<{ vertical: string; prompts: VerticalPrompt[] }>;

  if (vertical) {
    try {
      const prompts = getTemplatesForVertical(vertical);
      templateSets = [{ vertical: vertical.toLowerCase().trim(), prompts }];
    } catch (err) {
      throw new SeedPromptsError(
        `Failed to get templates for vertical "${vertical}": ${err instanceof Error ? err.message : String(err)}`,
        'INVALID_VERTICAL',
      );
    }
  } else {
    templateSets = getAllTemplates();
  }

  const pool = new pg.Pool({ connectionString: databaseUrl });

  try {
    const db = drizzle(pool);

    let seededCount = 0;
    let skippedCount = 0;
    const processedVerticals: string[] = [];

    for (const { vertical: vert, prompts } of templateSets) {
      processedVerticals.push(vert);

      for (const prompt of prompts) {
        // Check if this prompt already exists in the DB
        const existing = await db
          .select({ id: promptLibrary.id })
          .from(promptLibrary)
          .where(
            and(
              eq(promptLibrary.vertical, vert),
              eq(promptLibrary.promptText, prompt.text),
            ),
          )
          .limit(1);

        if (existing.length > 0) {
          skippedCount++;
          continue;
        }

        // Insert with default performance values
        await db.insert(promptLibrary).values({
          vertical: vert,
          promptText: prompt.text,
          promptCategory: prompt.category,
          queryType: prompt.queryType,
          locationTemplate: prompt.text.includes('[city]'),
          isActive: true,
          successCount: 0,
          runCount: 0,
          performanceScore: '0.5000',
          isExperimental: false,
        });

        seededCount++;
      }
    }

    return {
      seededCount,
      skippedCount,
      verticals: processedVerticals,
    };
  } catch (err) {
    if (err instanceof SeedPromptsError) {
      throw err;
    }
    throw new SeedPromptsError(
      `Failed to seed prompts: ${err instanceof Error ? err.message : String(err)}`,
      'SEED_FAILED',
    );
  } finally {
    await pool.end();
  }
}
