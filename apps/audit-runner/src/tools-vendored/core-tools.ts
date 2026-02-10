// Owner: S22 (Production Deployment)
//
// Static vendored tool definitions for the custom IP tool functions
// in packages/core/src/tools/. These are NOT MCP replacements — they
// are Vercel AI SDK-compatible tool definitions for the core tool
// functions that power the audit pipeline.
//
// Each tool definition provides:
//   - name: stable identifier for the tool
//   - description: what the tool does
//   - inputSchema: Zod schema for input validation
//
// The actual implementations are imported from @pare-engine/core.
// These stubs make the tools available as AI SDK tools via
// generateText() or generateObject() with tool definitions.

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Crawl Tools
// ---------------------------------------------------------------------------

export const crawlSiteInputSchema = z.object({
  domain: z.string().min(1).describe('Domain to crawl (e.g., "example.com")'),
  maxPages: z.number().int().min(1).max(100).default(20).describe('Maximum pages to crawl'),
  formats: z.array(z.enum(['markdown', 'html'])).default(['markdown', 'html']),
});

// ---------------------------------------------------------------------------
// Query Tools
// ---------------------------------------------------------------------------

export const queryEnginesInputSchema = z.object({
  brand: z.string().min(1).describe('Business name to search for'),
  domain: z.string().min(1).describe('Business domain'),
  queries: z.array(z.string().min(1)).min(1).describe('List of queries to run'),
  platforms: z.array(z.enum(['chatgpt', 'perplexity', 'gemini'])).default(['chatgpt', 'perplexity', 'gemini']),
});

// ---------------------------------------------------------------------------
// Analysis Tools
// ---------------------------------------------------------------------------

export const parseResponseInputSchema = z.object({
  brand: z.string().min(1),
  domain: z.string().min(1),
  competitors: z.array(z.string()).default([]),
});

export const parseJsonLdInputSchema = z.object({
  html: z.string().min(1).describe('HTML content to parse for JSON-LD'),
  url: z.string().min(1).describe('URL the HTML was fetched from'),
});

export const pageSpeedInputSchema = z.object({
  url: z.string().url().describe('URL to test with PageSpeed Insights'),
  strategy: z.enum(['mobile', 'desktop']).default('mobile'),
});

export const googlePlacesInputSchema = z.object({
  placeId: z.string().optional().describe('Google Place ID (if known)'),
  businessName: z.string().optional().describe('Business name for text search fallback'),
  location: z.string().optional().describe('City/state for text search'),
});

// ---------------------------------------------------------------------------
// Citation & Scoring Tools
// ---------------------------------------------------------------------------

export const normalizeCitationsInputSchema = z.object({
  brand: z.string().min(1),
  domain: z.string().min(1),
});

export const scoreDeltaInputSchema = z.object({
  beforeAuditId: z.string().optional().describe('Previous audit ID (null for first audit)'),
  afterAuditId: z.string().min(1).describe('Current audit ID'),
});

