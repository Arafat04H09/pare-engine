// Owner: S21 (Vertical Intelligence + Accuracy Scorer).
// Chiropractic vertical prompt library — 25 GEO-specific prompts with placeholders.
// Covers all 5 scoring pillars: visibility, content, schema, technical, local.

import type { VerticalPrompt } from './dental.js';

/**
 * GEO-optimized prompts for the chiropractic vertical.
 *
 * Pillar distribution:
 *  - visibility (10): Brand mention / recommendation / discovery queries
 *  - content (6): Cost / comparison / informational queries
 *  - local (5): Reviews, credentials, near-me queries
 *  - schema (2): Queries that test structured data surfacing
 *  - technical (2): Queries that probe site/mobile/accessibility signals
 *
 * Placeholders: [city], [businessName], [vertical]
 */
export const CHIROPRACTIC_PROMPTS: VerticalPrompt[] = [
  // --- Visibility (10) ---
  {
    text: 'Best chiropractor in [city]',
    category: 'discovery',
    queryType: 'recommendation',
    pillar: 'visibility',
  },
  {
    text: 'Who is the top-rated chiropractor near [city]?',
    category: 'discovery',
    queryType: 'recommendation',
    pillar: 'visibility',
  },
  {
    text: 'Recommend a chiropractor in [city] for back pain',
    category: 'discovery',
    queryType: 'recommendation',
    pillar: 'visibility',
  },
  {
    text: 'Sports chiropractor in [city]',
    category: 'service',
    queryType: 'service_specific',
    pillar: 'visibility',
  },
  {
    text: 'Chiropractor for sciatica treatment in [city]',
    category: 'service',
    queryType: 'service_specific',
    pillar: 'visibility',
  },
  {
    text: 'Prenatal chiropractor near [city]',
    category: 'service',
    queryType: 'service_specific',
    pillar: 'visibility',
  },
  {
    text: 'Chiropractor for neck pain and headaches in [city]',
    category: 'service',
    queryType: 'service_specific',
    pillar: 'visibility',
  },
  {
    text: 'Pediatric chiropractor [city]',
    category: 'service',
    queryType: 'service_specific',
    pillar: 'visibility',
  },
  {
    text: 'Same-day chiropractic appointment in [city]',
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
    text: 'How much does a chiropractic adjustment cost in [city]?',
    category: 'comparison',
    queryType: 'cost_comparison',
    pillar: 'content',
  },
  {
    text: 'Chiropractic vs physical therapy for lower back pain in [city]',
    category: 'comparison',
    queryType: 'cost_comparison',
    pillar: 'content',
  },
  {
    text: 'Does chiropractic care help with herniated discs?',
    category: 'service',
    queryType: 'service_specific',
    pillar: 'content',
  },
  {
    text: 'How often should you see a chiropractor for chronic pain?',
    category: 'service',
    queryType: 'service_specific',
    pillar: 'content',
  },
  {
    text: 'What should I expect at my first chiropractic visit in [city]?',
    category: 'trust',
    queryType: 'trust_signal',
    pillar: 'content',
  },
  {
    text: 'Spinal decompression therapy cost in [city]',
    category: 'comparison',
    queryType: 'cost_comparison',
    pillar: 'content',
  },

  // --- Local / GBP (5) ---
  {
    text: 'Chiropractors in [city] that accept insurance',
    category: 'trust',
    queryType: 'trust_signal',
    pillar: 'local',
  },
  {
    text: 'Read reviews of chiropractors in [city]',
    category: 'trust',
    queryType: 'trust_signal',
    pillar: 'local',
  },
  {
    text: 'Find a chiropractor near me in [city] with evening hours',
    category: 'discovery',
    queryType: 'recommendation',
    pillar: 'local',
  },
  {
    text: 'Chiropractor in [city] with walk-in availability',
    category: 'emergency',
    queryType: 'urgent',
    pillar: 'local',
  },
  {
    text: 'Most experienced chiropractors in [city] area',
    category: 'trust',
    queryType: 'trust_signal',
    pillar: 'local',
  },

  // --- Schema (2) ---
  {
    text: 'What are [businessName] hours and location in [city]?',
    category: 'service',
    queryType: 'structured_data',
    pillar: 'schema',
  },
  {
    text: 'Does [businessName] in [city] offer online appointment scheduling?',
    category: 'service',
    queryType: 'structured_data',
    pillar: 'schema',
  },

  // --- Technical (2) ---
  {
    text: 'Compare chiropractic clinics in [city] by patient ratings',
    category: 'comparison',
    queryType: 'cost_comparison',
    pillar: 'technical',
  },
  {
    text: 'Which chiropractic offices in [city] have the best websites?',
    category: 'discovery',
    queryType: 'recommendation',
    pillar: 'technical',
  },
];
