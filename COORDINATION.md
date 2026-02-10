# Parallel Session Coordination

> This document governs how 28 parallel Claude Code / Gemini sessions build the Pare Engine without collisions. Every file path is assigned to exactly one session. No exceptions.

## How to Use This Document

- **Starting a session?** → Find your S{N} in the Ownership Map, read your `sessions/S{N}/SPEC.md`
- **Need a type?** → Import from `@pare-engine/core/contracts`. Never invent private types that duplicate contracts.
- **Merging?** → Follow the Merge Protocol for your round.
- **Blocked?** → Check the Round Launch Order for preconditions.
- **Found a missing type?** → Add it to `contracts/` with a `// TODO: verify with S{N}` comment.

---

## 1. Session Ownership Map

Every file path is assigned to exactly one session. If a file is not listed, it does not exist yet and the session creating it must add it to their SPEC.md.

### Zone 1: `packages/core/src/` — Shared Foundation

| File Path | Owner | Round | Consumers (Read-Only) |
|-----------|-------|-------|----------------------|
| `contracts/*.ts` | **Bootstrap** | 0 | ALL |
| `config.ts` | **S1** | 1 | ALL |
| `types.ts` | **S2** | 1 | ALL (S2 refactors, others read) |
| `scoring.ts` → `scoring/index.ts` | **S2** | 1 | S9, S11, S12 |
| `scoring/ai-visibility.ts` | **S9** | 3 | S11, S12 |
| `scoring/content-quality.ts` | **S5** | 2 | S11, S12 |
| `scoring/schema-completeness.ts` | **S7** | 2 | S11, S12 |
| `scoring/technical-readiness.ts` | **S6** | 2 | S11, S12 |
| `scoring/local-gbp.ts` | **S8** | 3 | S11, S12 |
| `scoring/*.test.ts` | **S11** | 3 | — |
| `report-templates/` | **S10** | 3 | S12, S13, S20 |
| `email-templates/` | **S13** | 4 | S12 |
| `prompt-library/` | **S21** | 6 | S18, S20 |
| `tools/crawl-site.ts` | **S3** | 1 | S12 |
| `tools/query-engines.ts` | **S4** | 2 | S12 |
| `tools/parse-response.ts` | **S5** | 2 | S12 |
| `tools/pagespeed.ts` | **S6** | 2 | S12 |
| `tools/parse-jsonld.ts` | **S7** | 2 | S12 |
| `tools/google-places.ts` | **S8** | 3 | S12 |
| `tools/normalize-citations.ts` | **S9** | 3 | S12, S20 |
| `tools/generate-pdf.ts` | **S10** | 3 | S12 |
| `tools/send-report.ts` | **S13** | 4 | S12 |
| `tools/sync-notion.ts` | **S17** | 5 | — |
| `tools/serper.ts` | **S19** | 6 | — |
| `tools/dataforseo.ts` | **S19** | 6 | — |
| `tools/accuracy-scorer.ts` | **S21** | 6 | S20 |
| `tools/social-monitor.ts` | **S23** | 7 | — |
| `database/schema.ts` | **S2** | 1 | ALL (S2 adds indexes, fixes) |
| `index.ts` | **S2** | 1 | ALL (S2 updates re-exports) |

**Rule:** If multiple sessions need to add re-exports to `index.ts`, S2 creates it in Round 1 with placeholders. Each subsequent session adds their exports during their merge — never by modifying the file directly in their branch. The merge script handles this.

### Zone 2: `apps/audit-runner/src/steps/` — Separate Files, Not One analyze.ts

| File Path | Owner | Round | Consumers |
|-----------|-------|-------|-----------|
| `apps/audit-runner/package.json` | **Bootstrap** | 0 | ALL |
| `apps/audit-runner/src/steps/crawl.ts` | **S3** | 1 | S12 |
| `apps/audit-runner/src/steps/query-engines.ts` | **S4** | 2 | S12 |
| `apps/audit-runner/src/steps/analyze-content.ts` | **S5** | 2 | S12 |
| `apps/audit-runner/src/steps/analyze-technical.ts` | **S6** | 2 | S12 |
| `apps/audit-runner/src/steps/analyze-schema.ts` | **S7** | 2 | S12 |
| `apps/audit-runner/src/steps/analyze-gbp.ts` | **S8** | 3 | S12 |
| `apps/audit-runner/src/steps/score.ts` | **S12** | 4 | — |
| `apps/audit-runner/src/steps/report.ts` | **S12** | 4 | — |
| `apps/audit-runner/src/steps/deliver.ts` | **S12** | 4 | — |
| `apps/audit-runner/src/pipeline.ts` | **S12** | 4 | S15 |
| `apps/audit-runner/src/inngest.ts` | **S12** | 4 | — |

