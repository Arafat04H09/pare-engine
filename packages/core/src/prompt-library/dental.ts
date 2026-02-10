// Owner: S21 (Vertical Intelligence + Accuracy Scorer).
// Dental vertical prompt library — 25 GEO-specific prompts with [city] placeholder.
// Salvaged 5 prompts from packages/query-engine/src/prompts.ts and expanded to 25.

export interface VerticalPrompt {
  text: string;
  category: string;
  queryType: string;
}

/**
 * GEO-optimized prompts for the dental vertical.
 *
 * Categories:
 *  - discovery: "Who is the best..." / recommendation queries
 *  - service: Specific service/procedure queries
 *  - comparison: Cost/comparison queries
 *  - emergency: Urgent need queries
 *  - trust: Reviews, credentials, insurance queries
 *
 * All prompts contain [city] placeholder for location injection.
 */
export const DENTAL_PROMPTS: VerticalPrompt[] = [
  // --- Discovery (5) ---
  {
    text: 'Who is the best dentist in [city]?',
    category: 'discovery',
    queryType: 'recommendation',
  },
  {
    text: 'Recommend a family dentist in [city] that takes new patients',
    category: 'discovery',
    queryType: 'recommendation',
  },
  {
    text: 'What are the top-rated dental offices in [city]?',
    category: 'discovery',
    queryType: 'recommendation',
  },
  {
    text: 'Find a dentist near me in [city] with good reviews',
    category: 'discovery',
    queryType: 'recommendation',
  },
  {
    text: 'Which dental practice in [city] has the best patient experience?',
    category: 'discovery',
    queryType: 'recommendation',
  },

  // --- Service (7) ---
  {
    text: 'Recommend a cosmetic dentist near [city] for veneers',
    category: 'service',
    queryType: 'service_specific',
  },
  {
    text: 'Affordable dental implants [city]',
    category: 'service',
    queryType: 'service_specific',
  },
  {
    text: 'Pediatric dentist recommendations [city]',
    category: 'service',
    queryType: 'service_specific',
  },
  {
    text: 'Where can I get Invisalign in [city]?',
    category: 'service',
    queryType: 'service_specific',
  },
  {
    text: 'Best dentist for teeth whitening in [city]',
    category: 'service',
    queryType: 'service_specific',
  },
  {
    text: 'Who does dental crowns and bridges in [city]?',
    category: 'service',
    queryType: 'service_specific',
  },
  {
    text: 'Sedation dentistry options in [city] for anxious patients',
    category: 'service',
    queryType: 'service_specific',
  },

  // --- Comparison (5) ---
  {
    text: 'How much does a dental implant cost in [city]?',
    category: 'comparison',
    queryType: 'cost_comparison',
  },
  {
    text: 'Compare dental offices in [city] by price and quality',
    category: 'comparison',
    queryType: 'cost_comparison',
  },
  {
    text: 'What is the average cost of a root canal in [city]?',
    category: 'comparison',
    queryType: 'cost_comparison',
  },
  {
    text: 'Invisalign vs braces cost in [city]',
    category: 'comparison',
    queryType: 'cost_comparison',
  },
  {
    text: 'Is dental work cheaper at a dental school clinic near [city]?',
    category: 'comparison',
    queryType: 'cost_comparison',
  },

  // --- Emergency (3) ---
  {
    text: 'Emergency dentist open now in [city]',
    category: 'emergency',
    queryType: 'urgent',
  },
  {
    text: 'Where can I get a same-day dental appointment in [city]?',
    category: 'emergency',
    queryType: 'urgent',
  },
  {
    text: 'Broken tooth repair near [city] on weekends',
    category: 'emergency',
    queryType: 'urgent',
  },

  // --- Trust (5) ---
  {
    text: 'Which dentists in [city] accept Delta Dental insurance?',
    category: 'trust',
    queryType: 'trust_signal',
  },
  {
    text: 'Dentist in [city] with payment plans for uninsured patients',
    category: 'trust',
    queryType: 'trust_signal',
  },
  {
    text: 'Read reviews of dental practices in [city]',
    category: 'trust',
    queryType: 'trust_signal',
  },
  {
    text: 'Board-certified dentists in [city] with the most experience',
    category: 'trust',
    queryType: 'trust_signal',
  },
  {
    text: 'What should I look for when choosing a dentist in [city]?',
    category: 'trust',
    queryType: 'trust_signal',
  },
];
