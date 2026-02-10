// Owner: S12 (Inngest Pipeline). Consumers: pipeline.ts
// Orchestrates report data assembly and PDF generation.
//
// Assembles FullReportData or MiniReportData from the audit pipeline outputs,
// then delegates to S10's generatePdf() for HTML -> Puppeteer -> PDF.
//
// This step is independently retriable by Inngest.

import type {
  AuditRequest,
  CompositeScore,
  ContentAnalysisOutput,
  SchemaAnalysisOutput,
  TechnicalAnalysisOutput,
  GBPAnalysisOutput,
  MultiProviderResult,
  ParsedMention,
  PdfOutput,
  FullReportData,
  MiniReportData,
  ReportFinding,
  PlatformSnapshot,
  ReportCompetitor,
} from '@pare-engine/core/contracts';

// NOTE: @pare-engine/core does not yet export a ./tools/* subpath.
// We use a dynamic import to load generatePdf at runtime, bypassing
// the TypeScript compile-time package.json exports check.
// When core adds a ./tools subpath export, replace with a static import.

// ---------------------------------------------------------------------------
// Error Class
// ---------------------------------------------------------------------------

export class ReportError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'ReportError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Step Input
// ---------------------------------------------------------------------------

export interface ReportStepInput {
  auditRequest: AuditRequest;
  score: CompositeScore;
  analysisData: {
    content: ContentAnalysisOutput;
    schema: SchemaAnalysisOutput;
    technical: TechnicalAnalysisOutput;
    gbp: GBPAnalysisOutput;
  };
  queryResult: MultiProviderResult;
  mentions: ParsedMention[];
}

// ---------------------------------------------------------------------------
// Helpers: Extract findings from analysis data
// ---------------------------------------------------------------------------

