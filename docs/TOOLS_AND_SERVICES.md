# Tools and Services Reference

## External APIs (Used in Production)

### Vercel AI SDK v6
- **Purpose:** All LLM interactions (query, parse, generate)
- **Install:** `pnpm add ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google`
- **Key functions:** `generateText()`, `generateObject()`, `streamText()`
- **Provider switching:** Change one import to switch from OpenAI to Gemini
- **Docs:** https://ai-sdk.dev/docs/introduction

### Firecrawl
- **Purpose:** Site crawling and content extraction
- **Install:** `pnpm add @mendable/firecrawl-js`
- **Key functions:** `map()` (discover URLs), `crawl()` (extract content), `extract()` (structured data)
- **Pricing:** Free 500 credits, $9/mo for 3K credits
- **Self-host:** Open source, Docker image available
- **Docs:** https://docs.firecrawl.dev

### Inngest
- **Purpose:** Durable background job execution (audit pipeline)
- **Install:** `pnpm add inngest`
- **Key pattern:** `inngest.createFunction()` with `step.run()` for each pipeline stage
- **Self-host:** Single binary + PostgreSQL
- **Free tier:** 50K executions/month
- **Docs:** https://www.inngest.com/docs

### Resend + React Email
- **Purpose:** Transactional email delivery
- **Install:** `pnpm add resend @react-email/components`
- **Free tier:** 3,000 emails/month
- **Docs:** https://resend.com/docs

### Stripe
- **Purpose:** Payments, subscriptions, invoicing
- **Install:** `pnpm add stripe`
- **MCP:** https://mcp.stripe.com (for dev use in Claude Code)
- **Webhooks:** Handle in `apps/api` routes

### OpenAI (Responses API)
- **Purpose:** Monitoring — "How does ChatGPT see this business?"
- **Access:** Via AI SDK `@ai-sdk/openai`
- **Key feature:** Built-in `web_search` tool for grounded responses
- **Cost:** $10 per 1,000 search calls (uses `gpt-5-search-api` models)
- **Note:** Responses API replaces Assistants API (sunsets mid-2026)
- **Best for:** Brand monitoring via web search — closest replication of what ChatGPT actually says

### Perplexity Sonar
- **Purpose:** Monitoring — AI search with native citations
- **Access:** Via AI SDK (custom provider or direct API)
- **Key feature:** Built-in search included in token cost (no extra charge), citations in every response
- **Cost:** ~$34/mo for 10 clients (Sonar: $1.00/$1.00 per 1M tokens)
- **Best for:** Most cost-effective brand monitoring. API closely mirrors perplexity.ai results.

### Google Gemini
- **Purpose:** Monitoring — with grounding enabled
- **Access:** Via AI SDK `@ai-sdk/google`
- **Key feature:** Grounding with Google Search (1,500 free/day, then $35/1K calls)
- **Warning:** Free tier severely reduced (5 RPM, 100 req/day) — NOT viable for production
- **Cost:** ~$6-35/mo for 10 clients
- **Best for:** Simulating Google AI Overview responses

### Google Places API
- **Purpose:** GBP data lookup (rating, reviews, photos, business info)
- **Used in:** Analysis step for GBP scoring
- **Cost:** ~$1/mo per client

### SerpAPI
- **Purpose:** Capture actual Google AI Overview panel as rendered in search
- **Cost:** $75/mo (5K searches) — most reliable
- **Alternative:** DataForSEO (~$3-5/mo, cheaper but less data)
- **MCP server:** https://github.com/serpapi/serpapi-mcp

### Provider Cost Summary (Per Model)

| Provider | Model | Input $/1M tokens | Output $/1M tokens | Key Feature |
|----------|-------|-------------------|-------------------|-------------|
| Anthropic | Haiku 4.5 | $1.00 | $5.00 | Cheapest for structured parsing |
| Anthropic | Sonnet 4.5 | $3.00 | $15.00 | Best quality for analysis |
| OpenAI | GPT-4o-mini | $0.15 | $0.60 | Cheapest bulk queries |
| OpenAI | GPT-4o | $2.50 | $10.00 | Good balance |
| Google | Gemini 2.5 Flash | $0.30 | $2.50 | Budget with grounding |
| Perplexity | Sonar | $1.00 | $1.00 | Includes search free |

### Monitoring Stack Budget (10 clients, 25 queries × 4 platforms × weekly)

| Provider | Role | Est. Monthly Cost |
|----------|------|------------------|
| Perplexity Sonar | Monitor Perplexity visibility | ~$34 |
| OpenAI GPT-4o-mini + Web Search | Monitor ChatGPT visibility | ~$45 |
| Gemini Flash + Grounding | Monitor Google AI Overview | ~$6-35 |
| SerpAPI | Capture actual AI Overview HTML | ~$5-75 |
| **Total** | | **~$100-200/mo** |

At $100-200/mo for 10 clients = $10-20/client/mo — trivial against any retainer above $200/mo.

## MCP Servers (For Development with Claude Code)

### Install in `.claude/settings.json` or project MCP config:

```json
{
  "mcpServers": {
    "drizzle": {
      "command": "npx",
      "args": ["drizzle-mcp"],
      "env": { "DATABASE_URL": "postgresql://..." }
    },
    "schema-org": {
      "command": "npx",
      "args": ["schema-org-mcp"]
    },
    "n8n": {
      "command": "npx",
      "args": ["n8n-mcp"]
    },
    "firecrawl": {
      "command": "npx",
      "args": ["firecrawl-mcp"],
      "env": { "FIRECRAWL_API_KEY": "..." }
    },
    "stripe": {
      "url": "https://mcp.stripe.com"
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp"]
    }
  }
}
```

