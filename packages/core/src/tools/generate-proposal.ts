/**
 * Proposal Generation Tool
 * Owner: Task 1.3 (Proposal Engine / Auto-SOW)
 *
 * Takes a CompositeScore and client info, generates a priced Statement of Work.
 * All proposals are DRAFTS — the operator must review before sending.
 *
 * Uses heuristic mapping from pillar scores to line items, plus
 * Claude Haiku via AI SDK for the executive summary.
 *
 * Usage:
 *   import { generateProposal } from '@pare-engine/core/tools/generate-proposal';
 *   const proposal = await generateProposal(score, clientInfo);
 */

import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import type { CompositeScore } from '../contracts/scoring.contract.js';
import type { ProposalData, ProposalLineItem } from '../contracts/proposal.contract.js';
import { scoreToGrade, SCORING_WEIGHTS } from '../contracts/scoring.contract.js';

// --- Custom Error ---

export class ProposalGenerationError extends Error {
  public readonly code: string;

  constructor(message: string, code: string, cause?: unknown) {
    super(message);
    this.name = 'ProposalGenerationError';
    this.code = code;
    if (cause) {
      this.cause = cause;
    }
  }
}

// --- Client Info Shape ---

export interface ProposalClientInfo {
  name: string;
  domain: string;
  vertical: string;
  auditDate: Date;
}

// --- Price Constants (in cents) ---

const PRICES = {
  schemaImplementation: 50_000,       // $500
  aiVisibilitySprint: 150_000,        // $1,500
  contentOptimization: 80_000,        // $800
  technicalReadiness: 150_000,        // $1,500 (10hrs at $150/hr)
  gbpOptimization: 40_000,            // $400
  comprehensiveOverhaul: 350_000,     // $3,500 (discount bundle)
} as const;

// --- Threshold Constants ---

const THRESHOLDS = {
  schemaPctOfMax: 0.8,        // < 80% of max (12/15)
  aiVisibilityMentionRate: 0.2, // mentionRate < 0.2
  contentPctOfMax: 0.7,       // < 70% of max (21/30)
  gbpPctOfMax: 0.7,           // < 70% of max (10.5/15)
  overallScoreLow: 50,        // overall < 50 triggers bundle
} as const;

// --- Line Item Generation ---

