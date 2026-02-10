# Tooling Research Findings

## Gap 1: Build-time Tooling (Agentic Acceleration)

Tools that accelerate the "consultant + AI" development loop.

### 1. Persistent Memory (Session Handoff)
*   **What Exists:** `mcp-server-sqlite` (Community).
    *   *What it does:* Provides a simple, file-based SQL database that Claude can query and write to. Lighter than Redis-based memory servers.
    *   *Maturity:* High (SQLite is battle-tested, MCP wrapper is simple).
*   **Map to Workflow:** **Context & Planning Phases**. allows you to save architectural decisions, "lessons learned," and active feature states between sessions. "Claude, recall the decision we made about the scoring algorithm in the last session."
*   **Missing:** A "Project Journal" abstraction. The raw DB exists, but you need to define the schema (e.g., table `decisions` with columns `topic`, `decision`, `rationale`).

### 2. Codebase Indexing & Feature Graphs
*   **What Exists:** `repomix` (Tool) & `context-graph-mcp` (Community/Experimental).
    *   *What it does:* `repomix` packs your codebase into a single AI-friendly XML/Markdown file. `context-graph-mcp` (by ingpoc) attempts to log decision traces and semantic relationships.
    *   *Maturity:* `repomix` is High (standard for LLM coding). `context-graph-mcp` is Low/Experimental.
*   **Map to Workflow:** **Understanding Phase**. When starting a session, instead of "read these 5 files," you provide a packed summary or query the graph for "all files related to the Scoring Feature."
*   **Missing:** A true "Feature Graph" MCP that maps business features to code files (e.g., "The 'Audit' feature touches `scoring.ts`, `crawler.ts`, and `report.ts`"). You likely need to build a simple `features.json` map and a tool to read it.

### 3. Agent Skills (Workflow Automation)
*   **What Exists:** `skill-creator` (Native Gemini/Claude Skill).
    *   *What it does:* A meta-skill that helps you write other skills (Markdown files in `.claude/skills`).
    *   *Maturity:* High (Native).
*   **Map to Workflow:** **Implementation Phase**. Automate repetitive tasks like "Create a new Inngest step" or "Add a new database migration."
*   **Missing:** A shared "Marketplace" of high-level architectural skills. You have to write your own project-specific ones (which is actually better for you).

---

## Gap 2: Product-Integrated Tooling (Dashboard Features)

MCPs/APIs that plug directly into Pare Engine to provide value to clients.

### 1. Social Scraping (Reddit/X)
*   **What Exists:** `apify-mcp-server` (Official).
    *   *What it does:* Bridges Claude/Pare to Apify's 1,500+ pre-built scrapers (Reddit, X/Twitter, Instagram, Google Maps).
    *   *Maturity:* High. Apify is the industry standard for scraping; the MCP wrapper makes it "plug-and-play" for agentic workflows.
*   **Map to Workflow:** **Analysis Phase**. "Check Reddit for sentiment about this brand."
*   **Missing:** Real-time monitoring without cost scaling. Apify is paid per usage.

### 2. SEO & Competitive Intelligence
*   **What Exists:** `keywords-everywhere` (API/Tool) & `DataForSEO` (API).
    *   *What it does:* `DataForSEO` is the "AWS of SEO data" — raw APIs for SERP, Keywords, Backlinks. `keywords-everywhere` is lighter/cheaper.
    *   *Maturity:* APIs are Very High. MCP wrappers are Non-existent/Custom.
*   **Map to Workflow:** **Scoring Phase**. "Get the domain authority and backlink count for the client."
*   **Missing:** A pre-built "SEO MCP." **You must build this.** It's a high-leverage build: wrap 3 `DataForSEO` endpoints (SERP, Backlinks, On-page) into a simple MCP.

### 3. Backend Management
*   **What Exists:** `supabase-mcp-server` (Official).
    *   *What it does:* Full management of your Postgres DB, Auth, and Edge Functions via chat.
    *   *Maturity:* High.
