# MCP Configuration for Pare Engine

This document tracks the MCP servers available in the Pare Engine agentic workflow.

## Active MCP Servers (11)

### Core Development
| Server | Purpose | Package |
|--------|---------|---------|
| `context7` | Documentation lookup for frameworks | `@anthropic-ai/context7-mcp` |
| `drizzle` | Database schema management & queries | `drizzle-mcp` |
| `github` | PR/issue management, repo operations | `@anthropic-ai/github-mcp-server` |
| `playwright` | E2E testing & browser automation | `@anthropic-ai/playwright-mcp` |

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
| **onboard** | `context7` (docs), file tools |
| **perf** | file tools |
| **run-audit** | `firecrawl` (crawl), `local-falcon` (GBP) |
| **deploy** | — |
| **db-migrate** | `drizzle` |
