// Task 3.2: Video Schema Generator
// Generates VideoObject JSON-LD for detected video assets missing schema markup.

import type { MediaAsset } from '../contracts/crawl.contract.js';

// ---------------------------------------------------------------------------
// Error Class
// ---------------------------------------------------------------------------

export class VideoSchemaError extends Error {
  readonly code = 'VIDEO_SCHEMA_ERROR' as const;
  constructor(message: string) {
    super(message);
    this.name = 'VideoSchemaError';
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VideoSchemaOutput {
  videoUrl: string;
  pageUrl: string;
  jsonLd: string;
  videoType: string;
}

// ---------------------------------------------------------------------------
// Schema Generation
// ---------------------------------------------------------------------------

/**
 * Generate VideoObject JSON-LD for a single media asset.
 */
function generateSingleVideoSchema(asset: MediaAsset, brand: string): VideoSchemaOutput {
  const videoObject: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: asset.title ?? `Video from ${brand}`,
    description: `Video content from ${brand}`,
    uploadDate: new Date().toISOString().split('T')[0],
  };

  if (asset.type === 'youtube' && asset.videoId) {
    videoObject.contentUrl = `https://www.youtube.com/watch?v=${asset.videoId}`;
    videoObject.embedUrl = `https://www.youtube.com/embed/${asset.videoId}`;
    videoObject.thumbnailUrl = `https://img.youtube.com/vi/${asset.videoId}/maxresdefault.jpg`;
  } else if (asset.type === 'vimeo' && asset.videoId) {
    videoObject.contentUrl = `https://vimeo.com/${asset.videoId}`;
    videoObject.embedUrl = `https://player.vimeo.com/video/${asset.videoId}`;
  } else {
    videoObject.contentUrl = asset.url;
  }

  return {
    videoUrl: asset.url,
    pageUrl: asset.pageUrl,
    jsonLd: JSON.stringify(videoObject, null, 2),
    videoType: asset.type,
  };
}

/**
 * Generate VideoObject JSON-LD for all video assets missing schema markup.
 *
 * @param assets - Media assets from extraction
 * @param brand - Business name for schema generation
 * @returns Array of VideoSchemaOutput with JSON-LD ready for injection
 */
export function generateVideoSchemas(
  assets: MediaAsset[],
  brand: string,
): VideoSchemaOutput[] {
  const videosWithoutSchema = assets.filter(
    a => a.type !== 'image' && !a.hasVideoObjectSchema,
  );

  return videosWithoutSchema.map(asset => generateSingleVideoSchema(asset, brand));
}
