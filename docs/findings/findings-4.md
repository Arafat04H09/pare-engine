# Pare Engine: Tooling Research Findings

**Date:** February 10, 2026
**Context:** Research into MCPs, Skills, and Integrations to accelerate Pare Engine development and expand its feature set.

## Executive Summary
The ecosystem has matured significantly. For **build-time** acceleration, off-the-shelf MCPs for memory and dependency graphing exist but require configuration to be effective. "Session handoff" remains a manual process best solved by custom context files. For **product features**, the leverage is massive: high-quality MCPs exist for SEO (Semrush/DataForSEO) and Backend (Supabase), drastically reducing the need to build custom connectors.

---

## Part 1: Build-Time Tooling (The "Agentic IDE" Stack)
*Goal: Accelerate multi-session development and maintain architectural integrity.*

### 1. Memory & Context Management
**Existing Tools:**
*   **`mcp-server-memory`:** An official reference implementation that creates a persistent knowledge graph of entities and relations.
    *   *Maturity:* Beta/Reference.
    *   *Workflow Mapping:* **Context Loading**. It helps the agent "remember" architectural decisions or specific user preferences across sessions without re-reading every file.
*   **`mcp-server-git`:** Allows agents to search history, read diffs, and understand evolution.
    *   *Workflow Mapping:* **Debugging & Regression**. Essential for "why did this break?" queries.

**The Gap (Build It):**
*   **Session Handoff Manager:** No tool exists to explicitly "dump" working memory into a structured `SESSION_RESUME.md`.
    *   *Recommendation:* Build a simple script that summarizes the last 5 user prompts and modified files into a markdown snippet for the next session.

### 2. Feature & Dependency Graphs
**Existing Tools:**
*   **`dependency-mcp` (or similar variants):** Analyzes TypeScript/Python codebases to generate dependency graphs (JSON/DOT).
    *   *Maturity:* Emerging/Community.
    *   *Workflow Mapping:* **Impact Analysis**. Before refactoring `core`, ask this MCP "what depends on `ScoringAlgorithm`?" to prevent regressions.

**The Gap (Build It):**
*   **Spec-to-Code Validator:** No tool automatically checks if `src/` matches `docs/SPECS.md`.
    *   *Recommendation:* Write a custom "Audit" skill that parses your markdown specs (which are already structured) and verifies existence of corresponding exported symbols in `src`.

### 3. Governance (Cursor Rules)
**Existing Ecosystem:**
*   **Awesome Cursor Rules:** Repositories like `PatrickJS/awesome-cursorrules` contain specific rules for `Typescript`, `Turborepo`, and `Monorepo` structures.
*   **Key Rules for Pare Engine:**
    *   *Turborepo:* Enforce `apps` vs `packages` imports.
    *   *Testing:* "Always use `vitest` in `packages/core`."
    *   *Style:* "Prefer functional composition over class inheritance."

**Action:**
*   Create a `.cursor/rules` directory.
*   Add a `monorepo-architect.mdc` rule that enforces the boundary between `core` (pure logic) and `apps` (delivery).

---

## Part 2: Product-Integrated Tooling (Feature Engines)
*Goal: Plug-in capabilities instead of building them.*

### 1. Competitive Intelligence & SEO (High Leverage)
**Existing Tools:**
*   **DataForSEO MCP / Semrush MCP:** These are game-changers. Instead of building scrapers and analyzers, you plug these in to get keyword data, backlink analysis, and competitor traffic.
    *   *Maturity:* High (Commercial APIs wrapped in MCP).
    *   *Integration:* **Direct Feature**. Power the "Market Evidence" module of Pare Engine.
*   **Firecrawl MCP:** Specialized for turning websites into LLM-ready markdown.
    *   *Maturity:* High.
    *   *Integration:* **Research Phase**. Use this for ad-hoc competitor site analysis.

### 2. Social Listening & Scraping
**Existing Tools:**
*   **Reddit MCP & X (Twitter) MCP:** Allow searching, reading timelines, and fetching comments.
    *   *Maturity:* Moderate (API limits are the bottleneck).
    *   *Integration:* **Client Monitoring**. Track mentions of a client's brand.
*   **Apify (via MCP or API):** More robust for heavy scraping (e.g., "scrape all reviews from this G2 page").
    *   *Recommendation:* Use **Apify** for heavy lifting (batch jobs), use **Reddit/X MCPs** for real-time, lightweight interaction.

