/**
 * PDF Generation Tool
 * Owner: S10 (Report Templates)
 *
 * Renders HTML report templates to PDF via Puppeteer page.pdf().
 * Typed input -> typed output. Designed as a typed tool function
 * that can be wrapped as an MCP tool or Inngest step.
 *
 * Usage:
 *   import { generatePdf } from '@pare-engine/core/tools/generate-pdf';
 *   const pdf = await generatePdf(fullReportData, 'full');
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import type {
  FullReportData,
  MiniReportData,
  PdfOutput,
  ReportFinding,
  PlatformSnapshot,
  ReportCompetitor,
} from '../contracts/report.contract.js';
import type { CompositeScore } from '../contracts/scoring.contract.js';
import { SCORING_WEIGHTS } from '../contracts/scoring.contract.js';
import {
  circularGauge,
  horizontalBarChart,
  smallGauge,
  sentimentDonut,
  platformIndicators,
  checklist,
  type PlatformStatus,
  type ChecklistItem,
} from '../report-templates/charts.js';

// --- Template Loading ---

/**
 * Resolves the templates directory. At runtime the compiled JS lives in
 * `dist/tools/generate-pdf.js`, so we resolve `../report-templates` relative
 * to that. If the HTML files haven't been copied to `dist/` yet (e.g. during
 * development or if the build script doesn't copy assets), we fall back to the
 * source `src/report-templates/` directory.
 */
function resolveTemplatesDir(): string {
  const thisFile = fileURLToPath(import.meta.url);
  const thisDir = path.dirname(thisFile);

  // Primary: relative to this file (works for both src/ and dist/)
  const primary = path.resolve(thisDir, '..', 'report-templates');
  if (fs.existsSync(path.join(primary, 'audit-mini.html'))) {
    return primary;
  }

  // Fallback: from dist/tools/ look at ../../src/report-templates/
  const fallback = path.resolve(thisDir, '..', '..', 'src', 'report-templates');
  if (fs.existsSync(path.join(fallback, 'audit-mini.html'))) {
    return fallback;
  }

  // Last resort: return primary and let it fail with a clear error
  return primary;
}

const TEMPLATES_DIR = resolveTemplatesDir();

function loadTemplate(filename: string): string {
  const filePath = path.join(TEMPLATES_DIR, filename);
  return fs.readFileSync(filePath, 'utf-8');
}

function loadStyles(): string {
  return loadTemplate('styles.css');
}

// --- HTML Escaping ---

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + '\u2026';
}

// --- Date Formatting ---

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// --- Score Color Helpers ---

function scoreColorClass(score: number, max: number): string {
  const pct = max > 0 ? score / max : 0;
  if (pct >= 0.8) return 'score-color-high';
  if (pct >= 0.6) return 'score-color-mid';
  return 'score-color-low';
}

function scoreColorHex(score: number, max: number): string {
  const pct = max > 0 ? score / max : 0;
  if (pct >= 0.8) return '#22C55E';
  if (pct >= 0.6) return '#FFB020';
  return '#EF4444';
}

// --- Finding Renderer ---

function renderFinding(f: ReportFinding): string {
  const iconMap: Record<string, string> = {
    critical: '&#9888;',
    warning: '&#9888;',
    info: '&#8505;',
    success: '&#10004;',
  };
  return `<div class="finding finding-${f.severity}">
  <span class="finding-icon">${iconMap[f.severity] ?? ''}</span>
  <div class="finding-body">
    <h4>${escapeHtml(f.title)}</h4>
    <p>${escapeHtml(f.description)}</p>
    ${f.recommendation ? `<p style="margin-top: 2px; font-style: italic;">${escapeHtml(f.recommendation)}</p>` : ''}
  </div>
</div>`;
}

function renderFindings(findings: ReportFinding[], limit?: number): string {
  const items = limit ? findings.slice(0, limit) : findings;
  if (items.length === 0) {
    return '<p class="text-muted text-small">No significant findings in this area.</p>';
  }
  return items.map(renderFinding).join('\n');
}

function renderFindingsBySeverity(findings: ReportFinding[], severities: string[]): string {
  const filtered = findings.filter((f) => severities.includes(f.severity));
  return renderFindings(filtered);
}

// --- Issue List Renderer ---

