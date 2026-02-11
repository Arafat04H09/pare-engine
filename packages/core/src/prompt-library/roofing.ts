// Owner: S21 (Vertical Intelligence + Accuracy Scorer).
// Roofing vertical prompt library — 25 GEO-specific prompts with placeholders.
// Covers all 5 scoring pillars: visibility, content, schema, technical, local.

import type { VerticalPrompt } from './dental.js';

/**
 * GEO-optimized prompts for the roofing vertical.
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
export const ROOFING_PROMPTS: VerticalPrompt[] = [
  // --- Visibility (10) ---
  {
    text: 'Best roofing company in [city]',
    category: 'discovery',
    queryType: 'recommendation',
    pillar: 'visibility',
  },
  {
    text: 'Who is the most reliable roofer in [city]?',
    category: 'discovery',
    queryType: 'recommendation',
    pillar: 'visibility',
  },
  {
    text: 'Top-rated roofing contractors near [city]',
    category: 'discovery',
    queryType: 'recommendation',
    pillar: 'visibility',
  },
  {
    text: 'Recommend a roofing company in [city] for roof replacement',
    category: 'discovery',
    queryType: 'recommendation',
    pillar: 'visibility',
  },
  {
    text: 'Metal roof installation in [city]',
    category: 'service',
    queryType: 'service_specific',
    pillar: 'visibility',
  },
  {
    text: 'Commercial roofing contractor [city]',
    category: 'service',
    queryType: 'service_specific',
    pillar: 'visibility',
  },
  {
    text: 'Flat roof repair services in [city]',
    category: 'service',
    queryType: 'service_specific',
    pillar: 'visibility',
  },
  {
    text: 'Emergency roof leak repair [city]',
    category: 'emergency',
    queryType: 'urgent',
    pillar: 'visibility',
  },
  {
    text: 'Storm damage roof repair in [city]',
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
    text: 'How much does a new roof cost in [city]?',
    category: 'comparison',
    queryType: 'cost_comparison',
    pillar: 'content',
  },
  {
    text: 'Roof replacement vs roof repair — which should I choose in [city]?',
    category: 'comparison',
    queryType: 'cost_comparison',
    pillar: 'content',
  },
  {
    text: 'Shingle vs metal roof cost comparison in [city]',
    category: 'comparison',
    queryType: 'cost_comparison',
    pillar: 'content',
  },
  {
    text: 'What is the average cost of roof repair in [city]?',
    category: 'comparison',
    queryType: 'cost_comparison',
    pillar: 'content',
  },
  {
    text: 'How long does a roof replacement take in [city]?',
    category: 'service',
    queryType: 'service_specific',
    pillar: 'content',
  },
  {
    text: 'What should I know before hiring a roofer in [city]?',
    category: 'trust',
    queryType: 'trust_signal',
    pillar: 'content',
  },

  // --- Local / GBP (5) ---
  {
    text: 'Roofing companies in [city] with free inspection and estimates',
    category: 'discovery',
    queryType: 'recommendation',
    pillar: 'local',
  },
  {
    text: 'Licensed and insured roofers in [city]',
    category: 'trust',
    queryType: 'trust_signal',
    pillar: 'local',
  },
  {
    text: 'Read reviews of roofing companies in [city]',
    category: 'trust',
    queryType: 'trust_signal',
    pillar: 'local',
  },
  {
    text: 'Roofers in [city] who help with insurance claims',
    category: 'trust',
    queryType: 'trust_signal',
    pillar: 'local',
  },
  {
    text: 'Roofing contractors in [city] with the best warranties',
    category: 'trust',
    queryType: 'trust_signal',
    pillar: 'local',
  },

  // --- Schema (2) ---
  {
    text: 'What services does [businessName] offer in [city]?',
    category: 'service',
    queryType: 'structured_data',
    pillar: 'schema',
  },
  {
    text: 'Does [businessName] in [city] offer emergency roof repair?',
    category: 'service',
    queryType: 'structured_data',
    pillar: 'schema',
  },

  // --- Technical (2) ---
  {
    text: 'Compare roofing companies in [city] by price and reputation',
    category: 'comparison',
    queryType: 'cost_comparison',
    pillar: 'technical',
  },
  {
    text: 'Which roofing companies in [city] have the best customer service?',
    category: 'discovery',
    queryType: 'recommendation',
    pillar: 'technical',
  },
];
