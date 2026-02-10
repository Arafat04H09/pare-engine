# S18: Implementation Engine

## Mission
Build the "Fix It" generators: JSON-LD schema generator, llms.txt generator, and FAQ generator. These turn audit findings into deliverable files.

## Agent
CLAUDE — LLM generation with Zod schemas (generateObject patterns) and structured output per CLAUDE.md mandates.

## Input Contracts (read from `@pare-engine/core/contracts`)
- `SchemaAnalysisOutput` from `analysis.contract.ts`
- `ContentAnalysisOutput` from `analysis.contract.ts`
- `CrawlOutput` from `crawl.contract.ts`

## Output Contracts (this session implements)
None — generates files, not library types. Output is string content (JSON-LD, markdown, HTML).

## Files OWNED (exclusive write access)
- `packages/core/src/tools/generate-jsonld.ts`
- `packages/core/src/tools/generate-llmstxt.ts`
- `packages/core/src/tools/generate-faq.ts`

## Files READ-ONLY (import, do not modify)
- All contract files
- `packages/core/src/scoring/schema-completeness.ts` (for getRequiredSchemaTypes)

## Scaffold Salvage
None

## Dependencies
- S7 must complete first because the JSON-LD generator needs schema analysis to know what's missing
- S5 must complete first because the FAQ generator needs content analysis
- S3 must complete first because the llms.txt generator needs crawl data for context

## Exit Criteria
- `generateJsonLd(analysis: SchemaAnalysisOutput, businessData): Promise<string>` produces valid JSON-LD matching LocalBusiness/Service/FAQ spec via Claude Haiku generateObject()
- `generateLlmsTxt(crawlData: CrawlOutput, businessData): Promise<string>` produces markdown per llms.txt spec
- `generateFaq(contentAnalysis: ContentAnalysisOutput, vertical, businessData): Promise<string>` produces Q&A pairs as HTML/markdown
- All generators use AI SDK generateObject() or generateText() with Zod validation
- Output is copy-paste ready for the client
- Tests with mock data produce valid, parseable output

## Known Bugs to Fix
None — greenfield code
