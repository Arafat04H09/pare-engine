# Deployment Readiness — Hetzner + Coolify + Docker Compose

> **Confidence:** High
> **Last verified:** 2026-02-11
> **Source:** Thread 3 research — Coolify docs, Hetzner specs, Inngest docs, codebase analysis
> **Updated by:** /research — 2026-02-11

## Infrastructure Specs

### Hetzner CPX Series (AMD EPYC-Genoa, shared vCPU)

| Plan | vCPU | RAM | Storage | Monthly (EU) | Monthly (US) |
|------|------|-----|---------|-------------|-------------|
| CPX21 | 3 | 4 GiB | 80 GB | ~EUR 7.90 | ~EUR 10.43 |
| CPX31 | 4 | 8 GiB | 160 GB | ~EUR 15.90 | ~EUR 21.10 |

**Note:** The docker-compose.yml previously documented CPX21 as "4 vCPU, 8 GB RAM" which is actually CPX31 specs.

### Memory Budget for Pare Engine Stack

| Service | Idle | Peak (during audit) |
|---------|------|---------------------|
| OS + Docker overhead | ~500 MB | ~500 MB |
| PostgreSQL 16 Alpine | ~150 MB | ~200 MB |
| Inngest (embedded Redis) | ~200 MB | ~400 MB |
| Next.js standalone | ~150 MB | ~200 MB |
| Audit-runner (Node.js) | ~150 MB | ~200 MB |
| Chromium (PDF generation) | 0 MB | ~300-600 MB |
| **Total** | **~1.2 GB** | **~2.0-3.0 GB** |

CPX21 (4 GB): Viable for single-operator with sequential audits. Tight during PDF generation.
CPX31 (8 GB): Comfortable headroom. Recommended if running scheduled monitoring alongside on-demand audits.

## Coolify Capabilities

- Deploys Docker Compose stacks natively as a build pack
- Auto-provisions SSL via Caddy + Let's Encrypt
- Environment variables managed through Coolify UI
- Supports build contexts, healthchecks, named volumes
- Services communicate within compose stack via Docker network
- No known limitations for Next.js 15 App Router or Puppeteer

## Inngest Self-Hosting

- **Production command:** `inngest start` (NOT `inngest dev`)
- `inngest dev` is development-only, not designed for production
- Default persistence: SQLite (single-node only)
- Recommended: external PostgreSQL for config/history storage
- Queue/state: embedded in-memory Redis by default, external Redis optional
- Authentication: `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` (hexadecimal strings)
- `inngest start` is marked as `[Beta]` in docs but is the official self-hosting path
- Resource guidance: ~1-2 GB RAM, 0.5-2 vCPU (from Helm chart defaults)

## Puppeteer in Docker (Alpine)

- Install via `apk add chromium nss freetype harfbuzz ca-certificates ttf-freefont`
- Set `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser`
- Set `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`
- Docker `shm_size: "256mb"` required (default 64MB causes Chrome crashes)
- Runtime launch args needed: `--disable-dev-shm-usage`, `--no-sandbox`, `--disable-gpu`
- Single PDF generation: ~300-600 MB RAM depending on page complexity
- Base Chromium idle: ~200-300 MB

## Known Deployment Blockers (as of 2026-02-11)

1. `next.config.ts` missing `output: 'standalone'` — Docker build fails
2. No `/api/health` endpoint — Docker healthcheck fails
3. `inngest dev` in docker-compose instead of `inngest start`
4. Audit-runner has no HTTP server — container exits immediately
5. `config.contract.ts` marks Inngest keys as optional — should be required for production

## Open Questions

- Actual memory usage under load (theoretical estimates only)
- Coolify label injection compatibility with our docker-compose
- Database migration automation (currently manual `drizzle-kit push`)
- Inngest `start` command long-term stability (currently Beta)

## Sources

- [Hetzner CPX21 specs — Spare Cores](https://sparecores.com/server/hcloud/cpx21) — vCPU, RAM, pricing
- [Hetzner CPX31 specs — VPSBenchmarks](https://www.vpsbenchmarks.com/hosters/hetzner/plans/cpx31) — comparison tier
- [Coolify Docker Compose docs](https://coolify.io/docs/applications/build-packs/docker-compose) — deployment capabilities
- [Coolify Next.js docs](https://coolify.io/docs/applications/nextjs) — framework support
- [Inngest self-hosting docs](https://www.inngest.com/docs/self-hosting) — production deployment guide
- [Inngest local development docs](https://www.inngest.com/docs/local-development) — dev vs start distinction
- [Puppeteer Docker guide](https://pptr.dev/guides/docker) — official Docker configuration
- [Puppeteer memory issues #3314](https://github.com/puppeteer/puppeteer/issues/3314) — Chrome memory consumption
