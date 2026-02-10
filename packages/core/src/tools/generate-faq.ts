// Owner: S18 (Implementation Engine). Consumer: S12 (Pipeline), S20 (Delivery).
// Generates copy-paste-ready FAQ content as HTML + markdown based on content analysis.
// Uses Claude Haiku via Vercel AI SDK generateObject() with Zod schemas for structured output.
// Output includes both FAQ page content and FAQPage JSON-LD schema markup.

import { z } from 'zod';
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import type { ContentAnalysisOutput } from '../contracts/analysis.contract.js';

// --- Error Class ---

export class FaqGenerationError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'FaqGenerationError';
    this.code = code;
  }
}

// --- Business Data Input ---

export interface FaqBusinessData {
  name: string;
  domain: string;
  vertical: string;
  description?: string;
  servicesOffered?: string[];
  areaServed?: string[];
  targetKeywords?: string[];
}

// --- Vertical-Specific FAQ Templates ---

const VERTICAL_FAQ_TOPICS: Record<string, string[]> = {
  dental: [
    'common dental procedures and costs',
    'dental insurance and payment options',
    'emergency dental care availability',
    'cosmetic dentistry options',
    'pediatric dental care',
    'dental hygiene and prevention',
  ],
  legal: [
    'types of cases handled',
    'consultation process and fees',
    'case timeline expectations',
    'payment plans and contingency fees',
    'what to bring to first consultation',
    'jurisdiction and practice areas',
  ],
  hvac: [
    'common HVAC problems and solutions',
    'maintenance schedules and plans',
    'energy efficiency and cost savings',
    'emergency repair availability',
    'new system installation process',
    'warranty and service guarantees',
  ],
  accounting: [
    'tax preparation services and deadlines',
    'bookkeeping and payroll services',
    'business formation and compliance',
    'audit preparation and support',
    'pricing and engagement models',
    'industry-specific expertise',
  ],
  restaurant: [
    'menu and dietary accommodations',
    'reservation and group dining',
    'catering and private events',
    'delivery and takeout options',
    'food sourcing and quality',
    'hours and location details',
  ],
  real_estate: [
    'buying process and timeline',
    'selling strategy and pricing',
    'market conditions and trends',
    'mortgage and financing guidance',
    'property types and specializations',
    'commission and fees structure',
  ],
  medical: [
    'conditions treated and specialties',
    'insurance and payment options',
    'appointment scheduling process',
    'telehealth availability',
    'patient preparation instructions',
    'emergency care protocols',
  ],
};

const DEFAULT_FAQ_TOPICS = [
  'services offered and specializations',
  'pricing and payment options',
  'service area and availability',
  'experience and qualifications',
  'scheduling and contact process',
  'guarantees and customer satisfaction',
];

// --- Zod Schemas for LLM Output ---

const FaqItemSchema = z.object({
  question: z.string().describe('A natural, search-friendly question a potential customer would ask'),
  answer: z.string().describe('A comprehensive, answer-first response (2-4 sentences). Lead with the direct answer, then elaborate.'),
  category: z.string().describe('Category grouping for the FAQ item'),
});

const FaqOutputSchema = z.object({
  faqs: z.array(FaqItemSchema).min(5).max(20).describe('Array of FAQ items, ordered by importance'),
  categories: z.array(z.string()).describe('Ordered list of FAQ categories used'),
  seoTitle: z.string().describe('SEO-optimized page title for the FAQ page'),
  seoDescription: z.string().describe('Meta description for the FAQ page (under 160 chars)'),
});

type FaqOutput = z.infer<typeof FaqOutputSchema>;

// --- Prompt Builders ---

function buildSystemPrompt(): string {
  return `You are an expert in GEO (Generative Engine Optimization) and local business FAQ content creation.

Your job is to generate FAQ content that:
1. Uses ANSWER-FIRST format: every answer starts with a direct, concise answer before elaborating
2. Targets real search queries potential customers would ask AI engines
3. Includes specific, factual information (not generic filler)
4. Uses natural language that AI engines can easily parse and cite
5. Covers the most important topics for the business vertical
6. Groups FAQs into logical categories

Answer format rules:
- Lead with the direct answer in the first sentence
- Follow with 1-3 sentences of supporting detail
- Include specific numbers, timeframes, or details where appropriate
- Use the business name naturally in answers
- Write at a reading level accessible to general consumers
- Avoid jargon unless defining it

For questions: use natural phrasing that mirrors how people ask AI engines (e.g., "What does a root canal cost?" not "Root Canal Pricing Information")`;
}

