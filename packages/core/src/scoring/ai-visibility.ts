// Owner: S9 (AI Visibility Scoring + Citation Normalizer)
// Replaces S2's stub with the real 30-point scorer.
// Sub-scores: mention rate (12pts), citation rate (8pts), position quality (5pts), sentiment (5pts)
// Total = 30 points max.
// Graceful degradation: normalizes to available providers.

import type { AIVisibilityScore } from '../contracts/scoring.contract.js';
import type { ParsedMention } from '../contracts/analysis.contract.js';
import type {
  MultiProviderResult,
  EngineResponse,
  Platform,
} from '../contracts/query.contract.js';
import { ALL_PLATFORMS } from '../contracts/query.contract.js';

// --- Sub-score maximums (must sum to 30) ---

const MAX_MENTION_RATE = 12;
const MAX_CITATION_RATE = 8;
const MAX_POSITION_QUALITY = 5;
const MAX_SENTIMENT = 5;
const MAX_TOTAL = 30;

// --- Pairing type ---

/**
 * A parsed mention paired with its originating engine response.
 * The mentions array passed to scoreAIVisibility must be parallel to
 * the successful responses in the MultiProviderResult.
 */
export interface PairedMention {
  mention: ParsedMention;
  response: EngineResponse;
}

// --- Sub-score calculators ---

/**
 * Mention Rate (0-12 points):
 * What fraction of queries resulted in the brand being mentioned?
 * Formula: (mentioned_queries / total_queries) * 12
 */
function scoreMentionRate(pairs: PairedMention[]): { score: number; rate: number } {
  if (pairs.length === 0) {
    return { score: 0, rate: 0 };
  }

  const mentionedCount = pairs.filter(p => p.mention.brandMentioned).length;
  const rate = mentionedCount / pairs.length;
  const score = Math.round(rate * MAX_MENTION_RATE * 100) / 100;

  return { score: Math.min(MAX_MENTION_RATE, score), rate };
}

/**
 * Citation Rate (0-8 points):
 * What fraction of queries resulted in the brand's URL being cited?
 * Formula: (queries_with_url_cited / total_queries) * 8
 */
function scoreCitationRate(pairs: PairedMention[]): { score: number; rate: number } {
  if (pairs.length === 0) {
    return { score: 0, rate: 0 };
  }

  const citedCount = pairs.filter(p => p.mention.brandUrlCited).length;
  const rate = citedCount / pairs.length;
  const score = Math.round(rate * MAX_CITATION_RATE * 100) / 100;

  return { score: Math.min(MAX_CITATION_RATE, score), rate };
}

/**
 * Position Quality (0-5 points):
 * How prominently is the brand mentioned across AI responses?
 * Position = rank among all brands in a single response (1 = mentioned first = best).
 * Only responses where the brand IS mentioned count toward the average.
 *
 * Formula:
 *   avg_position <= 1 -> 5
 *   avg_position <= 2 -> 4
 *   avg_position <= 3 -> 3
 *   avg_position <= 4 -> 2
 *   avg_position <= 5 -> 1
 *   else -> 0
 */
function scorePositionQuality(pairs: PairedMention[]): { score: number; avgPosition: number | null } {
  const mentionedWithPosition = pairs.filter(
    p => p.mention.brandMentioned && p.mention.brandPosition !== null
  );

  if (mentionedWithPosition.length === 0) {
    return { score: 0, avgPosition: null };
  }

  const sum = mentionedWithPosition.reduce(
    (acc, p) => acc + (p.mention.brandPosition as number),
    0
  );
  const avgPosition = sum / mentionedWithPosition.length;

  let score: number;
  if (avgPosition <= 1) {
    score = 5;
  } else if (avgPosition <= 2) {
    score = 4;
  } else if (avgPosition <= 3) {
    score = 3;
  } else if (avgPosition <= 4) {
    score = 2;
  } else if (avgPosition <= 5) {
    score = 1;
  } else {
    score = 0;
  }

  return { score: Math.min(MAX_POSITION_QUALITY, score), avgPosition };
}

