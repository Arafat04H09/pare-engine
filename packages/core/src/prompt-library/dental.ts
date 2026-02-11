// Owner: S21 (Vertical Intelligence + Accuracy Scorer).
// Dental vertical prompt library — 25 GEO-specific prompts with placeholders.
// Covers all 5 scoring pillars: visibility, content, schema, technical, local.

export interface VerticalPrompt {
  text: string;
  category: string;
  queryType: string;
  pillar: 'visibility' | 'content' | 'schema' | 'technical' | 'local';
}

/**
 * GEO-optimized prompts for the dental vertical.
 *
 * Pillar distribution:
 *  - visibility (10): Brand mention / recommendation / discovery queries
 *  - content (6): Informational / comparison / educational queries
 *  - local (5): Reviews, insurance, near-me, directory-style queries
 *  - schema (2): Queries that test structured data surfacing (hours, services, booking)
 *  - technical (2): Queries that probe site/mobile/accessibility signals
 *
 * Placeholders: [city], [businessName], [vertical]
 */
export const DENTAL_PROMPTS: VerticalPrompt[] = [
  // --- Visibility (10) ---
  {
    text: 'Who is the best dentist in [city]?',
    category: 'discovery',
    queryType: 'recommendation',
    pillar: 'visibility',
  },
  {
    text: 'Recommend a family dentist in [city] that takes new patients',
    category: 'discovery',
    queryType: 'recommendation',
    pillar: 'visibility',
  },
  {
    text: 'What are the top-rated dental offices in [city]?',
    category: 'discovery',
    queryType: 'recommendation',
    pillar: 'visibility',
  },
  {
    text: 'Recommend a cosmetic dentist near [city] for veneers',
    category: 'service',
    queryType: 'service_specific',
    pillar: 'visibility',
  },
  {
    text: 'Pediatric dentist recommendations [city]',
    category: 'service',
    queryType: 'service_specific',
    pillar: 'visibility',
  },
  {
    text: 'Where can I get Invisalign in [city]?',
    category: 'service',
    queryType: 'service_specific',
    pillar: 'visibility',
  },
  {
    text: 'Best dentist for teeth whitening in [city]',
    category: 'service',
    queryType: 'service_specific',
    pillar: 'visibility',
  },
  {
    text: 'Who does dental crowns and bridges in [city]?',
    category: 'service',
    queryType: 'service_specific',
    pillar: 'visibility',
  },
  {
    text: 'Emergency dentist open now in [city]',
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
    text: 'How much does a dental implant cost in [city]?',
    category: 'comparison',
    queryType: 'cost_comparison',
    pillar: 'content',
  },
  {
    text: 'Invisalign vs braces cost in [city]',
    category: 'comparison',
    queryType: 'cost_comparison',
    pillar: 'content',
  },
  {
    text: 'What is the average cost of a root canal in [city]?',
    category: 'comparison',
    queryType: 'cost_comparison',
    pillar: 'content',
  },
  {
    text: 'Sedation dentistry options in [city] for anxious patients',
    category: 'service',
    queryType: 'service_specific',
    pillar: 'content',
  },
  {
    text: 'What should I look for when choosing a dentist in [city]?',
    category: 'trust',
    queryType: 'trust_signal',
    pillar: 'content',
  },
  {
    text: 'Affordable dental implants [city]',
    category: 'service',
    queryType: 'service_specific',
    pillar: 'content',
  },

  // --- Local / GBP (5) ---
  {
    text: 'Find a dentist near me in [city] with good reviews',
    category: 'discovery',
    queryType: 'recommendation',
    pillar: 'local',
  },
  {
    text: 'Which dentists in [city] accept Delta Dental insurance?',
    category: 'trust',
    queryType: 'trust_signal',
    pillar: 'local',
  },
  {
    text: 'Dentist in [city] with payment plans for uninsured patients',
    category: 'trust',
    queryType: 'trust_signal',
    pillar: 'local',
  },
  {
    text: 'Read reviews of dental practices in [city]',
    category: 'trust',
    queryType: 'trust_signal',
    pillar: 'local',
  },
  {
    text: 'Board-certified dentists in [city] with the most experience',
    category: 'trust',
    queryType: 'trust_signal',
    pillar: 'local',
  },

  // --- Schema (2) ---
  {
    text: 'What are [businessName] hours of operation in [city]?',
    category: 'service',
    queryType: 'structured_data',
    pillar: 'schema',
  },
  {
    text: 'Does [businessName] in [city] offer online appointment booking?',
    category: 'service',
    queryType: 'structured_data',
    pillar: 'schema',
  },

  // --- Technical (2) ---
  {
    text: 'Which dental practice in [city] has the best patient experience?',
    category: 'discovery',
    queryType: 'recommendation',
    pillar: 'technical',
  },
  {
    text: 'Compare dental offices in [city] by price and quality',
    category: 'comparison',
    queryType: 'cost_comparison',
    pillar: 'technical',
  },
];
