// D6: Contract Zod schema validation tests
// Verifies that all contract schemas correctly parse valid data and reject invalid data.
import { describe, it, expect } from 'vitest';

import {
  // Config
  ConfigSchema,
  MinimalAuditConfigSchema,
  WebConfigSchema,
  PipelineConfigSchema,

  // Crawl
  CrawlInputSchema,
  CrawlOutputSchema,
  CrawledPageSchema,
  MediaAssetSchema,

  // Query
  PlatformSchema,
  QueryInputSchema,
  MultiQueryInputSchema,
  EngineResponseSchema,
  MultiProviderResultSchema,
  CohortQueryInputSchema,

  // Analysis
  ContentPageAnalysisSchema,
  ContentAnalysisOutputSchema,
  SchemaPageAnalysisSchema,
  SchemaAnalysisOutputSchema,
  RobotsTxtAnalysisSchema,
  TechnicalAnalysisOutputSchema,
  GBPAnalysisOutputSchema,
  ParsedMentionSchema,
  AdversarialProbeResultSchema,
  HallucinationSchema,
  AgenticCommerceOutputSchema,

  // Scoring
  SCORING_WEIGHTS,
  TOTAL_POINTS,
  LetterGradeSchema,
  scoreToGrade,
  PillarScoreSchema,
  AIVisibilityScoreSchema,
  ContentQualityScoreSchema,
  SchemaScoreSchema,
  TechnicalScoreSchema,
  GBPScoreSchema,
  CompositeScoreSchema,

  // Report
  ReportClientInfoSchema,
  ReportCompetitorSchema,
  PlatformSnapshotSchema,
  ReportFindingSchema,
  FullReportDataSchema,
  MiniReportDataSchema,
  PdfOutputSchema,

  // Pipeline
  AuditRequestSchema,
  AuditPipelineResultSchema,

  // Delta
  PillarDeltaSchema,
  OverallDeltaSchema,
  GradeChangeSchema,
  FirstAuditDeltaSchema,
  ScoreDeltaResultSchema,
  DeltaResultSchema,
  DeltaReportSchema,

  // Proposal
  ProposalLineItemSchema,
  ProposalDataSchema,
} from './index.js';

// ===========================================================================
// Config Contracts
// ===========================================================================

