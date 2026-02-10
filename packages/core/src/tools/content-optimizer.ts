// Owner: S27 (Content Optimizer). Consumer: S12 (Pipeline), S20 (Delivery).
// Takes weak pages identified by content analysis and rewrites them in
// answer-first format with statistics, FAQ sections, and author attribution.
// Uses Claude via Vercel AI SDK generateText() for rewriting — NOT template-based.
// Output is CMS-ready markdown.

import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import type { CrawledPage } from '../contracts/crawl.contract.js';
import type { ContentPageAnalysis } from '../contracts/analysis.contract.js';

// --- Error Class ---

export class ContentOptimizerError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'ContentOptimizerError';
    this.code = code;
  }
}

// --- Options ---

export interface ContentOptimizerOptions {
  /** Target word count for the rewritten page. Defaults based on input length. */
  targetWordCount?: number;
  /** Business name to include in author attribution. */
  businessName?: string;
  /** Author name to include in attribution section. */
  authorName?: string;
  /** Author title/credentials for attribution. */
  authorTitle?: string;
  /** Additional keywords to weave into the content. */
  targetKeywords?: string[];
  /** Geographic area served, for local relevance. */
  areaServed?: string;
  /** Model to use. Defaults to Claude Sonnet for quality rewrites. */
  model?: string;
  /** Temperature for generation. Defaults to 0.4. */
  temperature?: number;
  /** Maximum number of FAQ items to include. Defaults to 5. */
  maxFaqItems?: number;
  /** Whether to include a statistics section. Defaults to true. */
  includeStatistics?: boolean;
  /** Whether to include FAQ section. Defaults to true based on analysis. */
  includeFaq?: boolean;
  /** Whether to include author attribution. Defaults to true. */
  includeAuthorAttribution?: boolean;
}

// --- Result ---

export interface ContentOptimizerResult {
  /** The optimized page content as CMS-ready markdown. */
  optimizedMarkdown: string;
  /** URL of the original page. */
  originalUrl: string;
  /** Summary of changes made. */
  changesSummary: string[];
  /** Original word count. */
  originalWordCount: number;
  /** Optimized word count. */
  optimizedWordCount: number;
  /** Whether FAQ section was added. */
  faqAdded: boolean;
  /** Whether statistics were added. */
  statisticsAdded: boolean;
  /** Whether author attribution was added. */
  authorAttributionAdded: boolean;
}

// --- Constants ---

const SHORT_PAGE_THRESHOLD = 300;
const LONG_PAGE_THRESHOLD = 3000;
const DEFAULT_MAX_FAQ_ITEMS = 5;
const DEFAULT_TEMPERATURE = 0.4;
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const MAX_INPUT_CHARS = 12000;

// --- Vertical Context ---

const VERTICAL_CONTEXT: Record<string, string> = {
  dental: 'dental practice, oral health, dental procedures, patient care',
  legal: 'law firm, legal services, case types, legal processes, client rights',
  hvac: 'HVAC services, heating and cooling, energy efficiency, system maintenance',
  accounting: 'accounting firm, tax preparation, bookkeeping, financial compliance',
  restaurant: 'restaurant, food service, dining experience, menu, catering',
  real_estate: 'real estate agency, home buying and selling, property market, neighborhoods',
  medical: 'medical practice, healthcare services, patient care, conditions and treatments',
  plumbing: 'plumbing services, drain cleaning, pipe repair, water heater, emergency plumbing',
  roofing: 'roofing contractor, roof repair, roof replacement, storm damage, inspections',
  auto_repair: 'auto repair shop, vehicle maintenance, diagnostics, brake and engine services',
  veterinary: 'veterinary clinic, pet health, animal care, vaccinations, emergency vet',
  insurance: 'insurance agency, coverage options, claims process, policy management',
  fitness: 'gym, fitness center, personal training, group classes, memberships',
  salon: 'salon, hair styling, beauty services, skincare, appointments',
};

// --- Page Classification ---

type PageCategory = 'short' | 'long' | 'no_clear_question' | 'standard';

