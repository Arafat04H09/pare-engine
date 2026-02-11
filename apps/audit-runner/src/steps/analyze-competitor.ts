// Task 2.3: Optional Inngest step for competitor gap analysis.
// On-demand — triggered via admin UI, not automatically per audit.
// Uses ParsedMention data from the query step to analyze competitor gaps.

import type { ParsedMention } from '@pare-engine/core/contracts';
import {
  analyzeCompetitorGap,
  type CompetitorGapResult,
} from '@pare-engine/core/tools/analyze-competitor';
import {
  aggregateCompetitorMentions,
  persistCompetitorData,
} from '@pare-engine/core/tools/normalize-competitor';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CompetitorAnalysisStepInput {
  brand: string;
  brandDomain: string;
  clientId: string;
  auditId: string;
  mentions: ParsedMention[];
  competitors: string[];
  databaseUrl: string;
  anthropicApiKey: string;
}

export interface CompetitorAnalysisStepResult {
  normalization: {
    totalMentions: number;
    topCompetitors: number;
    persisted: number;
    snapshotsCreated: number;
  };
  gaps: CompetitorGapResult[];
}

// ---------------------------------------------------------------------------
// Step Function
// ---------------------------------------------------------------------------

/**
 * Execute competitor analysis step.
 * 1. Aggregate and normalize competitor mentions
 * 2. Persist top competitors to database
 * 3. Run gap analysis for top 3 competitors
 *
 * @param input - Mentions, competitor list, and API keys
 * @returns Normalization stats and gap analysis results
 */
export async function executeCompetitorAnalysisStep(
  input: CompetitorAnalysisStepInput,
): Promise<CompetitorAnalysisStepResult> {
  // Step 1: Aggregate competitor mentions
  const normResult = aggregateCompetitorMentions(input.mentions);

  // Step 2: Persist to database
  const persistResult = await persistCompetitorData({
    databaseUrl: input.databaseUrl,
    clientId: input.clientId,
    auditId: input.auditId,
    competitors: normResult.topCompetitors,
  });

  // Step 3: Gap analysis for top 3 competitors (on-demand, not all)
  const topForGaps = normResult.topCompetitors.slice(0, 3);
  const gapSettled = await Promise.allSettled(
    topForGaps.map(comp =>
      analyzeCompetitorGap({
        brand: input.brand,
        brandDomain: input.brandDomain,
        competitorDomain: comp.domain,
        mentions: input.mentions,
        anthropicApiKey: input.anthropicApiKey,
      })
    ),
  );

  const gaps: CompetitorGapResult[] = [];
  for (const result of gapSettled) {
    if (result.status === 'fulfilled') {
      gaps.push(result.value);
    }
    // Failed gap analyses are silently skipped (graceful degradation)
  }

  return {
    normalization: {
      totalMentions: normResult.totalMentions,
      topCompetitors: normResult.topCompetitors.length,
      persisted: persistResult.persisted,
      snapshotsCreated: persistResult.snapshotsCreated,
    },
    gaps,
  };
}
