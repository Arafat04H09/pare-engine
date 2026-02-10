// Owner: S8 (GBP/Local Scoring). Consumer: S12 (Pipeline Orchestration).
// Inngest-compatible step function that fetches GBP data and produces GBPAnalysisOutput.
// Google Places API logic is duplicated from packages/core/src/tools/google-places.ts
// because the core package does not yet export a ./tools/* subpath.
// Once the subpath export is added, this can import from @pare-engine/core/tools/google-places.

import {
  GBPAnalysisOutputSchema,
  type GBPAnalysisOutput,
  type CrawledPage,
} from '@pare-engine/core/contracts';

// --- Error Class ---

export class GBPAnalysisError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'GBPAnalysisError';
    this.code = code;
  }
}

// --- Google Places API Types (duplicated from core/tools/google-places.ts) ---

interface PlacePhoto {
  name: string;
  widthPx?: number;
  heightPx?: number;
}

interface PlaceReview {
  name?: string;
  rating?: number;
  text?: { text: string; languageCode?: string };
  relativePublishTimeDescription?: string;
  originalText?: { text: string };
  authorAttribution?: { displayName?: string; uri?: string };
}

interface PlaceOpeningHours {
  openNow?: boolean;
  periods?: Array<{
    open: { day: number; hour: number; minute: number };
    close?: { day: number; hour: number; minute: number };
  }>;
  weekdayDescriptions?: string[];
}

interface PlaceDetailsResponse {
  id?: string;
  displayName?: { text: string; languageCode?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  photos?: PlacePhoto[];
  reviews?: PlaceReview[];
  types?: string[];
  primaryType?: string;
  primaryTypeDisplayName?: { text: string };
  editorialSummary?: { text: string };
  regularOpeningHours?: PlaceOpeningHours;
  currentOpeningHours?: PlaceOpeningHours;
  businessStatus?: string;
  googleMapsUri?: string;
  shortFormattedAddress?: string;
}

interface TextSearchResponse {
  places?: PlaceDetailsResponse[];
}

interface GooglePlacesResult {
  success: boolean;
  placeId: string;
  businessName: string;
  formattedAddress: string | null;
  phone: string | null;
  websiteUrl: string | null;
  rating: number;
  reviewCount: number;
  photoCount: number;
  hasDescription: boolean;
  description: string | null;
  primaryCategory: string | null;
  additionalCategories: string[];
  hasHours: boolean;
  hoursComplete: boolean;
  businessStatus: string | null;
  error?: string;
}

// --- Constants ---

const PLACES_API_BASE = 'https://places.googleapis.com/v1/places';

const FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'shortFormattedAddress',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'websiteUri',
  'rating',
  'userRatingCount',
  'photos',
  'reviews',
  'types',
  'primaryType',
  'primaryTypeDisplayName',
  'editorialSummary',
  'regularOpeningHours',
  'currentOpeningHours',
  'businessStatus',
  'googleMapsUri',
].join(',');

// --- Google Places API Helpers ---

function checkHoursComplete(hours: PlaceOpeningHours | undefined): boolean {
  if (!hours) return false;
  const periods = hours.periods;
  if (!periods || periods.length === 0) return false;
  const daysWithHours = new Set(periods.map((p) => p.open.day));
  return daysWithHours.size >= 7;
}

function extractAdditionalCategories(types: string[] | undefined, primaryType: string | undefined): string[] {
  if (!types || types.length === 0) return [];
  const genericTypes = new Set([
    'point_of_interest', 'establishment', 'political', 'locality',
    'sublocality', 'route', 'street_address', 'floor', 'room', 'geocode',
  ]);
  return types.filter((t) => t !== primaryType && !genericTypes.has(t));
}

function buildEmptyResult(placeId: string, error: string): GooglePlacesResult {
  return {
    success: false,
    placeId,
    businessName: '',
    formattedAddress: null,
    phone: null,
    websiteUrl: null,
    rating: 0,
    reviewCount: 0,
    photoCount: 0,
    hasDescription: false,
    description: null,
    primaryCategory: null,
    additionalCategories: [],
    hasHours: false,
    hoursComplete: false,
    businessStatus: null,
    error,
  };
}