function classifyPage(page: CrawledPage, analysis: ContentPageAnalysis): PageCategory {
  if (analysis.wordCount < SHORT_PAGE_THRESHOLD) {
    return 'short';
  }
  if (analysis.wordCount > LONG_PAGE_THRESHOLD) {
    return 'long';
  }
  // Pages with very low answer-first scores and low depth may lack a clear question
  if (analysis.answerFirstScore <= 2 && analysis.depthScore <= 3) {
    return 'no_clear_question';
  }
  return 'standard';
}

// --- Prompt Builders ---

function buildSystemPrompt(vertical: string): string {
  const verticalContext = VERTICAL_CONTEXT[vertical.toLowerCase()] ?? `${vertical} services and expertise`;

  return `You are an expert content optimizer specializing in GEO (Generative Engine Optimization) for local businesses in the ${verticalContext} space.

Your job is to rewrite web page content so that AI engines (ChatGPT, Perplexity, Gemini) can easily parse, understand, and cite the business in their responses.

## Rewriting Rules

### Answer-First Format (CRITICAL)
- Every section MUST lead with a direct, concise answer in the first sentence
- Follow with supporting details, evidence, and context
- Structure content so AI engines can extract clean, quotable answers
- Use clear headings that mirror natural questions people ask AI engines

### Statistics and Data
- Include specific numbers, percentages, timeframes, and measurements
- Replace vague claims ("we have lots of experience") with concrete data ("serving 2,500+ clients since 2008")
- Add industry-relevant statistics that demonstrate expertise
- Use data to support claims rather than making unsupported assertions

### FAQ Section
- Generate FAQ items as H3 headings with question format
- Each answer uses answer-first format
- Target questions people would ask AI engines about this type of business
- Keep answers to 2-4 sentences each

### Author Attribution
- Add a clear author attribution section at the end
- Include the author's name, title, and brief credential summary
- This helps AI engines verify content authority

### Formatting
- Output clean, CMS-ready markdown
- Use H2 for major sections, H3 for subsections and FAQ items
- Use bullet points and numbered lists for scannable content
- Keep paragraphs to 2-3 sentences maximum
- Include a compelling opening that directly answers what the page is about
- Do NOT include raw HTML, front matter, or metadata blocks

### Tone
- Professional but approachable
- Authoritative without being salesy
- Focus on informing and educating, not selling
- Use the business name naturally 2-3 times (not keyword stuffed)`;
}

