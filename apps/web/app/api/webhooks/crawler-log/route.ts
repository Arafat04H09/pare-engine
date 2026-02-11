// Owner: S28 (AI Crawler Analytics)
// Next.js 15 App Router API route: POST /api/webhooks/crawler-log
//
// Accepts POST requests with web server log data, identifies AI bot visits
// (GPTBot, ClaudeBot, PerplexityBot, etc.), verifies IPs against published
// ranges, and stores results in the database.
//
// Authentication: shared secret via X-Crawler-Log-Secret header.
// Rate limit: max 1000 entries per request (enforced by schema).

import { NextRequest, NextResponse } from 'next/server';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import {
  CrawlerLogWebhookRequestSchema,
  processCrawlerLogBatch,
  buildCrawlerAnalyticsSummary,
  type CrawlerLogWebhookResponse,
  type ParsedBotVisit,
} from '@pare-engine/core/tools/crawler-analytics';

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class CrawlerLogWebhookError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'CrawlerLogWebhookError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Database helper
// ---------------------------------------------------------------------------

function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new CrawlerLogWebhookError('DATABASE_URL is not set', 'DB_NOT_CONFIGURED');
  }
  const pool = new pg.Pool({ connectionString: databaseUrl });
  return drizzle(pool);
}

// ---------------------------------------------------------------------------
// Security helper
// ---------------------------------------------------------------------------

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ---------------------------------------------------------------------------
// POST handler — receive and process crawler logs
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Step 1: Authenticate
  const webhookSecret = process.env.CRAWLER_LOG_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[S28] crawler-log webhook: CRAWLER_LOG_WEBHOOK_SECRET not set');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 },
    );
  }

  const providedSecret = request.headers.get('X-Crawler-Log-Secret') ?? '';
  if (!providedSecret || !timingSafeEqual(providedSecret, webhookSecret)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 },
    );
  }

  // Step 2: Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const parseResult = CrawlerLogWebhookRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: 'Invalid request body',
        details: parseResult.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  const { domain, entries } = parseResult.data;

  // Step 3: Process the log entries (identify bots + verify IPs)
  let result: CrawlerLogWebhookResponse;
  try {
    result = await processCrawlerLogBatch(entries, domain);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[S28] crawler-log webhook: Processing failed: ${errorMessage}`);
    return NextResponse.json(
      { error: 'Failed to process log entries' },
      { status: 500 },
    );
  }

  // Step 4: Store AI bot visits in database
  // Note: We only store identified AI bot visits. Unknown visits are returned
  // in the response but not persisted (to avoid filling the DB with non-AI traffic).
  const aiBotVisits = result.visits.filter((v) => v.isAiBot);

  if (aiBotVisits.length > 0) {
    try {
      await storeBotVisits(aiBotVisits, domain);
    } catch (error) {
      // Log but don't fail the webhook -- the processing result is still valid
      console.error('[S28] crawler-log webhook: Failed to store visits:', error);
    }
  }

  return NextResponse.json(result, { status: 200 });
}

// ---------------------------------------------------------------------------
// GET handler — query crawler analytics
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Authenticate
  const webhookSecret = process.env.CRAWLER_LOG_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[S28] crawler-log webhook: CRAWLER_LOG_WEBHOOK_SECRET not set');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 },
    );
  }

  const providedSecret = request.headers.get('X-Crawler-Log-Secret')
    ?? request.nextUrl.searchParams.get('secret')
    ?? '';

  if (!providedSecret || !timingSafeEqual(providedSecret, webhookSecret)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 },
    );
  }

  // Parse query parameters
  const domain = request.nextUrl.searchParams.get('domain');
  const periodStart = request.nextUrl.searchParams.get('start');
  const periodEnd = request.nextUrl.searchParams.get('end');
  const botName = request.nextUrl.searchParams.get('bot');

  if (!domain) {
    return NextResponse.json(
      { error: 'Missing required query parameter: domain' },
      { status: 400 },
    );
  }

  // Default period: last 30 days
  const endDate = periodEnd ? new Date(periodEnd) : new Date();
  const startDate = periodStart
    ? new Date(periodStart)
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  try {
    const visits = await queryBotVisits(domain, startDate, endDate, botName ?? undefined);

    const summary = buildCrawlerAnalyticsSummary(
      visits,
      domain,
      startDate.toISOString(),
      endDate.toISOString(),
    );

    return NextResponse.json({
      summary,
      visits: visits.slice(0, 100), // Cap response size
      totalVisits: visits.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[S28] crawler-log GET: Query failed: ${errorMessage}`);
    return NextResponse.json(
      { error: 'Failed to query crawler analytics' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Database operations
// ---------------------------------------------------------------------------

/**
 * Store AI bot visits in the database.
 * Uses the monitoringResults table with platform='crawler-analytics' to avoid
 * schema changes (S28 does not own the schema file).
 *
 * Each visit is stored as a row with the bot details in the JSONB fields.
 */
async function storeBotVisits(visits: ParsedBotVisit[], domain: string): Promise<void> {
  const db = getDb();

  // We use a raw SQL insert for the crawler_visits concept, leveraging the
  // existing monitoring_results table structure. The domain is stored in
  // query_text, bot name in query_category, and full details in competitor_mentions JSONB.
  //
  // NOTE: If S2 adds a dedicated crawler_visits table later, this should migrate to that.
  // Documented in sessions/S28/STATUS.md under "Deviations".

  const insertValues = visits.map((v) => ({
    platform: 'crawler-analytics' as const,
    queryText: v.visit.domain,
    queryCategory: v.botName ?? 'unknown',
    brandMentioned: v.isAiBot,
    brandSentiment: v.ipVerified,
    fullResponse: v.visit.userAgent,
    executionDate: new Date(v.visit.timestamp),
    competitorMentions: {
      ip: v.visit.ip,
      path: v.visit.path,
      method: v.visit.method,
      statusCode: v.visit.statusCode,
      responseSize: v.visit.responseSize,
      operator: v.operator,
      botName: v.botName,
      ipVerified: v.ipVerified,
    },
    citedUrls: [v.visit.path],
  }));

  // Batch insert using Drizzle
  const { monitoringResults } = await import('@pare-engine/core');

  for (const values of insertValues) {
    await db.insert(monitoringResults).values(values);
  }
}

/**
 * Query stored bot visits from the database.
 */
async function queryBotVisits(
  domain: string,
  startDate: Date,
  endDate: Date,
  botName?: string,
): Promise<ParsedBotVisit[]> {
  const db = getDb();
  const { monitoringResults } = await import('@pare-engine/core');

  const conditions = [
    eq(monitoringResults.platform, 'crawler-analytics'),
    eq(monitoringResults.queryText, domain),
    gte(monitoringResults.executionDate, startDate),
    lte(monitoringResults.executionDate, endDate),
  ];

  if (botName) {
    conditions.push(eq(monitoringResults.queryCategory, botName));
  }

  const rows = await db
    .select()
    .from(monitoringResults)
    .where(and(...conditions))
    .orderBy(desc(monitoringResults.executionDate))
    .limit(10000);

  // Reconstruct ParsedBotVisit from stored data
  return rows.map((row) => {
    const details = (row.competitorMentions ?? {}) as Record<string, unknown>;

    return {
      visit: {
        ip: String(details.ip ?? ''),
        userAgent: row.fullResponse ?? '',
        timestamp: (row.executionDate ?? new Date()).toISOString(),
        method: String(details.method ?? 'GET'),
        path: String(details.path ?? '/'),
        statusCode: Number(details.statusCode ?? 200),
        responseSize: details.responseSize !== undefined ? Number(details.responseSize) : undefined,
        domain: row.queryText,
      },
      botName: row.queryCategory ?? null,
      operator: details.operator ? String(details.operator) : null,
      isAiBot: row.brandMentioned ?? false,
      ipVerified: (row.brandSentiment as 'verified' | 'unverified' | 'pending' | 'no_range_available') ?? 'pending',
    };
  });
}
