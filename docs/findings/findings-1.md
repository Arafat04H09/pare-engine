# Findings-1: Tooling Gap Analysis for Pare Engine

> Research date: 2026-02-10
> Scope: Build-time tooling (multi-session agentic dev) + Product-integrated tooling (dashboard features)
> Method: MCP registry, Smithery.ai, GitHub ecosystem, GEO market landscape, API pricing research

---

## TL;DR — The 80/20

**Build-time (what accelerates you):** Install 3 things today — `cc-sdd` for spec-driven sessions, Knowledge Graph Memory MCP for cross-session persistence, and `dependency-cruiser` for architectural boundary enforcement. Add `mcp-to-ai-sdk` for production MCP safety. Everything else is incremental.

**Product-integrated (what becomes features):** You already chose the right core APIs. The gaps are: Xpoz MCP for social monitoring (free tier, drop-in), DataForSEO for pay-as-you-go SEO data ($0.0006/req vs $250+/mo for Ahrefs), and Google PageSpeed Insights API (free, feeds Technical Readiness pillar directly). Don't buy a GEO platform — Pare replicates their $300-500/mo offering for ~$100/mo in direct API costs.

---

## Part 1: Build-Time Tooling

### Tier 1 — Install This Week

#### 1. cc-sdd (Spec-Driven Development Commands)
- **URL:** github.com/gotalab/cc-sdd
- **What:** Kiro-style SDD for Claude Code. Commands: `spec-init`, `steering`, `spec-requirements` (EARS notation), `spec-design`, `spec-tasks` (P0 sequential / P1 parallel decomposition). Validation gates: `validate-gap`, `validate-design`, `validate-impl`.
- **Maturity:** Production. Supports 8 agents, 13 languages.
- **Why it matters:** Your META_OS pattern is spec-driven development. This formalizes it with structured commands, project memory, and validation gates. Replaces ad-hoc SPEC.md workflows.
- **Maps to:** Session planning, spec authoring, task decomposition, implementation verification.
- **Install:** `npx cc-sdd@latest --claude --lang en`
- **Effort:** Drop-in. 15 minutes.

#### 2. Knowledge Graph Memory MCP (Official Anthropic Reference)
- **URL:** github.com/modelcontextprotocol/servers/tree/main/src/memory
- **What:** Local JSON-backed knowledge graph. Entities (name + type), observations (atomic facts), relations (directed edges). Persists across sessions.
- **Maturity:** Production. Official Anthropic implementation.
- **Why it matters:** Your auto-memory MEMORY.md is flat text. This gives you a queryable graph of project entities — clients, features, decisions, architectural components — with typed relations between them.
- **Maps to:** Cross-session context persistence, decision tracking, architectural knowledge.
- **Install:** Add to `.claude/settings.json`:
  ```json
  { "memory": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-memory"] } }
  ```
- **Effort:** Drop-in. 5 minutes.
- **Limitation:** Exact-match search only. See Tier 2 for semantic alternative.

#### 3. dependency-cruiser
- **URL:** github.com/sverweij/dependency-cruiser
- **What:** Validates and visualizes JS/TS dependency graphs with custom rules. Enforces architectural boundaries in CI.
- **Maturity:** Production. 6K+ stars, actively maintained.
- **Why it matters:** Your CLAUDE.md defines a layered architecture (core → apps, no reverse imports). dependency-cruiser turns those prose rules into enforceable constraints. "packages/core must not import from apps/web" becomes a CI check.
- **Maps to:** Architecture enforcement, preventing drift during multi-session development.
- **Install:** `pnpm add -D dependency-cruiser`
- **Effort:** Moderate. 1-2 hours to define rules matching your architecture doc.

