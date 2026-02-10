// Owner: S23 (Social + Review Enrichment). Consumer: S8 (GBP/Local), S12 (Pipeline Orchestration).
// Typed tool function for scraping competitor Google Maps reviews via Apify Google Maps Actor.
// Uses the Apify HTTP API to run the compass/google-maps-reviews-scraper actor.
// Typed input -> typed output. Designed to be wrappable as an Inngest step.
//
// --- Apify Free Tier Limits ---
// Free plan: $5/month in platform credits (enough for ~small runs).
// Personal plan ($49/mo): includes $49 in usage credits.
// The Google Maps Reviews Scraper actor charges per result extracted.
// Typical cost: ~$0.50-$2.00 per 1,000 reviews depending on volume.
// Free tier supports up to ~25 actor runs/day with limited compute.
// Actor: compass/google-maps-reviews-scraper
// ---

import { z } from 'zod';

// --- Custom Error ---

export class ReviewScraperError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'ReviewScraperError';
    this.code = code;
  }
}

// --- Input Schema ---

export const ReviewScraperInputSchema = z.object({
  /** Google Maps Place IDs to scrape reviews for. */
  placeIds: z.array(z.string().min(1)).min(1).max(20),
  /** Maximum reviews to retrieve per place. Defaults to 50. */
  maxReviewsPerPlace: z.number().int().min(1).max(500).default(50),
  /** Language for reviews. Defaults to 'en'. */
  language: z.string().default('en'),
  /** Sort order for reviews. Defaults to 'newest'. */
  sort: z.enum(['newest', 'most_relevant', 'highest_rating', 'lowest_rating']).default('newest'),
});

export type ReviewScraperInput = z.infer<typeof ReviewScraperInputSchema>;

// --- Output Types ---

export const ScrapedReviewSchema = z.object({
  authorName: z.string(),
  rating: z.number().min(1).max(5),
  text: z.string(),
  relativeTime: z.string().optional(),
  publishedAt: z.string().optional(),
  likesCount: z.number().int().min(0).default(0),
  responseFromOwner: z.string().optional(),
});

export type ScrapedReview = z.infer<typeof ScrapedReviewSchema>;

export const ReviewThemeSchema = z.object({
  theme: z.string(),
  count: z.number().int().min(1),
  averageRating: z.number().min(1).max(5),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
});

export type ReviewTheme = z.infer<typeof ReviewThemeSchema>;

export const PlaceReviewResultSchema = z.object({
  placeId: z.string(),
  businessName: z.string(),
  overallRating: z.number().min(0).max(5),
  totalReviewCount: z.number().int().min(0),
  scrapedReviewCount: z.number().int().min(0),
  averageScrapedRating: z.number().min(0).max(5),
  ratingDistribution: z.object({
    one: z.number().int().min(0),
    two: z.number().int().min(0),
    three: z.number().int().min(0),
    four: z.number().int().min(0),
    five: z.number().int().min(0),
  }),
  recentReviews: z.array(ScrapedReviewSchema),
  reviewThemes: z.array(ReviewThemeSchema),
  ownerResponseRate: z.number().min(0).max(1),
  success: z.boolean(),
  error: z.string().optional(),
});

export type PlaceReviewResult = z.infer<typeof PlaceReviewResultSchema>;

export const ReviewScraperResultSchema = z.object({
  places: z.array(PlaceReviewResultSchema),
  totalPlacesRequested: z.number().int().min(0),
  totalPlacesSucceeded: z.number().int().min(0),
  totalReviewsScraped: z.number().int().min(0),
  failedPlaces: z.array(z.object({
    placeId: z.string(),
    error: z.string(),
  })),
  success: z.boolean(),
  scrapedAt: z.date(),
  error: z.string().optional(),
});

export type ReviewScraperResult = z.infer<typeof ReviewScraperResultSchema>;

// --- Apify API Types (internal) ---

interface ApifyRunResponse {
  data?: {
    id?: string;
    status?: string;
    defaultDatasetId?: string;
    startedAt?: string;
    finishedAt?: string;
    exitCode?: number;
  };
  error?: { message?: string; type?: string };
}

interface ApifyDatasetResponse {
  items?: ApifyReviewItem[];
  total?: number;
}