/**
 * Sentiment (0-5 points):
 * What fraction of mentions are positive?
 * Formula: (positive_mentions / total_mentions) * 5
 *
 * Note: Only counts responses where the brand was mentioned.
 * Sentiment must be LLM-determined (by S5's parser), not keyword-based.
 */
function scoreSentiment(pairs: PairedMention[]): {
  score: number;
  breakdown: { positive: number; neutral: number; negative: number };
} {
  const mentioned = pairs.filter(p => p.mention.brandMentioned);

  if (mentioned.length === 0) {
    return {
      score: 0,
      breakdown: { positive: 0, neutral: 0, negative: 0 },
    };
  }

  let positive = 0;
  let neutral = 0;
  let negative = 0;

  for (const p of mentioned) {
    switch (p.mention.brandSentiment) {
      case 'positive':
        positive += 1;
        break;
      case 'neutral':
        neutral += 1;
        break;
      case 'negative':
        negative += 1;
        break;
      // 'not_mentioned' should not appear here since we filtered for brandMentioned=true,
      // but handle gracefully
      default:
        neutral += 1;
        break;
    }
  }

  const totalMentions = positive + neutral + negative;
  const positiveRate = totalMentions > 0 ? positive / totalMentions : 0;
  const score = Math.round(positiveRate * MAX_SENTIMENT * 100) / 100;

  return {
    score: Math.min(MAX_SENTIMENT, score),
    breakdown: { positive, neutral, negative },
  };
}

// --- Platform coverage ---

/**
 * Determine which platforms were successfully queried.
 */
function buildPlatformCoverage(
  providerResult: MultiProviderResult,
): { coverage: Record<string, boolean>; used: number; available: number } {
  const coverage: Record<string, boolean> = {};
  const available = ALL_PLATFORMS.length;

  const failedPlatformSet = new Set<Platform>(
    providerResult.failedPlatforms.map(fp => fp.platform)
  );

  const successfulPlatforms = new Set<Platform>();
  for (const response of providerResult.responses) {
    if (response.success) {
      successfulPlatforms.add(response.platform);
    }
  }

  for (const platform of ALL_PLATFORMS) {
    coverage[platform] = successfulPlatforms.has(platform) && !failedPlatformSet.has(platform);
  }

  const used = Object.values(coverage).filter(Boolean).length;

  return { coverage, used: Math.max(1, used), available };
}

// --- Pairing helper ---

/**
 * Pair each ParsedMention with its originating EngineResponse.
 *
 * The mentions array must be parallel to the successful responses in the
 * MultiProviderResult. If lengths differ, pairs up to the shorter array.
 */
function pairMentionsWithResponses(
  mentions: ParsedMention[],
  providerResult: MultiProviderResult,
): PairedMention[] {
  const successfulResponses = providerResult.responses.filter(r => r.success);
  const pairCount = Math.min(mentions.length, successfulResponses.length);

  const pairs: PairedMention[] = [];
  for (let i = 0; i < pairCount; i++) {
    pairs.push({
      mention: mentions[i],
      response: successfulResponses[i],
    });
  }

  return pairs;
}

// --- Notes generation ---

/**
 * Generate human-readable notes about the scoring.
 */