#### 4. mcp-to-ai-sdk (Vercel Labs)
- **URL:** github.com/vercel-labs/mcp-to-ai-sdk
- **What:** CLI that generates static AI SDK tool stubs from MCP server definitions. "shadcn for MCP." Prevents prompt injection from dynamic tool loading in production.
- **Maturity:** Production. Official Vercel Labs.
- **Why it matters:** You plan to use MCP servers for development (Drizzle, Firecrawl, etc.) but also use AI SDK in production (audit pipeline). This bridges the gap — develop with MCP, vendor tool definitions for production safety.
- **Maps to:** Production deployment safety, MCP-to-pipeline integration.
- **Install:** `npx mcp-to-ai-sdk`
- **Effort:** Drop-in. Part of AI SDK v6 ecosystem.

### Tier 2 — Add After Core Pipeline Works

#### 5. Superpowers Skills Framework (obra)
- **URL:** github.com/obra/superpowers
- **What:** 20+ battle-tested skills: TDD enforcement (RED/GREEN/REFACTOR), structured debugging (hypothesis → test → fix), `/brainstorm` → `/write-plan` → `/execute-plan` workflow.
- **Maturity:** Production. Community-proven.
- **Why it matters:** Complements cc-sdd with execution-phase discipline. The debugging skills alone (structured hypothesis testing vs random "try different things") would have saved time on the scoring bug.
- **Maps to:** Implementation quality, debugging efficiency, TDD workflow.
- **Install:** `/plugin install superpowers@superpowers-marketplace`
- **Effort:** Drop-in. Cherry-pick skills you need.

#### 6. MCP Memory Service (doobidoo) — Semantic Alternative
- **URL:** github.com/doobidoo/mcp-memory-service
- **What:** ChromaDB + sentence transformers for semantic memory. Search "authentication issues" → finds "login problems" and "JWT errors." Web dashboard with D3.js visualization.
- **Maturity:** Beta. Well-documented, active development.
- **Why it matters:** Upgrade from Knowledge Graph Memory when exact-match search becomes limiting. Semantic recall is more natural for fuzzy project knowledge.
- **Maps to:** Cross-session context persistence (semantic upgrade).
- **Effort:** Moderate. Requires ChromaDB (or Cloudflare Workers deployment).

#### 7. Task Master AI
- **URL:** github.com/eyaltoledano/claude-task-master
- **What:** Parses PRDs into structured tasks with dependency tracking. 36 MCP tools. Integrates with Perplexity for research-backed subtask generation.
- **Maturity:** Production. Reports 90% fewer errors via structured decomposition.
- **Why it matters:** When you have complex features (audit pipeline, dashboard), this decomposes them more rigorously than manual task lists. Dependency tracking prevents out-of-order execution.
- **Maps to:** Feature decomposition, multi-session task tracking.
- **Effort:** Moderate. Selective tool loading needed (full load = 21K tokens).

#### 8. Claude Context Local (FarhanAliRaza)
- **URL:** github.com/FarhanAliRaza/claude-context-local
- **What:** Local codebase indexing with hybrid search (BM25 + vector). ~40% token reduction at equivalent retrieval quality.
- **Maturity:** Beta.
- **Why it matters:** As the monorepo grows, finding relevant code becomes the bottleneck. 40% token reduction = longer effective sessions = fewer handoffs = less context loss.
- **Maps to:** Codebase navigation, context efficiency.
- **Effort:** Moderate. Needs local embedding model.

### Tier 3 — Evaluate Later

| Tool | What | When |
|------|------|------|
| **Continuous-Claude v3** (parcadei) | Full multi-session framework: ledgers, handoffs, 32 agents, 109 skills | When META_OS patterns stabilize and you want to automate handoffs |
| **Claude-Flow** (ruvnet) | Multi-agent orchestration with cost-optimized routing | When you need parallel agent execution beyond Claude Code's built-in Task tool |
| **ContextStream** | Cloud SaaS for persistent memory + GitHub/Slack/Notion integration | When local memory becomes insufficient |
| **ADR Analysis MCP** | AI-powered architecture decision records | When the project has enough decisions to track formally |
| **Spec Workflow MCP** (Pimzino) | MCP version of spec-workflow with web dashboard | When cc-sdd proves insufficient |
| **GitHub Spec Kit** | GitHub's SDD toolkit with TDD enforcement | Alternative to cc-sdd if you prefer GitHub's approach |

