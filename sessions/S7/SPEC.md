# S7: Schema Scoring

## Mission
Build the Schema/Structured Data scoring function (15 points) with custom JSON-LD parsing from Firecrawl HTML output.

## Agent
CLAUDE — JSON-LD parsing logic, scoring function, Zod schema validation.

## Input Contracts (read from `@pare-engine/core/contracts`)
- `SchemaAnalysisOutput` from `analysis.contract.ts`
- `SchemaPageAnalysis` from `analysis.contract.ts`
- `SchemaScore` from `scoring.contract.ts`
- `CrawledPage` from `crawl.contract.ts`

## Output Contracts (this session implements)
- `SchemaAnalysisOutput` from `analysis.contract.ts`
- `SchemaScore` from `scoring.contract.ts`

## Files OWNED (exclusive write access)
- `packages/core/src/tools/parse-jsonld.ts`
- `packages/core/src/scoring/schema-completeness.ts` (replaces S2's stub)
- `apps/audit-runner/src/steps/analyze-schema.ts`

## Files READ-ONLY (import, do not modify)
- All contract files
- `packages/site-crawler/src/schema.ts` (reference — cheerio JSON-LD extraction is correct)
- `packages/core/src/scoring.ts` (reference — `getRequiredSchemaTypes()` and `getRecommendedSchemaTypes()` are correct)

## Scaffold Salvage
- `packages/site-crawler/src/schema.ts` → Keep `analyzeSchema()` cheerio pattern and `extractTypes()` recursive logic → `tools/parse-jsonld.ts`
- `packages/core/src/scoring.ts` → Keep `getRequiredSchemaTypes()` and `getRecommendedSchemaTypes()` → `scoring/schema-completeness.ts`

## Dependencies
- S2 must complete first because S7 replaces the schema-completeness.ts stub S2 creates
- S3 must complete first because S7 needs CrawledPage HTML for JSON-LD extraction

## Exit Criteria
- `parseJsonLd(html: string, url: string): SchemaPageAnalysis` extracts JSON-LD from HTML, identifies types, reports validation errors
- `analyzeSchema(pages: CrawledPage[], vertical: string): SchemaAnalysisOutput` runs parsing across all pages, computes missing types
- `scoreSchemaCompleteness(analysis: SchemaAnalysisOutput): SchemaScore` returns 0-15
- Score breakdown: required types present (8pts), recommended types (4pts), validation (3pts)
- Sub-scores sum to exactly 15 max (NOT 25 like the old code)
- Tests for: no JSON-LD, perfect schema, partial schema, invalid JSON-LD syntax

## Known Bugs to Fix
- `scoring.ts:83` — Schema cap is 25 → must be 15
- `scoring.ts:77-83` — Schema sub-scores sum to 25 (15+7+3) → must sum to 15 (8+4+3)
