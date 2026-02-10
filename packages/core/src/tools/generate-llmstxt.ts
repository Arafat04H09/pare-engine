// Owner: S18 (Implementation Engine). Consumer: S12 (Pipeline), S20 (Delivery).
// Generates a copy-paste-ready llms.txt file based on crawl data and business info.
// Uses Claude Haiku via Vercel AI SDK generateText() for intelligent content summarization.
// Follows the llms.txt specification: https://llmstxt.org/

import { z } from 'zod';
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import type { CrawlOutput } from '../contracts/crawl.contract.js';

// --- Error Class ---

export class LlmsTxtGenerationError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'LlmsTxtGenerationError';
    this.code = code;
  }
}

// --- Business Data Input ---

export interface LlmsTxtBusinessData {
  name: string;
  domain: string;
  vertical: string;
  description?: string;
  tagline?: string;
  servicesOffered?: string[];
  areaServed?: string[];
  contactEmail?: string;
  contactPhone?: string;
}

// --- Zod Schemas for LLM Output ---

const PageSummarySchema = z.object({
  url: z.string(),
  title: z.string(),
  summary: z.string().describe('1-2 sentence summary of the page content for LLM context'),
  category: z.enum(['about', 'services', 'contact', 'blog', 'faq', 'legal', 'other']),
});

const LlmsTxtStructureSchema = z.object({
  title: z.string().describe('Business name with tagline'),
  description: z.string().describe('2-3 sentence description of the business for LLM context'),
  sections: z.array(z.object({
    heading: z.string().describe('Section heading (e.g., "Services", "About", "Contact")'),
    content: z.string().describe('Brief markdown content for this section'),
    links: z.array(z.object({
      title: z.string(),
      url: z.string(),
      description: z.string().describe('Brief description of what the link covers'),
    })),
  })),
  pageSummaries: z.array(PageSummarySchema),
});

type LlmsTxtStructure = z.infer<typeof LlmsTxtStructureSchema>;

// --- Prompt Builders ---

function buildSystemPrompt(): string {
  return `You are an expert at creating llms.txt files following the llms.txt specification (llmstxt.org).

The llms.txt file helps AI language models understand a website's content, structure, and purpose.

Format rules:
- The file is markdown
- Start with an H1 heading: the business name
- Follow with a blockquote description of the business
- Organize content into H2 sections
- Each section can have prose content and/or a list of links
- Links use the format: - [Title](URL): Description
- Keep descriptions concise but informative
- Focus on information that helps AI engines accurately represent the business
- Include key services, areas served, and differentiators
- Include contact information
- Order sections by importance: About > Services > Areas Served > FAQ > Contact > Blog > Legal

The goal is to help AI engines provide accurate, up-to-date information about this business when users ask about it.`;
}

function buildUserPrompt(crawlData: CrawlOutput, businessData: LlmsTxtBusinessData): string {
  const parts: string[] = [];

  parts.push(`Business: ${businessData.name}`);
  parts.push(`Domain: ${businessData.domain}`);
  parts.push(`Vertical: ${businessData.vertical}`);

  if (businessData.description) {
    parts.push(`Description: ${businessData.description}`);
  }

  if (businessData.tagline) {
    parts.push(`Tagline: ${businessData.tagline}`);
  }

  if (businessData.servicesOffered && businessData.servicesOffered.length > 0) {
    parts.push(`Services: ${businessData.servicesOffered.join(', ')}`);
  }

  if (businessData.areaServed && businessData.areaServed.length > 0) {
    parts.push(`Areas Served: ${businessData.areaServed.join(', ')}`);
  }

  if (businessData.contactEmail) {
    parts.push(`Email: ${businessData.contactEmail}`);
  }

  if (businessData.contactPhone) {
    parts.push(`Phone: ${businessData.contactPhone}`);
  }

  parts.push('');
  parts.push(`Crawled ${crawlData.pages.length} pages from ${crawlData.domain}:`);
  parts.push('');

  // Provide page content summaries for the LLM to work with
  for (const page of crawlData.pages) {
    parts.push(`--- Page: ${page.url} ---`);
    if (page.title) {
      parts.push(`Title: ${page.title}`);
    }
    // Truncate markdown to keep within context limits
    const truncated = page.markdown.length > 2000
      ? page.markdown.slice(0, 2000) + '\n[truncated]'
      : page.markdown;
    parts.push(truncated);
    parts.push('');
  }

  parts.push('Generate a structured llms.txt file for this business based on the crawled content.');
  parts.push('Categorize pages and create meaningful sections with accurate summaries.');

  return parts.join('\n');
}

// --- Main Generator ---

export async function generateLlmsTxt(
  crawlData: CrawlOutput,
  businessData: LlmsTxtBusinessData,
): Promise<string> {
  if (crawlData.pages.length === 0) {
    throw new LlmsTxtGenerationError(
      'No crawled pages available to generate llms.txt',
      'NO_PAGES',
    );
  }

  let structure: LlmsTxtStructure;
  try {
    const response = await generateObject({
      model: anthropic('claude-sonnet-4-20250514'),
      schema: LlmsTxtStructureSchema,
      system: buildSystemPrompt(),
      prompt: buildUserPrompt(crawlData, businessData),
      temperature: 0.3,
    });
    structure = response.object;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new LlmsTxtGenerationError(
      `Failed to generate llms.txt structure via LLM: ${message}`,
      'LLM_GENERATION_FAILED',
    );
  }

  return formatLlmsTxt(structure, businessData);
}

// --- Also Generate llms-full.txt ---

export async function generateLlmsFullTxt(
  crawlData: CrawlOutput,
  businessData: LlmsTxtBusinessData,
): Promise<string> {
  if (crawlData.pages.length === 0) {
    throw new LlmsTxtGenerationError(
      'No crawled pages available to generate llms-full.txt',
      'NO_PAGES',
    );
  }

  // llms-full.txt includes expanded content for each page
  const llmsTxt = await generateLlmsTxt(crawlData, businessData);

  const fullSections: string[] = [llmsTxt];
  fullSections.push('');
  fullSections.push('---');
  fullSections.push('');
  fullSections.push('## Full Page Content');
  fullSections.push('');

  for (const page of crawlData.pages) {
    fullSections.push(`### ${page.title || page.url}`);
    fullSections.push(`URL: ${page.url}`);
    fullSections.push('');
    // Include full markdown content (not truncated)
    fullSections.push(page.markdown);
    fullSections.push('');
    fullSections.push('---');
    fullSections.push('');
  }

  return fullSections.join('\n');
}

// --- Output Formatter ---

function formatLlmsTxt(structure: LlmsTxtStructure, businessData: LlmsTxtBusinessData): string {
  const lines: string[] = [];

  // H1: Business name
  lines.push(`# ${structure.title}`);
  lines.push('');

  // Blockquote description
  const descriptionLines = structure.description.split('\n');
  for (const line of descriptionLines) {
    lines.push(`> ${line}`);
  }
  lines.push('');

  // Sections
  for (const section of structure.sections) {
    lines.push(`## ${section.heading}`);
    lines.push('');

    if (section.content.trim().length > 0) {
      lines.push(section.content);
      lines.push('');
    }

    if (section.links.length > 0) {
      for (const link of section.links) {
        const url = ensureAbsoluteUrl(link.url, businessData.domain);
        lines.push(`- [${link.title}](${url}): ${link.description}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

function ensureAbsoluteUrl(url: string, domain: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const base = domain.startsWith('http') ? domain : `https://${domain}`;
  const separator = url.startsWith('/') ? '' : '/';
  return `${base}${separator}${url}`;
}