*   **Map to Workflow:** **Implementation & Debugging**. "Add a column to the `audits` table and update the types." (Currently you use Drizzle, so this is less critical for *schema* but great for *data* inspection).
*   **Missing:** Nothing significant.

### 4. Brand Monitoring (AI Visibility)
*   **What Exists:** `perplex-mcp` (Community) & `serpapi-mcp` (Community).
    *   *What it does:* Interfaces for Perplexity and Google Search results.
    *   *Maturity:* Medium.
*   **Map to Workflow:** **Monitoring Phase**. The core product value proposition.
*   **Missing:** A unified "AI Visibility Score" aggregator. **This is your core IP.** You shouldn't buy this; you are building it (`packages/scoring`).

---

## 2026-02-10 Update: Additional Discoveries

### Category 1: Dev Acceleration
*   **`github-mcp-server`** (Official)
    *   *What it does:* Search issues, read PRs, and get file content directly from GitHub.
    *   *Maturity:* High.
    *   *Map:* **Understanding**. Syncs project management (Issues) with code execution.
*   **`next-devtools-mcp`** (Community)
    *   *What it does:* Next.js specific development utilities and insights for agents.
    *   *Maturity:* Beta.
    *   *Map:* **Implementation**. Accelerates building the `apps/web` Next.js frontend.
*   **`microsoft/playwright-mcp`** (Official)
    *   *What it does:* Automates web interactions using structured accessibility snapshots for LLM reliability.
    *   *Maturity:* Production.
    *   *Map:* **Verification**. Use for autonomous test generation and verifying audit UI flows.
*   **`npm-sentinel-mcp`** (Community)
    *   *What it does:* AI-powered analysis of NPM packages (security, dependencies, quality).
    *   *Maturity:* Beta.
    *   *Map:* **Implementation**. Use when evaluating new libraries for the monorepo.
*   **`Agent-MCP`** (Framework)
    *   *What it does:* Framework for creating multi-agent systems with coordinated collaboration via MCP.
    *   *Maturity:* Experimental.
    *   *Map:* **Orchestration**. Foundation for complex "Multi-Agent Audits" (e.g., one agent crawls, another analyzes).
*   **`brave-search-mcp`** (Official)
    *   *What it does:* Privacy-focused web, news, and local search for LLMs.
    *   *Maturity:* Production.
    *   *Map:* **Research**. An alternative to Perplexity/Google for gathering "neutral" web evidence.
*   **`qdrant-mcp`** (Official)
    *   *What it does:* Connects LLMs to a vector database for semantic memory storage/retrieval.
    *   *Maturity:* Production.
    *   *Map:* **Memory**. A more advanced "Long Term Memory" solution than SQLite if your context grows massive.
*   **`mcp-jest`** (Community)
    *   *What it does:* A testing framework designed for testing MCP servers themselves using Jest-like syntax.
    *   *Maturity:* Community.
    *   *Map:* **Verification**. Ensure your *custom* MCPs (like `seo-mcp`) are robust.
*   **`@madrus/vitest-mcp-server`** (Community)
    *   *What it does:* Exposes Vitest capabilities to AI agents, allowing them to run project tests and analyze coverage.
    *   *Maturity:* Community/Experimental.
    *   *Map:* **Verification**. "Claude, run the test suite and fix the failing scoring tests."

### Category 2: Product Integration
*   **`hubspot-mcp`** (Official)
    *   *What it does:* Securely interact with HubSpot CRM data (contacts, deals, companies) via natural language.
    *   *Maturity:* Production.
    *   *Map:* **Sales/CRM**. Automatically log new audit leads from Pare Engine directly into HubSpot.
*   **`google-analytics-mcp`** (Community)
    *   *What it does:* Access GA4 reports, real-time metrics, and property metadata via chat.
    *   *Maturity:* Production.
    *   *Map:* **Client Reporting**. Incorporate actual traffic data into client audit reports.
