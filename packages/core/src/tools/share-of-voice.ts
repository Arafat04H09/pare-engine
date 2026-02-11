// Task 2.2: Share of Voice Matrix
// Single-pass multi-entity extraction from existing ParsedMention data.
// Calculates share of voice across brand + competitors per platform and query.
// No extra API calls — uses data already collected by the query step.

import type { ParsedMention } from '../contracts/analysis.contract.js';
import type { MultiProviderResult, Platform } from '../contracts/query.contract.js';
import { normalizeCompetitorDomain } from './normalize-competitor.js';

// ---------------------------------------------------------------------------
// Error Class
// ---------------------------------------------------------------------------

export class ShareOfVoiceError extends Error {
  readonly code = 'SHARE_OF_VOICE_ERROR' as const;
  constructor(message: string) {
    super(message);
    this.name = 'ShareOfVoiceError';
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EntityShare {
  domain: string;
  isBrand: boolean;
  mentionCount: number;
  sharePercent: number;
  avgPosition: number | null;
  sentiment: { positive: number; neutral: number; negative: number };
}

export interface HeadToHeadBattle {
  query: string;
  platform: Platform;
  brandPosition: number | null;
  competitorDomain: string;
  competitorPosition: number | null;
  brandWins: boolean;
}

export interface ShareOfVoiceMatrix {
  brand: string;
  domain: string;
  totalQueries: number;
  totalResponses: number;
  share: Record<string, number>;
  entities: EntityShare[];
  headToHead: HeadToHeadBattle[];
  byPlatform: Record<string, Record<string, number>>;
  calculatedAt: Date;
}

// ---------------------------------------------------------------------------
// Core Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate Share of Voice matrix from existing ParsedMention data.
 * ONE query reveals ALL competitors — single-pass multi-entity extraction (no 4x cost).
 *
 * @param brand - The client's brand name
 * @param domain - The client's domain
 * @param mentions - ParsedMention[] parallel to successful responses
 * @param providerResult - MultiProviderResult from the query step
 * @returns ShareOfVoiceMatrix with per-entity shares and head-to-head battles
 */
export function calculateShareOfVoice(
  brand: string,
  domain: string,
  mentions: ParsedMention[],
  providerResult: MultiProviderResult,
): ShareOfVoiceMatrix {
  const successfulResponses = providerResult.responses.filter(r => r.success);
  const pairCount = Math.min(mentions.length, successfulResponses.length);

  // Track mention counts per domain
  const mentionCounts = new Map<string, {
    count: number;
    positions: number[];
    sentiment: { positive: number; neutral: number; negative: number };
    isBrand: boolean;
  }>();

  // Track per-platform share
  const platformMentions = new Map<string, Map<string, number>>();

  // Track head-to-head battles
  const headToHead: HeadToHeadBattle[] = [];

  // Initialize brand entry
  const normalizedBrandDomain = normalizeCompetitorDomain(domain);
  mentionCounts.set(normalizedBrandDomain, {
    count: 0,
    positions: [],
    sentiment: { positive: 0, neutral: 0, negative: 0 },
    isBrand: true,
  });

  for (let i = 0; i < pairCount; i++) {
    const mention = mentions[i];
    const response = successfulResponses[i];
    const platform = response.platform;

    // Initialize platform map
    if (!platformMentions.has(platform)) {
      platformMentions.set(platform, new Map());
    }
    const platMap = platformMentions.get(platform)!;

    // Track brand
    if (mention.brandMentioned) {
      const brandEntry = mentionCounts.get(normalizedBrandDomain)!;
      brandEntry.count += 1;
      if (mention.brandPosition !== null) {
        brandEntry.positions.push(mention.brandPosition);
      }
      if (mention.brandSentiment === 'positive') brandEntry.sentiment.positive += 1;
      else if (mention.brandSentiment === 'negative') brandEntry.sentiment.negative += 1;
      else brandEntry.sentiment.neutral += 1;

      platMap.set(normalizedBrandDomain, (platMap.get(normalizedBrandDomain) ?? 0) + 1);
    }

    // Track competitors
    for (const [rawDomain, data] of Object.entries(mention.competitorMentions)) {
      if (!data.mentioned) continue;

      const normalized = normalizeCompetitorDomain(rawDomain);
      const entry = mentionCounts.get(normalized) ?? {
        count: 0,
        positions: [],
        sentiment: { positive: 0, neutral: 0, negative: 0 },
        isBrand: false,
      };

      entry.count += 1;
      if (data.position !== null) {
        entry.positions.push(data.position);
      }
      if (data.sentiment === 'positive') entry.sentiment.positive += 1;
      else if (data.sentiment === 'negative') entry.sentiment.negative += 1;
      else entry.sentiment.neutral += 1;

      mentionCounts.set(normalized, entry);
      platMap.set(normalized, (platMap.get(normalized) ?? 0) + 1);

      // Head-to-head battle
      headToHead.push({
        query: response.query,
        platform,
        brandPosition: mention.brandMentioned ? mention.brandPosition : null,
        competitorDomain: normalized,
        competitorPosition: data.position,
        brandWins: mention.brandMentioned &&
          mention.brandPosition !== null &&
          data.position !== null &&
          mention.brandPosition < data.position,
      });
    }
  }

  // Calculate total mentions
  const totalMentionCount = Array.from(mentionCounts.values())
    .reduce((sum, e) => sum + e.count, 0);

  // Build entity shares
  const entities: EntityShare[] = [];
  const shareMap: Record<string, number> = {};

  for (const [entityDomain, data] of mentionCounts) {
    const sharePercent = totalMentionCount > 0
      ? Math.round((data.count / totalMentionCount) * 10000) / 100
      : 0;

    const avgPosition = data.positions.length > 0
      ? data.positions.reduce((a, b) => a + b, 0) / data.positions.length
      : null;

    entities.push({
      domain: entityDomain,
      isBrand: data.isBrand,
      mentionCount: data.count,
      sharePercent,
      avgPosition,
      sentiment: data.sentiment,
    });

    shareMap[entityDomain] = sharePercent;
  }

  // Sort by share descending
  entities.sort((a, b) => b.sharePercent - a.sharePercent);

  // Build per-platform breakdown
  const byPlatform: Record<string, Record<string, number>> = {};
  for (const [platform, platMap] of platformMentions) {
    const platTotal = Array.from(platMap.values()).reduce((a, b) => a + b, 0);
    const platShare: Record<string, number> = {};
    for (const [entityDomain, count] of platMap) {
      platShare[entityDomain] = platTotal > 0
        ? Math.round((count / platTotal) * 10000) / 100
        : 0;
    }
    byPlatform[platform] = platShare;
  }

  return {
    brand,
    domain: normalizedBrandDomain,
    totalQueries: pairCount,
    totalResponses: successfulResponses.length,
    share: shareMap,
    entities,
    headToHead,
    byPlatform,
    calculatedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// HTML Rendering
// ---------------------------------------------------------------------------

/**
 * Render a Share of Voice matrix as an HTML table for PDF embedding.
 */
export function renderShareOfVoiceHtml(matrix: ShareOfVoiceMatrix): string {
  const rows = matrix.entities
    .slice(0, 10) // Top 10 entities
    .map(e => {
      const posStr = e.avgPosition !== null ? e.avgPosition.toFixed(1) : '—';
      const barWidth = Math.min(100, e.sharePercent);
      const color = e.isBrand ? '#00D4AA' : '#1B2A4A';
      const label = e.isBrand ? `${e.domain} (You)` : e.domain;

      return `<tr>
        <td style="padding:8px;font-weight:${e.isBrand ? 'bold' : 'normal'}">${label}</td>
        <td style="padding:8px">${e.mentionCount}</td>
        <td style="padding:8px">
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:${barWidth}%;height:16px;background:${color};border-radius:4px;min-width:2px"></div>
            <span>${e.sharePercent.toFixed(1)}%</span>
          </div>
        </td>
        <td style="padding:8px;text-align:center">${posStr}</td>
      </tr>`;
    })
    .join('\n');

  return `<div class="sov-matrix">
  <table style="width:100%;border-collapse:collapse;font-family:Inter,system-ui,sans-serif">
    <thead>
      <tr style="border-bottom:2px solid #1B2A4A">
        <th style="padding:8px;text-align:left">Entity</th>
        <th style="padding:8px;text-align:left">Mentions</th>
        <th style="padding:8px;text-align:left">Share of Voice</th>
        <th style="padding:8px;text-align:center">Avg Position</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;
}
