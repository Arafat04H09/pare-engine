// Owner: S26 (Agentic Commerce Readiness).
// Consumers: S12 (Pipeline Orchestration), S10 (Report Templates).
//
// Audits a site's readiness for AI shopping agents by checking:
// - Product/Offer schema presence and completeness
// - Pricing transparency in structured data
// - API endpoint detection (REST/GraphQL/product feeds)
// - Emerging AI shopping agent protocols (UCP, ACP, merchant APIs)
//
// This is a typed tool function: typed input -> typed output.
// Designed to be wrappable as an Inngest step or MCP tool.

import type { CrawlOutput, CrawledPage } from '../contracts/crawl.contract.js';
import type { SchemaAnalysisOutput, SchemaPageAnalysis } from '../contracts/analysis.contract.js';

// --- Custom Error ---

export class AgenticCommerceError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'AgenticCommerceError';
    this.code = code;
  }
}

// --- Constants ---

/** Schema.org types that indicate e-commerce capability. */
const COMMERCE_SCHEMA_TYPES = [
  'Product',
  'Offer',
  'OfferCatalog',
  'AggregateOffer',
  'IndividualProduct',
  'ProductGroup',
  'ProductModel',
  'ItemList',
] as const;

/** Product-adjacent schema types that improve agentic commerce readiness. */
const PRODUCT_ADJACENT_TYPES = [
  'Brand',
  'Review',
  'AggregateRating',
  'Organization',
  'BreadcrumbList',
  'WebSite',
  'SearchAction',
  'ImageObject',
] as const;

/** Schema.org properties expected inside a well-formed Product/Offer. */
const PRODUCT_REQUIRED_PROPERTIES = [
  'name',
  'description',
  'image',
  'offers',
  'sku',
  'brand',
] as const;

const OFFER_REQUIRED_PROPERTIES = [
  'price',
  'priceCurrency',
  'availability',
  'url',
] as const;

