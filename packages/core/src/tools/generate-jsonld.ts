// Owner: S18 (Implementation Engine). Consumer: S12 (Pipeline), S20 (Delivery).
// Generates copy-paste-ready JSON-LD structured data based on schema analysis gaps.
// Uses Claude Haiku via Vercel AI SDK generateObject() for intelligent schema generation.

import { z } from 'zod';
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import type { SchemaAnalysisOutput } from '../contracts/analysis.contract.js';
import { getRequiredSchemaTypes, getRecommendedSchemaTypes } from './parse-jsonld.js';

// --- Error Class ---

export class JsonLdGenerationError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'JsonLdGenerationError';
    this.code = code;
  }
}

// --- Business Data Input ---

export interface BusinessData {
  name: string;
  domain: string;
  vertical: string;
  description?: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  phone?: string;
  email?: string;
  openingHours?: string[];
  priceRange?: string;
  servicesOffered?: string[];
  foundingDate?: string;
  founders?: string[];
  areaServed?: string[];
  logo?: string;
  image?: string;
  sameAs?: string[];
  rating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

// --- Zod Schemas for LLM Output ---

const JsonLdBlockSchema = z.object({
  reasoning: z.string().describe('Why this schema type is needed and what it covers'),
  schemaType: z.string().describe('The primary @type of this JSON-LD block'),
  jsonLd: z.string().describe('Complete, valid JSON-LD string ready to embed in a <script> tag'),
});

const JsonLdOutputSchema = z.object({
  blocks: z.array(JsonLdBlockSchema).describe('Array of JSON-LD blocks to add to the site'),
  implementationNotes: z.string().describe('Brief notes for the client on where to place each block'),
});

type JsonLdOutput = z.infer<typeof JsonLdOutputSchema>;

// --- Prompt Builders ---

function buildSystemPrompt(): string {
  return `You are an expert in schema.org structured data and JSON-LD markup for local businesses.
Your job is to generate complete, valid JSON-LD blocks that a client can copy-paste into their website's <head> section.

Rules:
- Every block MUST have @context set to "https://schema.org"
- Every block MUST have a valid @type
- Use real business data provided; do NOT invent fake data
- For fields where data is not provided, use placeholder text clearly marked as "[REPLACE: description of what goes here]"
- Generate interconnected schema graphs where possible (e.g., Organization references LocalBusiness, Service references provider)
- Always include @id properties for entities that are referenced by other blocks
- For FAQPage schema, generate 3-5 realistic FAQ questions based on the business vertical
- JSON must be valid and parseable — no trailing commas, no comments
- Each jsonLd field must be a complete, standalone JSON-LD script content (not wrapped in <script> tags)`;
}

function buildUserPrompt(
  analysis: SchemaAnalysisOutput,
  businessData: BusinessData,
  missingRequired: string[],
  missingRecommended: string[],
): string {
  const parts: string[] = [];

  parts.push(`Business Name: ${businessData.name}`);
  parts.push(`Domain: ${businessData.domain}`);
  parts.push(`Vertical: ${businessData.vertical}`);

  if (businessData.description) {
    parts.push(`Description: ${businessData.description}`);
  }

  if (businessData.address) {
    const addr = businessData.address;
    parts.push(`Address: ${addr.streetAddress}, ${addr.addressLocality}, ${addr.addressRegion} ${addr.postalCode}, ${addr.addressCountry}`);
  }

  if (businessData.phone) {
    parts.push(`Phone: ${businessData.phone}`);
  }

  if (businessData.email) {
    parts.push(`Email: ${businessData.email}`);
  }

  if (businessData.servicesOffered && businessData.servicesOffered.length > 0) {
    parts.push(`Services: ${businessData.servicesOffered.join(', ')}`);
  }

  if (businessData.areaServed && businessData.areaServed.length > 0) {
    parts.push(`Areas Served: ${businessData.areaServed.join(', ')}`);
  }

  if (businessData.openingHours && businessData.openingHours.length > 0) {
    parts.push(`Opening Hours: ${businessData.openingHours.join('; ')}`);
  }

  if (businessData.priceRange) {
    parts.push(`Price Range: ${businessData.priceRange}`);
  }

  if (businessData.rating) {
    parts.push(`Rating: ${businessData.rating.ratingValue}/5 (${businessData.rating.reviewCount} reviews)`);
  }

  if (businessData.sameAs && businessData.sameAs.length > 0) {
    parts.push(`Social Profiles: ${businessData.sameAs.join(', ')}`);
  }

  parts.push('');
  parts.push(`Currently present schema types: ${analysis.allPresentTypes.length > 0 ? analysis.allPresentTypes.join(', ') : 'NONE'}`);
  parts.push(`Missing REQUIRED types to generate: ${missingRequired.length > 0 ? missingRequired.join(', ') : 'None — all required types present'}`);
  parts.push(`Missing RECOMMENDED types to generate: ${missingRecommended.length > 0 ? missingRecommended.join(', ') : 'None'}`);

  if (analysis.totalValidationErrors > 0) {
    parts.push('');
    parts.push(`There are ${analysis.totalValidationErrors} validation error(s) in existing schema. Generate corrected versions where applicable.`);
  }

  parts.push('');
  parts.push('Generate JSON-LD blocks for ALL missing required types first, then missing recommended types.');
  parts.push('If there are no missing types, generate improved/corrected versions of the existing schema based on best practices for the vertical.');

  return parts.join('\n');
}

// --- Main Generator ---

export async function generateJsonLd(
  analysis: SchemaAnalysisOutput,
  businessData: BusinessData,
): Promise<string> {
  const presentTypesSet = new Set(analysis.allPresentTypes);
  const requiredTypes = getRequiredSchemaTypes(analysis.vertical);
  const recommendedTypes = getRecommendedSchemaTypes();

  const missingRequired = requiredTypes.filter((t) => !presentTypesSet.has(t));
  const missingRecommended = recommendedTypes.filter((t) => !presentTypesSet.has(t));

  // If nothing is missing and no validation errors, still generate best-practice schema
  const hasMissing = missingRequired.length > 0 || missingRecommended.length > 0;
  const hasErrors = analysis.totalValidationErrors > 0;

  if (!hasMissing && !hasErrors && analysis.allPresentTypes.length > 0) {
    return formatNoChangesNeeded(analysis, businessData);
  }

  let result: JsonLdOutput;
  try {
    const response = await generateObject({
      model: anthropic('claude-sonnet-4-20250514'),
      schema: JsonLdOutputSchema,
      system: buildSystemPrompt(),
      prompt: buildUserPrompt(analysis, businessData, missingRequired, missingRecommended),
      temperature: 0.3,
    });
    result = response.object;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new JsonLdGenerationError(
      `Failed to generate JSON-LD via LLM: ${message}`,
      'LLM_GENERATION_FAILED',
    );
  }

  // Validate each generated block is valid JSON
  const validatedBlocks: Array<{ schemaType: string; jsonLd: string; reasoning: string }> = [];
  for (const block of result.blocks) {
    try {
      const parsed = JSON.parse(block.jsonLd) as unknown;
      // Re-stringify for consistent formatting
      validatedBlocks.push({
        schemaType: block.schemaType,
        jsonLd: JSON.stringify(parsed, null, 2),
        reasoning: block.reasoning,
      });
    } catch {
      // If the LLM produced invalid JSON, wrap in an error note
      validatedBlocks.push({
        schemaType: block.schemaType,
        jsonLd: `/* WARNING: LLM generated invalid JSON for this block. Manual fix needed. */\n${block.jsonLd}`,
        reasoning: block.reasoning,
      });
    }
  }

  return formatOutput(validatedBlocks, result.implementationNotes, businessData, missingRequired, missingRecommended);
}

// --- Output Formatters ---

function formatNoChangesNeeded(analysis: SchemaAnalysisOutput, businessData: BusinessData): string {
  const lines: string[] = [];
  lines.push(`# JSON-LD Schema Report for ${businessData.name}`);
  lines.push('');
  lines.push('## Status: All Required Schema Types Present');
  lines.push('');
  lines.push(`Your website already has all required schema types for the **${businessData.vertical}** vertical:`);
  lines.push('');
  for (const type of analysis.allPresentTypes) {
    lines.push(`- ${type}`);
  }
  lines.push('');
  lines.push('No additional JSON-LD blocks are needed at this time.');
  lines.push('');
  lines.push('## Recommendation');
  lines.push('');
  lines.push('Keep your existing structured data up to date. Consider adding `AggregateRating` and `Review` schema as you collect more reviews.');
  return lines.join('\n');
}

function formatOutput(
  blocks: Array<{ schemaType: string; jsonLd: string; reasoning: string }>,
  implementationNotes: string,
  businessData: BusinessData,
  missingRequired: string[],
  missingRecommended: string[],
): string {
  const lines: string[] = [];

  lines.push(`# JSON-LD Schema Generator Output`);
  lines.push(`## Business: ${businessData.name} (${businessData.domain})`);
  lines.push(`## Vertical: ${businessData.vertical}`);
  lines.push('');

  if (missingRequired.length > 0) {
    lines.push(`### Missing Required Types (${missingRequired.length})`);
    for (const type of missingRequired) {
      lines.push(`- ${type}`);
    }
    lines.push('');
  }

  if (missingRecommended.length > 0) {
    lines.push(`### Missing Recommended Types (${missingRecommended.length})`);
    for (const type of missingRecommended) {
      lines.push(`- ${type}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    lines.push(`## Block ${i + 1}: ${block.schemaType}`);
    lines.push('');
    lines.push(`> ${block.reasoning}`);
    lines.push('');
    lines.push('Add the following to your page\'s `<head>` section:');
    lines.push('');
    lines.push('```html');
    lines.push('<script type="application/ld+json">');
    lines.push(block.jsonLd);
    lines.push('</script>');
    lines.push('```');
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('## Implementation Notes');
  lines.push('');
  lines.push(implementationNotes);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*Generated by Pare Engine. Replace any `[REPLACE: ...]` placeholders with your actual data before deploying.*');

  return lines.join('\n');
}
