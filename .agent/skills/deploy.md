---
name: deploy
description: Deploy to Coolify on Hetzner VPS
user-invocable: true
disable-model-invocation: true
---

# Deploy to Production

Deploy the current codebase to the Hetzner VPS via Coolify.

## Prerequisites
- Git remote configured for the deployment repository
- Coolify configured with auto-deploy from the repository
- SSL certificates provisioned

## Steps

1. Run `pnpm build` to verify the build succeeds locally
2. Run `pnpm test` to verify all tests pass
3. Commit any uncommitted changes (ask user first)
4. Push to the deployment branch: `git push origin main`
5. Coolify will auto-detect the push and deploy
6. Verify deployment by checking the production URL

## Post-Deploy Checks
- Verify the website loads correctly
- Verify API endpoints respond
- Check Coolify dashboard for any deployment errors
- Verify PostgreSQL connection
- Verify n8n is running
