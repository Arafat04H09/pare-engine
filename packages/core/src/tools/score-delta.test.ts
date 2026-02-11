// D2: Unit tests for score-delta tool functions
import { describe, it, expect } from 'vitest';
import {
  ScoreDeltaError,
  scoreDelta,
  formatDelta,
  deltaArrowHtml,
  deltaColorHex,
} from './score-delta.js';
import type { CompositeScore } from '../contracts/scoring.contract.js';

// ---------------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------------

function makeCompositeScore(overrides: {
  overall?: number;
  ai?: number;
  content?: number;
  schema?: number;
  tech?: number;
  gbp?: number;
  grade?: 'A' | 'B' | 'C' | 'D' | 'F';
} = {}): CompositeScore {
  const ai = overrides.ai ?? 15;
  const content = overrides.content ?? 15;
  const schema = overrides.schema ?? 8;
  const tech = overrides.tech ?? 5;
  const gbp = overrides.gbp ?? 7;
  const overall = overrides.overall ?? (ai + content + schema + tech + gbp);
  const grade = overrides.grade ?? (overall >= 90 ? 'A' : overall >= 80 ? 'B' : overall >= 70 ? 'C' : overall >= 60 ? 'D' : 'F');

  return {
    overallScore: overall,
    letterGrade: grade,
    pillars: {
      aiVisibility: {
        score: ai,
        maxScore: 30,
        breakdown: { mentionRate: ai * 0.4, citationRate: ai * 0.27, positionQuality: ai * 0.17, sentiment: ai * 0.17 },
        notes: [],
        mentionRate: 0.5,
        citationRate: 0.3,
        avgPosition: 2,
        sentimentBreakdown: { positive: 3, neutral: 2, negative: 0 },
        platformCoverage: { chatgpt: true, perplexity: true, gemini: true },
        providersUsed: 3,
        providersAvailable: 3,
      },
      contentQuality: {
        score: content,
        maxScore: 30,
        breakdown: { answerFirst: content * 0.35, faq: content * 0.2, stats: content * 0.15, author: content * 0.15, depth: content * 0.15 },
        notes: [],
        avgAnswerFirstScore: 6,
        faqCoverage: 2,
        statsDensity: 1.5,
        authorAttributionRate: 0.5,
      },
      schemaStructuredData: {
        score: schema,
        maxScore: 15,
        breakdown: { required: schema * 0.5, recommended: schema * 0.3, validation: schema * 0.2 },
        notes: [],
        requiredTypesPresent: 3,
        requiredTypesTotal: 4,
        recommendedTypesPresent: 2,
        validationErrorCount: 1,
      },
      technicalReadiness: {
        score: tech,
        maxScore: 10,
        breakdown: { crawlerAccess: tech * 0.3, llmsTxt: tech * 0.2, sitemap: tech * 0.15, https: tech * 0.15, mobile: tech * 0.2 },
        notes: [],
        aiCrawlerAccess: true,
        llmsTxtPresent: false,
        sitemapPresent: true,
        httpsEnabled: true,
        mobileFriendly: true,
      },
      localGbp: {
        score: gbp,
        maxScore: 15,
        breakdown: { gbpCompleteness: gbp * 0.35, reviews: gbp * 0.25, nap: gbp * 0.2, directoryMentions: gbp * 0.2 },
        notes: [],
        gbpComplete: true,
        reviewScore: 4.2,
        napConsistent: true,
      },
    },
    scoredAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// ScoreDeltaError
// ---------------------------------------------------------------------------

describe('ScoreDeltaError', () => {
  it('should have correct name and code', () => {
    const err = new ScoreDeltaError('missing score', 'MISSING_AFTER_SCORE');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ScoreDeltaError');
    expect(err.code).toBe('MISSING_AFTER_SCORE');
  });
});

// ---------------------------------------------------------------------------
// scoreDelta — first audit
// ---------------------------------------------------------------------------

describe('scoreDelta — first audit', () => {
  it('should return FirstAuditDelta when before is null', () => {
    const after = makeCompositeScore({ overall: 72, grade: 'C' });
    const result = scoreDelta(null, after);

    expect(result.isFirstAudit).toBe(true);
    if (result.isFirstAudit) {
      expect(result.currentScore).toBe(72);
      expect(result.currentGrade).toBe('C');
      expect(result.pillarDeltas).toBeNull();
      expect(result.overallDelta).toBeNull();
      expect(result.gradeChange).toBeNull();
      expect(result.calculatedAt).toBeInstanceOf(Date);
    }
  });
});

// ---------------------------------------------------------------------------
// scoreDelta — comparison
// ---------------------------------------------------------------------------

describe('scoreDelta — comparison', () => {
  it('should calculate correct deltas for improvement', () => {
    const before = makeCompositeScore({ overall: 50, ai: 10, content: 15, schema: 8, tech: 5, gbp: 7, grade: 'F' });
    const after = makeCompositeScore({ overall: 75, ai: 20, content: 20, schema: 12, tech: 8, gbp: 10, grade: 'C' });

    const result = scoreDelta(before, after);

    expect(result.isFirstAudit).toBe(false);
    if (!result.isFirstAudit) {
      expect(result.overallDelta.before).toBe(50);
      expect(result.overallDelta.after).toBe(75);
      expect(result.overallDelta.delta).toBe(25);
      expect(result.overallDelta.direction).toBe('improved');
    }
  });

  it('should calculate correct deltas for decline', () => {
    const before = makeCompositeScore({ overall: 80, ai: 25, grade: 'B' });
    const after = makeCompositeScore({ overall: 60, ai: 10, grade: 'D' });

    const result = scoreDelta(before, after);

    if (!result.isFirstAudit) {
      expect(result.overallDelta.delta).toBe(-20);
      expect(result.overallDelta.direction).toBe('declined');
      expect(result.gradeChange.changed).toBe(true);
      expect(result.gradeChange.improved).toBe(false);
    }
  });

  it('should handle identical scores (unchanged)', () => {
    const score = makeCompositeScore({ overall: 70, grade: 'C' });
    const result = scoreDelta(score, score);

    if (!result.isFirstAudit) {
      expect(result.overallDelta.delta).toBe(0);
      expect(result.overallDelta.direction).toBe('unchanged');
      expect(result.gradeChange.changed).toBe(false);
      expect(result.pillarsUnchanged).toBe(5);
      expect(result.pillarsImproved).toBe(0);
      expect(result.pillarsDeclined).toBe(0);
      expect(result.biggestImprovement).toBeNull();
      expect(result.biggestDecline).toBeNull();
    }
  });

  it('should track grade improvement', () => {
    const before = makeCompositeScore({ overall: 65, grade: 'D' });
    const after = makeCompositeScore({ overall: 85, grade: 'B' });

    const result = scoreDelta(before, after);
    if (!result.isFirstAudit) {
      expect(result.gradeChange.before).toBe('D');
      expect(result.gradeChange.after).toBe('B');
      expect(result.gradeChange.changed).toBe(true);
      expect(result.gradeChange.improved).toBe(true);
    }
  });

  it('should identify biggest improvement and decline', () => {
    const before = makeCompositeScore({ ai: 10, content: 20, schema: 10, tech: 5, gbp: 10 });
    const after = makeCompositeScore({ ai: 25, content: 12, schema: 12, tech: 5, gbp: 10 });

    const result = scoreDelta(before, after);
    if (!result.isFirstAudit) {
      expect(result.biggestImprovement).not.toBeNull();
      expect(result.biggestImprovement!.pillar).toBe('AI Visibility');
      expect(result.biggestDecline).not.toBeNull();
      expect(result.biggestDecline!.pillar).toBe('Content Quality');
    }
  });

  it('should calculate 5 pillar deltas', () => {
    const before = makeCompositeScore();
    const after = makeCompositeScore({ ai: 20 });
    const result = scoreDelta(before, after);

    if (!result.isFirstAudit) {
      expect(result.pillarDeltas).toHaveLength(5);
      const names = result.pillarDeltas.map((p) => p.pillar);
      expect(names).toContain('AI Visibility');
      expect(names).toContain('Content Quality');
      expect(names).toContain('Schema / Structured Data');
      expect(names).toContain('Technical Readiness');
      expect(names).toContain('Local / GBP');
    }
  });

  it('should calculate percentage change relative to max score', () => {
    const before = makeCompositeScore({ ai: 10 });
    const after = makeCompositeScore({ ai: 25 });
    const result = scoreDelta(before, after);

    if (!result.isFirstAudit) {
      const aiDelta = result.pillarDeltas.find((p) => p.pillar === 'AI Visibility');
      expect(aiDelta).toBeDefined();
      // delta is 15, maxScore is 30, so percentageChange = (15/30)*100 = 50
      expect(aiDelta!.percentageChange).toBe(50);
    }
  });
});

// ---------------------------------------------------------------------------
// formatDelta
// ---------------------------------------------------------------------------

describe('formatDelta', () => {
  it('should format positive delta with +', () => {
    expect(formatDelta(5)).toBe('+5');
  });

  it('should format negative delta with -', () => {
    expect(formatDelta(-3)).toBe('-3');
  });

  it('should format zero delta as 0', () => {
    expect(formatDelta(0)).toBe('0');
  });
});

// ---------------------------------------------------------------------------
// deltaArrowHtml
// ---------------------------------------------------------------------------

describe('deltaArrowHtml', () => {
  it('should return green arrow for improved', () => {
    const html = deltaArrowHtml('improved');
    expect(html).toContain('#22C55E');
    expect(html).toContain('&#9650;'); // up triangle HTML entity
  });

  it('should return red arrow for declined', () => {
    const html = deltaArrowHtml('declined');
    expect(html).toContain('#EF4444');
    expect(html).toContain('&#9660;'); // down triangle HTML entity
  });

  it('should return gray indicator for unchanged', () => {
    const html = deltaArrowHtml('unchanged');
    expect(html).toContain('#94A3B8');
  });
});

// ---------------------------------------------------------------------------
// deltaColorHex
// ---------------------------------------------------------------------------

describe('deltaColorHex', () => {
  it('should return green for improved', () => {
    expect(deltaColorHex('improved')).toBe('#22C55E');
  });

  it('should return red for declined', () => {
    expect(deltaColorHex('declined')).toBe('#EF4444');
  });

  it('should return gray for unchanged', () => {
    expect(deltaColorHex('unchanged')).toBe('#94A3B8');
  });
});
