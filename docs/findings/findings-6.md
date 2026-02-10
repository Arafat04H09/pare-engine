# Pare Engine Tooling Research Findings

## 1. Build-Time Tooling
*Accelerating the "Spec-to-Code" loop and persistent context.*

### A. Context & Memory (The "Amnesia" Fix)
**Gap:** Managing context across multi-session builds without re-reading 50 files.

| Tool | Type | Status | Mapping to Workflow |
| :--- | :--- | :--- | :--- |
| **`@modelcontextprotocol/server-memory`** | MCP | **Ready** | **High Leverage.** Adds a persistent knowledge graph to Claude. Use it to store architectural decisions ("We decided X because Y") and relationship maps that don't fit in code comments. |
| **`.claude/rules`** | Config | **Ready** | **High Leverage.** You already have this, but it replaces "Cursor Rules". **Action:** Port any "Cursor" specific agent instructions (like "always use Zod for validation") into `rules/coding-standards.md`. |
| **`github-mcp`** | MCP | **Ready** | Connects Claude to Issues/PRs. Use this to read the "Issue" spec directly instead of pasting it into the chat. |
| **`linear-mcp`** | MCP | **Ready** | Connects Claude to your project management. **Use case:** "Create a Linear issue for this bug" directly from the CLI without switching context. |
| **`notion-mcp`** | MCP | **Ready** | Official & Community options. **Use case:** "Read the 'Brand Guidelines' page from Notion" to inform the report generator style. |

**Null Space (Build This):**
*   **Spec-to-Code Validator Skill:** No MCP currently exists that "reads markdown specs and validates code compliance".
    *   *Solution:* Build a simple local script (node.js) that extracts requirements from `docs/*.md` (looking for `- [ ]` or specific headers) and checks if corresponding files/tests exist, then wrap it as a Claude Skill (`run-spec-check`).
*   **Claude Test Gen Skill:** Not an MCP, but a specific prompting strategy/skill is missing.
    *   *Solution:* Create a `.claude/skills/test-gen.md` that instructs Claude to "Read file X, read `docs/testing.md`, and output Vitest code".

### B. Knowledge Graph & Indexing
**Gap:** "Where is the code for X defined?" without grepping everything.

| Tool | Type | Status | Mapping to Workflow |
| :--- | :--- | :--- | :--- |
| **`search-mcp`** | MCP | **Ready** | (Often built-in/standard) Uses `ripgrep` for semantic search. Essential for large monorepos. |
| **`postgres-mcp`** | MCP | **Ready** | Use this (read-only) on your *local* dev DB to let Claude see the *actual* data shape during development, not just the Drizzle schema. |
| **`depgraph-mcp`** (depgraph.ai) | MCP | **Beta** | Generates visual dependency graphs of your monorepo. **Use case:** Ask Claude "Draw the dependency chain for `scoring.ts`" to visualize impact before refactoring. |
| **`neo4j-mcp`** | MCP | **Ready** | **High Leverage for Analytics.** If you decide to store complex relationship data (like competitive graphs), this provides a natural language interface to query it. |
| **`pinecone-mcp`** | MCP | **Ready** | **RAG Enabler.** Allows you to upsert/query vectors. Use this if/when you build a "Chat with your Audit" feature for clients. |

---

## 2. Product-Integrated Tooling
*Features that become "buttons" in the dashboard.*

### A. Social & Competitive Intelligence
**Gap:** "What is Reddit saying about this brand?" (The Social Signal Pillar)

| Tool | Type | Status | Mapping to Workflow |
| :--- | :--- | :--- | :--- |
| **`apify-mcp`** | MCP | **High Leverage** | **The "Skeleton Key" for scraping.** Instead of separate APIs for Reddit, X, and LinkedIn, use Apify Actors (e.g., `reddit-scraper`, `twitter-scraper`). Maps directly to the **Social Scoring Pillar**. |
| **`brave-search-mcp`** | MCP | **Ready** | Cheaper/Faster alternative to Google Search for "brand mention" counting. Maps to **AI Visibility Pillar**. |
| **`serpapi-mcp`** | MCP | **Ready** | **Critical Find.** Scrapes Google Reviews, Maps, and specialized search results. **Use case:** "Get the last 50 1-star reviews for this business" (Social Scoring). |

### B. SEO & Technical Analysis
**Gap:** Automated "Technical Readiness" scoring.

