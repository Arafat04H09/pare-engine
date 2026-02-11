// D2: Unit tests for parse-response tool functions
import { describe, it, expect } from 'vitest';
import {
  ParseResponseError,
  extractUrls,
  countWords,
  buildParseSystemPrompt,
  buildParseUserPrompt,
  buildContentAnalysisSystemPrompt,
  buildContentAnalysisUserPrompt,
  toLLMParsedMention,
  toContentPageAnalysis,
  LLMParsedMentionSchema,
  LLMContentPageAnalysisSchema,
} from './parse-response.js';

// ---------------------------------------------------------------------------
// ParseResponseError
// ---------------------------------------------------------------------------

describe('ParseResponseError', () => {
  it('should have correct name and code', () => {
    const err = new ParseResponseError('parse failed', 'INVALID_RESPONSE');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ParseResponseError');
    expect(err.code).toBe('INVALID_RESPONSE');
  });
});

// ---------------------------------------------------------------------------
// extractUrls
// ---------------------------------------------------------------------------

describe('extractUrls', () => {
  it('should extract http URLs from text', () => {
    const text = 'Visit http://example.com for more info.';
    expect(extractUrls(text)).toContain('http://example.com');
  });

  it('should extract https URLs from text', () => {
    const text = 'Check https://example.com/page?q=1';
    expect(extractUrls(text)).toContain('https://example.com/page?q=1');
  });

  it('should extract multiple URLs', () => {
    const text = 'Visit https://a.com and https://b.com for details.';
    const urls = extractUrls(text);
    expect(urls).toContain('https://a.com');
    expect(urls).toContain('https://b.com');
  });

  it('should strip trailing punctuation', () => {
    const text = 'See https://example.com/page.';
    const urls = extractUrls(text);
    expect(urls).toContain('https://example.com/page');
  });

  it('should deduplicate URLs', () => {
    const text = 'https://example.com and https://example.com again';
    const urls = extractUrls(text);
    expect(urls.filter((u) => u === 'https://example.com')).toHaveLength(1);
  });

  it('should return empty array for text with no URLs', () => {
    expect(extractUrls('no links here')).toEqual([]);
  });

  it('should handle URLs with complex paths', () => {
    const text = 'See https://example.com/path/to/page?key=value&other=123';
    const urls = extractUrls(text);
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain('example.com/path/to/page');
  });
});

// ---------------------------------------------------------------------------
// countWords
// ---------------------------------------------------------------------------

describe('countWords', () => {
  it('should count words in plain text', () => {
    expect(countWords('hello world')).toBe(2);
  });

  it('should ignore markdown image syntax', () => {
    expect(countWords('text ![alt](url) more')).toBe(2);
  });

  it('should extract link text from markdown links', () => {
    expect(countWords('[click here](https://example.com)')).toBe(2);
  });

  it('should ignore markdown heading markers', () => {
    expect(countWords('## Title Here')).toBe(2);
  });

  it('should ignore bold/italic markers', () => {
    expect(countWords('**bold** and *italic*')).toBe(3);
  });

  it('should return 0 for empty string', () => {
    expect(countWords('')).toBe(0);
  });

  it('should handle whitespace-only string', () => {
    expect(countWords('   \n\n  ')).toBe(0);
  });

  it('should count words in a realistic markdown passage', () => {
    const markdown = `
# FAQ Page

## What is GEO?

GEO stands for **Generative Engine Optimization**. It helps businesses
get mentioned by AI engines like ChatGPT and Perplexity.

[Learn more](https://example.com/geo)
    `.trim();
    const count = countWords(markdown);
    expect(count).toBeGreaterThan(15);
    expect(count).toBeLessThan(30);
  });
});

// ---------------------------------------------------------------------------
// buildParseSystemPrompt / buildParseUserPrompt
// ---------------------------------------------------------------------------

describe('buildParseSystemPrompt', () => {
  it('should return a non-empty system prompt', () => {
    const prompt = buildParseSystemPrompt();
    expect(prompt.length).toBeGreaterThan(50);
    expect(prompt).toContain('brand');
    expect(prompt).toContain('sentiment');
  });
});

