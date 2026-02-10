# Market Evidence & Research Reference

## LLM Provider Capabilities & Costs

### Claude API (Anthropic)
| Model | Input $/1M tokens | Output $/1M tokens | Context |
|-------|-------------------|-------------------|---------|
| Opus 4.6 | $5.00 | $25.00 | 200K |
| Sonnet 4.5 | $3.00 | $15.00 | 200K |
| Haiku 4.5 | $1.00 | $5.00 | 200K |

Features: Batch API (50% discount), structured output (JSON Schema), tool use. NO web access.
Best for: Schema generation, content analysis, structured response parsing. NOT for brand monitoring.

### OpenAI API
| Model | Input $/1M tokens | Output $/1M tokens |
|-------|-------------------|-------------------|
| GPT-5.2 | $1.75 | $14.00 |
| GPT-4o | $2.50 | $10.00 |
| GPT-4o-mini | $0.15 | $0.60 |
| GPT-5 Nano | $0.05 | $0.40 |

Key: Web Search API at $10/1K search calls. Uses gpt-5-search-api models. Closest replication of ChatGPT responses.
Best for: Brand monitoring via web search, cheapest bulk queries (4o-mini).

### Google Gemini API
| Model | Input $/1M tokens | Output $/1M tokens |
|-------|-------------------|-------------------|
| Gemini 3 Pro | $2.00 | $12.00 |
| Gemini 2.5 Flash | $0.30 | $2.50 |
| Gemini 2.0 Flash-Lite | $0.075 | $0.30 |

Key: Grounding with Google Search — 1,500 free/day, then $35/1K calls. Closest approximation to Google AI Overview.
Warning: Free tier severely reduced (5 RPM, 100 req/day). NOT viable for production.

### Perplexity API (Sonar)
| Model | Input $/1M tokens | Output $/1M tokens |
|-------|-------------------|-------------------|
| Sonar | $1.00 | $1.00 |
| Sonar Pro | $3.00 | $15.00 |

Key: Built-in search included in token cost (no extra charge). Citations in every response. API mirrors web app.
Best for: Most cost-effective brand monitoring.

### Recommended Monitoring Stack
| Provider | Model/Feature | Role | Est. Monthly Cost (10 clients) |
|----------|--------------|------|-------------------------------|
| Perplexity | Sonar | Monitor Perplexity visibility | ~$34 |
| OpenAI | GPT-4o-mini + Web Search | Monitor ChatGPT visibility | ~$45 |
| Google | Gemini Flash + Grounding | Monitor Google AI Overview | ~$6-35 |
| SerpAPI | AI Overview endpoint | Capture actual Google AI Overview | ~$5-75 |
| **Total** | | | **~$100-200/mo** |

At $100-200/mo for 10 clients, monitoring cost per client is $10-20/mo — trivial against any service tier above $200/mo.

## SERP APIs for Google AI Overview
| Provider | Price | AI Overview Support | Notes |
|----------|-------|-------------------|-------|
| SerpAPI | $75/mo (5K searches) | Yes | Most reliable |
| DataForSEO | ~$3-5/mo | Yes | Cheapest |
| Serper | $0.30/1K queries | Unclear | Not confirmed |

## Monthly Cost Estimates (10 clients, 25 queries x 4 platforms x weekly = 4,333 queries/mo)
| Scenario | Est. Monthly Cost |
|----------|------------------|
| Cheapest models, no web search | ~$16/mo |
| Cheapest + web search | ~$60-120/mo |
| Best models + web search | ~$200-350/mo |
| Any with Batch API discounts | 50% off |

## MCP Ecosystem (Feb 2026)
- Protocol version: 2025-11-25 (latest stable)
- Governance: Linux Foundation's Agentic AI Foundation
- Ecosystem: 97M+ monthly SDK downloads, 10,000+ registered servers (some sources say 17,500+)
- n8n integration: Native MCP support via MCP Client Tool node + MCP Server Trigger node

### MCP Server Priority Tiers

**Tier 1: Use from Day 1 (Official, production-confident)**
| Server | Purpose | Source |
|--------|---------|--------|
| Microsoft Playwright MCP | Browser automation, testing | Official |
| Stripe MCP | Payments, subscriptions | Official |
| Notion MCP v2.0 | Client management | Official |
| n8n Built-in MCP | Workflow management | Built into n8n |

**Tier 2: Add in Phase 2-3 (Strong community)**
| Server | Purpose | Source |
|--------|---------|--------|
| Firecrawl MCP | Web crawling | Community |
| Drizzle MCP | Database management | Community |
| schema-org MCP | Schema generation | Community |
| Google Workspace MCP | Gmail, Sheets, Calendar | Community (Taylor Wilsdon) |

**Tier 3: Evaluate later**
LiteLLM (multi-LLM gateway), Schema App MCP (commercial), Zapier MCP (8K+ integrations but costly)

