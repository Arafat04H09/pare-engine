// Owner: S12 (Inngest Pipeline). Consumers: S13, S14, S15, S17, S20.
// This contract defines the Inngest pipeline step signatures.
// Each step: typed input → typed output. Independently retriable.

import { z } from 'zod';
import type { CrawlInput, CrawlOutput } from './crawl.contract.js';
import type { MultiQueryInput, MultiProviderResult } from './query.contract.js';
import type {
  ContentAnalysisOutput,
  SchemaAnalysisOutput,
  TechnicalAnalysisOutput,
  GBPAnalysisOutput,
} from './analysis.contract.js';
import type { CompositeScore } from './scoring.contract.js';
import type { FullReportData, MiniReportData, PdfOutput } from './report.contract.js';

// --- Pipeline Trigger ---

export const AuditRequestSchema = z.object({
  clientId: z.string().uuid(),
  businessName: z.string().min(1),
  domain: z.string().min(1),
  vertical: z.string().min(1),
  city: z.string().optional(),
  state: z.string().optional(),
  googlePlaceId: z.string().optional(),
  competitors: z.array(z.string()).default([]),
  queries: z.array(z.string()).optional(),
  auditType: z.enum(['full', 'mini']).default('full'),
  contactEmail: z.string().email(),
});

export type AuditRequest = z.infer<typeof AuditRequestSchema>;

// --- Step Signatures ---
// These are type-only definitions. Implementation lives in apps/audit-runner/.
// Each step function has this shape:
//   async (input: StepInput) => Promise<StepOutput>

/** Step 1: CRAWL — Firecrawl the client's website */
export interface CrawlStep {
  input: CrawlInput;
  output: CrawlOutput;
}

/** Step 2: QUERY — Ask AI engines about the business */
export interface QueryStep {
  input: MultiQueryInput;
  output: MultiProviderResult;
}

/** Step 3: ANALYZE — Extract structured data from crawl + query results */
export interface AnalyzeStep {
  input: {
    crawlOutput: CrawlOutput;
    queryResult: MultiProviderResult;
    vertical: string;
    googlePlaceId?: string;
  };
  output: {
    content: ContentAnalysisOutput;
    schema: SchemaAnalysisOutput;
    technical: TechnicalAnalysisOutput;
    gbp: GBPAnalysisOutput;
  };
}

/** Step 4: SCORE — Grade all 5 pillars */
export interface ScoreStep {
  input: AnalyzeStep['output'];
  output: CompositeScore;
}

/** Step 5: REPORT — Generate HTML → PDF */
export interface ReportStep {
  input: {
    auditRequest: AuditRequest;
    score: CompositeScore;
    analysisData: AnalyzeStep['output'];
    queryResult: MultiProviderResult;
    competitors: Array<{ name: string; domain?: string }>;
  };
  output: PdfOutput;
}

/** Step 6: DELIVER — Email the report */
export interface DeliverStep {
  input: {
    auditRequest: AuditRequest;
    pdf: PdfOutput;
    score: CompositeScore;
  };
  output: {
    emailSent: boolean;
    emailId: string;
    deliveredAt: Date;
  };
}

// --- Pipeline Result (full audit outcome) ---

export const AuditPipelineResultSchema = z.object({
  clientId: z.string().uuid(),
  auditType: z.enum(['full', 'mini']),
  overallScore: z.number().int().min(0).max(100),
  letterGrade: z.string(),
  pdfUrl: z.string().optional(),
  emailSent: z.boolean(),
  completedAt: z.date(),
  durationMs: z.number().int(),
  providersUsed: z.array(z.string()),
  providersFailed: z.array(z.string()),
});

export type AuditPipelineResult = z.infer<typeof AuditPipelineResultSchema>;
