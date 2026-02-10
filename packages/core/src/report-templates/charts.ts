/**
 * Inline SVG chart generators for Pare report templates.
 * Owner: S10 (Report Templates)
 *
 * All charts are rendered as SVG strings for injection into HTML templates.
 * No client-side JS — these render in headless Puppeteer.
 */

// --- Color Constants ---

const COLORS = {
  primary: '#1B2A4A',
  accent: '#00D4AA',
  warning: '#FFB020',
  danger: '#EF4444',
  success: '#22C55E',
  textMuted: '#64748B',
  textLight: '#94A3B8',
  border: '#E2E8F0',
  bgLight: '#F8FAFC',
  white: '#FFFFFF',
} as const;

/** Returns the appropriate color for a score percentage (0-1). */
function scoreColor(percentage: number): string {
  if (percentage >= 0.8) return COLORS.success;
  if (percentage >= 0.6) return COLORS.warning;
  return COLORS.danger;
}

/** Returns the appropriate color for a letter grade. */
function gradeColor(grade: string): string {
  switch (grade) {
    case 'A': return COLORS.success;
    case 'B': return '#84CC16';
    case 'C': return COLORS.warning;
    case 'D': return '#F97316';
    case 'F': return COLORS.danger;
    default: return COLORS.textMuted;
  }
}

// --- Circular Score Gauge ---

export interface GaugeOptions {
  score: number;
  maxScore: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  label?: string;
  showGrade?: boolean;
  grade?: string;
}

/**
 * Generates an SVG circular gauge for score display.
 * Used on cover page and executive summary.
 */
export function circularGauge(options: GaugeOptions): string {
  const {
    score,
    maxScore,
    size = 140,
    strokeWidth = 10,
    showLabel = false,
    label = '',
    showGrade = false,
    grade = '',
  } = options;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = maxScore > 0 ? Math.min(score / maxScore, 1) : 0;
  const dashOffset = circumference * (1 - percentage);
  const color = scoreColor(percentage);
  const center = size / 2;

  const scoreFontSize = size >= 120 ? 32 : size >= 80 ? 22 : 16;
  const maxFontSize = size >= 120 ? 12 : 9;

  let innerContent = `
    <text x="${center}" y="${center - (showLabel ? 4 : 0)}" text-anchor="middle" dominant-baseline="central"
          font-family="'Space Mono', monospace" font-size="${scoreFontSize}" font-weight="700" fill="${COLORS.primary}">
      ${Math.round(score)}
    </text>
    <text x="${center}" y="${center + scoreFontSize * 0.5 + 2}" text-anchor="middle"
          font-family="'Space Mono', monospace" font-size="${maxFontSize}" fill="${COLORS.textMuted}">
      / ${maxScore}
    </text>`;

  if (showGrade && grade) {
    const gColor = gradeColor(grade);
    innerContent += `
    <text x="${center}" y="${center + scoreFontSize * 0.5 + maxFontSize + 6}" text-anchor="middle"
          font-family="'Space Mono', monospace" font-size="${maxFontSize + 2}" font-weight="700" fill="${gColor}">
      ${grade}
    </text>`;
  }

  let labelContent = '';
  if (showLabel && label) {
    labelContent = `
    <text x="${center}" y="${size + 14}" text-anchor="middle"
          font-family="'Inter', sans-serif" font-size="9" font-weight="600" fill="${COLORS.textMuted}"
          text-transform="uppercase" letter-spacing="1">
      ${escapeHtml(label)}
    </text>`;
  }

  const totalHeight = showLabel ? size + 24 : size;

  return `<svg width="${size}" height="${totalHeight}" viewBox="0 0 ${size} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="${center}" cy="${center}" r="${radius}"
          fill="none" stroke="${COLORS.border}" stroke-width="${strokeWidth}" />
  <!-- Score arc -->
  <circle cx="${center}" cy="${center}" r="${radius}"
          fill="none" stroke="${color}" stroke-width="${strokeWidth}"
          stroke-linecap="round"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${dashOffset}"
          transform="rotate(-90 ${center} ${center})" />
  ${innerContent}
  ${labelContent}
</svg>`;
}

// --- Horizontal Bar Chart ---

export interface BarItem {
  label: string;
  value: number;
  maxValue: number;
}

export interface HorizontalBarOptions {
  items: BarItem[];
  width?: number;
  barHeight?: number;
}

