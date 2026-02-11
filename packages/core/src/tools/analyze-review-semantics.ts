// Task 4.1: Semantic Review Orchestration — N-gram gap analysis.
// Compares client vs competitor review text to find semantic gaps.
// Uses Claude Haiku via Vercel AI SDK generateObject() for cluster classification and sentiment.

import { z } from 'zod';
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

// --- Custom Error ---

export class ReviewSemanticError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'ReviewSemanticError';
    this.code = code;
  }
}

// --- Input / Output Types ---

export interface ReviewSemanticInput {
  clientReviews: Array<{ text: string; rating: number }>;
  competitorReviews: Array<{ text: string; rating: number }>;
  vertical: string;
  businessName: string;
}

export interface ReviewNGram {
  phrase: string;
  clientFrequency: number;
  competitorFrequency: number;
  gap: number; // competitor - client (positive means competitor mentioned more)
}

export interface ReviewSemanticOutput {
  topClientPhrases: ReviewNGram[];
  topCompetitorPhrases: ReviewNGram[];
  gapPhrases: ReviewNGram[];
  clientSentimentAvg: number; // 0-1
  competitorSentimentAvg: number; // 0-1
  recommendedClusters: string[];
  analyzedAt: Date;
}

// --- N-gram Extraction ---

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'was', 'are', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'this', 'that',
  'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he',
  'she', 'it', 'they', 'them', 'their', 'its', 'not', 'no', 'so', 'if',
  'then', 'just', 'very', 'also', 'as', 'all', 'any', 'about', 'up',
  'out', 'there', 'here', 'when', 'what', 'which', 'who', 'how', 'get',
  'got', 'go', 'went', 'come', 'came', 'really', 'much', 'more', 'most',
  'some', 'than', 'too', 'only', 'even', 'us', 'into', 'over', 'after',
  'before', 'through', 'between', 'back', 'one', 'two', 'first', 'time',
]);

/**
 * Tokenizes text: lowercase, remove punctuation, split into words, filter stop words.
 */
function tokenize(text: string): string[] {
  const cleaned = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned
    .split(' ')
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

/**
 * Extracts n-grams (sliding window) from an array of tokens.
 */
function extractNGrams(tokens: string[], n: number): string[] {
  const ngrams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(' '));
  }
  return ngrams;
}

/**
 * Counts n-gram frequencies across a set of reviews, normalized by review count.
 * Returns a map of phrase -> normalized frequency.
 */
function countNGramFrequencies(
  reviews: Array<{ text: string }>,
): Map<string, number> {
  const rawCounts = new Map<string, number>();

  for (const review of reviews) {
    const tokens = tokenize(review.text);

    // Extract 2-grams and 3-grams
    const bigrams = extractNGrams(tokens, 2);
    const trigrams = extractNGrams(tokens, 3);
    const allNGrams = [...bigrams, ...trigrams];

    // Count unique n-grams per review to avoid inflating frequency from single reviews
    const uniqueInReview = new Set(allNGrams);
    for (const ngram of uniqueInReview) {
      rawCounts.set(ngram, (rawCounts.get(ngram) ?? 0) + 1);
    }
  }

  // Normalize by review count
  const reviewCount = Math.max(reviews.length, 1);
  const normalized = new Map<string, number>();
  for (const [phrase, count] of rawCounts) {
    // Only include phrases mentioned in at least 2 reviews or 5% of reviews
    const threshold = Math.max(2, Math.ceil(reviewCount * 0.05));
    if (count >= threshold) {
      normalized.set(phrase, Math.round((count / reviewCount) * 1000) / 1000);
    }
  }

  return normalized;
}

// --- LLM Schema for Cluster Classification + Sentiment ---

const ClusterAnalysisSchema = z.object({
  recommendedClusters: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe('Top 3 topic clusters the client should target to close review gaps'),
  clientSentimentAvg: z
    .number()
    .min(0)
    .max(1)
    .describe('Average sentiment of client reviews, 0 = very negative, 1 = very positive'),
  competitorSentimentAvg: z
    .number()
    .min(0)
    .max(1)
    .describe('Average sentiment of competitor reviews, 0 = very negative, 1 = very positive'),
});

type ClusterAnalysis = z.infer<typeof ClusterAnalysisSchema>;

// --- Main Export ---