export const accuracyScorerInputSchema = z.object({
  brand: z.string().min(1),
  domain: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Report & Delivery Tools
// ---------------------------------------------------------------------------

export const generatePdfInputSchema = z.object({
  auditId: z.string().min(1).describe('Audit result ID'),
  type: z.enum(['full', 'mini']).describe('Report type to generate'),
});

export const sendReportInputSchema = z.object({
  auditId: z.string().min(1).describe('Audit result ID'),
  recipientEmail: z.string().email().describe('Email to deliver the report to'),
});

// ---------------------------------------------------------------------------
// Implementation Tools
// ---------------------------------------------------------------------------

export const generateFaqInputSchema = z.object({
  businessName: z.string().min(1),
  domain: z.string().min(1),
  vertical: z.string().min(1),
});

export const generateJsonLdInputSchema = z.object({
  businessName: z.string().min(1),
  domain: z.string().min(1),
  vertical: z.string().min(1),
});

export const generateLlmsTxtInputSchema = z.object({
  businessName: z.string().min(1),
  domain: z.string().min(1),
  vertical: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Competitive Intelligence Tools
// ---------------------------------------------------------------------------

export const serperSearchInputSchema = z.object({
  query: z.string().min(1).describe('Search query'),
  domain: z.string().optional().describe('Target domain to track position'),
  location: z.string().optional().describe('Geographic location'),
  num: z.number().int().min(1).max(100).default(10),
});

export const dataForSEOInputSchema = z.object({
  domain: z.string().min(1).describe('Domain to analyze'),
  type: z.enum(['backlinks', 'keywords', 'ai-overview']).describe('Data type to fetch'),
  location: z.string().optional(),
  limit: z.number().int().min(1).max(1000).default(100),
});

// ---------------------------------------------------------------------------
// Aggregated Tool Registry
// ---------------------------------------------------------------------------

/**
 * Complete registry of core tool definitions for the audit pipeline.
 *
 * These replace the development-time MCP tool surface with static,
 * typed tool definitions. The pipeline steps import and call the
 * actual implementations directly — these definitions provide
 * the type contracts and descriptions for AI SDK integration.
 */
export const coreTools = {
  // Crawl
  crawlSite: {
    name: 'crawl_site' as const,
    description: 'Crawl a website to extract pages, markdown content, and HTML',
    inputSchema: crawlSiteInputSchema,
  },

  // Query
  queryEngines: {
    name: 'query_engines' as const,
    description: 'Query multiple AI engines (ChatGPT, Perplexity, Gemini) with prompts about a business',
    inputSchema: queryEnginesInputSchema,
  },

  // Analysis
  parseResponse: {
    name: 'parse_response' as const,
    description: 'Parse AI engine responses for brand mentions, sentiment, and citations',
    inputSchema: parseResponseInputSchema,
  },
  parseJsonLd: {
    name: 'parse_jsonld' as const,
    description: 'Extract and validate JSON-LD structured data from HTML',
    inputSchema: parseJsonLdInputSchema,
  },
  pageSpeed: {
    name: 'pagespeed_test' as const,
    description: 'Run Google PageSpeed Insights test on a URL',
    inputSchema: pageSpeedInputSchema,
  },
  googlePlaces: {
    name: 'google_places_lookup' as const,
    description: 'Look up Google Business Profile data via Google Places API',
    inputSchema: googlePlacesInputSchema,
  },

  // Citations & Scoring
  normalizeCitations: {
    name: 'normalize_citations' as const,
    description: 'Build a unified citation graph from multi-provider query results',
    inputSchema: normalizeCitationsInputSchema,
  },
  scoreDelta: {
    name: 'score_delta' as const,
    description: 'Calculate per-pillar and overall score changes between two audits',
    inputSchema: scoreDeltaInputSchema,
  },
  accuracyScorer: {
    name: 'accuracy_scorer' as const,
    description: 'Compare AI engine claims against known-truth GBP data',
    inputSchema: accuracyScorerInputSchema,
  },

  // Report & Delivery
  generatePdf: {
    name: 'generate_pdf' as const,
    description: 'Generate a branded PDF audit report from audit data',
    inputSchema: generatePdfInputSchema,
  },
  sendReport: {
    name: 'send_report' as const,
    description: 'Send the audit PDF report via email using Resend',
    inputSchema: sendReportInputSchema,
  },

  // Implementation
  generateFaq: {
    name: 'generate_faq' as const,
    description: 'Generate FAQ content with answer-first format and FAQPage schema',
    inputSchema: generateFaqInputSchema,
  },
  generateJsonLd: {
    name: 'generate_jsonld' as const,
    description: 'Generate copy-paste-ready JSON-LD structured data',
    inputSchema: generateJsonLdInputSchema,
  },
  generateLlmsTxt: {
    name: 'generate_llmstxt' as const,
    description: 'Generate an llms.txt file for AI engine guidance',
    inputSchema: generateLlmsTxtInputSchema,
  },

  // Competitive Intelligence
  serperSearch: {
    name: 'serper_search' as const,
    description: 'Search Google via Serper.dev and track domain SERP position',
    inputSchema: serperSearchInputSchema,
  },
  dataForSEO: {
    name: 'dataforseo_fetch' as const,
    description: 'Fetch backlinks, keywords, or AI overview data from DataForSEO',
    inputSchema: dataForSEOInputSchema,
  },
} as const;
