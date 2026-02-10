// Owner: S21 (Vertical Intelligence + Accuracy Scorer).
// Legal vertical prompt library — 25 GEO-specific prompts with [city] placeholder.
// Salvaged 5 prompts from packages/query-engine/src/prompts.ts and expanded to 25.

import type { VerticalPrompt } from './dental.js';

/**
 * GEO-optimized prompts for the legal vertical.
 *
 * Categories:
 *  - discovery: "Who is the best..." / recommendation queries
 *  - service: Specific practice area queries
 *  - comparison: Cost/comparison queries
 *  - emergency: Urgent need queries (arrests, accidents)
 *  - trust: Reviews, credentials, experience queries
 *
 * All prompts contain [city] placeholder for location injection.
 */
export const LEGAL_PROMPTS: VerticalPrompt[] = [
  // --- Discovery (5) ---
  {
    text: 'Best personal injury lawyer in [city]',
    category: 'discovery',
    queryType: 'recommendation',
  },
  {
    text: 'Who is the most trusted attorney in [city]?',
    category: 'discovery',
    queryType: 'recommendation',
  },
  {
    text: 'Top-rated law firms in [city]',
    category: 'discovery',
    queryType: 'recommendation',
  },
  {
    text: 'Recommend a lawyer in [city] for a small business',
    category: 'discovery',
    queryType: 'recommendation',
  },
  {
    text: 'Find a lawyer near me in [city] with free consultations',
    category: 'discovery',
    queryType: 'recommendation',
  },

  // --- Service (7) ---
  {
    text: 'Estate planning attorney near [city]',
    category: 'service',
    queryType: 'service_specific',
  },
  {
    text: 'Top rated criminal defense lawyer [city]',
    category: 'service',
    queryType: 'service_specific',
  },
  {
    text: "Worker's comp attorney [city]",
    category: 'service',
    queryType: 'service_specific',
  },
  {
    text: 'Immigration lawyer in [city] who speaks Spanish',
    category: 'service',
    queryType: 'service_specific',
  },
  {
    text: 'Real estate attorney for home closing in [city]',
    category: 'service',
    queryType: 'service_specific',
  },
  {
    text: 'Family law attorney for custody case in [city]',
    category: 'service',
    queryType: 'service_specific',
  },
  {
    text: 'Bankruptcy lawyer in [city] who handles Chapter 7',
    category: 'service',
    queryType: 'service_specific',
  },

  // --- Comparison (5) ---
  {
    text: 'How much does a divorce lawyer cost in [city]?',
    category: 'comparison',
    queryType: 'cost_comparison',
  },
  {
    text: 'Average cost of a personal injury lawyer in [city]',
    category: 'comparison',
    queryType: 'cost_comparison',
  },
  {
    text: 'Compare law firms in [city] by client reviews and outcomes',
    category: 'comparison',
    queryType: 'cost_comparison',
  },
  {
    text: 'What does an estate planning attorney charge in [city]?',
    category: 'comparison',
    queryType: 'cost_comparison',
  },
  {
    text: 'Flat fee vs hourly lawyers in [city] — which is better?',
    category: 'comparison',
    queryType: 'cost_comparison',
  },

  // --- Emergency (3) ---
  {
    text: 'I need a criminal defense lawyer right now in [city]',
    category: 'emergency',
    queryType: 'urgent',
  },
  {
    text: 'Car accident lawyer [city] — who should I call first?',
    category: 'emergency',
    queryType: 'urgent',
  },
  {
    text: 'Emergency restraining order attorney in [city]',
    category: 'emergency',
    queryType: 'urgent',
  },

  // --- Trust (5) ---
  {
    text: 'Highest-rated attorneys in [city] on Avvo and Google',
    category: 'trust',
    queryType: 'trust_signal',
  },
  {
    text: 'Which lawyers in [city] have the most trial experience?',
    category: 'trust',
    queryType: 'trust_signal',
  },
  {
    text: 'Read client reviews of law firms in [city]',
    category: 'trust',
    queryType: 'trust_signal',
  },
  {
    text: 'Super Lawyers rated attorneys in [city]',
    category: 'trust',
    queryType: 'trust_signal',
  },
  {
    text: 'What questions should I ask a lawyer before hiring them in [city]?',
    category: 'trust',
    queryType: 'trust_signal',
  },
];
