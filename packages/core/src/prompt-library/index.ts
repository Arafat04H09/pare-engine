// Owner: S21 (Vertical Intelligence + Accuracy Scorer).
// Barrel export for the prompt library. Provides getPromptsForVertical() and
// getStructuredPromptsForVertical() for all supported verticals.

import type { VerticalPrompt } from './dental.js';
import { DENTAL_PROMPTS } from './dental.js';
import { HVAC_PROMPTS } from './hvac.js';
import { LEGAL_PROMPTS } from './legal.js';
import { CHIROPRACTIC_PROMPTS } from './chiropractic.js';
import { ROOFING_PROMPTS } from './roofing.js';

// Re-export the VerticalPrompt interface and per-vertical prompt arrays.
export type { VerticalPrompt };
export { DENTAL_PROMPTS } from './dental.js';
export { HVAC_PROMPTS } from './hvac.js';
export { LEGAL_PROMPTS } from './legal.js';
export { CHIROPRACTIC_PROMPTS } from './chiropractic.js';
export { ROOFING_PROMPTS } from './roofing.js';

// --- Supported verticals ---

export const SUPPORTED_VERTICALS = ['dental', 'hvac', 'legal', 'chiropractic', 'roofing'] as const;
export type SupportedVertical = (typeof SUPPORTED_VERTICALS)[number];

// --- Vertical → prompts map ---

const VERTICAL_PROMPT_MAP: Record<SupportedVertical, VerticalPrompt[]> = {
  dental: DENTAL_PROMPTS,
  hvac: HVAC_PROMPTS,
  legal: LEGAL_PROMPTS,
  chiropractic: CHIROPRACTIC_PROMPTS,
  roofing: ROOFING_PROMPTS,
};

// --- Custom error class ---

export class PromptLibraryError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'PromptLibraryError';
    this.code = code;
  }
}

// --- Public API ---

/**
 * Returns the raw VerticalPrompt[] for a given vertical, with placeholders replaced.
 * Supports [city], [businessName], and [vertical] placeholders.
 *
 * @param vertical - One of the supported verticals.
 * @param city - City name to inject into [city] placeholders.
 * @param businessName - Optional business name for [businessName] placeholders.
 * @returns Array of VerticalPrompt objects with placeholders replaced in the text field.
 * @throws PromptLibraryError if the vertical is not supported or city is empty.
 */
export function getStructuredPromptsForVertical(
  vertical: string,
  city: string,
  businessName?: string,
): VerticalPrompt[] {
  const normalizedVertical = vertical.toLowerCase().trim();

  if (!isSupportedVertical(normalizedVertical)) {
    throw new PromptLibraryError(
      `Unsupported vertical "${vertical}". Supported verticals: ${SUPPORTED_VERTICALS.join(', ')}`,
      'UNSUPPORTED_VERTICAL',
    );
  }

  const templates = VERTICAL_PROMPT_MAP[normalizedVertical];
  const trimmedCity = city.trim();

  if (trimmedCity.length === 0) {
    throw new PromptLibraryError(
      'City parameter must not be empty',
      'EMPTY_CITY',
    );
  }

  return templates.map((prompt) => ({
    ...prompt,
    text: replacePlaceholders(prompt.text, trimmedCity, normalizedVertical, businessName),
  }));
}

/**
 * Returns a plain string[] of prompts for a given vertical, with placeholders replaced.
 * This is the primary function consumed by the query engine pipeline.
 *
 * @param vertical - One of the supported verticals.
 * @param city - City name to inject into [city] placeholders.
 * @param businessName - Optional business name for [businessName] placeholders.
 * @returns Array of prompt strings with placeholders replaced.
 * @throws PromptLibraryError if the vertical is not supported.
 */
export function getPromptsForVertical(
  vertical: string,
  city: string,
  businessName?: string,
): string[] {
  return getStructuredPromptsForVertical(vertical, city, businessName).map((p) => p.text);
}

/**
 * Returns prompt templates (without placeholder replacement) for a given vertical.
 * Useful for seeding the promptLibrary DB table.
 *
 * @param vertical - One of the supported verticals.
 * @returns Array of VerticalPrompt objects with placeholders intact.
 * @throws PromptLibraryError if the vertical is not supported.
 */
export function getTemplatesForVertical(
  vertical: string,
): VerticalPrompt[] {
  const normalizedVertical = vertical.toLowerCase().trim();

  if (!isSupportedVertical(normalizedVertical)) {
    throw new PromptLibraryError(
      `Unsupported vertical "${vertical}". Supported verticals: ${SUPPORTED_VERTICALS.join(', ')}`,
      'UNSUPPORTED_VERTICAL',
    );
  }

  return [...VERTICAL_PROMPT_MAP[normalizedVertical]];
}

/**
 * Returns all templates across all supported verticals.
 * Useful for bulk-seeding the promptLibrary DB table.
 *
 * @returns Array of { vertical, prompts } for every supported vertical.
 */
export function getAllTemplates(): Array<{
  vertical: SupportedVertical;
  prompts: VerticalPrompt[];
}> {
  return SUPPORTED_VERTICALS.map((vertical) => ({
    vertical,
    prompts: [...VERTICAL_PROMPT_MAP[vertical]],
  }));
}

// --- Internal helpers ---

function isSupportedVertical(value: string): value is SupportedVertical {
  return (SUPPORTED_VERTICALS as readonly string[]).includes(value);
}

function replacePlaceholders(
  text: string,
  city: string,
  vertical: string,
  businessName?: string,
): string {
  let result = text.replace(/\[city\]/g, city).replace(/\[vertical\]/g, vertical);
  if (businessName) {
    result = result.replace(/\[businessName\]/g, businessName);
  }
  return result;
}
