// Owner: S1 (Config + Dev Infra). Consumers: ALL sessions.
// This contract defines the shape of the validated environment configuration.
// S1 implements this as packages/core/src/config.ts using Zod.

import { z } from 'zod';

export const ConfigSchema = z.object({
  // AI Engine Monitoring (Tier 1)
  openaiApiKey: z.string().min(1),
  googleGenerativeAiApiKey: z.string().min(1),
  perplexityApiKey: z.string().min(1),
  anthropicApiKey: z.string().min(1),

  // Crawling (Tier 1)
  firecrawlApiKey: z.string().min(1),

  // SERP & SEO (Tier 2 — optional until Round 6)
  serperApiKey: z.string().optional(),
  dataforseoLogin: z.string().optional(),
  dataforseoPassword: z.string().optional(),

  // Google APIs (Tier 2 — optional until Round 3)
  googlePlacesApiKey: z.string().optional(),

  // CRM & Payments (Tier 2 — optional until Round 5)
  notionApiKey: z.string().optional(),
  stripeSecretKey: z.string().optional(),
  stripeWebhookSecret: z.string().optional(),

  // Email (Tier 2 — optional until Round 4)
  resendApiKey: z.string().optional(),

  // Database
  databaseUrl: z.string().url(),

  // Admin Auth
  adminEmail: z.string().email(),
  adminPasswordHash: z.string().min(1),
  sessionSecret: z.string().min(32),

  // Infrastructure (optional until Round 4)
  inngestSigningKey: z.string().optional(),
  inngestEventKey: z.string().optional(),
});

export type ValidatedConfig = z.infer<typeof ConfigSchema>;

/**
 * Subset of config needed for minimum viable audit.
 * Sessions can use this to avoid requiring all keys during development.
 */
export const MinimalAuditConfigSchema = ConfigSchema.pick({
  openaiApiKey: true,
  firecrawlApiKey: true,
  anthropicApiKey: true,
  databaseUrl: true,
});

export type MinimalAuditConfig = z.infer<typeof MinimalAuditConfigSchema>;