function buildUserPrompt(
  contentAnalysis: ContentAnalysisOutput,
  vertical: string,
  businessData: FaqBusinessData,
): string {
  const parts: string[] = [];

  parts.push(`Business: ${businessData.name}`);
  parts.push(`Domain: ${businessData.domain}`);
  parts.push(`Vertical: ${vertical}`);

  if (businessData.description) {
    parts.push(`Description: ${businessData.description}`);
  }

  if (businessData.servicesOffered && businessData.servicesOffered.length > 0) {
    parts.push(`Services Offered: ${businessData.servicesOffered.join(', ')}`);
  }

  if (businessData.areaServed && businessData.areaServed.length > 0) {
    parts.push(`Areas Served: ${businessData.areaServed.join(', ')}`);
  }

  if (businessData.targetKeywords && businessData.targetKeywords.length > 0) {
    parts.push(`Target Keywords: ${businessData.targetKeywords.join(', ')}`);
  }

  // Content analysis context
  parts.push('');
  parts.push('--- Content Analysis Summary ---');
  parts.push(`Pages analyzed: ${contentAnalysis.pages.length}`);
  parts.push(`Average answer-first score: ${contentAnalysis.averageAnswerFirstScore.toFixed(1)}/10`);
  parts.push(`FAQ pages found: ${contentAnalysis.faqPageCount}`);
  parts.push(`Average stats density: ${contentAnalysis.averageStatsDensity.toFixed(1)}`);
  parts.push(`Author attribution rate: ${(contentAnalysis.authorAttributionRate * 100).toFixed(0)}%`);

  // Include page-level data to give the LLM context on existing content
  if (contentAnalysis.pages.length > 0) {
    parts.push('');
    parts.push('--- Existing Page Topics ---');
    for (const page of contentAnalysis.pages.slice(0, 10)) {
      const faqNote = page.faqPresent ? ' [HAS FAQ]' : '';
      parts.push(`- ${page.url} (answer-first: ${page.answerFirstScore}/10, depth: ${page.depthScore}/10)${faqNote}`);
    }
  }

  // Vertical-specific topic guidance
  const topics = VERTICAL_FAQ_TOPICS[vertical.toLowerCase()] ?? DEFAULT_FAQ_TOPICS;
  parts.push('');
  parts.push('--- Recommended FAQ Topics for this Vertical ---');
  for (const topic of topics) {
    parts.push(`- ${topic}`);
  }

  parts.push('');
  parts.push(`Generate 10-15 FAQ items for ${businessData.name}.`);
  parts.push('Prioritize topics NOT already covered on the existing website.');
  parts.push('Every answer MUST use answer-first format: direct answer in the first sentence.');

  return parts.join('\n');
}

// --- Main Generator ---

export async function generateFaq(
  contentAnalysis: ContentAnalysisOutput,
  vertical: string,
  businessData: FaqBusinessData,
): Promise<string> {
  let faqOutput: FaqOutput;
  try {
    const response = await generateObject({
      model: anthropic('claude-sonnet-4-20250514'),
      schema: FaqOutputSchema,
      system: buildSystemPrompt(),
      prompt: buildUserPrompt(contentAnalysis, vertical, businessData),
      temperature: 0.4,
    });
    faqOutput = response.object;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new FaqGenerationError(
      `Failed to generate FAQ content via LLM: ${message}`,
      'LLM_GENERATION_FAILED',
    );
  }

  const markdownOutput = formatFaqMarkdown(faqOutput, businessData);
  const htmlOutput = formatFaqHtml(faqOutput, businessData);
  const jsonLdOutput = formatFaqJsonLd(faqOutput);

  return assembleFaqDeliverable(markdownOutput, htmlOutput, jsonLdOutput, faqOutput, businessData);
}

// --- Output Formatters ---

