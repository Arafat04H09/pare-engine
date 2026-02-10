import { AuditResult, QueryResult } from './types.js';

export const DEFAULT_WEIGHTS = {
  aiVisibility: 35,
  schema: 25,
  content: 20,
  technical: 10,
  gbp: 10
};

export function calculateOverallScore(audit: AuditResult): number {
  return Math.round(
    audit.aiVisibility.score +
    audit.schema.score +
    audit.content.score +
    audit.technical.score +
    audit.gbp.score
  );
}

export function scoreToGrade(score: number): string {
  if (score >= 93) return 'A';
  if (score >= 85) return 'B+';
  if (score >= 77) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 63) return 'C+';
  if (score >= 55) return 'C';
  if (score >= 47) return 'C-';
  if (score >= 40) return 'D+';
  if (score >= 33) return 'D';
  if (score >= 25) return 'D-';
  return 'F';
}

export function scoreAIVisibility(queryResults: QueryResult[]): number {
  if (queryResults.length === 0) return 0;

  const mentionRate = queryResults.filter(r => r.brandMentioned).length / queryResults.length;
  const citationRate = queryResults.filter(r => r.brandUrlCited).length / queryResults.length;

  const mentionedResults = queryResults.filter(r => r.brandMentioned);
  const avgPosition = mentionedResults.length > 0
    ? mentionedResults.reduce((sum, r) => sum + (r.brandPosition || 5), 0) / mentionedResults.length
    : 0;

  const positiveRate = mentionedResults.length > 0
    ? mentionedResults.filter(r => r.brandSentiment === 'positive').length / mentionedResults.length
    : 0;

  // Scoring breakdown:
  // Mention rate: 0-15 points
  const mentionPoints = Math.round(mentionRate * 15);
  // Citation rate: 0-10 points
  const citationPoints = Math.round(citationRate * 10);
  // Position quality: 0-5 points (lower position = better)
  // If avg position is 1, points = 5. If 5+, points = 0.
  const positionPoints = avgPosition > 0 ? Math.round(Math.max(0, (5 - avgPosition) / 4 * 5)) : 0;
  // Sentiment: 0-5 points
  const sentimentPoints = Math.round(positiveRate * 5);

  return Math.min(35, mentionPoints + citationPoints + positionPoints + sentimentPoints);
}

export function scoreSchema(
  presentTypes: string[],
  missingTypes: string[],
  validationErrors: string[],
  vertical: string
): number {
  const requiredTypes = getRequiredSchemaTypes(vertical);
  const recommendedTypes = getRecommendedSchemaTypes(vertical);

  const requiredPresent = requiredTypes.filter(t => presentTypes.includes(t));
  const recommendedPresent = recommendedTypes.filter(t => presentTypes.includes(t));

  // Required types: 0-15 points
  const requiredScore = Math.round((requiredPresent.length / requiredTypes.length) * 15);
  // Recommended types: 0-7 points
  const recommendedScore = Math.round((recommendedPresent.length / recommendedTypes.length) * 7);
  // Validation: 0-3 points (deduct for errors)
  const validationScore = Math.max(0, 3 - validationErrors.length);

  return Math.min(25, requiredScore + recommendedScore + validationScore);
}

function getRequiredSchemaTypes(vertical: string): string[] {
  const base = ['Organization', 'LocalBusiness', 'BreadcrumbList', 'WebSite'];
  const verticalSpecific: Record<string, string[]> = {
    dental: ['Dentist', 'FAQPage', 'MedicalProcedure'],
    legal: ['LegalService', 'Attorney', 'FAQPage'],
    hvac: ['HomeAndConstructionBusiness', 'FAQPage', 'Service'],
    accounting: ['ProfessionalService', 'AccountingService', 'FAQPage'],
    restaurant: ['Restaurant', 'Menu', 'FAQPage'],
  };
  return [...base, ...(verticalSpecific[vertical] || ['FAQPage'])];
}

function getRecommendedSchemaTypes(vertical: string): string[] {
  return ['Person', 'AggregateRating', 'Review', 'Article', 'HowTo', 'Service', 'Offer'];
}