*   **`sitemap-mcp`** (Community)
    *   *What it does:* Fetch, parse, and analyze website sitemaps for SEO issues.
    *   *Maturity:* Production.
    *   *Map:* **Analysis**. Automates the first step of the audit (discovering all client URLs).
*   **`stripe-mcp`** (Community)
    *   *What it does:* Manage Stripe payments, customers, and subscriptions via chat.
    *   *Maturity:* Production.
    *   *Map:* **Monetization**. Allow the operator to handle refunds or check subscription status via the dashboard.
*   **`semrush-mcp`** (Community/Wrapper)
    *   *What it does:* Bridges AI agents to Semrush API for keyword, domain, and backlink analytics.
    *   *Maturity:* Beta.
    *   *Map:* **Scoring**. The gold standard for "Competitor Intelligence" data points.
*   **`notion-mcp`** (Community)
    *   *What it does:* Read/Write access to Notion databases and pages.
    *   *Maturity:* Production.
    *   *Map:* **Client Management**. A lightweight CRM/Client Portal alternative to HubSpot for early stages.
*   **`linear-mcp`** (Community)
    *   *What it does:* Manage Linear issues, sprints, and projects via chat.
    *   *Maturity:* Production.
    *   *Map:* **Project Management**. Sync "Audit Findings" directly to an engineering backlog.
*   **`mixpanel-mcp`** (Conceptual/Custom)
    *   *What it does:* Would allow querying Mixpanel for user behavior data.
    *   *Maturity:* Non-existent (Build opportunity).
    *   *Map:* **Analytics**.

### Category 3: Workflow Automation
*   **`vercel-mcp`** (Community)
    *   *What it does:* Manage Vercel deployments, domains, and environment variables.
    *   *Maturity:* Production.
    *   *Map:* **Deployment**. "Claude, deploy the latest changes to the staging environment."
*   **`slack-mcp`** (Community)
    *   *What it does:* Post messages, reply to threads, and fetch history in Slack.
    *   *Maturity:* Production.
    *   *Map:* **Notifications**. Send "Audit Complete" alerts to the operator's Slack.
*   **`resend-mcp`** (Community)
    *   *What it does:* Send and manage transactional emails via Resend.com.
    *   *Maturity:* Production.
    *   *Map:* **Delivery**. The agent can autonomously "Resend the audit to the client" if they didn't receive it.
*   **`pagerduty-mcp`** (Official)
    *   *What it does:* Manage incidents, services, and schedules in PagerDuty.
    *   *Maturity:* Production.
    *   *Map:* **Reliability**. High-severity audit pipeline failures can trigger an on-call alert.
*   **`sentry-mcp`** (Official)
    *   *What it does:* Query issues, stack traces, and performance metrics from Sentry.
    *   *Maturity:* Production.
    *   *Map:* **Monitoring**. "Claude, analyze the latest Sentry errors and suggest fixes."
*   **`scheduler-mcp`** (Community)
    *   *What it does:* Schedule shell commands, API calls, or AI tasks using cron syntax.
    *   *Maturity:* Community.
    *   *Map:* **Tasks**. "Run the competitor analysis every Sunday at 9 AM."

---

## Top 5 Highest-Leverage Additions (Updated)

1.  **`vercel-mcp` (Workflow Automation):** Closes the loop from "Write Code" to "Live Application" without leaving the terminal.
2.  **`microsoft/playwright-mcp` (Dev Acceleration):** Essential for "Autonomous Verification." The agent can now *see* and *test* the UI it builds.
3.  **`hubspot-mcp` (Product Integration):** Elevates Pare from a "tool" to a "business engine" by connecting to the CRM source of truth.
4.  **`google-analytics-mcp` (Product Integration):** Adds "Hard Evidence" to your audits by pulling real traffic stats into the analysis.
5.  **`sentry-mcp` (Workflow Automation):** Provides deep visibility into *production* errors, allowing the agent to debug issues it can't reproduce locally.