/**
 * Generates horizontal bar chart SVG.
 * Used for pillar score breakdown.
 */
export function horizontalBarChart(options: HorizontalBarOptions): string {
  const {
    items,
    width = 460,
    barHeight = 20,
  } = options;

  const labelWidth = 140;
  const scoreWidth = 55;
  const barAreaWidth = width - labelWidth - scoreWidth - 10;
  const rowHeight = barHeight + 16;
  const totalHeight = items.length * rowHeight + 4;

  const rows = items.map((item, i) => {
    const y = i * rowHeight + 8;
    const percentage = item.maxValue > 0 ? Math.min(item.value / item.maxValue, 1) : 0;
    const barWidth = Math.max(barAreaWidth * percentage, 2);
    const color = scoreColor(percentage);

    return `
    <!-- ${escapeHtml(item.label)} -->
    <text x="0" y="${y + barHeight / 2 + 4}" font-family="'Inter', sans-serif" font-size="10" font-weight="600" fill="${COLORS.primary}">
      ${escapeHtml(item.label)}
    </text>
    <rect x="${labelWidth}" y="${y}" width="${barAreaWidth}" height="${barHeight}" rx="4" fill="${COLORS.border}" />
    <rect x="${labelWidth}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="${color}" />
    <text x="${width - 5}" y="${y + barHeight / 2 + 4}" text-anchor="end"
          font-family="'Space Mono', monospace" font-size="11" font-weight="600" fill="${COLORS.primary}">
      ${Math.round(item.value)} / ${item.maxValue}
    </text>`;
  }).join('\n');

  return `<svg width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">
  ${rows}
</svg>`;
}

// --- Small Pillar Gauge (for mini report) ---

export interface SmallGaugeOptions {
  score: number;
  maxScore: number;
  label: string;
}

/**
 * Small circular gauge for mini-report pillar cards.
 */
export function smallGauge(options: SmallGaugeOptions): string {
  const { score, maxScore, label } = options;
  const size = 64;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = maxScore > 0 ? Math.min(score / maxScore, 1) : 0;
  const dashOffset = circumference * (1 - percentage);
  const color = scoreColor(percentage);
  const center = size / 2;

  return `<svg width="${size}" height="${size + 18}" viewBox="0 0 ${size} ${size + 18}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${center}" cy="${center}" r="${radius}"
          fill="none" stroke="${COLORS.border}" stroke-width="${strokeWidth}" />
  <circle cx="${center}" cy="${center}" r="${radius}"
          fill="none" stroke="${color}" stroke-width="${strokeWidth}"
          stroke-linecap="round"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${dashOffset}"
          transform="rotate(-90 ${center} ${center})" />
  <text x="${center}" y="${center - 2}" text-anchor="middle" dominant-baseline="central"
        font-family="'Space Mono', monospace" font-size="14" font-weight="700" fill="${COLORS.primary}">
    ${Math.round(score)}
  </text>
  <text x="${center}" y="${center + 12}" text-anchor="middle"
        font-family="'Space Mono', monospace" font-size="8" fill="${COLORS.textMuted}">
    / ${maxScore}
  </text>
  <text x="${center}" y="${size + 12}" text-anchor="middle"
        font-family="'Inter', sans-serif" font-size="7" font-weight="600" fill="${COLORS.textMuted}"
        letter-spacing="0.3">
    ${escapeHtml(label)}
  </text>
</svg>`;
}

// --- Sentiment Donut Chart ---

export interface SentimentData {
  positive: number;
  neutral: number;
  negative: number;
}

/**
 * Generates a donut chart for sentiment breakdown.
 */
export function sentimentDonut(data: SentimentData, size: number = 100): string {
  const total = data.positive + data.neutral + data.negative;
  if (total === 0) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 8}" fill="none" stroke="${COLORS.border}" stroke-width="12" />
  <text x="${size / 2}" y="${size / 2 + 4}" text-anchor="middle" font-family="'Inter', sans-serif" font-size="10" fill="${COLORS.textMuted}">No data</text>
