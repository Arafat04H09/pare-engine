---
name: search-tools
description: Search for MCP servers, npm packages, and APIs that can accelerate development.
---

# Skill: Search Tools

## Purpose
Search for external tools (MCP servers, npm packages, APIs) that can accelerate Pare Engine development. Evaluates found tools against Pare's architecture and recommends USE/BUILD/DEFER for each.

## Inputs

Read the most recent synthesis output:
- Most recent file in `pipeline/3-synthesis/` — strategy with capability needs

Also read for context:
- `CLAUDE.md` — Settled tool decisions (do NOT search for alternatives to these)
- The `references/known-mcps.md` file in this directory — Previously evaluated tools

If a specific capability was requested by the user, prioritize that.

## Process

1. **Extract Capability Needs**: From the synthesis strategy, identify capabilities that could be satisfied by external tools rather than custom code.

2. **Search MCP Registries**: For each capability, search:
   - smithery.ai — MCP server registry
   - mcp.so — MCP directory
   - glama.ai/mcp — MCP catalog
   - Search queries: "[capability] MCP server", "[tool] MCP"

3. **Search npm**: For capabilities not covered by MCPs:
   - Search npmjs.com for relevant packages
   - Prioritize packages with: >1k weekly downloads, recent updates, TypeScript support
   - Check if AI SDK provider packages exist

4. **Search APIs**: For capabilities requiring external services:
   - Official documentation for pricing, rate limits, quotas
   - Free tier availability
   - API stability and versioning

5. **Evaluate Each Tool**: For every tool found, assess:
   - **Fit**: Does it match Pare's architecture? (TypeScript, Zod, AI SDK compatible)
   - **Maturity**: Downloads, stars, last update, maintenance status
   - **Cost**: Free tier limits, pricing at Pare's scale (10 clients)
   - **Lock-in risk**: Can we replace it easily if needed?
   - **Verdict**: USE (adopt now) / BUILD (write custom) / DEFER (evaluate later)

6. **Check Against Known Tools**: Cross-reference with `references/known-mcps.md` to avoid re-evaluating settled decisions.

## Output

Write to `pipeline/4-search-tools/tools-YYYY-MM-DD.md`.

The output MUST contain:
- Capabilities searched for (numbered list)
- Per-capability findings with tool options
- Evaluation matrix: Tool | Type | Fit | Maturity | Cost | Verdict
- Installation instructions for USE tools
- Architecture notes for BUILD tools
- Updated known-mcps reference data

## Rules
- Never recommend replacing settled tool decisions from CLAUDE.md
- Prefer MCP servers over npm packages over custom code
- Prefer tools with TypeScript support and Zod compatibility
- Free tier must support at least 10 clients before recommending paid tools
- Always include the source URL for every tool evaluated
- Flag any tool that requires environment variables or API keys
- Update `references/known-mcps.md` with newly evaluated tools
