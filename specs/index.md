# Pare Engine Coordination Index

This document maps the 267 files in the Pare Engine monorepo to 35+ parallelizable work units.

## Category A: Critical Fixes (Sequential)
- [A1: Build Fix](A-critical-fixes/A1-build-fix.md)
- [A2: Config Consolidation](A-critical-fixes/A2-config-consolidation.md)
- [A3: Database Migration](A-critical-fixes/A3-db-migration.md)
- [A4: Core Barrel Exports](A-critical-fixes/A4-core-barrel-exports.md)
- [A5: Inngest Client Setup](A-critical-fixes/A5-inngest-client-setup.md)
- [A6: E2E Pipeline Smoke Test](A-critical-fixes/A6-smoke-test.md)

## Category B: Production Hardening (Parallel after A6)
- **Core Tools**
  - [B1.1: Crawling](B-hardening/B1.1-tools-crawling.md)
  - [B1.2: Search](B-hardening/B1.2-tools-search.md)
  - [B1.3: Analysis](B-hardening/B1.3-tools-analysis.md)
  - [B1.4: Generation](B-hardening/B1.4-tools-generation.md)
  - [B1.5: Orchestration](B-hardening/B1.5-tools-orchestration.md)
  - [B1.6: Special Analysis](B-hardening/B1.6-tools-special-analysis.md)
  - [B1.7: Adv Generation](B-hardening/B1.7-tools-adv-generation.md)
  - [B1.8: Utilities](B-hardening/B1.8-tools-utilities.md)
- **Scoring**
  - [B2.1-B2.5: Pillar Implementation](B-hardening/B2.1-scoring-visibility.md)
  - [B2.6: Aggregation](B-hardening/B2.6-scoring-aggregation.md)
- **Pipeline Steps**
  - [B3.1: Collection](B-hardening/B3.1-steps-collection.md)
  - [B3.2: Analysis](B-hardening/B3.2-steps-analysis.md)
  - [B3.3: Scoring](B-hardening/B3.3-steps-scoring.md)
  - [B3.4: Delivery](B-hardening/B3.4-steps-delivery.md)
- **UI & API**
  - [B4: Admin Pages](B-hardening/B4-admin-pages.md)
  - [B5: API Routes](B-hardening/B5-api-routes.md)
  - [B6-B7: Templates](B-hardening/B6-B7-templates.md)
  - [B8: Prompt Library](B-hardening/B8-prompt-library.md)

## Category C: Missing Features (Parallel after A6)
- [C1: Admin Settings](C-features/C1-admin-settings.md)
- [C2: Pipeline Dashboard](C-features/C2-pipeline-dashboard.md)
- [C3-C4: Quick/Batch Audit](C-features/C3-C4-quick-batch-audit.md)
- [C5: Client Onboarding](C-features/C5-client-onboarding.md)
- [C6-C7: Audit Lifecycle](C-features/C6-C7-audit-lifecycle.md)
- [C8: Monitoring Cron](C-features/C8-monitoring-cron.md)
- [C9-C11: Workbench](C-features/C9-C11-workbench.md)
- [C12-C13: Dashboards](C-features/C12-C13-dashboards.md)
- [C14-C15: Utilities](C-features/C14-C15-utilities.md)

## Category D: Testing (Parallel)
- [D: Testing Suite](D-testing/D-testing-suite.md)

## Rules of Engagement
1. **Named Exports Only**: No default exports.
2. **Contract First**: Always import types from `@pare-engine/core/contracts`.
3. **No raw process.env**: Use `loadConfig()`.
4. **File Ownership**: Only modify files listed in "Files OWNED" in your spec.
