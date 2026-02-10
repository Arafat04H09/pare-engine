// Owner: S8 (GBP/Local Scoring). Consumer: S12 (Pipeline Orchestration).
// Typed tool function for fetching Google Business Profile data via Google Places API (New).
// Uses the Places API (New) — https://developers.google.com/maps/documentation/places/web-service/op-overview
// Typed input -> typed output. Designed to be wrappable as an Inngest step.

export class GooglePlacesError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'GooglePlacesError';
    this.code = code;
  }
}

// --- API Response Types (Places API New) ---

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
  addressComponents?: Array<{
    longText: string;
    shortText: string;
    types: string[];
  }>;
}

// --- Public Output Type ---

export interface GooglePlacesResult {
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
  reviews: PlaceReviewSummary[];
  businessStatus: string | null;
  googleMapsUri: string | null;
  error?: string;
}

export interface PlaceReviewSummary {
  rating: number;
  text: string;
  authorName: string | null;
  relativeTime: string | null;
}

// --- Constants ---

const PLACES_API_BASE = 'https://places.googleapis.com/v1/places';

// Fields we request from the Places API (New). Billing is per-field-mask group.
// Basic fields (no charge): id, displayName, types, primaryType, primaryTypeDisplayName
// Contact fields: nationalPhoneNumber, internationalPhoneNumber, websiteUri, regularOpeningHours
// Atmosphere fields: rating, userRatingCount, reviews, photos, editorialSummary
// Location fields: formattedAddress, shortFormattedAddress, addressComponents, googleMapsUri
const FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'shortFormattedAddress',
  'addressComponents',
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

// --- Helper Functions ---

function parseReviews(reviews: PlaceReview[] | undefined): PlaceReviewSummary[] {
  if (!reviews || reviews.length === 0) return [];
  return reviews.map((review) => ({
    rating: review.rating ?? 0,
    text: review.originalText?.text ?? review.text?.text ?? '',
    authorName: review.authorAttribution?.displayName ?? null,
    relativeTime: review.relativePublishTimeDescription ?? null,
  }));
}

function checkHoursComplete(hours: PlaceOpeningHours | undefined): boolean {
  if (!hours) return false;
  const periods = hours.periods;
  if (!periods || periods.length === 0) return false;
  // A complete schedule has entries for all 7 days of the week (even if some are the same)
  const daysWithHours = new Set(periods.map((p) => p.open.day));
  return daysWithHours.size >= 7;
}

function extractCategories(types: string[] | undefined, primaryType: string | undefined): string[] {
  if (!types || types.length === 0) return [];
  // Filter out the primary type and generic types
  const genericTypes = new Set([
    'point_of_interest',
    'establishment',
    'political',
    'locality',
    'sublocality',
    'route',
    'street_address',
    'floor',
    'room',
    'geocode',
  ]);
  return types.filter((t) => t !== primaryType && !genericTypes.has(t));
}

// --- Fetch Place Details ---

export async function fetchGBPData(
  placeId: string,
  options: { apiKey: string; timeoutMs?: number } = { apiKey: '' },
): Promise<GooglePlacesResult> {
  const { apiKey, timeoutMs = 15000 } = options;

  const emptyResult: GooglePlacesResult = {
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
    reviews: [],
    businessStatus: null,
    googleMapsUri: null,
  };

  if (!apiKey) {
    return { ...emptyResult, error: 'Google Places API key is not configured' };
  }

  if (!placeId || placeId.trim().length === 0) {
    return { ...emptyResult, error: 'Place ID is empty or not provided' };
  }

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
      return {
        ...emptyResult,
        error: `Google Places API returned HTTP ${response.status}: ${response.statusText}. ${errorBody}`,
      };
    }

    const data = (await response.json()) as PlaceDetailsResponse;

    const primaryType = data.primaryTypeDisplayName?.text
      ?? data.primaryType
      ?? null;

    const additionalCategories = extractCategories(data.types, data.primaryType);

    const hasDescription = Boolean(
      data.editorialSummary?.text && data.editorialSummary.text.length > 0,
    );

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
      reviews: parseReviews(data.reviews),
      businessStatus: data.businessStatus ?? null,
      googleMapsUri: data.googleMapsUri ?? null,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return {
      ...emptyResult,
      error: isTimeout
        ? `Google Places API request timed out after ${timeoutMs}ms`
        : `Google Places API request failed: ${errorMessage}`,
    };
  }
}

// --- Text Search (fallback when no Place ID is provided) ---

interface TextSearchResponse {
  places?: PlaceDetailsResponse[];
}

export async function searchPlace(
  businessName: string,
  location: string,
  options: { apiKey: string; timeoutMs?: number } = { apiKey: '' },
): Promise<GooglePlacesResult> {
  const { apiKey, timeoutMs = 15000 } = options;

  const emptyResult: GooglePlacesResult = {
    success: false,
    placeId: '',
    businessName,
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
    reviews: [],
    businessStatus: null,
    googleMapsUri: null,
  };

  if (!apiKey) {
    return { ...emptyResult, error: 'Google Places API key is not configured' };
  }

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
      return {
        ...emptyResult,
        error: `Google Places Text Search returned HTTP ${response.status}: ${response.statusText}. ${errorBody}`,
      };
    }

    const data = (await response.json()) as TextSearchResponse;

    if (!data.places || data.places.length === 0) {
      return { ...emptyResult, error: 'No places found matching the search query' };
    }

    const place = data.places[0];
    const foundPlaceId = place.id ?? '';

    // If we found a place, fetch its full details
    if (foundPlaceId) {
      return await fetchGBPData(foundPlaceId, { apiKey, timeoutMs });
    }

    return { ...emptyResult, error: 'Place found but missing Place ID' };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return {
      ...emptyResult,
      error: isTimeout
        ? `Google Places Text Search timed out after ${timeoutMs}ms`
        : `Google Places Text Search failed: ${errorMessage}`,
    };
  }
}