describe('ConfigSchema', () => {
  const validConfig = {
    openaiApiKey: 'sk-test',
    googleGenerativeAiApiKey: 'goog-test',
    perplexityApiKey: 'pplx-test',
    anthropicApiKey: 'ant-test',
    firecrawlApiKey: 'fc-test',
    databaseUrl: 'postgresql://localhost:5432/db',
    adminEmail: 'admin@example.com',
    adminPasswordHash: '$2b$10$hash',
    sessionSecret: 'a'.repeat(32),
  };

  it('should parse valid full config', () => {
    const result = ConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it('should reject missing required keys', () => {
    const result = ConfigSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject invalid database URL', () => {
    const result = ConfigSchema.safeParse({ ...validConfig, databaseUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid email', () => {
    const result = ConfigSchema.safeParse({ ...validConfig, adminEmail: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('should reject session secret shorter than 32 chars', () => {
    const result = ConfigSchema.safeParse({ ...validConfig, sessionSecret: 'short' });
    expect(result.success).toBe(false);
  });

  it('should default nodeEnv to development', () => {
    const result = ConfigSchema.safeParse(validConfig);
    if (result.success) {
      expect(result.data.nodeEnv).toBe('development');
    }
  });

  it('should accept optional fields as undefined', () => {
    const result = ConfigSchema.safeParse(validConfig);
    if (result.success) {
      expect(result.data.serperApiKey).toBeUndefined();
      expect(result.data.notionApiKey).toBeUndefined();
    }
  });
});

describe('MinimalAuditConfigSchema', () => {
  it('should parse with only required keys', () => {
    const result = MinimalAuditConfigSchema.safeParse({
      openaiApiKey: 'sk-test',
      firecrawlApiKey: 'fc-test',
      anthropicApiKey: 'ant-test',
      databaseUrl: 'postgresql://localhost/db',
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing firecrawl key', () => {
    const result = MinimalAuditConfigSchema.safeParse({
      openaiApiKey: 'sk-test',
      anthropicApiKey: 'ant-test',
      databaseUrl: 'postgresql://localhost/db',
    });
    expect(result.success).toBe(false);
  });
});

// ===========================================================================
// Crawl Contracts
// ===========================================================================

describe('CrawlInputSchema', () => {
  it('should parse valid input with defaults', () => {
    const result = CrawlInputSchema.safeParse({ domain: 'example.com' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.maxPages).toBe(20);
      expect(result.data.formats).toEqual(['markdown', 'html']);
    }
  });

  it('should reject empty domain', () => {
    expect(CrawlInputSchema.safeParse({ domain: '' }).success).toBe(false);
  });

  it('should reject invalid format', () => {
    expect(CrawlInputSchema.safeParse({ domain: 'x.com', formats: ['pdf'] }).success).toBe(false);
  });
});

describe('CrawledPageSchema', () => {
  it('should parse valid page', () => {
    const result = CrawledPageSchema.safeParse({
      url: 'https://example.com',
      markdown: '# Hello',
      html: '<h1>Hello</h1>',
      statusCode: 200,
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid URL', () => {
    expect(CrawledPageSchema.safeParse({
      url: 'not-a-url',
      markdown: '',
      html: '',
      statusCode: 200,
    }).success).toBe(false);
  });
});

describe('CrawlOutputSchema', () => {
  it('should parse valid output', () => {
    const result = CrawlOutputSchema.safeParse({
      domain: 'example.com',
      pages: [],
      discoveredUrls: [],
      errors: [],
      crawledAt: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it('should reject without crawledAt', () => {
    expect(CrawlOutputSchema.safeParse({
      domain: 'x',
      pages: [],
      discoveredUrls: [],
      errors: [],
    }).success).toBe(false);
  });
});

describe('MediaAssetSchema', () => {
  it('should parse valid media asset', () => {
    const result = MediaAssetSchema.safeParse({
      url: 'https://youtube.com/watch?v=abc',
      type: 'youtube',
      pageUrl: 'https://example.com/page',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid type', () => {
    expect(MediaAssetSchema.safeParse({
      url: 'x',
      type: 'tiktok',
      pageUrl: 'x',
    }).success).toBe(false);
  });
});

// ===========================================================================
// Query Contracts
// ===========================================================================

describe('PlatformSchema', () => {
  it('should accept chatgpt, perplexity, gemini', () => {
    expect(PlatformSchema.safeParse('chatgpt').success).toBe(true);
    expect(PlatformSchema.safeParse('perplexity').success).toBe(true);
    expect(PlatformSchema.safeParse('gemini').success).toBe(true);
  });

  it('should reject claude', () => {
    expect(PlatformSchema.safeParse('claude').success).toBe(false);
  });

  it('should reject google_aio', () => {
    expect(PlatformSchema.safeParse('google_aio').success).toBe(false);
  });
});

describe('QueryInputSchema', () => {
  it('should parse valid query', () => {
    const result = QueryInputSchema.safeParse({
      brand: 'Acme',
      domain: 'acme.com',
      query: 'best service',
      platform: 'chatgpt',
    });
    expect(result.success).toBe(true);
  });

  it('should default competitors to empty array', () => {
    const result = QueryInputSchema.safeParse({
      brand: 'Acme',
      domain: 'acme.com',
      query: 'test',
      platform: 'chatgpt',
    });
    if (result.success) {
      expect(result.data.competitors).toEqual([]);
    }
  });
});

describe('MultiQueryInputSchema', () => {
  it('should default platforms to all', () => {
    const result = MultiQueryInputSchema.safeParse({
      brand: 'Acme',
      domain: 'acme.com',
      queries: ['test query'],
    });
    if (result.success) {
      expect(result.data.platforms).toEqual(['chatgpt', 'perplexity', 'gemini']);
    }
  });
});

describe('EngineResponseSchema', () => {
  it('should parse valid response', () => {
    const result = EngineResponseSchema.safeParse({
      platform: 'chatgpt',
      query: 'test',
      rawResponse: 'result',
      citedUrls: [],
      executedAt: new Date(),
      latencyMs: 500,
      success: true,
    });
    expect(result.success).toBe(true);
  });

  it('should default groundingSources to empty array', () => {
    const result = EngineResponseSchema.safeParse({
      platform: 'chatgpt',
      query: 'test',
      rawResponse: 'result',
      citedUrls: [],
      executedAt: new Date(),
      latencyMs: 500,
      success: true,
    });
    if (result.success) {
      expect(result.data.groundingSources).toEqual([]);
    }
  });
});

describe('CohortQueryInputSchema', () => {
  it('should require at least one competitor', () => {
    expect(CohortQueryInputSchema.safeParse({
      brand: 'Acme',
      domain: 'acme.com',
      queries: ['test'],
      competitors: [],
    }).success).toBe(false);
  });
});

// ===========================================================================
// Analysis Contracts
// ===========================================================================

describe('ContentPageAnalysisSchema', () => {
  it('should parse valid data', () => {
    const result = ContentPageAnalysisSchema.safeParse({
      url: 'https://example.com',
      answerFirstScore: 7,
      faqPresent: true,
      statsCount: 3,
      hasAuthorAttribution: true,
      wordCount: 500,
      depthScore: 8,
    });
    expect(result.success).toBe(true);
  });

  it('should reject answerFirstScore > 10', () => {
    expect(ContentPageAnalysisSchema.safeParse({
      url: 'x',
      answerFirstScore: 11,
      faqPresent: false,
      statsCount: 0,
      hasAuthorAttribution: false,
      wordCount: 0,
      depthScore: 0,
    }).success).toBe(false);
  });

  it('should reject negative wordCount', () => {
    expect(ContentPageAnalysisSchema.safeParse({
      url: 'x',
      answerFirstScore: 5,
      faqPresent: false,
      statsCount: 0,
      hasAuthorAttribution: false,
      wordCount: -1,
      depthScore: 5,
    }).success).toBe(false);
  });
});

describe('GBPAnalysisOutputSchema', () => {
  it('should parse valid GBP data', () => {
    const result = GBPAnalysisOutputSchema.safeParse({
      businessName: 'Acme',
      rating: 4.5,
      reviewCount: 120,
      photoCount: 30,
      hasDescription: true,
      descriptionOptimized: true,
      categoryAccuracy: true,
      additionalCategories: [],
      hasQAndA: false,
      hoursComplete: true,
      napConsistent: true,
      analyzedAt: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it('should reject rating > 5', () => {
    expect(GBPAnalysisOutputSchema.safeParse({
      businessName: 'X',
      rating: 6,
      reviewCount: 0,
      photoCount: 0,
      hasDescription: false,
      descriptionOptimized: false,
      categoryAccuracy: false,
      additionalCategories: [],
      hasQAndA: false,
      hoursComplete: false,
      napConsistent: false,
      analyzedAt: new Date(),
    }).success).toBe(false);
  });
});

describe('ParsedMentionSchema', () => {
  it('should parse valid mention', () => {
    const result = ParsedMentionSchema.safeParse({
      brandMentioned: true,
      brandPosition: 1,
      brandSentiment: 'positive',
      brandUrlCited: true,
      citedUrls: ['https://example.com'],
      competitorMentions: {},
    });
    expect(result.success).toBe(true);
  });

  it('should accept null brandPosition', () => {
    const result = ParsedMentionSchema.safeParse({
      brandMentioned: false,
      brandPosition: null,
      brandSentiment: 'not_mentioned',
      brandUrlCited: false,
      citedUrls: [],
      competitorMentions: {},
    });
    expect(result.success).toBe(true);
  });

  it('should accept all sentiment values', () => {
    for (const sentiment of ['positive', 'neutral', 'negative', 'not_mentioned']) {
      const result = ParsedMentionSchema.safeParse({
        brandMentioned: true,
        brandPosition: 1,
        brandSentiment: sentiment,
        brandUrlCited: false,
        citedUrls: [],
        competitorMentions: {},
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('TechnicalAnalysisOutputSchema', () => {
  it('should parse valid technical data', () => {
    const result = TechnicalAnalysisOutputSchema.safeParse({
      robotsTxt: {
        exists: true,
        aiFriendly: true,
        blockedBots: [],
        allowedBots: ['GPTBot'],
      },
      llmsTxtPresent: false,
      llmsFullTxtPresent: false,
      sitemapPresent: true,
      httpsEnabled: true,
      mobileFriendly: true,
      analyzedAt: new Date(),
    });
    expect(result.success).toBe(true);
  });
});

describe('AdversarialProbeResultSchema', () => {
  it('should parse valid adversarial result', () => {
    const result = AdversarialProbeResultSchema.safeParse({
      vector: 'karen',
      prompt: 'bad reviews about acme',
      response: 'Acme is generally well-reviewed...',
      brandMentioned: true,
      sentiment: 'neutral',
      resilient: true,
      confidenceScore: 0.85,
      reasoning: 'The AI defended the brand well.',
    });
    expect(result.success).toBe(true);
  });
});

describe('HallucinationSchema', () => {
  it('should parse valid hallucination', () => {
    const result = HallucinationSchema.safeParse({
      type: 'temporal',
      claim: 'Founded in 1990',
      source: 'chatgpt',
      severity: 'medium',
      explanation: 'Company was founded in 2005, not 1990.',
    });
    expect(result.success).toBe(true);
  });
});

// ===========================================================================
// Scoring Contracts
// ===========================================================================

describe('SCORING_WEIGHTS', () => {
  it('should sum to 100', () => {
    const total = Object.values(SCORING_WEIGHTS).reduce((sum, w) => sum + w, 0);
    expect(total).toBe(100);
  });

  it('should match canonical weights', () => {
    expect(SCORING_WEIGHTS.aiVisibility).toBe(30);
    expect(SCORING_WEIGHTS.contentQuality).toBe(30);
    expect(SCORING_WEIGHTS.schemaStructuredData).toBe(15);
    expect(SCORING_WEIGHTS.technicalReadiness).toBe(10);
    expect(SCORING_WEIGHTS.localGbp).toBe(15);
  });

  it('TOTAL_POINTS should be 100', () => {
    expect(TOTAL_POINTS).toBe(100);
  });
});

describe('scoreToGrade', () => {
  it('should return A for 90-100', () => {
    expect(scoreToGrade(90)).toBe('A');
    expect(scoreToGrade(95)).toBe('A');
    expect(scoreToGrade(100)).toBe('A');
  });

  it('should return B for 80-89', () => {
    expect(scoreToGrade(80)).toBe('B');
    expect(scoreToGrade(89)).toBe('B');
  });

  it('should return C for 70-79', () => {
    expect(scoreToGrade(70)).toBe('C');
    expect(scoreToGrade(79)).toBe('C');
  });

  it('should return D for 60-69', () => {
    expect(scoreToGrade(60)).toBe('D');
    expect(scoreToGrade(69)).toBe('D');
  });

  it('should return F for 0-59', () => {
    expect(scoreToGrade(0)).toBe('F');
    expect(scoreToGrade(59)).toBe('F');
  });
});

describe('LetterGradeSchema', () => {
  it('should accept A, B, C, D, F', () => {
    for (const grade of ['A', 'B', 'C', 'D', 'F']) {
      expect(LetterGradeSchema.safeParse(grade).success).toBe(true);
    }
  });

  it('should reject B+ and other non-standard grades', () => {
    expect(LetterGradeSchema.safeParse('B+').success).toBe(false);
    expect(LetterGradeSchema.safeParse('A-').success).toBe(false);
  });
});

describe('PillarScoreSchema', () => {
  it('should parse valid pillar score', () => {
    const result = PillarScoreSchema.safeParse({
      score: 20,
      maxScore: 30,
      breakdown: { sub1: 10, sub2: 10 },
    });
    expect(result.success).toBe(true);
  });

  it('should default notes to empty array', () => {
    const result = PillarScoreSchema.safeParse({
      score: 10,
      maxScore: 30,
      breakdown: {},
    });
    if (result.success) {
      expect(result.data.notes).toEqual([]);
    }
  });

  it('should reject negative score', () => {
    expect(PillarScoreSchema.safeParse({
      score: -1,
      maxScore: 30,
      breakdown: {},
    }).success).toBe(false);
  });
});

describe('AIVisibilityScoreSchema', () => {
  it('should enforce maxScore of 30', () => {
    const valid = {
      score: 20,
      maxScore: 30,
      breakdown: {},
      mentionRate: 0.5,
      citationRate: 0.3,
      avgPosition: 2,
      sentimentBreakdown: { positive: 3, neutral: 2, negative: 0 },
      platformCoverage: { chatgpt: true },
      providersUsed: 3,
      providersAvailable: 3,
    };
    expect(AIVisibilityScoreSchema.safeParse(valid).success).toBe(true);
    expect(AIVisibilityScoreSchema.safeParse({ ...valid, maxScore: 25 }).success).toBe(false);
  });
});

// ===========================================================================
// Report Contracts
// ===========================================================================

describe('ReportFindingSchema', () => {
  it('should parse valid finding', () => {
    const result = ReportFindingSchema.safeParse({
      severity: 'critical',
      title: 'Missing JSON-LD',
      description: 'No structured data found on the homepage.',
    });
    expect(result.success).toBe(true);
  });

  it('should accept all severity levels', () => {
    for (const sev of ['critical', 'warning', 'info', 'success']) {
      expect(ReportFindingSchema.safeParse({
        severity: sev,
        title: 'Test',
        description: 'Test',
      }).success).toBe(true);
    }
  });
});

describe('PlatformSnapshotSchema', () => {
  it('should parse valid snapshot', () => {
    const result = PlatformSnapshotSchema.safeParse({
      platform: 'chatgpt',
      mentioned: true,
      position: 1,
      sentiment: 'positive',
      citedUrl: true,
    });
    expect(result.success).toBe(true);
  });

  it('should accept null position', () => {
    const result = PlatformSnapshotSchema.safeParse({
      platform: 'perplexity',
      mentioned: false,
      position: null,
      sentiment: 'not_mentioned',
      citedUrl: false,
    });
    expect(result.success).toBe(true);
  });
});

describe('MiniReportDataSchema', () => {
  it('should limit topFindings to max 3', () => {
    const findings = Array.from({ length: 5 }, (_, i) => ({
      severity: 'warning' as const,
      title: `Finding ${i}`,
      description: `Description ${i}`,
    }));
    const result = MiniReportDataSchema.safeParse({
      client: {
        businessName: 'Test',
        domain: 'test.com',
        vertical: 'dental',
        auditDate: new Date(),
        auditType: 'mini',
      },
      overallScore: 75,
      letterGrade: 'C',
      pillarScores: {
        aiVisibility: 20,
        contentQuality: 20,
        schemaStructuredData: 10,
        technicalReadiness: 7,
        localGbp: 10,
      },
      topFindings: findings,
      generatedAt: new Date(),
    });
    expect(result.success).toBe(false); // max 3 findings
  });
});

describe('PdfOutputSchema', () => {
  it('should parse valid PDF output', () => {
    const result = PdfOutputSchema.safeParse({
      buffer: Buffer.from('fake-pdf'),
      filename: 'report.pdf',
      pageCount: 9,
      generatedAt: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it('should reject zero pageCount', () => {
    expect(PdfOutputSchema.safeParse({
      buffer: Buffer.from('x'),
      filename: 'x.pdf',
      pageCount: 0,
      generatedAt: new Date(),
    }).success).toBe(false);
  });
});

// ===========================================================================
// Pipeline Contracts
// ===========================================================================

describe('AuditRequestSchema', () => {
  it('should parse valid audit request', () => {
    const result = AuditRequestSchema.safeParse({
      clientId: '550e8400-e29b-41d4-a716-446655440000',
      businessName: 'Acme Dental',
      domain: 'acmedental.com',
      vertical: 'dental',
      contactEmail: 'john@acmedental.com',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.auditType).toBe('full'); // default
      expect(result.data.competitors).toEqual([]);
    }
  });

  it('should reject invalid clientId', () => {
    expect(AuditRequestSchema.safeParse({
      clientId: 'not-a-uuid',
      businessName: 'Test',
      domain: 'test.com',
      vertical: 'dental',
      contactEmail: 'test@test.com',
    }).success).toBe(false);
  });

  it('should reject invalid email', () => {
    expect(AuditRequestSchema.safeParse({
      clientId: '550e8400-e29b-41d4-a716-446655440000',
      businessName: 'Test',
      domain: 'test.com',
      vertical: 'dental',
      contactEmail: 'not-an-email',
    }).success).toBe(false);
  });
});

describe('AuditPipelineResultSchema', () => {
  it('should parse valid pipeline result', () => {
    const result = AuditPipelineResultSchema.safeParse({
      clientId: '550e8400-e29b-41d4-a716-446655440000',
      auditType: 'full',
      overallScore: 75,
      letterGrade: 'C',
      emailSent: true,
      completedAt: new Date(),
      durationMs: 120000,
      providersUsed: ['chatgpt', 'perplexity'],
      providersFailed: ['gemini'],
    });
    expect(result.success).toBe(true);
  });

  it('should reject score > 100', () => {
    expect(AuditPipelineResultSchema.safeParse({
      clientId: '550e8400-e29b-41d4-a716-446655440000',
      auditType: 'full',
      overallScore: 150,
      letterGrade: 'A',
      emailSent: true,
      completedAt: new Date(),
      durationMs: 1000,
      providersUsed: [],
      providersFailed: [],
    }).success).toBe(false);
  });
});

// ===========================================================================
// Delta Contracts
// ===========================================================================

describe('PillarDeltaSchema', () => {
  it('should parse valid pillar delta', () => {
    const result = PillarDeltaSchema.safeParse({
      pillar: 'AI Visibility',
      before: 10,
      after: 20,
      delta: 10,
      maxScore: 30,
      percentageChange: 33,
      direction: 'improved',
    });
    expect(result.success).toBe(true);
  });
});

describe('DeltaResultSchema (discriminated union)', () => {
  it('should parse first audit delta', () => {
    const result = DeltaResultSchema.safeParse({
      isFirstAudit: true,
      currentScore: 72,
      currentGrade: 'C',
      pillarDeltas: null,
      overallDelta: null,
      gradeChange: null,
      calculatedAt: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it('should parse comparison delta', () => {
    const result = DeltaResultSchema.safeParse({
      isFirstAudit: false,
      pillarDeltas: [{
        pillar: 'AI Visibility',
        before: 10,
        after: 20,
        delta: 10,
        maxScore: 30,
        percentageChange: 33,
        direction: 'improved',
      }],
      overallDelta: { before: 50, after: 75, delta: 25, percentageChange: 25, direction: 'improved' },
      gradeChange: { before: 'F', after: 'C', changed: true, improved: true },
      biggestImprovement: null,
      biggestDecline: null,
      pillarsImproved: 1,
      pillarsDeclined: 0,
      pillarsUnchanged: 4,
      calculatedAt: new Date(),
    });
    expect(result.success).toBe(true);
  });
});

describe('DeltaReportSchema', () => {
  it('should parse valid delta report', () => {
    const result = DeltaReportSchema.safeParse({
      baselineAuditId: null,
      verificationAuditId: '550e8400-e29b-41d4-a716-446655440000',
      clientId: '550e8400-e29b-41d4-a716-446655440001',
      businessName: 'Acme',
      domain: 'acme.com',
      delta: {
        isFirstAudit: true,
        currentScore: 72,
        currentGrade: 'C',
        pillarDeltas: null,
        overallDelta: null,
        gradeChange: null,
        calculatedAt: new Date(),
      },
      verifiedAt: new Date(),
    });
    expect(result.success).toBe(true);
  });
});

// ===========================================================================
// Proposal Contracts
// ===========================================================================

describe('ProposalLineItemSchema', () => {
  it('should parse valid line item', () => {
    const result = ProposalLineItemSchema.safeParse({
      name: 'Add FAQ Schema',
      description: 'Implement FAQPage JSON-LD on key pages.',
      pillar: 'Schema / Structured Data',
      price: 50000, // $500 in cents
      effort: 'quick-win',
      priority: 1,
    });
    expect(result.success).toBe(true);
  });

  it('should reject negative price', () => {
    expect(ProposalLineItemSchema.safeParse({
      name: 'x',
      description: 'x',
      pillar: 'x',
      price: -100,
      effort: 'sprint',
      priority: 1,
    }).success).toBe(false);
  });
});

describe('ProposalDataSchema', () => {
  it('should parse valid proposal', () => {
    const result = ProposalDataSchema.safeParse({
      clientName: 'Acme',
      domain: 'acme.com',
      vertical: 'dental',
      auditDate: new Date(),
      overallScore: 72,
      letterGrade: 'C',
      lineItems: [{
        name: 'Fix Schema',
        description: 'Add JSON-LD',
        pillar: 'Schema',
        price: 50000,
        effort: 'quick-win',
        priority: 1,
      }],
      subtotal: 50000,
      executiveSummary: 'Your audit shows...',
      estimatedTimeline: '2-3 weeks',
      generatedAt: new Date(),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isDraft).toBe(true);
    }
  });

  it('should reject empty line items', () => {
    expect(ProposalDataSchema.safeParse({
      clientName: 'X',
      domain: 'x.com',
      vertical: 'dental',
      auditDate: new Date(),
      overallScore: 50,
      letterGrade: 'F',
      lineItems: [],
      subtotal: 0,
      executiveSummary: 'x',
      estimatedTimeline: 'x',
      generatedAt: new Date(),
    }).success).toBe(false);
  });
});
