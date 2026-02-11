// POST /api/admin/audits/[id]/proposal
// Generates a draft proposal (Statement of Work) from an audit's composite score.
// Returns ProposalData as JSON. Does not persist to DB (client-side state for now).

import { NextResponse } from 'next/server';
import { db } from '../../../../../../lib/db';
import { auditResults, clients } from '@pare-engine/core';
import { sql } from 'drizzle-orm';
import { generateProposal } from '@pare-engine/core/tools/generate-proposal';
import type { CompositeScore } from '@pare-engine/core/contracts';
import { SCORING_WEIGHTS, scoreToGrade } from '@pare-engine/core/contracts';

/**
 * Reconstructs a CompositeScore from the flattened audit result DB row.
 * The detailedResults JSONB column stores the full pillar data.
 */
function buildCompositeScore(audit: {
  overallScore: number;
  letterGrade: string;
  aiVisibilityScore: number | null;
  contentScore: number | null;
  schemaScore: number | null;
  technicalScore: number | null;
  gbpScore: number | null;
  detailedResults: unknown;
}): CompositeScore {
  const details = (audit.detailedResults as Record<string, unknown>) ?? {};
  const pillarsRaw = (details.pillars as Record<string, Record<string, unknown>>) ?? {};

  // Helper: reconstruct a pillar from detailed results or fall back to the flat columns
  function pillar(
    key: string,
    flatScore: number | null,
    maxScore: number,
    extra: Record<string, unknown> = {},
  ): Record<string, unknown> {
    const raw = pillarsRaw[key] as Record<string, unknown> | undefined;
    if (raw) {
      return { ...raw, maxScore };
    }
    // Fallback: build minimal pillar from flat score
    return {
      score: flatScore ?? 0,
      maxScore,
      breakdown: {},
      notes: [],
      ...extra,
    };
  }

  const aiVis = pillar('aiVisibility', audit.aiVisibilityScore, SCORING_WEIGHTS.aiVisibility, {
    mentionRate: 0,
    citationRate: 0,
    avgPosition: null,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
    platformCoverage: {},
    providersUsed: 1,
    providersAvailable: 3,
  });

  const content = pillar('contentQuality', audit.contentScore, SCORING_WEIGHTS.contentQuality, {
    avgAnswerFirstScore: 0,
    faqCoverage: 0,
    statsDensity: 0,
    authorAttributionRate: 0,
  });

  const schema = pillar('schemaStructuredData', audit.schemaScore, SCORING_WEIGHTS.schemaStructuredData, {
    requiredTypesPresent: 0,
    requiredTypesTotal: 4,
    recommendedTypesPresent: 0,
    validationErrorCount: 0,
  });

  const tech = pillar('technicalReadiness', audit.technicalScore, SCORING_WEIGHTS.technicalReadiness, {
    aiCrawlerAccess: true,
    llmsTxtPresent: false,
    sitemapPresent: true,
    httpsEnabled: true,
    mobileFriendly: true,
  });

  const gbp = pillar('localGbp', audit.gbpScore, SCORING_WEIGHTS.localGbp, {
    gbpComplete: false,
    reviewScore: 0,
    napConsistent: false,
  });

  return {
    overallScore: audit.overallScore,
    letterGrade: scoreToGrade(audit.overallScore),
    pillars: {
      aiVisibility: aiVis,
      contentQuality: content,
      schemaStructuredData: schema,
      technicalReadiness: tech,
      localGbp: gbp,
    },
    scoredAt: new Date(),
  } as CompositeScore;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Fetch audit result
    const rows = await db
      .select()
      .from(auditResults)
      .where(sql`${auditResults.id} = ${id}`)
      .limit(1);

    const audit = rows[0];
    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    // Fetch client info
    let clientName = 'Unknown Business';
    let clientDomain = '';
    let clientVertical = 'general';

    if (audit.clientId) {
      const clientRows = await db
        .select({
          businessName: clients.businessName,
          domain: clients.domain,
          vertical: clients.vertical,
        })
        .from(clients)
        .where(sql`${clients.id} = ${audit.clientId}`)
        .limit(1);

      if (clientRows[0]) {
        clientName = clientRows[0].businessName;
        clientDomain = clientRows[0].domain;
        clientVertical = clientRows[0].vertical;
      }
    }

    // Reconstruct CompositeScore from DB data
    const compositeScore = buildCompositeScore(audit);

    // Generate proposal
    const proposal = await generateProposal(compositeScore, {
      name: clientName,
      domain: clientDomain,
      vertical: clientVertical,
      auditDate: new Date(audit.auditDate),
    });

    return NextResponse.json(proposal);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to generate proposal', details: message },
      { status: 500 },
    );
  }
}