### Zone 3: `apps/web/` — Web Application

| File Path | Owner | Round | Consumers |
|-----------|-------|-------|-----------|
| `apps/web/package.json` | **Bootstrap** | 0 | S14, S15, S16 |
| `apps/web/app/layout.tsx` | **S14** | 5 | S15, S16 |
| `apps/web/app/page.tsx` | **S14** | 5 | — |
| `apps/web/app/(public)/*` | **S14** | 5 | — |
| `apps/web/app/admin/login/*` | **S14** | 5 | — |
| `apps/web/middleware.ts` | **S14** | 5 | S15, S16 |
| `apps/web/lib/auth.ts` | **S14** | 5 | S15, S16 |
| `apps/web/app/audit/*` | **S15** | 5 | — |
| `apps/web/app/api/webhooks/stripe/*` | **S15** | 5 | — |
| `apps/web/app/admin/(dashboard)/*` | **S16** | 5 | — |
| `apps/web/app/admin/clients/*` | **S16** | 5 | — |
| `apps/web/app/admin/audits/*` | **S16** | 5 | — |

### Zone 4: Root / Config Files

| File Path | Owner | Round |
|-----------|-------|-------|
| `pnpm-workspace.yaml` | **Bootstrap** | 0 |
| `turbo.json` | **Bootstrap** | 0 |
| `.env.example` | **S1** | 1 |
| `.claude/settings.json` | **S1** | 1 |
| `.claude/rules/coordination.md` | **Bootstrap** | 0 |
| `COORDINATION.md` | **Bootstrap** | 0 |
| `vitest.config.ts` (root) | **S2** | 1 |
| `packages/core/vitest.config.ts` | **S2** | 1 |

---

## 2. Contract-First Protocol

### The Rule

Sessions define output interfaces in `packages/core/src/contracts/` **before** writing implementation. Other sessions import contracts, never sibling implementations.

```
import { CrawlOutput } from '@pare-engine/core/contracts';     // ✅ Correct
import { crawlSite } from '../../../audit-runner/src/steps/';   // ❌ Never
```

### Adding a Missing Type

If your session needs a type not in `contracts/`:
1. Add it to the appropriate `*.contract.ts` file
2. Add a comment: `// TODO: added by S{N}, verify with S{X}` where X is the contract owner
3. Re-export from `contracts/index.ts`
4. Document in your `sessions/S{N}/STATUS.md` under "Deviations"

### Contract Files Are Type-Only (with one exception)

Contract files contain: types, interfaces, Zod schemas, and `z.infer` type derivations.
The one exception: `scoring.contract.ts` exports `scoreToGrade()` and `SCORING_WEIGHTS` because these are shared constants that must be identical everywhere.

No other runtime implementation code in contract files.

---

## 3. Merge Protocol

### Branch Naming

```
session/S{N}-{short-slug}
```

Examples: `session/S1-config`, `session/S2-scoring`, `session/S10-reports`

### Merge Order Within a Round

Sessions within a round merge in numerical order. Lower session numbers merge first because they tend to own foundational files that higher numbers depend on.

| Round | Merge Order |
|-------|------------|
| 0 (Bootstrap) | Single commit to `main` |
| 1 | S1 → S2 → S3 |
| 2 | S4 → S5 → S6 → S7 |
| 3 | S8 → S9 → S10 → S11 |
| 4 | S12 → S13 |
| 5 | S14 → S15 → S16 → S17 |
| 6 | S18 → S19 → S20 → S21 |
| 7 | S22 → S23 |
| 8 | S24 → S25 → S26 → S27 → S28 (as triggered) |

### Conflict Resolution

When merging surfaces a conflict:
1. **`index.ts` re-exports**: Accept both. Combine the export lists.
2. **`contracts/*.ts`**: The session that owns the contract file wins. If a consuming session added a `// TODO` type, the owner validates it at merge time.
3. **`database/schema.ts`**: S2 owns. If another session added columns, S2 validates at merge time (unlikely — schema changes should go through contracts first).
4. **Any other file**: The OWNER per the ownership map above wins. If both sessions modified a file neither owns, that's a coordination failure — escalate.

### Merge Checklist (per session)

```
[ ] All exit criteria in SPEC.md met
[ ] pnpm build succeeds
[ ] pnpm test passes (if tests exist for this session's code)
[ ] No files modified outside OWNED list
[ ] STATUS.md updated with: status, files created, deviations
[ ] Branch rebased on latest main before merge
```

