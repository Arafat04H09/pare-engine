# Report Generation Rules

When working on PDF report templates or generation code:

## Approach
- Use **HTML/CSS templates rendered to PDF via Puppeteer `page.pdf()`**
- Do NOT use React-PDF / @react-pdf/renderer (CSS limitations, highest time-waster risk)

## Template Structure
- Templates are HTML files with CSS in `packages/core/src/report-templates/`
- Data injection via template literals or a lightweight templating engine (Handlebars or similar)
- Charts rendered as inline SVG (not client-side JS — must work in headless browser)

## Brand Guidelines
- Primary color (Deep Navy): #1B2A4A
- Accent color (Electric Teal): #00D4AA
- Warning/low score: #EF4444
- Success/high score: #22C55E
- Body font: Inter or system sans-serif
- Logo: "pare" lowercase, navy, clean

## Report Types
1. **Full Audit (9 pages):** Cover, Executive Summary, AI Visibility, Content, Schema, Technical, GBP, AI Accuracy, Action Plan
2. **Mini Audit (1 page):** Score, 5-pillar breakdown, top 3 findings, CTA
3. **Monthly Update (2 pages):** Score trend, week-over-week changes, key events

## PDF Generation Pattern
```typescript
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setContent(renderedHtml, { waitUntil: 'networkidle0' });
const pdf = await page.pdf({ format: 'A4', printBackground: true });
await browser.close();
```

## Testing
- Preview HTML templates in a browser before generating PDF
- Test with real audit data to verify layout doesn't break with edge cases (very long business names, 0 scores, missing GBP data)

## Contracts
- Report data: `packages/core/src/contracts/report.contract.ts` (`FullReportData`, `MiniReportData`, `PdfOutput`, `ReportFinding`)
- Scoring data: `packages/core/src/contracts/scoring.contract.ts` (`CompositeScore`)
- Import via: `import { FullReportData, PdfOutput } from '@pare-engine/core/contracts'`
