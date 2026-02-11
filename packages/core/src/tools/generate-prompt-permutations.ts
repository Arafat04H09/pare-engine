// Task 2.4: Prompt Permutation Engine
// Claude Haiku generates 10 query variations across 5 dimensions:
// specificity, urgency, constraint, comparison, conversational.
// Cost: ~$0.001 per generation.

import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Error Class
// ---------------------------------------------------------------------------

export class PromptPermutationError extends Error {
  readonly code = 'PROMPT_PERMUTATION_ERROR' as const;
  constructor(message: string) {
    super(message);
    this.name = 'PromptPermutationError';
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const PermutationDimensionSchema = z.enum([
  'specificity',
  'urgency',
  'constraint',
  'comparison',
  'conversational',
]);

export type PermutationDimension = z.infer<typeof PermutationDimensionSchema>;

export const ALL_DIMENSIONS: PermutationDimension[] = [
  'specificity', 'urgency', 'constraint', 'comparison', 'conversational',
];

export interface PromptPermutationInput {
  baseQuery: string;
  brand: string;
  vertical: string;
  location?: string;
  count?: number;
  anthropicApiKey: string;
}

export interface PermutedQuery {
  query: string;
  dimension: PermutationDimension;
  reasoning: string;
}

export interface PromptPermutationResult {
  baseQuery: string;
  permutations: PermutedQuery[];
  generatedAt: Date;
}

// ---------------------------------------------------------------------------
// LLM Schema
// ---------------------------------------------------------------------------

const PermutationResponseSchema = z.object({
  permutations: z.array(z.object({
    query: z.string().describe('The permuted query text'),
    dimension: PermutationDimensionSchema.describe('Which dimension this variation explores'),
    reasoning: z.string().describe('Brief explanation of what this variation tests'),
  })),
});

// ---------------------------------------------------------------------------
// Dimension Descriptions (for the prompt)
// ---------------------------------------------------------------------------

const DIMENSION_DESCRIPTIONS: Record<PermutationDimension, string> = {
  specificity: 'Vary the level of detail — from broad ("best dentist") to highly specific ("best pediatric dentist for kids with anxiety near downtown")',
  urgency: 'Add temporal urgency — "right now", "today", "emergency", "this weekend"',
  constraint: 'Add constraints — budget ("affordable", "under $200"), accessibility ("wheelchair accessible"), hours ("open late")',
  comparison: 'Frame as a comparison — "vs", "compared to", "better than", "alternative to"',
  conversational: 'Rephrase as natural conversation — "I need help finding...", "My friend recommended...", "What do you think about..."',
};

// ---------------------------------------------------------------------------
// Main Function
// ---------------------------------------------------------------------------

/**
 * Generate prompt permutations for a base query using Claude Haiku.
 * Creates 10 variations across 5 dimensions (2 per dimension by default).
 *
 * @param input - Base query, brand context, and API key
 * @returns PromptPermutationResult with permuted queries and metadata
 */
export async function generatePromptPermutations(
  input: PromptPermutationInput,
): Promise<PromptPermutationResult> {
  const count = input.count ?? 10;
  const perDimension = Math.ceil(count / ALL_DIMENSIONS.length);

  const dimensionInstructions = ALL_DIMENSIONS.map(d =>
    `- ${d}: ${DIMENSION_DESCRIPTIONS[d]}`
  ).join('\n');

  try {
    const { object } = await generateObject({
      model: anthropic('claude-haiku-4-5-20251001'),
      schema: PermutationResponseSchema,
      system: 'You are a query generation expert for AI engine monitoring. Generate natural, realistic search queries that real users would type into ChatGPT, Perplexity, or Gemini.',
      prompt: `Generate ${count} query permutations for the following base query.

Base query: "${input.baseQuery}"
Brand: ${input.brand}
Vertical: ${input.vertical}
${input.location ? `Location: ${input.location}` : ''}

Generate ${perDimension} variations for each of these 5 dimensions:
${dimensionInstructions}

Requirements:
- Each query should be a natural, complete question or request
- Vary the phrasing significantly — don't just add/remove one word
- Include the location naturally when relevant
- Don't mention the brand name in comparison queries (we want organic results)
- Queries should be 5-25 words each`,
    });

    return {
      baseQuery: input.baseQuery,
      permutations: object.permutations.slice(0, count).map(p => ({
        query: p.query,
        dimension: p.dimension,
        reasoning: p.reasoning,
      })),
      generatedAt: new Date(),
    };
  } catch (err) {
    throw new PromptPermutationError(
      `Failed to generate permutations: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Batch Helper
// ---------------------------------------------------------------------------

/**
 * Generate permutations for multiple base queries.
 * Uses Promise.allSettled for graceful degradation.
 *
 * @param queries - Array of base queries
 * @param input - Shared brand context and API key
 * @returns Array of results (successful) with failed queries logged
 */
export async function generatePermutationsBatch(
  queries: string[],
  input: Omit<PromptPermutationInput, 'baseQuery'>,
): Promise<{
  results: PromptPermutationResult[];
  failed: Array<{ query: string; error: string }>;
}> {
  const settled = await Promise.allSettled(
    queries.map(query =>
      generatePromptPermutations({ ...input, baseQuery: query })
    ),
  );

  const results: PromptPermutationResult[] = [];
  const failed: Array<{ query: string; error: string }> = [];

  for (let i = 0; i < settled.length; i++) {
    const result = settled[i];
    if (result.status === 'fulfilled') {
      results.push(result.value);
    } else {
      failed.push({
        query: queries[i],
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  }

  return { results, failed };
}