### 3. Backend Orchestration
**Existing Tools:**
*   **Supabase MCP:** Official server to manage database, auth, and edge functions.
    *   *Maturity:* High.
    *   *Integration:* **Admin Dashboard**. Use this within Pare Engine to let *you* (the operator) migrate schemas or query user data via natural language.

---

## Update: February 10, 2026 - Extended Ecosystem Search
*Research into Dev Acceleration, Product Integration, and Workflow Automation.*

### 1. Dev Acceleration (The "Agentic CI" Stack)
**Codebase Indexing & Search:**
*   **`sourcegraph-mcp`**: Connects Claude/Cursor to Sourcegraph's SCIP-based search.
    *   *Maturity:* High (Enterprise).
    *   *Mapping:* **Code Navigation**. Far superior to regex/grep for finding "all implementations of X" across a monorepo.
*   **`mcp-server-openapi` (wraps Spectral):** Validates OpenAPI/AsyncAPI specs against best practices.
    *   *Maturity:* Moderate (Community).
    *   *Mapping:* **Spec Validation**. Solves the "Spec-to-Code" validation gap identified previously by linting your `docs/api.yaml` before you code.

**Testing & Quality:**
*   **`playwright-mcp`**: Exposes browser automation primitives to agents.
    *   *Maturity:* High.
    *   *Mapping:* **E2E Testing**. Allows an agent to "go check if the login page actually works" by running a real browser session.

**Multi-Agent Orchestration:**
*   *Correction:* Agents (LangGraph/CrewAI) consume MCPs; they rarely *are* MCPs. However:
*   **`trigger.dev` MCP:** Allows an agent to define, deploy, and monitor long-running background jobs.
    *   *Maturity:* High (Production).
    *   *Mapping:* **Async Workflows**. The agent can say "run this scraper every hour" and Trigger.dev handles the infrastructure.

### 2. Product-Integrated Tooling (New Feature Capabilities)
**Backend & Database:**
*   **`gannonh/firebase-mcp`**: Experimental server for Firestore, Auth, and Storage.
    *   *Maturity:* Experimental.
    *   *Mapping:* **Backend Management**. Alternative to Supabase if clients prefer Google Cloud ecosystem.

**Analytics & CRM:**
*   **`posthog-mcp` (or wrap API):** PostHog's API is robust enough to be wrapped easily.
    *   *Mapping:* **User Analytics**. "Who used the 'Export' feature today?" becomes a natural language query.
*   **`hubspot-mcp` / `salesforce-mcp`**: Community wrappers exist but often limited.
    *   *Recommendation:* Use **Apify** or **n8n** as the middleware for CRM data to avoid maintaining brittle direct connectors.

**Reviews & Reputation:**
*   **`google-maps-reviews-mcp`**: Does not officially exist.
    *   *Workaround:* Use **DataForSEO MCP** (already listed) or **Apify** Google Maps Scraper. Do not build this from scratch.

### 3. Workflow Automation
**Notifications & Ops:**
*   **`slack-mcp` / `discord-mcp`**: Simple wrappers for webhooks.
    *   *Maturity:* High.
    *   *Mapping:* **Alerting**. "Notify the #alerts channel if the crawler fails."

### 4. Skills & Rules Libraries (Resource List)
**Claude Skills:**
*   **`anthropics/skills`**: The official repo. Best for document processing (PDF/Excel extraction).
*   **`travisvn/awesome-claude-skills`**: Good for developer-centric skills.

**Cursor Rules (`.cursor/rules`):**
*   **`PatrickJS/awesome-cursorrules`**: The definitive collection.
    *   *Must-Have Rules:* `typescript`, `turborepo`, `vitest`, `react-query`.

---

## Update: February 10, 2026 - Extended Ecosystem Search II (Deep Dive)
*Focused on closing gaps in Memory, Secrets, and Specialized Scraping.*

### 1. Dev Acceleration (Advanced)
**Memory & Context Persistence:**
*   **`mem0-mcp`**: Official MCP for Mem0 (memory platform).
    *   *Maturity:* Emerging/High-Potential.
    *   *Mapping:* **Long-term User Profiling**. Better than the reference `mcp-server-memory` for handling fuzzy user preferences over weeks of development.
*   **`codium-ai` (plugin, not MCP):**
    *   *Correction:* Not an MCP, but an IDE plugin. For MCP-based test generation, stick to `playwright-mcp` or generic LLM prompting with `vitest` rules.

**Secrets Management:**
*   **`infisical-mcp` / `doppler-mcp`**:
    *   *Status:* Official MCPs don't exist yet, but both have strong CLIs.
    *   *Recommendation:* Don't build an MCP. Use `run_shell_command("doppler run -- command")` pattern. It's safer and standard.

