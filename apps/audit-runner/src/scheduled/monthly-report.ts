// Owner: S24 (Monthly Trend Reports + Scheduled Monitoring)
// Inngest cron function: generates + emails monthly trend PDF for each retainer client.
//
// Triggered by: cron schedule (1st of every month at 8:00 AM UTC)
// Flow:
//   1. Query DB for all active retainer clients
//   2. For each client, aggregate monitoringResults by week
//   3. Compute score trend, pillar changes, key events
//   4. Render monthly-trend.html template with inline SVG chart
//   5. Generate PDF via Puppeteer
//   6. Email PDF to client contact via Resend
//
// Handles: <4 weeks of history (show what's available), no score change.
// Uses Promise.allSettled() for multi-client processing.

import { inngest } from '../inngest.js';
import type { CompositeScore } from '@pare-engine/core/contracts';
import { scoreToGrade, SCORING_WEIGHTS } from '@pare-engine/core/contracts';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import pg from 'pg';
import {
  clients,
  monitoringResults,
  auditResults,
} from '@pare-engine/core';

// ---------------------------------------------------------------------------
// Error Class
// ---------------------------------------------------------------------------

export class MonthlyReportError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'MonthlyReportError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RetainerClient {
  id: string;
  businessName: string;
  domain: string;
  vertical: string;
  locationCity: string | null;
  locationState: string | null;
  primaryContactEmail: string | null;
  initialAuditScore: number | null;
  currentScore: number | null;
}

/** A single week's aggregated monitoring snapshot. */
export interface WeeklySnapshot {
  weekStart: Date;
  weekEnd: Date;
  overallScore: number;
  pillarScores: {
    aiVisibility: number;
    contentQuality: number;
    schemaStructuredData: number;
    technicalReadiness: number;
    localGbp: number;
  };
  mentionRate: number;
  totalQueries: number;
  platformBreakdown: Record<string, {
    mentionRate: number;
    avgPosition: number | null;
    dominantSentiment: string;
  }>;
}

/** Key event detected from monitoring data. */
export interface KeyEvent {
  date: string;
  type: 'improvement' | 'decline' | 'milestone' | 'alert' | 'info';
  title: string;
  description: string;
}

/** Data shape injected into the monthly-trend.html template. */
export interface MonthlyTrendData {
  businessName: string;
  reportMonth: string;
  currentScore: number;
  letterGrade: string;
  startScore: number;
  monthChange: string;
  monthChangeClass: string;
  weeksMonitored: number;
  totalQueries: number;
  mentionRatePercent: number;
  platformsMonitored: number;
  insufficientDataNotice: string;
  trendLineChart: string;
  // Pillar changes
  aiVisibilityPrev: number;
  aiVisibilityCurr: number;
  aiVisibilityPercent: number;
  aiVisibilityColor: string;
  aiVisibilityDelta: string;
  aiVisibilityDeltaColor: string;
  contentPrev: number;
  contentCurr: number;
  contentPercent: number;
  contentColor: string;
  contentDelta: string;
  contentDeltaColor: string;
  schemaPrev: number;
  schemaCurr: number;
  schemaPercent: number;
  schemaColor: string;
  schemaDelta: string;
  schemaDeltaColor: string;
  technicalPrev: number;
  technicalCurr: number;
  technicalPercent: number;
  technicalColor: string;
  technicalDelta: string;
  technicalDeltaColor: string;
  gbpPrev: number;
  gbpCurr: number;
  gbpPercent: number;
  gbpColor: string;
  gbpDelta: string;
  gbpDeltaColor: string;
  // Page 2
  keyEvents: string;
  platformTrendRows: string;
  nextStepItems: string;
}

interface MonthlyReportResult {
  clientsProcessed: number;
  clientsFailed: number;
  reportsGenerated: number;
  emailsSent: number;
  completedAt: Date;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

interface ReportConfig {
  databaseUrl: string;
  resendApiKey: string;
  fromEmail: string;
}

function loadReportConfig(): ReportConfig {
  const get = (envKey: string, fallback?: string): string => {
    const value = process.env[envKey];
    if (!value && !fallback) {
      throw new MonthlyReportError(
        `Missing required environment variable: ${envKey}`,
        'CONFIG_MISSING',
      );
    }
    return value ?? fallback ?? '';
  };

  return {
    databaseUrl: get('DATABASE_URL'),
    resendApiKey: get('RESEND_API_KEY'),
    fromEmail: get('REPORT_FROM_EMAIL', 'reports@pareconsulting.com'),
  };
}

// ---------------------------------------------------------------------------
// Score Color Utility
// ---------------------------------------------------------------------------

function scoreColor(percentage: number): string {
  if (percentage >= 0.8) return '#22C55E';
  if (percentage >= 0.6) return '#FFB020';
  return '#EF4444';
}

function deltaColor(delta: number): string {
  if (delta > 0) return '#22C55E';
  if (delta < 0) return '#EF4444';
  return '#64748B';
}

function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `${delta}`;
  return '0';
}

