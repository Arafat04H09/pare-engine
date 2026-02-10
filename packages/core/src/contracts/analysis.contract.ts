// Owner: S5 (content), S6 (technical), S7 (schema), S8 (GBP).
// Consumers: S9, S10, S11, S12, S18, S20.
// Analysis extracts structured data from raw crawl/query results.
// Scoring (separate contract) grades the extracted data.
// Each analysis type is a SEPARATE file in apps/audit-runner/src/steps/:
//   analyze-content.ts, analyze-technical.ts, analyze-schema.ts, analyze-gbp.ts

import { z } from 'zod';

// --- Content Analysis (Owner: S5) ---

export const ContentPageAnalysisSchema = z.object({
  url: z.string(),
  answerFirstScore: z.number().min(0).max(10),
  faqPresent: z.boolean(),
  statsCount: z.number().int().min(0),
  hasAuthorAttribution: z.boolean(),
  wordCount: z.number().int().min(0),
  depthScore: z.number().min(0).max(10),
});

export type ContentPageAnalysis = z.infer<typeof ContentPageAnalysisSchema>;

export const ContentAnalysisOutputSchema = z.object({
  pages: z.array(ContentPageAnalysisSchema),
  averageAnswerFirstScore: z.number(),
  faqPageCount: z.number().int(),
  averageStatsDensity: z.number(),
  authorAttributionRate: z.number(),
  analyzedAt: z.date(),
});

export type ContentAnalysisOutput = z.infer<typeof ContentAnalysisOutputSchema>;

// --- Schema / Structured Data Analysis (Owner: S7) ---

export const SchemaPageAnalysisSchema = z.object({
  url: z.string(),
  presentTypes: z.array(z.string()),
  missingRequiredTypes: z.array(z.string()),
  missingRecommendedTypes: z.array(z.string()),
  validationErrors: z.array(z.string()),
  rawJsonLd: z.array(z.unknown()),
});

export type SchemaPageAnalysis = z.infer<typeof SchemaPageAnalysisSchema>;

export const SchemaAnalysisOutputSchema = z.object({
  pages: z.array(SchemaPageAnalysisSchema),
  allPresentTypes: z.array(z.string()),
  allMissingRequired: z.array(z.string()),
  allMissingRecommended: z.array(z.string()),
  totalValidationErrors: z.number().int(),
  vertical: z.string(),
  analyzedAt: z.date(),
});

export type SchemaAnalysisOutput = z.infer<typeof SchemaAnalysisOutputSchema>;

// --- Technical Readiness Analysis (Owner: S6) ---

export const RobotsTxtAnalysisSchema = z.object({
  exists: z.boolean(),
  aiFriendly: z.boolean(),
  blockedBots: z.array(z.string()),
  allowedBots: z.array(z.string()),
});

export type RobotsTxtAnalysis = z.infer<typeof RobotsTxtAnalysisSchema>;

export const TechnicalAnalysisOutputSchema = z.object({
  robotsTxt: RobotsTxtAnalysisSchema,
  llmsTxtPresent: z.boolean(),
  llmsFullTxtPresent: z.boolean(),
  sitemapPresent: z.boolean(),
  sitemapUrlCount: z.number().int().optional(),
  httpsEnabled: z.boolean(),
  mobileFriendly: z.boolean(),
  pageSpeedScore: z.number().min(0).max(100).optional(),
  performanceScore: z.number().min(0).max(100).optional(),
  accessibilityScore: z.number().min(0).max(100).optional(),
  seoScore: z.number().min(0).max(100).optional(),
  coreWebVitals: z.object({
    lcp: z.number().optional(),
    fid: z.number().optional(),
    cls: z.number().optional(),
  }).optional(),
  analyzedAt: z.date(),
});

export type TechnicalAnalysisOutput = z.infer<typeof TechnicalAnalysisOutputSchema>;

// --- GBP / Local Analysis (Owner: S8) ---

export const GBPAnalysisOutputSchema = z.object({
  placeId: z.string().optional(),
  businessName: z.string(),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().min(0),
  photoCount: z.number().int().min(0),
  hasDescription: z.boolean(),
  descriptionOptimized: z.boolean(),
  categoryAccuracy: z.boolean(),
  primaryCategory: z.string().optional(),
  additionalCategories: z.array(z.string()),
  hasQAndA: z.boolean(),
  hoursComplete: z.boolean(),
  websiteUrl: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  napConsistent: z.boolean(),
  napSources: z.array(z.object({
    source: z.string(),
    nameMatch: z.boolean(),
    addressMatch: z.boolean(),
    phoneMatch: z.boolean(),
  })).default([]),
  analyzedAt: z.date(),
});

export type GBPAnalysisOutput = z.infer<typeof GBPAnalysisOutputSchema>;

// --- LLM Parse Result (Owner: S5 — used for parsing engine responses) ---

export const ParsedMentionSchema = z.object({
  brandMentioned: z.boolean(),
  brandPosition: z.number().int().nullable(),
  brandSentiment: z.enum(['positive', 'neutral', 'negative', 'not_mentioned']),
  brandUrlCited: z.boolean(),
  citedUrls: z.array(z.string()),
  competitorMentions: z.record(z.object({
    mentioned: z.boolean(),
    position: z.number().int().nullable(),
    sentiment: z.enum(['positive', 'neutral', 'negative', 'not_mentioned']),
  })),
});

export type ParsedMention = z.infer<typeof ParsedMentionSchema>;