### Null Spaces — Build-Time Gaps That Don't Exist Yet

1. **Turborepo Graph MCP.** Nx has an MCP server exposing monorepo structure to AI. Turborepo has nothing. You'd need to build a wrapper around `turbo run --graph` output to expose workspace dependencies, task configs, and file ownership to Claude Code via MCP.

2. **Spec-to-Test Validator.** cc-sdd has `validate-impl` but no tool automatically generates test cases from spec acceptance criteria and verifies coverage. The closest is GitHub Spec Kit's TDD enforcement, but it's manual. An automated spec → test → coverage validator is missing.

3. **Session Cost Tracker.** No tool tracks token usage, API costs, and session efficiency across multi-session development. You can't answer "how much did this feature cost to build with Claude?" This would be a simple hook (PostToolUse) that logs token counts to a file.

4. **CLAUDE.md Linter.** No tool validates CLAUDE.md files for common anti-patterns (too long, contradictory rules, stale references to deleted files). A simple script checking file length, reference validity, and rule conflicts would prevent configuration drift.

---

## Part 2: Product-Integrated Tooling

### What You Already Have Right (Confirmed by Research)

Your TOOLS_AND_SERVICES.md choices are validated. Specifically:

| Decision | Verdict | Notes |
|----------|---------|-------|
| Vercel AI SDK v6 for all LLM | Correct | v6 adds native MCP client, agents, DevTools |
| Firecrawl for crawling | Correct | Hobby tier $16/mo covers 10+ audits. Self-host option on Hetzner for $0 |
| Inngest for pipeline | Correct | No real alternative for durable TypeScript steps at this price |
| Puppeteer for PDF | Correct | React-PDF is confirmed #1 time-waster risk |
| Resend + React Email | Correct | Free tier (3K/mo) covers solo consultant for years. React Email 5.0 adds Tailwind 4 |
| Notion MCP for client mgmt | Correct | v2.0 (Jan 2026) uses data sources abstraction, official hosted MCP |
| Stripe MCP | Correct | Official MCP at mcp.stripe.com. Agent Toolkit supports AI SDK directly |
| OpenAI + Perplexity + Gemini for monitoring | Correct | Direct API calls replicate GEO platforms at ~$100/mo vs $300-500/mo |

### Tier 1 — Add Immediately (High Impact, Low Effort)

