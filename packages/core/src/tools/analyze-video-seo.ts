// Task 3.2: Video SEO Analyzer
// Analyzes video assets for AI engine readiness:
// - VideoObject schema presence and completeness
// - Transcript availability (critical for RAG)
// - YouTube cross-reference: "You have 50 videos, only 2 are schema-marked"

import type { MediaAsset } from '../contracts/crawl.contract.js';

// ---------------------------------------------------------------------------
// Error Class
// ---------------------------------------------------------------------------

export class VideoSeoError extends Error {
  readonly code = 'VIDEO_SEO_ERROR' as const;
  constructor(message: string) {
    super(message);
    this.name = 'VideoSeoError';
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VideoSeoFinding {
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedAssets: string[];
}

export interface VideoSeoResult {
  totalVideos: number;
  schemaMarked: number;
  schemaMissing: number;
  schemaRate: number;
  transcriptAvailable: number;
  transcriptMissing: number;
  findings: VideoSeoFinding[];
  readinessScore: number;
  analyzedAt: Date;
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

/**
 * Analyze video assets for SEO and AI engine readiness.
 *
 * @param assets - Media assets extracted from crawled pages
 * @returns VideoSeoResult with findings and readiness score
 */
export function analyzeVideoSeo(assets: MediaAsset[]): VideoSeoResult {
  const videos = assets.filter(a => a.type !== 'image');

  if (videos.length === 0) {
    return {
      totalVideos: 0,
      schemaMarked: 0,
      schemaMissing: 0,
      schemaRate: 0,
      transcriptAvailable: 0,
      transcriptMissing: 0,
      findings: [],
      readinessScore: 100, // No videos = no issues
      analyzedAt: new Date(),
    };
  }

  const schemaMarked = videos.filter(v => v.hasVideoObjectSchema).length;
  const schemaMissing = videos.length - schemaMarked;
  const schemaRate = Math.round((schemaMarked / videos.length) * 100);

  const transcriptAvailable = videos.filter(v => v.hasTranscript).length;
  const transcriptMissing = videos.length - transcriptAvailable;

  const findings: VideoSeoFinding[] = [];

  // Finding 1: Missing VideoObject schema
  if (schemaMissing > 0) {
    const missingUrls = videos.filter(v => !v.hasVideoObjectSchema).map(v => v.url);
    findings.push({
      severity: schemaMissing === videos.length ? 'high' : 'medium',
      title: `${schemaMissing} of ${videos.length} videos missing VideoObject schema`,
      description: 'Videos without VideoObject schema are invisible to AI engines for rich results. Add structured data to each video embed.',
      affectedAssets: missingUrls.slice(0, 5),
    });
  }

  // Finding 2: Missing transcripts
  if (transcriptMissing > 0) {
    const missingUrls = videos.filter(v => !v.hasTranscript).map(v => v.url);
    findings.push({
      severity: 'medium',
      title: `${transcriptMissing} of ${videos.length} videos missing transcripts`,
      description: 'Transcripts/captions are critical for RAG-based AI engines. Videos without transcripts cannot be indexed by language models.',
      affectedAssets: missingUrls.slice(0, 5),
    });
  }

  // Finding 3: YouTube videos not cross-referenced
  const youtubeVideos = videos.filter(v => v.type === 'youtube');
  if (youtubeVideos.length > 0) {
    const unmarked = youtubeVideos.filter(v => !v.hasVideoObjectSchema);
    if (unmarked.length > 0) {
      findings.push({
        severity: 'low',
        title: `${youtubeVideos.length} YouTube videos found, ${unmarked.length} not schema-marked`,
        description: 'YouTube videos are auto-indexed by Google but need VideoObject schema for other AI engines (ChatGPT, Perplexity).',
        affectedAssets: unmarked.map(v => v.url).slice(0, 5),
      });
    }
  }

  // Calculate readiness score (0-100)
  let readinessScore = 100;
  if (videos.length > 0) {
    const schemaPoints = schemaRate * 0.6; // 60% weight
    const transcriptPoints = (transcriptAvailable / videos.length) * 100 * 0.4; // 40% weight
    readinessScore = Math.round(schemaPoints + transcriptPoints);
  }

  return {
    totalVideos: videos.length,
    schemaMarked,
    schemaMissing,
    schemaRate,
    transcriptAvailable,
    transcriptMissing,
    findings,
    readinessScore,
    analyzedAt: new Date(),
  };
}
