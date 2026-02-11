# SPEC: B8 — Prompt Library

## Priority
B — Parallel

## Dependencies
- Blocks: [C1, C8]
- Blocked by: [A6]

## Files OWNED (may create or modify)
- packages/core/src/prompt-library/*

## Files READ-ONLY (may import from, never modify)
- packages/core/src/contracts/query.contract.ts

## Acceptance Criteria
1. [ ] Ensure all verticals have 20+ prompts covering all 5 pillars.
2. [ ] Templates use `[city]`, `[businessName]`, `[vertical]` placeholders.
3. [ ] Categorize prompts by pillar (Visibility, Content, etc.).
4. [ ] Implement a system to load/select prompts based on vertical.

## Implementation Notes
- Reference Rule #8: Prompts must encourage LLM-based sentiment analysis.
- Verticals: 'dental', 'legal', 'chiropractic', 'hvac', 'roofing', etc.

## Verification Command
pnpm build