#### 1. Google PageSpeed Insights API (FREE)
- **URL:** developers.google.com/speed/docs/insights/v5/about
- **What:** Free API returning Lighthouse scores (performance, accessibility, best practices, SEO) + Core Web Vitals from real Chrome User Experience data.
- **Pricing:** Free. No API key required for basic use.
- **Why it matters:** Direct feed into your Technical Readiness scoring pillar (10 points). Zero cost, zero reason to defer. Single REST call per URL.
- **Pipeline stage:** ANALYZE → SCORE (Technical Readiness)
- **Integration:** Drop-in. Wrap as typed tool function:
  ```typescript
  // One fetch call, structured response
  const result = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile`);
  ```
- **Effort:** 30 minutes.

#### 2. Xpoz MCP (Social Brand Monitoring)
- **URL:** xpoz.ai
- **What:** Single MCP server covering Twitter/X, Reddit, Instagram, TikTok. Natural language queries. Includes sentiment analysis, influence scoring, bot detection, trend detection.
- **Pricing:** Free: 100K results/month. Pro: $20/mo (1M results).
- **Why it matters:** Extends monitoring beyond AI engines into social signals. Most GEO tools lack this. The free tier covers 10 clients easily. Adds a data source for the AI Visibility pillar (brand mentions in social discourse).
- **Pipeline stage:** QUERY (social monitoring), ANALYZE (sentiment)
- **Integration:** Drop-in MCP. Add to `.claude/settings.json`.
- **Effort:** 15 minutes to add MCP. 2-4 hours to integrate into scoring.

#### 3. DataForSEO (Pay-As-You-Go SEO Intelligence)
- **URL:** dataforseo.com
- **What:** 15+ APIs through one integration: SERP tracking, keyword research, backlinks, on-page SEO, AI Summary endpoint. Covers Google, Bing, Yahoo, Baidu, YouTube.
- **Pricing:** $50 minimum deposit, no subscription. $0.0006/request (standard), $0.002/request (live). AI Summary: $0.01/task.
- **Why it matters:** Replaces Ahrefs ($999/mo API) and SEMrush ($450/mo API) at 5% of the cost. Pay-as-you-go means zero waste. The AI Summary endpoint is directly useful for competitive analysis.
- **Pipeline stage:** CRAWL (SERP data), ANALYZE (competitive intel), SCORE
- **Integration:** Moderate. REST API, no MCP server yet. Wrap as typed tool functions.
- **Effort:** 4-8 hours to build typed wrappers for the endpoints you need.

### Tier 2 — Add After First 3 Clients

| Tool | What It Adds | Cost | Integration | Pipeline Stage |
|------|-------------|------|-------------|---------------|
| **Serper** (serper.dev) | Fastest/cheapest Google SERP API. $1/1K queries. 2,500 free credits | $0-50/mo | Drop-in (REST + community MCP) | QUERY (traditional SERP) |
| **Apify** (selective Actors) | Marketplace of 10K+ scrapers. Google Reviews, Yelp, directories | $0-39/mo | Moderate (MCP available) | CRAWL (reviews), ANALYZE |
| **SerpAPI** (already planned) | AI Overview panel capture, Knowledge Graph, Local Pack | $75/mo (5K searches) | Drop-in (official MCP) | QUERY (AI Overview) |

### Tier 3 — Defer Until Revenue > $5K/month

| Tool | Why Defer | Monthly Cost |
|------|----------|-------------|
| Ahrefs/SEMrush/Moz APIs | DataForSEO covers 80% at 5% of cost | $250-999 |
| Goodie AI / AthenaHQ / Profound / Bluefish | Pare replicates this at ~$100/mo | $300-500 |
| Wappalyzer API | Nice-to-have, not core to scoring | $250 |
| BrightLocal | Overkill until 10+ retainer clients | $39+ |
| Bright Data MCP | Xpoz covers social; Firecrawl covers web | Variable |
| Google Business Profile API | Requires client-granted OAuth access | Free but restrictive |

### Never Build (Always Buy)

| Capability | Tool | Why |
|-----------|------|-----|
| Web crawling | Firecrawl | Anti-bot evasion, JS rendering, proxy rotation |
| Email delivery | Resend | Deliverability, SPF/DKIM, compliance |
| Payments | Stripe | PCI compliance |
| Background jobs | Inngest | Durability, retries, observability |
| Social scraping | Xpoz / Apify | Platform TOS, anti-scraping |
| SERP scraping | Serper / DataForSEO | Google anti-bot |

### Null Spaces — Product Gaps That Don't Exist Yet

1. **GEO Score History API.** No tool tracks AI visibility scores over time across providers with trend analysis. The GEO platforms (Goodie, AthenaHQ) build this as their core feature — it's what justifies their $300-500/mo. Your `monitoringResults` table + weekly Inngest jobs IS this feature. Build it.

2. **Cross-Provider Citation Tracker.** Perplexity returns citations natively. OpenAI's web_search returns sources. Gemini's grounding returns search results. But no tool normalizes these into a unified "citation graph" showing which of the client's pages are cited, by which AI engine, for which queries, over time. This is core IP.

3. **AI Accuracy Scorer.** No tool evaluates whether AI engine responses about a business are factually correct (right address, right hours, right services, right pricing). This requires comparing AI responses against known-truth data (GBP, client-provided facts). Page 8 of your audit report ("AI Accuracy") depends on this. Build it.

4. **Vertical-Specific Prompt Library as a Service.** Your `promptLibrary` table stores query templates per vertical. No external tool provides GEO-specific prompts optimized per vertical (plumber vs dentist vs restaurant). This is differentiated IP.

---

## Cost Summary (10 Clients, Full Stack)

### Monthly Operating Costs

| Category | Tool(s) | Cost |
|----------|---------|------|
| AI Engine Monitoring | OpenAI + Perplexity + Gemini APIs | ~$100 |
| Site Crawling | Firecrawl Hobby | $16 |
| GBP Data | Google Places API | ~$10 |
| SEO Data | DataForSEO (pay-as-you-go) | ~$5-15 |
| Social Monitoring | Xpoz free tier | $0 |
| Technical Analysis | PageSpeed Insights API | $0 |
| Email | Resend free tier | $0 |
| Client Management | Notion Plus | $12 |
| Hosting | Hetzner CPX21 + Coolify | ~$13 |
| **Total** | | **~$156-166/mo** |

At $500/audit or $500/mo retainer, you're profitable from client #1.

### Build-Time Tooling Costs

| Tool | Cost |
|------|------|
| cc-sdd | Free |
| Knowledge Graph Memory MCP | Free |
| dependency-cruiser | Free |
| mcp-to-ai-sdk | Free |
| Superpowers | Free |
| **Total** | **$0/mo** |

---

## Corrections to Existing Docs

Research revealed these updates needed in `docs/TOOLS_AND_SERVICES.md`:

1. **Gemini grounding pricing changed.** Now $14/1K search queries (was $35/1K). Update the cost table.
2. **Perplexity citations are free.** Citation tokens no longer billed separately (2026 change). Reduces monitoring costs.
3. **React Email 5.0 released.** Adds Tailwind 4, dark mode across clients, React 19.2 support.
4. **AI SDK v6 released.** Adds native MCP client (`createMCPClient()`), agents, DevTools, reranking, image editing. Update the docs reference.
5. **Notion MCP v2.0 released (Jan 2026).** Uses data sources as primary abstraction. Official hosted MCP with OAuth.

---

## Competitive Intelligence: GEO Platform Landscape

These are Pare's competitors, not its tools. Their existence validates the market:

| Platform | Pricing | Key Differentiator |
|----------|---------|-------------------|
| **Goodie AI** (higoodie.com) | $199-495/mo | Full GEO platform: visibility tracking, citations, content optimization |
| **AthenaHQ** (athenahq.ai) | $295-499/mo | Y Combinator-backed. Citation Engine (ACE), Shopify/GA integrations |
| **Profound** (tryprofound.com) | Enterprise | Share of voice across 8+ AI engines |
| **Bluefish** (govisible.ai) | Enterprise | Real-time multi-engine visibility, sentiment, safety metrics |

**Pare's advantage:** These charge $300-500/mo for programmatic querying of AI engines + scoring + reporting. Pare does the same with ~$100/mo in direct API costs PLUS provides the implementation sprint and retainer services they can't offer. The audit-to-implement-to-verify loop remains the moat.

**Market validation:** Gartner predicts 25% drop in traditional search volume by 2026. 27% of U.S. consumers now use chatbots over traditional search. Mid-market GEO budgets: $75K-$150K annually.

---

## Action Items (Ordered by Leverage)

### This Week
1. `npx cc-sdd@latest --claude --lang en` — formalize spec-driven sessions
2. Add Knowledge Graph Memory MCP to `.claude/settings.json`
3. `pnpm add -D dependency-cruiser` — define architecture boundary rules
4. Add Google PageSpeed Insights API call to technical readiness analysis

### Before First Client
5. Add Xpoz MCP for social monitoring capability
6. Integrate DataForSEO for competitive SEO data
7. Install `mcp-to-ai-sdk` for production MCP safety
8. Update `docs/TOOLS_AND_SERVICES.md` with pricing corrections

### After First 3 Clients
9. Evaluate Superpowers skills for TDD/debugging discipline
10. Add Serper for traditional SERP tracking
11. Add selective Apify Actors for review site scraping
12. Consider semantic memory upgrade (doobidoo MCP Memory Service)