### 2. Product-Integrated Tooling (Specialized)
**Reviews & Maps (Solved):**
*   **`google-maps-reviews-scraper` (MCP Market):** An auto-generated MCP wrapping a scraper.
    *   *Maturity:* Experimental.
    *   *Alternative:* **`cablate/mcp-google-map`**: Provides official Google Maps API access (geocoding, places).
    *   *Mapping:* Use `cablate/mcp-google-map` for reliable data, fallback to Apify for heavy review scraping.

**Payments & Business:**
*   **`stripe-mcp`**: Existing community implementations allow "read-only" access to dashboard stats.
    *   *Mapping:* **Revenue Dashboard**. "Show me this month's MRR" becomes a query without logging into the Stripe dashboard.

**Project Management:**
*   **`linear-mcp` / `jira-mcp`**:
    *   *Maturity:* High (Community).
    *   *Mapping:* **Project Sync**. Create tasks from Todo comments automatically. "Create a Linear ticket for this TODO."

### 3. Workflow Automation (Deployment)
**Deployment:**
*   **Vercel/Netlify:** No "official" MCP servers, but their CLIs are highly automatable.
    *   *Pattern:* Use `run_shell_command("vercel deploy --prod")` rather than looking for a specialized MCP wrapper. The CLI *is* the best interface.

---

## Update: February 10, 2026 - Final Gaps & Emerging Tools
*Findings from deep-dive registry searches (Smithery, Glama, Awesome Lists).*

### 1. Dev Acceleration (Emerging Infrastructure)
**Database & Serverless:**
*   **`neon-mcp`**: Official-tier server for Neon (Serverless Postgres).
    *   *Maturity:* High (Open Source).
    *   *Mapping:* **DB Management**. "Create a testing branch for the new schema" — enables branching your database via chat.
*   **`e2b-mcp`**: Connection to E2B's secure cloud sandboxes.
    *   *Maturity:* High (Official).
    *   *Mapping:* **Code Execution**. Safely run generated Python scripts (like data analysis) in a remote sandbox instead of local machine.
*   **`browserbase-mcp`**: Headless browser infrastructure.
    *   *Maturity:* High (Official).
    *   *Mapping:* **Robust Scraping**. Better than local Puppeteer; handles anti-bot detection for your "Site Crawler" module.

**Codebase Intelligence:**
*   **`code-index-mcp` (local)**: A local-first alternative to Sourcegraph.
    *   *Maturity:* Community.
    *   *Mapping:* **Local Search**. Good for offline/local-only indexing if Sourcegraph is overkill.

### 2. Product-Integrated Tooling (CRM & Analytics)
**CRM & Data:**
*   **`attio-mcp` (connector)**: Exists via "Attio API Connector".
    *   *Maturity:* Community.
    *   *Mapping:* **Modern CRM**. "Add this lead to the 'Qualified' list in Attio."
*   **`mixpanel-mcp`**: Official/Community versions exist.
    *   *Maturity:* Moderate.
    *   *Mapping:* **Product Analytics**. "Show me the funnel drop-off for the new onboarding flow."

### 3. Workflow Automation
**Deployment & Ops:**
*   **`next-devtools-mcp`**: Specialized tools for Next.js debugging.
    *   *Maturity:* Community.
    *   *Mapping:* **Frontend Debugging**. Inspect routes and hydration errors directly via chat.
*   **`sentry-mcp`**: Official integration.
    *   *Maturity:* High.
    *   *Mapping:* **Error Triage**. "Fetch the latest stack trace for issue #1234."

---

## Top 5 High-Leverage Additions (Final Consolidated List)

| Priority | Category | Tool | Why? |
| :--- | :--- | :--- | :--- |
| **1** | **Infrastructure** | **Neon MCP** | Enables "Database Branching" — a massive unlock for safe schema iteration via agents. |
| **2** | **Scraping** | **Browserbase MCP** | Replaces brittle local scraping with managed, stealthy browser infrastructure for your crawler. |
| **3** | **Execution** | **E2B MCP** | Allows the agent to run code safely in the cloud, perfect for "Analysis" features in the dashboard. |
| **4** | **Workflow** | **Trigger.dev MCP** | Best-in-class for defining and monitoring background jobs (scrapers, reports) via code. |
| **5** | **Memory** | **Mem0 MCP** | The missing "Long-term Memory" layer to make the agent smarter about your specific preferences. |