/** URL patterns that suggest API or feed endpoints. */
const API_ENDPOINT_PATTERNS: ReadonlyArray<{ pattern: RegExp; label: string }> = [
  { pattern: /\/api\//i, label: 'REST API endpoint' },
  { pattern: /\/graphql/i, label: 'GraphQL endpoint' },
  { pattern: /\/v[1-9]\//i, label: 'Versioned API endpoint' },
  { pattern: /\/feed\b/i, label: 'Product feed' },
  { pattern: /\/products\.json/i, label: 'JSON product feed (Shopify-style)' },
  { pattern: /\/products\.xml/i, label: 'XML product feed' },
  { pattern: /\/sitemap[-_]?products/i, label: 'Product sitemap' },
  { pattern: /\/catalog/i, label: 'Product catalog endpoint' },
  { pattern: /\/wp-json/i, label: 'WordPress REST API' },
  { pattern: /\/rest\/V[1-9]/i, label: 'Magento REST API' },
];

/** Content patterns indicating AI shopping agent protocol support. */
const AGENT_PROTOCOL_PATTERNS: ReadonlyArray<{ pattern: RegExp; label: string; protocol: string }> = [
  { pattern: /unified\s*commerce\s*protocol/i, label: 'Unified Commerce Protocol (UCP) reference', protocol: 'UCP' },
  { pattern: /agent\s*commerce\s*protocol/i, label: 'Agent Commerce Protocol (ACP) reference', protocol: 'ACP' },
  { pattern: /agentic[\s-]*commerce/i, label: 'Agentic commerce reference', protocol: 'agentic-commerce' },
  { pattern: /merchant[\s-]*api/i, label: 'Merchant API reference', protocol: 'merchant-api' },
  { pattern: /ai[\s-]*shopping/i, label: 'AI shopping integration reference', protocol: 'ai-shopping' },
  { pattern: /\.well-known\/ai-plugin/i, label: 'OpenAI plugin manifest', protocol: 'openai-plugin' },
  { pattern: /openapi\.json|openapi\.yaml|swagger/i, label: 'OpenAPI spec detected', protocol: 'openapi' },
  { pattern: /buyable|purchasable|shoppable/i, label: 'Shoppable content indicators', protocol: 'shoppable-content' },
];

/** E-commerce platform indicators found in page content. */
const ECOMMERCE_PLATFORM_PATTERNS: ReadonlyArray<{ pattern: RegExp; platform: string }> = [
  { pattern: /shopify/i, platform: 'Shopify' },
  { pattern: /woocommerce/i, platform: 'WooCommerce' },
  { pattern: /magento/i, platform: 'Magento' },
  { pattern: /bigcommerce/i, platform: 'BigCommerce' },
  { pattern: /squarespace.*commerce/i, platform: 'Squarespace Commerce' },
  { pattern: /wix.*stores/i, platform: 'Wix Stores' },
  { pattern: /prestashop/i, platform: 'PrestaShop' },
  { pattern: /opencart/i, platform: 'OpenCart' },
  { pattern: /saleor/i, platform: 'Saleor' },
  { pattern: /medusa/i, platform: 'Medusa' },
];

// --- Public Types ---

export interface CommerceChecklistItem {
  /** Unique identifier for this checklist item. */
  id: string;
  /** Human-readable label. */
  label: string;
  /** Whether this capability is present on the site. */
  present: boolean;
  /** Importance weighting for scoring: critical = 3x, important = 2x, nice = 1x. */
  importance: 'critical' | 'important' | 'nice-to-have';
  /** Additional detail about what was found or what is missing. */
  detail: string;
}

export interface AgentProtocolHint {
  /** Protocol name (e.g., 'UCP', 'ACP', 'openai-plugin'). */
  protocol: string;
  /** Human-readable label. */
  label: string;
  /** URL where the hint was detected. */
  foundOnUrl: string;
}

export interface DetectedApiEndpoint {
  /** The URL that appears to be an API endpoint. */
  url: string;
  /** What kind of endpoint (e.g., 'REST API endpoint', 'GraphQL endpoint'). */
  type: string;
}

export interface EcommercePlatformDetection {
  /** Platform name (e.g., 'Shopify', 'WooCommerce'). */
  platform: string;
  /** Confidence indicator. */
  confidence: 'high' | 'medium' | 'low';
}

export interface AgenticCommerceResult {
  /** Readiness score from 0-100. */
  readinessScore: number;
  /** Whether this site appears to be an e-commerce site. */
  isEcommerceSite: boolean;
  /** If not an e-commerce site, this explains why and what the site is instead. */
  nonCommerceNote: string | null;
  /** Detected e-commerce platform(s), if any. */
  detectedPlatforms: EcommercePlatformDetection[];
  /** Checklist of present and missing capabilities. */
  checklist: CommerceChecklistItem[];
  /** AI shopping agent protocol hints found on the site. */
  agentProtocolHints: AgentProtocolHint[];
  /** Detected API or feed endpoints. */
  apiEndpoints: DetectedApiEndpoint[];
  /** Prioritized recommendations for improving agentic commerce readiness. */
  recommendations: string[];
  /** Summary statistics. */
  stats: {
    /** Number of pages with Product schema. */
    pagesWithProductSchema: number;
    /** Number of pages with Offer schema. */
    pagesWithOfferSchema: number;
    /** Number of pages with pricing in structured data. */
    pagesWithPricing: number;
    /** Total unique commerce schema types found. */
    uniqueCommerceTypesFound: number;
    /** Total crawled pages analyzed. */
    totalPagesAnalyzed: number;
  };
  /** ISO timestamp of when this audit was performed. */
  auditedAt: Date;
}

// --- Internal Helpers ---

/**
 * Determines whether the site appears to be an e-commerce site based on
 * schema types, URL patterns, and content signals.
 */
function detectEcommerceSignals(
  crawlData: CrawlOutput,
  schemaAnalysis: SchemaAnalysisOutput,
): { isEcommerce: boolean; confidence: 'high' | 'medium' | 'low'; reason: string } {
  const allTypes = schemaAnalysis.allPresentTypes;
  const hasProductSchema = allTypes.some((t) => t === 'Product' || t === 'IndividualProduct' || t === 'ProductGroup' || t === 'ProductModel');
  const hasOfferSchema = allTypes.some((t) => t === 'Offer' || t === 'AggregateOffer' || t === 'OfferCatalog');

  // High confidence: Product + Offer schema together
  if (hasProductSchema && hasOfferSchema) {
    return { isEcommerce: true, confidence: 'high', reason: 'Product and Offer schema detected' };
  }

  // Medium confidence: Product schema alone or commerce URL patterns
  if (hasProductSchema) {
    return { isEcommerce: true, confidence: 'medium', reason: 'Product schema detected without Offer schema' };
  }

  // Check URL patterns for commerce signals
  const commerceUrlPatterns = [
    /\/product/i, /\/shop/i, /\/store/i, /\/cart/i, /\/checkout/i,
    /\/collection/i, /\/catalog/i, /\/buy/i, /\/pricing/i,
  ];
  const commerceUrls = crawlData.pages.filter((page) =>
    commerceUrlPatterns.some((pattern) => pattern.test(page.url)),
  );

  if (commerceUrls.length >= 3) {
    return { isEcommerce: true, confidence: 'medium', reason: `${commerceUrls.length} commerce-related URLs detected` };
  }

  // Check page content for commerce keywords
  const commerceKeywords = /add\s+to\s+cart|buy\s+now|shop\s+now|price|checkout|\$\d+/i;
  const pagesWithCommerceContent = crawlData.pages.filter((page) =>
    commerceKeywords.test(page.markdown),
  );

  if (pagesWithCommerceContent.length >= 2) {
    return { isEcommerce: true, confidence: 'low', reason: `${pagesWithCommerceContent.length} pages with commerce content keywords` };
  }

  if (hasOfferSchema) {
    return { isEcommerce: true, confidence: 'low', reason: 'Offer schema detected (service pricing or e-commerce)' };
  }

  return { isEcommerce: false, confidence: 'high', reason: 'No e-commerce signals detected' };
}

/**
 * Extracts structured data objects of a given @type from raw JSON-LD blocks.
 */
function findJsonLdByType(rawJsonLd: unknown[], targetType: string): unknown[] {
  const results: unknown[] = [];

  function walk(node: unknown): void {
    if (!node || typeof node !== 'object') return;

    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }

    const obj = node as Record<string, unknown>;

    // Check @type
    if (typeof obj['@type'] === 'string' && obj['@type'] === targetType) {
      results.push(obj);
    } else if (Array.isArray(obj['@type']) && obj['@type'].includes(targetType)) {
      results.push(obj);
    }

    // Recurse into known nested properties
    const nestedProps = [
      '@graph', 'hasPart', 'mainEntity', 'mainEntityOfPage',
      'itemListElement', 'offers', 'hasOfferCatalog',
      'includesObject', 'isPartOf',
    ];
    for (const prop of nestedProps) {
      if (obj[prop] !== undefined) walk(obj[prop]);
    }
  }

  for (const block of rawJsonLd) {
    walk(block);
  }
  return results;
}

/**
 * Checks whether a Product JSON-LD object has a specific property set.
 */
function hasProperty(obj: unknown, property: string): boolean {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  const record = obj as Record<string, unknown>;
  const value = record[property];
  if (value === undefined || value === null) return false;
  if (typeof value === 'string' && value.trim().length === 0) return false;
  return true;
}

/**
 * Checks whether pricing data exists inside Offer/AggregateOffer objects.
 */
function hasPricingData(offers: unknown[]): boolean {
  for (const offer of offers) {
    if (hasProperty(offer, 'price') || hasProperty(offer, 'lowPrice') || hasProperty(offer, 'highPrice')) {
      return true;
    }
  }
  return false;
}

/**
 * Detects API endpoints from discovered URLs and crawled page content.
 */
function detectApiEndpoints(crawlData: CrawlOutput): DetectedApiEndpoint[] {
  const endpoints: DetectedApiEndpoint[] = [];
  const seen = new Set<string>();

  // Check discovered URLs
  const allUrls = [
    ...crawlData.discoveredUrls,
    ...crawlData.pages.map((p) => p.url),
  ];

  for (const url of allUrls) {
    for (const { pattern, label } of API_ENDPOINT_PATTERNS) {
      if (pattern.test(url) && !seen.has(url)) {
        seen.add(url);
        endpoints.push({ url, type: label });
      }
    }
  }

  // Check page content for API references (links in markdown)
  for (const page of crawlData.pages) {
    const urlMatches = page.markdown.match(/https?:\/\/[^\s)"']+/g) ?? [];
    for (const matchedUrl of urlMatches) {
      for (const { pattern, label } of API_ENDPOINT_PATTERNS) {
        if (pattern.test(matchedUrl) && !seen.has(matchedUrl)) {
          seen.add(matchedUrl);
          endpoints.push({ url: matchedUrl, type: label });
        }
      }
    }
  }

  return endpoints;
}

/**
 * Detects AI shopping agent protocol hints from page content.
 */
function detectAgentProtocols(crawlData: CrawlOutput): AgentProtocolHint[] {
  const hints: AgentProtocolHint[] = [];
  const seen = new Set<string>();

  for (const page of crawlData.pages) {
    const textToSearch = page.markdown + ' ' + page.html;
    for (const { pattern, label, protocol } of AGENT_PROTOCOL_PATTERNS) {
      if (pattern.test(textToSearch)) {
        const key = `${protocol}:${page.url}`;
        if (!seen.has(key)) {
          seen.add(key);
          hints.push({ protocol, label, foundOnUrl: page.url });
        }
      }
    }
  }

  // Also check discovered URLs for well-known paths
  for (const url of crawlData.discoveredUrls) {
    if (/\.well-known\/ai-plugin\.json/i.test(url)) {
      const key = `openai-plugin:${url}`;
      if (!seen.has(key)) {
        seen.add(key);
        hints.push({ protocol: 'openai-plugin', label: 'OpenAI plugin manifest', foundOnUrl: url });
      }
    }
    if (/openapi\.(json|yaml|yml)/i.test(url)) {
      const key = `openapi:${url}`;
      if (!seen.has(key)) {
        seen.add(key);
        hints.push({ protocol: 'openapi', label: 'OpenAPI specification', foundOnUrl: url });
      }
    }
  }

  return hints;
}

/**
 * Detects which e-commerce platform the site is built on.
 */
function detectPlatform(crawlData: CrawlOutput): EcommercePlatformDetection[] {
  const detections = new Map<string, number>();

  for (const page of crawlData.pages) {
    const content = page.html + ' ' + page.markdown;
    for (const { pattern, platform } of ECOMMERCE_PLATFORM_PATTERNS) {
      if (pattern.test(content)) {
        detections.set(platform, (detections.get(platform) ?? 0) + 1);
      }
    }
  }

  const totalPages = crawlData.pages.length || 1;
  return Array.from(detections.entries()).map(([platform, count]) => {
    const ratio = count / totalPages;
    let confidence: 'high' | 'medium' | 'low';
    if (ratio >= 0.5) {
      confidence = 'high';
    } else if (ratio >= 0.2) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }
    return { platform, confidence };
  });
}

/**
 * Builds the full checklist of agentic commerce capabilities.
 */
function buildChecklist(
  crawlData: CrawlOutput,
  schemaAnalysis: SchemaAnalysisOutput,
  apiEndpoints: DetectedApiEndpoint[],
  agentProtocolHints: AgentProtocolHint[],
): CommerceChecklistItem[] {
  const checklist: CommerceChecklistItem[] = [];
  const allTypes = schemaAnalysis.allPresentTypes;

  // Collect all raw JSON-LD from all pages
  const allRawJsonLd: unknown[] = [];
  for (const page of schemaAnalysis.pages) {
    allRawJsonLd.push(...page.rawJsonLd);
  }

  // --- Critical checks ---

  // 1. Product schema present
  const hasProduct = allTypes.some((t) =>
    ['Product', 'IndividualProduct', 'ProductGroup', 'ProductModel'].includes(t),
  );
  checklist.push({
    id: 'product-schema',
    label: 'Product schema markup',
    present: hasProduct,
    importance: 'critical',
    detail: hasProduct
      ? `Product schema types found: ${allTypes.filter((t) => ['Product', 'IndividualProduct', 'ProductGroup', 'ProductModel'].includes(t)).join(', ')}`
      : 'No Product schema.org markup detected. AI shopping agents cannot identify products on this site.',
  });

  // 2. Offer schema present
  const hasOffer = allTypes.some((t) =>
    ['Offer', 'AggregateOffer', 'OfferCatalog'].includes(t),
  );
  checklist.push({
    id: 'offer-schema',
    label: 'Offer/pricing schema markup',
    present: hasOffer,
    importance: 'critical',
    detail: hasOffer
      ? `Offer schema types found: ${allTypes.filter((t) => ['Offer', 'AggregateOffer', 'OfferCatalog'].includes(t)).join(', ')}`
      : 'No Offer/AggregateOffer schema detected. Pricing is invisible to AI agents.',
  });

  // 3. Pricing in structured data
  const productObjects = findJsonLdByType(allRawJsonLd, 'Product');
  const offerObjects = [
    ...findJsonLdByType(allRawJsonLd, 'Offer'),
    ...findJsonLdByType(allRawJsonLd, 'AggregateOffer'),
  ];
  // Also extract offers nested inside Product objects
  for (const product of productObjects) {
    const obj = product as Record<string, unknown>;
    if (obj['offers']) {
      if (Array.isArray(obj['offers'])) {
        offerObjects.push(...obj['offers']);
      } else if (typeof obj['offers'] === 'object') {
        offerObjects.push(obj['offers']);
      }
    }
  }
  const hasPricing = offerObjects.length > 0 && hasPricingData(offerObjects);
  checklist.push({
    id: 'pricing-structured-data',
    label: 'Pricing present in structured data',
    present: hasPricing,
    importance: 'critical',
    detail: hasPricing
      ? `Pricing data found in ${offerObjects.length} Offer object(s).`
      : 'No pricing data (price, lowPrice, highPrice) found in structured data. AI agents cannot compare prices.',
  });

  // --- Important checks ---

  // 4. Product name in structured data
  const hasProductName = productObjects.some((p) => hasProperty(p, 'name'));
  checklist.push({
    id: 'product-name',
    label: 'Product name in structured data',
    present: hasProductName,
    importance: 'important',
    detail: hasProductName
      ? 'Product names are present in structured data.'
      : 'Product objects lack a "name" property. AI agents cannot identify products by name.',
  });

  // 5. Product description in structured data
  const hasProductDescription = productObjects.some((p) => hasProperty(p, 'description'));
  checklist.push({
    id: 'product-description',
    label: 'Product description in structured data',
    present: hasProductDescription,
    importance: 'important',
    detail: hasProductDescription
      ? 'Product descriptions found in structured data.'
      : 'Product objects lack a "description" property. AI agents have limited product context.',
  });

  // 6. Product images in structured data
  const hasProductImage = productObjects.some((p) => hasProperty(p, 'image'));
  checklist.push({
    id: 'product-image',
    label: 'Product images in structured data',
    present: hasProductImage,
    importance: 'important',
    detail: hasProductImage
      ? 'Product images referenced in structured data.'
      : 'Product objects lack an "image" property. Visual product representation is missing for AI agents.',
  });

  // 7. SKU/identifier in structured data
  const hasProductSku = productObjects.some((p) =>
    hasProperty(p, 'sku') || hasProperty(p, 'gtin') || hasProperty(p, 'gtin13') ||
    hasProperty(p, 'gtin12') || hasProperty(p, 'gtin8') || hasProperty(p, 'mpn') ||
    hasProperty(p, 'isbn') || hasProperty(p, 'productID'),
  );
  checklist.push({
    id: 'product-identifier',
    label: 'Product identifiers (SKU/GTIN/MPN)',
    present: hasProductSku,
    importance: 'important',
    detail: hasProductSku
      ? 'Product identifiers found in structured data.'
      : 'No SKU, GTIN, MPN, or other product identifiers in structured data. Cross-platform product matching is impossible.',
  });

  // 8. Availability status in offers
  const hasAvailability = offerObjects.some((o) => hasProperty(o, 'availability'));
  checklist.push({
    id: 'availability-status',
    label: 'Availability status in Offer data',
    present: hasAvailability,
    importance: 'important',
    detail: hasAvailability
      ? 'Availability status found in Offer data.'
      : 'No availability status in Offer schema. AI agents cannot tell users if products are in stock.',
  });

  // 9. Brand information
  const hasBrand = productObjects.some((p) => hasProperty(p, 'brand'))
    || allTypes.includes('Brand');
  checklist.push({
    id: 'brand-info',
    label: 'Brand information in structured data',
    present: hasBrand,
    importance: 'important',
    detail: hasBrand
      ? 'Brand information found in structured data.'
      : 'No brand information in Product schema. Brand-based product searches will miss this site.',
  });

  // 10. Review/Rating data
  const hasReviews = allTypes.some((t) => ['Review', 'AggregateRating'].includes(t))
    || productObjects.some((p) => hasProperty(p, 'aggregateRating') || hasProperty(p, 'review'));
  checklist.push({
    id: 'reviews-ratings',
    label: 'Reviews/ratings in structured data',
    present: hasReviews,
    importance: 'important',
    detail: hasReviews
      ? 'Review or rating data found in structured data.'
      : 'No Review/AggregateRating data in structured data. AI agents cannot compare products by customer feedback.',
  });

  // 11. API or product feed endpoint
  const hasApiEndpoint = apiEndpoints.length > 0;
  checklist.push({
    id: 'api-endpoint',
    label: 'API or product feed endpoint',
    present: hasApiEndpoint,
    importance: 'important',
    detail: hasApiEndpoint
      ? `${apiEndpoints.length} API/feed endpoint(s) detected: ${apiEndpoints.map((e) => e.type).join(', ')}.`
      : 'No API or product feed endpoints detected. AI agents cannot programmatically access product data.',
  });

  // --- Nice-to-have checks ---

  // 12. Currency information
  const hasCurrency = offerObjects.some((o) => hasProperty(o, 'priceCurrency'));
  checklist.push({
    id: 'price-currency',
    label: 'Price currency specified',
    present: hasCurrency,
    importance: 'nice-to-have',
    detail: hasCurrency
      ? 'Price currency specified in Offer data.'
      : 'No priceCurrency in Offer schema. International AI agents cannot determine pricing currency.',
  });

  // 13. AI agent protocol support
  const hasAgentProtocol = agentProtocolHints.length > 0;
  checklist.push({
    id: 'agent-protocol',
    label: 'AI shopping agent protocol support',
    present: hasAgentProtocol,
    importance: 'nice-to-have',
    detail: hasAgentProtocol
      ? `AI agent protocol hints found: ${agentProtocolHints.map((h) => h.label).join(', ')}.`
      : 'No AI shopping agent protocol (UCP, ACP, OpenAI plugin, OpenAPI) support detected.',
  });

  // 14. BreadcrumbList for navigation
  const hasBreadcrumbs = allTypes.includes('BreadcrumbList');
  checklist.push({
    id: 'breadcrumb-navigation',
    label: 'BreadcrumbList schema for product navigation',
    present: hasBreadcrumbs,
    importance: 'nice-to-have',
    detail: hasBreadcrumbs
      ? 'BreadcrumbList schema detected, enabling structured product navigation.'
      : 'No BreadcrumbList schema. Product category hierarchy is not machine-readable.',
  });

  // 15. SearchAction for site search
  const hasSearchAction = allTypes.includes('SearchAction')
    || allRawJsonLd.some((block) => {
      const asString = JSON.stringify(block);
      return asString.includes('SearchAction');
    });
  checklist.push({
    id: 'search-action',
    label: 'SearchAction schema for product search',
    present: hasSearchAction,
    importance: 'nice-to-have',
    detail: hasSearchAction
      ? 'SearchAction schema detected, enabling AI agents to search the product catalog.'
      : 'No SearchAction schema. AI agents cannot use the site\'s search functionality programmatically.',
  });

  // 16. ItemList for product collections
  const hasItemList = allTypes.includes('ItemList');
  checklist.push({
    id: 'item-list',
    label: 'ItemList schema for product collections',
    present: hasItemList,
    importance: 'nice-to-have',
    detail: hasItemList
      ? 'ItemList schema detected for product collections/listings.'
      : 'No ItemList schema. Product collection pages are not structured for AI parsing.',
  });

  return checklist;
}

/**
 * Calculates the readiness score (0-100) from the checklist.
 *
 * Weight distribution:
 * - critical items: 3x multiplier
 * - important items: 2x multiplier
 * - nice-to-have items: 1x multiplier
 */
function calculateScore(checklist: CommerceChecklistItem[], isEcommerce: boolean): number {
  if (!isEcommerce) {
    // Non-e-commerce sites get a baseline score that reflects their inherent N/A status
    return 0;
  }

  const WEIGHT_MAP: Record<string, number> = {
    critical: 3,
    important: 2,
    'nice-to-have': 1,
  };

  let totalWeightedMax = 0;
  let totalWeightedScore = 0;

  for (const item of checklist) {
    const weight = WEIGHT_MAP[item.importance] ?? 1;
    totalWeightedMax += weight;
    if (item.present) {
      totalWeightedScore += weight;
    }
  }

  if (totalWeightedMax === 0) return 0;

  return Math.round((totalWeightedScore / totalWeightedMax) * 100);
}

/**
 * Generates prioritized recommendations based on missing checklist items.
 */
function generateRecommendations(
  checklist: CommerceChecklistItem[],
  isEcommerce: boolean,
  agentProtocolHints: AgentProtocolHint[],
  apiEndpoints: DetectedApiEndpoint[],
  detectedPlatforms: EcommercePlatformDetection[],
): string[] {
  const recommendations: string[] = [];

  if (!isEcommerce) {
    recommendations.push(
      'This site does not appear to be an e-commerce site. If you sell products or services online, add Product and Offer schema markup to make your offerings visible to AI shopping agents.',
    );
    return recommendations;
  }

  // Group missing items by importance
  const missingCritical = checklist.filter((item) => !item.present && item.importance === 'critical');
  const missingImportant = checklist.filter((item) => !item.present && item.importance === 'important');
  const missingNice = checklist.filter((item) => !item.present && item.importance === 'nice-to-have');

  // Critical recommendations first
  for (const item of missingCritical) {
    switch (item.id) {
      case 'product-schema':
        recommendations.push(
          'CRITICAL: Add Product schema.org markup to all product pages. This is the foundation of AI agent product discovery. Use JSON-LD format with @type "Product" including name, description, image, and SKU.',
        );
        break;
      case 'offer-schema':
        recommendations.push(
          'CRITICAL: Add Offer schema.org markup within each Product. Include price, priceCurrency, and availability. Without this, AI agents cannot surface pricing to users.',
        );
        break;
      case 'pricing-structured-data':
        recommendations.push(
          'CRITICAL: Add explicit pricing (price or lowPrice/highPrice) to your Offer structured data. AI shopping agents rely on structured pricing for comparison shopping.',
        );
        break;
    }
  }

  // Important recommendations
  for (const item of missingImportant) {
    switch (item.id) {
      case 'product-identifier':
        recommendations.push(
          'Add product identifiers (SKU, GTIN/EAN, MPN) to Product schema. This enables cross-platform product matching and is required for Google Merchant Center integration.',
        );
        break;
      case 'availability-status':
        recommendations.push(
          'Add availability status (e.g., schema:InStock, schema:OutOfStock) to Offer markup. AI agents need real-time stock status to make accurate recommendations.',
        );
        break;
      case 'product-name':
        recommendations.push(
          'Ensure every Product schema object has a "name" property. Product names are the primary identifier AI agents use.',
        );
        break;
      case 'product-description':
        recommendations.push(
          'Add "description" to Product schema objects. Rich descriptions help AI agents understand product features and match them to user queries.',
        );
        break;
      case 'product-image':
        recommendations.push(
          'Add "image" references to Product schema. Visual product data is increasingly used by multimodal AI agents.',
        );
        break;
      case 'brand-info':
        recommendations.push(
          'Add "brand" information to Product schema. Brand data enables AI agents to filter and recommend products by manufacturer.',
        );
        break;
      case 'reviews-ratings':
        recommendations.push(
          'Add AggregateRating or Review markup to Product schema. Customer feedback data is a key trust signal AI agents use for recommendations.',
        );
        break;
      case 'api-endpoint':
        if (detectedPlatforms.length > 0) {
          const platform = detectedPlatforms[0].platform;
          recommendations.push(
            `Enable API access for your ${platform} store. Most platforms offer a product API or feed that AI agents can consume for real-time data.`,
          );
        } else {
          recommendations.push(
            'Consider exposing a product API or structured feed (e.g., products.json, XML feed) for programmatic access by AI shopping agents.',
          );
        }
        break;
    }
  }

  // Nice-to-have recommendations (only if there are fewer than 5 recommendations already)
  if (recommendations.length < 5) {
    for (const item of missingNice) {
      if (recommendations.length >= 7) break;
      switch (item.id) {
        case 'agent-protocol':
          recommendations.push(
            'FUTURE: Consider implementing emerging AI agent protocols (OpenAPI spec, AI plugin manifests) to enable direct AI agent integration with your store.',
          );
          break;
        case 'search-action':
          recommendations.push(
            'Add SearchAction schema to enable AI agents to search your product catalog programmatically.',
          );
          break;
        case 'breadcrumb-navigation':
          recommendations.push(
            'Add BreadcrumbList schema to product pages for structured category navigation.',
          );
          break;
        case 'item-list':
          recommendations.push(
            'Add ItemList schema to category/collection pages so AI agents can parse product listings.',
          );
          break;
        case 'price-currency':
          recommendations.push(
            'Add priceCurrency to all Offer objects to support international AI shopping agents.',
          );
          break;
      }
    }
  }

  // Platform-specific recommendations
  if (detectedPlatforms.length > 0) {
    const primary = detectedPlatforms[0].platform;
    if (primary === 'Shopify') {
      recommendations.push(
        'Shopify detected: Ensure your theme uses Shopify\'s built-in JSON-LD output. Consider apps like "JSON-LD for SEO" to enhance structured data completeness.',
      );
    } else if (primary === 'WooCommerce') {
      recommendations.push(
        'WooCommerce detected: Use a structured data plugin (e.g., Yoast SEO, Rank Math) to ensure complete Product+Offer schema output for all products.',
      );
    }
  }

  return recommendations;
}

// --- Count Helpers ---

function countPagesWithSchemaType(pages: SchemaPageAnalysis[], types: string[]): number {
  return pages.filter((page) =>
    page.presentTypes.some((t) => types.includes(t)),
  ).length;
}

function countPagesWithPricing(pages: SchemaPageAnalysis[]): number {
  let count = 0;
  for (const page of pages) {
    const offerObjects = [
      ...findJsonLdByType(page.rawJsonLd, 'Offer'),
      ...findJsonLdByType(page.rawJsonLd, 'AggregateOffer'),
    ];
    // Also check nested offers inside Product
    const productObjects = findJsonLdByType(page.rawJsonLd, 'Product');
    for (const product of productObjects) {
      const obj = product as Record<string, unknown>;
      if (obj['offers']) {
        if (Array.isArray(obj['offers'])) {
          offerObjects.push(...obj['offers']);
        } else if (typeof obj['offers'] === 'object') {
          offerObjects.push(obj['offers']);
        }
      }
    }
    if (offerObjects.length > 0 && hasPricingData(offerObjects)) {
      count++;
    }
  }
  return count;
}

// --- Main Public Function ---

/**
 * Audits a site's readiness for AI shopping agents (agentic commerce).
 *
 * Analyzes crawl data and schema analysis results to check for:
 * - Product/Offer schema.org markup presence and completeness
 * - Pricing transparency in structured data
 * - API endpoint detection (REST, GraphQL, product feeds)
 * - Emerging AI shopping agent protocol support (UCP, ACP, OpenAI plugin, OpenAPI)
 *
 * Returns a readiness score (0-100), a detailed checklist of capabilities,
 * and prioritized recommendations.
 *
 * Handles non-e-commerce sites by returning a 0 score with an explanatory note.
 *
 * @param crawlData - Output from the Firecrawl crawl step.
 * @param schemaAnalysis - Output from the schema analysis step.
 * @returns AgenticCommerceResult with score, checklist, and recommendations.
 */
export async function auditAgenticCommerce(
  crawlData: CrawlOutput,
  schemaAnalysis: SchemaAnalysisOutput,
): Promise<AgenticCommerceResult> {
  if (!crawlData || !crawlData.pages) {
    throw new AgenticCommerceError(
      'Invalid crawl data: missing pages array',
      'INVALID_CRAWL_DATA',
    );
  }

  if (!schemaAnalysis || !schemaAnalysis.pages) {
    throw new AgenticCommerceError(
      'Invalid schema analysis: missing pages array',
      'INVALID_SCHEMA_ANALYSIS',
    );
  }

  // Detect e-commerce signals
  const ecommerceSignals = detectEcommerceSignals(crawlData, schemaAnalysis);

  // Detect platform
  const detectedPlatforms = detectPlatform(crawlData);

  // Detect API endpoints
  const apiEndpoints = detectApiEndpoints(crawlData);

  // Detect agent protocol hints
  const agentProtocolHints = detectAgentProtocols(crawlData);

  // Build the capability checklist
  const checklist = buildChecklist(crawlData, schemaAnalysis, apiEndpoints, agentProtocolHints);

  // Calculate score
  const readinessScore = calculateScore(checklist, ecommerceSignals.isEcommerce);

  // Generate recommendations
  const recommendations = generateRecommendations(
    checklist,
    ecommerceSignals.isEcommerce,
    agentProtocolHints,
    apiEndpoints,
    detectedPlatforms,
  );

  // Compute stats
  const uniqueCommerceTypes = new Set(
    schemaAnalysis.allPresentTypes.filter((t) =>
      [...COMMERCE_SCHEMA_TYPES, ...PRODUCT_ADJACENT_TYPES].includes(t as never),
    ),
  );

  const stats = {
    pagesWithProductSchema: countPagesWithSchemaType(
      schemaAnalysis.pages,
      ['Product', 'IndividualProduct', 'ProductGroup', 'ProductModel'],
    ),
    pagesWithOfferSchema: countPagesWithSchemaType(
      schemaAnalysis.pages,
      ['Offer', 'AggregateOffer', 'OfferCatalog'],
    ),
    pagesWithPricing: countPagesWithPricing(schemaAnalysis.pages),
    uniqueCommerceTypesFound: uniqueCommerceTypes.size,
    totalPagesAnalyzed: crawlData.pages.length,
  };

  // Non-commerce note
  const nonCommerceNote = ecommerceSignals.isEcommerce
    ? null
    : `This site does not appear to be an e-commerce site (${ecommerceSignals.reason}). Agentic commerce readiness is not applicable. The score reflects the absence of commerce capabilities, not a deficiency.`;

  return {
    readinessScore,
    isEcommerceSite: ecommerceSignals.isEcommerce,
    nonCommerceNote,
    detectedPlatforms,
    checklist,
    agentProtocolHints,
    apiEndpoints,
    recommendations,
    stats,
    auditedAt: new Date(),
  };
}
