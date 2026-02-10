// Owner: S21 (Vertical Intelligence + Accuracy Scorer).
// Barrel export for the prompt library. Provides getPromptsForVertical() and
// getStructuredPromptsForVertical() for all supported verticals.

import type { VerticalPrompt } from './dental.js';
import { DENTAL_PROMPTS } from './dental.js';
import { HVAC_PROMPTS } from './hvac.js';
import { LEGAL_PROMPTS } from './legal.js';

// Re-export the VerticalPrompt interface and per-vertical prompt arrays.
export type { VerticalPrompt };
export { DENTAL_PROMPTS } from './dental.js';
export { HVAC_PROMPTS } from './hvac.js';
export { LEGAL_PROMPTS } from './legal.js';

// --- Supported verticals ---

export const SUPPORTED_VERTICALS = ['dental', 'hvac', 'legal'] as const;
export type SupportedVertical = (typeof SUPPORTED_VERTICALS)[number];

// --- Vertical → prompts map ---

const VERTICAL_PROMPT_MAP: Record<SupportedVertical, VerticalPrompt[]> = {
  dental: DENTAL_PROMPTS,
  hvac: HVAC_PROMPTS,
  legal: LEGAL_PROMPTS,
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
 * Returns the raw VerticalPrompt[] for a given vertical, with [city] replaced.
 * Useful when the caller needs category/queryType metadata alongside each prompt.
 *
 * @param vertical - One of the supported verticals (dental, hvac, legal).
 * @param city - City name to inject into [city] placeholders.
 * @returns Array of VerticalPrompt objects with [city] replaced in the text field.
 * @throws PromptLibraryError if the vertical is not supported.
 */
export function getStructuredPromptsForVertical(
  vertical: string,
  city: string,
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
    text: prompt.text.replace(/\[city\]/g, trimmedCity),
  }));
}

/**
 * Returns a plain string[] of prompts for a given vertical, with [city] replaced.
 * This is the primary function consumed by the query engine pipeline.
 *
 * Matches the scaffold `generatePrompts(vertical, city)` pattern from
 * packages/query-engine/src/prompts.ts but with 20+ prompts per vertical.
 *
 * @param vertical - One of the supported verticals (dental, hvac, legal).
 * @param city - City name to inject into [city] placeholders.
 * @returns Array of prompt strings with [city] replaced.
 * @throws PromptLibraryError if the vertical is not supported.
 */
export function getPromptsForVertical(
  vertical: string,
  city: string,
): string[] {
  return getStructuredPromptsForVertical(vertical, city).map((p) => p.text);
}

/**
 * Returns prompt templates (without city replacement) for a given vertical.
 * Useful for seeding the promptLibrary DB table.
 *
 * @param vertical - One of the supported verticals (dental, hvac, legal).
 * @returns Array of VerticalPrompt objects with [city] placeholder intact.
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

// --- Type guard ---

function isSupportedVertical(value: string): value is SupportedVertical {
  return (SUPPORTED_VERTICALS as readonly string[]).includes(value);
}
