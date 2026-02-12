---
name: search-tools
description: >
  Search for MCP servers, npm packages, and APIs that can accelerate development.
  Evaluates found tools against Pare's architecture and recommends USE/BUILD/DEFER.
argument-hint: "[capability-needed]"
allowed-tools: Read, Grep, Glob, WebSearch, WebFetch, Bash(git log *)
context: fork
---

# Search Tools

You are searching for external tools (MCP servers, npm packages, APIs) that can accelerate Pare Engine development.

## Inputs

Determine capability needs from available pipeline artifacts (check in this order):

1. **If $ARGUMENTS is a file path** (e.g., `pipeline/1.5-dispatch/dispatch-*.md`): Read that file — extract items routed to `/search-tools` from the Routing Decisions section.
2. **If $ARGUMENTS is a capability name** (not a file path): Search for that specific capability.
3. **If `pipeline/3-synthesis/` has files:** Read the most recent strategy for capability needs.
4. **If `pipeline/1-gap-analysis/` has files:** Read the most recent gap analysis — extract items that are tool/API evaluations.

This ordering lets search-tools run in parallel with research (fed by dispatch) OR after synthesis (the original flow). Both paths work.

Also read for context:
- `CLAUDE.md` — Settled tool decisions (do NOT search for alternatives to these)
- `references/known-mcps.md` — Previously evaluated tools

## Process

1. **Extract Capability Needs**: From the synthesis strategy, identify capabilities that could be satisfied by external tools rather than custom code.

2. **Search MCP Registries**: For each capability, search:
   - [smithery.ai](https://smithery.ai) — MCP server registry
   - [mcp.so](https://mcp.so) — MCP directory
   - [glama.ai/mcp](https://glama.ai/mcp) — MCP catalog
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

## Refining Vision & Product Plan

VISION.md and PRODUCT_PLAN.md are **living documents**. If tool search reveals capabilities that change what should be built vs bought, update them:

- If a found tool makes a PLANNED feature trivial, update PRODUCT_PLAN.md status to reflect the new approach
- If a tool enables capabilities not in the vision, add them to the appropriate section
- If tool pricing affects the cost architecture in VISION.md, update the cost table

Add `<!-- Updated by search-tools — YYYY-MM-DD -->` to any changed sections.

## Rules
- Prefer MCP servers over npm packages over custom code
- Prefer tools with TypeScript support and Zod compatibility
- Free tier must support at least 10 clients before recommending paid tools
- Always include the source URL for every tool evaluated
- Flag any tool that requires environment variables or API keys
- Update `references/known-mcps.md` with newly evaluated tools
