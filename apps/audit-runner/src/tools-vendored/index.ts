// Owner: S22 (Production Deployment)
//
// Vendored tool stubs for production safety.
//
// In development, MCP servers (Firecrawl, Stripe, Notion, Drizzle, Context7)
// provide tool definitions that Claude Code can invoke interactively.
// In production, NO MCP servers run. Instead, these static typed wrappers
// re-export the underlying tool functions from @pare-engine/core/tools
// with Vercel AI SDK-compatible tool definitions.
//
// Architecture note (from CLAUDE.md):
//   "MCP tool definitions are vendored into static AI SDK tool stubs
//    via mcp-to-ai-sdk before deployment. No MCP servers run in production."
//
// Since mcp-to-ai-sdk is not yet available as a package, these stubs are
// hand-written typed wrappers that achieve the same goal: replacing live
// MCP server connections with static, typed, directly-callable functions.

export { firecrawlTools } from './firecrawl.js';
export { stripeTools } from './stripe.js';
export { notionTools } from './notion.js';
export { drizzleTools } from './drizzle.js';
export { coreTools } from './core-tools.js';
