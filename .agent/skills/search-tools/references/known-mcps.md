# Known MCP Servers & Tools

Last updated: 2026-02-10

## Currently Installed

| MCP Server | Purpose | Status |
|-----------|---------|--------|
| context7 | Documentation lookup | Active — dev only |
| drizzle-mcp | Database schema management | Active — dev only |
| firecrawl-mcp | Site crawling (dev) | Active — dev only |
| stripe-mcp | Billing management (dev) | Active — dev only |
| notion-mcp | Client management (dev) | Active — dev only |

## Production API Wrappers (Not MCP)

| Service | Package | Purpose |
|---------|---------|---------|
| Firecrawl | @mendable/firecrawl-js | Site crawling |
| OpenAI | @ai-sdk/openai | AI engine queries |
| Anthropic | @ai-sdk/anthropic | Analysis/generation |
| Google | @ai-sdk/google | AI engine queries |
| Perplexity | @ai-sdk/openai (compat) | AI engine queries |
| Resend | resend | Email delivery |
| Stripe | stripe | Payments |
| PageSpeed | REST API | Technical analysis |
| Google Places | REST API | GBP data |
| Serper.dev | REST API | SERP data |

## Previously Evaluated — Settled Decisions

| Tool | Decision | Reason | Date |
|------|----------|--------|------|
| React-PDF | REJECTED | CSS limitations, time-waster risk | 2025 |
| Custom Playwright crawler | REJECTED | Firecrawl is better, less maintenance | 2025 |
| SerpAPI | REPLACED by Serper.dev | Better pricing | 2025 |
| Custom SMTP | REJECTED | Resend + React Email is simpler | 2025 |

## Evaluated but Deferred

| Tool | Type | Why Deferred | Revisit When |
|------|------|-------------|-------------|
| DataForSEO | API | Backlink/keyword data | When competitive intel needed |
