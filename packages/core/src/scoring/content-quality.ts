// Owner: S5 (replaces S2 stub). Consumers: S11, S12.
// Content Quality pillar: 0-30 points

import { SCORING_WEIGHTS, type ContentQualityScore } from '../contracts/scoring.contract.js';
import type { ContentAnalysisOutput } from '../contracts/analysis.contract.js';

const MAX_AF = 8, MAX_FAQ = 5, MAX_STATS = 5, MAX_AUTH = 4, MAX_DEPTH = 4, MAX_FRESH = 4;
const DEPTH_EXC = 1000, DEPTH_GOOD = 600, DEPTH_ADQ = 300;

function scoreAF(avg: number): number { return Math.min(MAX_AF, Math.round((avg / 10) * MAX_AF * 10) / 10); }
function scoreFAQ(faqCount: number, total: number): number { if (total === 0) return 0; return Math.min(MAX_FAQ, Math.round((faqCount / total) * 10 * 10) / 10); }
function scoreSD(avg: number): number { return Math.min(MAX_STATS, Math.round(avg * 10) / 10); }
function scoreAA(rate: number): number { return Math.min(MAX_AUTH, Math.round(rate * MAX_AUTH * 10) / 10); }

function scoreDepth(pages: ContentAnalysisOutput['pages']): number {
  if (pages.length === 0) return 0;
  const avgW = pages.reduce((s, p) => s + p.wordCount, 0) / pages.length;
  const avgD = pages.reduce((s, p) => s + p.depthScore, 0) / pages.length;
  let wcs: number;
  if (avgW >= DEPTH_EXC) wcs = MAX_DEPTH;
  else if (avgW >= DEPTH_GOOD) wcs = 3;
  else if (avgW >= DEPTH_ADQ) wcs = 2;
  else wcs = Math.min(1, avgW / DEPTH_ADQ);
  const lds = (avgD / 10) * MAX_DEPTH;
  return Math.min(MAX_DEPTH, Math.round((wcs * 0.4 + lds * 0.6) * 10) / 10);
}

function scoreFresh(pages: ContentAnalysisOutput['pages']): number {
  if (pages.length === 0) return 0;
  const hdp = pages.filter((p) => p.depthScore >= 7).length;
  return Math.min(MAX_FRESH, Math.round((1 + (hdp / pages.length) * 3) * 10) / 10);
}

export function scoreContentQuality(analysis?: ContentAnalysisOutput): ContentQualityScore {
  const maxScore = SCORING_WEIGHTS.contentQuality;
  if (!analysis) {
    return { score: 0, maxScore, breakdown: { answerFirst: 0, faqPresence: 0, statisticsDensity: 0, authorAttribution: 0, contentDepth: 0, freshness: 0 }, notes: ['No content analysis data provided.'], avgAnswerFirstScore: 0, faqCoverage: 0, statsDensity: 0, authorAttributionRate: 0 };
  }
  const tp = analysis.pages.length;
  const notes: string[] = [];
  const af = scoreAF(analysis.averageAnswerFirstScore);
  const faq = scoreFAQ(analysis.faqPageCount, tp);
  const sd = scoreSD(analysis.averageStatsDensity);
  const aa = scoreAA(analysis.authorAttributionRate);
  const cd = scoreDepth(analysis.pages);
  const fr = scoreFresh(analysis.pages);
  const score = Math.min(maxScore, Math.round(af + faq + sd + aa + cd + fr));
  if (tp === 0) notes.push('No pages were analyzed.');
  if (af < MAX_AF * 0.5) notes.push('Answer-first formatting is weak (' + af + '/' + MAX_AF + ').');
  if (faq === 0) notes.push('No FAQ or Q&A content detected.');
  if (sd < 2) notes.push('Low statistics density (' + sd + '/' + MAX_STATS + ').');
  if (aa < MAX_AUTH * 0.5) notes.push('Author attribution is low (' + aa + '/' + MAX_AUTH + ').');
  if (cd < MAX_DEPTH * 0.5) notes.push('Content depth is insufficient (' + cd + '/' + MAX_DEPTH + ').');
  return { score, maxScore, breakdown: { answerFirst: af, faqPresence: faq, statisticsDensity: sd, authorAttribution: aa, contentDepth: cd, freshness: fr }, notes, avgAnswerFirstScore: analysis.averageAnswerFirstScore, faqCoverage: tp > 0 ? analysis.faqPageCount / tp : 0, statsDensity: analysis.averageStatsDensity, authorAttributionRate: analysis.authorAttributionRate };
}
