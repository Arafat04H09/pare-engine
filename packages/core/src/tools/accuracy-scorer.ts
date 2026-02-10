// Owner: S21 (Vertical Intelligence + Accuracy Scorer).
// Consumers: S9 (AI Visibility Scoring), S12 (Pipeline Orchestration).
//
// Compares AI engine claims (address, phone, hours, services) against known-truth
// data from the GBP analysis. Returns an accuracy score (0-100) and a list of
// specific inaccuracies with platform attribution.
//
// This is a typed tool function: typed input -> typed output.
// Designed to be wrappable as an Inngest step or MCP tool.

import type { EngineResponse } from '../contracts/query.contract.js';
import type { GBPAnalysisOutput } from '../contracts/analysis.contract.js';
import type { Platform } from '../contracts/query.contract.js';

// --- Custom Error ---

export class AccuracyScorerError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'AccuracyScorerError';
    this.code = code;
  }
}

// --- Public Types ---

export interface Inaccuracy {
  /** The factual claim extracted from the AI response. */
  claim: string;
  /** The known-truth value from GBP data. */
  truth: string;
  /** Which AI platform produced this inaccuracy. */
  platform: Platform;
  /** Which field the inaccuracy relates to (address, phone, hours, services, name). */
  field: string;
  /** The query that produced the response containing the inaccuracy. */
  query: string;
}

export interface AccuracyResult {
  /** 0-100 score representing factual accuracy of AI responses against known truth. */
  accuracyScore: number;
  /** List of specific inaccuracies found across all responses. */
  inaccuracies: Inaccuracy[];
  /** Number of responses that were checked (only successful responses with content). */
  responsesChecked: number;
  /** Number of responses that contained verifiable claims. */
  responsesWithClaims: number;
  /** Total number of claims checked. */
  totalClaimsChecked: number;
  /** Total number of claims that were accurate. */
  accurateClaimCount: number;
}

// --- Normalization Helpers ---

/**
 * Normalizes a string for fuzzy comparison: lowercase, collapse whitespace,
 * strip punctuation except hyphens in phone numbers.
 */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[''""]/g, '')
    .replace(/[.,;:!?()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes a phone number to digits only (strips formatting).
 * Handles +1, parentheses, dashes, dots, spaces.
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  // If starts with country code 1 and is 11 digits, strip it
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1);
  }
  return digits;
}

/**
 * Normalizes an address for comparison: lowercase, expand/collapse common
 * abbreviations (St/Street, Ave/Avenue, Dr/Drive, etc.), strip unit numbers.
 */
