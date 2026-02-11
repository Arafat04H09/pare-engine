// Owner: S12 (Inngest Pipeline). Consumer: S15 (Audit Form + Stripe).
// Main Inngest function that orchestrates the full audit pipeline.
//
// Pipeline: CRAWL -> QUERY -> ANALYZE -> SCORE -> REPORT -> DELIVER
// Each step is wrapped in step.run() for independent retryability.
// Triggered by the 'audit/requested' Inngest event.
//
// IMPORTANT: Inngest serializes step.run() return values as JSON.
// Date objects become ISO strings across step boundaries. We cast back
// after rehydrating dates at each step boundary.
//
// Architecture notes:
// - Types imported from @pare-engine/core/contracts (contract-first)
// - Step functions imported from their respective files (S3-S10)
// - Promise.allSettled() used for parallel analyze sub-steps
// - Graceful degradation: partial failures tracked, not thrown
// - Duration tracked in durationMs

import { inngest } from './inngest.js';
import type {
  AuditRequest,
  AuditPipelineResult,
  CrawlOutput,
  MultiProviderResult,
  ContentAnalysisOutput,
  SchemaAnalysisOutput,
  TechnicalAnalysisOutput,
  GBPAnalysisOutput,
  ParsedMention,
  CompositeScore,
  PdfOutput,
} from '@pare-engine/core/contracts';

// Step imports
import { executeCrawlStep } from './steps/crawl.js';
import { executeQueryStep } from './steps/query-engines.js';
import { executeContentAnalysisStep, executeParseResponsesStep } from './steps/analyze-content.js';
import { executeTechnicalAnalysisStep } from './steps/analyze-technical.js';
import { executeSchemaAnalysisStep } from './steps/analyze-schema.js';
import { executeGBPAnalysisStep } from './steps/analyze-gbp.js';
import { executeScoreStep } from './steps/score.js';
import { executeReportStep } from './steps/report.js';
import { executeDeliverStep } from './steps/deliver.js';

// ---------------------------------------------------------------------------
// Error Class
// ---------------------------------------------------------------------------

export class PipelineError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'PipelineError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Date Rehydration
// ---------------------------------------------------------------------------

/**
 * Inngest serializes step.run() results as JSON, converting Date objects
 * to ISO strings. This utility recursively rehydrates known date fields
 * back to Date objects so typed functions receive correct types.
 */
const DATE_FIELD_NAMES = new Set([
  'crawledAt', 'queriedAt', 'executedAt', 'analyzedAt',
  'scoredAt', 'generatedAt', 'deliveredAt', 'auditDate',
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rehydrateDates(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T/.test(obj)) {
      return new Date(obj);
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => rehydrateDates(item));
  }
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (DATE_FIELD_NAMES.has(key) && typeof value === 'string') {
        result[key] = new Date(value as string);
      } else {
        result[key] = rehydrateDates(value);
      }
    }
    return result;
  }
  return obj;
}

// ---------------------------------------------------------------------------
// Config Loader
// ---------------------------------------------------------------------------

/**
 * Load pipeline environment config.
 *
 * Uses a local loader because @pare-engine/core's loadConfig() requires
 * admin auth keys (adminEmail, adminPasswordHash, sessionSecret) that may
 * not be set in the audit-runner environment. Once deployment is unified
 * on a single server, this can be replaced with core's loadConfig().
 */
interface PipelineConfig {
  firecrawlApiKey: string;
  openaiApiKey: string;
  googleGenerativeAiApiKey: string;
  perplexityApiKey: string;
  anthropicApiKey: string;
  googlePlacesApiKey?: string;
  resendApiKey?: string;
  databaseUrl: string;
}

function loadPipelineConfig(): PipelineConfig {
  const get = (envKey: string, required: boolean = true): string => {
    const value = process.env[envKey];
    if (!value && required) {
      throw new PipelineError(
        `Missing required environment variable: ${envKey}`,
        'CONFIG_MISSING',
      );
    }
    return value ?? '';
  };

  return {
    firecrawlApiKey: get('FIRECRAWL_API_KEY'),
    openaiApiKey: get('OPENAI_API_KEY'),
    googleGenerativeAiApiKey: get('GOOGLE_GENERATIVE_AI_API_KEY'),
    perplexityApiKey: get('PERPLEXITY_API_KEY'),
    anthropicApiKey: get('ANTHROPIC_API_KEY'),
    googlePlacesApiKey: get('GOOGLE_PLACES_API_KEY', false) || undefined,
    resendApiKey: get('RESEND_API_KEY', false) || undefined,
    databaseUrl: get('DATABASE_URL'),
  };
}

