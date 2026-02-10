// Owner: S12 (Inngest Pipeline). Consumers: pipeline.ts
// Orchestrates all 5 pillar scorers and produces a CompositeScore.
//
// Imports scoring functions from @pare-engine/core (S2, S5, S6, S7, S8, S9).
// Imports analysis contracts from @pare-engine/core/contracts.
//
// This step is independently retriable by Inngest.

import type {
  ContentAnalysisOutput,
  SchemaAnalysisOutput,
  TechnicalAnalysisOutput,
  GBPAnalysisOutput,
  ParsedMention,
  MultiProviderResult,
  CompositeScore,
} from '@pare-engine/core/contracts';

import {
  scoreAIVisibility,
  scoreContentQuality,
  scoreSchemaCompleteness,
  scoreTechnicalReadiness,
  scoreLocalGBP,
  calculateOverallScore,
} from '@pare-engine/core';

// ---------------------------------------------------------------------------
// Error Class
// ---------------------------------------------------------------------------

export class ScoreError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'ScoreError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Step Input
// ---------------------------------------------------------------------------

export interface ScoreStepInput {
  content: ContentAnalysisOutput;
  schema: SchemaAnalysisOutput;
  technical: TechnicalAnalysisOutput;
  gbp: GBPAnalysisOutput;
  mentions: ParsedMention[];
  queryResult: MultiProviderResult;
}

// ---------------------------------------------------------------------------
// Score Step
// ---------------------------------------------------------------------------

/**
 * Executes the scoring step of the audit pipeline.
 *
 * Orchestrates all 5 pillar scorers:
 * 1. AI Visibility (30pts) — from parsed mentions + query results
 * 2. Content Quality (30pts) — from content analysis
 * 3. Schema/Structured Data (15pts) — from schema analysis
 * 4. Technical Readiness (10pts) — from technical analysis
 * 5. Local/GBP (15pts) — from GBP analysis
 *
 * Then combines them into a CompositeScore (0-100 + letter grade).
 *
 * @param input - All analysis outputs + parsed mentions + query result
 * @returns CompositeScore with overall score, letter grade, and all 5 pillar breakdowns
 * @throws ScoreError if scoring fails entirely (retriable by Inngest)
 */
export function executeScoreStep(input: ScoreStepInput): CompositeScore {
  try {
    // Score each pillar
    const aiVisibility = scoreAIVisibility(input.mentions, input.queryResult);
    const contentQuality = scoreContentQuality(input.content);
    const schemaStructuredData = scoreSchemaCompleteness(input.schema);
    const technicalReadiness = scoreTechnicalReadiness(input.technical);
    const localGbp = scoreLocalGBP(input.gbp);

    // Calculate composite score (sum of all pillar scores, capped at 100)
    const compositeScore = calculateOverallScore({
      aiVisibility,
      contentQuality,
      schemaStructuredData,
      technicalReadiness,
      localGbp,
    });

    return compositeScore;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ScoreError(
      `Scoring failed: ${message}`,
      'SCORE_STEP_FAILED',
    );
  }
}
