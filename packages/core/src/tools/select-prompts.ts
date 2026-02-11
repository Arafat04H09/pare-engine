// Task 1.4: Vertical Intelligence Engine — Prompt Selector
// Selects the optimal prompts for a given vertical from the DB using an
// exploit/explore algorithm: 80% top-performing prompts, 20% low-runCount
// prompts for exploration. Falls back to static prompts if DB is empty.
// Typed tool function: typed input -> typed output.

import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { promptLibrary } from '../database/schema.js';
import { getPromptsForVertical } from '../prompt-library/index.js';

// ---------------------------------------------------------------------------
// Error Class
// ---------------------------------------------------------------------------

export class SelectPromptsError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'SelectPromptsError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SelectPromptsInput {
  /** Vertical to select prompts for (e.g., 'dental', 'hvac', 'legal'). */
  vertical: string;
  /** City name to inject into [city] placeholders. */
  city: string;
  /** Number of prompts to select. Default 10. */
  count?: number;
  /** PostgreSQL connection string. */
  databaseUrl: string;
}

export interface SelectedPrompt {
  /** Database row ID. */
  id: string;
  /** Prompt text with [city] replaced. */
  text: string;
  /** Prompt category (discovery, service, comparison, etc.). */
  category: string;
  /** Performance score from 0.0 to 1.0. */
  performanceScore: number;
  /** Whether this prompt is in exploration mode (low run count). */
  isExperimental: boolean;
}

export interface SelectPromptsOutput {
  /** Selected prompts, sorted by performance (exploited first, then exploratory). */
  prompts: SelectedPrompt[];
  /** Whether prompts came from the database or the static fallback. */
  source: 'database' | 'static-fallback';
}

// ---------------------------------------------------------------------------
// Main Function
// ---------------------------------------------------------------------------

/**
 * Selects the optimal prompts for a given vertical from the DB.
 *
 * Selection algorithm:
 * 1. Query promptLibrary where vertical matches and isActive=true.
 * 2. Pick top N by performanceScore (80% of count) — exploitation.
 * 3. Pick random low-runCount prompts (20% of count) — exploration.
 * 4. Replace [city] placeholder in prompt text.
 *
 * FALLBACK: If DB is empty or query fails, use static getPromptsForVertical()
 * and return source='static-fallback'.
 *
 * @param input - Vertical, city, count, and database URL.
 * @returns Selected prompts with metadata and source indicator.
 */
export async function selectPrompts(input: SelectPromptsInput): Promise<SelectPromptsOutput> {
  const { vertical, city, databaseUrl } = input;
  const count = input.count ?? 10;

  if (!vertical || !city) {
    throw new SelectPromptsError(
      'Both vertical and city are required',
      'MISSING_REQUIRED_FIELDS',
    );
  }

  // Try database selection first
  let pool: InstanceType<typeof pg.Pool> | null = null;

  try {
    if (!databaseUrl) {
      throw new SelectPromptsError('No database URL', 'MISSING_DATABASE_URL');
    }

    pool = new pg.Pool({ connectionString: databaseUrl });
    const db = drizzle(pool);

    // Fetch all active prompts for this vertical
    const allPrompts = await db
      .select()
      .from(promptLibrary)
      .where(
        and(
          eq(promptLibrary.vertical, vertical.toLowerCase().trim()),
          eq(promptLibrary.isActive, true),
        ),
      );

    // If no prompts in DB, fall back to static
    if (allPrompts.length === 0) {
      return buildStaticFallback(vertical, city, count);
    }

    // Split into exploitation (top performers) and exploration (low run count)
    const exploitCount = Math.ceil(count * 0.8);
    const exploreCount = count - exploitCount;

    // Sort by performance score descending for exploitation
    const sortedByPerformance = [...allPrompts].sort((a, b) => {
      const scoreA = a.performanceScore ? parseFloat(a.performanceScore) : 0.5;
      const scoreB = b.performanceScore ? parseFloat(b.performanceScore) : 0.5;
      return scoreB - scoreA;
    });

    // Take top performers for exploitation
    const exploitedPrompts = sortedByPerformance.slice(0, exploitCount);
    const exploitedIds = new Set(exploitedPrompts.map((p) => p.id));

    // For exploration: pick from remaining prompts, preferring low run counts
    const remaining = allPrompts.filter((p) => !exploitedIds.has(p.id));
    const sortedByRunCount = [...remaining].sort((a, b) => {
      const runA = a.runCount ?? 0;
      const runB = b.runCount ?? 0;
      return runA - runB;
    });

    // Take lowest run count prompts, but shuffle them to add randomness
    const exploreCandidates = sortedByRunCount.slice(0, Math.max(exploreCount * 3, 10));
    const exploredPrompts = shuffleArray(exploreCandidates).slice(0, exploreCount);

    // Combine and build output
    const trimmedCity = city.trim();
    const selected: SelectedPrompt[] = [];

    for (const prompt of exploitedPrompts) {
      selected.push({
        id: prompt.id,
        text: (prompt.promptText ?? '').replace(/\[city\]/g, trimmedCity),
        category: prompt.promptCategory ?? 'unknown',
        performanceScore: prompt.performanceScore ? parseFloat(prompt.performanceScore) : 0.5,
        isExperimental: false,
      });
    }

    for (const prompt of exploredPrompts) {
      selected.push({
        id: prompt.id,
        text: (prompt.promptText ?? '').replace(/\[city\]/g, trimmedCity),
        category: prompt.promptCategory ?? 'unknown',
        performanceScore: prompt.performanceScore ? parseFloat(prompt.performanceScore) : 0.5,
        isExperimental: true,
      });
    }

    return {
      prompts: selected.slice(0, count),
      source: 'database',
    };
  } catch (err) {
    // On any DB error, fall back to static prompts
    if (err instanceof SelectPromptsError && err.code === 'MISSING_REQUIRED_FIELDS') {
      throw err;
    }
    return buildStaticFallback(vertical, city, count);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a static fallback SelectPromptsOutput from the prompt-library files.
 */
function buildStaticFallback(
  vertical: string,
  city: string,
  count: number,
): SelectPromptsOutput {
  try {
    const staticPrompts = getPromptsForVertical(vertical, city);
    const selected: SelectedPrompt[] = staticPrompts.slice(0, count).map((text, idx) => ({
      id: `static-${idx}`,
      text,
      category: 'unknown',
      performanceScore: 0.5,
      isExperimental: false,
    }));

    return {
      prompts: selected,
      source: 'static-fallback',
    };
  } catch {
    // If even static prompts fail (unsupported vertical), return empty
    return {
      prompts: [],
      source: 'static-fallback',
    };
  }
}

/**
 * Fisher-Yates shuffle for exploration randomness.
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
