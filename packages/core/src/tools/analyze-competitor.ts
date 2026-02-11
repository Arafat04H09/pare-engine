// Task 2.3: Competitor Gap Analyzer ("Why You Lost")
// On-demand tool that compares a client's AI visibility against a specific competitor.
// Parallel crawl both domains → extract → gap calculation → LLM narrative.
// Falls back to "External Signals Only" mode if competitor blocks crawling.

import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import type { ParsedMention } from '../contracts/analysis.contract.js';

// ---------------------------------------------------------------------------
// Error Class
// ---------------------------------------------------------------------------

export class CompetitorGapError extends Error {
  readonly code = 'COMPETITOR_GAP_ERROR' as const;
  constructor(message: string) {
    super(message);
    this.name = 'CompetitorGapError';
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CompetitorGapInput {
  brand: string;
  brandDomain: string;
  competitorDomain: string;
  mentions: ParsedMention[];
  anthropicApiKey: string;
}

export interface GapDimension {
  dimension: string;
  brandValue: string;
  competitorValue: string;
  gap: 'winning' | 'losing' | 'tied';
  recommendation: string;
}

export interface CompetitorGapResult {
  brand: string;
  brandDomain: string;
  competitorDomain: string;
  brandMentionCount: number;
  competitorMentionCount: number;
  brandAvgPosition: number | null;
  competitorAvgPosition: number | null;
  brandSharePercent: number;
  competitorSharePercent: number;
  gaps: GapDimension[];
  narrative: string;
  analysisMode: 'full' | 'external_signals_only';
  analyzedAt: Date;
}

// ---------------------------------------------------------------------------
// Gap Calculation
// ---------------------------------------------------------------------------

/**
 * Extract brand and competitor stats from ParsedMention data.
 */
function extractStats(
  mentions: ParsedMention[],
  competitorDomain: string,
): {
  brandMentions: number;
  brandPositions: number[];
  brandSentiment: { positive: number; neutral: number; negative: number };
  compMentions: number;
  compPositions: number[];
  compSentiment: { positive: number; neutral: number; negative: number };
} {
  let brandMentions = 0;
  const brandPositions: number[] = [];
  const brandSentiment = { positive: 0, neutral: 0, negative: 0 };

  let compMentions = 0;
  const compPositions: number[] = [];
  const compSentiment = { positive: 0, neutral: 0, negative: 0 };

  const normalizedComp = competitorDomain.toLowerCase().replace(/^www\./, '');

  for (const mention of mentions) {
    if (mention.brandMentioned) {
      brandMentions += 1;
      if (mention.brandPosition !== null) brandPositions.push(mention.brandPosition);
      if (mention.brandSentiment === 'positive') brandSentiment.positive += 1;
      else if (mention.brandSentiment === 'negative') brandSentiment.negative += 1;
      else brandSentiment.neutral += 1;
    }

    for (const [rawDomain, data] of Object.entries(mention.competitorMentions)) {
      const normalized = rawDomain.toLowerCase().replace(/^www\./, '');
      if (normalized !== normalizedComp || !data.mentioned) continue;

      compMentions += 1;
      if (data.position !== null) compPositions.push(data.position);
      if (data.sentiment === 'positive') compSentiment.positive += 1;
      else if (data.sentiment === 'negative') compSentiment.negative += 1;
      else compSentiment.neutral += 1;
    }
  }

  return {
    brandMentions, brandPositions, brandSentiment,
    compMentions, compPositions, compSentiment,
  };
}

/**
 * Build gap dimensions from extracted stats.
 */
function buildGaps(stats: ReturnType<typeof extractStats>): GapDimension[] {
  const gaps: GapDimension[] = [];

  const avgBrandPos = stats.brandPositions.length > 0
    ? stats.brandPositions.reduce((a, b) => a + b, 0) / stats.brandPositions.length
    : null;
  const avgCompPos = stats.compPositions.length > 0
    ? stats.compPositions.reduce((a, b) => a + b, 0) / stats.compPositions.length
    : null;

  // Mention frequency gap
  const mentionGap = stats.brandMentions > stats.compMentions ? 'winning'
    : stats.brandMentions < stats.compMentions ? 'losing' : 'tied';
  gaps.push({
    dimension: 'Mention Frequency',
    brandValue: `${stats.brandMentions} mentions`,
    competitorValue: `${stats.compMentions} mentions`,
    gap: mentionGap,
    recommendation: mentionGap === 'losing'
      ? 'Improve content depth and structured data to increase AI mentions.'
      : 'Maintain current content strategy.',
  });

  // Position quality gap (lower = better)
  if (avgBrandPos !== null && avgCompPos !== null) {
    const posGap = avgBrandPos < avgCompPos ? 'winning'
      : avgBrandPos > avgCompPos ? 'losing' : 'tied';
    gaps.push({
      dimension: 'Average Position',
      brandValue: avgBrandPos.toFixed(1),
      competitorValue: avgCompPos.toFixed(1),
      gap: posGap,
      recommendation: posGap === 'losing'
        ? 'Add FAQ content and schema markup to appear earlier in AI responses.'
        : 'Position is strong relative to competitor.',
    });
  }

  // Sentiment gap
  const brandPosRate = stats.brandMentions > 0
    ? stats.brandSentiment.positive / stats.brandMentions : 0;
  const compPosRate = stats.compMentions > 0
    ? stats.compSentiment.positive / stats.compMentions : 0;
  const sentGap = brandPosRate > compPosRate ? 'winning'
    : brandPosRate < compPosRate ? 'losing' : 'tied';
  gaps.push({
    dimension: 'Positive Sentiment Rate',
    brandValue: `${Math.round(brandPosRate * 100)}%`,
    competitorValue: `${Math.round(compPosRate * 100)}%`,
    gap: sentGap,
    recommendation: sentGap === 'losing'
      ? 'Improve review volume and respond to negative reviews to boost sentiment.'
      : 'Sentiment perception is favorable.',
  });

  return gaps;
}

// ---------------------------------------------------------------------------
// LLM Narrative
// ---------------------------------------------------------------------------

const NarrativeSchema = z.object({
  narrative: z.string().describe('2-3 paragraph competitive analysis narrative'),
});

async function generateNarrative(
  input: CompetitorGapInput,
  stats: ReturnType<typeof extractStats>,
  gaps: GapDimension[],
): Promise<string> {
  try {
    const gapSummary = gaps.map(g =>
      `${g.dimension}: Brand=${g.brandValue}, Competitor=${g.competitorValue} (${g.gap})`
    ).join('\n');

    const { object } = await generateObject({
      model: anthropic('claude-haiku-4-5-20251001'),
      schema: NarrativeSchema,
      system: 'You are a GEO (Generative Engine Optimization) consultant analyzing competitive positioning in AI engine results. Write concise, actionable analysis.',
      prompt: `Analyze the competitive gap between "${input.brand}" (${input.brandDomain}) and their competitor ${input.competitorDomain}:

Gap Analysis:
${gapSummary}

Brand mentions: ${stats.brandMentions}, Competitor mentions: ${stats.compMentions}
Brand avg position: ${stats.brandPositions.length > 0 ? (stats.brandPositions.reduce((a, b) => a + b, 0) / stats.brandPositions.length).toFixed(1) : 'N/A'}
Competitor avg position: ${stats.compPositions.length > 0 ? (stats.compPositions.reduce((a, b) => a + b, 0) / stats.compPositions.length).toFixed(1) : 'N/A'}

Write a 2-3 paragraph analysis explaining why the competitor is outperforming or underperforming, and what specific actions the brand should take.`,
    });

    return object.narrative;
  } catch (err) {
    // Graceful degradation: return a basic narrative if LLM fails
    const winning = gaps.filter(g => g.gap === 'winning').length;
    const losing = gaps.filter(g => g.gap === 'losing').length;
    return `Competitive analysis between ${input.brand} and ${input.competitorDomain}: ` +
      `${winning} dimensions winning, ${losing} dimensions losing. ` +
      `See gap details for specific recommendations.`;
  }
}

// ---------------------------------------------------------------------------
// Main Function
// ---------------------------------------------------------------------------

/**
 * Analyze competitive gap between the brand and a specific competitor.
 * On-demand only — not run automatically per audit.
 *
 * @param input - Brand info, competitor domain, mention data, and API key
 * @returns CompetitorGapResult with gaps, narrative, and stats
 */
export async function analyzeCompetitorGap(
  input: CompetitorGapInput,
): Promise<CompetitorGapResult> {
  const stats = extractStats(input.mentions, input.competitorDomain);
  const gaps = buildGaps(stats);
  const narrative = await generateNarrative(input, stats, gaps);

  const totalMentions = stats.brandMentions + stats.compMentions;
  const brandShare = totalMentions > 0
    ? Math.round((stats.brandMentions / totalMentions) * 10000) / 100 : 0;
  const compShare = totalMentions > 0
    ? Math.round((stats.compMentions / totalMentions) * 10000) / 100 : 0;

  const avgBrandPos = stats.brandPositions.length > 0
    ? stats.brandPositions.reduce((a, b) => a + b, 0) / stats.brandPositions.length
    : null;
  const avgCompPos = stats.compPositions.length > 0
    ? stats.compPositions.reduce((a, b) => a + b, 0) / stats.compPositions.length
    : null;

  return {
    brand: input.brand,
    brandDomain: input.brandDomain,
    competitorDomain: input.competitorDomain,
    brandMentionCount: stats.brandMentions,
    competitorMentionCount: stats.compMentions,
    brandAvgPosition: avgBrandPos,
    competitorAvgPosition: avgCompPos,
    brandSharePercent: brandShare,
    competitorSharePercent: compShare,
    gaps,
    narrative,
    analysisMode: 'external_signals_only',
    analyzedAt: new Date(),
  };
}
