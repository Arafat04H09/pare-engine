# Technical Refactor: Unlocking the Core

## 1. Structural Insight (The "Why")
**The Thesis:** "We own the engine." (Master Build Plan).

Currently, the engine (`packages/core`) is a black box with few windows. `apps/web` and `apps/audit-runner` struggle to access the rich logic inside `packages/core/src/tools` because the `package.json` exports are restrictive. This leads to code duplication (e.g., `crawl-site.ts` notes that logic is duplicated in the runner) and makes it harder to build the Admin Dashboard (which needs to call tools directly).

**The Leverage:**
By standardizing the **Tool Export Pattern**, we turn `packages/core` into a true SDK. This allows:
1.  **Admin Dashboard** to invoke `generateJsonLd` or `scoreDelta` directly.
2.  **Audit Runner** to be a thin orchestration layer, importing all logic from Core.
3.  **Tests** to run against the exact same code that runs in production.

## 2. The Gap (Null Space)
*   **Existing:**
    *   `packages/core/package.json`: Exports only `.`, `./contracts`, and `./tools/crawler-analytics.js`.
    *   `packages/core/src/tools/crawl-site.ts`: Explicit comment: *"NOTE: This file will be importable ... once the core package.json exports field is updated."*
    *   `apps/audit-runner`: Likely re-implements or copies logic because it can't import it.
*   **Missing:**
    *   **Barrel File:** `packages/core/src/tools/index.ts` to export all tools.
    *   **Export Map:** `package.json` entries for the tools.

## 3. Proposed Specification

### User Story
**As a Developer,** I want to import any tool from `@pare-engine/core/tools/*` in the web app or runner, **so that** I don't have to duplicate logic or hack around import restrictions.

### Technical Implementation

#### A. Create Barrel File (`packages/core/src/tools/index.ts`)
Create a central export point:
```typescript
export * from './accuracy-scorer.js';
export * from './crawl-site.js';
export * from './generate-jsonld.js';
export * from './generate-faq.js';
export * from './score-delta.js';
// ... export all 23 tools
```

#### B. Update `package.json` (`packages/core/package.json`)
Open the gates:
```json
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js"
  },
  "./contracts": {
    "types": "./dist/contracts/index.d.ts",
    "import": "./dist/contracts/index.js"
  },
  "./tools": {
    "types": "./dist/tools/index.d.ts",
    "import": "./dist/tools/index.js"
  },
  "./tools/*": {
    "types": "./dist/tools/*.d.ts",
    "import": "./dist/tools/*.js"
  }
}
```

#### C. Cleanup Duplication
Once B is applied:
1.  Go to `apps/audit-runner/src/steps/crawl.ts`.
2.  Replace local logic with `import { buildCrawlOutput, normalizeDomain } from '@pare-engine/core/tools/crawl-site';`.

## 4. Pre-Mortem

*   **Failure Mode:** **Circular Dependencies.** Tools importing each other might create cycles.
    *   *Prevention:* Tools should be pure functions. If they need shared logic, it should go in `packages/core/src/utils` or `contracts`.
*   **Failure Mode:** **Tree Shaking Bloat.** Importing the barrel file might pull in unused dependencies (like Puppeteer) into the Web App.
    *   *Prevention:* Support subpath exports (`@pare-engine/core/tools/generate-jsonld`) so the Web App imports only what it needs, avoiding heavy server-side-only deps.
