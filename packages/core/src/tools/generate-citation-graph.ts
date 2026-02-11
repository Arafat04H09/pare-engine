// Task 3.4: Citation Graph Visualizer
// Generates D3.js-compatible citation graph data and HTML visualization.
// Uses classification and authority data from normalize-citations.ts.
// "Top 5 Sources Only" filter for visual clarity.

import type { CitationGraph, CitationNode } from './normalize-citations.js';

// ---------------------------------------------------------------------------
// Error Class
// ---------------------------------------------------------------------------

export class CitationGraphError extends Error {
  readonly code = 'CITATION_GRAPH_ERROR' as const;
  constructor(message: string) {
    super(message);
    this.name = 'CitationGraphError';
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SourceClassification =
  | 'official_brand'
  | 'competitor'
  | 'news'
  | 'review'
  | 'industry_authority'
  | 'directory'
  | 'social_media'
  | 'other';

export interface ClassifiedCitationNode {
  normalizedUrl: string;
  domain: string;
  classification: SourceClassification;
  authorityScore: number;
  totalCitations: number;
  platforms: string[];
  isBrandUrl: boolean;
}

export interface GraphNode {
  id: string;
  label: string;
  classification: SourceClassification;
  authorityScore: number;
  citations: number;
  isBrand: boolean;
  radius: number;
  color: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  platform: string;
  weight: number;
}

export interface CitationGraphVisualization {
  nodes: GraphNode[];
  edges: GraphEdge[];
  topSources: ClassifiedCitationNode[];
  totalNodes: number;
  totalEdges: number;
}

// ---------------------------------------------------------------------------
// Source Classification
// ---------------------------------------------------------------------------

const REVIEW_DOMAINS = ['yelp.com', 'google.com/maps', 'trustpilot.com', 'bbb.org', 'g2.com', 'capterra.com'];
const NEWS_DOMAINS = ['nytimes.com', 'wsj.com', 'bbc.com', 'reuters.com', 'forbes.com', 'techcrunch.com', 'wired.com'];
const SOCIAL_DOMAINS = ['facebook.com', 'twitter.com', 'x.com', 'linkedin.com', 'instagram.com', 'reddit.com', 'tiktok.com'];
const DIRECTORY_DOMAINS = ['yellowpages.com', 'manta.com', 'angi.com', 'homeadvisor.com', 'thumbtack.com', 'healthgrades.com', 'zocdoc.com', 'avvo.com'];

/**
 * Classify a citation source by its domain.
 */
export function classifySource(
  normalizedUrl: string,
  brandDomain: string,
  competitorDomains?: string[],
): SourceClassification {
  let domain: string;
  try {
    domain = new URL(normalizedUrl).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    domain = normalizedUrl.toLowerCase();
  }

  const normalizedBrand = brandDomain.toLowerCase().replace(/^www\./, '');

  if (domain === normalizedBrand || domain.endsWith(`.${normalizedBrand}`)) {
    return 'official_brand';
  }

  if (competitorDomains?.some(c => domain === c.toLowerCase().replace(/^www\./, ''))) {
    return 'competitor';
  }

  if (REVIEW_DOMAINS.some(r => domain.includes(r))) return 'review';
  if (NEWS_DOMAINS.some(n => domain.includes(n))) return 'news';
  if (SOCIAL_DOMAINS.some(s => domain.includes(s))) return 'social_media';
  if (DIRECTORY_DOMAINS.some(d => domain.includes(d))) return 'directory';

  // .gov, .edu, .org domains are often industry authorities
  if (domain.endsWith('.gov') || domain.endsWith('.edu') || domain.endsWith('.org')) {
    return 'industry_authority';
  }

  return 'other';
}

/**
 * Calculate authority score for a citation node.
 * Based on: citation frequency + cross-platform presence + domain reputation.
 */
export function calculateAuthority(
  node: CitationNode,
  classification: SourceClassification,
  maxCitations: number,
): number {
  // Base score from citation frequency (0-40)
  const frequencyScore = maxCitations > 0
    ? Math.round((node.totalCitations / maxCitations) * 40) : 0;

  // Cross-platform bonus (0-30)
  const platformScore = Math.min(30, node.platforms.length * 10);

  // Classification bonus (0-30)
  const classificationBonus: Record<SourceClassification, number> = {
    official_brand: 30,
    industry_authority: 25,
    news: 20,
    review: 15,
    directory: 10,
    competitor: 5,
    social_media: 5,
    other: 0,
  };
  const classScore = classificationBonus[classification];

  return Math.min(100, frequencyScore + platformScore + classScore);
}

// ---------------------------------------------------------------------------
// Color Mapping
// ---------------------------------------------------------------------------

const CLASSIFICATION_COLORS: Record<SourceClassification, string> = {
  official_brand: '#00D4AA',   // Electric Teal
  competitor: '#EF4444',       // Red
  news: '#3B82F6',             // Blue
  review: '#F59E0B',           // Amber
  industry_authority: '#8B5CF6', // Purple
  directory: '#6B7280',        // Gray
  social_media: '#EC4899',     // Pink
  other: '#9CA3AF',            // Light Gray
};

// ---------------------------------------------------------------------------
// Main Function
// ---------------------------------------------------------------------------

/**
 * Generate a citation graph visualization from normalized citation data.
 * Applies classification, authority scoring, and "Top 5 Sources Only" filter.
 *
 * @param graph - CitationGraph from normalizeCitations()
 * @param brandDomain - The audited brand's domain
 * @param competitorDomains - Optional competitor domains for classification
 * @returns CitationGraphVisualization with nodes, edges, and top sources
 */
export function generateCitationGraph(
  graph: CitationGraph,
  brandDomain: string,
  competitorDomains?: string[],
): CitationGraphVisualization {
  const maxCitations = Math.max(
    1,
    ...Array.from(graph.nodes.values()).map(n => n.totalCitations),
  );

  // Classify and score all nodes
  const classifiedNodes: ClassifiedCitationNode[] = [];
  for (const node of graph.nodes.values()) {
    let domain: string;
    try {
      domain = new URL(node.normalizedUrl).hostname.replace(/^www\./, '');
    } catch {
      domain = node.normalizedUrl;
    }

    const classification = classifySource(node.normalizedUrl, brandDomain, competitorDomains);
    const authorityScore = calculateAuthority(node, classification, maxCitations);

    classifiedNodes.push({
      normalizedUrl: node.normalizedUrl,
      domain,
      classification,
      authorityScore,
      totalCitations: node.totalCitations,
      platforms: [...node.platforms],
      isBrandUrl: node.isBrandUrl,
    });
  }

  // Sort by authority descending, take top 5
  classifiedNodes.sort((a, b) => b.authorityScore - a.authorityScore);
  const topSources = classifiedNodes.slice(0, 5);
  const topDomains = new Set(topSources.map(n => n.domain));

  // Build graph nodes
  const graphNodes: GraphNode[] = topSources.map(n => ({
    id: n.domain,
    label: n.domain,
    classification: n.classification,
    authorityScore: n.authorityScore,
    citations: n.totalCitations,
    isBrand: n.isBrandUrl,
    radius: 10 + (n.authorityScore / 100) * 30,
    color: CLASSIFICATION_COLORS[n.classification],
  }));

  // Build graph edges (only between top sources)
  const graphEdges: GraphEdge[] = [];
  const edgeMap = new Map<string, { source: string; target: string; platform: string; weight: number }>();

  for (const edge of graph.edges) {
    let sourceDomain: string;
    try {
      sourceDomain = new URL(edge.normalizedUrl).hostname.replace(/^www\./, '');
    } catch {
      sourceDomain = edge.normalizedUrl;
    }

    if (!topDomains.has(sourceDomain)) continue;

    const key = `${edge.platform}->${sourceDomain}`;
    const existing = edgeMap.get(key);
    if (existing) {
      existing.weight += 1;
    } else {
      edgeMap.set(key, {
        source: edge.platform,
        target: sourceDomain,
        platform: edge.platform,
        weight: 1,
      });
    }
  }

  graphEdges.push(...edgeMap.values());

  return {
    nodes: graphNodes,
    edges: graphEdges,
    topSources,
    totalNodes: classifiedNodes.length,
    totalEdges: graph.edges.length,
  };
}

// ---------------------------------------------------------------------------
// HTML Rendering
// ---------------------------------------------------------------------------

/**
 * Render citation graph as static HTML with inline SVG for PDF embedding.
 * Uses simple force-directed layout approximation (no runtime D3).
 */
export function renderCitationGraphHtml(viz: CitationGraphVisualization): string {
  const nodeElements = viz.nodes.map((node, i) => {
    const x = 200 + Math.cos((i / viz.nodes.length) * 2 * Math.PI) * 120;
    const y = 200 + Math.sin((i / viz.nodes.length) * 2 * Math.PI) * 120;

    return `<g>
      <circle cx="${x}" cy="${y}" r="${node.radius}" fill="${node.color}" opacity="0.8" stroke="#fff" stroke-width="2"/>
      <text x="${x}" y="${y + node.radius + 14}" text-anchor="middle" font-size="10" font-family="Inter,sans-serif" fill="#374151">${node.label}</text>
      <text x="${x}" y="${y + 4}" text-anchor="middle" font-size="9" font-family="Inter,sans-serif" fill="#fff" font-weight="bold">${node.citations}</text>
    </g>`;
  }).join('\n');

  const legendItems = [
    { label: 'Your Brand', color: CLASSIFICATION_COLORS.official_brand },
    { label: 'Competitor', color: CLASSIFICATION_COLORS.competitor },
    { label: 'News', color: CLASSIFICATION_COLORS.news },
    { label: 'Review', color: CLASSIFICATION_COLORS.review },
    { label: 'Authority', color: CLASSIFICATION_COLORS.industry_authority },
  ].map((item, i) =>
    `<g transform="translate(0,${i * 20})">
      <rect width="12" height="12" rx="2" fill="${item.color}"/>
      <text x="18" y="10" font-size="11" font-family="Inter,sans-serif" fill="#374151">${item.label}</text>
    </g>`
  ).join('\n');

  return `<div class="citation-graph" style="text-align:center">
  <svg viewBox="0 0 400 440" width="400" height="440" style="max-width:100%">
    ${nodeElements}
    <g transform="translate(10,360)">${legendItems}</g>
  </svg>
</div>`;
}
