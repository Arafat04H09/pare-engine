// Owner: S8 (replaces S2 stub). Consumers: S9, S11, S12.
// Local/GBP + Third-Party pillar: 0-15 points
// Breakdown: GBP completeness (5pts), review quality (4pts), NAP consistency (3pts), directory presence (3pts)

import { SCORING_WEIGHTS, type GBPScore } from '../contracts/scoring.contract.js';
import type { GBPAnalysisOutput } from '../contracts/analysis.contract.js';

// --- Sub-score Maximums ---

const MAX_GBP_COMPLETENESS = 5;
const MAX_REVIEW_QUALITY = 4;
const MAX_NAP_CONSISTENCY = 3;
const MAX_DIRECTORY_PRESENCE = 3;

// --- Thresholds ---

/** Minimum rating to be considered "good" (out of 5) */
const GOOD_RATING = 4.0;
/** Minimum number of reviews for full review count credit */
const EXCELLENT_REVIEW_COUNT = 50;
/** Minimum number of reviews for partial review count credit */
const GOOD_REVIEW_COUNT = 15;
/** Number of photos for full photo credit */
const EXCELLENT_PHOTO_COUNT = 10;
/** Number of photos for partial photo credit */
const GOOD_PHOTO_COUNT = 5;

// --- GBP Completeness (0-5 points) ---
// Measures how completely the GBP profile is filled out:
//   - Has description (1pt)
//   - Description is optimized (0.5pt)
//   - Has primary category set (0.5pt)
//   - Has additional categories (0.5pt)
//   - Hours are complete for all 7 days (0.5pt)
//   - Has phone number (0.5pt)
//   - Has website URL (0.5pt)
//   - Has photos (0.5pt, +0.5pt if >= EXCELLENT_PHOTO_COUNT)

function scoreGBPCompleteness(analysis: GBPAnalysisOutput): { score: number; notes: string[] } {
  let score = 0;
  const notes: string[] = [];

  // Description (1.5pt total)
  if (analysis.hasDescription) {
    score += 1;
    if (analysis.descriptionOptimized) {
      score += 0.5;
    } else {
      notes.push('GBP description exists but is not optimized for AI discovery.');
    }
  } else {
    notes.push('GBP profile is missing a business description.');
  }

  // Primary category (0.5pt)
  if (analysis.primaryCategory && analysis.categoryAccuracy) {
    score += 0.5;
  } else if (!analysis.primaryCategory) {
    notes.push('No primary category set on GBP profile.');
  } else {
    notes.push('Primary category may not accurately reflect the business.');
  }

  // Additional categories (0.5pt)
  if (analysis.additionalCategories.length >= 2) {
    score += 0.5;
  } else if (analysis.additionalCategories.length > 0) {
    score += 0.25;
    notes.push('Consider adding more GBP categories to improve visibility.');
  } else {
    notes.push('No additional GBP categories set. Add relevant secondary categories.');
  }

  // Hours complete (0.5pt)
  if (analysis.hoursComplete) {
    score += 0.5;
  } else {
    notes.push('Business hours are incomplete. Ensure all 7 days are configured.');
  }

  // Phone (0.5pt)
  if (analysis.phone) {
    score += 0.5;
  } else {
    notes.push('No phone number on GBP profile.');
  }

  // Website (0.5pt)
  if (analysis.websiteUrl) {
    score += 0.5;
  } else {
    notes.push('No website URL on GBP profile.');
  }

  // Photos (0.5pt base, +0.5pt for excellent)
  if (analysis.photoCount >= EXCELLENT_PHOTO_COUNT) {
    score += 1;
  } else if (analysis.photoCount >= GOOD_PHOTO_COUNT) {
    score += 0.5;
    notes.push(`GBP has ${analysis.photoCount} photos. Aim for ${EXCELLENT_PHOTO_COUNT}+ for full credit.`);
  } else if (analysis.photoCount > 0) {
    score += 0.25;
    notes.push(`GBP has only ${analysis.photoCount} photos. Add more to improve engagement.`);
  } else {
    notes.push('No photos on GBP profile. Photos significantly improve engagement.');
  }

  return { score: Math.min(MAX_GBP_COMPLETENESS, Math.round(score * 10) / 10), notes };
}