---

## 4. Communication Protocol

### Session Status Files

Each session maintains `sessions/S{N}/STATUS.md`:

```markdown
# S{N} Status

- **Status**: pending | in_progress | complete | blocked
- **Started**: [timestamp]
- **Completed**: [timestamp]
- **Branch**: session/S{N}-{slug}

## Files Created
- path/to/file.ts

## Files Modified
- path/to/existing.ts (reason)

## Deviations from Spec
- [Any changes from the original SPEC.md]

## Blockers
- [If blocked, what's blocking and which session needs to resolve it]

## Notes
- [Anything the next round needs to know]
```

### Signaling "Done"

1. Update `sessions/S{N}/STATUS.md` with `Status: complete`
2. Push branch: `git push -u origin session/S{N}-{slug}`
3. The round is complete when ALL sessions in that round have `Status: complete`

---

## 5. Session Allocation

### Allocation Table

| Session | Agent | Duration | Rationale |
|---------|-------|----------|-----------|
| **Bootstrap** | CLAUDE | SHORT | Repo setup requires understanding CLAUDE.md conventions |
| **S1** | CLAUDE | SHORT | Config validation, MCP setup — needs CLAUDE.md awareness |
| **S2** | CLAUDE | MEDIUM | Scoring algorithm is core IP, strict weight enforcement |
| **S3** | CLAUDE | SHORT | Firecrawl typed tool function pattern per CLAUDE.md rules |
| **S4** | CLAUDE | MEDIUM | AI SDK v6 multi-provider wiring, Promise.allSettled |
| **S5** | CLAUDE | MEDIUM | generateObject() + Zod schemas, LLM-based analysis |
| **S6** | CLAUDE | SHORT | PageSpeed API integration, scoring function |
| **S7** | CLAUDE | SHORT | JSON-LD parsing logic, scoring function |
| **S8** | CLAUDE | SHORT | Google Places API, GBP scoring function |
| **S9** | CLAUDE | MEDIUM | Citation normalization is core IP, cross-provider logic |
| **S10** | GEMINI | LONG | Large HTML/CSS + inline SVG, 9 page templates, brand design — benefits from 2M context for holding all brand guidelines + layout specs simultaneously |
| **S11** | CLAUDE | MEDIUM | Vitest, edge-case scoring tests, strict verification |
| **S12** | CLAUDE | LONG | Inngest pipeline orchestration, 6-step durable workflow |
| **S13** | GEMINI | MEDIUM | React Email templates, branded HTML — volume generation |
| **S14** | CLAUDE | MEDIUM | Auth middleware, session security, Next.js App Router |
| **S15** | CLAUDE | MEDIUM | Stripe webhook handling, payment flow security |
| **S16** | GEMINI | LONG | Admin dashboard UI — many routes, tables, charts. Reads from Drizzle. Benefits from 2M context for holding all admin spec + component patterns |
| **S17** | CLAUDE | SHORT | Notion API sync, n8n webhook → Inngest pattern |
| **S18** | CLAUDE | MEDIUM | LLM generation (JSON-LD, llms.txt, FAQ), Zod schemas |
| **S19** | CLAUDE | MEDIUM | Serper + DataForSEO API wiring, typed tool functions |
| **S20** | CLAUDE | MEDIUM | Pipeline orchestration for verify loop, delta calculation |
| **S21** | HYBRID | MEDIUM | CLAUDE designs accuracy scorer. GEMINI generates 60+ prompts across 3 verticals. |
| **S22** | CLAUDE | MEDIUM | mcp-to-ai-sdk, Coolify deployment, production config |
| **S23** | CLAUDE | SHORT | Xpoz + Apify API integration |
| **S24** | CLAUDE | SHORT | Monthly trend report template + scheduling |
| **S25** | CLAUDE | SHORT | Score delta alerts, Resend email |
| **S26** | CLAUDE | SHORT | Agentic commerce readiness checks |
| **S27** | GEMINI | MEDIUM | Content optimizer prompts, bulk generation |
| **S28** | CLAUDE | SHORT | AI crawler analytics, log parsing |

**Duration key:** SHORT (<2h), MEDIUM (2-4h), LONG (4-8h)

**Agent totals:** CLAUDE: 22 sessions, GEMINI: 4 sessions (S10, S13, S16, S27), HYBRID: 1 session (S21)

---

## 6. Round Launch Order

### Round 0: Bootstrap (No Parallelism)

**Preconditions:** Raw repo as-is (no git, no lockfile)
**Sessions:** Bootstrap only
**Duration:** SHORT
**Merge:** Direct commit to `main`