/**
 * Compares client vs competitor review text using n-gram frequency analysis
 * to identify semantic gaps. Uses Claude Haiku to classify gap phrases into
 * recommended topic clusters and estimate sentiment.
 *
 * @example
 * ```typescript
 * const result = await analyzeReviewSemantics({
 *   clientReviews: [{ text: 'Great service, friendly staff', rating: 5 }],
 *   competitorReviews: [{ text: 'Amazing emergency plumber, fast response', rating: 5 }],
 *   vertical: 'plumbing',
 *   businessName: 'Quick Plumbing Co',
 * });
 * ```
 */
export async function analyzeReviewSemantics(
  input: ReviewSemanticInput,
): Promise<ReviewSemanticOutput> {
  const { clientReviews, competitorReviews, vertical, businessName } = input;

  if (clientReviews.length === 0 && competitorReviews.length === 0) {
    throw new ReviewSemanticError(
      'Both client and competitor review sets are empty',
      'EMPTY_REVIEWS',
    );
  }

  // Step 1: Extract and count n-gram frequencies
  const clientFreqs = countNGramFrequencies(clientReviews);
  const competitorFreqs = countNGramFrequencies(competitorReviews);

  // Step 2: Build unified n-gram list with gap calculation
  const allPhrases = new Set([...clientFreqs.keys(), ...competitorFreqs.keys()]);
  const ngramList: ReviewNGram[] = [];

  for (const phrase of allPhrases) {
    const clientFreq = clientFreqs.get(phrase) ?? 0;
    const competitorFreq = competitorFreqs.get(phrase) ?? 0;
    ngramList.push({
      phrase,
      clientFrequency: clientFreq,
      competitorFrequency: competitorFreq,
      gap: Math.round((competitorFreq - clientFreq) * 1000) / 1000,
    });
  }

  // Step 3: Sort and pick top phrases
  const topClientPhrases = [...ngramList]
    .filter((ng) => ng.clientFrequency > 0)
    .sort((a, b) => b.clientFrequency - a.clientFrequency)
    .slice(0, 10);

  const topCompetitorPhrases = [...ngramList]
    .filter((ng) => ng.competitorFrequency > 0)
    .sort((a, b) => b.competitorFrequency - a.competitorFrequency)
    .slice(0, 10);

  // Gap phrases: competitor has them more, sorted by largest gap
  const gapPhrases = [...ngramList]
    .filter((ng) => ng.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 10);

  // Step 4: Use Claude Haiku to classify clusters and estimate sentiment
  let clusterAnalysis: ClusterAnalysis;

  try {
    const gapPhraseSummary = gapPhrases
      .map((g) => `"${g.phrase}" (gap: ${g.gap.toFixed(3)})`)
      .join(', ');

    const clientSnippets = clientReviews
      .slice(0, 15)
      .map((r) => r.text.slice(0, 200))
      .join('\n---\n');

    const competitorSnippets = competitorReviews
      .slice(0, 15)
      .map((r) => r.text.slice(0, 200))
      .join('\n---\n');

    const response = await generateObject({
      model: anthropic('claude-sonnet-4-20250514'),
      schema: ClusterAnalysisSchema,
      system: `You are a review analytics expert for local businesses. Analyze review text to identify topic clusters and sentiment patterns.`,
      prompt: `Business: ${businessName}
Vertical: ${vertical}

Top gap phrases (topics competitors get mentioned for that this business does not):
${gapPhraseSummary || 'None identified'}

Sample client reviews:
${clientSnippets || 'No client reviews available'}

Sample competitor reviews:
${competitorSnippets || 'No competitor reviews available'}

Based on the gap phrases and review samples:
1. Identify the top 3 topic clusters the business should target to close the review gap. Be specific to the ${vertical} vertical.
2. Estimate the average sentiment (0-1 scale) for the client reviews.
3. Estimate the average sentiment (0-1 scale) for the competitor reviews.`,
      temperature: 0.3,
    });

    clusterAnalysis = response.object;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ReviewSemanticError(
      `Failed to classify review clusters via LLM: ${message}`,
      'LLM_CLASSIFICATION_FAILED',
    );
  }

  return {
    topClientPhrases,
    topCompetitorPhrases,
    gapPhrases,
    clientSentimentAvg: clusterAnalysis.clientSentimentAvg,
    competitorSentimentAvg: clusterAnalysis.competitorSentimentAvg,
    recommendedClusters: clusterAnalysis.recommendedClusters.slice(0, 3),
    analyzedAt: new Date(),
  };
}