function buildLineItems(score: CompositeScore): ProposalLineItem[] {
  const items: ProposalLineItem[] = [];
  let priority = 1;

  const pillars = score.pillars;

  // Schema pillar < 80% of max
  const schemaPct = pillars.schemaStructuredData.score / pillars.schemaStructuredData.maxScore;
  if (schemaPct < THRESHOLDS.schemaPctOfMax) {
    items.push({
      name: 'Structured Data Implementation',
      description:
        'Implement and validate JSON-LD schema markup (LocalBusiness, Organization, FAQPage, Service) ' +
        'across your website to help AI engines understand your business offerings.',
      pillar: 'Schema / Structured Data',
      price: PRICES.schemaImplementation,
      effort: 'sprint',
      priority: priority++,
    });
  }

  // AI Visibility mentionRate < 0.2
  if (pillars.aiVisibility.mentionRate < THRESHOLDS.aiVisibilityMentionRate) {
    items.push({
      name: 'AI Visibility Sprint',
      description:
        'Comprehensive 4-week sprint to increase your mention rate across ChatGPT, Perplexity, and Gemini. ' +
        'Includes content restructuring, citation building, and authority signal optimization.',
      pillar: 'AI Visibility',
      price: PRICES.aiVisibilitySprint,
      effort: 'sprint',
      priority: priority++,
    });
  }

  // Content quality < 70% of max
  const contentPct = pillars.contentQuality.score / pillars.contentQuality.maxScore;
  if (contentPct < THRESHOLDS.contentPctOfMax) {
    items.push({
      name: 'Content Optimization Package',
      description:
        'Rewrite key pages in answer-first format, add FAQ sections with schema markup, ' +
        'improve statistics density, and add author attribution to boost AI engine preference.',
      pillar: 'Content Quality',
      price: PRICES.contentOptimization,
      effort: 'sprint',
      priority: priority++,
    });
  }

  // Technical issues
  const tech = pillars.technicalReadiness;
  const hasTechnicalIssues =
    !tech.llmsTxtPresent ||
    !tech.sitemapPresent ||
    !tech.aiCrawlerAccess;
  if (hasTechnicalIssues) {
    const issues: string[] = [];
    if (!tech.llmsTxtPresent) issues.push('llms.txt creation');
    if (!tech.sitemapPresent) issues.push('XML sitemap setup');
    if (!tech.aiCrawlerAccess) issues.push('robots.txt AI crawler rules');
    items.push({
      name: 'Technical AI Readiness',
      description:
        `Address technical gaps including ${issues.join(', ')}. ` +
        'Estimated at $150/hr for 10 hours of implementation and testing.',
      pillar: 'Technical Readiness',
      price: PRICES.technicalReadiness,
      effort: 'quick-win',
      priority: priority++,
    });
  }

  // GBP < 70% of max
  const gbpPct = pillars.localGbp.score / pillars.localGbp.maxScore;
  if (gbpPct < THRESHOLDS.gbpPctOfMax) {
    items.push({
      name: 'Google Business Profile Optimization',
      description:
        'Complete and optimize your Google Business Profile including description, categories, ' +
        'photos, Q&A, and NAP consistency across directories to improve local AI recommendations.',
      pillar: 'Local / GBP',
      price: PRICES.gbpOptimization,
      effort: 'quick-win',
      priority: priority++,
    });
  }

  // Comprehensive bundle if overall score < 50
  if (score.overallScore < THRESHOLDS.overallScoreLow && items.length >= 3) {
    items.push({
      name: 'Comprehensive AI Readiness Overhaul',
      description:
        'Bundled discount for addressing all major issues. Includes all line items above ' +
        'at a reduced rate, plus ongoing monthly monitoring for 3 months.',
      pillar: 'All Pillars',
      price: PRICES.comprehensiveOverhaul,
      effort: 'ongoing',
      priority: priority++,
    });
  }

  return items;
}

// --- Timeline Estimation ---

function estimateTimeline(items: ProposalLineItem[]): string {
  const hasOngoing = items.some((item) => item.effort === 'ongoing');
  const sprintCount = items.filter((item) => item.effort === 'sprint').length;
  const quickWinCount = items.filter((item) => item.effort === 'quick-win').length;

  if (hasOngoing) {
    return '4-6 weeks initial + 3 months monitoring';
  }
  if (sprintCount >= 2) {
    return '3-4 weeks';
  }
  if (sprintCount === 1) {
    return '2-3 weeks';
  }
  if (quickWinCount > 0) {
    return '1-2 weeks';
  }
  return '1 week';
}

// --- Executive Summary via LLM ---