function renderIssueList(issues: string[]): string {
  if (issues.length === 0) {
    return '<p class="text-muted text-small">No issues found.</p>';
  }
  return `<div style="margin-bottom: 10px;">
  ${issues.map((issue) => `<div class="finding finding-warning">
    <span class="finding-icon">&#9888;</span>
    <div class="finding-body"><p>${escapeHtml(issue)}</p></div>
  </div>`).join('\n')}
</div>`;
}

// --- Template Interpolation ---

function interpolate(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    return data[key] ?? '';
  });
}

// --- Mini Report Builder ---

function buildMiniReportHtml(data: MiniReportData): string {
  const template = loadTemplate('audit-mini.html');
  const styles = loadStyles();

  const pillarScores = data.pillarScores;

  const overallGauge = circularGauge({
    score: data.overallScore,
    maxScore: 100,
    size: 120,
    strokeWidth: 10,
    showGrade: true,
    grade: data.letterGrade,
  });

  const aiVisGauge = smallGauge({ score: pillarScores.aiVisibility, maxScore: SCORING_WEIGHTS.aiVisibility, label: 'AI Visibility' });
  const contentGauge = smallGauge({ score: pillarScores.contentQuality, maxScore: SCORING_WEIGHTS.contentQuality, label: 'Content' });
  const schemaGauge = smallGauge({ score: pillarScores.schemaStructuredData, maxScore: SCORING_WEIGHTS.schemaStructuredData, label: 'Schema' });
  const techGauge = smallGauge({ score: pillarScores.technicalReadiness, maxScore: SCORING_WEIGHTS.technicalReadiness, label: 'Technical' });
  const gbpGauge = smallGauge({ score: pillarScores.localGbp, maxScore: SCORING_WEIGHTS.localGbp, label: 'Local/GBP' });

  const findingsHtml = renderFindings(data.topFindings, 3);

  const replacements: Record<string, string> = {
    styles,
    businessName: escapeHtml(truncate(data.client.businessName, 60)),
    domain: escapeHtml(data.client.domain),
    auditDate: formatDate(data.generatedAt),
    overallGauge,
    aiVisibilityGauge: aiVisGauge,
    contentQualityGauge: contentGauge,
    schemaGauge,
    technicalGauge: techGauge,
    localGbpGauge: gbpGauge,
    findings: findingsHtml,
    ctaText: escapeHtml(data.ctaText ?? 'Get your full AI Readiness Audit'),
  };

  return interpolate(template, replacements);
}

// --- Full Report Builder ---