### MCP Installation Priority

**Tier 1: Use from Day 1 (Official, production-confident)**

| Server | Purpose | Source |
|--------|---------|--------|
| Microsoft Playwright MCP | Browser automation, testing | Official (Microsoft) |
| Stripe MCP | Payments, subscriptions | Official (Stripe) |
| Notion MCP v2.0 | Client management (first 10 clients) | Official (Notion) |
| n8n Built-in MCP | Workflow management | Built into n8n |

**Tier 2: Add in Phase 2-3 (Strong community, validated)**

| Server | Purpose | Source |
|--------|---------|--------|
| Firecrawl MCP | Web crawling from Claude Code | Community |
| Drizzle MCP | DB schema management | Community |
| schema-org MCP | Schema.org type lookup + JSON-LD generation | Community |
| Google Workspace MCP | Gmail, Sheets, Calendar | Community (Taylor Wilsdon) |

**Tier 3: Evaluate later**

| Server | Purpose | Notes |
|--------|---------|-------|
| LiteLLM | Multi-LLM gateway | If managing API keys becomes painful |
| Schema App MCP | Schema generation | Commercial |
| Google Analytics MCP | Analytics data | Official (Feb 2026) |
| SerpAPI MCP | SERP data access | For monitoring features |

### MCP Notes
- Claude Code lazy-loads MCP tools (47% context reduction) — register many, pay nothing
- Most servers use STDIO transport (works with Claude Code natively)
- n8n only supports SSE/HTTP transport — this is why n8n triggers Inngest events (HTTP)
- NEVER connect database MCP to production data (development only)
- Original Anthropic PostgreSQL MCP deprecated due to SQL injection — use Drizzle MCP instead
- Pin MCP server versions to prevent silent tool definition changes

## Infrastructure

### Hetzner CPX21 VPS
- **Purpose:** Hosts everything
- **Specs:** 3 vCPU, 4GB RAM, 80GB SSD
- **Cost:** ~$8-13/month
- **Location:** US or EU

### Coolify
- **Purpose:** Self-hosted PaaS (deploys everything)
- **One-click services:** PostgreSQL, n8n, Redis (if needed)
- **Auto-SSL:** Let's Encrypt
- **Deploy:** Git push → auto-deploy

### PostgreSQL 16
- **Purpose:** Primary database
- **Deployed via:** Coolify one-click
- **ORM:** Drizzle
- **Also used by:** Inngest (for durable state)

### n8n (self-hosted)
- **Purpose:** Scheduling and webhooks ONLY
- **NOT for:** Long-running audit pipelines (5-min timeout)
- **Deployed via:** Coolify one-click (production queue mode)
- **MCP integration:** n8n-MCP + n8n-skills for Claude Code to generate workflows

## Development Tools

### v0.dev
- **Purpose:** Scaffold UI components (website pages, dashboard layouts)
- **How:** Generate in v0.dev → export → refine in Claude Code
- **Stack match:** Outputs Next.js + shadcn/ui + Tailwind (exact stack match)
- **Limitation:** Weak backend. UI scaffolding only.

### Claude Structured Outputs
- **Purpose:** Guaranteed JSON output for scoring rubrics, parsed LLM responses
- **How:** Use `tool_choice` with schema in Claude API calls, or AI SDK `generateObject()`
- **Eliminates:** JSON validation code, retry loops for malformed output

## Tool Comparison Summaries

### Crawling: Firecrawl vs Crawl4AI
| | Firecrawl | Crawl4AI |
|---|-----------|----------|
| Type | Hosted API + self-hostable | Self-hosted only |
| Pricing | Free 500 credits, $9/mo for 3K | Free (open source) |
| JS rendering | Yes | Yes |
| Markdown output | Yes | Yes |
| Map (URL discovery) | Yes | No |
| MCP server | Yes | Yes |
| **Winner** | Firecrawl (faster to start, Map API saves crawl code) |

### AI Framework: Vercel AI SDK vs Mastra
| | Vercel AI SDK v6 | Mastra |
|---|-----------------|--------|
| Providers | 25+ (most mature) | Growing |
| Structured output | `generateObject()` + Zod | Yes |
| Streaming | Built-in | Built-in |
| Agent framework | Basic | Full agent system |
| **Winner** | AI SDK (provider count, stability, community) |

### Background Jobs: Inngest vs n8n
| | Inngest | n8n |
|---|---------|-----|
| Long-running | Yes (durable steps, no timeout) | 5-min MCP timeout |
| Retry per step | Yes | Workflow-level only |
| Self-host | Single binary + PostgreSQL | Docker + PostgreSQL |
| Visual editor | Dashboard view | Full visual editor |
| **Winner** | Inngest for pipeline, n8n for scheduling/webhooks |

### PDF: Puppeteer HTML→PDF vs React-PDF
| | Puppeteer | React-PDF |
|---|-----------|-----------|
| CSS support | Full (grid, flexbox, fonts, SVG) | Limited (no grid, basic flexbox) |
| Charts | Inline SVG | Manual primitives only |
| Debugging | Preview in browser | Re-render required |
| File size | Larger (Chromium dependency) | Smaller |
| **Winner** | Puppeteer (CSS flexibility, #1 time-waster risk eliminated) |
