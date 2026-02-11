// Barrel export for all core tools
// Task 0.1: Enables `import { crawlSite } from '@pare-engine/core/tools'`

// Crawl & Discovery
export * from './crawl-site.js';
export * from './query-engines.js';

// Parsing & Extraction
export * from './parse-jsonld.js';
export * from './parse-response.js';
export * from './normalize-citations.js';

// External API Wrappers
export * from './pagespeed.js';
export * from './google-places.js';
export * from './dataforseo.js';
export * from './serper.js';

// Generation
export * from './generate-pdf.js';
export * from './generate-faq.js';
export * from './generate-jsonld.js';
export * from './generate-llmstxt.js';
export * from './generate-proposal.js';

// Delivery & Sync
export * from './send-report.js';
export * from './sync-notion.js';

// Scoring & Analysis
export * from './score-delta.js';
export * from './accuracy-scorer.js';
// score-alerts.ts has its own ScoreDeltaResult that conflicts with score-delta.ts — rename on re-export
export {
  OVERALL_DELTA_THRESHOLD,
  PILLAR_DELTA_THRESHOLD,
  ScoreAlertError,
  type ScoreDeltaResult as AlertDetectionResult,
  type DetectScoreDeltasInput,
  attributeCauses,
  shouldAlert,
  detectScoreDeltas,
} from './score-alerts.js';

// Monitoring
export * from './review-scraper.js';
export * from './social-monitor.js';
export * from './crawler-analytics.js';

// Competitive Intelligence (Batch 2)
export * from './normalize-competitor.js';
export * from './share-of-voice.js';
export * from './analyze-competitor.js';
export * from './generate-prompt-permutations.js';

// Advanced Audit Modules (Batch 3)
export * from './audit-adversarial.js';
export * from './scan-hallucinations.js';
export * from './extract-media.js';
export * from './analyze-video-seo.js';
export * from './generate-video-schema.js';
export * from './generate-personas.js';
export * from './generate-citation-graph.js';

// Optimization & Commerce
export * from './agentic-commerce.js';
export * from './content-optimizer.js';

// Vertical Intelligence (Task 1.4)
export * from './seed-prompts.js';
export * from './select-prompts.js';

// Review Semantics & Campaign (Task 4.1)
export * from './analyze-review-semantics.js';
export * from './generate-review-campaign.js';

// AIO & Bot Analysis (Task 4.3)
export * from './aio-detect.js';
export * from './bot-analyzer.js';