// --- Review Quality (0-4 points) ---
// Measures review signals:
//   - Average rating (0-2pt): 4.5+ = 2, 4.0+ = 1.5, 3.5+ = 1, 3.0+ = 0.5
//   - Review count (0-1.5pt): 50+ = 1.5, 15+ = 1, 5+ = 0.5
//   - Has Q&A (0-0.5pt): presence of Q&A section

function scoreReviewQuality(analysis: GBPAnalysisOutput): { score: number; notes: string[] } {
  let score = 0;
  const notes: string[] = [];

  // Rating score (0-2pt)
  if (analysis.rating >= 4.5) {
    score += 2;
  } else if (analysis.rating >= GOOD_RATING) {
    score += 1.5;
  } else if (analysis.rating >= 3.5) {
    score += 1;
    notes.push(`Rating is ${analysis.rating}/5. Aim for 4.0+ for better AI visibility.`);
  } else if (analysis.rating >= 3.0) {
    score += 0.5;
    notes.push(`Rating is ${analysis.rating}/5. This is below the competitive threshold.`);
  } else if (analysis.rating > 0) {
    notes.push(`Rating is ${analysis.rating}/5. Significant improvement needed for AI recommendations.`);
  } else {
    notes.push('No rating available on GBP profile.');
  }

  // Review count (0-1.5pt)
  if (analysis.reviewCount >= EXCELLENT_REVIEW_COUNT) {
    score += 1.5;
  } else if (analysis.reviewCount >= GOOD_REVIEW_COUNT) {
    score += 1;
    notes.push(`${analysis.reviewCount} reviews. Aim for ${EXCELLENT_REVIEW_COUNT}+ for maximum score.`);
  } else if (analysis.reviewCount >= 5) {
    score += 0.5;
    notes.push(`Only ${analysis.reviewCount} reviews. More reviews improve AI engine trust signals.`);
  } else if (analysis.reviewCount > 0) {
    score += 0.25;
    notes.push(`Very few reviews (${analysis.reviewCount}). Prioritize review generation.`);
  } else {
    notes.push('No reviews on GBP profile. Reviews are critical for AI engine recommendations.');
  }

  // Q&A presence (0-0.5pt)
  if (analysis.hasQAndA) {
    score += 0.5;
  } else {
    notes.push('No Q&A section on GBP profile. Seed questions to provide structured answers.');
  }

  return { score: Math.min(MAX_REVIEW_QUALITY, Math.round(score * 10) / 10), notes };
}

// --- NAP Consistency (0-3 points) ---
// Measures Name/Address/Phone consistency across directories:
//   - All sources consistent = 3
//   - Partial consistency = proportional score
//   - No data = 0

function scoreNAPConsistency(analysis: GBPAnalysisOutput): { score: number; notes: string[] } {
  const notes: string[] = [];

  // If there are no NAP sources to compare, check if basic GBP NAP info exists
  if (analysis.napSources.length === 0) {
    if (analysis.napConsistent) {
      // No external sources but marked consistent (only GBP data available)
      return {
        score: Math.round(MAX_NAP_CONSISTENCY * 0.5 * 10) / 10,
        notes: ['No external directory listings found for NAP comparison. Verify and add listings.'],
      };
    }
    return {
      score: 0,
      notes: ['No directory listings found for NAP consistency check.'],
    };
  }

  // Calculate consistency rate across all sources
  let totalChecks = 0;
  let consistentChecks = 0;
  const inconsistentSources: string[] = [];

  for (const source of analysis.napSources) {
    const checks = [source.nameMatch, source.addressMatch, source.phoneMatch];
    totalChecks += checks.length;
    const sourceConsistent = checks.filter(Boolean).length;
    consistentChecks += sourceConsistent;
    if (sourceConsistent < checks.length) {
      const mismatches: string[] = [];
      if (!source.nameMatch) mismatches.push('name');
      if (!source.addressMatch) mismatches.push('address');
      if (!source.phoneMatch) mismatches.push('phone');
      inconsistentSources.push(`${source.source} (${mismatches.join(', ')} mismatch)`);
    }
  }

  const consistencyRate = totalChecks > 0 ? consistentChecks / totalChecks : 0;
  const score = Math.min(MAX_NAP_CONSISTENCY, Math.round(consistencyRate * MAX_NAP_CONSISTENCY * 10) / 10);

  if (inconsistentSources.length > 0) {
    notes.push(`NAP inconsistencies found: ${inconsistentSources.join('; ')}.`);
  }

  if (consistencyRate === 1) {
    notes.push(`NAP is consistent across all ${analysis.napSources.length} checked directories.`);
  }

  return { score, notes };
}

