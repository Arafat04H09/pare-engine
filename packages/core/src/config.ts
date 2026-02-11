// Owner: S1 (Config + Dev Infra)
// Implements: config.contract.ts (ConfigSchema, ValidatedConfig, MinimalAuditConfig)
//
// This module reads process.env ONCE, validates it through Zod, and returns
// a typed configuration object. No other module in the codebase should access
// process.env directly — import loadConfig() or loadMinimalConfig() instead.

import {
  ConfigSchema,
  MinimalAuditConfigSchema,
  WebConfigSchema,
  PipelineConfigSchema,
  type ValidatedConfig,
  type MinimalAuditConfig,
  type WebConfig,
  type PipelineConfig,
} from './contracts/config.contract.js';

// ---------------------------------------------------------------------------
// Custom Error
// ---------------------------------------------------------------------------

export class ConfigError extends Error {
  public readonly code = 'CONFIG_VALIDATION_ERROR' as const;
  public readonly missingKeys: string[];

  constructor(missingKeys: string[], zodMessage: string) {
    const keyList = missingKeys.join(', ');
    super(
      `Configuration validation failed. Missing or invalid keys: ${keyList}\n\nDetails:\n${zodMessage}`,
    );
    this.name = 'ConfigError';
    this.missingKeys = missingKeys;
  }
}

// ---------------------------------------------------------------------------
// Environment Variable Mapping
// ---------------------------------------------------------------------------

/**
 * Maps camelCase config keys to their SCREAMING_SNAKE_CASE environment
 * variable names. This is the ONLY place that touches process.env.
 */
const ENV_KEY_MAP: Record<keyof ValidatedConfig, string> = {
  // AI Engine Monitoring (Tier 1)
  openaiApiKey: 'OPENAI_API_KEY',
  googleGenerativeAiApiKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
  perplexityApiKey: 'PERPLEXITY_API_KEY',
  anthropicApiKey: 'ANTHROPIC_API_KEY',

  // Crawling (Tier 1)
  firecrawlApiKey: 'FIRECRAWL_API_KEY',

  // SERP & SEO (Tier 2)
  serperApiKey: 'SERPER_API_KEY',
  dataforseoLogin: 'DATAFORSEO_LOGIN',
  dataforseoPassword: 'DATAFORSEO_PASSWORD',

  // Google APIs (Tier 2)
  googlePlacesApiKey: 'GOOGLE_PLACES_API_KEY',

  // CRM & Payments (Tier 2)
  notionApiKey: 'NOTION_API_KEY',
  stripeSecretKey: 'STRIPE_SECRET_KEY',
  stripeWebhookSecret: 'STRIPE_WEBHOOK_SECRET',

  // Email (Tier 2)
  resendApiKey: 'RESEND_API_KEY',

  // Database
  databaseUrl: 'DATABASE_URL',

  // Admin Auth
  adminEmail: 'ADMIN_EMAIL',
  adminPasswordHash: 'ADMIN_PASSWORD_HASH',
  sessionSecret: 'SESSION_SECRET',

  // Infrastructure
  inngestSigningKey: 'INNGEST_SIGNING_KEY',
  inngestEventKey: 'INNGEST_EVENT_KEY',

  // Webhook Secrets
  n8nWebhookSecret: 'N8N_WEBHOOK_SECRET',
  crawlerLogWebhookSecret: 'CRAWLER_LOG_WEBHOOK_SECRET',

  // Web App
  nextPublicUrl: 'NEXT_PUBLIC_URL',
  apifyApiKey: 'APIFY_API_KEY',
  reportFromEmail: 'REPORT_FROM_EMAIL',

  // Runtime
  nodeEnv: 'NODE_ENV',
};

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Reads process.env and builds a raw config object keyed by the camelCase
 * names expected by ConfigSchema. Values that are empty strings or undefined
 * in the environment are omitted so Zod's `.optional()` and `.min(1)` rules
 * work correctly.
 */
function readEnv(): Record<string, string | undefined> {
  const raw: Record<string, string | undefined> = {};

  for (const [configKey, envKey] of Object.entries(ENV_KEY_MAP)) {
    const value = process.env[envKey];
    // Treat empty strings as "not set" — Zod .min(1) would reject them anyway
    if (value !== undefined && value !== '') {
      raw[configKey] = value;
    }
  }

  return raw;
}

/**
 * Extracts the list of field paths that failed validation from a Zod error.
 */
function extractMissingKeys(zodError: { issues: Array<{ path: Array<string | number> }> }): string[] {
  return zodError.issues.map((issue) => issue.path.join('.'));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Loads and validates the FULL configuration from environment variables.
 *
 * @returns A fully validated `ValidatedConfig` object.
 * @throws `ConfigError` if any required key is missing or invalid.
 *
 * @example
 * ```typescript
 * import { loadConfig } from '@pare-engine/core';
 *
 * const config = loadConfig();
 * // config.openaiApiKey  — string (guaranteed non-empty)
 * // config.serperApiKey  — string | undefined (optional)
 * ```
 */
export function loadConfig(): ValidatedConfig {
  const raw = readEnv();
  const result = ConfigSchema.safeParse(raw);

  if (!result.success) {
    const missingKeys = extractMissingKeys(result.error);
    throw new ConfigError(missingKeys, result.error.message);
  }

  return result.data;
}

/**
 * Loads and validates the MINIMAL configuration needed for a development
 * audit run (1 provider + crawl + analysis + database).
 *
 * Useful in development when you don't have every API key yet.
 *
 * @returns A `MinimalAuditConfig` with only the essential keys.
 * @throws `ConfigError` if any of the minimal required keys is missing.
 *
 * @example
 * ```typescript
 * import { loadMinimalConfig } from '@pare-engine/core';
 *
 * const config = loadMinimalConfig();
 * // config.openaiApiKey     — string
 * // config.firecrawlApiKey  — string
 * // config.anthropicApiKey  — string
 * // config.databaseUrl      — string
 * ```
 */
export function loadMinimalConfig(): MinimalAuditConfig {
  const raw = readEnv();
  const result = MinimalAuditConfigSchema.safeParse(raw);

  if (!result.success) {
    const missingKeys = extractMissingKeys(result.error);
    throw new ConfigError(missingKeys, result.error.message);
  }

  return result.data;
}

/**
 * Loads and validates the WEB APP configuration (server components,
 * API routes, middleware). Does not require AI provider API keys.
 *
 * @returns A `WebConfig` with database, auth, Stripe, and webhook settings.
 * @throws `ConfigError` if any required web key is missing.
 */
export function loadWebConfig(): WebConfig {
  const raw = readEnv();
  const result = WebConfigSchema.safeParse(raw);

  if (!result.success) {
    const missingKeys = extractMissingKeys(result.error);
    throw new ConfigError(missingKeys, result.error.message);
  }

  return result.data;
}

/**
 * Loads and validates the PIPELINE configuration (audit-runner Inngest
 * functions). Requires AI provider keys but not admin auth keys.
 *
 * @returns A `PipelineConfig` with API keys and database settings.
 * @throws `ConfigError` if any required pipeline key is missing.
 */
export function loadPipelineConfig(): PipelineConfig {
  const raw = readEnv();
  const result = PipelineConfigSchema.safeParse(raw);

  if (!result.success) {
    const missingKeys = extractMissingKeys(result.error);
    throw new ConfigError(missingKeys, result.error.message);
  }

  return result.data;
}

// Re-export types for convenience (consumers can also import from contracts)
export type { ValidatedConfig, MinimalAuditConfig, WebConfig, PipelineConfig };
