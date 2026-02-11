# What the Architecture Gets Right

This document acknowledges the genuine strengths of the system. The architecture makes several non-obvious decisions that are correct and would be expensive to redo.

## 1. Contract-First Development

The 7 contract files in `packages/core/src/contracts/` are the single best architectural decision in the codebase.

**Why it's right:**
- Every session builds against typed interfaces, not against other sessions' implementations
- Zero circular dependencies -- contracts have no runtime deps
- TypeScript catches contract violations at compile time
- New tools/features are additive -- they implement existing contracts, not modify them
- The same contracts will serve for 3+ years of development

**The proof:** 28 parallel sessions built 267 files without merge conflicts on shared types. That doesn't happen by accident. It happens because the contracts are clean.

## 2. Inngest for Pipeline Orchestration

Using Inngest instead of n8n for the audit pipeline is the correct call that many teams get wrong.

**Why it's right:**
- Each of the 6 pipeline steps is independently retriable -- if Perplexity's API is down, it retries just the query step, preserving the crawl data
- Durable execution means a 30-minute audit survives server restarts
- Step-level observability via Inngest dashboard
- Self-hosts on the existing PostgreSQL (no additional infrastructure)
- n8n's 5-minute MCP timeout would have been a showstopper

**What most teams do instead:** Cron job -> monolithic function -> retry from scratch on failure. The Inngest choice saves 10+ hours of debugging per month at scale.

## 3. `Promise.allSettled()` Everywhere

The consistent use of `Promise.allSettled()` for multi-provider queries and parallel analysis steps is exactly right.

**Why it matters:**
- If Perplexity is down, the audit still completes with OpenAI + Gemini data
- If GBP analysis fails (no Google Places API key), the other 3 analyzers still run
- Failed providers are tracked in `failedPlatforms` and reported to the client
- Minimum viable audit: 1 provider + 5 prompts

**What most teams do instead:** `Promise.all()` -> one provider failure -> entire audit crashes -> client gets nothing.

## 4. Puppeteer HTML->PDF Instead of React-PDF

The STEELMAN_AND_RISKS.md identified React-PDF as the "#1 time-waster risk (80% likelihood, 1-2 weeks lost)." The architecture chose HTML/CSS + Puppeteer `page.pdf()`.

**Why it's right:**
- Full CSS support (grid, flexbox, custom fonts, SVG charts)
- Templates are debuggable in a browser -- open the HTML, see exactly what the PDF will look like
- Same CSS knowledge applies to web and PDFs
- Puppeteer `page.pdf()` is literally one function call
- Charts can be inline SVG (no JS runtime needed in headless browser)

## 5. AI SDK v6 as the Only LLM Interface

Choosing Vercel AI SDK v6 as the single LLM abstraction layer is correct.

**Why it's right:**
- `generateObject()` with Zod schemas = guaranteed structured JSON output
- Swap providers by changing one import line (no code changes)
- Built-in rate limiting, retries, streaming
- No custom OpenAI/Anthropic/Google API wrapper classes to maintain
- The Gemini scaffold had 5 custom provider classes (all mocked). AI SDK replaces them with 5 lines.

## 6. Scoring as Weighted Sum of Bounded Pillars

The scoring algorithm is elegant: each pillar is scored to its maximum (0-30, 0-30, 0-15, 0-10, 0-15), and the composite is just the sum, capped at 100.

**Why it's right:**
- No normalization step needed -- weights are embedded in the pillar maximums
- Adding/reweighting pillars requires changing only the maximums
- Each pillar is independently testable and understandable
- The letter grade mapping (A/B/C/D/F) is simple and memorable
- Sub-scores within each pillar are transparent and auditable

## 7. Graceful Degradation as a First Principle

The architecture doesn't just handle failures -- it was designed from the start to produce useful output with partial data.

**Evidence:**
- Query step: 1 provider with 5 prompts = minimum viable audit
- Analyze step: 4 parallel analyzers with independent fallbacks
- GBP step: works without Google Places API key (reduced scoring)
- The pipeline ALWAYS produces a report, even with degraded data
- Degraded sections are flagged in the report rather than omitted

This is unusually mature for a system built in 28 parallel sessions.

## 8. Database Schema Design

The Drizzle schema makes good decisions:
- UUID primary keys (no serial ID leakage between clients)
- `jsonb` for flexible data (audit details, competitor mentions) -- avoids premature schema commitment
- `parentAuditId` for verification audits (before/after) -- even though the delta logic isn't built, the data model is ready
- `competitorSnapshots` as time-series data -- enables trend analysis without schema changes
- `promptLibrary` with performance tracking columns -- ready for the learning loop

## 9. The Three-Mode Integration Layer

MCP for development, API wrappers for production, custom code for IP. This separation is clear and correct.

**What most teams do instead:** Mix MCP tool definitions into production code, or skip MCP entirely and lose development velocity. The `mcp-to-ai-sdk` vendor step is a clean solution.

## 10. The Solo Operator Framing

The entire system is built for one person. This constraint drove better decisions:
- One Next.js app hosts everything (no microservices overhead)
- Session-based auth with one account (no user management complexity)
- Notion for CRM "until friction demands a dashboard"
- No client portal (PDF reports + Loom walkthroughs)

**Why this is right:** Solo consultancies that over-build their tooling before having clients waste months on infrastructure that serves zero users. The "build when friction demands" principle prevents premature optimization.
