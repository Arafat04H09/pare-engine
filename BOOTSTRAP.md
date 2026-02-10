# Bootstrap Checklist (Round 0)

> This is the pre-flight checklist for the Bootstrap session. Complete every item in order before launching Round 1.
> Estimated duration: SHORT (<2h). Agent: CLAUDE.

## Prerequisites

- [ ] Node.js 20+ installed
- [ ] pnpm 9+ installed
- [ ] All API keys available (at minimum: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `FIRECRAWL_API_KEY`)

---

## Step 1: Git Init

```bash
cd C:\Users\arafa\OneDrive\Desktop\pare-engine
git init
git branch -M main
```

---

## Step 2: Fix Workspace Config

### 2a. `pnpm-workspace.yaml` — Add apps/*

**Current (broken):**
```yaml
packages:
  - "packages/*"
```

**Target:**
```yaml
packages:
  - "packages/*"
  - "apps/*"
```

### 2b. `turbo.json` — Rename deprecated `pipeline` to `tasks`

**Current (deprecated):**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env"],
  "pipeline": { ... }
}
```

**Target:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "lint": {},
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {},
    "clean": {
      "cache": false
    }
  }
}
```

---

## Step 3: Fix `packages/core/package.json`

### 3a. Add `type: "module"` and `exports` field for contract subpath imports

**Add these fields:**
```json
{
  "name": "@pare-engine/core",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./contracts": {
      "types": "./dist/contracts/index.d.ts",
      "import": "./dist/contracts/index.js"
    }
  },
  "scripts": { ... },
  "dependencies": { ... }
}
```

This enables: `import { CrawlOutput } from '@pare-engine/core/contracts'`

### 3b. Verify contracts compile

After adding the exports field:
```bash
pnpm --filter @pare-engine/core build
```

Confirm that `dist/contracts/index.d.ts` is generated.

---

## Step 4: Scaffold `apps/audit-runner/`

Create minimal app scaffold:

```
apps/audit-runner/
├── package.json
├── tsconfig.json
└── src/
    └── steps/
        └── .gitkeep
```

**`apps/audit-runner/package.json`:**
```json
{
  "name": "@pare-engine/audit-runner",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest run"
  },
  "dependencies": {
    "@pare-engine/core": "workspace:*",
    "inngest": "^3.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

**`apps/audit-runner/tsconfig.json`:**
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"],
  "references": [
    { "path": "../../packages/core" }
  ]
}
```

---

## Step 5: Scaffold `apps/web/`

Create minimal Next.js scaffold. The actual Next.js setup happens in S14, but we need the directory to exist for workspace resolution.

```
apps/web/
├── package.json
└── tsconfig.json
```

**`apps/web/package.json`:**
```json
{
  "name": "@pare-engine/web",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "build": "next build",
    "dev": "next dev",
    "lint": "next lint"
  },
  "dependencies": {
    "@pare-engine/core": "workspace:*",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
}
```

**`apps/web/tsconfig.json`:**
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "jsx": "preserve",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", "next-env.d.ts"],
  "exclude": ["node_modules"]
}
```

---

## Step 6: Create `.env.example`

```env
# --- Tier 1: Required for any audit ---
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
PERPLEXITY_API_KEY=
FIRECRAWL_API_KEY=

# --- Tier 2: Optional, enhances audits ---
SERPER_API_KEY=
GOOGLE_PLACES_API_KEY=
DATAFORSEO_LOGIN=
DATAFORSEO_PASSWORD=

# --- Infrastructure ---
DATABASE_URL=postgresql://localhost:5432/pare_engine
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# --- Auth (admin panel) ---
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=
SESSION_SECRET=

# --- Email ---
RESEND_API_KEY=

# --- Payments ---
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# --- Optional services ---
NOTION_API_KEY=
NOTION_DATABASE_ID=
COOLIFY_API_KEY=
```

---

## Step 7: Delete the `nul` File

```bash
del nul
```

This is a Windows artifact (zero-byte file named `nul`). On Windows, you may need:
```bash
ren nul nul_temp && del nul_temp
```

Or use a git operation to remove it from tracking.

---

## Step 8: Create `.gitignore`

If not already present, create or verify `.gitignore` includes:

```
node_modules/
dist/
.next/
.env
.env.local
*.tsbuildinfo
.turbo/
```

---

## Step 9: Install Dependencies

```bash
pnpm install
```

Verify workspace resolution:
```bash
pnpm ls --filter @pare-engine/core
pnpm ls --filter @pare-engine/audit-runner
pnpm ls --filter @pare-engine/web
```

All three should resolve. `@pare-engine/audit-runner` and `@pare-engine/web` should show `@pare-engine/core` as a workspace dependency.

---

## Step 10: Verify Contracts Compile

```bash
pnpm --filter @pare-engine/core build
```

**Expected:** Clean compile. `dist/contracts/` directory exists with `.js` and `.d.ts` files for all 7 contract modules.

**Check subpath import works:**
```bash
node -e "import('@pare-engine/core/contracts').then(m => console.log(Object.keys(m)))"
```

Should print an array of exported names (schemas, types, etc.).

---

## Step 11: Verify Build

```bash
pnpm build
```

**Expected:** `@pare-engine/core` builds clean. `@pare-engine/audit-runner` may warn about missing source files (just `.gitkeep`) — acceptable. `@pare-engine/web` may fail without a Next.js app entry — acceptable at bootstrap.

The key requirement: `packages/core` compiles with all contracts intact.

---

## Step 12: Create `.claude/settings.json`

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Write",
      "Edit"
    ]
  }
}
```

(S1 will refine this further with MCP server configuration.)

---

## Step 13: Create Session STATUS.md Templates

For each session directory `sessions/S{N}/`, create an initial `STATUS.md`:

```markdown
# S{N} Status

- **Status**: pending
- **Started**: —
- **Completed**: —
- **Branch**: —

## Files Created
(none yet)

## Files Modified
(none yet)

## Deviations from Spec
(none yet)

## Blockers
(none)

## Notes
(none)
```

---

## Step 14: Initial Commit

```bash
git add -A
git commit -m "bootstrap: coordination infrastructure, contracts, workspace setup

- Initialize git repository
- Fix pnpm-workspace.yaml (add apps/*)
- Fix turbo.json (pipeline → tasks)
- Add @pare-engine/core exports field for contract subpath imports
- Add type: module to packages/core
- Create 7 contract files in packages/core/src/contracts/
- Scaffold apps/audit-runner and apps/web
- Create .env.example with all tiers
- Create .claude/rules/coordination.md
- Create COORDINATION.md with ownership map + merge protocol
- Create 28 session SPEC.md files
- Delete nul artifact

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Postconditions (Verify Before Declaring Done)

- [ ] `git log --oneline` shows the bootstrap commit
- [ ] `pnpm install` succeeds with no errors
- [ ] `pnpm --filter @pare-engine/core build` succeeds
- [ ] `dist/contracts/index.d.ts` exists in `packages/core/`
- [ ] `sessions/S1/SPEC.md` through `sessions/S28/SPEC.md` all exist
- [ ] `.claude/rules/coordination.md` is loaded by Claude Code sessions
- [ ] `.env.example` has all required keys documented
- [ ] `nul` file is gone
- [ ] `pnpm-workspace.yaml` includes `apps/*`
- [ ] `turbo.json` uses `tasks` (not `pipeline`)

**When all checks pass: Round 0 is complete. Launch Round 1 (S1, S2, S3 in parallel).**
