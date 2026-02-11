---
name: run-audit
description: Run an audit against a real business domain for testing
user-invocable: true
---

# Run Audit

Execute the audit pipeline against a target business domain for testing and development.

## Steps

1. Confirm the target domain, business name, and vertical with the user
2. Check that required environment variables are set (API keys for Firecrawl, OpenAI, etc.)
3. If `apps/audit-runner` exists, use the CLI: `pnpm --filter audit-runner run audit --domain <domain> --vertical <vertical>`
4. If not yet built, run the pipeline steps manually:
   a. Use Firecrawl MCP to crawl the domain (or direct API call)
   b. Use AI SDK to query LLM providers
   c. Run scoring functions from `packages/core`
   d. Generate a test report
5. Report the results: overall score, per-pillar breakdown, key findings
6. Save output to `scripts/test-output/` for review