async function fetchGBPData(
  placeId: string,
  apiKey: string,
  timeoutMs: number = 15000,
): Promise<GooglePlacesResult> {
  if (!apiKey) return buildEmptyResult(placeId, 'Google Places API key is not configured');
  if (!placeId || placeId.trim().length === 0) return buildEmptyResult('', 'Place ID is empty or not provided');

  try {
    const url = `${PLACES_API_BASE}/${placeId}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': FIELD_MASK,
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      return buildEmptyResult(placeId, `Google Places API returned HTTP ${response.status}: ${response.statusText}. ${errorBody}`);
    }

    const data = (await response.json()) as PlaceDetailsResponse;
    const primaryType = data.primaryTypeDisplayName?.text ?? data.primaryType ?? null;
    const additionalCategories = extractAdditionalCategories(data.types, data.primaryType);
    const hasDescription = Boolean(data.editorialSummary?.text && data.editorialSummary.text.length > 0);
    const hours = data.regularOpeningHours ?? data.currentOpeningHours;

    return {
      success: true,
      placeId: data.id ?? placeId,
      businessName: data.displayName?.text ?? '',
      formattedAddress: data.formattedAddress ?? data.shortFormattedAddress ?? null,
      phone: data.nationalPhoneNumber ?? data.internationalPhoneNumber ?? null,
      websiteUrl: data.websiteUri ?? null,
      rating: data.rating ?? 0,
      reviewCount: data.userRatingCount ?? 0,
      photoCount: data.photos?.length ?? 0,
      hasDescription,
      description: data.editorialSummary?.text ?? null,
      primaryCategory: primaryType,
      additionalCategories,
      hasHours: Boolean(hours),
      hoursComplete: checkHoursComplete(hours),
      businessStatus: data.businessStatus ?? null,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return buildEmptyResult(placeId, isTimeout
      ? `Google Places API request timed out after ${timeoutMs}ms`
      : `Google Places API request failed: ${errorMessage}`);
  }
}

async function searchPlace(
  businessName: string,
  location: string,
  apiKey: string,
  timeoutMs: number = 15000,
): Promise<GooglePlacesResult> {
  if (!apiKey) return buildEmptyResult('', 'Google Places API key is not configured');

  try {
    const searchUrl = `${PLACES_API_BASE}:searchText`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const query = `${businessName} ${location}`.trim();

    let response: Response;
    try {
      response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': `places.${FIELD_MASK.split(',').join(',places.')}`,
        },
        body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      return buildEmptyResult('', `Google Places Text Search returned HTTP ${response.status}: ${response.statusText}. ${errorBody}`);
    }

    const data = (await response.json()) as TextSearchResponse;
    if (!data.places || data.places.length === 0) {
      return buildEmptyResult('', 'No places found matching the search query');
    }

    const foundPlaceId = data.places[0].id ?? '';
    if (foundPlaceId) {
      return await fetchGBPData(foundPlaceId, apiKey, timeoutMs);
    }
    return buildEmptyResult('', 'Place found but missing Place ID');
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return buildEmptyResult('', isTimeout
      ? `Google Places Text Search timed out after ${timeoutMs}ms`
      : `Google Places Text Search failed: ${errorMessage}`);
  }
}

// --- NAP Extraction Helpers ---

function normalizeForComparison(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[.,\-()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fuzzyMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const na = normalizeForComparison(a);
  const nb = normalizeForComparison(b);
  if (na === nb) return true;
  if (na.length > 3 && nb.length > 3) {
    if (na.includes(nb) || nb.includes(na)) return true;
  }
  return false;
}

function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.substring(1);
  }
  return digits;
}

function phonesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  if (!na || !nb) return false;
  return na === nb;
}

interface ExtractedNAP {
  source: string;
  name: string | null;
  address: string | null;
  phone: string | null;
}

function extractNAPFromPages(pages: CrawledPage[], domain: string): ExtractedNAP[] {
  const results: ExtractedNAP[] = [];

  const directoryPatterns = [
    { pattern: /yelp\.com/i, source: 'Yelp' },
    { pattern: /bbb\.org/i, source: 'BBB' },
    { pattern: /yellowpages\.com/i, source: 'Yellow Pages' },
    { pattern: /tripadvisor\.com/i, source: 'TripAdvisor' },
    { pattern: /facebook\.com/i, source: 'Facebook' },
    { pattern: /nextdoor\.com/i, source: 'Nextdoor' },
    { pattern: /mapquest\.com/i, source: 'MapQuest' },
    { pattern: /foursquare\.com/i, source: 'Foursquare' },
    { pattern: /angieslist\.com|angi\.com/i, source: 'Angi' },
    { pattern: /healthgrades\.com/i, source: 'Healthgrades' },
    { pattern: /avvo\.com/i, source: 'Avvo' },
    { pattern: /zocdoc\.com/i, source: 'Zocdoc' },
  ];

  const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

  for (const page of pages) {
    const pageUrl = page.url.toLowerCase();
    const domainNormalized = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();
    if (pageUrl.includes(domainNormalized)) continue;

    for (const dp of directoryPatterns) {
      if (dp.pattern.test(pageUrl)) {
        const phones = page.markdown.match(phoneRegex);
        results.push({
          source: dp.source,
          name: page.title ?? null,
          address: null,
          phone: phones?.[0] ?? null,
        });
        break;
      }
    }
  }

  return results;
}

// --- Description Optimization Check ---

function isDescriptionOptimized(description: string | null): boolean {
  if (!description) return false;
  if (description.length < 150) return false;
  const hasMultipleSentences = description.split(/[.!?]/).filter((s) => s.trim().length > 10).length >= 2;
  return hasMultipleSentences;
}

// --- Core Analysis Function ---

export async function analyzeGBP(
  gbpData: GooglePlacesResult,
  domain: string,
  crawlPages?: CrawledPage[],
): Promise<GBPAnalysisOutput> {
  const descriptionOptimized = isDescriptionOptimized(gbpData.description);
  const categoryAccuracy = Boolean(gbpData.primaryCategory && gbpData.primaryCategory.length > 0);

  const extractedNAP = crawlPages ? extractNAPFromPages(crawlPages, domain) : [];

  const napSources = extractedNAP.map((nap) => ({
    source: nap.source,
    nameMatch: fuzzyMatch(nap.name, gbpData.businessName),
    addressMatch: fuzzyMatch(nap.address, gbpData.formattedAddress),
    phoneMatch: phonesMatch(nap.phone, gbpData.phone),
  }));

  const napConsistent = napSources.length > 0
    ? napSources.every((s) => s.nameMatch && s.addressMatch && s.phoneMatch)
    : Boolean(gbpData.businessName && gbpData.formattedAddress && gbpData.phone);

  const output: GBPAnalysisOutput = {
    placeId: gbpData.placeId || undefined,
    businessName: gbpData.businessName,
    rating: gbpData.rating,
    reviewCount: gbpData.reviewCount,
    photoCount: gbpData.photoCount,
    hasDescription: gbpData.hasDescription,
    descriptionOptimized,
    categoryAccuracy,
    primaryCategory: gbpData.primaryCategory ?? undefined,
    additionalCategories: gbpData.additionalCategories,
    hasQAndA: false, // Q&A not available via Places API (New)
    hoursComplete: gbpData.hoursComplete,
    websiteUrl: gbpData.websiteUrl ?? undefined,
    phone: gbpData.phone ?? undefined,
    address: gbpData.formattedAddress ?? undefined,
    napConsistent,
    napSources,
    analyzedAt: new Date(),
  };

  return GBPAnalysisOutputSchema.parse(output);
}

// --- No-GBP Fallback ---

export function createEmptyGBPAnalysis(businessName: string): GBPAnalysisOutput {
  return GBPAnalysisOutputSchema.parse({
    placeId: undefined,
    businessName,
    rating: 0,
    reviewCount: 0,
    photoCount: 0,
    hasDescription: false,
    descriptionOptimized: false,
    categoryAccuracy: false,
    primaryCategory: undefined,
    additionalCategories: [],
    hasQAndA: false,
    hoursComplete: false,
    websiteUrl: undefined,
    phone: undefined,
    address: undefined,
    napConsistent: false,
    napSources: [],
    analyzedAt: new Date(),
  });
}

// --- Inngest Step Entry Point ---

export interface GBPStepInput {
  businessName: string;
  domain: string;
  googlePlaceId?: string;
  city?: string;
  state?: string;
  googlePlacesApiKey?: string;
  crawlPages?: CrawledPage[];
}

/**
 * Inngest-compatible step function for GBP analysis.
 *
 * Flow:
 * 1. If googlePlaceId is provided, fetch GBP data directly
 * 2. If not, try a text search using businessName + city/state
 * 3. If no API key is configured, return empty analysis
 * 4. Analyze the GBP data and return GBPAnalysisOutput
 *
 * Follows graceful degradation: never throws on API failures.
 */
export async function executeGBPAnalysisStep(
  input: GBPStepInput,
): Promise<GBPAnalysisOutput> {
  const {
    businessName,
    domain,
    googlePlaceId,
    city,
    state,
    googlePlacesApiKey,
    crawlPages,
  } = input;

  if (!googlePlacesApiKey) {
    return createEmptyGBPAnalysis(businessName);
  }

  try {
    let gbpData: GooglePlacesResult;

    if (googlePlaceId) {
      gbpData = await fetchGBPData(googlePlaceId, googlePlacesApiKey);
    } else {
      const location = [city, state].filter(Boolean).join(', ');
      gbpData = await searchPlace(businessName, location, googlePlacesApiKey);
    }

    if (!gbpData.success) {
      return createEmptyGBPAnalysis(businessName);
    }

    return await analyzeGBP(gbpData, domain, crawlPages);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new GBPAnalysisError(
      `GBP analysis of ${businessName} failed: ${msg}`,
      'GBP_ANALYSIS_FAILED',
    );
  }
}
