// Task 4.1: Semantic Review Orchestration — Campaign artifact generation.
// Generates review campaign artifacts (email, SMS, Q&A seeds, talking points)
// using psychological priming only. No incentives, no review gating.
// Uses Claude Haiku via Vercel AI SDK generateObject() with Zod schemas.

import { z } from 'zod';
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import type { ReviewNGram } from './analyze-review-semantics.js';

// --- Custom Error ---

export class ReviewCampaignError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'ReviewCampaignError';
    this.code = code;
  }
}

// --- Input / Output Types ---

export interface ReviewCampaignInput {
  businessName: string;
  vertical: string;
  gapPhrases: ReviewNGram[];
  recommendedClusters: string[];
  googlePlaceId?: string;
}

export interface ReviewCampaignArtifacts {
  emailTemplate: string;
  smsTemplate: string;
  qaSeed: Array<{ question: string; answer: string }>;
  talkingPoints: string[];
  disclaimer: string;
  generatedAt: Date;
}

// --- Zod Schema for LLM Output ---

const CampaignOutputSchema = z.object({
  emailTemplate: z
    .string()
    .describe(
      'A complete email template thanking the customer for their visit, asking about their specific experience seeded from gap topic clusters, and linking to the Google review page. NO incentives. NO review gating. The email should use psychological priming to encourage authentic reviews mentioning specific service aspects.',
    ),
  smsTemplate: z
    .string()
    .max(160)
    .describe(
      'A short SMS message (max 160 characters) encouraging the customer to leave a review. Include a link placeholder {REVIEW_LINK}.',
    ),
  qaSeed: z
    .array(
      z.object({
        question: z
          .string()
          .describe('A question targeting a gap topic cluster, as it would appear on a Google Business listing Q&A'),
        answer: z
          .string()
          .describe('A business-owner answer that naturally highlights the service aspect'),
      }),
    )
    .min(3)
    .max(5)
    .describe('Suggested Q&A pairs for the Google Business listing, targeting gap topic clusters'),
  talkingPoints: z
    .array(z.string())
    .min(3)
    .max(7)
    .describe(
      'Staff talking points to naturally elicit reviews mentioning gap topics. Each point is a brief instruction for front-line staff about what to mention or ask during customer interactions.',
    ),
});

type CampaignOutput = z.infer<typeof CampaignOutputSchema>;

// --- Constants ---

const REVIEW_CAMPAIGN_DISCLAIMER =
  'This campaign uses psychological priming to encourage authentic reviews. No incentives are offered. No review gating is applied. Customers are free to leave any rating.';

// --- Main Export ---

/**
 * Generates review campaign artifacts designed to close semantic gaps
 * identified by the review analysis step.
 *
 * All artifacts use psychological priming only — no incentives, no review
 * gating. Includes a mandatory ethical disclaimer.
 *
 * @example
 * ```typescript
 * const campaign = await generateReviewCampaign({
 *   businessName: 'Quick Plumbing Co',
 *   vertical: 'plumbing',
 *   gapPhrases: [{ phrase: 'emergency service', clientFrequency: 0, competitorFrequency: 0.4, gap: 0.4 }],
 *   recommendedClusters: ['emergency responsiveness', 'transparent pricing', 'professionalism'],
 *   googlePlaceId: 'ChIJ3aqq5Q1ZwokRb9hLO7Gyxgw',
 * });
 * ```
 */
export async function generateReviewCampaign(
  input: ReviewCampaignInput,
): Promise<ReviewCampaignArtifacts> {
  const { businessName, vertical, gapPhrases, recommendedClusters, googlePlaceId } = input;

  if (recommendedClusters.length === 0 && gapPhrases.length === 0) {
    throw new ReviewCampaignError(
      'No gap phrases or recommended clusters provided — run semantic analysis first',
      'NO_GAP_DATA',
    );
  }

  const reviewLink = googlePlaceId
    ? `https://search.google.com/local/writereview?placeid=${googlePlaceId}`
    : '{REVIEW_LINK}';

  const gapSummary = gapPhrases
    .slice(0, 10)
    .map((g) => `"${g.phrase}" (gap score: ${g.gap.toFixed(3)})`)
    .join(', ');

  const clusterSummary = recommendedClusters.join(', ');

  let campaignOutput: CampaignOutput;

  try {
    const response = await generateObject({
      model: anthropic('claude-sonnet-4-20250514'),
      schema: CampaignOutputSchema,
      system: `You are a review campaign strategist for local businesses. You create ethical review solicitation campaigns that use psychological priming to encourage customers to mention specific service aspects in their reviews.

CRITICAL RULES:
- NEVER suggest incentives (discounts, gifts, rewards) for reviews
- NEVER suggest review gating (only asking happy customers)
- NEVER suggest asking for a specific star rating
- DO use psychological priming: ask about specific experiences that naturally lead to mentioning gap topics
- DO make the review process easy with a direct link
- DO be genuine and conversational in tone
- All templates should be ready-to-use with minimal customization`,
      prompt: `Business: ${businessName}
Vertical: ${vertical}
Google Review Link: ${reviewLink}

Gap phrases (topics competitors get mentioned for more):
${gapSummary || 'General improvement needed'}

Recommended topic clusters to target:
${clusterSummary || 'Service quality, customer experience, professionalism'}

Generate review campaign artifacts:

1. EMAIL TEMPLATE: A complete email thanking the customer, asking about their experience with specific aspects related to the gap topics, and including the review link. Use psychological priming — by asking about specific experiences, customers naturally mention those topics in reviews.

2. SMS TEMPLATE: A short (max 160 chars) message. Use {REVIEW_LINK} as the link placeholder.

3. Q&A SEEDS: 3-5 Google Business Q&A pairs that target gap topic clusters. Questions should be ones real customers would ask.

4. TALKING POINTS: 3-5 brief instructions for front-line staff about what to mention or ask during customer interactions to naturally prime customers to think about gap topics when they later write reviews.`,
      temperature: 0.5,
    });

    campaignOutput = response.object;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ReviewCampaignError(
      `Failed to generate review campaign via LLM: ${message}`,
      'LLM_GENERATION_FAILED',
    );
  }

  return {
    emailTemplate: campaignOutput.emailTemplate,
    smsTemplate: campaignOutput.smsTemplate,
    qaSeed: campaignOutput.qaSeed,
    talkingPoints: campaignOutput.talkingPoints,
    disclaimer: REVIEW_CAMPAIGN_DISCLAIMER,
    generatedAt: new Date(),
  };
}