interface ApifyReviewItem {
  placeId?: string;
  name?: string;
  title?: string;
  totalScore?: number;
  reviewsCount?: number;
  reviews?: Array<{
    name?: string;
    text?: string;
    stars?: number;
    publishAt?: string;
    publishedAtDate?: string;
    relativeTimeDescription?: string;
    likesCount?: number;
    reviewerNumberOfReviews?: number;
    reviewerPhotoUrl?: string;
    responseFromOwnerText?: string;
    responseFromOwnerDate?: string;
  }>;
  // Alternative flat review format
  reviewerName?: string;
  reviewText?: string;
  stars?: number;
  publishAt?: string;
  publishedAtDate?: string;
  relativeTimeDescription?: string;
  likesCount?: number;
  responseFromOwnerText?: string;
}

// --- Constants ---

const APIFY_API_BASE = 'https://api.apify.com/v2';
const REVIEWS_ACTOR_ID = 'compass/google-maps-reviews-scraper';
const DEFAULT_TIMEOUT_MS = 120000; // 2 minutes — actor runs take time
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 60; // 5 minutes max wait with 5s interval

// --- Helper Functions ---

function buildPlaceUrl(placeId: string): string {
  return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
}

function calculateRatingDistribution(
  reviews: Array<{ rating: number }>,
): PlaceReviewResult['ratingDistribution'] {
  const dist = { one: 0, two: 0, three: 0, four: 0, five: 0 };
  for (const review of reviews) {
    const r = Math.round(review.rating);
    if (r === 1) dist.one++;
    else if (r === 2) dist.two++;
    else if (r === 3) dist.three++;
    else if (r === 4) dist.four++;
    else if (r >= 5) dist.five++;
  }
  return dist;
}

function calculateAverageRating(reviews: Array<{ rating: number }>): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

/**
 * Extracts basic review themes from review text using keyword frequency.
 *
 * NOTE: This is a lightweight heuristic for initial theme extraction.
 * For production use, the pipeline should augment this with LLM-based
 * theme analysis (Claude Haiku via generateObject()) for more accurate
 * categorization. This function provides a starting signal.
 */
function extractBasicThemes(
  reviews: Array<{ text: string; rating: number }>,
): ReviewTheme[] {
  // Common service-related keywords to look for
  const themeKeywords: Record<string, string[]> = {
    'Service Quality': ['service', 'staff', 'friendly', 'helpful', 'rude', 'slow', 'professional'],
    'Pricing': ['price', 'expensive', 'cheap', 'affordable', 'overpriced', 'value', 'cost', 'worth'],
    'Wait Time': ['wait', 'waiting', 'slow', 'quick', 'fast', 'prompt', 'delay', 'hour'],
    'Cleanliness': ['clean', 'dirty', 'hygiene', 'neat', 'messy', 'spotless', 'filthy'],
    'Food Quality': ['food', 'taste', 'delicious', 'bland', 'fresh', 'stale', 'menu', 'portion'],
    'Location': ['location', 'parking', 'convenient', 'accessible', 'far', 'close', 'easy to find'],
    'Atmosphere': ['atmosphere', 'ambiance', 'vibe', 'cozy', 'loud', 'quiet', 'comfortable'],
    'Communication': ['communication', 'responsive', 'call', 'email', 'reply', 'answer', 'phone'],
  };

  const themes: ReviewTheme[] = [];

  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    const matchingReviews = reviews.filter((review) => {
      const text = review.text.toLowerCase();
      return keywords.some((kw) => text.includes(kw));
    });

    if (matchingReviews.length >= 2) {
      const avgRating = calculateAverageRating(
        matchingReviews.map((r) => ({ rating: r.rating })),
      );

      let sentiment: 'positive' | 'neutral' | 'negative';
      if (avgRating >= 4) sentiment = 'positive';
      else if (avgRating >= 3) sentiment = 'neutral';
      else sentiment = 'negative';

      themes.push({
        theme,
        count: matchingReviews.length,
        averageRating: avgRating,
        sentiment,
      });
    }
  }

  // Sort by count descending
  return themes.sort((a, b) => b.count - a.count);
}

// --- Apify Actor API Functions ---

