// Owner: S21 (Vertical Intelligence + Accuracy Scorer).
// HVAC vertical prompt library — 25 GEO-specific prompts with [city] placeholder.
// Salvaged 5 prompts from packages/query-engine/src/prompts.ts and expanded to 25.

import type { VerticalPrompt } from './dental.js';

/**
 * GEO-optimized prompts for the HVAC vertical.
 *
 * Categories:
 *  - discovery: "Who is the best..." / recommendation queries
 *  - service: Specific service/procedure queries (AC, furnace, heat pump, ductwork)
 *  - comparison: Cost/comparison queries
 *  - emergency: Urgent need queries
 *  - trust: Reviews, licensing, warranty queries
 *
 * All prompts contain [city] placeholder for location injection.
 */
export const HVAC_PROMPTS: VerticalPrompt[] = [
  // --- Discovery (5) ---
  {
    text: 'Best HVAC company in [city]',
    category: 'discovery',
    queryType: 'recommendation',
  },
  {
    text: 'Who is the most reliable heating and cooling company in [city]?',
    category: 'discovery',
    queryType: 'recommendation',
  },
  {
    text: 'Top-rated HVAC contractors near [city]',
    category: 'discovery',
    queryType: 'recommendation',
  },
  {
    text: 'Recommend an air conditioning company in [city] with good reviews',
    category: 'discovery',
    queryType: 'recommendation',
  },
  {
    text: 'Which HVAC companies in [city] offer free estimates?',
    category: 'discovery',
    queryType: 'recommendation',
  },

  // --- Service (7) ---
  {
    text: 'Who repairs heat pumps in [city]?',
    category: 'service',
    queryType: 'service_specific',
  },
  {
    text: 'AC installation services in [city]',
    category: 'service',
    queryType: 'service_specific',
  },
  {
    text: 'Ductless mini-split installation in [city]',
    category: 'service',
    queryType: 'service_specific',
  },
  {
    text: 'Air duct cleaning services near [city]',
    category: 'service',
    queryType: 'service_specific',
  },
  {
    text: 'Who does annual HVAC maintenance in [city]?',
    category: 'service',
    queryType: 'service_specific',
  },
  {
    text: 'Commercial HVAC services available in [city]',
    category: 'service',
    queryType: 'service_specific',
  },
  {
    text: 'Indoor air quality testing and filtration in [city]',
    category: 'service',
    queryType: 'service_specific',
  },

  // --- Comparison (5) ---
  {
    text: 'Furnace replacement cost [city]',
    category: 'comparison',
    queryType: 'cost_comparison',
  },
  {
    text: 'How much does a new central air conditioner cost in [city]?',
    category: 'comparison',
    queryType: 'cost_comparison',
  },
  {
    text: 'Compare HVAC companies in [city] by price and warranty',
    category: 'comparison',
    queryType: 'cost_comparison',
  },
  {
    text: 'Heat pump vs furnace cost in [city]',
    category: 'comparison',
    queryType: 'cost_comparison',
  },
  {
    text: 'What is a fair price for HVAC repair in [city]?',
    category: 'comparison',
    queryType: 'cost_comparison',
  },

  // --- Emergency (4) ---
  {
    text: 'Emergency AC repair [city]',
    category: 'emergency',
    queryType: 'urgent',
  },
  {
    text: 'Furnace not working — who to call in [city]?',
    category: 'emergency',
    queryType: 'urgent',
  },
  {
    text: '24-hour HVAC emergency service in [city]',
    category: 'emergency',
    queryType: 'urgent',
  },
  {
    text: 'No heat emergency repair near [city] tonight',
    category: 'emergency',
    queryType: 'urgent',
  },

  // --- Trust (4) ---
  {
    text: 'Licensed and insured HVAC contractors in [city]',
    category: 'trust',
    queryType: 'trust_signal',
  },
  {
    text: 'HVAC companies in [city] with the best warranties',
    category: 'trust',
    queryType: 'trust_signal',
  },
  {
    text: 'Reliable plumber and HVAC [city]',
    category: 'trust',
    queryType: 'trust_signal',
  },
  {
    text: 'Read reviews of HVAC contractors in [city]',
    category: 'trust',
    queryType: 'trust_signal',
  },
];