### MCP Security Warnings
- NEVER connect Supabase MCP to production data (dev only)
- Original Anthropic PostgreSQL MCP deprecated due to SQL injection
- Pin MCP server versions (silent changes possible)
- Claude Code lazy-loads MCP tools (47% context reduction — register many, pay nothing)

## Infrastructure Cost Comparison

### Hosting Options Evaluated
| Option | Monthly Cost | Notes |
|--------|-------------|-------|
| Hetzner CPX21 + Coolify | $8-13/mo | 3 vCPU, 4GB RAM. Best value. |
| Railway | $5-14/mo (n8n + DB) | Per-service pricing, simpler setup |
| Fly.io | ~$10-20/mo | Good for globally distributed |
| Vercel | $0 (free tier) | For Next.js frontend only |
| Supabase | $0-10/mo | Free tier for DB, then $25/mo Pro |

Winner: Hetzner + Coolify for self-hosting everything ($8-13/mo total). Coolify provides one-click deploy for PostgreSQL, n8n, Next.js, Redis.

### Pre-Revenue Monthly Burn Rate
| Item | Cost |
|------|------|
| Google Workspace | $7 |
| Hetzner/Railway hosting | $5-14 |
| API costs (dev + audits) | $10-30 |
| Domain | ~$1 (amortized) |
| **Total** | **$23-52/mo** |

## GEO Tool Landscape (Feb 2026)
- 200+ tools identified
- $77M+ VC funding (May-Aug 2025 alone): Scrunch $19M, Peec $21M, Profound $20M
- Dominant category: monitoring-only dashboards
- Underserved category: monitoring + automated implementation

### Open-Source Options
| Project | Language | Capability |
|---------|----------|-----------|
| AICW (AI Chat Watch) | TypeScript | Multi-AI queries, HTML reports (most complete) |
| Gego | Docker-based | Metrics, retry, competitive analysis |
| llm-brand-tracker | — | Single-brand monitoring (limited) |

### White-Label Options
Writesonic (full rebrand), Geneo (CNAME portal), SE Ranking (branded PDFs), Ayzeo (reports only)

## Schema/Structured Data Landscape

### Commoditized (Use, Don't Build)
schema-dts (TypeScript types), jsonld.js (JSON-LD processing), Yoast/Rank Math (basic WordPress schema), WordPress llms.txt plugins

### Custom Build Required (Pare's Differentiation)
1. Vertical-specific schema (Dentist, MedicalProcedure, LegalService, Attorney) — no CMS plugin generates these
2. Interconnected schema graph (practice → dentist → services → conditions → FAQ)
3. Runtime schema validation against Google's actual requirements (no npm package exists)
4. Programmatic llms.txt validation (no npm package exists)
5. Programmatic robots.txt AI crawler audit (no purpose-built tool)
6. GEO-optimized schema properties (author credentials, dateModified, citations, expertise signals)

### CMS Landscape for Schema
| CMS | Schema Ecosystem | Custom Difficulty | Notes |
|-----|-----------------|-------------------|-------|
| WordPress | Best (Yoast/Rank Math) | Easy (hooks/plugins) | Primary target |
| Squarespace | Broken (LocalBusiness broken since 2019) | Hard (code injection only) | Common among SMBs, known pain point |
| Wix | Basic only (no FAQ, no HowTo) | Hard (code embed fields) | Avoid if possible |
| Shopify | Decent (apps available) | Medium (Liquid templates) | E-commerce clients only |

## AI Crawler User-Agents

### Search/Citation Bots (ALLOW — drive AI visibility)
OAI-SearchBot (OpenAI), ChatGPT-User (OpenAI), PerplexityBot (Perplexity), Claude-Web (Anthropic), YouBot (You.com), PhindBot (Phind)

### Training Bots (CONSIDER BLOCKING)
GPTBot (OpenAI training), Google-Extended (Gemini training), Bytespider (ByteDance), CCBot (Common Crawl), Meta-ExternalAgent (Meta/Llama)

## Agentic Commerce State (Feb 2026)
- Google UCP live for eligible product listings in AI Mode and Gemini
- Google Business Agent live with Lowe's, Michaels, Poshmark, Reebok — expanding to smaller merchants
- OpenAI ACP operational — ChatGPT Instant Checkout with Stripe
- Shopify enabled ACP for 1M+ merchants on launch day
- WooCommerce joining Stripe's Agentic Commerce Suite
- Google Merchant Center added conversational commerce attributes
- Most SMBs have zero awareness
- Structured product/service data is prerequisite for participation

## Key Research Sources
- Princeton GEO study (30-40% visibility gains)
- Go Fish Digital (+43% AI referral, +83% conversions)
- Discovered Labs B2B (23x higher conversion from AI referrals, Jan 2026)
- Adobe (693% AI referral growth holiday 2025)
- Sparktoro/Jumpshot (60% zero-click searches)
- OpenAI (800M+ WAU)
- Incremys GEO statistics compilation (Feb 2026)
- Search Atlas (schema-citation correlation study)
- Google Developers Blog (UCP documentation)
- OpenAI/Stripe (ACP partnership)
