# S12: Inngest Pipeline

## Mission
Wire the full audit pipeline as Inngest steps: CRAWL -> QUERY -> ANALYZE -> SCORE -> REPORT -> DELIVER. Each step independently retriable with error handling.

## Agent
CLAUDE — Inngest pipeline orchestration requires understanding durable step patterns, error handling, and the full dependency chain.

## Input Contracts (read from `@pare-engine/core/contracts`)
- `AuditRequest`, `AuditPipelineResult` from `pipeline.contract.ts`
- `CrawlStep`, `QueryStep`, `AnalyzeStep`, `ScoreStep`, `ReportStep`, `DeliverStep` from `pipeline.contract.ts`
- All analysis and scoring contracts

## Output Contracts (this session implements)
- `AuditPipelineResult` from `pipeline.contract.ts`

## Files OWNED (exclusive write access)
- `apps/audit-runner/src/pipeline.ts` (main Inngest function)
- `apps/audit-runner/src/inngest.ts` (Inngest client setup)
- `apps/audit-runner/src/steps/score.ts` (orchestrates all 5 scorers)
- `apps/audit-runner/src/steps/report.ts` (orchestrates report generation)
- `apps/audit-runner/src/steps/deliver.ts` (orchestrates email + DB write)
- `apps/audit-runner/src/index.ts`

## Files READ-ONLY (import, do not modify)
- All contract files
- All `packages/core/src/tools/*.ts` (imports these, does not modify)
- All `apps/audit-runner/src/steps/crawl.ts`, `query-engines.ts`, `analyze-*.ts` (imports)

## Scaffold Salvage
None

## Dependencies
- ALL Round 1-3 sessions must complete (S1-S11). This session imports from every tool and scorer.
- Specifically: S3 (crawl), S4 (query), S5 (parse+content), S6 (technical), S7 (schema), S8 (gbp), S9 (visibility), S10 (report), S13 (email — can stub initially)

## Exit Criteria
- `apps/audit-runner/src/pipeline.ts` exports an Inngest function triggered by `'audit/requested'` event
- Pipeline has 6 steps: crawl, query, analyze, score, report, deliver
- Each step wrapped in `step.run()` for independent retryability
- Failed steps log error and continue where possible (graceful degradation)
- `AuditPipelineResult` written to `auditResults` table via Drizzle after completion
- Can trigger a full audit via Inngest dev server: domain in -> PDF buffer out
- Pipeline handles: single provider failure, missing GBP data, crawl errors on some pages
- Duration tracked in `durationMs`

## Known Bugs to Fix
None — greenfield code