function formatDeltaClass(delta: number): string {
  if (delta > 0) return 'trend-change-positive';
  if (delta < 0) return 'trend-change-negative';
  return 'trend-change-neutral';
}

// ---------------------------------------------------------------------------
// SVG Trend Line Chart Generator
// ---------------------------------------------------------------------------

/**
 * Generates an inline SVG line chart showing score trend over 4-12 weeks.
 * Handles <4 weeks by showing available data with a notice.
 * Handles no change by showing a flat line.
 */
export function generateTrendLineChart(
  snapshots: WeeklySnapshot[],
  options: { width?: number; height?: number } = {},
): string {
  const { width = 480, height = 160 } = options;

  if (snapshots.length === 0) {
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#F8FAFC" rx="8" />
  <text x="${width / 2}" y="${height / 2}" text-anchor="middle" font-family="'Inter', sans-serif" font-size="12" fill="#64748B">
    No monitoring data available yet
  </text>
</svg>`;
  }

  const padding = { top: 20, right: 20, bottom: 35, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Data range
  const scores = snapshots.map((s) => s.overallScore);
  const minScore = Math.max(Math.min(...scores) - 5, 0);
  const maxScore = Math.min(Math.max(...scores) + 5, 100);
  const scoreRange = maxScore - minScore || 10; // Prevent division by zero on flat line

  // Scale helpers
  const xScale = (i: number): number =>
    padding.left + (snapshots.length === 1 ? chartW / 2 : (i / (snapshots.length - 1)) * chartW);
  const yScale = (score: number): number =>
    padding.top + chartH - ((score - minScore) / scoreRange) * chartH;

  // Build polyline points
  const points = snapshots.map((s, i) => `${xScale(i)},${yScale(s.overallScore)}`).join(' ');

  // Area fill (gradient under the line)
  const areaPoints = [
    `${xScale(0)},${padding.top + chartH}`,
    ...snapshots.map((s, i) => `${xScale(i)},${yScale(s.overallScore)}`),
    `${xScale(snapshots.length - 1)},${padding.top + chartH}`,
  ].join(' ');

  // Y-axis labels (3-5 ticks)
  const yTicks: number[] = [];
  const tickStep = Math.ceil(scoreRange / 4);
  for (let v = Math.ceil(minScore / tickStep) * tickStep; v <= maxScore; v += tickStep) {
    if (v >= minScore && v <= maxScore) yTicks.push(v);
  }

  const yTickLabels = yTicks.map((v) => `
    <text x="${padding.left - 6}" y="${yScale(v) + 3}" text-anchor="end"
          font-family="'Space Mono', monospace" font-size="8" fill="#94A3B8">${v}</text>
    <line x1="${padding.left}" y1="${yScale(v)}" x2="${width - padding.right}" y2="${yScale(v)}"
          stroke="#E2E8F0" stroke-width="0.5" stroke-dasharray="2,2" />`).join('');

  // X-axis labels (week dates)
  const xLabels = snapshots.map((s, i) => {
    const dateStr = formatShortDate(s.weekStart);
    return `<text x="${xScale(i)}" y="${height - 6}" text-anchor="middle"
          font-family="'Inter', sans-serif" font-size="7" fill="#94A3B8">${dateStr}</text>`;
  }).join('');

  // Data point dots
  const dots = snapshots.map((s, i) => {
    const cx = xScale(i);
    const cy = yScale(s.overallScore);
    return `<circle cx="${cx}" cy="${cy}" r="3.5" fill="#1B2A4A" stroke="#FFFFFF" stroke-width="1.5" />
    <text x="${cx}" y="${cy - 8}" text-anchor="middle"
          font-family="'Space Mono', monospace" font-size="8" font-weight="700" fill="#1B2A4A">${s.overallScore}</text>`;
  }).join('');

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="#FFFFFF" rx="4" />

  <!-- Grid lines -->
  ${yTickLabels}

  <!-- Area gradient -->
  <defs>
    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#00D4AA" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#00D4AA" stop-opacity="0.02" />
    </linearGradient>
  </defs>
  <polygon points="${areaPoints}" fill="url(#trendGradient)" />

  <!-- Trend line -->
  <polyline points="${points}" fill="none" stroke="#00D4AA" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

  <!-- Data points -->
  ${dots}

  <!-- X-axis labels -->
  ${xLabels}

  <!-- Axis lines -->
  <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + chartH}"
        stroke="#E2E8F0" stroke-width="1" />
  <line x1="${padding.left}" y1="${padding.top + chartH}" x2="${width - padding.right}" y2="${padding.top + chartH}"
        stroke="#E2E8F0" stroke-width="1" />
</svg>`;
}

// ---------------------------------------------------------------------------
// Date Formatting Helpers
// ---------------------------------------------------------------------------

function formatShortDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

function formatMonthYear(date: Date): string {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatEventDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

// ---------------------------------------------------------------------------
// Key Event Detection
// ---------------------------------------------------------------------------

function detectKeyEvents(snapshots: WeeklySnapshot[]): KeyEvent[] {
  const events: KeyEvent[] = [];

  if (snapshots.length < 2) {
    events.push({
      date: snapshots.length > 0 ? formatEventDate(snapshots[0].weekStart) : 'N/A',
      type: 'info',
      title: 'Monitoring Started',
      description: 'AI visibility monitoring has been initiated. Trend data will build over the coming weeks.',
    });
    return events;
  }

  for (let i = 1; i < snapshots.length; i++) {
    const prev = snapshots[i - 1];
    const curr = snapshots[i];
    const delta = curr.overallScore - prev.overallScore;
    const dateStr = formatEventDate(curr.weekStart);

    // Large score jumps (>= 5 points)
    if (delta >= 5) {
      events.push({
        date: dateStr,
        type: 'improvement',
        title: `Score Increased by ${delta} Points`,
        description: `Overall score improved from ${prev.overallScore} to ${curr.overallScore}. Review recent implementations to identify what drove this change.`,
      });
    } else if (delta <= -5) {
      events.push({
        date: dateStr,
        type: 'decline',
        title: `Score Decreased by ${Math.abs(delta)} Points`,
        description: `Overall score dropped from ${prev.overallScore} to ${curr.overallScore}. Investigate potential causes such as AI engine algorithm changes or competitor activity.`,
      });
    }

    // Mention rate changes
    const mentionDelta = curr.mentionRate - prev.mentionRate;
    if (mentionDelta >= 0.15) {
      events.push({
        date: dateStr,
        type: 'improvement',
        title: 'Mention Rate Increased',
        description: `Brand mention rate improved by ${Math.round(mentionDelta * 100)}% this week. AI engines are showing increased awareness of your business.`,
      });
    } else if (mentionDelta <= -0.15) {
      events.push({
        date: dateStr,
        type: 'alert',
        title: 'Mention Rate Dropped',
        description: `Brand mention rate decreased by ${Math.round(Math.abs(mentionDelta) * 100)}% this week. This may indicate increased competitor visibility.`,
      });
    }

    // Milestone: score crosses grade boundary
    const prevGrade = scoreToGrade(prev.overallScore);
    const currGrade = scoreToGrade(curr.overallScore);
    if (currGrade !== prevGrade) {
      const improved = curr.overallScore > prev.overallScore;
      events.push({
        date: dateStr,
        type: improved ? 'milestone' : 'alert',
        title: `Grade Changed: ${prevGrade} to ${currGrade}`,
        description: improved
          ? `Congratulations! Your AI readiness grade improved from ${prevGrade} to ${currGrade}.`
          : `Your AI readiness grade dropped from ${prevGrade} to ${currGrade}. Action recommended.`,
      });
    }
  }

  // If no events detected, add a stability note
  if (events.length === 0) {
    events.push({
      date: formatEventDate(snapshots[snapshots.length - 1].weekStart),
      type: 'info',
      title: 'Stable Performance',
      description: 'No significant changes detected this month. Your AI visibility metrics have remained consistent.',
    });
  }

  return events;
}

// ---------------------------------------------------------------------------
// Generate Recommendations
// ---------------------------------------------------------------------------

function generateRecommendations(
  snapshots: WeeklySnapshot[],
  currentPillars: WeeklySnapshot['pillarScores'] | null,
): string[] {
  const recommendations: string[] = [];

  if (!currentPillars) {
    return ['Continue monitoring to build sufficient data for personalized recommendations.'];
  }

  // Check pillar scores against thresholds
  const weights = SCORING_WEIGHTS;

  if (currentPillars.aiVisibility < weights.aiVisibility * 0.5) {
    recommendations.push('AI Visibility is below 50%. Focus on getting mentioned by submitting your business to AI-friendly directories and creating FAQ-rich content.');
  }

  if (currentPillars.contentQuality < weights.contentQuality * 0.5) {
    recommendations.push('Content Quality needs improvement. Prioritize answer-first formatting, add statistics to key pages, and ensure author attribution.');
  }

  if (currentPillars.schemaStructuredData < weights.schemaStructuredData * 0.5) {
    recommendations.push('Schema markup is incomplete. Add required JSON-LD types (Organization, LocalBusiness, WebSite) and fix validation errors.');
  }

  if (currentPillars.technicalReadiness < weights.technicalReadiness * 0.5) {
    recommendations.push('Technical readiness is low. Ensure robots.txt allows AI crawlers, add an llms.txt file, and verify sitemap accessibility.');
  }

  if (currentPillars.localGbp < weights.localGbp * 0.5) {
    recommendations.push('GBP and local signals need attention. Complete your Google Business Profile, ensure NAP consistency, and actively manage reviews.');
  }

  // Trend-based recommendations
  if (snapshots.length >= 2) {
    const latest = snapshots[snapshots.length - 1];
    const previous = snapshots[snapshots.length - 2];
    if (latest.overallScore < previous.overallScore) {
      recommendations.push('Score trended downward last week. Review recent changes and check for potential AI engine algorithm updates.');
    }
    if (latest.mentionRate < 0.3) {
      recommendations.push('Mention rate remains below 30%. Consider creating vertical-specific content that directly answers common AI queries.');
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Maintain current optimization efforts. Your scores are on track.');
    recommendations.push('Consider expanding monitoring to include additional competitor queries.');
  }

  return recommendations.slice(0, 5); // Max 5 recommendations
}

// ---------------------------------------------------------------------------
// HTML Rendering Helpers
// ---------------------------------------------------------------------------

function renderKeyEvents(events: KeyEvent[]): string {
  if (events.length === 0) {
    return '<div class="event-item"><div class="event-body"><p>No significant events this month.</p></div></div>';
  }

  const iconMap: Record<string, string> = {
    improvement: '&#9650;', // up arrow
    decline: '&#9660;',     // down arrow
    milestone: '&#9733;',   // star
    alert: '&#9888;',       // warning
    info: '&#8505;',        // info
  };

  const colorMap: Record<string, string> = {
    improvement: '#22C55E',
    decline: '#EF4444',
    milestone: '#00D4AA',
    alert: '#FFB020',
    info: '#3B82F6',
  };

  return events.map((event) => `
    <div class="event-item">
      <div class="event-date">${escapeHtml(event.date)}</div>
      <div class="event-icon" style="color: ${colorMap[event.type] ?? '#64748B'};">${iconMap[event.type] ?? '&#8226;'}</div>
      <div class="event-body">
        <h4>${escapeHtml(event.title)}</h4>
        <p>${escapeHtml(event.description)}</p>
      </div>
    </div>`).join('\n');
}

function renderPlatformTrendRows(snapshots: WeeklySnapshot[]): string {
  if (snapshots.length === 0) {
    return '<tr><td colspan="5" style="text-align: center; color: #64748B;">No platform data available</td></tr>';
  }

  const latest = snapshots[snapshots.length - 1];
  const previous = snapshots.length >= 2 ? snapshots[snapshots.length - 2] : null;
  const platforms = Object.keys(latest.platformBreakdown);

  if (platforms.length === 0) {
    return '<tr><td colspan="5" style="text-align: center; color: #64748B;">No platform data available</td></tr>';
  }

  return platforms.map((platform) => {
    const data = latest.platformBreakdown[platform];
    const prevData = previous?.platformBreakdown[platform];

    const mentionPct = `${Math.round(data.mentionRate * 100)}%`;
    const avgPos = data.avgPosition !== null ? `#${Math.round(data.avgPosition)}` : 'N/A';
    const sentiment = data.dominantSentiment || 'N/A';

    let trend = '--';
    if (prevData) {
      const mentionDelta = data.mentionRate - prevData.mentionRate;
      if (mentionDelta > 0.05) trend = '<span style="color: #22C55E;">&#9650; Up</span>';
      else if (mentionDelta < -0.05) trend = '<span style="color: #EF4444;">&#9660; Down</span>';
      else trend = '<span style="color: #64748B;">&#8212; Stable</span>';
    }

    return `<tr>
      <td><span class="platform-badge platform-${escapeHtml(platform)}">${escapeHtml(platformDisplayName(platform))}</span></td>
      <td>${mentionPct}</td>
      <td>${avgPos}</td>
      <td class="sentiment-${escapeHtml(sentiment)}">${capitalize(sentiment)}</td>
      <td>${trend}</td>
    </tr>`;
  }).join('\n');
}

function renderNextSteps(recommendations: string[]): string {
  return recommendations.map((rec, i) => `
    <li>
      <span class="step-number">${i + 1}</span>
      <span>${escapeHtml(rec)}</span>
    </li>`).join('\n');
}

function renderInsufficientDataNotice(weekCount: number): string {
  if (weekCount >= 4) return '';
  return `<div class="insufficient-data-notice">
    <strong>Limited Data Available:</strong> Only ${weekCount} week${weekCount === 1 ? '' : 's'} of monitoring data
    collected so far. Trend analysis becomes more accurate with 4+ weeks of data.
    Full trend visualization will be available once additional weeks are monitored.
  </div>`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function platformDisplayName(platform: string): string {
  switch (platform) {
    case 'chatgpt': return 'ChatGPT';
    case 'perplexity': return 'Perplexity';
    case 'gemini': return 'Gemini';
    default: return platform;
  }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ---------------------------------------------------------------------------
// Aggregate Monitoring Results into Weekly Snapshots
// ---------------------------------------------------------------------------

export async function aggregateWeeklySnapshots(
  clientId: string,
  startDate: Date,
  endDate: Date,
  databaseUrl: string,
): Promise<WeeklySnapshot[]> {
  const pool = new pg.Pool({ connectionString: databaseUrl });

  try {
    const db = drizzle(pool);

    // Fetch all monitoring results in the date range
    const rows = await db
      .select()
      .from(monitoringResults)
      .where(
        and(
          eq(monitoringResults.clientId, clientId),
          gte(monitoringResults.executionDate, startDate),
          lte(monitoringResults.executionDate, endDate),
        ),
      )
      .orderBy(monitoringResults.executionDate);

    // Fetch the latest audit result for pillar scores baseline
    const latestAudit = await db
      .select()
      .from(auditResults)
      .where(eq(auditResults.clientId, clientId))
      .orderBy(desc(auditResults.auditDate))
      .limit(1);

    const baselinePillars = latestAudit.length > 0
      ? {
          aiVisibility: latestAudit[0].aiVisibilityScore ?? 0,
          contentQuality: latestAudit[0].contentScore ?? 0,
          schemaStructuredData: latestAudit[0].schemaScore ?? 0,
          technicalReadiness: latestAudit[0].technicalScore ?? 0,
          localGbp: latestAudit[0].gbpScore ?? 0,
        }
      : {
          aiVisibility: 0,
          contentQuality: 0,
          schemaStructuredData: 0,
          technicalReadiness: 0,
          localGbp: 0,
        };

    // Group by ISO week
    const weekBuckets = new Map<string, typeof rows>();

    for (const row of rows) {
      const execDate = new Date(row.executionDate);
      const weekKey = getISOWeekKey(execDate);
      const bucket = weekBuckets.get(weekKey) ?? [];
      bucket.push(row);
      weekBuckets.set(weekKey, bucket);
    }

    // Build weekly snapshots
    const snapshots: WeeklySnapshot[] = [];

    for (const [weekKey, weekRows] of weekBuckets) {
      const weekStart = getWeekStartFromKey(weekKey);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const totalQueries = weekRows.length;
      const mentionedCount = weekRows.filter((r) => r.brandMentioned).length;
      const mentionRate = totalQueries > 0 ? mentionedCount / totalQueries : 0;

      // Platform breakdown
      const platformMap = new Map<string, {
        mentioned: number;
        total: number;
        positions: number[];
        sentiments: string[];
      }>();

      for (const row of weekRows) {
        const platform = row.platform;
        const entry = platformMap.get(platform) ?? { mentioned: 0, total: 0, positions: [], sentiments: [] };
        entry.total++;
        if (row.brandMentioned) {
          entry.mentioned++;
          if (row.brandPosition !== null) entry.positions.push(row.brandPosition);
          if (row.brandSentiment) entry.sentiments.push(row.brandSentiment);
        }
        platformMap.set(platform, entry);
      }

      const platformBreakdown: Record<string, {
        mentionRate: number;
        avgPosition: number | null;
        dominantSentiment: string;
      }> = {};

      for (const [platform, data] of platformMap) {
        const avgPos = data.positions.length > 0
          ? data.positions.reduce((a, b) => a + b, 0) / data.positions.length
          : null;
        const sentimentCounts = new Map<string, number>();
        for (const s of data.sentiments) {
          sentimentCounts.set(s, (sentimentCounts.get(s) ?? 0) + 1);
        }
        let dominant = 'neutral';
        let maxCount = 0;
        for (const [sentiment, count] of sentimentCounts) {
          if (count > maxCount) {
            dominant = sentiment;
            maxCount = count;
          }
        }

        platformBreakdown[platform] = {
          mentionRate: data.total > 0 ? data.mentioned / data.total : 0,
          avgPosition: avgPos,
          dominantSentiment: dominant,
        };
      }

      // Compute approximate AI Visibility score from mention rate
      // The actual scoring is done by S2/S9 scoring functions, but for trend
      // monitoring we approximate based on monitoring data.
      const aiVisibilityEstimate = Math.round(mentionRate * SCORING_WEIGHTS.aiVisibility);

      // For non-AI-visibility pillars, we use the baseline from the last audit
      // since monitoring only tracks AI visibility changes week-over-week.
      // Full re-scoring requires a full audit which is separate from monitoring.
      const pillarScores = {
        aiVisibility: aiVisibilityEstimate,
        contentQuality: baselinePillars.contentQuality,
        schemaStructuredData: baselinePillars.schemaStructuredData,
        technicalReadiness: baselinePillars.technicalReadiness,
        localGbp: baselinePillars.localGbp,
      };

      const overallScore = Math.round(
        pillarScores.aiVisibility +
        pillarScores.contentQuality +
        pillarScores.schemaStructuredData +
        pillarScores.technicalReadiness +
        pillarScores.localGbp,
      );

      snapshots.push({
        weekStart,
        weekEnd,
        overallScore: Math.min(overallScore, 100),
        pillarScores,
        mentionRate,
        totalQueries,
        platformBreakdown,
      });
    }

    // Sort by week start ascending
    snapshots.sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());

    return snapshots;
  } finally {
    await pool.end();
  }
}

// ---------------------------------------------------------------------------
// ISO Week Helpers
// ---------------------------------------------------------------------------

function getISOWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // Set to Monday of the week
  const day = d.getDay() || 7; // Sunday = 7
  d.setDate(d.getDate() - day + 1); // Monday
  return d.toISOString().split('T')[0];
}

function getWeekStartFromKey(key: string): Date {
  return new Date(key + 'T00:00:00.000Z');
}

// ---------------------------------------------------------------------------
// Build Template Data
// ---------------------------------------------------------------------------

function buildTemplateData(
  client: RetainerClient,
  snapshots: WeeklySnapshot[],
): MonthlyTrendData {
  const now = new Date();
  const reportMonth = formatMonthYear(now);

  const currentSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const firstSnapshot = snapshots.length > 0 ? snapshots[0] : null;
  const previousMonthSnapshot = snapshots.length >= 2 ? snapshots[snapshots.length - 2] : null;

  const currentScore = currentSnapshot?.overallScore ?? (client.currentScore ?? 0);
  const startScore = firstSnapshot?.overallScore ?? (client.initialAuditScore ?? 0);
  const letterGrade = scoreToGrade(currentScore);

  const monthDelta = previousMonthSnapshot
    ? currentScore - previousMonthSnapshot.overallScore
    : 0;

  const totalQueries = snapshots.reduce((sum, s) => sum + s.totalQueries, 0);
  const platformsMonitored = currentSnapshot
    ? Object.keys(currentSnapshot.platformBreakdown).length
    : 0;
  const mentionRatePercent = currentSnapshot
    ? Math.round(currentSnapshot.mentionRate * 100)
    : 0;

  // Pillar changes
  const currPillars = currentSnapshot?.pillarScores ?? {
    aiVisibility: 0, contentQuality: 0, schemaStructuredData: 0,
    technicalReadiness: 0, localGbp: 0,
  };
  const prevPillars = previousMonthSnapshot?.pillarScores ?? currPillars;

  const events = detectKeyEvents(snapshots);
  const recommendations = generateRecommendations(snapshots, currentSnapshot?.pillarScores ?? null);

  return {
    businessName: client.businessName,
    reportMonth,
    currentScore,
    letterGrade,
    startScore,
    monthChange: formatDelta(monthDelta),
    monthChangeClass: formatDeltaClass(monthDelta),
    weeksMonitored: snapshots.length,
    totalQueries,
    mentionRatePercent,
    platformsMonitored,
    insufficientDataNotice: renderInsufficientDataNotice(snapshots.length),
    trendLineChart: generateTrendLineChart(snapshots),

    // AI Visibility
    aiVisibilityPrev: prevPillars.aiVisibility,
    aiVisibilityCurr: currPillars.aiVisibility,
    aiVisibilityPercent: Math.round((currPillars.aiVisibility / SCORING_WEIGHTS.aiVisibility) * 100),
    aiVisibilityColor: scoreColor(currPillars.aiVisibility / SCORING_WEIGHTS.aiVisibility),
    aiVisibilityDelta: formatDelta(currPillars.aiVisibility - prevPillars.aiVisibility),
    aiVisibilityDeltaColor: deltaColor(currPillars.aiVisibility - prevPillars.aiVisibility),

    // Content Quality
    contentPrev: prevPillars.contentQuality,
    contentCurr: currPillars.contentQuality,
    contentPercent: Math.round((currPillars.contentQuality / SCORING_WEIGHTS.contentQuality) * 100),
    contentColor: scoreColor(currPillars.contentQuality / SCORING_WEIGHTS.contentQuality),
    contentDelta: formatDelta(currPillars.contentQuality - prevPillars.contentQuality),
    contentDeltaColor: deltaColor(currPillars.contentQuality - prevPillars.contentQuality),

    // Schema
    schemaPrev: prevPillars.schemaStructuredData,
    schemaCurr: currPillars.schemaStructuredData,
    schemaPercent: Math.round((currPillars.schemaStructuredData / SCORING_WEIGHTS.schemaStructuredData) * 100),
    schemaColor: scoreColor(currPillars.schemaStructuredData / SCORING_WEIGHTS.schemaStructuredData),
    schemaDelta: formatDelta(currPillars.schemaStructuredData - prevPillars.schemaStructuredData),
    schemaDeltaColor: deltaColor(currPillars.schemaStructuredData - prevPillars.schemaStructuredData),

    // Technical
    technicalPrev: prevPillars.technicalReadiness,
    technicalCurr: currPillars.technicalReadiness,
    technicalPercent: Math.round((currPillars.technicalReadiness / SCORING_WEIGHTS.technicalReadiness) * 100),
    technicalColor: scoreColor(currPillars.technicalReadiness / SCORING_WEIGHTS.technicalReadiness),
    technicalDelta: formatDelta(currPillars.technicalReadiness - prevPillars.technicalReadiness),
    technicalDeltaColor: deltaColor(currPillars.technicalReadiness - prevPillars.technicalReadiness),

    // GBP
    gbpPrev: prevPillars.localGbp,
    gbpCurr: currPillars.localGbp,
    gbpPercent: Math.round((currPillars.localGbp / SCORING_WEIGHTS.localGbp) * 100),
    gbpColor: scoreColor(currPillars.localGbp / SCORING_WEIGHTS.localGbp),
    gbpDelta: formatDelta(currPillars.localGbp - prevPillars.localGbp),
    gbpDeltaColor: deltaColor(currPillars.localGbp - prevPillars.localGbp),

    // Page 2
    keyEvents: renderKeyEvents(events),
    platformTrendRows: renderPlatformTrendRows(snapshots),
    nextStepItems: renderNextSteps(recommendations),
  };
}

// ---------------------------------------------------------------------------
// Template Injection
// ---------------------------------------------------------------------------

function injectTemplateData(template: string, data: MonthlyTrendData): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`;
    result = result.split(placeholder).join(String(value));
  }
  return result;
}

// ---------------------------------------------------------------------------
// Inngest Monthly Report Function
// ---------------------------------------------------------------------------

export const monthlyReport = inngest.createFunction(
  {
    id: 'monthly-trend-report',
    retries: 2,
  },
  { cron: '0 8 1 * *' }, // 1st of every month at 8:00 AM UTC
  async ({ step }) => {
    const config = loadReportConfig();

    // -----------------------------------------------------------------------
    // Step 1: Fetch retainer clients
    // -----------------------------------------------------------------------

    const retainerClients = await step.run('fetch-retainer-clients', async (): Promise<RetainerClient[]> => {
      const pool = new pg.Pool({ connectionString: config.databaseUrl });
      try {
        const db = drizzle(pool);
        const rows = await db
          .select({
            id: clients.id,
            businessName: clients.businessName,
            domain: clients.domain,
            vertical: clients.vertical,
            locationCity: clients.locationCity,
            locationState: clients.locationState,
            primaryContactEmail: clients.primaryContactEmail,
            initialAuditScore: clients.initialAuditScore,
            currentScore: clients.currentScore,
          })
          .from(clients)
          .where(eq(clients.engagementType, 'retainer'));

        return rows;
      } finally {
        await pool.end();
      }
    });

    if (retainerClients.length === 0) {
      console.log('[S24] No retainer clients found. Skipping monthly report generation.');
      return {
        clientsProcessed: 0,
        clientsFailed: 0,
        reportsGenerated: 0,
        emailsSent: 0,
        completedAt: new Date(),
      } satisfies MonthlyReportResult;
    }

    // -----------------------------------------------------------------------
    // Step 2: Generate report for each client
    // -----------------------------------------------------------------------

    let clientsProcessed = 0;
    let clientsFailed = 0;
    let reportsGenerated = 0;
    let emailsSent = 0;

    for (const client of retainerClients) {
      const clientResult = await step.run(`report-${client.id}`, async () => {
        // Date range: past 12 weeks (or whatever is available)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 84); // 12 weeks

        // Aggregate monitoring data
        const snapshots = await aggregateWeeklySnapshots(
          client.id,
          startDate,
          endDate,
          config.databaseUrl,
        );

        // Build template data
        const templateData = buildTemplateData(client, snapshots);

        // Load template and styles
        // In production these are read from disk. For the Inngest function,
        // we use dynamic imports to read the template files.
        const fs = await import('fs');
        const path = await import('path');

        const templateDir = path.resolve(
          // Navigate from apps/audit-runner/src/scheduled/ to packages/core/src/report-templates/
          path.dirname(new URL(import.meta.url).pathname),
          '../../../../packages/core/src/report-templates',
        );

        const templateHtml = fs.readFileSync(
          path.join(templateDir, 'monthly-trend.html'),
          'utf-8',
        );
        const stylesCSS = fs.readFileSync(
          path.join(templateDir, 'styles.css'),
          'utf-8',
        );

        // Inject styles and data
        let renderedHtml = templateHtml.replace('{{styles}}', stylesCSS);
        renderedHtml = injectTemplateData(renderedHtml, templateData);

        // Generate PDF via Puppeteer
        // Dynamic import to avoid compile-time type resolution — puppeteer is
        // a dependency of @pare-engine/core, not audit-runner directly.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const puppeteerModule: any = await import(/* webpackIgnore: true */ 'puppeteer' + '');
        const browser = await puppeteerModule.default.launch({ headless: true });
        try {
          const page = await browser.newPage();
          await page.setContent(renderedHtml, { waitUntil: 'networkidle0' });
          const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
          });

          const filename = `${client.businessName.replace(/[^a-zA-Z0-9]/g, '-')}-monthly-trend-${formatMonthYear(new Date()).replace(' ', '-')}.pdf`;

          // Send email if client has a contact email
          let emailSentFlag = false;
          if (client.primaryContactEmail) {
            try {
              // Dynamic import to avoid compile-time type resolution — resend is
              // a dependency of @pare-engine/core, not audit-runner directly.
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const resendModule: any = await import(/* webpackIgnore: true */ 'resend' + '');
              const ResendClass = resendModule.Resend ?? resendModule.default?.Resend;
              const resend = new ResendClass(config.resendApiKey);

              await resend.emails.send({
                from: config.fromEmail,
                to: client.primaryContactEmail,
                subject: `AI Visibility Monthly Report — ${formatMonthYear(new Date())}`,
                html: `<p>Hi,</p><p>Please find attached your monthly AI visibility trend report for ${client.businessName}.</p><p>Your current AI Readiness Score is <strong>${templateData.currentScore}/100 (Grade: ${templateData.letterGrade})</strong>.</p><p>Reply to this email to schedule a review call with your Pare consultant.</p><p>Best,<br/>Pare Consulting</p>`,
                attachments: [
                  {
                    filename,
                    content: Buffer.from(pdfBuffer).toString('base64'),
                  },
                ],
              });

              emailSentFlag = true;
            } catch (emailError) {
              console.error(`[S24] Failed to send email to ${client.primaryContactEmail}:`, emailError);
            }
          }

          // Update client's current score in the database
          const updatePool = new pg.Pool({ connectionString: config.databaseUrl });
          try {
            const updateDb = drizzle(updatePool);
            await updateDb
              .update(clients)
              .set({
                currentScore: templateData.currentScore,
                updatedAt: new Date(),
              })
              .where(eq(clients.id, client.id));
          } finally {
            await updatePool.end();
          }

          return {
            pdfGenerated: true,
            emailSent: emailSentFlag,
            score: templateData.currentScore,
          };
        } finally {
          await browser.close();
        }
      });

      if (clientResult) {
        clientsProcessed++;
        if (clientResult.pdfGenerated) reportsGenerated++;
        if (clientResult.emailSent) emailsSent++;
      } else {
        clientsFailed++;
      }
    }

    return {
      clientsProcessed,
      clientsFailed,
      reportsGenerated,
      emailsSent,
      completedAt: new Date(),
    } satisfies MonthlyReportResult;
  },
);