function buildUserPromptForStandard(
  page: CrawledPage,
  analysis: ContentPageAnalysis,
  vertical: string,
  options: Required<Pick<ContentOptimizerOptions, 'targetWordCount' | 'maxFaqItems' | 'includeStatistics' | 'includeFaq' | 'includeAuthorAttribution'>>,
  resolvedOptions: ContentOptimizerOptions,
): string {
  const truncatedContent = page.markdown.length > MAX_INPUT_CHARS
    ? page.markdown.slice(0, MAX_INPUT_CHARS) + '\n\n[Content truncated for processing]'
    : page.markdown;

  const parts: string[] = [];

  parts.push('## Page to Optimize');
  parts.push(`URL: ${page.url}`);
  parts.push(`Title: ${page.title ?? 'Untitled'}`);
  parts.push(`Vertical: ${vertical}`);
  parts.push('');

  parts.push('## Current Content Analysis');
  parts.push(`- Answer-First Score: ${analysis.answerFirstScore}/10 (needs improvement if below 7)`);
  parts.push(`- FAQ Present: ${analysis.faqPresent ? 'Yes' : 'No'}`);
  parts.push(`- Statistics Count: ${analysis.statsCount} (aim for 3-5 per page)`);
  parts.push(`- Has Author Attribution: ${analysis.hasAuthorAttribution ? 'Yes' : 'No'}`);
  parts.push(`- Word Count: ${analysis.wordCount}`);
  parts.push(`- Depth Score: ${analysis.depthScore}/10`);
  parts.push('');

  if (resolvedOptions.businessName) {
    parts.push(`Business Name: ${resolvedOptions.businessName}`);
  }
  if (resolvedOptions.areaServed) {
    parts.push(`Area Served: ${resolvedOptions.areaServed}`);
  }
  if (resolvedOptions.targetKeywords && resolvedOptions.targetKeywords.length > 0) {
    parts.push(`Target Keywords: ${resolvedOptions.targetKeywords.join(', ')}`);
  }
  parts.push('');

  parts.push('## Rewrite Instructions');
  parts.push(`Target word count: approximately ${options.targetWordCount} words`);

  const directives: string[] = [];
  directives.push('Rewrite every section in answer-first format');

  if (options.includeStatistics && analysis.statsCount < 3) {
    directives.push('Add relevant statistics and specific data points (at least 3-5 throughout the page)');
  }

  if (options.includeFaq && !analysis.faqPresent) {
    directives.push(`Add a FAQ section with ${options.maxFaqItems} questions relevant to the page topic and vertical`);
  }

  if (options.includeAuthorAttribution && !analysis.hasAuthorAttribution) {
    const authorInfo = resolvedOptions.authorName
      ? `${resolvedOptions.authorName}${resolvedOptions.authorTitle ? `, ${resolvedOptions.authorTitle}` : ''}`
      : 'the business owner or lead professional';
    directives.push(`Add an author attribution section crediting ${authorInfo}`);
  }

  if (analysis.depthScore < 6) {
    directives.push('Increase content depth with more specific details, examples, and explanations');
  }

  for (const directive of directives) {
    parts.push(`- ${directive}`);
  }

  parts.push('');
  parts.push('## Current Page Content');
  parts.push('---');
  parts.push(truncatedContent);
  parts.push('---');
  parts.push('');
  parts.push('Rewrite the content above following all instructions. Output ONLY the optimized markdown content, no commentary or meta-text.');

  return parts.join('\n');
}

function buildUserPromptForShort(
  page: CrawledPage,
  analysis: ContentPageAnalysis,
  vertical: string,
  options: Required<Pick<ContentOptimizerOptions, 'targetWordCount' | 'maxFaqItems' | 'includeStatistics' | 'includeFaq' | 'includeAuthorAttribution'>>,
  resolvedOptions: ContentOptimizerOptions,
): string {
  const parts: string[] = [];

  parts.push('## Page to Expand');
  parts.push(`URL: ${page.url}`);
  parts.push(`Title: ${page.title ?? 'Untitled'}`);
  parts.push(`Vertical: ${vertical}`);
  parts.push('');

  parts.push('## Problem');
  parts.push(`This page has only ${analysis.wordCount} words. It is too thin for AI engines to extract meaningful answers from.`);
  parts.push('');

  if (resolvedOptions.businessName) {
    parts.push(`Business Name: ${resolvedOptions.businessName}`);
  }
  if (resolvedOptions.areaServed) {
    parts.push(`Area Served: ${resolvedOptions.areaServed}`);
  }
  if (resolvedOptions.targetKeywords && resolvedOptions.targetKeywords.length > 0) {
    parts.push(`Target Keywords: ${resolvedOptions.targetKeywords.join(', ')}`);
  }
  parts.push('');

  parts.push('## Expansion Instructions');
  parts.push(`- Expand this page to approximately ${options.targetWordCount} words`);
  parts.push('- Preserve the original topic and intent');
  parts.push('- Use answer-first format for every section');
  parts.push('- Add substantive detail: procedures, processes, timelines, costs (use realistic industry ranges)');

  if (options.includeStatistics) {
    parts.push('- Add at least 3-5 relevant statistics throughout');
  }
  if (options.includeFaq) {
    parts.push(`- Add a FAQ section with ${options.maxFaqItems} questions relevant to the page topic`);
  }
  if (options.includeAuthorAttribution) {
    const authorInfo = resolvedOptions.authorName
      ? `${resolvedOptions.authorName}${resolvedOptions.authorTitle ? `, ${resolvedOptions.authorTitle}` : ''}`
      : 'the business owner or lead professional';
    parts.push(`- Add an author attribution section crediting ${authorInfo}`);
  }

  parts.push('');
  parts.push('## Current Page Content (thin)');
  parts.push('---');
  parts.push(page.markdown);
  parts.push('---');
  parts.push('');
  parts.push('Expand and rewrite the content above following all instructions. Output ONLY the optimized markdown content, no commentary or meta-text.');

  return parts.join('\n');
}