describe('buildParseUserPrompt', () => {
  it('should include brand, domain, platform, and response text', () => {
    const prompt = buildParseUserPrompt(
      {
        platform: 'chatgpt',
        query: 'best dentist',
        rawResponse: 'Acme Dental is excellent...',
        citedUrls: ['https://acmedental.com'],
        groundingSources: [],
        executedAt: new Date(),
        latencyMs: 1000,
        success: true,
      },
      'Acme Dental',
      'acmedental.com',
      ['Competitor A', 'Competitor B'],
    );

    expect(prompt).toContain('Acme Dental');
    expect(prompt).toContain('acmedental.com');
    expect(prompt).toContain('chatgpt');
    expect(prompt).toContain('Acme Dental is excellent');
    expect(prompt).toContain('Competitor A');
  });

  it('should handle empty competitors', () => {
    const prompt = buildParseUserPrompt(
      {
        platform: 'perplexity',
        query: 'test',
        rawResponse: 'response text',
        citedUrls: [],
        groundingSources: [],
        executedAt: new Date(),
        latencyMs: 100,
        success: true,
      },
      'Brand',
      'brand.com',
      [],
    );
    expect(prompt).toContain('No competitors');
  });
});

// ---------------------------------------------------------------------------
// buildContentAnalysisSystemPrompt / buildContentAnalysisUserPrompt
// ---------------------------------------------------------------------------

describe('buildContentAnalysisSystemPrompt', () => {
  it('should return a non-empty system prompt', () => {
    const prompt = buildContentAnalysisSystemPrompt();
    expect(prompt.length).toBeGreaterThan(30);
    expect(prompt).toContain('answerFirstScore');
  });
});

describe('buildContentAnalysisUserPrompt', () => {
  it('should include url and content', () => {
    const prompt = buildContentAnalysisUserPrompt('https://example.com', '# Hello World');
    expect(prompt).toContain('https://example.com');
    expect(prompt).toContain('# Hello World');
  });

  it('should truncate long content', () => {
    const longContent = 'x'.repeat(10000);
    const prompt = buildContentAnalysisUserPrompt('https://example.com', longContent);
    expect(prompt).toContain('[truncated]');
    expect(prompt.length).toBeLessThan(longContent.length);
  });
});

// ---------------------------------------------------------------------------
// LLM Schema Validation
// ---------------------------------------------------------------------------

describe('LLMParsedMentionSchema', () => {
  it('should validate correct data', () => {
    const data = {
      reasoning: 'The brand was mentioned first.',
      brandMentioned: true,
      brandPosition: 1,
      brandSentiment: 'positive' as const,
      brandUrlCited: true,
      citedUrls: ['https://brand.com'],
      competitorMentions: {
        'Comp A': { mentioned: true, position: 2, sentiment: 'neutral' as const },
      },
    };
    expect(() => LLMParsedMentionSchema.parse(data)).not.toThrow();
  });

  it('should reject missing required fields', () => {
    expect(() => LLMParsedMentionSchema.parse({})).toThrow();
  });
});

describe('LLMContentPageAnalysisSchema', () => {
  it('should validate correct data', () => {
    const data = {
      reasoning: 'Good FAQ presence.',
      answerFirstScore: 7,
      faqPresent: true,
      statsCount: 3,
      hasAuthorAttribution: true,
      depthScore: 8,
    };
    expect(() => LLMContentPageAnalysisSchema.parse(data)).not.toThrow();
  });

  it('should reject score out of range', () => {
    expect(() =>
      LLMContentPageAnalysisSchema.parse({
        reasoning: 'test',
        answerFirstScore: 15, // max is 10
        faqPresent: true,
        statsCount: 0,
        hasAuthorAttribution: false,
        depthScore: 5,
      }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// toLLMParsedMention
// ---------------------------------------------------------------------------

describe('toLLMParsedMention', () => {
  it('should strip reasoning and return ParsedMention', () => {
    const llmOutput = {
      reasoning: 'Analysis: brand is mentioned first.',
      brandMentioned: true,
      brandPosition: 1,
      brandSentiment: 'positive' as const,
      brandUrlCited: false,
      citedUrls: ['https://other.com'],
      competitorMentions: {},
    };
    const result = toLLMParsedMention(llmOutput);
    expect(result.brandMentioned).toBe(true);
    expect(result.brandPosition).toBe(1);
    expect((result as any).reasoning).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// toContentPageAnalysis
// ---------------------------------------------------------------------------

describe('toContentPageAnalysis', () => {
  it('should strip reasoning and add url/wordCount', () => {
    const llmOutput = {
      reasoning: 'Good content structure.',
      answerFirstScore: 6,
      faqPresent: true,
      statsCount: 2,
      hasAuthorAttribution: true,
      depthScore: 7,
    };
    const result = toContentPageAnalysis(llmOutput, 'https://example.com/page', 500);
    expect(result.url).toBe('https://example.com/page');
    expect(result.wordCount).toBe(500);
    expect(result.answerFirstScore).toBe(6);
    expect((result as any).reasoning).toBeUndefined();
  });
});