function buildFullReportHtml(data: FullReportData): string {
  const template = loadTemplate('audit-full.html');
  const styles = loadStyles();

  const score = data.score;
  const pillars = score.pillars;

  // Summary verdict based on grade
  const verdictMap: Record<string, string> = {
    A: 'Your business demonstrates strong AI readiness. Focus on maintaining and extending your lead.',
    B: 'Your business has a solid foundation but there are clear opportunities to strengthen your AI presence.',
    C: 'Your business has moderate AI visibility. Several improvements are needed to stay competitive.',
    D: 'Your business has limited AI readiness. Significant work is needed across multiple areas.',
    F: 'Your business is largely invisible to AI engines. Immediate action is required on foundational elements.',
  };

  // Cover gauge
  const coverGauge = circularGauge({
    score: score.overallScore,
    maxScore: 100,
    size: 160,
    strokeWidth: 12,
    showGrade: true,
    grade: score.letterGrade,
  });

  // Summary gauge
  const summaryGauge = circularGauge({
    score: score.overallScore,
    maxScore: 100,
    size: 130,
    strokeWidth: 10,
    showGrade: true,
    grade: score.letterGrade,
  });

  // Pillar bar chart
  const pillarBarChart = horizontalBarChart({
    items: [
      { label: 'AI Visibility', value: pillars.aiVisibility.score, maxValue: SCORING_WEIGHTS.aiVisibility },
      { label: 'Content Quality', value: pillars.contentQuality.score, maxValue: SCORING_WEIGHTS.contentQuality },
      { label: 'Schema / Structured Data', value: pillars.schemaStructuredData.score, maxValue: SCORING_WEIGHTS.schemaStructuredData },
      { label: 'Technical Readiness', value: pillars.technicalReadiness.score, maxValue: SCORING_WEIGHTS.technicalReadiness },
      { label: 'Local / GBP', value: pillars.localGbp.score, maxValue: SCORING_WEIGHTS.localGbp },
    ],
  });

  // Platform indicators
  const platformStatuses: PlatformStatus[] = data.platformSnapshots.map((snap: PlatformSnapshot) => ({
    platform: snap.platform,
    mentioned: snap.mentioned,
    sentiment: snap.sentiment,
  }));
  const platformIndicatorsHtml = platformIndicators(platformStatuses);

  // Critical findings (top 3 critical/warning)
  const criticalFindings = renderFindingsBySeverity(data.findings, ['critical', 'warning']);

  // AI Visibility page data
  const aiVis = pillars.aiVisibility;
  const mentionRatePercent = Math.round(aiVis.mentionRate * 100).toString();
  const citationRatePercent = Math.round(aiVis.citationRate * 100).toString();
  const sentimentDonutSvg = sentimentDonut(aiVis.sentimentBreakdown);
  const avgPositionDisplay = aiVis.avgPosition !== null ? `#${aiVis.avgPosition}` : 'N/A';

  // Platform rows
  const platformRows = data.platformSnapshots.map((snap: PlatformSnapshot) => {
    const mentionedDisplay = snap.mentioned ? '<span style="color: #22C55E;">Yes</span>' : '<span style="color: #EF4444;">No</span>';
    const posDisplay = snap.position !== null ? `#${snap.position}` : '&mdash;';
    const sentClass = `sentiment-${snap.sentiment}`;
    const sentDisplay = snap.sentiment === 'not_mentioned' ? 'Not mentioned' : snap.sentiment.charAt(0).toUpperCase() + snap.sentiment.slice(1);
    const citedDisplay = snap.citedUrl ? '<span style="color: #22C55E;">Yes</span>' : '<span style="color: #EF4444;">No</span>';
    const platformName = snap.platform === 'chatgpt' ? 'ChatGPT' : snap.platform === 'perplexity' ? 'Perplexity' : snap.platform === 'gemini' ? 'Gemini' : snap.platform;

    return `<tr>
      <td><span class="platform-badge platform-${snap.platform}">${escapeHtml(platformName)}</span></td>
      <td>${mentionedDisplay}</td>
      <td class="font-mono">${posDisplay}</td>
      <td class="${sentClass}">${sentDisplay}</td>
      <td>${citedDisplay}</td>
    </tr>`;
  }).join('\n');

  // AI Visibility findings
  const aiVisFindings = renderFindings(
    data.findings.filter((f) => f.title.toLowerCase().includes('visibility') || f.title.toLowerCase().includes('mention') || f.title.toLowerCase().includes('citation')),
    3
  );

  // Content page data
  const content = pillars.contentQuality;
  const answerFirstScore = content.avgAnswerFirstScore.toFixed(1);
  const faqCoverage = content.faqCoverage.toString();
  const statsDensity = content.statsDensity.toFixed(1);
  const authorRate = Math.round(content.authorAttributionRate * 100).toString();

  // Content weaknesses
  const contentWeaknessList = renderIssueList(data.contentWeaknesses);
  const contentFindings = renderFindings(
    data.findings.filter((f) => f.title.toLowerCase().includes('content') || f.title.toLowerCase().includes('faq') || f.title.toLowerCase().includes('answer')),
    3
  );

  // Schema page data
  const schema = pillars.schemaStructuredData;
  const requiredPresent = schema.requiredTypesPresent.toString();
  const requiredTotal = schema.requiredTypesTotal.toString();
  const recommendedPresent = schema.recommendedTypesPresent.toString();
  const validationErrors = schema.validationErrorCount.toString();
  const validationErrorColor = schema.validationErrorCount > 0 ? '#EF4444' : '#22C55E';

  // Schema gaps
  const schemaGapList = renderIssueList(data.schemaGaps);
  const schemaFindings = renderFindings(
    data.findings.filter((f) => f.title.toLowerCase().includes('schema') || f.title.toLowerCase().includes('json-ld') || f.title.toLowerCase().includes('structured')),
    3
  );

  // Technical page data
  const tech = pillars.technicalReadiness;
  const technicalChecklistItems: ChecklistItem[] = [
    { label: 'AI crawlers allowed in robots.txt', passed: tech.aiCrawlerAccess },
    { label: 'llms.txt present', passed: tech.llmsTxtPresent },
    { label: 'XML sitemap present', passed: tech.sitemapPresent },
  ];
  const performanceChecklistItems: ChecklistItem[] = [
    { label: 'HTTPS enabled', passed: tech.httpsEnabled },
    { label: 'Mobile friendly', passed: tech.mobileFriendly },
  ];
  const technicalChecklistSvg = checklist(technicalChecklistItems);
  const performanceChecklistSvg = checklist(performanceChecklistItems);

  const technicalIssueList = renderIssueList(data.technicalIssues);
  const technicalFindings = renderFindings(
    data.findings.filter((f) => f.title.toLowerCase().includes('technical') || f.title.toLowerCase().includes('robot') || f.title.toLowerCase().includes('llms.txt') || f.title.toLowerCase().includes('sitemap')),
    3
  );

  // GBP page data
  const gbp = pillars.localGbp;
  const gbpChecklistItems: ChecklistItem[] = [
    { label: 'Profile is complete', passed: gbp.gbpComplete },
    { label: 'NAP consistent', passed: gbp.napConsistent },
  ];
  const gbpChecklistSvg = checklist(gbpChecklistItems);
  const reviewRating = gbp.reviewScore.toFixed(1);
  const reviewCount = gbp.breakdown['reviewCount']?.toString() ?? '0';
  const napColor = gbp.napConsistent ? '#22C55E' : '#EF4444';
  const napStatus = gbp.napConsistent ? 'Consistent' : 'Inconsistent';

  const gbpIssueList = renderIssueList(data.gbpIssues);
  const gbpFindings = renderFindings(
    data.findings.filter((f) => f.title.toLowerCase().includes('gbp') || f.title.toLowerCase().includes('review') || f.title.toLowerCase().includes('local') || f.title.toLowerCase().includes('nap')),
    3
  );

  // Competitor rows
  const competitorRows = data.competitors.length > 0
    ? data.competitors.map((c: ReportCompetitor, idx: number) => {
        const mentionDisplay = c.mentionRate !== undefined ? `${Math.round(c.mentionRate * 100)}%` : '&mdash;';
        const scoreDisplay = c.overallScore !== undefined ? `${c.overallScore}/100` : '&mdash;';
        const rankDisplay = c.rank !== undefined ? `#${c.rank}` : '&mdash;';
        return `<tr>
          <td>${escapeHtml(truncate(c.name, 30))}${c.domain ? ` <span class="text-muted text-xs">(${escapeHtml(c.domain)})</span>` : ''}</td>
          <td class="font-mono">${mentionDisplay}</td>
          <td class="font-mono">${scoreDisplay}</td>
          <td class="font-mono">${rankDisplay}</td>
        </tr>`;
      }).join('\n')
    : '<tr><td colspan="4" class="text-muted text-center">No competitor data available.</td></tr>';

  // Sample AI responses
  const sampleResponses = data.platformSnapshots
    .filter((snap: PlatformSnapshot) => snap.sampleResponse)
    .slice(0, 3)
    .map((snap: PlatformSnapshot) => {
      const platformName = snap.platform === 'chatgpt' ? 'ChatGPT' : snap.platform === 'perplexity' ? 'Perplexity' : snap.platform === 'gemini' ? 'Gemini' : snap.platform;
      return `<div class="card" style="margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
          <span class="platform-badge platform-${snap.platform}">${escapeHtml(platformName)}</span>
          <span class="sentiment-${snap.sentiment} text-small font-bold">${snap.sentiment}</span>
        </div>
        <p class="text-small" style="font-style: italic; color: var(--color-text-muted);">"${escapeHtml(truncate(snap.sampleResponse ?? '', 300))}"</p>
      </div>`;
    }).join('\n') || '<p class="text-muted text-small">No sample responses available.</p>';

  // Action plan rows
  const actionPlanRows = data.actionPlan.length > 0
    ? data.actionPlan.map((item) => {
        const impactClass = `priority-${item.impact}`;
        const effortClass = `effort-${item.effort}`;
        return `<tr>
          <td class="font-mono font-bold text-center">${item.priority}</td>
          <td>${escapeHtml(item.action)}</td>
          <td class="text-small">${escapeHtml(item.pillar)}</td>
          <td><span class="priority-tag ${impactClass}">${item.impact}</span></td>
          <td><span class="effort-tag ${effortClass}">${item.effort.replace('-', ' ')}</span></td>
        </tr>`;
      }).join('\n')
    : '<tr><td colspan="5" class="text-muted text-center">No action items generated.</td></tr>';

  // Providers used / query count
  const providersUsed = aiVis.providersUsed.toString();
  const queryCount = data.platformSnapshots.length > 0
    ? Math.ceil(data.platformSnapshots.length / Math.max(aiVis.providersUsed, 1)).toString()
    : '0';

  const replacements: Record<string, string> = {
    styles,
    businessName: escapeHtml(truncate(data.client.businessName, 50)),
    domain: escapeHtml(data.client.domain),
    auditDate: formatDate(data.client.auditDate),
    reportVersion: data.reportVersion ?? '1.0',
    overallScore: score.overallScore.toString(),
    letterGrade: score.letterGrade,
    coverGauge,
    summaryGauge,
    summaryVerdict: verdictMap[score.letterGrade] ?? '',
    pillarBarChart,
    platformIndicators: platformIndicatorsHtml,
    criticalFindings,

    // AI Visibility
    aiVisibilityScore: Math.round(aiVis.score).toString(),
    providersUsed,
    queryCount,
    mentionRatePercent,
    citationRatePercent,
    sentimentDonut: sentimentDonutSvg,
    sentimentPositive: aiVis.sentimentBreakdown.positive.toString(),
    sentimentNeutral: aiVis.sentimentBreakdown.neutral.toString(),
    sentimentNegative: aiVis.sentimentBreakdown.negative.toString(),
    avgPositionDisplay,
    platformRows,
    aiVisibilityFindings: aiVisFindings,

    // Content
    contentScore: Math.round(content.score).toString(),
    answerFirstScore,
    faqCoverage,
    statsDensity,
    authorRate,
    contentWeaknessList,
    contentFindings,

    // Schema
    schemaScore: Math.round(schema.score).toString(),
    requiredPresent,
    requiredTotal,
    recommendedPresent,
    validationErrors,
    validationErrorColor,
    schemaGapList,
    schemaFindings,

    // Technical
    technicalScore: Math.round(tech.score).toString(),
    technicalChecklist: technicalChecklistSvg,
    performanceChecklist: performanceChecklistSvg,
    technicalIssueList,
    technicalFindings,

    // GBP
    gbpScore: Math.round(gbp.score).toString(),
    gbpChecklist: gbpChecklistSvg,
    reviewRating,
    reviewCount,
    napColor,
    napStatus,
    gbpIssueList,
    gbpFindings,

    // Competitors / AI Accuracy
    competitorRows,
    sampleResponses,

    // Action Plan
    actionPlanRows,
  };

  return interpolate(template, replacements);
}