</svg>`;
  }

  const strokeWidth = 12;
  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const segments = [
    { value: data.positive, color: COLORS.success, label: 'Positive' },
    { value: data.neutral, color: COLORS.textLight, label: 'Neutral' },
    { value: data.negative, color: COLORS.danger, label: 'Negative' },
  ];

  let currentOffset = 0;
  const arcs = segments.map((seg) => {
    const segLen = (seg.value / total) * circumference;
    const offset = circumference - currentOffset;
    currentOffset += segLen;
    if (seg.value === 0) return '';
    return `<circle cx="${center}" cy="${center}" r="${radius}"
          fill="none" stroke="${seg.color}" stroke-width="${strokeWidth}"
          stroke-dasharray="${segLen} ${circumference - segLen}"
          stroke-dashoffset="${offset}"
          transform="rotate(-90 ${center} ${center})" />`;
  }).join('\n');

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${COLORS.border}" stroke-width="${strokeWidth}" />
  ${arcs}
  <text x="${center}" y="${center - 4}" text-anchor="middle" font-family="'Space Mono', monospace" font-size="16" font-weight="700" fill="${COLORS.primary}">
    ${total}
  </text>
  <text x="${center}" y="${center + 10}" text-anchor="middle" font-family="'Inter', sans-serif" font-size="8" fill="${COLORS.textMuted}">
    responses
  </text>
</svg>`;
}

// --- Platform Coverage Indicators ---

export interface PlatformStatus {
  platform: string;
  mentioned: boolean;
  sentiment: 'positive' | 'neutral' | 'negative' | 'not_mentioned';
}

/**
 * Generates platform coverage indicator icons.
 */
export function platformIndicators(platforms: PlatformStatus[], width: number = 380): string {
  const itemWidth = Math.floor(width / Math.max(platforms.length, 1));
  const height = 50;

  const items = platforms.map((p, i) => {
    const x = i * itemWidth + itemWidth / 2;
    const dotColor = p.mentioned
      ? (p.sentiment === 'positive' ? COLORS.success : p.sentiment === 'negative' ? COLORS.danger : COLORS.warning)
      : COLORS.border;
    const statusText = p.mentioned ? (p.sentiment === 'not_mentioned' ? 'Seen' : p.sentiment) : 'Not found';
    const textColor = p.mentioned ? COLORS.primary : COLORS.textLight;

    return `
    <circle cx="${x}" cy="12" r="8" fill="${dotColor}" />
    ${p.mentioned ? `<path d="M${x - 3} 12 L${x - 1} 14 L${x + 3} 10" stroke="${COLORS.white}" stroke-width="1.5" fill="none" />` : `<line x1="${x - 3}" y1="9" x2="${x + 3}" y2="15" stroke="${COLORS.white}" stroke-width="1.5" /><line x1="${x + 3}" y1="9" x2="${x - 3}" y2="15" stroke="${COLORS.white}" stroke-width="1.5" />`}
    <text x="${x}" y="32" text-anchor="middle" font-family="'Inter', sans-serif" font-size="9" font-weight="600" fill="${textColor}">
      ${escapeHtml(platformDisplayName(p.platform))}
    </text>
    <text x="${x}" y="44" text-anchor="middle" font-family="'Inter', sans-serif" font-size="8" fill="${COLORS.textMuted}">
      ${escapeHtml(statusText)}
    </text>`;
  }).join('');

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  ${items}
</svg>`;
}

// --- Checklist Indicator ---

export interface ChecklistItem {
  label: string;
  passed: boolean;
}

/**
 * Generates a visual checklist with check/cross icons.
 */
export function checklist(items: ChecklistItem[], width: number = 240): string {
  const rowHeight = 22;
  const height = items.length * rowHeight + 4;

  const rows = items.map((item, i) => {
    const y = i * rowHeight + 14;
    const icon = item.passed
      ? `<circle cx="8" cy="${y}" r="7" fill="${COLORS.success}" /><path d="M5 ${y} L7 ${y + 2} L11 ${y - 2}" stroke="${COLORS.white}" stroke-width="1.5" fill="none" />`
      : `<circle cx="8" cy="${y}" r="7" fill="${COLORS.danger}" /><line x1="5" y1="${y - 3}" x2="11" y2="${y + 3}" stroke="${COLORS.white}" stroke-width="1.5" /><line x1="11" y1="${y - 3}" x2="5" y2="${y + 3}" stroke="${COLORS.white}" stroke-width="1.5" />`;

    return `${icon}
    <text x="22" y="${y + 4}" font-family="'Inter', sans-serif" font-size="10" fill="${item.passed ? COLORS.primary : COLORS.textMuted}">
      ${escapeHtml(item.label)}
    </text>`;
  }).join('\n');

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  ${rows}
</svg>`;
}

// --- Helpers ---

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