| Tool | Type | Status | Mapping to Workflow |
| :--- | :--- | :--- | :--- |
| **`google-search-console-mcp`** | MCP | **Ready** | Pulls real click/impression data. Maps to **Organic Foundation** scoring. (Note: Requires client auth, so best for "verified" audits). |
| **`pagespeed-insights-mcp`** | MCP | **Ready** | Automates the "Mobile Friendliness" and "Core Web Vitals" check. Maps to **Technical Pillar**. |
| **`lighthouse-mcp`** | MCP | **Ready** | Runs deep accessibility/performance audits locally or via API. |
| **`google-analytics-mcp`** | MCP | **Exp** | Experimental community implementations exist (e.g., `ruchernchong/mcp-server-google-analytics`). **Use case:** "Get 30-day traffic trend" for the client report. |

### C. Backend Orchestration & CRM
**Gap:** Automating client infrastructure.

| Tool | Type | Status | Mapping to Workflow |
| :--- | :--- | :--- | :--- |
| **`coolify-mcp`** | MCP | **Emerging** | Community implementations exist (or wrap the API easily). Use this to auto-deploy a "Client Portal" instance if you move to single-tenant architecture later. |
| **`stripe-mcp`** | MCP | **Ready** | Official Stripe MCP. Use this for the "Billing" tab in your admin dashboard to query revenue without leaving the CLI. |
| **`salesforce-mcp`** | MCP | **Beta** | Official beta + Community versions. **Use case:** "Sync this audit report to the Client's Salesforce record". |
| **`hubspot-mcp`** | MCP | **Beta** | Official beta. **Use case:** "Create a deal in HubSpot for this new audit lead". |
| **`firebase-mcp`** | MCP | **Exp** | Official experimental support in Firebase CLI. **Use case:** "Add a new 'audit_requested' flag to Firestore for user X". |
| **`vault-mcp`** | MCP | **Ready** | HashiCorp official. **Use case:** Securely retrieve client API keys during the audit run without hardcoding them in the environment. |

---

## 3. Workflow Automation
*Ops and Monitoring.*

| Tool | Type | Status | Mapping to Workflow |
| :--- | :--- | :--- | :--- |
| **`docker-mcp-toolkit`** | MCP | **Ready** | Docker Desktop's built-in toolkit. **Use case:** spin up Redis/Postgres test containers via chat. |
| **`playwright-mcp`** | MCP | **Ready** | E2E test runner & scraper. **Use case:** "Run the login flow test and tell me why it failed" or "Scrape this specific DOM element". |
| **`mcp-scheduler`** | MCP | **Emerging** | A cron-job manager for MCP. **Use case:** "Schedule a re-audit for Client X every Monday at 9am". Replaces custom `node-cron` logic for simple tasks. |
| **`kagent` / `kubernetes-mcp`** | MCP | **Beta** | Direct K8s management. **Use case:** "Restart the crawler pod" or "Check logs for the audit-runner" from the chat interface. (Valuable if/when you migrate off Coolify to raw K8s). |
| **`grafana-mcp`** | MCP | **Beta** | Query your metrics. **Use case:** "Show me the error rate for the `scoring` service over the last hour" to debug pipeline failures without opening the Grafana UI. |
| **`sentry-mcp`** | MCP | **Ready** | Official Sentry MCP. **Use case:** "List the top 5 most frequent errors in the audit-runner from the last 24h". |
| **`render-mcp`** | MCP | **Ready** | Official hosted MCP server. **Use case:** If you deploy to Render, managing services via chat. |
| **`posthog-mcp`** | MCP | **Migrated** | Now part of the main PostHog repo. **Use case:** "Are users actually clicking the 'Download PDF' button?" (Product Analytics). |
| **`mcp-spectral`** | MCP | **Ready** | Wraps Spectral API linter. **Use case:** "Validate `api/openapi.yaml` against our style guide" before committing. |

---

## 4. The "80/20" Implementation Plan (Final)

1.  **Immediate Win (Build):** Install **`@modelcontextprotocol/server-memory`** and **`linear-mcp`**. This immediately solves the "Amnesia" problem and keeps your project management (Linear) in the same window as your code.
2.  **Immediate Win (Product):** Integrate **`serpapi-mcp`**. This is the highest leverage "feature add" for the audit engine. It instantly enables "Google Reviews" and "Maps" scoring without you writing a single line of scraper code.
3.  **Quick Win (Dev):** Use **`docker-mcp-toolkit`** (likely already in your Docker Desktop). It accelerates local dev by letting you spin up test databases via chat commands.
4.  **Quick Win (Ops):** Add **`sentry-mcp`**. It closes the loop on debugging by letting Claude read the error trace directly from Sentry.
5.  **Custom Build:** Create the **`verify-spec` skill**. A simple script that greps `docs/` for requirements and asserts their presence in `packages/core`. No MCP does this specific "Spec-Driven Development" check for you.