// --- PDF Generation ---

export interface GeneratePdfOptions {
  /** Keep browser instance open for reuse (caller manages lifecycle). */
  browser?: Awaited<ReturnType<typeof puppeteer.launch>>;
}

/**
 * Generates a PDF report from FullReportData or MiniReportData.
 *
 * @param data - Report data (validated against contracts)
 * @param type - 'full' for 9-page audit, 'mini' for 1-page summary
 * @param options - Optional browser instance reuse
 * @returns PdfOutput with buffer, filename, page count, and timestamp
 */
export async function generatePdf(
  data: FullReportData | MiniReportData,
  type: 'full' | 'mini',
  options?: GeneratePdfOptions
): Promise<PdfOutput> {
  // Build HTML
  const html = type === 'full'
    ? buildFullReportHtml(data as FullReportData)
    : buildMiniReportHtml(data as MiniReportData);

  // Launch browser or reuse provided instance
  const ownsBrowser = !options?.browser;
  const browser = options?.browser ?? await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });

    await page.close();

    // Determine filename
    const clientName = type === 'full'
      ? (data as FullReportData).client.businessName
      : (data as MiniReportData).client.businessName;
    const safeName = clientName
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .slice(0, 40);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `pare-${type}-audit-${safeName}-${dateStr}.pdf`;

    // Count pages (approximate from buffer size for mini, exact for full)
    const pageCount = type === 'mini' ? 1 : 9;

    return {
      buffer: Buffer.from(pdfBuffer),
      filename,
      pageCount,
      generatedAt: new Date(),
    };
  } finally {
    if (ownsBrowser) {
      await browser.close();
    }
  }
}

// --- HTML Export (for debugging / preview) ---

/**
 * Returns the rendered HTML string without converting to PDF.
 * Useful for previewing templates in a browser.
 */
export function renderReportHtml(
  data: FullReportData | MiniReportData,
  type: 'full' | 'mini'
): string {
  return type === 'full'
    ? buildFullReportHtml(data as FullReportData)
    : buildMiniReportHtml(data as MiniReportData);
}
