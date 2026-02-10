// Owner: S7 (Schema Scoring). Consumer: S12 (Pipeline Orchestration).
// Inngest-compatible step function for schema/structured data analysis.
// JSON-LD parsing logic duplicated from packages/core/src/tools/parse-jsonld.ts
// because core package.json does not yet export subpath ./tools/*.

import * as cheerio from 'cheerio';
import {
  SchemaAnalysisOutputSchema,
  type SchemaAnalysisOutput,
  type SchemaPageAnalysis,
  type CrawledPage,
} from '@pare-engine/core/contracts';

export class SchemaAnalysisError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'SchemaAnalysisError';
    this.code = code;
  }
}

const BASE_REQUIRED_TYPES: readonly string[] = [
  'Organization', 'LocalBusiness', 'WebSite', 'BreadcrumbList',
];

const VERTICAL_REQUIRED_TYPES: Record<string, readonly string[]> = {
  dental: ['Dentist', 'FAQPage', 'MedicalProcedure', 'OpeningHoursSpecification'],
  legal: ['LegalService', 'Attorney', 'FAQPage', 'Person'],
  hvac: ['HomeAndConstructionBusiness', 'Service', 'FAQPage', 'Offer'],
  accounting: ['ProfessionalService', 'AccountingService', 'FAQPage'],
  restaurant: ['Restaurant', 'Menu', 'FAQPage', 'AggregateRating'],
  real_estate: ['RealEstateAgent', 'Offer', 'FAQPage'],
  medical: ['MedicalBusiness', 'Physician', 'MedicalProcedure', 'FAQPage'],
};

const RECOMMENDED_TYPES: readonly string[] = [
  'Person', 'AggregateRating', 'Review', 'Article', 'HowTo',
  'Service', 'Offer', 'Event', 'VideoObject',
];

function getRequiredSchemaTypes(vertical: string): string[] {
  const verticalTypes = VERTICAL_REQUIRED_TYPES[vertical.toLowerCase()] ?? [];
  return [...new Set([...BASE_REQUIRED_TYPES, ...verticalTypes])];
}

function getRecommendedSchemaTypes(): string[] {
  return [...RECOMMENDED_TYPES];
}

function extractTypes(json: unknown, types: string[]): void {
  if (!json || typeof json !== 'object') return;
  if (Array.isArray(json)) {
    for (const item of json) extractTypes(item, types);
    return;
  }
  const obj = json as Record<string, unknown>;
  if (typeof obj['@type'] === 'string') {
    types.push(obj['@type']);
  } else if (Array.isArray(obj['@type'])) {
    for (const t of obj['@type']) {
      if (typeof t === 'string') types.push(t);
    }
  }
  const nested = [
    'hasPart', 'mainEntity', 'mainEntityOfPage', '@graph',
    'itemListElement', 'publisher', 'author', 'provider',
    'offers', 'hasOfferCatalog', 'aggregateRating', 'review',
    'potentialAction', 'subOrganization', 'department', 'member',
    'address', 'geo', 'openingHoursSpecification', 'menu', 'hasMenu',
  ];
  for (const prop of nested) {
    if (obj[prop] !== undefined) extractTypes(obj[prop], types);
  }
}

