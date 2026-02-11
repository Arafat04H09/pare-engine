// Owner: S21 (Vertical Intelligence + Accuracy Scorer).
// HVAC vertical prompt library — 25 GEO-specific prompts with placeholders.
// Covers all 5 scoring pillars: visibility, content, schema, technical, local.

import type { VerticalPrompt } from './dental.js';

/**
 * GEO-optimized prompts for the HVAC vertical.
 *
 * Pillar distribution:
 *  - visibility (10): Brand mention / recommendation / discovery queries
 *  - content (6): Cost / comparison / informational queries
 *  - local (5): Reviews, licensing, warranty, near-me queries
 *  - schema (2): Queries that test structured data surfacing
 *  - technical (2): Queries that probe site/mobile/accessibility signals
 *
 * Placeholders: [city], [businessName], [vertical]
 */
export const HVAC_PROMPTS: VerticalPrompt[] = [
  // --- Visibility (10) ---
  {
    text: 'Best HVAC company in [city]',
    category: 'discovery',
    queryType: 'recommendation',
    pillar: 'visibility',
  },
  {
    text: 'Who is the most reliable heating and cooling company in [city]?',
    category: 'discovery',
    queryType: 'recommendation',
    pillar: 'visibility',
  },
  {
    text: 'Top-rated HVAC contractors near [city]',
    category: 'discovery',
    queryType: 'recommendation',
    pillar: 'visibility',
  },
  {
    text: 'Who repairs heat pumps in [city]?',
    category: 'service',
    queryType: 'service_specific',
    pillar: 'visibility',
  },
  {
    text: 'AC installation services in [city]',
    category: 'service',
    queryType: 'service_specific',
    pillar: 'visibility',
  },
  {
    text: 'Ductless mini-split installation in [city]',
    category: 'service',
    queryType: 'service_specific',
    pillar: 'visibility',
  },
  {
    text: 'Emergency AC repair [city]',
    category: 'emergency',
    queryType: 'urgent',
    pillar: 'visibility',
  },
  {
    text: 'Furnace not working — who to call in [city]?',
    category: 'emergency',
    queryType: 'urgent',
    pillar: 'visibility',
  },
  {
    text: '24-hour HVAC emergency service in [city]',
    category: 'emergency',
    queryType: 'urgent',
    pillar: 'visibility',
  },
  {
    text: 'Is [businessName] a good [vertical] provider in [city]?',
    category: 'discovery',
    queryType: 'brand_check',
    pillar: 'visibility',
  },

  // --- Content (6) ---
  {
    text: 'Furnace replacement cost [city]',
    category: 'comparison',
    queryType: 'cost_comparison',
    pillar: 'content',
  },
  {
    text: 'How much does a new central air conditioner cost in [city]?',
    category: 'comparison',
    queryType: 'cost_comparison',
    pillar: 'content',
  },
  {
    text: 'Heat pump vs furnace cost in [city]',
    category: 'comparison',
    queryType: 'cost_comparison',
    pillar: 'content',
  },
  {
    text: 'What is a fair price for HVAC repair in [city]?',
    category: 'comparison',
    queryType: 'cost_comparison',
    pillar: 'content',
  },
  {
    text: 'Indoor air quality testing and filtration in [city]',
    category: 'service',
    queryType: 'service_specific',
    pillar: 'content',
  },
  {
    text: 'Air duct cleaning services near [city]',
    category: 'service',
    queryType: 'service_specific',
    pillar: 'content',
  },

  // --- Local / GBP (5) ---
  {
    text: 'Recommend an air conditioning company in [city] with good reviews',
    category: 'discovery',
    queryType: 'recommendation',
    pillar: 'local',
  },
  {
    text: 'Licensed and insured HVAC contractors in [city]',
    category: 'trust',
    queryType: 'trust_signal',
    pillar: 'local',
  },
  {
    text: 'HVAC companies in [city] with the best warranties',
    category: 'trust',
    queryType: 'trust_signal',
    pillar: 'local',
  },
  {
    text: 'Read reviews of HVAC contractors in [city]',
    category: 'trust',
    queryType: 'trust_signal',
    pillar: 'local',
  },
  {
    text: 'No heat emergency repair near [city] tonight',
    category: 'emergency',
    queryType: 'urgent',
    pillar: 'local',
  },

  // --- Schema (2) ---
  {
    text: 'What are [businessName] hours and service area in [city]?',
    category: 'service',
    queryType: 'structured_data',
    pillar: 'schema',
  },
  {
    text: 'Does [businessName] in [city] offer free HVAC estimates?',
    category: 'service',
    queryType: 'structured_data',
    pillar: 'schema',
  },

  // --- Technical (2) ---
  {
    text: 'Which HVAC companies in [city] offer free estimates?',
    category: 'discovery',
    queryType: 'recommendation',
    pillar: 'technical',
  },
  {
    text: 'Compare HVAC companies in [city] by price and warranty',
    category: 'comparison',
    queryType: 'cost_comparison',
    pillar: 'technical',
  },
];
