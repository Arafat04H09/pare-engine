// Task 3.3: Persona-Driven Audit
// Claude Haiku generates user personas, then wraps queries with persona context.
// MUST VALIDATE: Do results actually differ across personas?
// Cost control: Top 5 queries only.

import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Error Class
// ---------------------------------------------------------------------------

export class PersonaGenerationError extends Error {
  readonly code = 'PERSONA_GENERATION_ERROR' as const;
  constructor(message: string) {
    super(message);
    this.name = 'PersonaGenerationError';
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PersonaConfig {
  name: string;
  description: string;
  searchStyle: string;
  topConcerns: string[];
}

export interface PersonaQuery {
  persona: PersonaConfig;
  originalQuery: string;
  wrappedQuery: string;
}

export interface PersonaGenerationInput {
  vertical: string;
  location?: string;
  count?: number;
  anthropicApiKey: string;
}

export interface PersonaGenerationResult {
  personas: PersonaConfig[];
  generatedAt: Date;
}

export interface PersonaQueryWrapResult {
  queries: PersonaQuery[];
  totalCombinations: number;
}

export interface PersonaDivergenceResult {
  divergent: boolean;
  divergenceRate: number;
  summary: string;
}

// ---------------------------------------------------------------------------
// LLM Schema
// ---------------------------------------------------------------------------

const PersonaResponseSchema = z.object({
  personas: z.array(z.object({
    name: z.string().describe('Short persona name, e.g., "Budget Mom"'),
    description: z.string().describe('One-sentence persona description'),
    searchStyle: z.string().describe('How this persona phrases search queries'),
    topConcerns: z.array(z.string()).describe('Top 3 concerns when choosing a provider'),
  })),
});

// ---------------------------------------------------------------------------
// Persona Generation
// ---------------------------------------------------------------------------

/**
 * Generate user personas for a vertical using Claude Haiku.
 *
 * @param input - Vertical, optional location, count (default 5)
 * @returns Array of PersonaConfig with diverse user archetypes
 */
export async function generatePersonas(
  input: PersonaGenerationInput,
): Promise<PersonaGenerationResult> {
  const count = input.count ?? 5;

  const { object } = await generateObject({
    model: anthropic('claude-haiku-4-5-20251001'),
    schema: PersonaResponseSchema,
    system: 'You are a market research expert. Generate diverse, realistic user personas that represent different customer segments for a local business vertical.',
    prompt: `Generate ${count} diverse user personas for the "${input.vertical}" vertical${input.location ? ` in ${input.location}` : ''}.

Each persona should represent a distinct customer segment with:
- Different search behaviors (some use conversational queries, some use keyword-based)
- Different priorities (price, quality, convenience, reviews, specialization)
- Different demographics (age ranges, income levels, urgency levels)

Make them realistic and distinct from each other. Examples of good persona names: "Budget-Conscious Parent", "Luxury Seeker", "Emergency Need", "Research-First Professional", "Senior Citizen".`,
  });

  return {
    personas: object.personas.slice(0, count).map(p => ({
      name: p.name,
      description: p.description,
      searchStyle: p.searchStyle,
      topConcerns: p.topConcerns,
    })),
    generatedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// Query Wrapping
// ---------------------------------------------------------------------------

/**
 * Wrap base queries with persona context for AI engine queries.
 * Cost control: Only uses top 5 queries.
 *
 * @param baseQueries - Original audit queries (top 5 used)
 * @param personas - Generated personas
 * @returns Array of PersonaQuery with wrapped prompts
 */
export function wrapQueriesWithPersonas(
  baseQueries: string[],
  personas: PersonaConfig[],
): PersonaQueryWrapResult {
  // Cost control: top 5 queries only
  const limitedQueries = baseQueries.slice(0, 5);
  const queries: PersonaQuery[] = [];

  for (const persona of personas) {
    for (const query of limitedQueries) {
      queries.push({
        persona,
        originalQuery: query,
        wrappedQuery: `Act as ${persona.name}: ${persona.description}. Their search style is: ${persona.searchStyle}. Their top concerns are: ${persona.topConcerns.join(', ')}. Now answer this question from their perspective: ${query}`,
      });
    }
  }

  return {
    queries,
    totalCombinations: queries.length,
  };
}

// ---------------------------------------------------------------------------
// Divergence Validation
// ---------------------------------------------------------------------------

/**
 * Validate that persona-driven queries actually produce different results.
 * Compares mention rates and positions across personas.
 *
 * @param personaResults - Map of persona name to their mention rates
 * @returns Whether results meaningfully diverge across personas
 */
export function validatePersonaDivergence(
  personaResults: Map<string, { mentionRate: number; avgPosition: number | null }>,
): PersonaDivergenceResult {
  if (personaResults.size < 2) {
    return {
      divergent: false,
      divergenceRate: 0,
      summary: 'Insufficient personas to measure divergence.',
    };
  }

  const mentionRates = Array.from(personaResults.values()).map(r => r.mentionRate);
  const minRate = Math.min(...mentionRates);
  const maxRate = Math.max(...mentionRates);
  const spread = maxRate - minRate;

  // Divergence threshold: >10% spread in mention rates
  const divergent = spread > 0.10;
  const divergenceRate = Math.round(spread * 100) / 100;

  const entries = Array.from(personaResults.entries());
  const bestPersona = entries.reduce((best, curr) =>
    curr[1].mentionRate > best[1].mentionRate ? curr : best
  );
  const worstPersona = entries.reduce((worst, curr) =>
    curr[1].mentionRate < worst[1].mentionRate ? curr : worst
  );

  const summary = divergent
    ? `Results diverge by ${Math.round(spread * 100)}%. Best visibility for "${bestPersona[0]}" (${Math.round(bestPersona[1].mentionRate * 100)}%), worst for "${worstPersona[0]}" (${Math.round(worstPersona[1].mentionRate * 100)}%).`
    : `Results are consistent across personas (${Math.round(spread * 100)}% spread). Persona-specific optimization is unlikely to help.`;

  return { divergent, divergenceRate, summary };
}