// --- Directory Presence (0-3 points) ---
// Measures presence in major local directories:
//   - Based on napSources count and diversity
//   - 5+ sources = full 3 points
//   - 3-4 sources = 2 points
//   - 1-2 sources = 1 point
//   - 0 sources = 0 points

function scoreDirectoryPresence(analysis: GBPAnalysisOutput): { score: number; notes: string[] } {
  const notes: string[] = [];
  const sourceCount = analysis.napSources.length;

  let score: number;
  if (sourceCount >= 5) {
    score = MAX_DIRECTORY_PRESENCE;
  } else if (sourceCount >= 3) {
    score = 2;
    notes.push(`Found ${sourceCount} directory listings. Expand to 5+ for full coverage.`);
  } else if (sourceCount >= 1) {
    score = 1;
    notes.push(`Only ${sourceCount} directory listing(s) found. Submit to major directories (Yelp, BBB, industry-specific).`);
  } else {
    score = 0;
    notes.push('No directory listings detected. Submit business to major directories for local SEO and AI visibility.');
  }

  return { score: Math.min(MAX_DIRECTORY_PRESENCE, score), notes };
}

// --- Public API ---

/**
 * Scores the Local/GBP + Third-Party pillar (0-15 points).
 *
 * Breakdown:
 * - GBP completeness: 0-5 points (description, categories, hours, phone, website, photos)
 * - Review quality: 0-4 points (rating, count, Q&A)
 * - NAP consistency: 0-3 points (name/address/phone match across directories)
 * - Directory presence: 0-3 points (number of directory listings)
 *
 * @param analysis - GBP analysis output. If undefined, returns a zero score.
 * @returns GBPScore with breakdown, notes, and metadata
 */
export function scoreLocalGBP(analysis?: GBPAnalysisOutput): GBPScore {
  const maxScore = SCORING_WEIGHTS.localGbp;

  // Handle missing GBP data gracefully
  if (!analysis) {
    return {
      score: 0,
      maxScore,
      breakdown: {
        gbpCompleteness: 0,
        reviewQuality: 0,
        napConsistency: 0,
        directoryPresence: 0,
      },
      notes: ['No GBP data available. If this is a local business, add a Google Business Profile to improve AI visibility.'],
      gbpComplete: false,
      reviewScore: 0,
      napConsistent: false,
    };
  }

  // Handle case where Place ID was not found (GBP may not exist)
  if (!analysis.placeId) {
    return {
      score: 0,
      maxScore,
      breakdown: {
        gbpCompleteness: 0,
        reviewQuality: 0,
        napConsistency: 0,
        directoryPresence: 0,
      },
      notes: ['No Google Business Profile found for this business. Create one at business.google.com to be discoverable by AI engines.'],
      gbpComplete: false,
      reviewScore: 0,
      napConsistent: false,
    };
  }

  // Calculate sub-scores
  const completeness = scoreGBPCompleteness(analysis);
  const reviews = scoreReviewQuality(analysis);
  const nap = scoreNAPConsistency(analysis);
  const directories = scoreDirectoryPresence(analysis);

  const rawScore = completeness.score + reviews.score + nap.score + directories.score;
  const score = Math.min(maxScore, Math.round(rawScore));

  // Collect all notes
  const notes = [
    ...completeness.notes,
    ...reviews.notes,
    ...nap.notes,
    ...directories.notes,
  ];

  // Determine if GBP is "complete" (>= 80% of completeness points)
  const gbpComplete = completeness.score >= MAX_GBP_COMPLETENESS * 0.8;

  return {
    score,
    maxScore,
    breakdown: {
      gbpCompleteness: completeness.score,
      reviewQuality: reviews.score,
      napConsistency: nap.score,
      directoryPresence: directories.score,
    },
    notes,
    gbpComplete,
    reviewScore: reviews.score,
    napConsistent: analysis.napConsistent,
  };
}
