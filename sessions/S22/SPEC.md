# S22: Production Deployment

## Mission
Vendor MCP tool definitions for production safety via mcp-to-ai-sdk, configure Coolify deployment on Hetzner, and smoke test the full pipeline in production.

## Agent
CLAUDE — Production deployment requires understanding mcp-to-ai-sdk security, Coolify configuration, and environment setup.

## Input Contracts (read from `@pare-engine/core/contracts`)
None — deployment configuration, not library code.

## Output Contracts (this session implements)
None

## Files OWNED (exclusive write access)
- `apps/audit-runner/src/tools-vendored/` (output of mcp-to-ai-sdk)
- `docker-compose.yml` (or Coolify-specific config)
- `apps/web/Dockerfile`
- `apps/audit-runner/Dockerfile`
- `.env.production.example`

## Files READ-ONLY (import, do not modify)
- All application code
- `.claude/settings.json` (MCP server definitions to vendor)

## Scaffold Salvage
None

## Dependencies
- ALL Round 1-6 sessions must complete first because this deploys the entire system
- Production environment (Hetzner CPX21) must be provisioned with Coolify installed

## Exit Criteria
- `mcp-to-ai-sdk` run against all MCP server definitions, producing static tool stubs
- Production code uses vendored stubs, not live MCP servers
- Docker images build for both `apps/web` and `apps/audit-runner`
- Coolify deployment config: PostgreSQL, Next.js app, audit-runner worker
- SSL configured via Coolify/Caddy
- `.env.production.example` with all production keys documented
- Smoke test: trigger audit via web form → pipeline completes → PDF delivered via email
- No MCP servers running in production

## Known Bugs to Fix
None — deployment configuration
