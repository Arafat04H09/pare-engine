# Findings-3: Tooling Gap Analysis for Pare Engine

**Date:** February 10, 2026
**Scope:** Build-time agentic development tooling + Product-integrated MCPs/APIs
**Method:** Systematic search across MCP registries (mcp.so ~17,500 servers, glama.ai ~17,100, smithery.ai 7,300+ tools, official registry, awesome-mcp-servers 410 curated), GitHub, npm, community collections, API documentation, and blog posts. Only verified, documented tools included.

---

## Table of Contents

1. [Gap 1: Build-Time Tooling](#gap-1-build-time-tooling)
   - [1A. Memory & Session Continuity](#1a-memory--session-continuity)
   - [1B. Spec-Driven Development](#1b-spec-driven-development)
   - [1C. Codebase Indexing & Search](#1c-codebase-indexing--search)
   - [1D. Dependency & Architecture Analysis](#1d-dependency--architecture-analysis)
   - [1E. Slash Command & Hook Libraries](#1e-slash-command--hook-libraries)
   - [1F. Meta-MCPs & Ecosystem Tools](#1f-meta-mcps--ecosystem-tools)
2. [Gap 2: Product-Integrated Tooling](#gap-2-product-integrated-tooling)
   - [2A. AI Engine Monitoring (Core GEO)](#2a-ai-engine-monitoring-core-geo)
   - [2B. Web Scraping & Crawling](#2b-web-scraping--crawling)
   - [2C. SEO & Competitive Intelligence](#2c-seo--competitive-intelligence)
   - [2D. Social & Brand Monitoring](#2d-social--brand-monitoring)
   - [2E. Schema Validation](#2e-schema-validation)
   - [2F. Backend/Database MCPs](#2f-backenddatabase-mcps)
   - [2G. Client Reporting & Communication](#2g-client-reporting--communication)
   - [2H. GEO Competitors (Study, Don't Integrate)](#2h-geo-competitors-study-dont-integrate)
3. [Null Spaces: What Should Exist But Doesn't](#null-spaces-what-should-exist-but-doesnt)
4. [Priority Matrix](#priority-matrix)
5. [Cost Model: Single Audit Run](#cost-model-single-audit-run)
6. [Critical Patterns to Adopt (Not Tools)](#critical-patterns-to-adopt-not-tools)
7. [Sources](#sources)

---

## Gap 1: Build-Time Tooling

Tools that accelerate multi-session agentic development with Claude Code.

### 1A. Memory & Session Continuity

The #1 pain point for multi-session work. Six real solutions exist, at different weight classes.

| Tool | What It Does | Maturity | Integration Effort | Leverage |
|------|-------------|----------|-------------------|----------|
| **Native MEMORY.md** | Auto-captures session summaries to `~/.claude/projects/*/memory/`. First 200 lines loaded every session. Zero config. | Stable (built-in) | Zero | Baseline — already active |
| **claude-sessions** ([GitHub](https://github.com/iannuttall/claude-sessions)) | Slash commands for session tracking: `/project:session-start`, `session-update`, `session-end`. Produces timestamped markdown files. 1,100+ stars. | Stable | Low (install slash commands) | **HIGH** — lightweight, proven, no MCP overhead |
| **mcp-memory-service** ([GitHub](https://github.com/doobidoo/mcp-memory-service)) | ChromaDB-backed semantic memory with 5ms retrieval, time-based recall ("what did I work on Tuesday?"), decay scoring, consolidation, D3 dashboard. | Stable | Medium (ChromaDB dependency) | High for long-running projects |
| **Claude-Mem** ([GitHub](https://github.com/thedotmack/claude-mem)) | Auto-captures everything via hooks, compresses via AI, injects relevant context using "progressive disclosure" (summary first, detail on demand). SQLite + ChromaDB. | Beta | Medium | High — solves the "forgot to save state" problem |
| **Mem0 / OpenMemory** ([GitHub](https://github.com/mem0ai/mem0)) | Universal memory layer. Peer-reviewed (2025). 26% improvement over baselines, 91% lower p95 latency, 90%+ token savings vs. naive context stuffing. | Stable (enterprise) | Medium-High | Overkill for solo dev, excellent if sharing across tools |
| **Anthropic Knowledge Graph Memory** ([GitHub](https://github.com/modelcontextprotocol/servers/tree/main/src/memory)) | Official MCP reference server. Entities + relations + observations in JSONL. Simple, zero-dependency. | Stable (official) | Low | Good for structured project decisions |
| **Cognee MCP** ([GitHub](https://github.com/topoteretes/cognee)) | Full GraphRAG: `cognify` (build knowledge graphs from docs), `codify` (graph codebases), `search` (semantic retrieval). 12,100 stars. | High | Medium-High | Best for complex cross-session entity relationships |
| **Continuous-Claude v3** ([GitHub](https://github.com/parcadei/Continuous-Claude-v3)) | 32 agents, 30 hooks, 109 capabilities. Key innovation: "continuity ledgers" — machine-readable state files maintained by hooks at every event. | Experimental | High | Study the **PreCompact hook pattern** (see Patterns section) |

**Recommendation:** Install `claude-sessions` now (Tier 1). Add `mcp-memory-service` when the project outgrows 200 lines of MEMORY.md (Tier 2). Study Continuous-Claude v3's PreCompact hook pattern immediately.

---

### 1B. Spec-Driven Development

Your META_OS architecture needs tooling support. Four real options exist.

| Tool | What It Does | Maturity | Integration Effort | Leverage |
|------|-------------|----------|-------------------|----------|
| **GitHub Spec Kit** ([GitHub](https://github.com/github/spec-kit)) | Official GitHub SDD toolkit. 16,000+ stars in first week. Three phases: `/specify` → `/plan` → `/tasks`. Creates `.specify/` directory structure. Supports Claude Code, Copilot, Gemini CLI. MIT licensed. | Beta (experimental, per GitHub) | Low | **HIGH** — most authoritative, natural session boundaries |
| **cc-sdd** ([GitHub](https://github.com/gotalab/cc-sdd)) | "Kiro-style" SDD workflow. Commands: `/kiro:steering`, `/kiro:spec-init`, `/kiro:spec-requirements`, `/kiro:spec-design`, `/kiro:spec-tasks`, `/kiro:spec-impl`. Dependency-tracked parallel execution, project memory, TDD enforcement. | Beta | Low | **HIGH** — maps directly to your docs structure |
| **spec-workflow-mcp** ([GitHub](https://github.com/Pimzino/spec-workflow-mcp)) | MCP server with real-time web dashboard. Four-phase workflow: Steering → Specifications → Implementation → Verification. Approval workflows, visual progress bars. | Beta | Medium | High — adds visual spec status dashboard |
| **Claude Task Master** ([GitHub](https://github.com/eyaltoledano/claude-task-master)) | AI-powered PRD-to-task decomposition. 36 tools. Supports deferred MCP loading (saves ~16% of 200k context window). Multi-model. Most widely adopted task MCP. | Stable | Medium | **HIGH** — breaks specs into implementable tasks with dependencies |

**Recommendation:** Install `cc-sdd` OR `GitHub Spec Kit` (pick one, both are Tier 1). Add `Claude Task Master` with deferred loading for task decomposition (Tier 2). The spec-workflow-mcp dashboard is Tier 3.

**Martin Fowler validation:** [martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html) — Comparative analysis confirms specs serve as both implementation contracts and test oracles. SDD reduces defect rates vs. "vibe coding."

---

### 1C. Codebase Indexing & Search

Reduces multi-round file discovery (a major token-waste source in multi-session work).

| Tool | What It Does | Maturity | Leverage |
|------|-------------|----------|----------|
| **Context7** ([GitHub](https://github.com/upstash/context7)) | Pulls up-to-date, version-specific library docs into prompt context. Eliminates hallucinated/outdated API calls. **45,200 stars** — highest-starred dedicated MCP server. By Upstash. | Very High | **VERY HIGH** — prevents the #1 LLM coding failure mode |
| **Code-Index-MCP** ([GitHub](https://github.com/ViperJuice/Code-Index-MCP)) | 48-language tree-sitter indexing, hybrid BM25 + Voyage AI semantic search, sub-100ms queries, real-time file system monitoring, branch-specific indexes at `.indexes/`. | Stable | High for large codebases |
| **Claude Context** ([GitHub](https://github.com/zilliztech/claude-context)) | Hybrid BM25 + dense vector search on codebases. Milvus + Ollama. Merkle tree incremental re-indexing. ~40% token reduction vs. grep-only. | Stable | High for monorepos |
| **GitMCP** ([GitHub](https://github.com/idosal/git-mcp)) | Any GitHub repo as docs. Point at `gitmcp.io/{owner}/{repo}` — zero config, no API keys. 7,500 stars. | High | Medium — complements Context7 for niche repos |

**Recommendation:** Install **Context7** immediately (Tier 1 — prevents stale-docs errors across Vercel AI SDK, Drizzle, Inngest, etc.). Add Code-Index-MCP when the codebase grows past ~50 files (Tier 2).

---

### 1D. Dependency & Architecture Analysis

| Tool | What It Does | Maturity | Leverage |
|------|-------------|----------|----------|
| **Dependency-MCP** ([GitHub](https://github.com/mkearl/dependency-mcp)) | TypeScript/JS dependency graphs, import/export analysis, architectural rule scoring. Answers "what breaks if I change this interface?" | Beta | **HIGH** — validates monorepo boundaries (`packages/core` → `apps/web`, etc.) |
| **mcp-code-graph** ([GitHub](https://github.com/JudiniLabs/mcp-code-graph)) | Code graph analysis. `find_direct_connections` for impact analysis. Semantic code search + dependency exploration. | Beta | Medium — useful for cross-session change impact |

**Recommendation:** Install `Dependency-MCP` when you start building across packages (Tier 2). The architectural rule scoring can validate that implementations match ARCHITECTURE.md constraints.

---

### 1E. Slash Command & Hook Libraries

Curated collections that provide immediate development velocity.

| Collection | Scope | Stars/Quality |
|-----------|-------|--------------|
| **awesome-claude-code-toolkit** ([GitHub](https://github.com/rohitg00/awesome-claude-code-toolkit)) | 135 agents, 35 curated skills, 42 commands, 120 plugins, 19 hooks, 15 rules, 7 templates, 6 MCP configs | Comprehensive |
| **everything-claude-code** ([GitHub](https://github.com/affaan-m/everything-claude-code)) | 15+ agents, 30+ skills, 30+ commands. All hooks in Node.js (cross-platform). From Anthropic hackathon winner. | Battle-tested |
| **commands** ([GitHub](https://github.com/wshobson/commands)) | 57 production-ready commands: 15 multi-agent orchestration workflows + 42 single-purpose tools. TDD cycle, smart-fix, perf optimization. | Stable |
| **Claude-Command-Suite** ([GitHub](https://github.com/qdhenry/Claude-Command-Suite)) | 148+ commands, 54 agents. Namespace-organized: `/dev:code-review`, `/test:generate-test-cases`, `/deploy:prepare-release`. | Stable |
| **awesome-slash** ([GitHub](https://github.com/avifenesh/awesome-slash)) | 11 plugins, 40 agents, 26 skills. Cross-editor (Claude Code, OpenCode, Codex CLI). | Active |

**Hook references:**
- **claude-code-hooks-mastery** ([GitHub](https://github.com/disler/claude-code-hooks-mastery)) — Builder/Validator agent pattern, security hooks, TTS feedback, event logging
- **claude-code-showcase** ([GitHub](https://github.com/ChrisWiles/claude-code-showcase)) — Auto-format, test-on-change, TypeScript type-check, branch protection hooks + JIRA/GitHub/Slack MCP integrations

**Recommendation:** Cherry-pick from `everything-claude-code` and `commands` (Tier 1). Don't install entire suites — pick the 5-10 commands you'd actually use weekly.

---

### 1F. Meta-MCPs & Ecosystem Tools

| Tool | What It Does | Leverage |
|------|-------------|----------|
| **Pipedream MCP** ([Docs](https://pipedream.com/docs/connect/mcp)) | Single gateway to **2,500+ APIs** with built-in OAuth management. One MCP replaces dozens of individual integrations. 11,100 stars. | **VERY HIGH** — the "meta-MCP" for product integrations |
| **Sequential Thinking** ([Official MCP](https://github.com/modelcontextprotocol/servers)) | Structured step-by-step reasoning with branching/revision. 5,550+ Smithery uses. | Medium — improves complex decisions |
| **Playwright MCP** ([GitHub](https://github.com/microsoft/playwright-mcp)) | Browser automation via accessibility tree (not screenshots). By Microsoft. 24,400 stars. | High for E2E testing |
| **GitHub MCP** ([GitHub](https://github.com/github/github-mcp-server)) | Full GitHub lifecycle. Rewritten in Go with Anthropic. Remote MCP GA. 20,000+ stars. | Medium (you already have `gh` CLI) |

---

## Gap 2: Product-Integrated Tooling

Tools that become features inside the Pare dashboard.

### 2A. AI Engine Monitoring (Core GEO)

These are Pare's monitoring targets. All three are production-ready and cost-effective.

| Platform | API | What You Get | Cost per Audit (20 prompts) | Status |
|----------|-----|-------------|---------------------------|--------|
| **OpenAI Responses API + web_search** | `generateText()` via AI SDK | Grounded answers with web context. `web_search` tool enables real-time Google search within GPT responses. | ~$0.25 ($10/1K tool calls + tokens) | **Production.** Successor to Assistants API (sunset mid-2026). |
| **Perplexity Sonar API** | `generateText()` via AI SDK | Native citations in metadata. Three search modes: High/Medium/Low depth. **Citation tokens are FREE** on standard Sonar (changed 2025). | ~$0.01 (tokens only) | **Production.** Most important for GEO — explicit source citations. |
| **Google Gemini API + Grounding** | `generateText()` via AI SDK | `groundingMetadata` with exact search queries and sources. Auto-generates search queries from prompts. | **Free** (within 500-1,500 RPD free tier) | **Production.** Free tier covers dev + light production. |

**Combined per-audit API cost: ~$0.26-0.65**

**Vercel AI SDK v6** — Already specified. Key v6 features relevant to Pare:
- `ToolLoopAgent` class for multi-step audit pipeline
- `generateObject()` unified with `Output.object()` for structured outputs
- DevTools for debugging AI interactions
- Migration codemod: `npx @ai-sdk/codemod v6`

---

### 2B. Web Scraping & Crawling

| Tool | What It Does | Cost | Pare Role |
|------|-------------|------|-----------|
| **Firecrawl API + MCP** ([GitHub](https://github.com/firecrawl/firecrawl-mcp-server)) | URL discovery (`map`), page crawling (`crawl`), markdown + HTML output. V3 live. FIRE-1 model for JS-heavy pages. 5,200 stars. | Hobby $16/mo, Standard $83/mo. ~1 credit/page. | **Already specified.** Audit Step 1 (CRAWL). MCP enables agent-driven crawling. |
| **Browserbase MCP** ([GitHub](https://github.com/browserbase/mcp-server-browserbase)) | Cloud browser via Stagehand v3.0. Sessions, screenshots, JS execution, stealth mode, proxy support. | $39/mo (200 browser hours) | **Fallback** for JS-heavy sites Firecrawl can't handle (GBP pages, review aggregators, SPAs). |
| **Crawl4AI** ([GitHub](https://github.com/unclecode/crawl4ai)) | Open-source Python crawler. Fit Markdown, BM25 filtering, LLM extraction, parallel crawling. 58,000+ stars. V0.8.0 adds crash recovery + 5-10x prefetch. | Free (self-hosted) | **Backup** if Firecrawl costs become prohibitive. Python-only — needs wrapper for TS stack. |
| **Tavily MCP** ([GitHub](https://github.com/tavily-ai/tavily-mcp)) | Search API optimized for RAG. Real-time search, extract, map, crawl. | Free 1,000/mo, then $0.008/credit | Ad-hoc web research within audit pipeline. |

---

### 2C. SEO & Competitive Intelligence

| Tool | What It Does | Cost | Leverage for Pare |
|------|-------------|------|------------------|
| **DataForSEO API + MCP** ([GitHub](https://github.com/dataforseo/mcp-server-typescript)) | SERP data, keyword research, on-page analysis, backlinks. **AI Optimization module** for conversational optimization + LLM benchmarking. MCP server available. | **$0.60/1K SERPs** (pay-as-you-go, no subscription) | **HIGH** — cheapest comprehensive SEO data. AI Optimization module directly relevant to GEO. |
| **Serper.dev** ([serper.dev](https://serper.dev/)) | Google SERP as JSON. Maps, answer-box, knowledge panels. 1-2s response time. | **Free 2,500 queries**, then $0.30-1.00/1K. No subscription. | **HIGH** — best value SERP API. Maps data for Local/GBP pillar. Free tier covers dev. |
| **SE Ranking API + MCP** ([GitHub](https://github.com/seranking/seo-data-api-mcp-server)) | Keyword research, domain analysis, SERP analysis, rank tracking. **Local SEO API endpoints coming 2026.** MCP server free. | Business $207+/mo | Mid-tier option. Wait for Local SEO API. |
| **SEMrush AI Visibility Toolkit** | Tracks brand mentions across ChatGPT, AI Overviews, Perplexity, Gemini. | Standalone $99/mo, bundle $199/mo | Cross-validation of Pare's own audit findings. Tier 3. |
| **SerpAPI** | 80+ search engines. Most established. | $75/mo (5K searches) to $7K/mo | Reference-grade but expensive vs. alternatives. |
| **Moz API** | Domain Authority, Page Authority, Spam Score. | ~$99-299/mo | Most affordable of the big three. DA for audit reports. Tier 3. |
| **Ahrefs API v3** | DR, backlinks, traffic. Most comprehensive. | **$1,499/mo minimum.** | Skip entirely until enterprise clients. |

**Recommendation:** Use **Serper.dev** for SERP data (free 2,500 queries) + **DataForSEO** for comprehensive SEO data when needed ($0.60/1K). Skip Ahrefs/SEMrush/Moz at this stage.

---

### 2D. Social & Brand Monitoring

| Tool | What It Does | Cost | Leverage |
|------|-------------|------|---------|
| **Xpoz MCP** ([xpoz.ai](https://www.xpoz.ai/)) | Multi-platform social data: X, Instagram, TikTok, Reddit via one MCP interface. Native Claude/ChatGPT compatibility. | **Free 100K results/mo**, Pro $20/mo | **Best value** — free tier sufficient for monitoring a handful of clients across all platforms |
| **Apify Reddit Scraper MCP** ([Apify](https://apify.com/trudax/reddit-scraper/api/mcp)) | Reddit posts, comments, subreddits via MCP. | $20/mo Actor + $39/mo platform | Reddit-specific. Note: Reddit stopped free API keys Dec 2025. |
| **X API v2** | Full Twitter/X data access. | Basic $100/mo, Pro $5,000/mo | **Prohibitively expensive** for early stage. Use Xpoz instead. |
| **Brandwatch** | Enterprise social listening. | $800-15,000+/mo | Skip entirely. Enterprise pricing. |
| **Mention** | Social listening, sentiment. | $599+/mo | Skip. Maybe at 10+ retainer clients. |

**Recommendation:** Start with **Xpoz** free tier (100K results/mo covers early clients). Add Apify Reddit scraper only if Reddit monitoring becomes a specific client need.

---

### 2E. Schema Validation

| Tool | What It Does | Cost | Pare Role |
|------|-------------|------|-----------|
| **SEO Inspector & Schema Validator MCP** ([Glama](https://glama.ai/mcp/servers/@mgsrevolver/seo-inspector-mcp)) | Schema validation + on-page SEO inspection. Detects missing/malformed JSON-LD, RDFa, Microdata. | Free | **Directly maps to Schema pillar (15 points).** Automates gap detection. |
| **schema-org-mcp** ([GitHub](https://github.com/Hawstein/mcp-server-reddit)) | Schema.org type definitions and validation via MCP. | Free | Lightweight reference tool for schema types. |
| **Google Rich Results Test** | Official validator for rich snippet eligibility. | Free (web tool, no API) | Requires Puppeteer/Browserbase automation for programmatic use. |

**Recommendation:** Install SEO Inspector MCP when building the Schema/Structured Data scoring pillar. Combine with custom JSON-LD extraction from Firecrawl HTML output.

---

### 2F. Backend/Database MCPs

| Tool | What It Does | Cost | Pare Role |
|------|-------------|------|-----------|
| **Drizzle MCP** ([GitHub](https://github.com/defrex/drizzle-mcp)) | Drizzle ORM database ops via MCP. Schema management, migrations (`drizzle-kit push`), query execution, schema introspection. Auto-detects .env. | Free | **Directly specified in stack.** Enables agent-driven schema iteration. |
| **PostgreSQL MCP** ([Official](https://github.com/modelcontextprotocol/servers)) | Direct Postgres interaction. SQL queries, schema inspection. Read-only mode available. | Free | Supplement for ad-hoc queries bypassing Drizzle. |
| **Notion MCP** ([GitHub](https://github.com/makenotion/notion-mcp-server)) | Official. CRUD on pages, databases, blocks, comments. V2.0.0 with data sources abstraction. OAuth 2.1. | Free | **Already specified** for client management (first 10 clients). |
| **Stripe MCP** ([Docs](https://docs.stripe.com/mcp)) | Official. Products, subscriptions, payments, invoices. Hosted + local. | Free MCP, standard Stripe fees | **Already specified** for dev billing work. |
| **Supabase MCP** ([GitHub](https://github.com/supabase-community/supabase-mcp)) | 20+ tools. DB design, branching, TypeScript types, RLS. | Free | Not needed — Pare uses Drizzle + raw Postgres. Watch for migration path. |
| **Neon MCP** ([GitHub](https://github.com/neondatabase/mcp-server-neon)) | Serverless Postgres. Branching. (Neon acquired by Databricks for ~$1B, May 2025.) | Free tier generous | Only if migrating to serverless Postgres. Dev-only tool. |

---

### 2G. Client Reporting & Communication

| Tool | What It Does | Cost | Pare Role |
|------|-------------|------|-----------|
| **Resend + React Email 5.0** ([resend.com](https://resend.com/)) | Transactional + marketing email. React Email 5.0: dark mode, Tailwind 4, 8 new components. 2025: pay-as-you-go, inbound email via webhooks. | **Free 3K/mo**, Pro $20/mo | **Already specified.** Inbound email webhooks could enable client reply capture. |
| **Puppeteer** (self-hosted) + **Puppeteer MCP** | PDF generation from HTML/CSS templates. MCP enables agent-assisted template development. | Free | **Already specified.** MCP adds iterative template design during dev. |
| **Google Workspace MCP** ([GitHub](https://github.com/taylorwilsdon/google_workspace_mcp)) | 100+ tools: Gmail, Calendar, Drive, Docs, Sheets. OAuth 2.1. Google also announced official remote MCP support. | Free MCP | Automate client communication, Drive sharing, Calendar scheduling. Tier 2. |
| **DocRaptor** | Cloud PDF with CSS Paged Media. Better multi-page layouts than Puppeteer. | Usage-based | Evaluate if Puppeteer PDF layout proves insufficient for 9-page report. |
| **Doppio API** ([doppio.sh](https://doc.doppio.sh/)) | Managed Puppeteer. Same API, no headless Chrome management. | Usage-based | Evaluate if self-hosted Puppeteer reliability becomes an issue. |

---

### 2H. GEO Competitors (Study, Don't Integrate)

These validate Pare's market position. Use for feature parity research and spot-check validation.

| Competitor | What It Does | Cost | Insight for Pare |
|-----------|-------------|------|-----------------|
| **Otterly.AI** ([otterly.ai](https://otterly.ai/)) | Tracks brands across ChatGPT, Perplexity, AI Overviews, Gemini, Copilot. Share of voice, citation frequency, prompt coverage. | Lite $29/mo | **Most direct competitor.** Use Lite for cross-validation. None of these offer implementation services — Pare's audit-to-implement loop is the moat. |
| **Profound AI** ([tryprofound.com](https://www.tryprofound.com/)) | G2 Winter 2026 AEO Leader. 10+ engines, 200+ regions, 40 languages. Screenshot proof. Public API. SOC-2. | $499+/mo | Enterprise positioning. Screenshot-proof feature worth studying. |
| **Peec AI** | AI search analytics. Percentage-based visibility. Multi-language. | EUR 89/mo (~$95) | SMB-focused. Similar scoring model to Pare's 0-100 scale. |
| **SEMrush AI Visibility** | Tracks ChatGPT, AI Overviews, Perplexity, Gemini mentions. | $99/mo standalone | Useful cross-reference. US-only prompt tracking currently. |

**Market context:** Gartner predicts traditional search volume drops 25% by 2026. Brands using GEO tools see 43% higher citation rates. 100+ AI citation tracking tools now exist (up from ~10 in 2024). **None offer the audit → implement → verify loop.** Pare's consulting delivery is the differentiator.

---

## Null Spaces: What Should Exist But Doesn't

These are gaps in the ecosystem where no good solution exists. Building here = potential competitive advantage.

### Build-Time Null Spaces

1. **Cross-session feature graph with spec linkage** — No tool connects spec documents → implementation tasks → code changes → test results into a single queryable graph that persists across sessions. `cc-sdd` and `Claude Task Master` each cover parts, but nothing unifies the full lifecycle. The closest is `spec-workflow-mcp` but it lacks code-level linkage.

2. **Automated CLAUDE.md / rules validation** — No tool validates that your CLAUDE.md rules are actually being followed in the codebase. `Dependency-MCP` checks architectural rules but doesn't read CLAUDE.md. A "constitutional AI for codebases" tool that checks `rules/*.md` against actual code would be valuable.

3. **Context budget optimizer** — Claude Code's 200k window gets consumed by MCP tool definitions (Claude Task Master alone = ~21k tokens). No tool profiles actual context usage and recommends which MCPs to defer/load. The deferred loading pattern exists but requires manual configuration.

4. **Diff-aware session handoff** — No tool automatically generates a "what changed since last session" summary that includes git diff, modified files, and the relationship to in-progress tasks. `claude-sessions` tracks manually; the ideal tool would auto-generate from git + task state.

5. **PreCompact hook as a standard component** — Continuous-Claude v3 proved this pattern works, but it's buried in a 32-agent system. No standalone, installable PreCompact hook exists that captures state before context compaction destroys detail.

### Product-Integrated Null Spaces

1. **GEO scoring-as-a-service API** — No API exists that takes a business domain + location and returns a GEO readiness score. Every tool is monitoring-only (track citations over time) or analysis-only (run one-shot checks). The audit-to-score pipeline is genuinely custom IP.

2. **AI citation diff tracking** — No tool tracks how AI engine citations change over time in response to content changes you made. You can monitor citations (Otterly) and you can make changes, but nothing connects the two to measure the causal impact of a specific optimization.

3. **Local business GBP-to-AI-visibility correlation** — No tool connects Google Business Profile completeness data with AI engine citation rates for the same business. This correlation is central to Pare's Local/GBP pillar but must be built from scratch.

4. **Schema gap recommendation engine** — Tools can validate existing schema (SEO Inspector MCP) and tools can identify what schema types exist (schema.org reference). But nothing recommends *which specific schema types a local business should add* to improve AI engine visibility. This is custom analysis logic.

5. **Multi-engine prompt normalization** — Each AI engine interprets the same prompt differently. No tool normalizes prompts across OpenAI/Perplexity/Gemini to produce comparable results. Pare needs to build this as part of its query library.

---

## Priority Matrix

### Tier 1: Install Now (Low effort, high leverage)

| Tool | Category | Why Now |
|------|----------|---------|
| **Context7** | Build-time | Prevents stale-docs errors across your entire stack. 45K stars. One config line. |
| **claude-sessions** | Build-time | Lightweight session tracking. No MCP overhead. Just slash commands. |
| **cc-sdd** OR **GitHub Spec Kit** | Build-time | Formalizes your spec-driven workflow with persistent state. Pick one. |
| **Firecrawl MCP** | Product | Already in your architecture. MCP wraps it for agent use during dev. |
| **Drizzle MCP** | Product | Already in your architecture. Agent-driven schema iteration. |

### Tier 2: Add When Building That Feature

| Tool | Category | Trigger |
|------|----------|---------|
| **Claude Task Master** (deferred loading) | Build-time | When breaking SCORING_ALGORITHM.md and AUDIT_PIPELINE.md into implementable tasks |
| **Dependency-MCP** | Build-time | When building across `packages/core` → `apps/web` boundaries |
| **mcp-memory-service** | Build-time | When project outgrows MEMORY.md (likely after ~5 sessions of active development) |
| **Serper.dev** | Product | When building Technical Readiness checks (free 2,500 queries) |
| **DataForSEO MCP** | Product | When adding competitive analysis to audits ($0.60/1K SERPs) |
| **SEO Inspector MCP** | Product | When building Schema/Structured Data pillar scoring |
| **Google Workspace MCP** | Product | When multiple clients need regular updates |
| **Xpoz** | Product | When social brand monitoring becomes a client need (free 100K/mo) |
| **Notion MCP** | Product | When onboarding first client (already specified) |
| **Stripe MCP** | Product | When setting up billing (already specified) |

### Tier 3: Evaluate Later

| Tool | Category | Condition |
|------|----------|-----------|
| **Code-Index-MCP** | Build-time | Codebase exceeds ~100 files |
| **Pipedream MCP** | Product | Need 5+ API integrations simultaneously |
| **Browserbase MCP** | Product | Firecrawl fails on specific client sites |
| **SE Ranking MCP** | Product | Clients need ongoing rank tracking + Local SEO API ships |
| **Otterly.AI Lite** | Product | Need third-party validation of audit accuracy ($29/mo) |
| **Puppeteer MCP** | Product | Iterating on PDF templates |

### Skip Entirely

| Tool | Reason |
|------|--------|
| Ahrefs API | $1,499/mo minimum. Enterprise only. |
| Brandwatch | $800-15,000+/mo. Enterprise social listening. |
| X API v2 direct | $100-5,000/mo. Use Xpoz free tier instead. |
| Firebase MCP | Wrong database architecture. |
| Supabase MCP | Already committed to Drizzle + Postgres. |
| Profound AI | $499+/mo competitor. Study, don't buy. |

---

## Cost Model: Single Audit Run

Estimated API costs for one full audit (1 client, 20 prompts across 3 AI engines, 20-page site crawl):

| Component | Cost |
|-----------|------|
| Firecrawl (20 pages) | ~$0.32 (Hobby plan) |
| OpenAI web_search (20 prompts) | ~$0.25 |
| Perplexity Sonar (20 prompts, standard) | ~$0.01 |
| Gemini with Grounding (20 prompts) | **Free** (within daily RPD limit) |
| Claude Haiku for analysis/parsing | ~$0.03 |
| Puppeteer PDF generation | Free (self-hosted) |
| Resend email delivery | Free (within 3K/mo) |
| **Total per audit** | **~$0.61** |

At $297/audit pricing, API cost = **0.2% of revenue**. Margin is not a concern.

---

## Critical Patterns to Adopt (Not Tools)

These are architectural insights worth more than any individual tool.

| Pattern | Source | Key Insight |
|---------|--------|-------------|
| **PreCompact auto-handoff hook** | Continuous-Claude v3 | Register a hook that fires *before* context compaction. Captures file state, task progress, and decisions to a persistent file. When the next session starts, a SessionStart hook loads it. This is the single most impactful pattern for multi-session work. **Build this as a standalone hook.** |
| **Builder/Validator agent pattern** | claude-code-hooks-mastery | One agent implements, another validates against spec. Use for scoring functions: builder writes `scoreAIVisibility()`, validator checks it against SCORING_ALGORITHM.md. |
| **Event-sourced agent state** | OpenHands | Treat agent actions as immutable events, not ephemeral conversation turns. Enables session replay from any checkpoint. OpenHands achieves 72% on SWE-Bench Verified with this. |
| **Radical simplicity** | mini-swe-agent | A 100-line Python agent matches full SWE-agent performance (74%+ SWE-Bench). For Claude Code, simpler orchestration (CLAUDE.md + slash commands + a few hooks) often outperforms complex multi-agent systems. |
| **Per-concern rule files** | Cursor + Claude ecosystems | Community consensus across both ecosystems: modular `.cursor/rules/*.mdc` and `.claude/rules/*.md` files per concern beat monolithic config. **You already have this.** |
| **Deferred MCP loading** | Claude Task Master | MCP tool definitions consume context tokens just by being registered. Load MCPs on-demand rather than at startup. Claude Task Master's deferred loading saves ~16% of the 200k context window (~33k tokens). |
| **Context budget awareness** | Multiple sources | Below 50% context fill, models lose information in the middle. Above 50%, they lose the earliest tokens. Compaction is not lossless. Plan session work to complete features before hitting compaction thresholds. |

---

## Sources

### MCP Registries Searched
- [Official MCP Registry](https://registry.modelcontextprotocol.io/) — Canonical registry
- [mcp.so](https://mcp.so/) — ~17,500 servers indexed
- [glama.ai/mcp/servers](https://glama.ai/mcp/servers) — ~17,100 servers indexed
- [smithery.ai](https://smithery.ai/) — 7,300+ tools
- [awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) — 410 servers, 490K cumulative stars
- [mcpmarket.com](https://mcpmarket.com/leaderboards) — Top 100 leaderboard
- [mcp-awesome.com](https://mcp-awesome.com/) — 1,200+ quality-verified servers

### Build-Time Tools
- [Context7 (Upstash)](https://github.com/upstash/context7) — 45,200 stars
- [claude-sessions](https://github.com/iannuttall/claude-sessions) — 1,100+ stars
- [cc-sdd](https://github.com/gotalab/cc-sdd)
- [GitHub Spec Kit](https://github.com/github/spec-kit) — 16,000+ stars
- [Claude Task Master](https://github.com/eyaltoledano/claude-task-master)
- [spec-workflow-mcp](https://github.com/Pimzino/spec-workflow-mcp)
- [mcp-memory-service](https://github.com/doobidoo/mcp-memory-service)
- [Claude-Mem](https://github.com/thedotmack/claude-mem)
- [Mem0 / OpenMemory](https://github.com/mem0ai/mem0)
- [Cognee MCP](https://github.com/topoteretes/cognee) — 12,100 stars
- [Continuous-Claude v3](https://github.com/parcadei/Continuous-Claude-v3)
- [Code-Index-MCP](https://github.com/ViperJuice/Code-Index-MCP)
- [Claude Context (Zilliz)](https://github.com/zilliztech/claude-context)
- [Dependency-MCP](https://github.com/mkearl/dependency-mcp)
- [Playwright MCP (Microsoft)](https://github.com/microsoft/playwright-mcp) — 24,400 stars
- [GitHub MCP](https://github.com/github/github-mcp-server) — 20,000+ stars
- [Pipedream MCP](https://pipedream.com/docs/connect/mcp) — 11,100 stars
- [awesome-claude-code-toolkit](https://github.com/rohitg00/awesome-claude-code-toolkit)
- [everything-claude-code](https://github.com/affaan-m/everything-claude-code)
- [commands](https://github.com/wshobson/commands)
- [claude-code-hooks-mastery](https://github.com/disler/claude-code-hooks-mastery)
- [OpenHands](https://github.com/OpenHands/OpenHands)
- [mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent)
- [Martin Fowler SDD Analysis](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)

### Product-Integrated Tools
- [Firecrawl MCP](https://github.com/firecrawl/firecrawl-mcp-server) — [Pricing](https://www.firecrawl.dev/pricing)
- [Browserbase MCP](https://github.com/browserbase/mcp-server-browserbase) — [Pricing](https://www.browserbase.com/pricing)
- [Crawl4AI](https://github.com/unclecode/crawl4ai) — 58,000+ stars
- [Tavily MCP](https://github.com/tavily-ai/tavily-mcp)
- [DataForSEO MCP](https://github.com/dataforseo/mcp-server-typescript) — [Pricing](https://dataforseo.com/pricing)
- [Serper.dev](https://serper.dev/)
- [SE Ranking MCP](https://github.com/seranking/seo-data-api-mcp-server)
- [SEO Inspector MCP](https://glama.ai/mcp/servers/@mgsrevolver/seo-inspector-mcp)
- [Xpoz](https://www.xpoz.ai/)
- [Drizzle MCP](https://github.com/defrex/drizzle-mcp)
- [Notion MCP](https://github.com/makenotion/notion-mcp-server)
- [Stripe MCP](https://docs.stripe.com/mcp)
- [Resend](https://resend.com/) — [React Email 5.0](https://resend.com/blog/react-email-5)
- [Google Workspace MCP](https://github.com/taylorwilsdon/google_workspace_mcp)
- [Puppeteer MCP](https://www.npmjs.com/package/@modelcontextprotocol/server-puppeteer)
- [OpenAI Responses API](https://platform.openai.com/docs/guides/tools-web-search) — [Pricing](https://platform.openai.com/docs/pricing)
- [Perplexity Sonar API](https://www.perplexity.ai/api-platform) — [Changelog](https://docs.perplexity.ai/changelog/changelog)
- [Gemini API Grounding](https://ai.google.dev/gemini-api/docs/google-search) — [Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Vercel AI SDK v6](https://vercel.com/blog/ai-sdk-6) — [Migration Guide](https://ai-sdk.dev/docs/migration-guides/migration-guide-6-0)
- [Inngest](https://www.inngest.com/docs)

### GEO Competitors
- [Otterly.AI](https://otterly.ai/) — [Pricing](https://otterly.ai/pricing)
- [Profound AI](https://www.tryprofound.com/)
- [Peec AI](https://growverge.com/peec-ai-review-2025-trial-marketers/)
- [SEMrush AI Visibility Toolkit](https://www.semrush.com/kb/1493-ai-visibility-toolkit)

### Community & Ecosystem
- [Claude Code Memory Docs](https://code.claude.com/docs/en/memory)
- [Handoff Protocol Analysis](https://blackdoglabs.io/blog/claude-code-decoded-handoff-protocol/)
- [32 Claude Code Tips](https://agenticcoding.substack.com/p/32-claude-code-tips-from-basics-to)
- [Context Compaction Research](https://gist.github.com/badlogic/cd2ef65b0697c4dbe2d13fbecb0a0a5f)
- [MCP Security: Postmark Supply-Chain Attack](https://www.reversinglabs.com/blog/postmark-mcp-attack-takeaways)
- [Session Persistence Feature Request](https://github.com/anthropics/claude-code/issues/18417)
- [Session Handoff Feature Request](https://github.com/anthropics/claude-code/issues/11455)
