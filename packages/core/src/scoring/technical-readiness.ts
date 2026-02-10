// Owner: S6 (Technical Readiness). Replaces S2's stub.
// Technical Readiness pillar: 0-10 points
//
// Score breakdown (per SPEC.md / SCORING_ALGORITHM.md):
//   AI crawler access (robots.txt):  0-3 points
//   llms.txt present:                0-2 points (1 for llms.txt, 1 for llms-full.txt)
//   Sitemap:                         0-2 points (1 for present, 1 for valid)
//   HTTPS + mobile:                  0-2 points (1 each)
//   PageSpeed:                       0-1 point  (LCP < 2.5s)
//   Total:                           0-10 points

import type { TechnicalScore } from '../contracts/scoring.contract.js';
import type { TechnicalAnalysisOutput } from '../contracts/analysis.contract.js';

const AI_BOT_COUNT = 12;
const LCP_THRESHOLD_MS = 2500;

function scoreAiCrawlerAccess(analysis: TechnicalAnalysisOutput): number {
  const allowedCount = analysis.robotsTxt.allowedBots.length;
  const totalBots = allowedCount + analysis.robotsTxt.blockedBots.length;
  const denominator = totalBots > 0 ? totalBots : AI_BOT_COUNT;
  return Math.round((allowedCount / denominator) * 3);
}

function scoreLlmsTxt(analysis: TechnicalAnalysisOutput): number {
  let score = 0;
  if (analysis.llmsTxtPresent) score += 1;
  if (analysis.llmsFullTxtPresent) score += 1;
  return score;
}

function scoreSitemap(analysis: TechnicalAnalysisOutput): number {
  if (!analysis.sitemapPresent) return 0;
  let score = 1;
  if (analysis.sitemapUrlCount !== undefined && analysis.sitemapUrlCount > 0) score += 1;
  return score;
}

function scoreHttpsAndMobile(analysis: TechnicalAnalysisOutput): number {
  let score = 0;
  if (analysis.httpsEnabled) score += 1;
  if (analysis.mobileFriendly) score += 1;
  return score;
}

function scorePageSpeed(analysis: TechnicalAnalysisOutput): number {
  const lcp = analysis.coreWebVitals?.lcp;
  if (lcp === undefined || lcp === null) return 0;
  return lcp < LCP_THRESHOLD_MS ? 1 : 0;
}

export function scoreTechnicalReadiness(analysis: TechnicalAnalysisOutput): TechnicalScore {
  const notes: string[] = [];
  const aiCrawler = scoreAiCrawlerAccess(analysis);
  const llmsTxt = scoreLlmsTxt(analysis);
  const sitemap = scoreSitemap(analysis);
  const httpsMobile = scoreHttpsAndMobile(analysis);
  const pageSpeed = scorePageSpeed(analysis);

  if (analysis.robotsTxt.blockedBots.length > 0) {
    notes.push(`Blocked AI bots: ${analysis.robotsTxt.blockedBots.join(', ')}. Unblocking these in robots.txt is the #1 quick-fix technical improvement.`);
  }
  if (!analysis.robotsTxt.exists) {
    notes.push('No robots.txt found. All bots are allowed by default, which is fine.');
  }
  if (!analysis.llmsTxtPresent) {
    notes.push('No llms.txt file found. Adding one helps LLMs understand your site structure.');
  }
  if (!analysis.llmsFullTxtPresent && analysis.llmsTxtPresent) {
    notes.push('llms.txt present but llms-full.txt missing. Adding llms-full.txt provides comprehensive content for LLM consumption.');
  }
  if (!analysis.sitemapPresent) {
    notes.push('No sitemap.xml found. A sitemap helps AI crawlers discover all pages.');
  } else if (analysis.sitemapUrlCount !== undefined && analysis.sitemapUrlCount === 0) {
    notes.push('Sitemap.xml found but contains no URLs. Ensure it lists all important pages.');
  }
  if (!analysis.httpsEnabled) {
    notes.push('Site does not use HTTPS. This is a basic security and trust signal.');
  }
  if (!analysis.mobileFriendly) {
    notes.push('Site may not be mobile-friendly. Mobile usability is a ranking factor for all search engines.');
  }
  const lcp = analysis.coreWebVitals?.lcp;
  if (lcp !== undefined && lcp !== null && lcp >= LCP_THRESHOLD_MS) {
    notes.push(`Largest Contentful Paint (LCP) is ${Math.round(lcp)}ms, exceeding the 2500ms threshold. Improving LCP will boost both PageSpeed and user experience.`);
  }
  if (analysis.pageSpeedScore !== undefined && analysis.pageSpeedScore !== null) {
    notes.push(`PageSpeed performance score: ${analysis.pageSpeedScore}/100.`);
  }

  const totalScore = Math.round(aiCrawler + llmsTxt + sitemap + httpsMobile + pageSpeed);
  const clampedScore = Math.min(10, totalScore);

  return {
    score: clampedScore,
    maxScore: 10,
    breakdown: { aiCrawlerAccess: aiCrawler, llmsTxt, sitemap, httpsMobile, pageSpeed },
    notes,
    aiCrawlerAccess: analysis.robotsTxt.aiFriendly,
    llmsTxtPresent: analysis.llmsTxtPresent,
    sitemapPresent: analysis.sitemapPresent,
    httpsEnabled: analysis.httpsEnabled,
    mobileFriendly: analysis.mobileFriendly,
  };
}
