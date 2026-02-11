// Task 2.1: Competitor Entity Normalization
// Deduplicates competitor domain references, maps to the competitors table,
// and persists competitor snapshot data.
// Lazy resolution: only enriches competitors appearing >3 times.

import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { competitors, competitorSnapshots } from '../database/schema.js';
import type { ParsedMention } from '../contracts/analysis.contract.js';
import { normalizeUrl } from './normalize-citations.js';

// ---------------------------------------------------------------------------
// Error Class
// ---------------------------------------------------------------------------

export class CompetitorNormalizationError extends Error {
  readonly code = 'COMPETITOR_NORMALIZATION_ERROR' as const;
  constructor(message: string) {
    super(message);
    this.name = 'CompetitorNormalizationError';
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NormalizedCompetitor {
  domain: string;
  mentionCount: number;
  avgPosition: number | null;
  sentiment: { positive: number; neutral: number; negative: number };
  platforms: string[];
}

export interface CompetitorNormalizationResult {
  competitors: NormalizedCompetitor[];
  totalMentions: number;
  topCompetitors: NormalizedCompetitor[];
}

export interface PersistCompetitorInput {
  databaseUrl: string;
  clientId: string;
  auditId: string;
  competitors: NormalizedCompetitor[];
  sourceEngine?: string;
}

export interface PersistCompetitorResult {
  persisted: number;
  snapshotsCreated: number;
}

// ---------------------------------------------------------------------------
// Domain Normalization
// ---------------------------------------------------------------------------

/**
 * Normalizes a competitor domain key from ParsedMention.competitorMentions.
 * Handles variations like "www.example.com", "example.com/services", "Example.com".
 */
export function normalizeCompetitorDomain(raw: string): string {
  let domain = raw.trim().toLowerCase();

  // If it looks like a URL, extract the hostname
  if (domain.includes('/') || domain.startsWith('http')) {
    try {
      const url = new URL(domain.startsWith('http') ? domain : `https://${domain}`);
      domain = url.hostname;
    } catch {
      // Not a URL, treat as plain domain
    }
  }

  // Remove www. prefix
  domain = domain.replace(/^www\./, '');

  // Remove trailing dots
  domain = domain.replace(/\.+$/, '');

  return domain;
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

/**
 * Aggregate competitor mentions across multiple ParsedMention results.
 * Returns normalized competitor entities with mention counts, positions, and sentiment.
 *
 * @param mentions - Array of ParsedMention from LLM parser
 * @param platforms - Optional parallel array of platform names for each mention
 * @returns CompetitorNormalizationResult with top 5 competitors
 */
export function aggregateCompetitorMentions(
  mentions: ParsedMention[],
  platforms?: string[],
): CompetitorNormalizationResult {
  const domainMap = new Map<string, {
    mentionCount: number;
    positions: number[];
    sentiment: { positive: number; neutral: number; negative: number };
    platformSet: Set<string>;
  }>();

  for (let i = 0; i < mentions.length; i++) {
    const mention = mentions[i];
    const platform = platforms?.[i] ?? 'unknown';

    for (const [rawDomain, data] of Object.entries(mention.competitorMentions)) {
      if (!data.mentioned) continue;

      const normalized = normalizeCompetitorDomain(rawDomain);
      const existing = domainMap.get(normalized) ?? {
        mentionCount: 0,
        positions: [],
        sentiment: { positive: 0, neutral: 0, negative: 0 },
        platformSet: new Set<string>(),
      };

      existing.mentionCount += 1;
      if (data.position !== null) {
        existing.positions.push(data.position);
      }
      if (data.sentiment === 'positive') existing.sentiment.positive += 1;
      else if (data.sentiment === 'negative') existing.sentiment.negative += 1;
      else existing.sentiment.neutral += 1;
      existing.platformSet.add(platform);

      domainMap.set(normalized, existing);
    }
  }

  const competitorList: NormalizedCompetitor[] = [];
  let totalMentions = 0;

  for (const [domain, data] of domainMap) {
    const avgPosition = data.positions.length > 0
      ? data.positions.reduce((a, b) => a + b, 0) / data.positions.length
      : null;

    competitorList.push({
      domain,
      mentionCount: data.mentionCount,
      avgPosition,
      sentiment: data.sentiment,
      platforms: Array.from(data.platformSet),
    });

    totalMentions += data.mentionCount;
  }

  // Sort by mention count descending
  competitorList.sort((a, b) => b.mentionCount - a.mentionCount);

  // Top 5 only (spec: "Only persist Top 5 results")
  const topCompetitors = competitorList.slice(0, 5);

  return { competitors: competitorList, totalMentions, topCompetitors };
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

/**
 * Persist top competitors to the database.
 * Upserts into the `competitors` table and creates `competitorSnapshots`.
 *
 * @param input - Database URL, client/audit IDs, and normalized competitors
 * @returns Count of persisted competitors and snapshots created
 */
export async function persistCompetitorData(
  input: PersistCompetitorInput,
): Promise<PersistCompetitorResult> {
  const pool = new pg.Pool({ connectionString: input.databaseUrl });

  try {
    const db = drizzle(pool);
    let persisted = 0;
    let snapshotsCreated = 0;
    const totalMentions = input.competitors.reduce((sum, c) => sum + c.mentionCount, 0);

    for (const comp of input.competitors) {
      // Lazy resolution: skip competitors with fewer than 3 mentions
      if (comp.mentionCount < 3) continue;

      // Upsert competitor
      const existing = await db.select()
        .from(competitors)
        .where(eq(competitors.domain, comp.domain))
        .limit(1);

      let competitorId: string;

      if (existing.length > 0) {
        competitorId = existing[0].id;
      } else {
        const inserted = await db.insert(competitors).values({
          domain: comp.domain,
          businessName: comp.domain, // Will be enriched later via LLM
        }).returning({ id: competitors.id });
        competitorId = inserted[0].id;
        persisted += 1;
      }

      // Create snapshot
      const shareOfVoice = totalMentions > 0
        ? (comp.mentionCount / totalMentions).toFixed(4)
        : '0';

      await db.insert(competitorSnapshots).values({
        competitorId,
        auditId: input.auditId,
        clientId: input.clientId,
        rankPosition: comp.avgPosition !== null ? Math.round(comp.avgPosition) : null,
        shareOfVoice: shareOfVoice,
        sourceEngine: input.sourceEngine ?? null,
      });
      snapshotsCreated += 1;
    }

    return { persisted, snapshotsCreated };
  } finally {
    await pool.end();
  }
}