function buildUserPromptForLong(
  page: CrawledPage,
  analysis: ContentPageAnalysis,
  vertical: string,
  options: Required<Pick<ContentOptimizerOptions, 'targetWordCount' | 'maxFaqItems' | 'includeStatistics' | 'includeFaq' | 'includeAuthorAttribution'>>,
  resolvedOptions: ContentOptimizerOptions,
): string {
  const truncatedContent = page.markdown.length > MAX_INPUT_CHARS
    ? page.markdown.slice(0, MAX_INPUT_CHARS) + '\n\n[Content truncated for processing]'
    : page.markdown;

  const parts: string[] = [];

  parts.push('## Long Page to Restructure');
  parts.push(`URL: ${page.url}`);
  parts.push(`Title: ${page.title ?? 'Untitled'}`);
  parts.push(`Vertical: ${vertical}`);
  parts.push('');

  parts.push('## Problem');
  parts.push(`This page has ${analysis.wordCount} words. Long pages often bury key answers and lack the scannable structure AI engines need.`);
  parts.push('');

  if (resolvedOptions.businessName) {
    parts.push(`Business Name: ${resolvedOptions.businessName}`);
  }
  if (resolvedOptions.areaServed) {
    parts.push(`Area Served: ${resolvedOptions.areaServed}`);
  }
  if (resolvedOptions.targetKeywords && resolvedOptions.targetKeywords.length > 0) {
    parts.push(`Target Keywords: ${resolvedOptions.targetKeywords.join(', ')}`);
  }
  parts.push('');

  parts.push('## Restructuring Instructions');
  parts.push(`- Focus on the most important sections; target approximately ${options.targetWordCount} words`);
  parts.push('- Restructure with clear H2/H3 hierarchy');
  parts.push('- Lead every section with answer-first format');
  parts.push('- Move the most valuable information to the top');
  parts.push('- Remove filler, redundancy, and overly promotional language');
  parts.push('- Keep specific details, data points, and unique expertise');

  if (options.includeStatistics && analysis.statsCount < 3) {
    parts.push('- Add statistics where the original had vague claims');
  }
  if (options.includeFaq && !analysis.faqPresent) {
    parts.push(`- Add a concise FAQ section with ${options.maxFaqItems} high-value questions`);
  }
  if (options.includeAuthorAttribution && !analysis.hasAuthorAttribution) {
    const authorInfo = resolvedOptions.authorName
      ? `${resolvedOptions.authorName}${resolvedOptions.authorTitle ? `, ${resolvedOptions.authorTitle}` : ''}`
      : 'the business owner or lead professional';
    parts.push(`- Add an author attribution section crediting ${authorInfo}`);
  }

  parts.push('');
  parts.push('## Current Page Content');
  parts.push('---');
  parts.push(truncatedContent);
  parts.push('---');
  parts.push('');
  parts.push('Restructure and optimize the content above following all instructions. Output ONLY the optimized markdown content, no commentary or meta-text.');

  return parts.join('\n');
}

