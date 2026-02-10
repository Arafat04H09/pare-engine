# S21 Status

- **Status**: complete
- **Started**: 2026-02-10
- **Completed**: 2026-02-10
- **Branch**: session/S21-vertical

## Files Created
- `packages/core/src/prompt-library/index.ts` — Barrel export + `getPromptsForVertical()`, `getStructuredPromptsForVertical()`, `getTemplatesForVertical()`, `getAllTemplates()`
- `packages/core/src/prompt-library/dental.ts` — 25 dental GEO prompts with [city] placeholder
- `packages/core/src/prompt-library/hvac.ts` — 25 HVAC GEO prompts with [city] placeholder
- `packages/core/src/prompt-library/legal.ts` — 25 legal GEO prompts with [city] placeholder
- `packages/core/src/tools/accuracy-scorer.ts` — `scoreAccuracy()` comparing AI claims vs GBP known-truth

## Files Modified
(none)

## Deviations from Spec
(none)

## Blockers
(none)

## Notes
- Salvaged all 15 scaffold prompts from `packages/query-engine/src/prompts.ts` and expanded to 25 per vertical (75 total).
- Each vertical covers 5 prompt categories: discovery, service, comparison, emergency, trust.
- The `VerticalPrompt` interface is defined in `dental.ts` and re-exported from `index.ts` to avoid duplicate type definitions.
- The accuracy scorer checks 3 claim fields (phone, address, business name) across all engine responses and produces a 0-100 score.
- `pnpm --filter @pare-engine/core build` passes cleanly.