async function generateExecutiveSummary(
  score: CompositeScore,
  clientInfo: ProposalClientInfo,
  lineItems: ProposalLineItem[],
): Promise<string> {
  const pillarSummary = [
    `AI Visibility: ${Math.round(score.pillars.aiVisibility.score)}/${SCORING_WEIGHTS.aiVisibility}`,
    `Content Quality: ${Math.round(score.pillars.contentQuality.score)}/${SCORING_WEIGHTS.contentQuality}`,
    `Schema: ${Math.round(score.pillars.schemaStructuredData.score)}/${SCORING_WEIGHTS.schemaStructuredData}`,
    `Technical: ${Math.round(score.pillars.technicalReadiness.score)}/${SCORING_WEIGHTS.technicalReadiness}`,
    `Local/GBP: ${Math.round(score.pillars.localGbp.score)}/${SCORING_WEIGHTS.localGbp}`,
  ].join(', ');

  const itemNames = lineItems.map((item) => item.name).join(', ');

  const prompt = `You are writing a brief executive summary for a consulting proposal.

Client: ${clientInfo.name} (${clientInfo.domain})
Vertical: ${clientInfo.vertical}
Overall AI Readiness Score: ${score.overallScore}/100 (Grade: ${score.letterGrade})
Pillar Scores: ${pillarSummary}
Proposed Services: ${itemNames}

Write exactly 2-3 professional sentences summarizing:
1. The client's current AI readiness state
2. What the proposed services will address

Be direct and professional. No bullet points, no headers, no markdown. Plain text only.`;

  try {
    const result = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      prompt,
      maxOutputTokens: 200,
      temperature: 0.3,
    });

    const summary = result.text.trim();
    if (summary.length < 20) {
      throw new ProposalGenerationError(
        'LLM returned insufficient executive summary',
        'SUMMARY_TOO_SHORT',
      );
    }
    return summary;
  } catch (error: unknown) {
    if (error instanceof ProposalGenerationError) {
      throw error;
    }
    // Graceful degradation: generate a fallback summary without LLM
    const grade = score.letterGrade;
    const fallback =
      `${clientInfo.name} currently scores ${score.overallScore}/100 (Grade ${grade}) ` +
      `on AI readiness, indicating ${grade === 'F' ? 'critical' : grade === 'D' ? 'significant' : 'notable'} ` +
      `gaps in how AI engines perceive the business. ` +
      `This proposal outlines ${lineItems.length} targeted service${lineItems.length > 1 ? 's' : ''} ` +
      `to address the highest-impact areas and improve visibility across ChatGPT, Perplexity, and Gemini.`;
    return fallback;
  }
}

// --- Main Export ---

/**
 * Generates a draft proposal (Statement of Work) from audit scores and client info.
 *
 * The function:
 * 1. Maps pillar scores to priced line items using heuristic thresholds
 * 2. Generates an executive summary via Claude (with fallback)
 * 3. Returns a complete ProposalData object marked as isDraft: true
 *
 * @param score - CompositeScore from the audit pipeline
 * @param clientInfo - Client name, domain, vertical, audit date
 * @returns ProposalData ready for review and PDF rendering
 */
export async function generateProposal(
  score: CompositeScore,
  clientInfo: ProposalClientInfo,
): Promise<ProposalData> {
  // Validate inputs
  if (!clientInfo.name || !clientInfo.domain || !clientInfo.vertical) {
    throw new ProposalGenerationError(
      'Client info must include name, domain, and vertical',
      'INVALID_CLIENT_INFO',
    );
  }

  if (score.overallScore < 0 || score.overallScore > 100) {
    throw new ProposalGenerationError(
      `Invalid overall score: ${score.overallScore}. Must be 0-100.`,
      'INVALID_SCORE',
    );
  }

  // Build line items from score heuristics
  const lineItems = buildLineItems(score);

  if (lineItems.length === 0) {
    // If all pillars score well, add a monitoring/maintenance item
    lineItems.push({
      name: 'AI Visibility Monitoring',
      description:
        'Monthly monitoring of your AI visibility across all major platforms. ' +
        'Includes weekly query tracking, score trending, and quarterly strategy reviews.',
      pillar: 'All Pillars',
      price: 50_000, // $500/month
      effort: 'ongoing',
      priority: 1,
    });
  }

  // Calculate subtotal
  const subtotal = lineItems.reduce((sum, item) => sum + item.price, 0);

  // Generate executive summary via LLM (with graceful fallback)
  const executiveSummary = await generateExecutiveSummary(score, clientInfo, lineItems);

  // Estimate timeline
  const estimatedTimeline = estimateTimeline(lineItems);

  return {
    clientName: clientInfo.name,
    domain: clientInfo.domain,
    vertical: clientInfo.vertical,
    auditDate: clientInfo.auditDate,
    overallScore: score.overallScore,
    letterGrade: score.letterGrade,
    lineItems,
    subtotal,
    executiveSummary,
    estimatedTimeline,
    generatedAt: new Date(),
    isDraft: true,
  };
}