function buildUserPromptForNoClearQuestion(
  page: CrawledPage,
  analysis: ContentPageAnalysis,
  vertical: string,
  options: Required<Pick<ContentOptimizerOptions, 'targetWordCount' | 'maxFaqItems' | 'includeStatistics' | 'includeFaq' | 'includeAuthorAttribution'>>,
  resolvedOptions: ContentOptimizerOptions,
): string {
  const truncatedContent = page.markdown.length > MAX_INPUT_CHARS
    ? page.markdown.slice(0, MAX_INPUT_CHARS) + '\n\n[Content truncated for processing]'
    : page.markdown;

  const parts: string[] = [];

  parts.push('## Page with No Clear Question to Answer');
  parts.push(`URL: ${page.url}`);
  parts.push(`Title: ${page.title ?? 'Untitled'}`);
  parts.push(`Vertical: ${vertical}`);
  parts.push('');

  parts.push('## Problem');
  parts.push('This page lacks a clear question-answer structure. AI engines struggle to extract useful answers from content that does not address specific user questions.');
  parts.push(`Current scores: answer-first=${analysis.answerFirstScore}/10, depth=${analysis.depthScore}/10`);
  parts.push('');

  if (resolvedOptions.businessName) {
    parts.push(`Business Name: ${resolvedOptions.businessName}`);
  }
  if (resolvedOptions.areaServed) {
    parts.push(`Area Served: ${resolvedOptions.areaServed}`);
  }
  if (resolvedOptions.targetKeywords && resolvedOptions.targetKeywords.length > 0) {
    parts.push(`Target Keywords: ${resolvedOptions.targetKeywords.join(', ')}`);
  }
  parts.push('');

  parts.push('## Reframing Instructions');
  parts.push(`- Target approximately ${options.targetWordCount} words`);
  parts.push('- Identify the implicit topic of this page and reframe it around the questions a potential customer would ask');
  parts.push('- Create clear H2 headings in question format where appropriate');
  parts.push('- Lead every section with a direct answer');
  parts.push('- Preserve any unique information, credentials, or data from the original');

  if (options.includeStatistics) {
    parts.push('- Add at least 3-5 relevant statistics');
  }
  if (options.includeFaq) {
    parts.push(`- Add a FAQ section with ${options.maxFaqItems} questions that clarify the page topic`);
  }
  if (options.includeAuthorAttribution) {
    const authorInfo = resolvedOptions.authorName
      ? `${resolvedOptions.authorName}${resolvedOptions.authorTitle ? `, ${resolvedOptions.authorTitle}` : ''}`
      : 'the business owner or lead professional';
    parts.push(`- Add an author attribution section crediting ${authorInfo}`);
  }

  parts.push('');
  parts.push('## Current Page Content');
  parts.push('---');
  parts.push(truncatedContent);
  parts.push('---');
  parts.push('');
  parts.push('Reframe and optimize the content above following all instructions. Output ONLY the optimized markdown content, no commentary or meta-text.');

  return parts.join('\n');
}

// --- Word Count Utility ---

