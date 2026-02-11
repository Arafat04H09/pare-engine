// Task 3.2: Media Asset Extraction
// Detects YouTube/Vimeo iframes, HTML5 video tags, and images from crawled HTML.
// Cross-references with VideoObject schema presence.

import type { CrawledPage, MediaAsset } from '../contracts/crawl.contract.js';

// ---------------------------------------------------------------------------
// Error Class
// ---------------------------------------------------------------------------

export class MediaExtractionError extends Error {
  readonly code = 'MEDIA_EXTRACTION_ERROR' as const;
  constructor(message: string) {
    super(message);
    this.name = 'MediaExtractionError';
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MediaExtractionResult {
  assets: MediaAsset[];
  totalVideos: number;
  totalImages: number;
  youtubeCount: number;
  vimeoCount: number;
  html5VideoCount: number;
  withSchema: number;
  withoutSchema: number;
  schemaGapRate: number;
  extractedAt: Date;
}

// ---------------------------------------------------------------------------
// Regex Patterns
// ---------------------------------------------------------------------------

const YOUTUBE_IFRAME_RE = /(?:<iframe[^>]+src=["'](?:https?:)?\/\/(?:www\.)?youtube\.com\/embed\/([\w-]+)[^"']*["'][^>]*>)/gi;
const YOUTUBE_LINK_RE = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/gi;
const VIMEO_IFRAME_RE = /(?:<iframe[^>]+src=["'](?:https?:)?\/\/(?:player\.)?vimeo\.com\/video\/(\d+)[^"']*["'][^>]*>)/gi;
const HTML5_VIDEO_RE = /<video[^>]*>[\s\S]*?<\/video>|<video[^>]*\/>/gi;
const VIDEO_SRC_RE = /<source[^>]+src=["']([^"']+)["']/gi;
const VIDEO_OBJECT_RE = /"@type"\s*:\s*"VideoObject"/gi;

// ---------------------------------------------------------------------------
// Extraction Functions
// ---------------------------------------------------------------------------

function extractYouTubeAssets(html: string, pageUrl: string): MediaAsset[] {
  const assets: MediaAsset[] = [];
  const seenIds = new Set<string>();

  // Iframes
  for (const match of html.matchAll(YOUTUBE_IFRAME_RE)) {
    const videoId = match[1];
    if (videoId && !seenIds.has(videoId)) {
      seenIds.add(videoId);
      assets.push({
        url: `https://www.youtube.com/watch?v=${videoId}`,
        type: 'youtube',
        pageUrl,
        videoId,
        embedCode: match[0],
        hasVideoObjectSchema: false,
        hasTranscript: false,
      });
    }
  }

  // Links
  for (const match of html.matchAll(YOUTUBE_LINK_RE)) {
    const videoId = match[1];
    if (videoId && !seenIds.has(videoId)) {
      seenIds.add(videoId);
      assets.push({
        url: `https://www.youtube.com/watch?v=${videoId}`,
        type: 'youtube',
        pageUrl,
        videoId,
        hasVideoObjectSchema: false,
        hasTranscript: false,
      });
    }
  }

  return assets;
}

function extractVimeoAssets(html: string, pageUrl: string): MediaAsset[] {
  const assets: MediaAsset[] = [];
  const seenIds = new Set<string>();

  for (const match of html.matchAll(VIMEO_IFRAME_RE)) {
    const videoId = match[1];
    if (videoId && !seenIds.has(videoId)) {
      seenIds.add(videoId);
      assets.push({
        url: `https://vimeo.com/${videoId}`,
        type: 'vimeo',
        pageUrl,
        videoId,
        embedCode: match[0],
        hasVideoObjectSchema: false,
        hasTranscript: false,
      });
    }
  }

  return assets;
}

function extractHtml5Videos(html: string, pageUrl: string): MediaAsset[] {
  const assets: MediaAsset[] = [];

  for (const match of html.matchAll(HTML5_VIDEO_RE)) {
    const videoTag = match[0];
    const srcMatch = VIDEO_SRC_RE.exec(videoTag);
    VIDEO_SRC_RE.lastIndex = 0;

    const src = srcMatch?.[1] ?? '';
    assets.push({
      url: src || pageUrl,
      type: 'html5_video',
      pageUrl,
      embedCode: videoTag,
      hasVideoObjectSchema: false,
      hasTranscript: false,
    });
  }

  return assets;
}

function hasVideoObjectSchema(html: string): boolean {
  return VIDEO_OBJECT_RE.test(html);
}

// ---------------------------------------------------------------------------
// Main Function
// ---------------------------------------------------------------------------

/**
 * Extract media assets from crawled pages.
 * Detects YouTube/Vimeo embeds, HTML5 video tags, and checks for VideoObject schema.
 *
 * @param pages - Crawled pages with HTML content
 * @returns MediaExtractionResult with all detected media assets
 */
export function extractMedia(pages: CrawledPage[]): MediaExtractionResult {
  const allAssets: MediaAsset[] = [];

  for (const page of pages) {
    const html = page.html;
    const pageUrl = page.url;

    // Check if page has VideoObject schema
    const pageHasSchema = hasVideoObjectSchema(html);

    // Extract media
    const youtube = extractYouTubeAssets(html, pageUrl);
    const vimeo = extractVimeoAssets(html, pageUrl);
    const html5 = extractHtml5Videos(html, pageUrl);

    // Mark schema presence on video assets
    const pageVideos = [...youtube, ...vimeo, ...html5];
    for (const asset of pageVideos) {
      asset.hasVideoObjectSchema = pageHasSchema;
    }

    allAssets.push(...pageVideos);
  }

  const totalVideos = allAssets.filter(a => a.type !== 'image').length;
  const withSchema = allAssets.filter(a => a.hasVideoObjectSchema).length;
  const withoutSchema = totalVideos - withSchema;

  return {
    assets: allAssets,
    totalVideos,
    totalImages: allAssets.filter(a => a.type === 'image').length,
    youtubeCount: allAssets.filter(a => a.type === 'youtube').length,
    vimeoCount: allAssets.filter(a => a.type === 'vimeo').length,
    html5VideoCount: allAssets.filter(a => a.type === 'html5_video').length,
    withSchema,
    withoutSchema,
    schemaGapRate: totalVideos > 0 ? Math.round((withoutSchema / totalVideos) * 100) / 100 : 0,
    extractedAt: new Date(),
  };
}
