// Owner: S21 (Vertical Intelligence + Accuracy Scorer).
// Legal vertical prompt library — 25 GEO-specific prompts with placeholders.
// Covers all 5 scoring pillars: visibility, content, schema, technical, local.

import type { VerticalPrompt } from './dental.js';

/**
 * GEO-optimized prompts for the legal vertical.
 *
 * Pillar distribution:
 *  - visibility (10): Brand mention / recommendation / discovery queries
 *  - content (6): Cost / comparison / informational queries
 *  - local (5): Reviews, credentials, directory-style queries
 *  - schema (2): Queries that test structured data surfacing
 *  - technical (2): Queries that probe site/mobile/accessibility signals
 *
 * Placeholders: [city], [businessName], [vertical]
 */
export const LEGAL_PROMPTS: VerticalPrompt[] = [
  // --- Visibility (10) ---
  {
    text: 'Best personal injury lawyer in [city]',
    category: 'discovery',
    queryType: 'recommendation',
    pillar: 'visibility',
  },
  {
    text: 'Who is the most trusted attorney in [city]?',
    category: 'discovery',
    queryType: 'recommendation',
    pillar: 'visibility',
  },
  {
    text: 'Top-rated law firms in [city]',
    category: 'discovery',
    queryType: 'recommendation',
    pillar: 'visibility',
  },
  {
    text: 'Recommend a lawyer in [city] for a small business',
    category: 'discovery',
    queryType: 'recommendation',
    pillar: 'visibility',
  },
  {
    text: 'Estate planning attorney near [city]',
    category: 'service',
    queryType: 'service_specific',
    pillar: 'visibility',
  },
  {
    text: 'Top rated criminal defense lawyer [city]',
    category: 'service',
    queryType: 'service_specific',
    pillar: 'visibility',
  },
  {
    text: "Worker's comp attorney [city]",
    category: 'service',
    queryType: 'service_specific',
    pillar: 'visibility',
  },
  {
    text: 'I need a criminal defense lawyer right now in [city]',
    category: 'emergency',
    queryType: 'urgent',
    pillar: 'visibility',
  },
  {
    text: 'Car accident lawyer [city] — who should I call first?',
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
    text: 'How much does a divorce lawyer cost in [city]?',
    category: 'comparison',
    queryType: 'cost_comparison',
    pillar: 'content',
  },
  {
    text: 'Average cost of a personal injury lawyer in [city]',
    category: 'comparison',
    queryType: 'cost_comparison',
    pillar: 'content',
  },
  {
    text: 'What does an estate planning attorney charge in [city]?',
    category: 'comparison',
    queryType: 'cost_comparison',
    pillar: 'content',
  },
  {
    text: 'Flat fee vs hourly lawyers in [city] — which is better?',
    category: 'comparison',
    queryType: 'cost_comparison',
    pillar: 'content',
  },
  {
    text: 'Immigration lawyer in [city] who speaks Spanish',
    category: 'service',
    queryType: 'service_specific',
    pillar: 'content',
  },
  {
    text: 'What questions should I ask a lawyer before hiring them in [city]?',
    category: 'trust',
    queryType: 'trust_signal',
    pillar: 'content',
  },

  // --- Local / GBP (5) ---
  {
    text: 'Find a lawyer near me in [city] with free consultations',
    category: 'discovery',
    queryType: 'recommendation',
    pillar: 'local',
  },
  {
    text: 'Highest-rated attorneys in [city] on Avvo and Google',
    category: 'trust',
    queryType: 'trust_signal',
    pillar: 'local',
  },
  {
    text: 'Read client reviews of law firms in [city]',
    category: 'trust',
    queryType: 'trust_signal',
    pillar: 'local',
  },
  {
    text: 'Super Lawyers rated attorneys in [city]',
    category: 'trust',
    queryType: 'trust_signal',
    pillar: 'local',
  },
  {
    text: 'Emergency restraining order attorney in [city]',
    category: 'emergency',
    queryType: 'urgent',
    pillar: 'local',
  },

  // --- Schema (2) ---
  {
    text: 'What are [businessName] practice areas and office hours in [city]?',
    category: 'service',
    queryType: 'structured_data',
    pillar: 'schema',
  },
  {
    text: 'Does [businessName] in [city] offer free legal consultations?',
    category: 'service',
    queryType: 'structured_data',
    pillar: 'schema',
  },

  // --- Technical (2) ---
  {
    text: 'Compare law firms in [city] by client reviews and outcomes',
    category: 'comparison',
    queryType: 'cost_comparison',
    pillar: 'technical',
  },
  {
    text: 'Which lawyers in [city] have the most trial experience?',
    category: 'trust',
    queryType: 'trust_signal',
    pillar: 'technical',
  },
];
