# S26: Agentic Commerce Readiness

## Mission
Build the agentic commerce readiness audit: checks Product/Offer schema, pricing transparency, API accessibility, and emerging AI shopping agent protocols.

## Agent
CLAUDE — Custom audit criteria definition, schema analysis, structured scoring.

## Input Contracts (read from `@pare-engine/core/contracts`)
- `SchemaAnalysisOutput` from `analysis.contract.ts`
- `CrawlOutput` from `crawl.contract.ts`

## Output Contracts (this session implements)
None — standalone audit module producing a readiness report.

## Files OWNED (exclusive write access)
- `packages/core/src/tools/agentic-commerce.ts`

## Files READ-ONLY (import, do not modify)
- All contract files
- `packages/core/src/tools/parse-jsonld.ts` (S7 — JSON-LD parsing)

## Scaffold Salvage
None

## Dependencies
- S7 must complete (schema analysis)
- S3 must complete (crawl data)
- Triggered by: e-commerce client requesting agentic commerce audit

## Exit Criteria
- `auditAgenticCommerce(crawlData: CrawlOutput, schemaAnalysis: SchemaAnalysisOutput)` returns readiness assessment
- Checks: Product/Offer schema presence, pricing in structured data, API endpoint detection, UCP/ACP protocol hints
- Returns: readiness score (0-100), checklist of present/missing capabilities, recommendations
- Handles: non-e-commerce sites (returns low score with "not applicable" note)

## Known Bugs to Fix
None — greenfield code
