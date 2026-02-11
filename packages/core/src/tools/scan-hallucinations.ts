// Task 3.1: Hallucination Scanner
// Detects factual inaccuracies in AI engine responses about a brand:
// - Temporal conflicts (wrong hours, outdated info)
// - Price conflicts (wrong prices)
// - Location errors (wrong address)
// - Broken links (404 pages cited)
// - Attribution errors (claims attributed to wrong source)

import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import type { Hallucination } from '../contracts/analysis.contract.js';
import type { EngineResponse } from '../contracts/query.contract.js';

// ---------------------------------------------------------------------------
// Error Class
// ---------------------------------------------------------------------------

export class HallucinationScanError extends Error {
  readonly code = 'HALLUCINATION_SCAN_ERROR' as const;
  constructor(message: string) {
    super(message);
    this.name = 'HallucinationScanError';
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HallucinationScanInput {
  brand: string;
  domain: string;
  responses: EngineResponse[];
  knownFacts?: {
    address?: string;
    phone?: string;
    hours?: string;
    priceRange?: string;
  };
  anthropicApiKey: string;
}

export interface HallucinationScanResult {
  hallucinations: Hallucination[];
  totalResponsesScanned: number;
  hallucinationRate: number;
  summary: string;
  scannedAt: Date;
}

// ---------------------------------------------------------------------------
// LLM Schema
// ---------------------------------------------------------------------------

const HallucinationDetectionSchema = z.object({
  hallucinations: z.array(z.object({
    type: z.enum(['temporal', 'price', 'location', 'broken_link', 'attribution']),
    claim: z.string().describe('The specific claim that may be inaccurate'),
    severity: z.enum(['high', 'medium', 'low']),
    explanation: z.string().describe('Why this claim is potentially inaccurate'),
  })),
});

// ---------------------------------------------------------------------------
// Main Function
// ---------------------------------------------------------------------------

/**
 * Scan AI engine responses for hallucinations about the brand.
 * Uses Claude Haiku to detect factual inaccuracies.
 *
 * @param input - Brand info, engine responses, and optional known facts for verification
 * @returns HallucinationScanResult with detected issues and rate
 */
export async function scanHallucinations(
  input: HallucinationScanInput,
): Promise<HallucinationScanResult> {
  const successfulResponses = input.responses.filter(r => r.success && r.rawResponse.length > 0);

  if (successfulResponses.length === 0) {
    return {
      hallucinations: [],
      totalResponsesScanned: 0,
      hallucinationRate: 0,
      summary: 'No successful responses to scan.',
      scannedAt: new Date(),
    };
  }

  const allHallucinations: Hallucination[] = [];

  // Scan each response
  const scanResults = await Promise.allSettled(
    successfulResponses.map(async (response) => {
      const knownFactsStr = input.knownFacts
        ? `Known facts about ${input.brand}:
- Address: ${input.knownFacts.address ?? 'Unknown'}
- Phone: ${input.knownFacts.phone ?? 'Unknown'}
- Hours: ${input.knownFacts.hours ?? 'Unknown'}
- Price range: ${input.knownFacts.priceRange ?? 'Unknown'}`
        : `No verified facts available for ${input.brand}. Flag any specific claims that sound fabricated or outdated.`;

      const { object } = await generateObject({
        model: anthropic('claude-haiku-4-5-20251001'),
        schema: HallucinationDetectionSchema,
        system: 'You are a factual accuracy scanner. Identify potential hallucinations, fabricated details, or outdated information in AI-generated responses about a business. Only flag claims that are specific and verifiable — ignore vague or opinion-based statements.',
        prompt: `Scan this AI response about "${input.brand}" (${input.domain}) for potential hallucinations:

Platform: ${response.platform}
Query: "${response.query}"
Response: "${response.rawResponse}"

${knownFactsStr}

Identify any specific factual claims that appear to be:
1. Temporal conflicts (wrong hours, dates, "recently" claims)
2. Price conflicts (specific dollar amounts that may be wrong)
3. Location errors (wrong address, directions, or area)
4. Broken references (URLs or sources that may not exist)
5. Attribution errors (claims attributed to wrong entities)

Only flag high-confidence issues. Return an empty array if the response appears factually sound.`,
      });

      return object.hallucinations.map(h => ({
        ...h,
        source: `${response.platform}: "${response.query}"`,
      }));
    }),
  );

  for (const result of scanResults) {
    if (result.status === 'fulfilled') {
      allHallucinations.push(...result.value);
    }
  }

  // Deduplicate similar hallucinations
  const uniqueHallucinations = deduplicateHallucinations(allHallucinations);

  const hallucinationRate = successfulResponses.length > 0
    ? uniqueHallucinations.length / successfulResponses.length : 0;

  const highCount = uniqueHallucinations.filter(h => h.severity === 'high').length;
  const summary = uniqueHallucinations.length === 0
    ? `No hallucinations detected across ${successfulResponses.length} responses.`
    : `Found ${uniqueHallucinations.length} potential hallucination(s) across ${successfulResponses.length} responses. ${highCount} high severity.`;

  return {
    hallucinations: uniqueHallucinations,
    totalResponsesScanned: successfulResponses.length,
    hallucinationRate: Math.round(hallucinationRate * 100) / 100,
    summary,
    scannedAt: new Date(),
  };
}

/**
 * Deduplicate hallucinations with similar claims.
 */
function deduplicateHallucinations(hallucinations: Hallucination[]): Hallucination[] {
  const seen = new Set<string>();
  const unique: Hallucination[] = [];

  for (const h of hallucinations) {
    const key = `${h.type}:${h.claim.toLowerCase().slice(0, 50)}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(h);
    }
  }

  return unique;
}
