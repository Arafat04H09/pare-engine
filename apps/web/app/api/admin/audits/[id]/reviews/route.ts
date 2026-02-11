// POST /api/admin/audits/[id]/reviews
// Handles two actions:
//   { action: 'analyze', clientPlaceId, competitorPlaceIds } — scrapes reviews, runs semantic analysis
//   { action: 'campaign', gapPhrases, recommendedClusters } — generates campaign artifacts
//
// Task 4.1: Semantic Review Orchestration

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '../../../../../../lib/db';
import { auditResults, clients } from '@pare-engine/core';
import { loadWebConfig } from '@pare-engine/core/config';
import { sql } from 'drizzle-orm';
import { scrapeCompetitorReviews } from '@pare-engine/core/tools/review-scraper';
import { analyzeReviewSemantics } from '@pare-engine/core/tools/analyze-review-semantics';
import { generateReviewCampaign } from '@pare-engine/core/tools/generate-review-campaign';
import type { ReviewNGram } from '@pare-engine/core/tools/analyze-review-semantics';
import { validateSession } from '@/lib/session';

const AnalyzeRequestSchema = z.object({
  action: z.literal('analyze'),
  clientPlaceId: z.string().min(1),
  competitorPlaceIds: z.string().min(1),
});

const CampaignRequestSchema = z.object({
  action: z.literal('campaign'),
  gapPhrases: z.array(z.object({
    phrase: z.string(),
    count: z.number(),
  })),
  recommendedClusters: z.array(z.string()),
});

const ReviewsRequestSchema = z.discriminatedUnion('action', [
  AnalyzeRequestSchema,
  CampaignRequestSchema,
]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    if (!(await validateSession())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const raw = await request.json();
    const parsed = ReviewsRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 });
    }
    const body = parsed.data;

    // Fetch audit + client data
    const auditRows = await db
      .select()
      .from(auditResults)
      .where(sql`${auditResults.id} = ${id}`)
      .limit(1);

    const audit = auditRows[0];
    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    let businessName = 'Unknown Business';
    let vertical = 'general';
    let googlePlaceId: string | undefined;

    if (audit.clientId) {
      const clientRows = await db
        .select({
          businessName: clients.businessName,
          vertical: clients.vertical,
          googlePlaceId: clients.googlePlaceId,
        })
        .from(clients)
        .where(sql`${clients.id} = ${audit.clientId}`)
        .limit(1);

      if (clientRows[0]) {
        businessName = clientRows[0].businessName;
        vertical = clientRows[0].vertical;
        googlePlaceId = clientRows[0].googlePlaceId ?? undefined;
      }
    }

    if (body.action === 'analyze') {
      return await handleAnalyze(body, businessName, vertical);
    }

    if (body.action === 'campaign') {
      return await handleCampaign(body, businessName, vertical, googlePlaceId);
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "analyze" or "campaign".' },
      { status: 400 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Request failed', details: message },
      { status: 500 },
    );
  }
}

// --- Analyze Handler ---

async function handleAnalyze(
  body: z.infer<typeof AnalyzeRequestSchema>,
  businessName: string,
  vertical: string,
): Promise<NextResponse> {
  const { clientPlaceId, competitorPlaceIds } = body;

  if (!clientPlaceId || !clientPlaceId.trim()) {
    return NextResponse.json(
      { error: 'clientPlaceId is required' },
      { status: 400 },
    );
  }

  const competitorIds = (competitorPlaceIds ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  if (competitorIds.length === 0) {
    return NextResponse.json(
      { error: 'At least one competitor Place ID is required' },
      { status: 400 },
    );
  }

  // Check for Apify API key
  const webConfig = loadWebConfig();
  const apifyToken = webConfig.apifyApiKey ?? '';
  if (!apifyToken) {
    return NextResponse.json(
      {
        error: 'APIFY_API_KEY environment variable is not configured. Review scraping requires an Apify account with the Google Maps Reviews Scraper actor.',
      },
      { status: 503 },
    );
  }

  // Step 1: Scrape client reviews
  const clientResult = await scrapeCompetitorReviews([clientPlaceId], {
    apiToken: apifyToken,
    maxReviewsPerPlace: 50,
  });

  // Step 2: Scrape competitor reviews
  const competitorResult = await scrapeCompetitorReviews(competitorIds, {
    apiToken: apifyToken,
    maxReviewsPerPlace: 50,
  });

  // Collect reviews
  const clientReviews = clientResult.places
    .flatMap((p) => p.recentReviews)
    .filter((r) => r.text.length > 0)
    .map((r) => ({ text: r.text, rating: r.rating }));

  const competitorReviews = competitorResult.places
    .flatMap((p) => p.recentReviews)
    .filter((r) => r.text.length > 0)
    .map((r) => ({ text: r.text, rating: r.rating }));

  // Step 3: Run semantic analysis
  const semanticResult = await analyzeReviewSemantics({
    clientReviews,
    competitorReviews,
    vertical,
    businessName,
  });

  return NextResponse.json({
    analysis: semanticResult,
    scrapeStats: {
      clientReviewCount: clientReviews.length,
      competitorReviewCount: competitorReviews.length,
      clientPlaceSuccess: clientResult.success,
      competitorPlaceSuccess: competitorResult.success,
      failedPlaces: [
        ...clientResult.failedPlaces,
        ...competitorResult.failedPlaces,
      ],
    },
  });
}

// --- Campaign Handler ---

async function handleCampaign(
  body: z.infer<typeof CampaignRequestSchema>,
  businessName: string,
  vertical: string,
  googlePlaceId?: string,
): Promise<NextResponse> {
  const { gapPhrases, recommendedClusters } = body;

  if (!Array.isArray(gapPhrases) || !Array.isArray(recommendedClusters)) {
    return NextResponse.json(
      { error: 'gapPhrases and recommendedClusters arrays are required' },
      { status: 400 },
    );
  }

  const campaign = await generateReviewCampaign({
    businessName,
    vertical,
    gapPhrases,
    recommendedClusters,
    googlePlaceId,
  });

  return NextResponse.json({ campaign });
}