// ---------------------------------------------------------------------------
// Default Queries
// ---------------------------------------------------------------------------

function getDefaultQueries(businessName: string, vertical: string, city?: string): string[] {
  const location = city ? ` in ${city}` : '';
  return [
    `Best ${vertical} ${businessName}${location}`,
    `Who is the best ${vertical}${location}?`,
    `${vertical} recommendations${location}`,
    `${businessName} reviews`,
    `Top rated ${vertical} near me${location}`,
  ];
}

// ---------------------------------------------------------------------------
// Analyze step result shape (for the combined analyze output)
// ---------------------------------------------------------------------------

interface AnalyzeStepResult {
  content: ContentAnalysisOutput;
  schema: SchemaAnalysisOutput;
  technical: TechnicalAnalysisOutput;
  gbp: GBPAnalysisOutput;
  mentions: ParsedMention[];
}

// ---------------------------------------------------------------------------
// Main Pipeline Function
// ---------------------------------------------------------------------------

export const auditPipeline = inngest.createFunction(
  {
    id: 'audit-pipeline',
    retries: 3,
  },
  { event: 'audit/requested' },
  async ({ event, step }) => {
    const startTime = Date.now();
    const auditRequest = event.data as AuditRequest;
    const config = loadPipelineConfig();

    // -----------------------------------------------------------------------
    // Step 1: CRAWL
    // -----------------------------------------------------------------------

    const crawlRaw = await step.run('crawl-site', async () => {
      return await executeCrawlStep(
        {
          domain: auditRequest.domain,
          maxPages: 20,
          formats: ['markdown', 'html'],
        },
        { firecrawlApiKey: config.firecrawlApiKey },
      );
    });
    const crawlOutput = rehydrateDates(crawlRaw) as CrawlOutput;

    // -----------------------------------------------------------------------
    // Step 2: QUERY
    // -----------------------------------------------------------------------

    const queries = auditRequest.queries && auditRequest.queries.length > 0
      ? auditRequest.queries
      : getDefaultQueries(auditRequest.businessName, auditRequest.vertical, auditRequest.city);

    const queryRaw = await step.run('query-engines', async () => {
      return await executeQueryStep(
        {
          brand: auditRequest.businessName,
          domain: auditRequest.domain,
          queries,
          platforms: ['chatgpt', 'perplexity', 'gemini'],
          competitors: auditRequest.competitors,
        },
        {
          openaiApiKey: config.openaiApiKey,
          googleGenerativeAiApiKey: config.googleGenerativeAiApiKey,
          perplexityApiKey: config.perplexityApiKey,
        },
      );
    });
    const queryResult = rehydrateDates(queryRaw) as MultiProviderResult;

    // Track providers
    const successfulPlatforms = [
      ...new Set(queryResult.responses.filter((r) => r.success).map((r) => r.platform)),
    ];
    const failedPlatformNames = queryResult.failedPlatforms.map((f) => f.platform);

    // -----------------------------------------------------------------------
    // Step 3: ANALYZE (4 sub-steps + parse in parallel via Promise.allSettled)
    // -----------------------------------------------------------------------

    const analyzeRaw = await step.run('analyze', async () => {
      const pages = crawlOutput.pages.map((p) => ({
        url: p.url,
        markdown: p.markdown,
        html: p.html,
      }));

      const [contentResult, technicalResult, schemaResult, gbpResult, parseResult] = await Promise.allSettled([
        executeContentAnalysisStep(pages),
        executeTechnicalAnalysisStep(crawlOutput.pages, auditRequest.domain),
        Promise.resolve(executeSchemaAnalysisStep(crawlOutput.pages, auditRequest.vertical)),
        executeGBPAnalysisStep({
          businessName: auditRequest.businessName,
          domain: auditRequest.domain,
          googlePlaceId: auditRequest.googlePlaceId,
          city: auditRequest.city,
          state: auditRequest.state,
          googlePlacesApiKey: config.googlePlacesApiKey,
          crawlPages: crawlOutput.pages,
        }),
        executeParseResponsesStep(
          queryResult.responses.filter((r) => r.success),
          auditRequest.businessName,
          auditRequest.domain,
          auditRequest.competitors,
        ),
      ]);

      // Graceful degradation: use defaults for failed sub-steps
      const content: ContentAnalysisOutput = contentResult.status === 'fulfilled'
        ? contentResult.value
        : { pages: [], averageAnswerFirstScore: 0, faqPageCount: 0, averageStatsDensity: 0, authorAttributionRate: 0, analyzedAt: new Date() };

      const technical: TechnicalAnalysisOutput = technicalResult.status === 'fulfilled'
        ? technicalResult.value
        : { robotsTxt: { exists: false, aiFriendly: true, blockedBots: [], allowedBots: [] }, llmsTxtPresent: false, llmsFullTxtPresent: false, sitemapPresent: false, httpsEnabled: false, mobileFriendly: false, analyzedAt: new Date() };

      const schema: SchemaAnalysisOutput = schemaResult.status === 'fulfilled'
        ? schemaResult.value
        : { pages: [], allPresentTypes: [], allMissingRequired: [], allMissingRecommended: [], totalValidationErrors: 0, vertical: auditRequest.vertical, analyzedAt: new Date() };

      const gbp: GBPAnalysisOutput = gbpResult.status === 'fulfilled'
        ? gbpResult.value
        : { businessName: auditRequest.businessName, rating: 0, reviewCount: 0, photoCount: 0, hasDescription: false, descriptionOptimized: false, categoryAccuracy: false, additionalCategories: [], hasQAndA: false, hoursComplete: false, napConsistent: false, napSources: [], analyzedAt: new Date() };

      const mentions: ParsedMention[] = parseResult.status === 'fulfilled'
        ? parseResult.value
        : [];

      // Log failures
      if (contentResult.status === 'rejected') console.error('[S12] Content analysis failed:', contentResult.reason);
      if (technicalResult.status === 'rejected') console.error('[S12] Technical analysis failed:', technicalResult.reason);
      if (schemaResult.status === 'rejected') console.error('[S12] Schema analysis failed:', schemaResult.reason);
      if (gbpResult.status === 'rejected') console.error('[S12] GBP analysis failed:', gbpResult.reason);
      if (parseResult.status === 'rejected') console.error('[S12] Response parsing failed:', parseResult.reason);

      return { content, technical, schema, gbp, mentions };
    });
    const analyzeResult = rehydrateDates(analyzeRaw) as AnalyzeStepResult;

    // -----------------------------------------------------------------------
    // Step 4: SCORE
    // -----------------------------------------------------------------------

    const scoreRaw = await step.run('score', async () => {
      return executeScoreStep({
        content: analyzeResult.content,
        schema: analyzeResult.schema,
        technical: analyzeResult.technical,
        gbp: analyzeResult.gbp,
        mentions: analyzeResult.mentions,
        queryResult,
      });
    });
    const compositeScore = rehydrateDates(scoreRaw) as CompositeScore;

    // -----------------------------------------------------------------------
    // Step 5: REPORT
    // -----------------------------------------------------------------------

    const pdfRaw = await step.run('report', async () => {
      return await executeReportStep({
        auditRequest,
        score: compositeScore,
        analysisData: {
          content: analyzeResult.content,
          schema: analyzeResult.schema,
          technical: analyzeResult.technical,
          gbp: analyzeResult.gbp,
        },
        queryResult,
        mentions: analyzeResult.mentions,
      });
    });
    const pdfOutput = rehydrateDates(pdfRaw) as PdfOutput;

    // -----------------------------------------------------------------------
    // Step 6: DELIVER
    // -----------------------------------------------------------------------

    const durationMs = Date.now() - startTime;

    const deliverResult = await step.run('deliver', async () => {
      return await executeDeliverStep(
        {
          auditRequest,
          score: compositeScore,
          pdf: pdfOutput,
          analysisData: {
            content: analyzeResult.content,
            schema: analyzeResult.schema,
            technical: analyzeResult.technical,
            gbp: analyzeResult.gbp,
          },
          queryResult,
          durationMs,
        },
        config.databaseUrl,
        config.resendApiKey,
      );
    });

    // -----------------------------------------------------------------------
    // Build final pipeline result
    // -----------------------------------------------------------------------

    const pipelineResult: AuditPipelineResult = {
      clientId: auditRequest.clientId,
      auditType: auditRequest.auditType,
      overallScore: compositeScore.overallScore,
      letterGrade: compositeScore.letterGrade,
      pdfUrl: deliverResult.pdfUrl,
      emailSent: deliverResult.emailSent,
      completedAt: new Date(),
      durationMs,
      providersUsed: successfulPlatforms,
      providersFailed: failedPlatformNames,
    };

    // Emit completion event
    await step.sendEvent('audit-completed', {
      name: 'audit/completed',
      data: {
        clientId: auditRequest.clientId,
        auditResultId: deliverResult.auditResultId,
        overallScore: compositeScore.overallScore,
        letterGrade: compositeScore.letterGrade,
        durationMs,
      },
    });

    return pipelineResult;
  },
);