function extractFindings(
  score: CompositeScore,
  analysisData: ReportStepInput['analysisData'],
): ReportFinding[] {
  const findings: ReportFinding[] = [];
  const pillars = score.pillars;

  // AI Visibility findings
  if (pillars.aiVisibility.mentionRate < 0.3) {
    findings.push({
      severity: 'critical',
      title: 'Low AI Visibility',
      description: `Brand is mentioned in only ${Math.round(pillars.aiVisibility.mentionRate * 100)}% of AI engine responses.`,
      recommendation: 'Improve content authority, add structured data, and ensure consistent NAP across directories.',
      effort: 'sprint',
    });
  }
  if (pillars.aiVisibility.citationRate < 0.2) {
    findings.push({
      severity: 'warning',
      title: 'Low Citation Rate',
      description: `Brand URL is cited in only ${Math.round(pillars.aiVisibility.citationRate * 100)}% of responses.`,
      recommendation: 'Add authoritative content with statistics, expert quotes, and structured data to encourage citations.',
      effort: 'sprint',
    });
  }

  // Content findings
  if (pillars.contentQuality.avgAnswerFirstScore < 4) {
    findings.push({
      severity: 'warning',
      title: 'Content Lacks Answer-First Format',
      description: `Average answer-first score is ${pillars.contentQuality.avgAnswerFirstScore.toFixed(1)}/10. AI engines prefer content that leads with direct answers.`,
      recommendation: 'Restructure key pages to lead with a concise answer or summary before detailed content.',
      effort: 'quick-win',
    });
  }
  if (pillars.contentQuality.faqCoverage === 0) {
    findings.push({
      severity: 'warning',
      title: 'No FAQ Content Detected',
      description: 'No FAQ or Q&A pages were found. FAQ content is heavily favored by AI engines.',
      recommendation: 'Create comprehensive FAQ pages for each service area.',
      effort: 'quick-win',
    });
  }

  // Schema findings
  if (analysisData.schema.allMissingRequired.length > 0) {
    findings.push({
      severity: 'critical',
      title: 'Missing Required Schema Types',
      description: `Missing ${analysisData.schema.allMissingRequired.length} required JSON-LD types: ${analysisData.schema.allMissingRequired.slice(0, 5).join(', ')}.`,
      recommendation: 'Add the missing schema.org types to your pages. This is often a quick-win that immediately improves AI understanding.',
      effort: 'quick-win',
    });
  }
  if (analysisData.schema.totalValidationErrors > 0) {
    findings.push({
      severity: 'warning',
      title: 'JSON-LD Validation Errors',
      description: `Found ${analysisData.schema.totalValidationErrors} validation error(s) in structured data.`,
      recommendation: 'Fix JSON-LD syntax errors and missing required properties.',
      effort: 'quick-win',
    });
  }

  // Technical findings
  if (!analysisData.technical.robotsTxt.aiFriendly) {
    findings.push({
      severity: 'critical',
      title: 'AI Crawlers Blocked by robots.txt',
      description: `The following AI bots are blocked: ${analysisData.technical.robotsTxt.blockedBots.join(', ')}.`,
      recommendation: 'Update robots.txt to allow AI crawler access. This is the single most impactful quick fix.',
      effort: 'quick-win',
    });
  }
  if (!analysisData.technical.llmsTxtPresent) {
    findings.push({
      severity: 'info',
      title: 'No llms.txt File',
      description: 'No llms.txt file was found. This emerging standard helps LLMs understand your site.',
      recommendation: 'Create an llms.txt file that describes your business and services.',
      effort: 'quick-win',
    });
  }

  // GBP findings
  if (!analysisData.gbp.placeId) {
    findings.push({
      severity: 'critical',
      title: 'No Google Business Profile Found',
      description: 'No GBP listing was found. This is essential for local AI visibility.',
      recommendation: 'Create and verify a Google Business Profile at business.google.com.',
      effort: 'quick-win',
    });
  }
  if (analysisData.gbp.reviewCount < 15) {
    findings.push({
      severity: 'warning',
      title: 'Low Review Count',
      description: `Only ${analysisData.gbp.reviewCount} reviews. AI engines trust businesses with more reviews.`,
      recommendation: 'Implement a systematic review generation strategy.',
      effort: 'ongoing',
    });
  }
  if (!analysisData.gbp.napConsistent) {
    findings.push({
      severity: 'warning',
      title: 'NAP Inconsistency Detected',
      description: 'Name, Address, or Phone information is inconsistent across directories.',
      recommendation: 'Audit and correct NAP across all directory listings.',
      effort: 'sprint',
    });
  }

  // Sort findings: critical first, then warning, then info, then success
  const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2, success: 3 };
  findings.sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9));

  return findings;
}

// ---------------------------------------------------------------------------
// Helpers: Build platform snapshots
// ---------------------------------------------------------------------------

function buildPlatformSnapshots(
  queryResult: MultiProviderResult,
  mentions: ParsedMention[],
): PlatformSnapshot[] {
  const successfulResponses = queryResult.responses.filter((r) => r.success);
  const snapshots: PlatformSnapshot[] = [];
  const seenPlatforms = new Set<string>();

  for (let i = 0; i < successfulResponses.length; i++) {
    const response = successfulResponses[i];
    const mention = mentions[i];

    // Only include one snapshot per platform (use first response per platform)
    if (seenPlatforms.has(response.platform)) continue;
    seenPlatforms.add(response.platform);

    snapshots.push({
      platform: response.platform,
      mentioned: mention?.brandMentioned ?? false,
      position: mention?.brandPosition ?? null,
      sentiment: mention?.brandSentiment ?? 'not_mentioned',
      citedUrl: mention?.brandUrlCited ?? false,
      sampleResponse: response.rawResponse.slice(0, 500),
    });
  }

  return snapshots;
}

// ---------------------------------------------------------------------------
// Helpers: Build action plan
// ---------------------------------------------------------------------------

