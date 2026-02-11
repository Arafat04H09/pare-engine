// Task 3.1: Adversarial Brand Audit ("Red Team")
// Tests brand resilience against 4 attack vectors: Karen, Competitor, Closure, Price Anchor.
// Judge: Claude Sonnet with Chain of Thought.
// Output: BrandResilienceScore (0-100).

import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import type {
  AttackVector,
  AdversarialProbeResult,
  AdversarialAuditOutput,
} from '../contracts/analysis.contract.js';

// ---------------------------------------------------------------------------
// Error Class
// ---------------------------------------------------------------------------

export class AdversarialAuditError extends Error {
  readonly code = 'ADVERSARIAL_AUDIT_ERROR' as const;
  constructor(message: string) {
    super(message);
    this.name = 'AdversarialAuditError';
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdversarialAuditInput {
  brand: string;
  domain: string;
  vertical: string;
  location?: string;
  anthropicApiKey: string;
}

// ---------------------------------------------------------------------------
// Attack Vector Prompts
// ---------------------------------------------------------------------------

const ATTACK_VECTORS: Record<AttackVector, {
  label: string;
  promptTemplates: string[];
}> = {
  karen: {
    label: 'Negative Customer Experience',
    promptTemplates: [
      'I had a terrible experience at {brand}. The staff was rude and the service was awful. What are better alternatives in {location}?',
      'Why is {brand} so bad? I want to warn others about my experience.',
      '{brand} scammed me. Who should I report them to and what alternatives exist?',
    ],
  },
  competitor: {
    label: 'Competitor Comparison',
    promptTemplates: [
      'Why should I choose a competitor over {brand}? What are {brand}\'s biggest weaknesses?',
      'Is {brand} overpriced compared to alternatives in {location}?',
      'List all the reasons NOT to use {brand} for {vertical} services.',
    ],
  },
  closure: {
    label: 'Business Closure / Reliability',
    promptTemplates: [
      'Is {brand} still in business? I heard they might be closing.',
      'Did {brand} go out of business? Their website seems outdated.',
      'Is {brand} reliable or are they going bankrupt?',
    ],
  },
  price_anchor: {
    label: 'Price Anchoring / Deception',
    promptTemplates: [
      'How much does {brand} charge? Are their prices fair or inflated?',
      'I heard {brand} has hidden fees. Is that true?',
      'What is the cheapest option for {vertical} in {location}? Is {brand} worth the cost?',
    ],
  },
};

// ---------------------------------------------------------------------------
// Probe Schema
// ---------------------------------------------------------------------------

const ProbeJudgmentSchema = z.object({
  brandMentioned: z.boolean(),
  sentiment: z.enum(['positive', 'neutral', 'negative', 'not_mentioned']),
  resilient: z.boolean().describe('True if the AI defended or presented the brand fairly'),
  confidenceScore: z.number().min(0).max(1),
  reasoning: z.string().describe('Chain-of-thought analysis of the response'),
});

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

function hydrate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, value);
  }
  return result;
}

/**
 * Run a single adversarial probe against an AI engine response.
 * Uses Claude Sonnet as the judge to assess resilience.
 */
async function judgeProbe(
  vector: AttackVector,
  prompt: string,
  simulatedResponse: string,
  brand: string,
): Promise<AdversarialProbeResult> {
  const { object: judgment } = await generateObject({
    model: anthropic('claude-sonnet-4-5-20250929'),
    schema: ProbeJudgmentSchema,
    system: `You are a brand resilience judge. Analyze the AI engine response to an adversarial prompt about "${brand}". Determine whether the AI engine defended or fairly represented the brand, or amplified negative sentiment. Think step by step.`,
    prompt: `Adversarial prompt: "${prompt}"

AI engine response: "${simulatedResponse}"

Judge whether the brand "${brand}" was:
1. Mentioned at all
2. Presented with positive, neutral, or negative sentiment
3. Defended fairly (resilient) or unfairly attacked (not resilient)

Provide your chain-of-thought reasoning.`,
  });

  return {
    vector,
    prompt,
    response: simulatedResponse,
    brandMentioned: judgment.brandMentioned,
    sentiment: judgment.sentiment,
    resilient: judgment.resilient,
    confidenceScore: judgment.confidenceScore,
    reasoning: judgment.reasoning,
  };
}

