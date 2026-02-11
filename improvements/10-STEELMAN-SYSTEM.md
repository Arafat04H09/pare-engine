# The Steelman System: From "Audit Tool" to "Revenue Engine"

## 1. Latent Intent Analysis

**Surface Request:** "What features are missing? What are competitors doing?"
**Latent Intent:** "How do I maximize revenue per hour as a solo operator? How do I automate the 'Sales' and 'Retention' phases so I can focus purely on high-value delivery?"

The current `pare-engine` is a powerful **Delivery System** (Audit -> Fix). However, it lacks the **Acquisition System** (finding and closing clients) and the **Retention System** (keeping them forever without manual work).

**The Core Problem:**
A solo operator cannot scale by selling "hours." You must sell "outcomes" and "assets."
*   **Current Model:** Sell Audit ($500) -> Sell Sprint ($3,000) -> Sell Monitoring ($1,000/mo).
*   **Friction:** You have to manually find the client, manually convince them, and manually monitor them.
*   **Goal:** The system should find the client, prove the value automatically, and provide a "stick" feature that makes leaving painful.

## 2. The Null Space (Market Gaps)

We researched the market (Local Falcon, BrightLocal, Otterly, ZipTie). Here is what they are missing:

| The Gap | Description | The Opportunity |
| :--- | :--- | :--- |
| **The "Geo-Grid" Gap** | Tools track *Rankings* on a map. No tool tracks *AI Citations* on a map. "Does ChatGPT recommend me to a user in North Austin vs. South Austin?" | **Feature: "The AI Grid"** - A 5x5 mile scan of AI responses. |
| **The "Asset" Gap** | Consultants sell advice. Clients buy *things*. Implementing Schema is invisible. | **Feature: "The 24/7 Agent"** - A chatbot asset that *uses* the schema we built. If they fire you, the bot breaks. |
| **The "Trust" Gap** | "SEO is a scam." Static PDFs don't prove anything to a skeptic. | **Feature: "The Mirror"** - A live, interactive simulator where they see their competitor win *now*. |
| **The "Context" Gap** | Generic audits don't know the business context (e.g., "We only do Invisalign"). | **Feature: "Vertical Packs"** - Pre-loaded questions/strategies for specific niches. |

## 3. The Competitor Matrix

| Feature | Local Falcon / BrightLocal | ZipTie / Otterly | **Pare Engine (Steelman)** |
| :--- | :--- | :--- | :--- |
| **Core Metric** | Google Rank (1-20) | AI Visibility % | **Revenue at Risk** |
| **Geography** | 5-mile Grid (Rank) | Global / Single City | **5-mile Grid (Citations)** |
| **Deliverable** | Report / Dashboard | Report / Dashboard | **Fixed Assets (Code, Agent, Schema)** |
| **Sales Motion** | "Here is your data" | "Here is your problem" | **"Here is the fix, ready to deploy"** |
| **Retention** | Monthly Report | Monthly Report | **The "24/7 Agent" (Active Asset)** |

## 4. The Steelman Specifications

To set the solo operator apart, we add three "Super-Weapons" to the existing Roadmap.

### Weapon 1: "The AI Grid" (Hyper-Local Prospecting)
**Goal:** Prove that "Global Visibility" is a lie. You might be visible in Downtown but invisible in the Suburbs.
**How it works:**
1.  **Input:** Center address + Radius (e.g., 10 miles).
2.  **Process:** The system generates 25 lat/long coordinates in a grid.
3.  **Query:** It asks ChatGPT/Perplexity *from those specific coordinates* (using location overrides in API or prompt context: "I am in North Austin...").
4.  **Output:** A Heatmap. Green = You are recommended. Red = Competitor is recommended.
**Sales Pitch:** "Dr. Smith, you own Downtown, but Dr. Jones owns the wealthy suburbs. Let's fix that."