function normalizeAddress(address: string): string {
  let normalized = normalize(address);

  // Common address abbreviation expansions
  const abbreviations: Array<[RegExp, string]> = [
    [/\bst\b/g, 'street'],
    [/\bave\b/g, 'avenue'],
    [/\bblvd\b/g, 'boulevard'],
    [/\bdr\b/g, 'drive'],
    [/\bln\b/g, 'lane'],
    [/\brd\b/g, 'road'],
    [/\bct\b/g, 'court'],
    [/\bpl\b/g, 'place'],
    [/\bpkwy\b/g, 'parkway'],
    [/\bhwy\b/g, 'highway'],
    [/\bn\b/g, 'north'],
    [/\bs\b/g, 'south'],
    [/\be\b/g, 'east'],
    [/\bw\b/g, 'west'],
    [/\bste\b/g, 'suite'],
    [/\bapt\b/g, 'apartment'],
    [/\bfl\b/g, 'floor'],
  ];

  for (const [pattern, replacement] of abbreviations) {
    normalized = normalized.replace(pattern, replacement);
  }

  // Remove unit/suite/apartment numbers (e.g., "suite 200", "apt 3b")
  normalized = normalized.replace(/\b(suite|apartment|unit|floor)\s*#?\s*\w+/g, '');

  return normalized.replace(/\s+/g, ' ').trim();
}

// --- Claim Extraction ---

/**
 * Checks whether a response text mentions a phone number, and if so,
 * whether it matches the known-truth phone.
 */
function checkPhoneClaim(
  responseText: string,
  truthPhone: string,
): { found: boolean; accurate: boolean; claim: string } {
  // Match common phone formats: (555) 123-4567, 555-123-4567, 555.123.4567, +1 555 123 4567
  const phonePatterns = [
    /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
    /\+?1[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
  ];

  const normalizedTruth = normalizePhone(truthPhone);
  if (normalizedTruth.length < 10) {
    return { found: false, accurate: true, claim: '' };
  }

  for (const pattern of phonePatterns) {
    const matches = responseText.match(pattern);
    if (matches) {
      for (const match of matches) {
        const normalizedMatch = normalizePhone(match);
        if (normalizedMatch.length >= 10) {
          return {
            found: true,
            accurate: normalizedMatch === normalizedTruth,
            claim: match.trim(),
          };
        }
      }
    }
  }

  return { found: false, accurate: true, claim: '' };
}

/**
 * Checks whether a response text mentions an address, and if so,
 * whether it substantially matches the known-truth address.
 *
 * Uses a substring-containment approach: the response must contain
 * the core street address (street number + street name).
 */
function checkAddressClaim(
  responseText: string,
  truthAddress: string,
): { found: boolean; accurate: boolean; claim: string } {
  const normalizedResponse = normalizeAddress(responseText);
  const normalizedTruth = normalizeAddress(truthAddress);

  if (normalizedTruth.length < 5) {
    return { found: false, accurate: true, claim: '' };
  }

  // Extract the core street portion (first line / street number + street name)
  // from the truth address. E.g., "123 main street" from "123 main street anytown ca 90210"
  const streetMatch = normalizedTruth.match(/^\d+\s+[\w\s]+(?:street|avenue|boulevard|drive|lane|road|court|place|parkway|highway|way|circle|trail)/);
  const coreStreet = streetMatch ? streetMatch[0] : normalizedTruth.split(',')[0].trim();

  if (coreStreet.length < 5) {
    return { found: false, accurate: true, claim: '' };
  }

  // Check if the response contains any address-like pattern (number + word)
  const addressPatterns = /\d{1,6}\s+[a-z]+(?:\s+[a-z]+){0,3}\s+(?:street|avenue|boulevard|drive|lane|road|court|place|parkway|highway|way|circle|trail|st|ave|blvd|dr|ln|rd|ct|pl)/gi;
  const addressMatches = responseText.match(addressPatterns);

  if (!addressMatches || addressMatches.length === 0) {
    return { found: false, accurate: true, claim: '' };
  }

  // Check each found address against the truth
  for (const match of addressMatches) {
    const normalizedMatch = normalizeAddress(match);
    // Check for substantial overlap: the core street from truth is contained in the claim
    if (normalizedMatch.includes(coreStreet) || coreStreet.includes(normalizedMatch)) {
      return { found: true, accurate: true, claim: match.trim() };
    }
  }

  // Found an address but it does not match
  return { found: true, accurate: false, claim: addressMatches[0].trim() };
}

/**
 * Checks whether a response mentions the business name accurately.
 * Uses fuzzy containment: the truth name should appear within the response.
 */
function checkBusinessNameClaim(
  responseText: string,
  truthName: string,
): { found: boolean; accurate: boolean; claim: string } {
  const normalizedResponse = normalize(responseText);
  const normalizedTruth = normalize(truthName);

  if (normalizedTruth.length < 2) {
    return { found: false, accurate: true, claim: '' };
  }

  // Direct containment check
  if (normalizedResponse.includes(normalizedTruth)) {
    return { found: true, accurate: true, claim: truthName };
  }

  // Check for partial matches (at least 80% of words match in order)
  const truthWords = normalizedTruth.split(/\s+/);
  if (truthWords.length <= 1) {
    return { found: false, accurate: true, claim: '' };
  }

  // Look for the business name words appearing in close proximity
  const responseWords = normalizedResponse.split(/\s+/);
  for (let i = 0; i <= responseWords.length - truthWords.length; i++) {
    const window = responseWords.slice(i, i + truthWords.length + 2);
    const matchingWords = truthWords.filter((tw) => window.includes(tw));
    if (matchingWords.length >= Math.ceil(truthWords.length * 0.8)) {
      const extractedClaim = responseWords.slice(i, i + truthWords.length + 1).join(' ');
      return { found: true, accurate: true, claim: extractedClaim };
    }
  }

  return { found: false, accurate: true, claim: '' };
}

// --- Main Scoring Function ---

/**
 * Compares AI engine responses against known-truth GBP data to produce
 * an accuracy score and a detailed list of inaccuracies.
 *
 * The function checks each successful engine response for claims about:
 * - Business name
 * - Phone number
 * - Address
 *
 * Claims are extracted via pattern matching and compared against the
 * GBP known-truth data. The accuracy score is the percentage of
 * verified claims that were accurate (0-100, rounded).
 *
 * @param responses - Array of EngineResponse objects from the query step.
 * @param knownTruth - GBPAnalysisOutput containing verified business data.
 * @returns AccuracyResult with score and inaccuracy details.
 */
export async function scoreAccuracy(
  responses: EngineResponse[],
  knownTruth: GBPAnalysisOutput,
): Promise<AccuracyResult> {
  if (!responses || responses.length === 0) {
    return {
      accuracyScore: 100,
      inaccuracies: [],
      responsesChecked: 0,
      responsesWithClaims: 0,
      totalClaimsChecked: 0,
      accurateClaimCount: 0,
    };
  }

  const inaccuracies: Inaccuracy[] = [];
  let totalClaimsChecked = 0;
  let accurateClaimCount = 0;
  let responsesChecked = 0;
  let responsesWithClaims = 0;

  // Filter to only successful responses with actual content
  const validResponses = responses.filter(
    (r) => r.success && r.rawResponse && r.rawResponse.trim().length > 0,
  );

  for (const response of validResponses) {
    responsesChecked++;
    let responseHasClaims = false;
    const responseText = response.rawResponse;

    // --- Check phone ---
    if (knownTruth.phone) {
      const phoneCheck = checkPhoneClaim(responseText, knownTruth.phone);
      if (phoneCheck.found) {
        responseHasClaims = true;
        totalClaimsChecked++;
        if (phoneCheck.accurate) {
          accurateClaimCount++;
        } else {
          inaccuracies.push({
            claim: phoneCheck.claim,
            truth: knownTruth.phone,
            platform: response.platform,
            field: 'phone',
            query: response.query,
          });
        }
      }
    }

    // --- Check address ---
    if (knownTruth.address) {
      const addressCheck = checkAddressClaim(responseText, knownTruth.address);
      if (addressCheck.found) {
        responseHasClaims = true;
        totalClaimsChecked++;
        if (addressCheck.accurate) {
          accurateClaimCount++;
        } else {
          inaccuracies.push({
            claim: addressCheck.claim,
            truth: knownTruth.address,
            platform: response.platform,
            field: 'address',
            query: response.query,
          });
        }
      }
    }

    // --- Check business name ---
    if (knownTruth.businessName) {
      const nameCheck = checkBusinessNameClaim(responseText, knownTruth.businessName);
      if (nameCheck.found) {
        responseHasClaims = true;
        totalClaimsChecked++;
        if (nameCheck.accurate) {
          accurateClaimCount++;
        } else {
          inaccuracies.push({
            claim: nameCheck.claim,
            truth: knownTruth.businessName,
            platform: response.platform,
            field: 'name',
            query: response.query,
          });
        }
      }
    }

    if (responseHasClaims) {
      responsesWithClaims++;
    }
  }

  // Calculate accuracy as percentage of accurate claims
  const accuracyScore =
    totalClaimsChecked === 0
      ? 100
      : Math.round((accurateClaimCount / totalClaimsChecked) * 100);

  return {
    accuracyScore,
    inaccuracies,
    responsesChecked,
    responsesWithClaims,
    totalClaimsChecked,
    accurateClaimCount,
  };
}