function countWords(markdown: string): number {
  const stripped = markdown
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/[*_~`]+/g, '')
    .replace(/\|[^|]*\|/g, '')
    .replace(/[-=]{3,}/g, '');
  return stripped.split(/\s+/).filter((w) => w.length > 0).length;
}

// --- Target Word Count Calculation ---

function calculateTargetWordCount(
  pageCategory: PageCategory,
  analysis: ContentPageAnalysis,
  userTarget?: number,
): number {
  if (userTarget !== undefined) {
    return userTarget;
  }

  switch (pageCategory) {
    case 'short':
      // Expand thin pages to a reasonable minimum
      return Math.max(600, analysis.wordCount * 3);
    case 'long':
      // Trim long pages, focusing on key sections
      return Math.min(1500, Math.round(analysis.wordCount * 0.6));
    case 'no_clear_question':
      // Reframe with moderate length
      return Math.max(800, Math.min(1200, analysis.wordCount));
    case 'standard':
      // Standard pages: aim for modest expansion
      return Math.max(600, Math.round(analysis.wordCount * 1.3));
  }
}

// --- Changes Summary Builder ---

function buildChangesSummary(
  pageCategory: PageCategory,
  analysis: ContentPageAnalysis,
  faqAdded: boolean,
  statsAdded: boolean,
  authorAdded: boolean,
): string[] {
  const changes: string[] = [];

  changes.push('Rewrote content in answer-first format');

  switch (pageCategory) {
    case 'short':
      changes.push(`Expanded thin page (${analysis.wordCount} words) with substantive detail`);
      break;
    case 'long':
      changes.push(`Restructured long page (${analysis.wordCount} words), prioritizing key content`);
      break;
    case 'no_clear_question':
      changes.push('Reframed content around customer questions for AI engine parsability');
      break;
    case 'standard':
      changes.push('Optimized content structure for AI engine extraction');
      break;
  }

  if (statsAdded) {
    changes.push('Added statistics and specific data points');
  }
  if (faqAdded) {
    changes.push('Added FAQ section with answer-first format');
  }
  if (authorAdded) {
    changes.push('Added author attribution section');
  }

  if (analysis.answerFirstScore < 5) {
    changes.push(`Improved answer-first format (was ${analysis.answerFirstScore}/10)`);
  }
  if (analysis.depthScore < 5) {
    changes.push(`Increased content depth (was ${analysis.depthScore}/10)`);
  }

  return changes;
}

// --- Main Function ---

/**
 * Optimizes a weak page by rewriting it in answer-first format with statistics,
 * FAQ sections, and author attribution. Uses Claude via Vercel AI SDK generateText()
 * for intelligent rewriting -- not template-based.
 *
 * Handles three special cases:
 * - Very short pages (< 300 words): expanded with substantive detail
 * - Very long pages (> 3000 words): restructured to focus on key sections
 * - Pages with no clear question: reframed around customer questions
 *
 * @param page - The crawled page data including markdown content
 * @param analysis - The content analysis results for this page
 * @param vertical - The business vertical (e.g., "dental", "legal", "hvac")
 * @param options - Optional configuration for the optimization
 * @returns Optimized markdown content with metadata
 */
export async function optimizeContent(
  page: CrawledPage,
  analysis: ContentPageAnalysis,
  vertical: string,
  options?: ContentOptimizerOptions,
): Promise<ContentOptimizerResult> {
  const resolvedOptions = options ?? {};

  // Validate inputs
  if (!page.markdown || page.markdown.trim().length === 0) {
    throw new ContentOptimizerError(
      `Page ${page.url} has no markdown content to optimize`,
      'EMPTY_CONTENT',
    );
  }

  if (!vertical || vertical.trim().length === 0) {
    throw new ContentOptimizerError(
      'Vertical is required for content optimization',
      'MISSING_VERTICAL',
    );
  }

  // Classify the page
  const pageCategory = classifyPage(page, analysis);

  // Resolve feature flags
  const includeFaq = resolvedOptions.includeFaq ?? !analysis.faqPresent;
  const includeStatistics = resolvedOptions.includeStatistics ?? (analysis.statsCount < 3);
  const includeAuthorAttribution = resolvedOptions.includeAuthorAttribution ?? !analysis.hasAuthorAttribution;
  const maxFaqItems = resolvedOptions.maxFaqItems ?? DEFAULT_MAX_FAQ_ITEMS;

  // Calculate target word count
  const targetWordCount = calculateTargetWordCount(
    pageCategory,
    analysis,
    resolvedOptions.targetWordCount,
  );

  // Build the appropriate prompt based on page category
  const coreOptions = {
    targetWordCount,
    maxFaqItems,
    includeStatistics,
    includeFaq,
    includeAuthorAttribution,
  };

  let userPrompt: string;
  switch (pageCategory) {
    case 'short':
      userPrompt = buildUserPromptForShort(page, analysis, vertical, coreOptions, resolvedOptions);
      break;
    case 'long':
      userPrompt = buildUserPromptForLong(page, analysis, vertical, coreOptions, resolvedOptions);
      break;
    case 'no_clear_question':
      userPrompt = buildUserPromptForNoClearQuestion(page, analysis, vertical, coreOptions, resolvedOptions);
      break;
    case 'standard':
      userPrompt = buildUserPromptForStandard(page, analysis, vertical, coreOptions, resolvedOptions);
      break;
  }

  // Call Claude via AI SDK generateText()
  const modelId = resolvedOptions.model ?? DEFAULT_MODEL;
  const temperature = resolvedOptions.temperature ?? DEFAULT_TEMPERATURE;

  let optimizedMarkdown: string;
  try {
    const result = await generateText({
      model: anthropic(modelId),
      system: buildSystemPrompt(vertical),
      prompt: userPrompt,
      temperature,
      maxOutputTokens: 4096,
    });

    optimizedMarkdown = result.text.trim();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ContentOptimizerError(
      `Failed to generate optimized content for ${page.url}: ${message}`,
      'LLM_GENERATION_FAILED',
    );
  }

  // Validate output is not empty
  if (optimizedMarkdown.length === 0) {
    throw new ContentOptimizerError(
      `LLM returned empty content for ${page.url}`,
      'EMPTY_LLM_RESPONSE',
    );
  }

  // Calculate metrics
  const optimizedWordCount = countWords(optimizedMarkdown);
  const faqAdded = includeFaq && !analysis.faqPresent;
  const statsAdded = includeStatistics && analysis.statsCount < 3;
  const authorAdded = includeAuthorAttribution && !analysis.hasAuthorAttribution;

  const changesSummary = buildChangesSummary(
    pageCategory,
    analysis,
    faqAdded,
    statsAdded,
    authorAdded,
  );

  return {
    optimizedMarkdown,
    originalUrl: page.url,
    changesSummary,
    originalWordCount: analysis.wordCount,
    optimizedWordCount,
    faqAdded,
    statisticsAdded: statsAdded,
    authorAttributionAdded: authorAdded,
  };
}

/**
 * Batch-optimizes multiple pages. Uses sequential processing to respect API rate limits.
 * Skips pages that fail and includes them in the errors array.
 *
 * @param pages - Array of page + analysis pairs to optimize
 * @param vertical - The business vertical
 * @param options - Optional configuration applied to all pages
 * @returns Array of results and errors
 */
export async function optimizeContentBatch(
  pages: Array<{ page: CrawledPage; analysis: ContentPageAnalysis }>,
  vertical: string,
  options?: ContentOptimizerOptions,
): Promise<{
  results: ContentOptimizerResult[];
  errors: Array<{ url: string; error: string }>;
}> {
  const results: ContentOptimizerResult[] = [];
  const errors: Array<{ url: string; error: string }> = [];

  for (const { page, analysis } of pages) {
    try {
      const result = await optimizeContent(page, analysis, vertical, options);
      results.push(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push({ url: page.url, error: message });
    }
  }

  return { results, errors };
}

/**
 * Identifies which pages from a content analysis most need optimization,
 * sorted by priority (worst pages first).
 *
 * Priority is determined by a composite weakness score considering:
 * - Low answer-first score (weighted heaviest)
 * - Missing FAQ
 * - Low statistics count
 * - Missing author attribution
 * - Low depth score
 *
 * @param pages - Array of page + analysis pairs
 * @param maxPages - Maximum number of pages to return. Defaults to 5.
 * @returns Sorted array of pages most needing optimization
 */
export function prioritizePagesForOptimization(
  pages: Array<{ page: CrawledPage; analysis: ContentPageAnalysis }>,
  maxPages: number = 5,
): Array<{ page: CrawledPage; analysis: ContentPageAnalysis; weaknessScore: number }> {
  const scored = pages.map(({ page, analysis }) => {
    // Higher weakness score = more in need of optimization
    let weaknessScore = 0;

    // Answer-first score: max contribution 40 (score 0/10 = 40 points weakness)
    weaknessScore += (10 - analysis.answerFirstScore) * 4;

    // Missing FAQ: 15 points weakness
    if (!analysis.faqPresent) {
      weaknessScore += 15;
    }

    // Low statistics: max contribution 15 (0 stats = 15 points)
    weaknessScore += Math.min(15, Math.max(0, (3 - analysis.statsCount) * 5));

    // Missing author attribution: 10 points weakness
    if (!analysis.hasAuthorAttribution) {
      weaknessScore += 10;
    }

    // Depth score: max contribution 20 (score 0/10 = 20 points weakness)
    weaknessScore += (10 - analysis.depthScore) * 2;

    return { page, analysis, weaknessScore };
  });

  // Sort by weakness score descending (worst pages first)
  scored.sort((a, b) => b.weaknessScore - a.weaknessScore);

  return scored.slice(0, maxPages);
}