### Weapon 2: "The Mirror" (Live Sales Simulator)
**Goal:** Close the deal in 30 seconds without saying a word.
**How it works:**
1.  **UI:** A clean, "Google-like" search bar on your tablet/laptop.
2.  **Action:** Hand the device to the client. "Search for 'best [service] in [city]'."
3.  **Backend:** The system runs the query live against ChatGPT/Perplexity.
4.  **Display:** It highlights their Competitor in Red and marks them as "Missing."
5.  **The Kicker:** A "Fix It" toggle. When clicked, it shows a *simulated* response of what it *could* look like if they hire you.
**Sales Pitch:** "This is what your customers see right now. Want to see what they *could* see?"

### Weapon 3: "The 24/7 Agent" (The Retention Lock)
**Goal:** Make the retainer "uncuttable."
**How it works:**
1.  **The Setup:** During the Sprint, we build perfect structured data (FAQs, Services, Pricing).
2.  **The Asset:** We deploy a simple, white-label AI Chatbot on their site (using Vercel AI SDK + their own data).
3.  **The Hook:** This bot is *powered* by the Knowledge Graph we maintain.
4.  **The Lock:** If they cancel the retainer, we stop updating the Knowledge Graph. The bot becomes stale/dumb.
**Sales Pitch:** "I don't just fix your SEO. I install a 24/7 receptionist that answers questions perfectly because it reads the data I structure."

## 5. UI/UX Placement

### A. The "Prospecting" Tab (New)
*   **Location:** `/admin/prospecting`
*   **Features:**
    *   **Grid Map:** Interactive Leaflet.js map. Click to scan a neighborhood.
    *   **Hot Leads:** List of businesses in the "Red Zones" (high revenue, low AI visibility).
    *   **One-Click Audit:** "Send Mini-Audit to this lead."

### B. The "Simulation" Mode (New)
*   **Location:** `/admin/simulator` (or a public hidden URL like `demo.pare.com/sim/[id]`)
*   **Features:**
    *   **Minimalist UI:** Just a search bar and results. No "Admin" clutter.
    *   **Toggle:** "Current Reality" vs. "Future State."

### C. The "Agent" Manager (New)
*   **Location:** `/admin/clients/[id]/agent`
*   **Features:**
    *   **Chat Logs:** See what customers are asking the bot.
    *   **Knowledge Base:** The "Source of Truth" (synced from the Audit findings).
    *   **Customization:** Brand colors, bot name.

## 6. The Income Strategy (The "Steelman" P&L)

This system changes the math for the solo operator.

**Phase 1: The "Grid" Attack (Acquisition)**
*   Run a Grid Scan on a wealthy neighborhood.
*   Identify the 5 dentists who are invisible in their own zip code.
*   Send a "Neighborhood Watch" report: "Your neighbor Dr. Jones is stealing your traffic."
*   **Conversion Rate:** High (Fear of missing out locally).

**Phase 2: The "Mirror" Close (Sales)**
*   Meeting: Show the "Mirror."
*   Price: $3,000 Sprint (Audit + Fix + Agent Setup).

**Phase 3: The "Agent" Lock (Retention)**
*   Price: $1,000/mo.
*   Includes:
    *   Monthly Grid Scans (Defense).
    *   Agent Hosting & Updates (Asset).
    *   Competitor Monitoring.
*   **Churn Rate:** Near Zero (Cutting the retainer kills the bot).

## 7. Implementation Roadmap

1.  **Grid Scan (P1):**
    *   Tech: Modify `query-engines.ts` to accept `lat/long`. Use `leaflet` for the UI.
    *   Effort: Medium.

2.  **The Mirror (P2):**
    *   Tech: Simple frontend wrapper around existing `query` logic.
    *   Effort: Low.

3.  **The Agent (P3):**
    *   Tech: New `apps/agent-widget` package. Simple RAG over the client's `json-ld`.
    *   Effort: High (but highest value).

---

**Summary:**
Don't just build a better report. Build a **Business Defense System**. The Grid finds them. The Mirror scares them. The Agent keeps them.
