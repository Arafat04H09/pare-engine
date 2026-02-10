// Owner: S10 (Report Templates). Consumers: S12, S13, S20.
// This contract defines the data shape injected into HTML report templates.

import { z } from 'zod';
import { CompositeScoreSchema } from './scoring.contract.js';
import { PlatformSchema } from './query.contract.js';

// --- Client Info (injected into every report) ---

export const ReportClientInfoSchema = z.object({
  businessName: z.string(),
  domain: z.string(),
  vertical: z.string(),
  city: z.string().optional(),
  state: z.string().optional(),
  auditDate: z.date(),
  auditType: z.enum(['full', 'mini', 'monthly']),
});

export type ReportClientInfo = z.infer<typeof ReportClientInfoSchema>;

// --- Competitor Data (for relative reporting) ---

export const ReportCompetitorSchema = z.object({
  name: z.string(),
  domain: z.string().optional(),
  overallScore: z.number().int().min(0).max(100).optional(),
  mentionRate: z.number().min(0).max(1).optional(),
  rank: z.number().int().optional(),
});

export type ReportCompetitor = z.infer<typeof ReportCompetitorSchema>;

// --- Per-Platform Visibility Snapshot ---

export const PlatformSnapshotSchema = z.object({
  platform: PlatformSchema,
  mentioned: z.boolean(),
  position: z.number().int().nullable(),
  sentiment: z.enum(['positive', 'neutral', 'negative', 'not_mentioned']),
  citedUrl: z.boolean(),
  sampleResponse: z.string().optional(),
});

export type PlatformSnapshot = z.infer<typeof PlatformSnapshotSchema>;

// --- Finding (reusable across report sections) ---

export const ReportFindingSchema = z.object({
  severity: z.enum(['critical', 'warning', 'info', 'success']),
  title: z.string(),
  description: z.string(),
  recommendation: z.string().optional(),
  effort: z.enum(['quick-win', 'sprint', 'ongoing']).optional(),
});

export type ReportFinding = z.infer<typeof ReportFindingSchema>;

// --- Full 9-Page Audit Report Data ---

export const FullReportDataSchema = z.object({
  client: ReportClientInfoSchema,
  score: CompositeScoreSchema,
  competitors: z.array(ReportCompetitorSchema),
  platformSnapshots: z.array(PlatformSnapshotSchema),
  findings: z.array(ReportFindingSchema),
  // Per-section detail
  schemaGaps: z.array(z.string()),
  technicalIssues: z.array(z.string()),
  contentWeaknesses: z.array(z.string()),
  gbpIssues: z.array(z.string()),
  // Action plan
  actionPlan: z.array(z.object({
    priority: z.number().int().min(1),
    action: z.string(),
    impact: z.enum(['high', 'medium', 'low']),
    effort: z.enum(['quick-win', 'sprint', 'ongoing']),
    pillar: z.string(),
  })),
  // Metadata
  generatedAt: z.date(),
  reportVersion: z.string().default('1.0'),
});

export type FullReportData = z.infer<typeof FullReportDataSchema>;

// --- Mini (1-Page) Report Data ---

export const MiniReportDataSchema = z.object({
  client: ReportClientInfoSchema,
  overallScore: z.number().int().min(0).max(100),
  letterGrade: z.enum(['A', 'B', 'C', 'D', 'F']),
  pillarScores: z.object({
    aiVisibility: z.number(),
    contentQuality: z.number(),
    schemaStructuredData: z.number(),
    technicalReadiness: z.number(),
    localGbp: z.number(),
  }),
  topFindings: z.array(ReportFindingSchema).max(3),
  ctaText: z.string().default('Get your full AI Readiness Audit'),
  generatedAt: z.date(),
});

export type MiniReportData = z.infer<typeof MiniReportDataSchema>;

// --- PDF Generation Output ---

export const PdfOutputSchema = z.object({
  buffer: z.instanceof(Buffer),
  filename: z.string(),
  pageCount: z.number().int().positive(),
  generatedAt: z.date(),
});

export type PdfOutput = z.infer<typeof PdfOutputSchema>;
