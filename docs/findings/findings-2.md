# Pare Engine — Tooling Gap Analysis

> Research date: 2026-02-10
> Scope: Build-time developer tooling + product-integrated APIs/MCPs

---

## Part 1: Build-Time Tooling

Tools that accelerate multi-session agentic development with Claude Code.

### 1.1 Session Continuity & Memory

The core problem: every new Claude Code session starts blank. These tools solve "stop re-explaining your project."

| Tool | What It Does | Maturity | Leverage |
|------|-------------|----------|----------|
| **Anthropic Initializer Pattern** | `claude-progress.md` + `git log` as the state machine. Zero dependencies. Published by Anthropic's engineering team. Each session reads the progress file, does work, updates it. | Production pattern | **Highest** — free, canonical, proven |
| **Precompact Hook** ([mvara-ai/precompact-hook](https://github.com/mvara-ai/precompact-hook)) | Fires before auto-compaction, saves an LLM-interpreted recovery summary to disk. Captures the precise state that would be lost. | Experimental | **High** — solves the compaction precision-loss problem |
| **mcp-memory-service** ([doobidoo](https://github.com/doobidoo/mcp-memory-service)) | Semantic memory via vector embeddings + SQLite. Survives across sessions. Queries like "authentication issues" find "JWT errors." Optional cloud sync. | Production (13+ integrations) | **Medium** — useful when the project grows beyond what a progress file covers |
| **Continuous-Claude v3** ([parcadei](https://github.com/parcadei/Continuous-Claude-v3)) | Full lifecycle system: 30 hooks, auto-generated CONTINUITY ledgers, 5-layer code summarization (TLDR-code), session branching. | Beta (v3) | **Medium** — comprehensive but heavy; cherry-pick the ledger pattern |
| **mcp-memory-keeper** ([mkreyman](https://github.com/mkreyman/mcp-memory-keeper)) | 38 tools: knowledge graph, session branching/merging, journal entries, progressive compression, heatmaps. SQLite-backed. | Beta | **Low-medium** — feature-rich but overlaps with simpler approaches |

**Recommendation:** Start with the Anthropic Initializer Pattern (create `claude-progress.md`, reference it in CLAUDE.md). Add the Precompact Hook for compaction resilience. Graduate to `mcp-memory-service` when the project has 50+ files and cross-session micro-learnings become valuable.

**What's missing (null space):** No tool auto-generates a structured handoff from git diff + changed files + test results. You'd need a custom SessionEnd hook that runs `git diff --stat`, captures test output, and writes a formatted handoff file. This is ~50 lines of shell script.

---

### 1.2 Codebase Intelligence

The core problem: Claude reads files linearly. These tools give it semantic understanding.

| Tool | What It Does | Maturity | Leverage |
|------|-------------|----------|----------|
| **Serena** ([oraios/serena](https://github.com/oraios/serena)) | LSP-powered symbol-level code navigation via MCP. `find_symbol`, `find_referencing_symbols`, `insert_after_symbol`. Works with any language that has LSP support. | Production | **Highest** — "game changer" per user reports; eliminates grep-based discovery |
| **Context7** ([upstash/context7](https://github.com/upstash/context7)) | Fetches live, version-specific library docs and injects into context. Covers Vercel AI SDK, Drizzle, Next.js, etc. | Production (Upstash-backed) | **Highest** — eliminates stale API signature hallucinations across sessions |
| **Probe** ([probelabs/probe](https://github.com/probelabs/probe)) | Zero-setup semantic code search. ripgrep + tree-sitter. No indexing step — works immediately on any codebase. Returns complete code blocks. | Production | **High** — zero-friction; ideal for a codebase still taking shape |
| **Claude Context** ([zilliztech/claude-context](https://github.com/zilliztech/claude-context)) | Semantic code search with BM25 + vector hybrid. AST-aware chunking. Merkle tree incremental indexing. 40%+ token reduction reported. | Production (Zilliz-backed) | **Medium-high** — more accurate than Probe but requires indexing setup |
| **Code-Index-MCP** ([ViperJuice](https://github.com/ViperJuice/Code-Index-MCP)) | 48-language tree-sitter, Voyage AI embeddings, dependency tracking, file system monitoring, sub-100ms queries. | Beta | **Medium** — Voyage AI API cost; strong dependency tracking feature |

**Recommendation:** Install Serena + Context7 immediately. These are the highest-leverage pair: Serena gives Claude IDE-level code navigation (find all references to `AuditResult`, trace callers of `scoreAIVisibility()`), and Context7 ensures AI SDK v6 / Drizzle / Next.js 15 code is generated against current docs, not stale training data. Add Probe as the general search fallback.

**What's missing (null space):** No MCP provides a Turborepo-aware workspace graph. Nx has one (`@nrwl/nx-console`), but Turborepo doesn't. You'd need a custom wrapper around `turbo query` (GraphQL interface) exposed as an MCP tool. Alternatively, a simple hook that runs `turbo run build --dry-run --graph` at session start and injects the package dependency tree.

---

### 1.3 Task Orchestration & Dependency Graphs

The core problem: multi-session projects need structured plans with dependency tracking.

| Tool | What It Does | Maturity | Leverage |
|------|-------------|----------|----------|
| **Task Master** ([eyaltoledano/claude-task-master](https://github.com/eyaltoledano/claude-task-master)) | AI-powered task decomposition from PRDs/specs. 36 MCP tools: dependency tracking, complexity estimation, subtask generation. "What's the next unblocked task?" | Production (widely used) | **High** — directly maps to phased development across sessions |
| **Turborepo native tools** (`turbo query`, `turbo run --graph`) | Built-in package/task dependency visualization. GraphQL API for querying workspace structure. | Production (core Turbo) | **Medium** — not MCP-packaged but invocable via Bash |

**Recommendation:** Install Task Master. Feed it the docs (ARCHITECTURE.md, AUDIT_PIPELINE.md, SCORING_ALGORITHM.md) and let it decompose into a dependency-aware task graph. Each session queries "next unblocked task" instead of deciding what to work on.

**What's missing (null space):** No tool connects Task Master's task graph to git history — i.e., "this commit completed task #7, auto-mark it done and unblock task #8." This would require a PostToolUse hook on git commit that parses the commit message for task references and calls Task Master's API.

---

### 1.4 Spec Validation & Schema Enforcement

| Tool | What It Does | Maturity | Leverage |
|------|-------------|----------|----------|
| **Drizzle MCP** ([defrex/drizzle-mcp](https://github.com/defrex/drizzle-mcp)) | Query actual DB schema vs. Drizzle schema.ts. Catches drift from `drizzle-kit push`. | Beta | **Medium** — prevents schema assumption bugs across sessions |
| **Playwright MCP** ([microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp)) | Browser automation for E2E testing via MCP. Microsoft-maintained. | Production | **Medium** — build-then-verify workflow across sessions |
| **SEO Inspector MCP** ([mgsrevolver](https://glama.ai/mcp/servers/@mgsrevolver/seo-inspector-mcp)) | Validates Schema.org JSON-LD from live URLs. Reports missing types and properties. | Beta | **Low-medium** — useful for validating audit recommendations |

---

### 1.5 Hooks, Skills & Community Patterns

Reference repositories to mine for patterns:

| Resource | What It Provides |
|----------|-----------------|
| **awesome-claude-code** ([hesreallyhim](https://github.com/hesreallyhim/awesome-claude-code)) | Curated directory of skills, hooks, agents, plugins |
| **claude-code-showcase** ([ChrisWiles](https://github.com/ChrisWiles/claude-code-showcase)) | Complete .claude/ directory reference: hooks, skills, scheduled GH Actions agents |
| **claude-code-hooks-mastery** ([disler](https://github.com/disler/claude-code-hooks-mastery)) | Working examples for every hook type (PreCompact, SessionEnd, PreToolUse, etc.) |
| **awesome-claude-code-subagents** ([VoltAgent](https://github.com/VoltAgent/awesome-claude-code-subagents)) | 100+ subagent definitions: code review, test gen, security, refactoring |
| **pro-workflow** ([rohitg00](https://github.com/rohitg00/pro-workflow)) | Self-correcting memory, parallel worktrees, wrap-up rituals |
| **awesome-cursorrules** ([PatrickJS](https://github.com/PatrickJS/awesome-cursorrules)) | 5,000+ coding rules — port relevant ones to `.claude/rules/` |
| **Anthropic best practices** ([code.claude.com/docs/en/best-practices](https://code.claude.com/docs/en/best-practices)) | Compaction directives, hook enforcement, CLAUDE.md sizing |

**Key pattern to implement:** Add a compaction directive to CLAUDE.md:
```
When compacting, always preserve: the current task, all modified file paths, scoring weights (30/30/15/10/15), test commands run, and any blocking issues.
```

---

### Build-Time Priority Stack (Install Order)

```
Day 1:  Context7 + Serena          → accurate docs + symbol navigation
Day 1:  claude-progress.md         → zero-cost session continuity
Day 2:  Precompact Hook            → compaction resilience
Day 2:  Task Master                → structured task orchestration
Week 1: Probe                      → general semantic search
Week 1: Drizzle MCP                → schema development acceleration
Week 2: mcp-memory-service         → persistent cross-session knowledge
```

---

## Part 2: Product-Integrated Tooling

APIs and MCPs that become features inside the dashboard.

### 2.1 Site Crawling (Audit Pipeline Step 1)

| Tool | What It Does | Cost | Verdict |
|------|-------------|------|---------|
| **Firecrawl** ([firecrawl.dev](https://docs.firecrawl.dev)) | LLM-ready markdown + HTML. `map()` for URL discovery, `crawl()` for extraction. MCP server available. 7s avg, 83% accuracy. | Usage-based | **Use this** — already mandated |
| **Crawl4AI** ([unclecode/crawl4ai](https://github.com/unclecode/crawl4ai)) | Open-source Python crawler. 58K GitHub stars. Self-hostable. LLM-based extraction. | Free (self-host) | **Fallback** — if Firecrawl costs spike at 50+ audits/month, run in Docker on Hetzner |
| **Apify MCP** ([apify/apify-mcp-server](https://github.com/apify/apify-mcp-server)) | Gateway to 10K+ scrapers. Reddit, Google Maps, Twitter, Yelp Actors. | $5 free, $49/mo paid | **Add for social/directory scraping** — not a crawl replacement |
| **Bright Data MCP** ([brightdata/brightdata-mcp](https://github.com/brightdata/brightdata-mcp)) | Enterprise scraping: proxy rotation, CAPTCHA solving. Google Maps reviews, Twitter, LinkedIn endpoints. | $500+/mo | **Defer** — only if anti-bot blocking becomes a problem |

---

### 2.2 AI Engine Monitoring (Audit Pipeline Step 2)

These are the "sensors" — you query them with client-specific prompts and extract mention/citation/sentiment data.

| Provider | Integration | Cost per 20-query audit | Key Feature |
|----------|------------|------------------------|-------------|
| **OpenAI Responses API** (web_search) | `@ai-sdk/openai` | ~$0.10 | Live web search, inline citations, highest user traffic |
| **Perplexity Sonar** | `@ai-sdk/perplexity` or direct | ~$0.05 | Native citations in metadata (free citation tokens), search-first platform |
| **Google Gemini** (grounding) | `@ai-sdk/google` | ~$0.08 | Approximates Google AI Overviews — the #1 AI surface for local businesses |

All three are already mandated in CLAUDE.md. Total monitoring cost per audit: ~$0.25.

**Supplementary data sources (build-vs-buy decision):**

| Tool | What It Does | Cost | Verdict |
|------|-------------|------|---------|
| **Peec.ai API** ([peec.ai](https://peec.ai)) | Multi-platform AI visibility tracking with API access. 300+ prompts/day on higher tiers. | EUR 89-499/mo | **Evaluate at launch** — use as validation layer for your own direct-query data |
| **Ahrefs Brand Radar** ([ahrefs.com/brand-radar](https://ahrefs.com/brand-radar)) | 200M+ prompts tracked. Competitor gap analysis. 6 AI engines. | $828+/mo | **Defer** — study their methodology, don't subscribe until enterprise tier |
| **Profound** ([profound.com](https://www.profound.com)) | Market leader. Real user prompts. AI crawler analytics. Sequoia-backed. | $499+/mo | **Defer** — study as the "what Pare becomes at scale" reference |
| **Otterly.ai** ([otterly.ai](https://otterly.ai)) | 25-factor GEO audit. Agency white-label. | $29-422/mo | **Study** — their 25-factor audit is the methodology benchmark to beat |

**Critical build-vs-buy decision:** The monitoring code IS the moat. Build it in-house via direct API queries. Use Peec.ai ($89/mo) as a validation/supplementary source during launch only. Never create dependency on an external platform for primary audit data.

---

### 2.3 SERP & Traditional SEO Data

| Tool | What It Does | Cost | Verdict |
|------|-------------|------|---------|
| **Serper API** ([serper.dev](https://serper.dev)) | Google SERP JSON: organic, AI overviews, local pack, PAA. Official MCP server. | $50/mo for 50K queries | **Use this** — 10x cheaper than SerpAPI, covers the use case |
| **SerpAPI** ([serpapi.com](https://serpapi.com)) | Multi-engine SERP. AI Overview extraction. Industry standard. | $75/mo for 5K searches | **Skip** — Serper is cheaper with more queries |
| **Semrush MCP** ([developer.semrush.com](https://developer.semrush.com/api/basics/semrush-mcp/)) | Full SEO suite via MCP: keywords, backlinks, traffic, AI visibility. | $130+/mo | **Defer** — only if clients demand unified SEO+GEO reports |
| **Moz API** | Domain Authority, backlinks, spam scores. | $99+/mo | **Defer** — DA is a nice-to-have signal, not a scoring input |

**Recommendation:** Add Serper API ($50/mo) for SERP position tracking and local pack detection. This feeds the AI Visibility pillar (does the client appear in traditional results that AI engines cite?) and provides data for the Technical Readiness pillar.

---

### 2.4 Google Business Profile & Local Data

| Tool | What It Does | Cost | Verdict |
|------|-------------|------|---------|
| **Google Places API (New)** | GBP data: name, address, phone, website, reviews, ratings, hours, photos. | $17/1K requests ($200 free/mo) | **Use this** — critical for Local/GBP pillar (15 pts) |
| **Google Business Profile API** | Manage GBP: update info, respond to reviews, post updates. Requires owner auth. | Free (requires OAuth) | **Use in implementation sprints** — not audit phase |
| **Apify Google Maps Scraper** | Scrapes Maps data without Google Cloud billing. | Via Apify credits | **Use for competitor analysis** — bulk scrape competitors cheaply |
| **BrightLocal API** ([brightlocal.com](https://www.brightlocal.com)) | Citation tracking, GBP audit, NAP consistency checking, review monitoring. | $39-79/mo | **Evaluate at 5+ clients** — saves building custom directory checkers |

**Recommendation:** Google Places API on day one for GBP completeness checking and review extraction. Apify Google Maps Scraper for bulk competitor data. Defer BrightLocal until manual NAP checking becomes a bottleneck.

---

### 2.5 Social & Third-Party Signals

| Tool | What It Does | Cost | Verdict |
|------|-------------|------|---------|
| **Apify Reddit Scraper** (via MCP) | Posts, comments, community data. No login required. | Via Apify credits | **Use this** — Reddit is heavily cited by AI engines |
| **Apify Twitter Scraper** (via MCP) | Tweets, profiles, engagement metrics. | Via Apify credits | **Add month 1** — secondary signal for brand reputation |
| **Reddit Official API** | OAuth-based, 100 queries/min. More reliable than scraping. | Free (rate-limited) | **Use as primary**, Apify as fallback |
| **Google Alerts** (RSS) | Free new-mention detection. Parse via n8n RSS node. | Free | **Set up for all clients** — zero-cost monitoring trigger |

---

### 2.6 Schema & Structured Data Analysis

| Tool | What It Does | Verdict |
|------|-------------|---------|
| **Custom JSON-LD Parser** (cheerio/jsdom) | Parse HTML, extract `<script type="application/ld+json">`, identify types, check completeness | **Build this** — this is core IP |
| **Schema.org Validator** | Validate extracted JSON-LD against Schema.org specs | **Use as validation step** after custom parsing |
| **SEO Inspector MCP** | Validate Schema.org from live URLs | **Use during development** to verify audit recommendations |

---

### 2.7 CRM, Payments, Email (Already Mandated)

| Tool | Status | Notes |
|------|--------|-------|
| **Notion MCP** ([developers.notion.com/docs/mcp](https://developers.notion.com/docs/mcp)) | Official hosted MCP. OAuth auth. | Client management for first 10 clients. Use hosted version (actively maintained). |
| **Stripe MCP** ([docs.stripe.com/mcp](https://docs.stripe.com/mcp)) | Official. `@stripe/agent-toolkit` npm. | Dev: MCP for product/price setup. Prod: webhook API for payment confirmation. |
| **Resend MCP** ([resend.com/mcp](https://resend.com/mcp)) | Official. 49 tools. | Dev: MCP for domain/template setup. Prod: API for transactional email. 3K/mo free. |
| **React Email** ([react.email](https://react.email)) | v5.1. Production. | Branded email templates with Pare colors. Pairs with Resend. |

---

### 2.8 Workflow & Background Jobs (Already Mandated)

| Tool | Status | Notes |
|------|--------|-------|
| **Inngest** | Self-host on Postgres. MCP dev server. | Entire audit pipeline. Each step independently retriable. |
| **n8n** (self-hosted) | Docker on Hetzner. Community MCP server. | Cron triggers only (5-min timeout). Monday 8am monitoring runs. Webhook receiver for audit form. |

---

### 2.9 Meta-Platform (Evaluate Later)

| Tool | What It Does | Cost | Verdict |
|------|-------------|------|---------|
| **Composio** ([composio.dev](https://composio.dev)) | 500+ managed integrations through a single MCP gateway. Handles OAuth, rate limiting, retries. | Usage-based | **Evaluate at 7+ integrations** — currently manageable without it |

---

## Part 3: Null Spaces (Things That Should Exist But Don't)

### Build-Time Gaps

1. **Turborepo MCP Server** — Nx has one; Turborepo doesn't. A wrapper around `turbo query` (GraphQL) exposed as MCP tools would give Claude instant understanding of package dependencies and affected-graph analysis.

2. **Auto-handoff hook** — No pre-built hook auto-generates a structured session handoff from `git diff --stat` + test results + task progress. Needs ~50 lines of custom shell script as a SessionEnd hook.

3. **Task-to-git bridge** — No tool connects Task Master's dependency graph to git commits. Completing a commit should auto-mark the relevant task done and unblock downstream tasks. Needs a PostToolUse hook on git commit.

4. **Scoring spec enforcer** — No hook validates that edits to scoring files maintain correct weights (30/30/15/10/15) summing to 100. A PreToolUse hook on Edit could parse changes to `scoring.ts` and warn if weights drift.

5. **Cross-package type consistency checker** — No MCP validates that a TypeScript interface changed in `packages/core` is updated in all consuming packages. Serena's `find_referencing_symbols` partially solves this, but a dedicated subagent running post-edit would be better.

### Product-Integrated Gaps

1. **AI citation tracker** — No off-the-shelf API tracks which specific URLs from a client's site get cited by AI engines over time. The expensive platforms (Ahrefs, Profound) do this at enterprise scale; nothing exists at the indie/SMB tier. This is Pare's core IP to build.

2. **GEO-specific prompt library API** — No service provides vertical-specific prompts optimized for testing AI visibility (e.g., "best dentist in Austin" variations). The `promptLibrary` table in the DB is the right approach; this is custom IP.

3. **AI crawler analytics** — No open-source tool tracks AI bot visits (GPTBot, ClaudeBot, PerplexityBot) to client websites with verification against official IP ranges. Profound offers this at $499/mo. Building a simple log parser + webhook for Vercel/Coolify access logs is straightforward.

4. **Automated NAP consistency checker** — No affordable API checks Name/Address/Phone consistency across 10+ directories for a single business. Yext ($199/location/year) and BrightLocal ($39-79/mo) exist but are expensive for the value. Building scrapers for the top 5 directories (Google, Yelp, Facebook, Apple Maps, Bing) via Firecrawl is the pragmatic path.

5. **Competitor gap prompt generator** — No tool automatically generates the prompt set "queries where competitors appear but the client doesn't." Ahrefs Brand Radar does this at $828/mo. Building this with a combination of competitor monitoring data + LLM-generated prompt variations is achievable.

---

## Part 4: Integration Roadmap (Priority Order)

### Week 1 — Foundation (Build-Time)
- [ ] Create `claude-progress.md` and reference in CLAUDE.md
- [ ] Install **Context7** MCP server
- [ ] Install **Serena** MCP server
- [ ] Install **Precompact Hook**
- [ ] Add compaction directive to CLAUDE.md
- [ ] Install **Task Master** MCP server, feed it architecture docs

### Week 2 — Core Pipeline (Product)
- [ ] Integrate **Firecrawl** in audit pipeline Step 1
- [ ] Integrate **OpenAI/Perplexity/Gemini** in Step 2
- [ ] Build **custom JSON-LD parser** for Step 3
- [ ] Implement **scoring algorithm** with correct weights for Step 4
- [ ] Build **Puppeteer PDF generation** for Step 5
- [ ] Set up **Inngest** pipeline orchestrating all steps

### Week 3 — Local & Social Data
- [ ] Integrate **Google Places API** for GBP data
- [ ] Set up **Apify MCP** with Reddit + Google Maps Actors
- [ ] Add **Serper API** for SERP position tracking
- [ ] Set up **Google Alerts** via RSS for all clients
- [ ] Build **NAP consistency checker** (top 5 directories via Firecrawl)

### Week 4 — Delivery Infrastructure
- [ ] Set up **Notion MCP** for client management
- [ ] Set up **Stripe MCP** for billing product creation
- [ ] Build **React Email** templates with Pare branding
- [ ] Configure **Resend** for report delivery
- [ ] Set up **n8n** cron triggers for weekly monitoring

### Month 2+ — Evaluate & Expand
- [ ] Evaluate **Peec.ai** API as visibility data validation
- [ ] Evaluate **BrightLocal** for directory tracking
- [ ] Consider **Composio** if integration management becomes painful
- [ ] Study **Profound** and **Otterly** methodologies for scoring refinement

---

## Appendix: Cost Projection (Monthly at Launch)

| Service | Cost | Purpose |
|---------|------|---------|
| Hetzner CPX21 | $8-13 | Hosting (Coolify, Postgres, n8n, Inngest) |
| Firecrawl | ~$19 (Hobby) | Site crawling |
| OpenAI API | ~$5 | Monitoring queries + web_search |
| Perplexity Sonar | ~$2 | Citation-rich monitoring |
| Google Gemini API | ~$3 | Google's AI view monitoring |
| Anthropic Claude API | ~$10 | Haiku parsing + Sonnet analysis |
| Serper API | $50 | SERP tracking (50K queries) |
| Google Places API | $0 (free tier) | GBP data ($200 credit covers it) |
| Apify | $0-49 | Reddit + Maps scrapers |
| Resend | $0 | Email (3K/mo free) |
| Stripe | 2.9% + $0.30/txn | Payment processing |
| Notion | $0 (free tier) | Client CRM |
| **Total fixed** | **~$100-150/mo** | Before Stripe transaction fees |

At a $497 one-time audit price point, breakeven is 1 audit per month with comfortable margin from audit #2 onward.