function generateNotes(
  pairs: PairedMention[],
  platformCoverage: { used: number; available: number },
  mentionRateResult: { rate: number },
  citationRateResult: { rate: number },
  positionResult: { avgPosition: number | null },
  sentimentResult: { breakdown: { positive: number; neutral: number; negative: number } },
): string[] {
  const notes: string[] = [];

  if (platformCoverage.used < platformCoverage.available) {
    const missing = platformCoverage.available - platformCoverage.used;
    notes.push(
      `${missing} of ${platformCoverage.available} AI providers failed. ` +
      `Score normalized to ${platformCoverage.used} available provider(s).`
    );
  }

  if (pairs.length === 0) {
    notes.push('No successful query responses available for scoring.');
    return notes;
  }

  if (mentionRateResult.rate === 0) {
    notes.push('Brand was not mentioned in any AI engine response.');
  } else if (mentionRateResult.rate < 0.3) {
    notes.push(
      `Low mention rate (${Math.round(mentionRateResult.rate * 100)}%). ` +
      'Brand has minimal AI visibility.'
    );
  } else if (mentionRateResult.rate >= 0.8) {
    notes.push(
      `Strong mention rate (${Math.round(mentionRateResult.rate * 100)}%). ` +
      'Brand is well-recognized by AI engines.'
    );
  }

  if (citationRateResult.rate === 0 && mentionRateResult.rate > 0) {
    notes.push(
      'Brand is mentioned but never cited with a URL. ' +
      'Adding authoritative content and structured data may improve citations.'
    );
  }

  if (positionResult.avgPosition !== null && positionResult.avgPosition > 3) {
    notes.push(
      `Average mention position is ${positionResult.avgPosition.toFixed(1)} ` +
      '(lower is better). Brand is mentioned late in AI responses.'
    );
  }

  const { positive, negative } = sentimentResult.breakdown;
  const totalSentiment = positive + sentimentResult.breakdown.neutral + negative;
  if (totalSentiment > 0 && negative > 0) {
    const negRate = Math.round((negative / totalSentiment) * 100);
    if (negRate >= 30) {
      notes.push(
        `${negRate}% of mentions have negative sentiment. ` +
        'Review recent mentions to identify reputation issues.'
      );
    }
  }

  return notes;
}

// --- Main scorer ---

/**
 * Score AI Visibility (0-30 points).
 *
 * Sub-scores:
 * - Mention Rate (0-12): fraction of queries where brand is mentioned
 * - Citation Rate (0-8): fraction of queries where brand URL is cited
 * - Position Quality (0-5): average position among mentioned brands
 * - Sentiment (0-5): fraction of positive mentions
 *
 * Graceful degradation:
 * - Scores normalize to available providers (if only 2/3 respond, still scores out of 30)
 * - Empty mentions array returns 0 score with appropriate notes
 * - Failed providers tracked in platformCoverage and notes
 *
 * @param mentions - ParsedMention array from S5's LLM parser, parallel to successful responses
 * @param providerResult - MultiProviderResult from S4's query step
 * @returns AIVisibilityScore with score 0-30, sub-score breakdown, and metadata
 */
export function scoreAIVisibility(
  mentions: ParsedMention[],
  providerResult: MultiProviderResult,
): AIVisibilityScore {
  const pairs = pairMentionsWithResponses(mentions, providerResult);
  const platformCoverage = buildPlatformCoverage(providerResult);

  const mentionRateResult = scoreMentionRate(pairs);
  const citationRateResult = scoreCitationRate(pairs);
  const positionResult = scorePositionQuality(pairs);
  const sentimentResult = scoreSentiment(pairs);

  const rawScore =
    mentionRateResult.score +
    citationRateResult.score +
    positionResult.score +
    sentimentResult.score;

  const finalScore = Math.min(MAX_TOTAL, Math.round(rawScore * 100) / 100);

  const notes = generateNotes(
    pairs,
    platformCoverage,
    mentionRateResult,
    citationRateResult,
    positionResult,
    sentimentResult,
  );

  return {
    score: finalScore,
    maxScore: 30,
    breakdown: {
      mentionRate: mentionRateResult.score,
      citationRate: citationRateResult.score,
      positionQuality: positionResult.score,
      sentiment: sentimentResult.score,
    },
    notes,
    mentionRate: mentionRateResult.rate,
    citationRate: citationRateResult.rate,
    avgPosition: positionResult.avgPosition,
    sentimentBreakdown: sentimentResult.breakdown,
    platformCoverage: platformCoverage.coverage,
    providersUsed: platformCoverage.used,
    providersAvailable: platformCoverage.available,
  };
}