async function startActorRun(
  placeIds: string[],
  maxReviewsPerPlace: number,
  language: string,
  sort: string,
  apiToken: string,
  timeoutMs: number,
): Promise<ApifyRunResponse> {
  const actorInput = {
    startUrls: placeIds.map((id) => ({ url: buildPlaceUrl(id) })),
    maxReviews: maxReviewsPerPlace,
    reviewsSort: sort,
    language,
    // Apify actor-specific settings
    maxConcurrency: 5,
    proxyConfiguration: { useApifyProxy: true },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    const actorPath = REVIEWS_ACTOR_ID.replace('/', '~');
    response = await fetch(
      `${APIFY_API_BASE}/acts/${actorPath}/runs?token=${apiToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actorInput),
        signal: controller.signal,
      },
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new ReviewScraperError(
      `Apify API returned HTTP ${response.status}: ${response.statusText}. ${errorBody}`,
      'APIFY_HTTP_ERROR',
    );
  }

  return (await response.json()) as ApifyRunResponse;
}

async function pollRunStatus(
  runId: string,
  apiToken: string,
  timeoutMs: number,
): Promise<string> {
  let attempts = 0;

  while (attempts < MAX_POLL_ATTEMPTS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(
        `${APIFY_API_BASE}/actor-runs/${runId}?token=${apiToken}`,
        {
          method: 'GET',
          signal: controller.signal,
        },
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new ReviewScraperError(
        `Apify run status check returned HTTP ${response.status}`,
        'APIFY_POLL_ERROR',
      );
    }

    const data = (await response.json()) as ApifyRunResponse;
    const status = data.data?.status;

    if (status === 'SUCCEEDED') {
      return data.data?.defaultDatasetId ?? '';
    }

    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new ReviewScraperError(
        `Apify actor run ${status}: ${data.error?.message ?? 'No error details'}`,
        'APIFY_RUN_FAILED',
      );
    }

    // Still running — wait and poll again
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    attempts++;
  }

  throw new ReviewScraperError(
    `Apify actor run did not complete within ${MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 1000} seconds`,
    'APIFY_TIMEOUT',
  );
}

async function fetchDatasetItems(
  datasetId: string,
  apiToken: string,
  timeoutMs: number,
): Promise<ApifyReviewItem[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(
      `${APIFY_API_BASE}/datasets/${datasetId}/items?token=${apiToken}&format=json`,
      {
        method: 'GET',
        signal: controller.signal,
      },
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new ReviewScraperError(
      `Apify dataset fetch returned HTTP ${response.status}`,
      'APIFY_DATASET_ERROR',
    );
  }

  // Dataset items endpoint returns an array directly
  const data = (await response.json()) as ApifyReviewItem[] | ApifyDatasetResponse;

  if (Array.isArray(data)) {
    return data;
  }
  return data.items ?? [];
}

// --- Process Apify Results ---

function processApifyItems(
  items: ApifyReviewItem[],
  placeIds: string[],
): Map<string, PlaceReviewResult> {
  const resultsMap = new Map<string, PlaceReviewResult>();

  // Initialize empty results for all requested place IDs
  for (const placeId of placeIds) {
    resultsMap.set(placeId, {
      placeId,
      businessName: '',
      overallRating: 0,
      totalReviewCount: 0,
      scrapedReviewCount: 0,
      averageScrapedRating: 0,
      ratingDistribution: { one: 0, two: 0, three: 0, four: 0, five: 0 },
      recentReviews: [],
      reviewThemes: [],
      ownerResponseRate: 0,
      success: false,
    });
  }

  // Group items by place ID
  // Apify items may contain nested reviews per place, or flat review items
  for (const item of items) {
    const placeId = item.placeId ?? '';

    // Try to match to a requested place ID
    let matchedPlaceId: string | undefined;
    if (placeId && placeIds.includes(placeId)) {
      matchedPlaceId = placeId;
    } else {
      // If Apify doesn't include placeId, try to match by order or use first available
      // This is a known limitation — Apify output format varies by actor version
      matchedPlaceId = placeIds.find((id) => {
        const existing = resultsMap.get(id);
        return existing && !existing.success;
      });
    }

    if (!matchedPlaceId) continue;

    const existing = resultsMap.get(matchedPlaceId);
    if (!existing) continue;

    // Handle nested reviews format (place-level items with reviews array)
    if (item.reviews && Array.isArray(item.reviews)) {
      const parsedReviews: ScrapedReview[] = item.reviews.map((review) => ({
        authorName: review.name ?? '',
        rating: review.stars ?? 0,
        text: review.text ?? '',
        relativeTime: review.relativeTimeDescription,
        publishedAt: review.publishedAtDate ?? review.publishAt,
        likesCount: review.likesCount ?? 0,
        responseFromOwner: review.responseFromOwnerText,
      }));

      const ownerResponses = parsedReviews.filter((r) => r.responseFromOwner).length;
      const reviewsForRating = parsedReviews.map((r) => ({ rating: r.rating }));

      resultsMap.set(matchedPlaceId, {
        placeId: matchedPlaceId,
        businessName: item.name ?? item.title ?? '',
        overallRating: item.totalScore ?? 0,
        totalReviewCount: item.reviewsCount ?? parsedReviews.length,
        scrapedReviewCount: parsedReviews.length,
        averageScrapedRating: calculateAverageRating(reviewsForRating),
        ratingDistribution: calculateRatingDistribution(reviewsForRating),
        recentReviews: parsedReviews,
        reviewThemes: extractBasicThemes(
          parsedReviews.map((r) => ({ text: r.text, rating: r.rating })),
        ),
        ownerResponseRate: parsedReviews.length > 0
          ? Math.round((ownerResponses / parsedReviews.length) * 100) / 100
          : 0,
        success: true,
      });
    }
    // Handle flat review format (one item per review)
    else if (item.stars !== undefined || item.reviewText !== undefined) {
      const review: ScrapedReview = {
        authorName: item.reviewerName ?? '',
        rating: item.stars ?? 0,
        text: item.reviewText ?? '',
        relativeTime: item.relativeTimeDescription,
        publishedAt: item.publishedAtDate ?? item.publishAt,
        likesCount: item.likesCount ?? 0,
        responseFromOwner: item.responseFromOwnerText,
      };

      existing.recentReviews.push(review);
      existing.scrapedReviewCount = existing.recentReviews.length;
      existing.businessName = existing.businessName || item.name || item.title || '';
      existing.totalReviewCount = item.reviewsCount ?? existing.scrapedReviewCount;
      existing.overallRating = item.totalScore ?? existing.overallRating;
      existing.success = true;

      // Recalculate derived fields
      const reviewsForRating = existing.recentReviews.map((r) => ({ rating: r.rating }));
      existing.averageScrapedRating = calculateAverageRating(reviewsForRating);
      existing.ratingDistribution = calculateRatingDistribution(reviewsForRating);

      const ownerResponses = existing.recentReviews.filter((r) => r.responseFromOwner).length;
      existing.ownerResponseRate = existing.recentReviews.length > 0
        ? Math.round((ownerResponses / existing.recentReviews.length) * 100) / 100
        : 0;

      existing.reviewThemes = extractBasicThemes(
        existing.recentReviews.map((r) => ({ text: r.text, rating: r.rating })),
      );

      resultsMap.set(matchedPlaceId, existing);
    }
  }

  return resultsMap;
}

// --- Main Export ---

/**
 * Scrapes competitor Google Maps reviews using Apify's Google Maps Reviews Scraper actor.
 *
 * Accepts an array of Google Maps Place IDs, runs the Apify actor to extract reviews,
 * and returns structured data including:
 * - Rating and review count per place
 * - Rating distribution (1-5 stars)
 * - Recent review text and metadata
 * - Basic review themes (keyword-based; augment with LLM analysis in pipeline)
 * - Owner response rate
 *
 * The function starts an Apify actor run, polls for completion, then fetches
 * the dataset results. Gracefully handles API failures — returns partial data
 * with `success: false` and an `error` message instead of throwing.
 *
 * API credentials are passed as parameters, not read from process.env.
 *
 * @example
 * ```typescript
 * const result = await scrapeCompetitorReviews(
 *   ['ChIJ3aqq5Q1ZwokRb9hLO7Gyxgw', 'ChIJbf8C1yFxdDkR3n12P4DkKt0'],
 *   { apiToken: config.apifyApiToken, maxReviewsPerPlace: 50 },
 * );
 * ```
 */
export async function scrapeCompetitorReviews(
  placeIds: string[],
  options: {
    apiToken: string;
    maxReviewsPerPlace?: number;
    language?: string;
    sort?: 'newest' | 'most_relevant' | 'highest_rating' | 'lowest_rating';
    timeoutMs?: number;
  } = { apiToken: '' },
): Promise<ReviewScraperResult> {
  const {
    apiToken,
    maxReviewsPerPlace = 50,
    language = 'en',
    sort = 'newest',
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  const emptyResult: ReviewScraperResult = {
    places: [],
    totalPlacesRequested: placeIds.length,
    totalPlacesSucceeded: 0,
    totalReviewsScraped: 0,
    failedPlaces: [],
    success: false,
    scrapedAt: new Date(),
  };

  if (!apiToken) {
    return { ...emptyResult, error: 'Apify API token is not configured' };
  }

  if (!placeIds || placeIds.length === 0) {
    return { ...emptyResult, error: 'No Place IDs provided' };
  }

  // Filter out empty/invalid place IDs
  const validPlaceIds = placeIds.filter((id) => id && id.trim().length > 0);
  if (validPlaceIds.length === 0) {
    return { ...emptyResult, error: 'All provided Place IDs are empty or invalid' };
  }

  try {
    // Step 1: Start the Apify actor run
    const runResponse = await startActorRun(
      validPlaceIds,
      maxReviewsPerPlace,
      language,
      sort,
      apiToken,
      timeoutMs,
    );

    const runId = runResponse.data?.id;
    if (!runId) {
      return {
        ...emptyResult,
        error: `Apify actor run started but no run ID returned: ${runResponse.error?.message ?? 'Unknown error'}`,
      };
    }

    // Step 2: Poll for run completion
    const datasetId = await pollRunStatus(runId, apiToken, timeoutMs);
    if (!datasetId) {
      return {
        ...emptyResult,
        error: 'Apify actor run completed but no dataset ID returned',
      };
    }

    // Step 3: Fetch dataset items
    const items = await fetchDatasetItems(datasetId, apiToken, timeoutMs);

    // Step 4: Process results
    const resultsMap = processApifyItems(items, validPlaceIds);
    const places = Array.from(resultsMap.values());
    const failedPlaces: Array<{ placeId: string; error: string }> = [];

    for (const place of places) {
      if (!place.success) {
        failedPlaces.push({
          placeId: place.placeId,
          error: place.error ?? 'No review data found for this place',
        });
      }
    }

    const succeededCount = places.filter((p) => p.success).length;
    const totalReviews = places.reduce((sum, p) => sum + p.scrapedReviewCount, 0);

    return {
      places,
      totalPlacesRequested: validPlaceIds.length,
      totalPlacesSucceeded: succeededCount,
      totalReviewsScraped: totalReviews,
      failedPlaces,
      success: succeededCount > 0,
      scrapedAt: new Date(),
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const isTimeout = err instanceof Error && err.name === 'AbortError';

    // If this is a ReviewScraperError, it already has a meaningful message
    if (err instanceof ReviewScraperError) {
      return { ...emptyResult, error: errorMessage };
    }

    return {
      ...emptyResult,
      error: isTimeout
        ? `Apify review scraping timed out after ${timeoutMs}ms`
        : `Apify review scraping failed: ${errorMessage}`,
    };
  }
}

/**
 * Scrapes reviews for a single place. Convenience wrapper around
 * scrapeCompetitorReviews for when you only need one place.
 */
export async function scrapeSinglePlaceReviews(
  placeId: string,
  options: {
    apiToken: string;
    maxReviews?: number;
    language?: string;
    sort?: 'newest' | 'most_relevant' | 'highest_rating' | 'lowest_rating';
    timeoutMs?: number;
  } = { apiToken: '' },
): Promise<PlaceReviewResult> {
  const result = await scrapeCompetitorReviews([placeId], {
    apiToken: options.apiToken,
    maxReviewsPerPlace: options.maxReviews ?? 50,
    language: options.language,
    sort: options.sort,
    timeoutMs: options.timeoutMs,
  });

  // Return the first place result, or an error result
  if (result.places.length > 0) {
    return result.places[0];
  }

  return {
    placeId,
    businessName: '',
    overallRating: 0,
    totalReviewCount: 0,
    scrapedReviewCount: 0,
    averageScrapedRating: 0,
    ratingDistribution: { one: 0, two: 0, three: 0, four: 0, five: 0 },
    recentReviews: [],
    reviewThemes: [],
    ownerResponseRate: 0,
    success: false,
    error: result.error ?? 'No data returned for this place',
  };
}
