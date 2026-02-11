# SPEC: B6 & B7 — Templates: Report & Email

## Priority
B — Parallel

## Dependencies
- Blocks: []
- Blocked by: [A6]

## Files OWNED (may create or modify)
- packages/core/src/report-templates/*
- packages/core/src/email-templates/*

## Files READ-ONLY (may import from, never modify)
- packages/core/src/contracts/report.contract.ts

## Acceptance Criteria
1. [ ] `report-templates`: Implement print-friendly CSS and responsive HTML.
2. [ ] Handle edge cases in templates: 0 scores, missing business data, long names.
3. [ ] `email-templates`: Implement preview mode and PDF attachment logic.
4. [ ] Ensure all templates use branded colors and fonts (Rule #aesthetics).
5. [ ] Puppeteer PDF generation tested with complex HTML.

## Implementation Notes
- Rule #stack: Puppeteer + HTML/CSS for PDFs (never React-PDF).
- Rule #stack: React Email + Resend for transactional email.

## Verification Command
pnpm test packages/core/src/tools/generate-pdf.test.ts