**What it does:**
1. `git init` + initial commit
2. `pnpm install`
3. Fix `pnpm-workspace.yaml` (add `apps/*`)
4. Fix `turbo.json` (`pipeline` → `tasks`)
5. Create `.env.example`
6. Create `.claude/settings.json`
7. Create `packages/core/src/contracts/` with all interface files
8. Configure `packages/core/package.json` `exports` field for contract subpath
9. Create `sessions/` directory with all SPEC.md files
10. Scaffold `apps/audit-runner/package.json` and `apps/web/package.json`
11. Delete `nul` file
12. Create `.claude/rules/coordination.md`
13. Commit: `bootstrap: coordination infrastructure + workspace setup`

**Postconditions:** `pnpm install` succeeds. `pnpm build` succeeds (may have type errors in unused scaffold packages — acceptable). Git repo initialized. Every session can `git checkout -b session/S{N}-slug` from `main`.

---

### Round 1: Foundation (Day 1)

**Preconditions:** Bootstrap complete. `main` branch exists.
**Sessions:** S1, S2, S3 (parallel)
**Merge order:** S1 → S2 → S3

| Session | Duration | Key Output |
|---------|----------|-----------|
| S1: Config + Dev Infra | SHORT | `config.ts`, `.env.example`, `.claude/settings.json` |
| S2: Scoring Foundation | MEDIUM | `scoring/` directory with 5 stubs + composite, Vitest setup, `types.ts` cleanup |
| S3: Firecrawl Integration | SHORT | `tools/crawl-site.ts`, `apps/audit-runner/src/steps/crawl.ts` |