/**
 * Generate simulated adversarial AI responses for testing.
 * In production, these would come from actual AI engine queries.
 */
async function generateSimulatedResponse(
  prompt: string,
  brand: string,
): Promise<string> {
  const { object } = await generateObject({
    model: anthropic('claude-haiku-4-5-20251001'),
    schema: z.object({ response: z.string() }),
    system: 'You are simulating how a general-purpose AI assistant would respond to this question. Give a realistic, balanced response as if you were ChatGPT or Perplexity answering a user question.',
    prompt,
  });
  return object.response;
}

// ---------------------------------------------------------------------------
// Main Function
// ---------------------------------------------------------------------------

/**
 * Run adversarial brand audit across all 4 attack vectors.
 * Each vector has 3 prompts = 12 total probes.
 *
 * @param input - Brand info and API key
 * @returns AdversarialAuditOutput with probes, hallucinations, and resilience score
 */
export async function auditAdversarial(
  input: AdversarialAuditInput,
): Promise<AdversarialAuditOutput> {
  const vars = {
    brand: input.brand,
    domain: input.domain,
    vertical: input.vertical,
    location: input.location ?? 'the area',
  };

  const allProbes: AdversarialProbeResult[] = [];
  const vectors = Object.keys(ATTACK_VECTORS) as AttackVector[];

  // Run probes for each vector
  const probeSettled = await Promise.allSettled(
    vectors.flatMap(vector =>
      ATTACK_VECTORS[vector].promptTemplates.map(async template => {
        const prompt = hydrate(template, vars);
        const simulatedResponse = await generateSimulatedResponse(prompt, input.brand);
        return judgeProbe(vector, prompt, simulatedResponse, input.brand);
      })
    ),
  );

  for (const result of probeSettled) {
    if (result.status === 'fulfilled') {
      allProbes.push(result.value);
    }
  }

  // Calculate vector breakdown
  const vectorBreakdown: Record<string, { tested: number; resilient: number; score: number }> = {};
  for (const vector of vectors) {
    const vectorProbes = allProbes.filter(p => p.vector === vector);
    const resilientCount = vectorProbes.filter(p => p.resilient).length;
    const score = vectorProbes.length > 0
      ? Math.round((resilientCount / vectorProbes.length) * 100) : 0;
    vectorBreakdown[vector] = {
      tested: vectorProbes.length,
      resilient: resilientCount,
      score,
    };
  }

  // Calculate overall resilience score
  const totalProbes = allProbes.length;
  const totalResilient = allProbes.filter(p => p.resilient).length;
  const brandResilienceScore = totalProbes > 0
    ? Math.round((totalResilient / totalProbes) * 100) : 0;

  // Generate summary
  const weakVectors = vectors.filter(v => (vectorBreakdown[v]?.score ?? 0) < 50);
  const summary = weakVectors.length > 0
    ? `Brand resilience is ${brandResilienceScore}/100. Vulnerable to: ${weakVectors.map(v => ATTACK_VECTORS[v].label).join(', ')}. ${totalResilient}/${totalProbes} probes showed resilient AI responses.`
    : `Brand resilience is strong at ${brandResilienceScore}/100. ${totalResilient}/${totalProbes} probes showed resilient AI responses across all attack vectors.`;

  return {
    probes: allProbes,
    hallucinations: [], // Populated by scan-hallucinations.ts separately
    brandResilienceScore,
    vectorBreakdown,
    summary,
    analyzedAt: new Date(),
  };
}
