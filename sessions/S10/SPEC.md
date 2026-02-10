# S10: Report Templates

## Mission
Design and build HTML/CSS report templates (9-page full audit + 1-page mini) with brand styling and inline SVG charts. Wire Puppeteer page.pdf() for PDF generation.

## Agent
GEMINI — Large HTML/CSS + inline SVG generation benefits from 2M context window for holding all brand guidelines, layout specs, and 9 page templates simultaneously.

## Input Contracts (read from `@pare-engine/core/contracts`)
- `FullReportData`, `MiniReportData`, `PdfOutput` from `report.contract.ts`
- `CompositeScore` from `scoring.contract.ts`
- `ReportFinding`, `PlatformSnapshot` from `report.contract.ts`

## Output Contracts (this session implements)
- `PdfOutput` from `report.contract.ts`

## Files OWNED (exclusive write access)
- `packages/core/src/report-templates/audit-full.html`
- `packages/core/src/report-templates/audit-mini.html`
- `packages/core/src/report-templates/styles.css`
- `packages/core/src/report-templates/charts.ts` (inline SVG generators)
- `packages/core/src/tools/generate-pdf.ts`

## Files READ-ONLY (import, do not modify)
- All contract files
- `packages/report-generator/src/styles.ts` (brand color reference: #1B2A4A, #00D4AA)
- `packages/report-generator/src/templates/MiniAudit.tsx` (layout reference only — wrong weights, React-PDF approach)
- `docs/WEBSITE_SPEC.md` (brand guidelines)
- `.claude/rules/reports.md`

## Scaffold Salvage
- `packages/report-generator/src/styles.ts` → Extract color values (#1B2A4A, #00D4AA, #22C55E, #EF4444) → CSS custom properties in `styles.css`
- `packages/report-generator/src/templates/MiniAudit.tsx` → Reference layout structure and conditional findings logic → HTML template design (but fix weight displays: /35 to /30, /25 to /15, /20 to /30)

## Dependencies
- S2 must complete first because it defines the `CompositeScore` shape from scoring contracts.
- Can use fixture data for scores — does NOT need real scorers to be functional.

## Exit Criteria
- `audit-full.html` renders 9 pages: Cover, Executive Summary, AI Visibility, Content Quality, Schema, Technical, GBP, AI Accuracy, Action Plan
- `audit-mini.html` renders 1 page: score, 5-pillar breakdown, top 3 findings, CTA
- Both use CSS from `styles.css` with brand colors as custom properties
- Score gauges/charts rendered as inline SVG (not client-side JS)
- `generatePdf(data: FullReportData | MiniReportData, type: 'full' | 'mini'): Promise<PdfOutput>` uses Puppeteer `page.pdf()` with `format: 'A4'`, `printBackground: true`
- Templates handle edge cases: very long business names (truncate), score of 0, missing GBP data, single provider
- All pillar max scores display correct values (30, 30, 15, 10, 15)
- PDFs render correctly when opened in a PDF reader

## Known Bugs to Fix
- `report-generator/src/templates/MiniAudit.tsx:34,37,40` — Displays /35, /25, /20 (old weights) — design reference only, but ensure new templates use /30, /30, /15, /10, /15