**Postconditions:** `pnpm test` runs (S2's tests). Config validates env vars. Firecrawl can crawl a real domain.

---

### Round 2: AI Engines + Analysis (Days 2-3)

**Preconditions:** Round 1 merged. `config.ts` exists. Firecrawl step exists.
**Sessions:** S4, S5, S6, S7 (parallel)
**Merge order:** S4 → S5 → S6 → S7

| Session | Duration | Key Output |
|---------|----------|-----------|
| S4: AI Engine Providers | MEDIUM | `tools/query-engines.ts`, `steps/query-engines.ts` |
| S5: LLM Parser + Content Scoring | MEDIUM | `tools/parse-response.ts`, `steps/analyze-content.ts`, `scoring/content-quality.ts` |
| S6: Technical Readiness | SHORT | `tools/pagespeed.ts`, `steps/analyze-technical.ts`, `scoring/technical-readiness.ts` |
| S7: Schema Scoring | SHORT | `tools/parse-jsonld.ts`, `steps/analyze-schema.ts`, `scoring/schema-completeness.ts` |

**Postconditions:** Can query all 3 AI engines. Content, Technical, Schema scorers return valid scores. 3 of 5 scoring pillars functional.

---

### Round 3: Complete Scoring + Reports (Days 3-5)

**Preconditions:** Round 2 merged. AI engine providers wired. 3 pillar scorers exist.
**Sessions:** S8, S9, S10, S11 (parallel)
**Merge order:** S8 → S9 → S10 → S11

| Session | Duration | Key Output |
|---------|----------|-----------|
| S8: GBP/Local Scoring | SHORT | `tools/google-places.ts`, `steps/analyze-gbp.ts`, `scoring/local-gbp.ts` |
| S9: AI Visibility + Citations | MEDIUM | `scoring/ai-visibility.ts`, `tools/normalize-citations.ts` |
| S10: Report Templates | LONG | `report-templates/`, `tools/generate-pdf.ts` (mini + full) |
| S11: Scoring Test Suite | MEDIUM | `scoring/*.test.ts` — all 5 pillars + composite + edge cases |

**Postconditions:** All 5 scoring pillars functional. Both PDF templates generate. All scoring tests pass. Composite score ≤ 100.

---

### Round 4: Pipeline + Delivery (Days 5-7)

**Preconditions:** Round 3 merged. All scorers work. Reports generate.
**Sessions:** S12, S13 (parallel)
**Merge order:** S12 → S13

| Session | Duration | Key Output |
|---------|----------|-----------|
| S12: Inngest Pipeline | LONG | `apps/audit-runner/src/pipeline.ts` + all orchestration |
| S13: Email Delivery | MEDIUM | `email-templates/`, `tools/send-report.ts` |

**Postconditions:** **SELLABLE PRODUCT.** Domain in → crawl → query → analyze → score → PDF → email. Full pipeline runs via Inngest dev server.

---

### Round 5: Web + Sales (Days 7-10)

**Preconditions:** Round 4 merged. Pipeline runs end-to-end.
**Sessions:** S14, S15, S16, S17 (parallel — S16 depends on S14's auth)
**Merge order:** S14 → S15 → S16 → S17

| Session | Duration | Key Output |
|---------|----------|-----------|
| S14: Next.js + Auth | MEDIUM | `apps/web/` scaffold, auth middleware, public routes, login page |
| S15: Audit Form + Stripe | MEDIUM | `/audit` form, Stripe checkout, webhook → Inngest trigger |
| S16: Admin Dashboard | LONG | `/admin/*` routes — clients, audits, scores, re-run |
| S17: Notion Sync | SHORT | `tools/sync-notion.ts`, n8n webhook → Inngest |

**Note:** S15 and S16 develop in parallel but S16 cannot merge until S14's auth middleware is merged. S15 can develop the form/webhook independently and merge after S14.

**Postconditions:** **CAN ACCEPT PAYMENT.** Public site serves. Admin panel works behind auth. Stripe payment → automatic audit. Notion syncs.

---

### Round 6: Moat Features (Days 10-14)

**Preconditions:** Round 5 merged. Web app live. Payments work.
**Sessions:** S18, S19, S20, S21 (parallel)
**Merge order:** S18 → S19 → S20 → S21

| Session | Duration | Key Output |
|---------|----------|-----------|
| S18: Implementation Engine | MEDIUM | JSON-LD generator, llms.txt generator, FAQ generator |
| S19: Competitive Intelligence | MEDIUM | `tools/serper.ts`, `tools/dataforseo.ts`, enriched scoring |
| S20: Verify Loop + History | MEDIUM | Re-audit flow, score delta tracking, before/after report |
| S21: Vertical Intel + Accuracy | MEDIUM | `prompt-library/`, `tools/accuracy-scorer.ts` |

**Postconditions:** **FULL MOAT.** Audits include fix files. Verify loop works. Vertical prompts seeded. Competitive intelligence enriches reports.

---

### Round 7: Production (Days 14-18)

**Preconditions:** Round 6 merged. All features work locally.
**Sessions:** S22, S23 (parallel)
**Merge order:** S22 → S23

| Session | Duration | Key Output |
|---------|----------|-----------|
| S22: Production Deployment | MEDIUM | mcp-to-ai-sdk vendoring, Coolify config, SSL, smoke test |
| S23: Social + Reviews | SHORT | `tools/social-monitor.ts`, Xpoz + Apify integration |

**Postconditions:** **PRODUCTION LAUNCH.** Full audit runs in production. Social data enriches reports.

---

### Round 8: Scale (Week 4+, as triggered)

| Session | Trigger | Duration |
|---------|---------|----------|
| S24: Monthly Reports | First retainer client | SHORT |
| S25: Score Alerts | Client demand | SHORT |
| S26: Agentic Commerce | E-commerce client | SHORT |
| S27: Content Optimizer | Sprint automation need | MEDIUM |
| S28: Crawler Analytics | Scale monitoring | SHORT |

---

## 7. Scaffold Cleanup

After Round 2 merges, create a cleanup session:

```bash
git rm -r packages/query-engine packages/site-crawler packages/report-generator
```

Useful logic has been extracted by sessions S2 (prompts → prompt-library), S7 (schema.ts → parse-jsonld.ts), S6 (technical.ts → analyze-technical.ts), S10 (styles.ts → CSS variables). The scaffold packages are dead code after Round 2.

---

## Appendix: File Count Per Session

| Session | Files Created | Files Modified |
|---------|--------------|---------------|
| Bootstrap | ~45 (specs, contracts, scaffolds) | 3 (workspace, turbo, core pkg.json) |
| S1 | 3 | 0 |
| S2 | 8+ (scoring dir, tests, vitest config) | 3 (types.ts, index.ts, schema.ts) |
| S3 | 2 | 0 |
| S4 | 2 | 0 |
| S5 | 3 | 0 |
| S6 | 3 | 0 |
| S7 | 3 | 0 |
| S8 | 3 | 0 |
| S9 | 2 | 0 |
| S10 | 5+ (templates, CSS, render) | 0 |
| S11 | 5+ (test files) | 0 |
| S12 | 5+ (pipeline, steps) | 0 |
| S13 | 3 | 0 |
| S14 | 10+ (Next.js scaffold) | 0 |
| S15 | 4 | 0 |
| S16 | 8+ (admin routes) | 0 |
| S17 | 2 | 0 |
| S18-S28 | 2-4 each | 0-1 each |