function buildActionPlan(
  findings: ReportFinding[],
): FullReportData['actionPlan'] {
  const actionPlan: FullReportData['actionPlan'] = [];
  let priority = 1;

  for (const finding of findings) {
    if (finding.recommendation && priority <= 10) {
      const pillarGuess = guessPillar(finding.title);
      actionPlan.push({
        priority,
        action: finding.recommendation,
        impact: finding.severity === 'critical' ? 'high' : finding.severity === 'warning' ? 'medium' : 'low',
        effort: finding.effort ?? 'sprint',
        pillar: pillarGuess,
      });
      priority++;
    }
  }

  return actionPlan;
}

function guessPillar(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('visibility') || lower.includes('mention') || lower.includes('citation')) return 'AI Visibility';
  if (lower.includes('content') || lower.includes('faq') || lower.includes('answer')) return 'Content Quality';
  if (lower.includes('schema') || lower.includes('json-ld') || lower.includes('structured')) return 'Schema';
  if (lower.includes('technical') || lower.includes('robot') || lower.includes('llms') || lower.includes('sitemap')) return 'Technical';
  if (lower.includes('gbp') || lower.includes('review') || lower.includes('nap') || lower.includes('local') || lower.includes('google business')) return 'Local/GBP';
  return 'General';
}

// ---------------------------------------------------------------------------
// Helpers: Extract issue lists for report sections
// ---------------------------------------------------------------------------

function extractContentWeaknesses(content: ContentAnalysisOutput): string[] {
  const weaknesses: string[] = [];
  if (content.averageAnswerFirstScore < 5) {
    weaknesses.push(`Low answer-first score (${content.averageAnswerFirstScore.toFixed(1)}/10). Pages do not lead with direct answers.`);
  }
  if (content.faqPageCount === 0) {
    weaknesses.push('No FAQ or Q&A content detected on any page.');
  }
  if (content.authorAttributionRate < 0.3) {
    weaknesses.push(`Low author attribution rate (${Math.round(content.authorAttributionRate * 100)}%). Named authors improve content trustworthiness.`);
  }
  if (content.averageStatsDensity < 1) {
    weaknesses.push('Low statistics density. Adding concrete data points and statistics improves AI credibility.');
  }
  return weaknesses;
}

function extractSchemaGaps(schema: SchemaAnalysisOutput): string[] {
  const gaps: string[] = [];
  for (const t of schema.allMissingRequired) {
    gaps.push(`Missing required type: ${t}`);
  }
  if (schema.totalValidationErrors > 0) {
    gaps.push(`${schema.totalValidationErrors} JSON-LD validation error(s) detected.`);
  }
  return gaps;
}

function extractTechnicalIssues(technical: TechnicalAnalysisOutput): string[] {
  const issues: string[] = [];
  if (!technical.robotsTxt.aiFriendly) {
    issues.push(`AI crawlers blocked: ${technical.robotsTxt.blockedBots.join(', ')}`);
  }
  if (!technical.llmsTxtPresent) {
    issues.push('No llms.txt file found.');
  }
  if (!technical.sitemapPresent) {
    issues.push('No XML sitemap found.');
  }
  if (!technical.httpsEnabled) {
    issues.push('HTTPS is not enabled.');
  }
  if (!technical.mobileFriendly) {
    issues.push('Site may not be mobile-friendly.');
  }
  return issues;
}

