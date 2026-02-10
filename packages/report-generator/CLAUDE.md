# @pare-engine/report-generator — MIGRATION TARGET

## Status: TO BE REFACTORED

This package uses `@react-pdf/renderer` which will be replaced with HTML/CSS templates + Puppeteer `page.pdf()`. Report templates will move to `packages/core/src/report-templates/`.

## What's Here (Current)
- `src/templates/MiniAudit.tsx` — React-PDF component with Pare branding. Good design reference for colors, layout, and content structure.
- `src/styles.ts` — Color palette and typography definitions. Keep these values.
- `src/index.ts` — `generateMiniAuditPDF()` using `renderToStream()`. Replace with Puppeteer.

## Why We're Migrating Away From React-PDF
1. Limited CSS model (no grid, limited flexbox, no custom fonts easily)
2. Identified as #1 time-waster risk in feasibility analysis (80% likelihood of 1-2 weeks lost)
3. Can't reuse web CSS/components
4. Debugging requires re-rendering (can't preview in browser)

## What Replaces It
HTML/CSS templates rendered by Puppeteer:
```typescript
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setContent(renderedHtml, { waitUntil: 'networkidle0' });
const pdf = await page.pdf({ format: 'A4', printBackground: true });
await browser.close();
```

Benefits:
- Full CSS support (grid, flexbox, custom fonts, SVG)
- Templates are debuggable in a browser
- Same CSS knowledge applies to web and PDFs
- Charts as inline SVG (server-rendered, no client-side JS)

## What to Keep (as design reference)
- Brand colors from `styles.ts`: navy #1B2A4A, teal #00D4AA
- Layout structure from `MiniAudit.tsx`: header → hero score → pillars → findings → footer
- The conditional findings logic (show different bullets based on data)

## Target Location
`packages/core/src/report-templates/`:
- `audit-full.html` — 9-page full audit template
- `audit-mini.html` — 1-page mini-audit template
- `styles.css` — Shared CSS with brand variables
- `render.ts` — Puppeteer rendering function

## Migration Checklist
- [ ] Create HTML/CSS version of mini-audit template
- [ ] Create HTML/CSS version of full audit template (9 pages)
- [ ] Create `render.ts` with Puppeteer PDF generation
- [ ] Add inline SVG chart generation for score visualizations
- [ ] Test with real audit data
- [ ] Delete this package once migration is complete
