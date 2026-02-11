# Known MCP Servers & Tools

Last updated: 2026-02-10

## Currently Installed (14)

| MCP Server | Purpose | Status |
|-----------|---------|--------|
| context7 | Documentation lookup | Active — dev only |
| drizzle | Database schema management | Active — dev only |
| firecrawl | Site crawling | Active — dev + prod wrapper |
| stripe | Billing management | Active — dev only (prod uses API) |
| notion | Client management | Active — dev only |
| playwright | E2E testing & browser automation | Active — dev only |
| exa | Semantic web search & research | Active — dev only |
| github | PR/issue management | Active — dev only |
| resend | Email testing | Active — dev only (prod uses API) |
| local-falcon | GBP ranking & local SEO scans | Active — dev + audit |
| dataforseo | Backlinks, keywords, SERP data | Active — dev + competitive intel |
| schema-org | Schema.org type lookup & JSON-LD gen | Active — dev + schema analysis |
| pagespeed | Google PageSpeed Insights | Active — dev + technical analysis |
| coolify | Deployment management (35 ops) | Active — dev + deploy |

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
| Sentry MCP | Error monitoring | Not in production yet | After first deploy |
| Docker MCP | Container management | Using Coolify, not direct Docker | If Coolify removed |
| Browserbase MCP | Cloud browsers | Firecrawl covers crawling needs | If scale requires it |