function extractGBPIssues(gbp: GBPAnalysisOutput): string[] {
  const issues: string[] = [];
  if (!gbp.placeId) {
    issues.push('No Google Business Profile found.');
  }
  if (!gbp.hasDescription) {
    issues.push('GBP profile is missing a business description.');
  }
  if (!gbp.hoursComplete) {
    issues.push('Business hours are incomplete on GBP.');
  }
  if (!gbp.napConsistent) {
    issues.push('NAP (Name/Address/Phone) is inconsistent across directories.');
  }
  if (gbp.reviewCount < 15) {
    issues.push(`Low review count (${gbp.reviewCount}). Aim for 50+ reviews.`);
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Build Competitors (placeholder — future S19 enrichment)
// ---------------------------------------------------------------------------

function buildCompetitorData(auditRequest: AuditRequest): ReportCompetitor[] {
  // For now, we only have competitor names from the audit request.
  // S19 (competitive intelligence) and S20 (verify loop) will enrich this.
  return auditRequest.competitors.map((name) => ({
    name,
    domain: undefined,
    overallScore: undefined,
    mentionRate: undefined,
    rank: undefined,
  }));
}

// ---------------------------------------------------------------------------
// Public API: Execute Report Step
// ---------------------------------------------------------------------------

/**
 * Executes the report generation step of the audit pipeline.
 *
 * Flow:
 * 1. Assemble all data into FullReportData or MiniReportData
 * 2. Call generatePdf() (S10) to render HTML template and produce PDF
 * 3. Return PdfOutput with buffer, filename, and metadata
 *
 * @param input - All pipeline data needed for the report
 * @returns PdfOutput with PDF buffer and metadata
 * @throws ReportError if report generation fails (retriable by Inngest)
 */
export async function executeReportStep(input: ReportStepInput): Promise<PdfOutput> {
  try {
    const { auditRequest, score, analysisData, queryResult, mentions } = input;
    const auditType = auditRequest.auditType;

    // Dynamic import of generatePdf from core tools (no subpath export yet).
    // We use a non-literal string in import() to prevent TypeScript from
    // resolving it at compile time (core's package.json exports only . and ./contracts).
    // At runtime, pnpm's workspace link resolves this to the built dist/ file.
    const pdfModulePath = ['@pare-engine', 'core', 'dist', 'tools', 'generate-pdf.js'].join('/');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfModule: any = await import(pdfModulePath);
    const generatePdf: (data: FullReportData | MiniReportData, type: 'full' | 'mini') => Promise<PdfOutput> = pdfModule.generatePdf;

    if (auditType === 'mini') {
      // Build MiniReportData
      const miniData: MiniReportData = {
        client: {
          businessName: auditRequest.businessName,
          domain: auditRequest.domain,
          vertical: auditRequest.vertical,
          city: auditRequest.city,
          state: auditRequest.state,
          auditDate: new Date(),
          auditType: 'mini',
        },
        overallScore: score.overallScore,
        letterGrade: score.letterGrade,
        pillarScores: {
          aiVisibility: score.pillars.aiVisibility.score,
          contentQuality: score.pillars.contentQuality.score,
          schemaStructuredData: score.pillars.schemaStructuredData.score,
          technicalReadiness: score.pillars.technicalReadiness.score,
          localGbp: score.pillars.localGbp.score,
        },
        topFindings: extractFindings(score, analysisData).slice(0, 3),
        ctaText: 'Get your full AI Readiness Audit',
        generatedAt: new Date(),
      };

      return await generatePdf(miniData, 'mini');
    }

    // Build FullReportData
    const findings = extractFindings(score, analysisData);
    const platformSnapshots = buildPlatformSnapshots(queryResult, mentions);
    const competitors = buildCompetitorData(auditRequest);
    const actionPlan = buildActionPlan(findings);

    const fullData: FullReportData = {
      client: {
        businessName: auditRequest.businessName,
        domain: auditRequest.domain,
        vertical: auditRequest.vertical,
        city: auditRequest.city,
        state: auditRequest.state,
        auditDate: new Date(),
        auditType: 'full',
      },
      score,
      competitors,
      platformSnapshots,
      findings,
      schemaGaps: extractSchemaGaps(analysisData.schema),
      technicalIssues: extractTechnicalIssues(analysisData.technical),
      contentWeaknesses: extractContentWeaknesses(analysisData.content),
      gbpIssues: extractGBPIssues(analysisData.gbp),
      actionPlan,
      generatedAt: new Date(),
      reportVersion: '1.0',
    };

    return await generatePdf(fullData, 'full');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ReportError(
      `Report generation failed: ${message}`,
      'REPORT_STEP_FAILED',
    );
  }
}