function formatFaqMarkdown(faqOutput: FaqOutput, businessData: FaqBusinessData): string {
  const lines: string[] = [];

  lines.push(`# Frequently Asked Questions — ${businessData.name}`);
  lines.push('');

  let currentCategory = '';
  for (const faq of faqOutput.faqs) {
    if (faq.category !== currentCategory) {
      currentCategory = faq.category;
      lines.push(`## ${currentCategory}`);
      lines.push('');
    }

    lines.push(`### ${faq.question}`);
    lines.push('');
    lines.push(faq.answer);
    lines.push('');
  }

  return lines.join('\n');
}

function formatFaqHtml(faqOutput: FaqOutput, businessData: FaqBusinessData): string {
  const lines: string[] = [];

  lines.push(`<section class="faq-section" itemscope itemtype="https://schema.org/FAQPage">`);
  lines.push(`  <h1>Frequently Asked Questions &mdash; ${escapeHtml(businessData.name)}</h1>`);
  lines.push('');

  let currentCategory = '';
  for (const faq of faqOutput.faqs) {
    if (faq.category !== currentCategory) {
      if (currentCategory !== '') {
        lines.push('  </div>');
        lines.push('');
      }
      currentCategory = faq.category;
      lines.push(`  <div class="faq-category">`);
      lines.push(`    <h2>${escapeHtml(currentCategory)}</h2>`);
    }

    lines.push(`    <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">`);
    lines.push(`      <h3 itemprop="name">${escapeHtml(faq.question)}</h3>`);
    lines.push(`      <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">`);
    lines.push(`        <p itemprop="text">${escapeHtml(faq.answer)}</p>`);
    lines.push('      </div>');
    lines.push('    </div>');
    lines.push('');
  }

  if (currentCategory !== '') {
    lines.push('  </div>');
  }

  lines.push('</section>');

  return lines.join('\n');
}

function formatFaqJsonLd(faqOutput: FaqOutput): string {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqOutput.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return JSON.stringify(faqJsonLd, null, 2);
}

function assembleFaqDeliverable(
  markdown: string,
  html: string,
  jsonLd: string,
  faqOutput: FaqOutput,
  businessData: FaqBusinessData,
): string {
  const lines: string[] = [];

  lines.push(`# FAQ Generator Output`);
  lines.push(`## Business: ${businessData.name} (${businessData.domain})`);
  lines.push(`## Vertical: ${businessData.vertical}`);
  lines.push('');
  lines.push(`Generated ${faqOutput.faqs.length} FAQ items across ${faqOutput.categories.length} categories.`);
  lines.push('');

  lines.push('---');
  lines.push('');

  // SEO metadata
  lines.push('## SEO Metadata');
  lines.push('');
  lines.push(`**Page Title:** ${faqOutput.seoTitle}`);
  lines.push('');
  lines.push(`**Meta Description:** ${faqOutput.seoDescription}`);
  lines.push('');

  lines.push('---');
  lines.push('');

  // Section 1: Markdown version (for CMS)
  lines.push('## Option 1: Markdown (for CMS or blog)');
  lines.push('');
  lines.push('Copy the content below into your CMS or blog post editor:');
  lines.push('');
  lines.push('````markdown');
  lines.push(markdown);
  lines.push('````');
  lines.push('');

  lines.push('---');
  lines.push('');

  // Section 2: HTML version (with Microdata)
  lines.push('## Option 2: HTML with Microdata (for custom pages)');
  lines.push('');
  lines.push('Copy the HTML below into your page template. Includes schema.org Microdata for search engines:');
  lines.push('');
  lines.push('```html');
  lines.push(html);
  lines.push('```');
  lines.push('');

  lines.push('---');
  lines.push('');

  // Section 3: FAQPage JSON-LD
  lines.push('## FAQPage JSON-LD Schema');
  lines.push('');
  lines.push('Add this to your page\'s `<head>` section for FAQPage structured data:');
  lines.push('');
  lines.push('```html');
  lines.push('<script type="application/ld+json">');
  lines.push(jsonLd);
  lines.push('</script>');
  lines.push('```');
  lines.push('');

  lines.push('---');
  lines.push('');
  lines.push('*Generated by Pare Engine. Review and customize answers with your specific business details before publishing.*');

  return lines.join('\n');
}

// --- Utilities ---

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
