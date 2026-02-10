// Owner: S7 (Schema Scoring). Consumer: S12 (Pipeline Orchestration).
// Typed tool function for extracting and parsing JSON-LD from HTML content.

import * as cheerio from 'cheerio';
import type { SchemaPageAnalysis } from '../contracts/analysis.contract.js';

export class JsonLdParseError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'JsonLdParseError';
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

export function getRequiredSchemaTypes(vertical: string): string[] {
  const verticalTypes = VERTICAL_REQUIRED_TYPES[vertical.toLowerCase()] ?? [];
  return [...new Set([...BASE_REQUIRED_TYPES, ...verticalTypes])];
}

export function getRecommendedSchemaTypes(): string[] {
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
    const context = obj['@context'];
    if (typeof context === 'string' && !context.includes('schema.org')) {
      errors.push('@context does not reference schema.org: ' + String(context));
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

export function parseJsonLd(html: string, url: string): SchemaPageAnalysis {
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

  return {
    url,
    presentTypes: [...new Set(allTypes)],
    missingRequiredTypes: [],
    missingRecommendedTypes: [],
    validationErrors,
    rawJsonLd,
  };
}

export type { SchemaPageAnalysis } from '../contracts/analysis.contract.js';