function validateJsonLd(json: unknown): string[] {
  const errors: string[] = [];
  if (!json || typeof json !== 'object') {
    errors.push('JSON-LD is not an object');
    return errors;
  }
  if (Array.isArray(json)) {
    for (let i = 0; i < json.length; i++) {
      for (const err of validateJsonLd(json[i])) errors.push('[' + i + '] ' + err);
    }
    return errors;
  }
  const obj = json as Record<string, unknown>;
  const hasGraph = Array.isArray(obj['@graph']);
  if (!obj['@type'] && !hasGraph) errors.push('Missing @type property');
  if (obj['@type'] !== undefined) {
    if (typeof obj['@type'] !== 'string' && !Array.isArray(obj['@type'])) {
      errors.push('@type must be a string or array of strings');
    }
    if (typeof obj['@type'] === 'string' && obj['@type'].length === 0) {
      errors.push('@type is empty');
    }
  }
  if (obj['@context'] !== undefined) {
    const ctx = obj['@context'];
    if (typeof ctx === 'string' && !ctx.includes('schema.org')) {
      errors.push('@context does not reference schema.org: ' + String(ctx));
    }
  } else if (!hasGraph) {
    errors.push('Missing @context (should reference schema.org)');
  }
  if (hasGraph) {
    const graph = obj['@graph'] as unknown[];
    for (let i = 0; i < graph.length; i++) {
      for (const err of validateJsonLd(graph[i])) errors.push('@graph[' + i + '] ' + err);
    }
  }
  return errors;
}

function parsePageJsonLd(
  html: string, url: string, requiredTypes: string[], recommendedTypes: string[],
): SchemaPageAnalysis {
  const $ = cheerio.load(html);
  const jsonLdScripts = $('script[type="application/ld+json"]');
  const allTypes: string[] = [];
  const validationErrors: string[] = [];
  const rawJsonLd: unknown[] = [];

  jsonLdScripts.each((_index, el) => {
    const scriptContent = $(el).html();
    if (!scriptContent || scriptContent.trim().length === 0) {
      validationErrors.push('Empty JSON-LD script block');
      return;
    }
    try {
      const parsed: unknown = JSON.parse(scriptContent);
      rawJsonLd.push(parsed);
      extractTypes(parsed, allTypes);
      validationErrors.push(...validateJsonLd(parsed));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      validationErrors.push('Invalid JSON-LD syntax: ' + message);
    }
  });

  const uniqueTypes = [...new Set(allTypes)];
  const presentSet = new Set(uniqueTypes);
  return {
    url,
    presentTypes: uniqueTypes,
    missingRequiredTypes: requiredTypes.filter((t) => !presentSet.has(t)),
    missingRecommendedTypes: recommendedTypes.filter((t) => !presentSet.has(t)),
    validationErrors,
    rawJsonLd,
  };
}

export function analyzeSchema(
  pages: CrawledPage[], vertical: string,
): SchemaAnalysisOutput {
  const requiredTypes = getRequiredSchemaTypes(vertical);
  const recommendedTypes = getRecommendedSchemaTypes();
  const pageAnalyses: SchemaPageAnalysis[] = [];
  const siteWideTypes = new Set<string>();
  let totalValidationErrors = 0;

  for (const page of pages) {
    if (!page.html || page.html.trim().length === 0) {
      pageAnalyses.push({
        url: page.url,
        presentTypes: [],
        missingRequiredTypes: [...requiredTypes],
        missingRecommendedTypes: [...recommendedTypes],
        validationErrors: [],
        rawJsonLd: [],
      });
      continue;
    }
    const analysis = parsePageJsonLd(page.html, page.url, requiredTypes, recommendedTypes);
    pageAnalyses.push(analysis);
    for (const t of analysis.presentTypes) siteWideTypes.add(t);
    totalValidationErrors += analysis.validationErrors.length;
  }

  const output: SchemaAnalysisOutput = {
    pages: pageAnalyses,
    allPresentTypes: [...siteWideTypes],
    allMissingRequired: requiredTypes.filter((t) => !siteWideTypes.has(t)),
    allMissingRecommended: recommendedTypes.filter((t) => !siteWideTypes.has(t)),
    totalValidationErrors,
    vertical,
    analyzedAt: new Date(),
  };
  return SchemaAnalysisOutputSchema.parse(output);
}

export function executeSchemaAnalysisStep(
  pages: CrawledPage[], vertical: string,
): SchemaAnalysisOutput {
  try {
    return analyzeSchema(pages, vertical);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new SchemaAnalysisError(
      'Schema analysis failed for vertical "' + vertical + '": ' + errorMessage,
      'SCHEMA_ANALYSIS_FAILED',
    );
  }
}
