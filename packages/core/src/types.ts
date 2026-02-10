// Owner: S2 (Scoring Foundation) — refactored from legacy types.
// Platform type now imports from contracts. Removed 'claude' (no web access)
// and 'google_aio' (renamed to 'gemini' for clarity).

import type { Platform } from './contracts/query.contract.js';

// Re-export the canonical Platform type from contracts
export type { Platform } from './contracts/query.contract.js';

export interface QueryResult {
  platform: Platform;
  query: string;
  response: string;
  brandMentioned: boolean;
  brandPosition: number | null;
  brandSentiment: 'positive' | 'neutral' | 'negative' | 'not_mentioned';
  brandUrlCited: boolean;
  citedUrls: string[];
  competitorMentions: Record<string, {
    mentioned: boolean;
    position: number | null;
    sentiment: string;
  }>;
  responseHash: string;
  executedAt: Date;
}

export interface PageSchemaAnalysis {
    url: string;
    schemaTypes: string[];
    validationErrors: string[];
}

export interface PageContentAnalysis {
    url: string;
    answerFirstScore: number;
    statsCount: number;
    hasAuthor: boolean;
}

export interface RobotsTxtAnalysis {
    aiFriendly: boolean;
    blockedBots: string[];
}

export interface AuditResult {
  overallScore: number;
  letterGrade: string;
  aiVisibility: {
    score: number;
    mentionRate: number;
    citationRate: number;
    avgPosition: number;
    platformScores: Record<Platform, number>;
    queryResults: QueryResult[];
  };
  schema: {
    score: number;
    presentTypes: string[];
    missingTypes: string[];
    validationErrors: string[];
    pageAnalysis: PageSchemaAnalysis[];
  };
  content: {
    score: number;
    answerFirstPages: number;
    faqPages: number;
    avgStatsDensity: number;
    authorAttributionPages: number;
    pageAnalysis: PageContentAnalysis[];
  };
  technical: {
    score: number;
    robotsTxt: RobotsTxtAnalysis;
    llmsTxt: boolean;
    llmsFullTxt: boolean;
    sitemapPresent: boolean;
    pageSpeed: number;
    mobileFriendly: boolean;
    httpsEnabled: boolean;
  };
  gbp: {
    score: number;
    rating: number;
    reviewCount: number;
    photoCount: number;
    descriptionOptimized: boolean;
    categoryAccuracy: boolean;
    qAndAPresent: boolean;
    napConsistent: boolean;
  };
}
