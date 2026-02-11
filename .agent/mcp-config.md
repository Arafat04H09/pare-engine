# MCP Configuration for Pare Engine

This document tracks the MCP servers available in the Pare Engine agentic workflow.

## Active MCP Servers (14)

### Core Development
| Server | Purpose | Package |
|--------|---------|---------|
| `context7` | Documentation lookup for frameworks | `@anthropic-ai/context7-mcp` |
| `drizzle` | Database schema management & queries | `drizzle-mcp` |
| `github` | PR/issue management, repo operations | `@anthropic-ai/github-mcp-server` |
| `playwright` | E2E testing & browser automation | `@anthropic-ai/playwright-mcp` |
| `coolify` | Deployment management (35 ops) | `@masonator/coolify-mcp` |

### External Services
| Server | Purpose | Package |
|--------|---------|---------|
| `firecrawl` | Site crawling & content extraction | `firecrawl-mcp` |
| `stripe` | Billing & subscription management | `@stripe/agent-toolkit` |
| `notion` | Client CRM (first 10 clients) | `@notionhq/notion-mcp-server` |
| `resend` | Email delivery testing | `mcp-send-email` |

### Research & Intelligence
| Server | Purpose | Package |
|--------|---------|---------|
| `exa` | Semantic web search & company research | `exa-mcp-server` |
| `local-falcon` | GBP ranking data & local SEO scans | `@local-falcon/mcp` |
| `dataforseo` | Backlinks, keywords, SERP analysis | `dataforseo-mcp-server` |

### Domain-Specific
| Server | Purpose | Package |
|--------|---------|---------|
| `schema-org` | Schema.org type lookup & JSON-LD generation | `schema-org-mcp` |
| `pagespeed` | Google PageSpeed Insights analysis | `pagespeed-insights-mcp` |

## Skill → MCP Integration Map

| Skill | MCP Servers Used |
| :--- | :--- |
| **gap-analysis** | `context7` (docs), file tools |
| **research** | `exa` (semantic search), `context7` (docs) |
| **synthesize** | file tools |
| **search-tools** | `exa` (search MCPs/tools) |
| **decompose** | file tools |
| **build** | `context7` (docs), `drizzle` (DB), `github` (issues) |
| **confirm** | `playwright` (E2E), file tools |
| **demo** | `firecrawl` (crawl), `local-falcon` (GBP) |
| **test** | `playwright` (E2E) |
| **security** | file tools |
| **review** | file tools |
| **scaffold** | `schema-org` (type lookup) |
| **onboard** | `context7` (docs), file tools |
| **perf** | `pagespeed` (performance data) |
| **run-audit** | `firecrawl` (crawl), `local-falcon` (GBP), `pagespeed` |
| **deploy** | `coolify` (deployment ops) |
| **db-migrate** | `drizzle` |
| **generate-schema** | `schema-org` (type + JSON-LD generation) |
