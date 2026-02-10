# Pare Engine: Unified Build Plan

> Synthesized from analysis-1 through analysis-7. Every tool/feature that appeared in research is accounted for — either in the Clone List, Skip List, or Null-Space Features. Nothing silently dropped.

---

## 1. Clone List (Ranked)

Ranking formula: **(revenue displacement × client visibility) / build effort**

Features that share a build path are grouped. "Standalone" means it produces value independently. "Compound" means it needs upstream modules.

### Rank 1 — AI Visibility Monitor
- **Replaces:** Otterly.ai ($29–$489/mo), AthenaHQ ($295+/mo)
- **Build path:** Vercel AI SDK → Perplexity Sonar + OpenAI Responses API + Gemini w/ grounding → `generateObject()` with Zod schema (mentioned: bool, rank: number, sentiment: enum, cited_text: string) → store in `monitoringResults` table
- **Effort:** Weekend project (2–3 days)
- **Type:** Standalone — this is the atomic unit; everything else reads from it
- **Notes:** All 7 files identify this as the #1 target. The "Share of Voice" metric, "Sentiment Analysis," and "Competitor Comparison" are all computed views on this same data — not separate builds.

### Rank 2 — Competitor Share of Voice Matrix
- **Replaces:** Otterly "Share of Voice" feature, ZipTie competitor tracking
- **Build path:** Run Rank 1 for client + 3 competitors across 10–25 queries → aggregate mention counts → percentage = mentions / total queries
- **Effort:** Weekend project (free — it's a loop + aggregation on Rank 1 data)
- **Type:** Compound (needs Rank 1)
- **Notes:** "FEAR sells better than features" — this is the single most effective slide in the sales deck.

### Rank 3 — Schema Gap Detector
- **Replaces:** Geoptie schema audit, Merkle Schema Generator, manual Google Rich Results testing
- **Build path:** Firecrawl (scrape HTML) → Cheerio/regex extract `<script type="application/ld+json">` → Zod validate against required types (LocalBusiness, Service, FAQ, Product) → report missing/invalid types
- **Effort:** Weekend project (1–2 days)
- **Type:** Standalone
- **Notes:** 6/7 files mention this. The "scare tactic" that sells the sprint. Pure parsing, no LLM needed.

### Rank 4 — llms.txt + robots.txt Generator
- **Replaces:** Nothing (no competitor does this) — but it's the fastest "we did something" win
- **Build path:** Firecrawl (site content) → LLM summarize business/services/pricing → format as Markdown per llms.txt spec → also generate robots.txt AI crawler rules
- **Effort:** Weekend project (1 day)
- **Type:** Standalone
- **Notes:** 4/7 files mention. Instant deliverable. Client gets a file to upload immediately.

### Rank 5 — Branded Audit PDF (9-Page Report)
- **Replaces:** Vendasta Snapshot Report (lead gen), AgencyAnalytics reporting ($12–$1,000/mo), 5–10 hours/month of manual reporting per client
- **Build path:** HTML/CSS templates (Tailwind + brand colors) → inject audit data via template literals → Puppeteer `page.pdf()` → branded A4 PDF
- **Effort:** 1-week sprint (design + 9 page templates + edge case handling)
- **Type:** Compound (needs Ranks 1, 3, and scoring engine)
- **Notes:** All 7 files describe this as "the product." The report IS the revenue — everything upstream feeds it.

### Rank 6 — JSON-LD Schema Generator ("Fix It" Engine)
- **Replaces:** Manual dev work ($500–$2,000 per client), Merkle/TechnicalSEO tools
- **Build path:** Client business data (from audit intake form) + Firecrawl content → LLM `generateObject()` with Zod schema matching LocalBusiness/Service/FAQ spec → output valid JSON-LD ready to paste
- **Effort:** Weekend project (2–3 days)
- **Type:** Compound (needs site crawl data from Firecrawl)
- **Notes:** 6/7 files identify this as THE differentiator. Bridges the "diagnosis vs cure" gap.

### Rank 7 — Content Answer-First Auditor
- **Replaces:** Geoptie content scoring, SurferSEO/Frase basic analysis ($49–$199/mo)
- **Build path:** Firecrawl (extract page markdown) → Claude Haiku `generateObject()`: "Does this page answer the primary question in the first paragraph? Score 1–10 on: answer-first format, FAQ presence, stats density, author signals"
- **Effort:** Weekend project (2 days)
- **Type:** Compound (needs Firecrawl crawl data)
- **Notes:** 5/7 files mention. Per-page scoring averaged across site. Replaces naive string-length checks in current `content.ts`.

### Rank 8 — "Why You Lost" Analyzer
- **Replaces:** ZipTie optimization advice, manual competitor analysis
- **Build path:** Firecrawl (competitor URL) + Firecrawl (client URL) → LLM compare: "Why would an AI recommend Business A over Business B? Be specific."
- **Effort:** Weekend project (1–2 days)
- **Type:** Compound (needs Firecrawl + AI Visibility data)
- **Notes:** Directly justifies the sprint purchase. Client sees exactly what the competitor does better.

### Rank 9 — Review Sentiment Summarizer
- **Replaces:** BirdEye/Podium lite ($199+/mo), BrightLocal review monitoring
- **Build path:** Google Places API (fetch last 50 reviews by Place ID) → LLM summarize "What people love" vs "What people hate" → "Voice of Customer" section in report
- **Effort:** Weekend project (1–2 days)
- **Type:** Standalone (only needs Google Places API key)
- **Notes:** 5/7 files mention. Feeds into both the report and the "AI Accuracy" pillar (what AI says vs what customers say).

### Rank 10 — FAQ Generator
- **Replaces:** Manual content strategy work, AnswerThePublic ($99/mo)
- **Build path:** Audit findings (missing questions) + vertical context → LLM generate Q&A pairs → output as HTML or Markdown ready to paste
- **Effort:** Weekend project (1 day)
- **Type:** Compound (needs audit results identifying content gaps)

### Rank 11 — Local AI Grid
- **Replaces:** BrightLocal Grid Tracker, LocalFalcon ($24–$74/mo)
- **Build path:** Run Rank 1 query loop across 5–9 neighboring zip codes (modify prompt: "near [Zip]") → visualize as heatmap grid
- **Effort:** Weekend project (2 days for the visualization)
- **Type:** Compound (needs Rank 1)
- **Notes:** Visual proof of "invisible zones." Powerful in sales presentations.

### Rank 12 — Technical GEO Audit
- **Replaces:** ZipTie technical checks ($99–$799/mo), Screaming Frog lite
- **Build path:** Fetch `robots.txt` (check for GPTBot/ClaudeBot/Googlebot rules) + check for `llms.txt` + Firecrawl (sitemap detection, mobile rendering, SSL) + Lighthouse API (performance score)
- **Effort:** Weekend project (2–3 days)
- **Type:** Standalone
- **Notes:** Foundational — feeds the "Technical Readiness" pillar (10 points).

### Rank 13 — Mini-Audit / Snapshot Report (1-Page Lead Magnet)
- **Replaces:** Vendasta Snapshot Report (lead gen tool)
- **Build path:** Stripped-down audit (1 LLM query + schema check + Lighthouse score) → single-page HTML template → Puppeteer PDF
- **Effort:** Weekend project (2 days — IF the full audit pipeline exists)
- **Type:** Compound (simplified version of Rank 5)
- **Notes:** The "free taste" that converts prospects. Must exist before the marketing site launches.

### Rank 14 — Citation Consistency Checker
- **Replaces:** Moz Local, WhiteSpark, BrightLocal citation audit ($39–$90/mo)
- **Build path:** Google Places API (canonical NAP) + SerpApi or DataForSEO (search "business name + phone") → compare NAP across top 20 results → flag inconsistencies
- **Effort:** 1-week sprint (data cleaning is the hard part)
- **Type:** Standalone
- **Notes:** 4/7 files mention. Important but messy. The audit portion is feasible; citation *building* is deferred.

### Rank 15 — Content Optimizer / Rewriter
- **Replaces:** Jasper/Copy.ai content generation ($49+/mo), manual rewriting
- **Build path:** Firecrawl (weak page content) → LLM rewrite with directive: "Rewrite this in answer-first format, add statistics, include FAQ section" → output optimized markdown
- **Effort:** 1-week sprint (prompt engineering + quality assurance)
- **Type:** Compound (needs content audit results to know what to fix)

### Rank 16 — Indexing Check
- **Replaces:** ZipTie "Is my URL indexed?" feature
- **Build path:** AI SDK query: "Summarize this URL: [url]" → if response is accurate = indexed, if hallucinated = not indexed
- **Effort:** Weekend project (trivial — 1 day)
- **Type:** Compound (needs Rank 1 infrastructure)

### Rank 17 — Keyword-to-Question Converter
- **Replaces:** AnswerThePublic ($99/mo)
- **Build path:** LLM prompt: "Generate 20 questions a consumer would ask an AI about [keyword] in [city]"
- **Effort:** Weekend project (half day)
- **Type:** Standalone
- **Notes:** Useful for seeding the prompt library (`promptLibrary` table). Low revenue displacement but builds the query set.

### Rank 18 — Reporting Dashboard (Operator Admin)
- **Replaces:** AgencyAnalytics ($12–$1,000/mo)
- **Build path:** Next.js `/admin/*` routes → read from DB → display historical scores, client list, audit status
- **Effort:** 1-week sprint
- **Type:** Compound (needs database populated by audit pipeline)
- **Notes:** 3/7 files mention. Explicitly scoped as operator-only (not client-facing) per CLAUDE.md.

---

## 2. Skip List

Tools/features that appeared in research but should NOT be built.

| Tool/Feature | Appeared In | Rationale for Skipping |
|---|---|---|
| **GoHighLevel clone** | Files 1–7 | Unanimous: "Don't touch." Massive surface area. No technical moat to exploit — the moat is feature breadth + distribution. Integrate with it if clients use it. |
| **Semrush/Ahrefs keyword database** | Files 1, 4 | Proprietary crawling at planetary scale. Cannot replicate. Buy their data via API ($0.01/query from DataForSEO) when needed. |
| **Vendasta marketplace** | Files 1, 7 | Business development moat, not tech. The Snapshot Report is worth cloning (see Rank 13); the white-label marketplace is not. |
| **Yext listings management** | File 4 | Moat is direct API partnerships with publishers (Yelp, Apple Maps, etc.). Years of biz dev. Citation *auditing* is feasible; citation *syncing* is not. |
| **Duda website builder** | File 1 | "Don't build a site builder." Correct. |
| **Nightwatch rank tracking** | Files 6, 7 | Traditional SERP rank tracking at scale requires distributed proxy networks. Commoditized, low margin, high infra cost. Use DataForSEO API for the 5% of SERP data we actually need. |
| **Goodie AI attribution** | File 6 | Attribution modeling is complex (multi-touch, cross-channel). Low relevance to solo GEO consulting. |
| **Profound enterprise workflows** | File 6 | Enterprise sales/process moat. Not relevant to SMB solo consulting. |
| **Full BrightLocal citation network** | Files 1–6 | The *fulfillment* network (submitting to 100+ directories) requires ops teams and aggregator partnerships. We build the *audit* (Rank 14), not the fulfillment. |
| **Social Proof Monitor (Mention.com clone)** | File 4 | Social scraping is brittle, low signal-to-noise, and not relevant to AI visibility. Brand mentions in AI responses (Rank 1) are the metric that matters. |
| **Meeting Intelligence (Fireflies clone)** | File 4 | Interesting but orthogonal to GEO consulting. Adds scope without adding to the audit→fix→verify loop. Revisit only if client calls become a bottleneck. |
| **SEMrush "Keyword Magic" clone** | File 1 | "Too commoditized. Focus on Questions, not Keywords." Correct. The Keyword→Question converter (Rank 17) captures the useful slice. |
| **Client-facing dashboard** | CLAUDE.md | Explicitly deferred. Clients get PDFs + Loom walkthroughs until 10+ retainer clients. |
| **Batch prospecting tools** | CLAUDE.md | Deferred per constitution. |
| **Multi-tenant architecture** | CLAUDE.md | Deferred. Single operator for now. |

---

## 3. Null-Space Features (Differentiation Plays)

These are opportunities where **no competitor currently delivers**. Ranked by defensibility and compound value.

### NS-1: The Implementation Engine ("Fix It" Button)
- **Mentioned in:** All 7 files (the #1 consensus finding)
- **What it is:** Don't just report "Missing Schema" — generate the exact JSON-LD file. Don't just say "Content isn't answer-first" — output the rewritten page. Don't just flag "No llms.txt" — generate it.
- **Why it's defensible:** Every monitoring tool would need to fundamentally change their product model (from SaaS dashboard to consulting OS). Otterly's entire UX assumes you'll go fix things yourself.
- **Compound value:** HIGH. Every audit finding becomes a deliverable. Turns a $750 audit into a $3,000 sprint with near-zero additional effort.
- **Implementation:** Ranks 4, 6, 10, 15 in the Clone List are all components of this engine.

### NS-2: Audit → Fix → Verify Loop
- **Mentioned in:** Files 2, 5, 6, 7
- **What it is:** Run the audit. Apply the fixes. Run the audit again *immediately*. Show the before/after delta on the same page of the report.
- **Why it's defensible:** Requires owning the full pipeline (monitor + fix + re-monitor). Tools that only monitor can't do this. Tools that only fix can't prove it worked.
- **Compound value:** VERY HIGH. This is the "proof of ROI" that justifies retainers. Clients see "Score: 23 → 67 after Sprint 1."

### NS-3: Vertical-Specific Intelligence
- **Mentioned in:** Files 3, 6
- **What it is:** Hard-coded industry patterns. "For Dentists: AI engines weight 'emergency services' and 'sedation dentistry' — you're missing both." Not generic "improve E-E-A-T" advice.
- **Why it's defensible:** Requires accumulated consulting experience per vertical. Gets better with each client in that vertical. A generic tool can't do this without the domain knowledge.
- **Compound value:** HIGH. Feeds the prompt library (`promptLibrary` table), which improves every audit for that vertical. Network effect within verticals.

### NS-4: Competitor-Centric Narrative Reporting
- **Mentioned in:** Files 2, 4, 6
- **What it is:** Every metric is relative. Not "Your score is 34." Instead: "Dr. Smith is #1 (score 78). You are #4 (score 34). Here is exactly why Dr. Smith wins." Reports follow Fear → Hope → Proof arc.
- **Why it's defensible:** Requires both competitive data AND narrative generation. Dashboard tools show charts; they don't tell stories. This compounds with the PDF generation engine.
- **Compound value:** MODERATE. Makes the sales process dramatically more effective but doesn't create technical lock-in.

### NS-5: Causal Score Attribution
- **Mentioned in:** Files 1, 2
- **What it is:** "Your score dropped 12 points because Perplexity surfaced a negative Yelp review from March" or "Score rose 8 points after we added FAQ schema."
- **Why it's defensible:** Requires storing granular monitoring history + correlating with implementation events. Monitoring-only tools can't attribute causation because they don't track what was changed.
- **Compound value:** HIGH. Makes the retainer indispensable — the client sees *why* things change, not just *that* they changed.

### NS-6: Agentic Commerce Readiness
- **Mentioned in:** Files 1, 3, 4, 7
- **What it is:** Check if a business is ready for AI shopping agents — Product/Offer schema, pricing transparency, API accessibility, UCP/ACP protocol compliance.
- **Why it's defensible:** Latent demand — consultants don't know they need this yet. First mover advantage in defining the audit criteria.
- **Compound value:** MODERATE. Strong upsell for e-commerce clients. Limited value for service businesses (dentists, HVAC). Only compounds if e-commerce becomes a significant client segment.

### NS-7: Usage-Based Economics (Self-Hosted Engine)
- **Mentioned in:** Files 5, 6
- **What it is:** Pare is an engine you own, not a SaaS seat. Marginal cost per audit is ~$2–5 in API credits. Sell the audit for $500–$750. No $489/mo Otterly subscription eating into margins.
- **Why it's defensible:** SaaS competitors can't match unit economics of a self-hosted tool without cannibalizing their own revenue model.
- **Compound value:** HIGH. Every additional client is nearly pure margin after the engine is built.

---

## 4. Build Sequence

### Phase 1: Foundation (Weeks 1–2)
*What must exist for everything else to work.*

| # | Build Item | What It Unlocks |
|---|---|---|
| 1a | **Core types & DB schema** — Finalize `AuditResult`, `ScoringCriteria`, `MonitoringSnapshot` types in `packages/core`. Fix scoring weights to 30/30/15/10/15. | Every downstream module imports from here. |
| 1b | **Firecrawl integration** — Replace stub `site-crawler` with Firecrawl `map()` + `crawl()`. Extract markdown + HTML + metadata. | Site data for all analysis modules. |
| 1c | **AI SDK multi-provider querying** — Build the `checkVisibility(brand, query, provider)` primitive using Vercel AI SDK. Perplexity Sonar + OpenAI Responses API + Gemini. Use `Promise.allSettled()`. | The atomic unit of AI monitoring. |
| 1d | **Environment & config** — Zod-validated config for all API keys (Firecrawl, OpenAI, Anthropic, Google, Perplexity). No raw `process.env`. | Safe, typed config everywhere. |

**Exit criteria:** `pnpm audit:run --domain example.com` produces a JSON blob with crawl data + AI visibility results stored in the database.

---

### Phase 2: Quick Wins (Weeks 3–4)
*Highest client-visible value. "Show this in a sales call" features.*

| # | Build Item | Clone Rank | What It Delivers |
|---|---|---|---|
| 2a | **AI Visibility Score + Share of Voice** | Rank 1 + 2 | "You appear in 1/3 AI engines. Your competitor appears in 3/3." |
| 2b | **Schema Gap Detector** | Rank 3 | "You are missing LocalBusiness, FAQ, and Service schema." |
| 2c | **Technical GEO Audit** | Rank 12 | "GPTBot is blocked in robots.txt. No llms.txt. No sitemap." |
| 2d | **Review Sentiment Summarizer** | Rank 9 | "Customers love your staff but hate your wait times." |
| 2e | **5-Pillar Scoring Engine** | — | Composite 0–100 score with letter grade. All pillar scores feed from 2a–2d. |
| 2f | **9-Page Audit PDF** | Rank 5 | The $750 deliverable. HTML templates + Puppeteer. |
| 2g | **Mini-Audit PDF (1-Page)** | Rank 13 | The free lead magnet for the website. |

**Exit criteria:** `pnpm audit:full --domain example.com` produces a branded 9-page PDF. `pnpm audit:mini --domain example.com` produces a 1-page teaser. Both are sales-ready.

---

### Phase 3: Moat (Weeks 5–8)
*Null-space features and compound integrations that create switching costs.*

| # | Build Item | Null-Space | What It Delivers |
|---|---|---|---|
| 3a | **JSON-LD Schema Generator** (NS-1) | Implementation Engine | "Here is the exact code to paste into your site." |
| 3b | **llms.txt Generator** (NS-1) | Implementation Engine | Instant downloadable file. |
| 3c | **FAQ Generator** (NS-1) | Implementation Engine | "Here are 10 Q&A pairs for your sedation dentistry page." |
| 3d | **Content Answer-First Auditor** (Rank 7) | — | Per-page scoring: "This page buries the answer in paragraph 4." |
| 3e | **"Why You Lost" Analyzer** (Rank 8) | — | "Dr. Smith's site has FAQ schema and answer-first content. Yours doesn't." |
| 3f | **Competitor-Centric Reporting** (NS-4) | Narrative Reports | Rewrite all report sections to be relative, not absolute. |
| 3g | **Verify Loop** (NS-2) | Audit→Fix→Verify | Re-run audit post-implementation. Show before/after delta in report. |
| 3h | **Vertical Prompt Library** (NS-3) | Vertical Intelligence | Seed 3 verticals: Dental, HVAC, Legal. Industry-specific query sets + recommendations. |

**Exit criteria:** Full audit→fix→verify cycle works end-to-end. Client receives: audit PDF + fix files (JSON-LD, llms.txt, FAQ content) + verification PDF showing score improvement.

---

### Phase 4: Scale (Weeks 9–12+)
*Automations and scheduled jobs that remove you from the loop.*

| # | Build Item | What It Delivers |
|---|---|---|
| 4a | **Inngest scheduled monitoring** | Weekly cron runs AI visibility checks. Stores historical snapshots. |
| 4b | **Score delta alerts** (NS-5: Causal Attribution) | Email via Resend: "Score dropped 12 pts — Perplexity found a new negative review." |
| 4c | **Monthly trend report PDF** (2-page) | Auto-generated, auto-emailed. The retainer justification artifact. |
| 4d | **Operator admin dashboard** (`/admin/*`) | Next.js panel: client list, audit history, score trends, one-click re-audit. |
| 4e | **Content Optimizer / Rewriter** (Rank 15) | LLM rewrites weak pages into answer-first format. Full sprint automation. |
| 4f | **Local AI Grid** (Rank 11) | Geo-grid visualization of visibility by zip code. |
| 4g | **Citation Consistency Checker** (Rank 14) | NAP audit across top 20 directories. |
| 4h | **Agentic Commerce Readiness** (NS-6) | Product schema + pricing transparency + agent-readiness check. E-commerce upsell. |
| 4i | **Stripe integration** | Payment collection for audits and retainers. |
| 4j | **Public website** (`apps/web`) | Marketing site with embedded mini-audit form. |

**Exit criteria:** Retainer clients receive automated weekly monitoring + monthly reports without operator intervention. New prospects can trigger a mini-audit from the website and pay for a full audit via Stripe.

---

## 5. Conflict Resolution

### SERP API: DataForSEO vs SerpApi vs OpenAI web_search

- **Files 4, 5** recommend DataForSEO (dedicated "AI Overview" endpoint, $0.01/query)
- **Files 1, 2** recommend SerpApi (reliable, `google_ai_overview` engine)
- **CLAUDE.md** suggests OpenAI web_search may suffice, making SerpApi optional

**Resolution: Use OpenAI Responses API with `web_search` as primary. Add DataForSEO as secondary for Google AI Overview specific data.**

Rationale: OpenAI's Responses API with built-in web search is already in the stack (CLAUDE.md Platform Targets). It handles the "what does the AI say" query natively — no separate SERP API needed for that use case. DataForSEO is added specifically for the Google AI Overview endpoint, which captures structured snippet data that OpenAI's API doesn't expose. SerpApi is redundant if we have both. This avoids paying three SERP providers.

### LLM for Parsing: GPT-4o-mini vs Claude Haiku

- **Files 2, 3, 6** recommend GPT-4o-mini for cheap parsing/classification
- **CLAUDE.md scoring rules** mandate Claude Haiku via AI SDK `generateObject()` for sentiment analysis

**Resolution: Claude Haiku for all structured analysis. No GPT-4o-mini for parsing.**

Rationale: CLAUDE.md is the project constitution. It mandates Claude structured outputs with Zod schemas for all LLM parsing. Using two different models for parsing creates inconsistency and doubles the provider configuration. Haiku is comparably priced (~$0.25/MTok input) and natively supports structured outputs via the AI SDK. One model, one pattern.

### Phase Ordering: Crawl-First vs Market-Intelligence-First

- **Files 5, 7** recommend building the crawler first (site data is the foundation)
- **File 4** recommends market intelligence first ("the value is in showing market invisibility, not crawling the client's site")

**Resolution: Build both in Phase 1, but the AI visibility query is the higher-priority primitive.**

Rationale: File 4 is right that "showing the client they're invisible" is the highest-leverage sales move. But the crawler is needed within days for schema extraction and content analysis. They're both Phase 1 foundations. The distinction is: if you had to demo *one thing* in week 1, it's the AI visibility check (1c), not the site crawl (1b). But both ship in the same phase.

### Crawling Tool: Firecrawl vs Crawl4AI

- **CLAUDE.md** lists both as options: "Firecrawl API (or Crawl4AI)"
- **All 7 files** reference Firecrawl exclusively

**Resolution: Firecrawl.**

Rationale: Unanimous research consensus. Firecrawl has the `map()` + `crawl()` API pattern already documented in the codebase rules. Crawl4AI is the fallback only if Firecrawl's pricing becomes prohibitive at scale (it won't at <50 clients).

### Report Generation: React-PDF vs HTML+Puppeteer

- **No conflict.** All 7 files + CLAUDE.md agree: HTML+Puppeteer. React-PDF is explicitly called "the #1 time-waster risk." The existing `packages/report-generator` uses React-PDF and must be migrated.

### Citation Data Source: SerpApi vs DataForSEO vs Apify

- **File 1** uses SerpApi (Google Search for phone number)
- **File 4** uses Apify Google Maps Scraper + DataForSEO
- **File 7** uses Google Custom Search API / Serper.dev

**Resolution: Google Places API (canonical NAP) + DataForSEO (directory search).**

Rationale: Google Places API is the authoritative source for the business's own NAP data. DataForSEO's organic search endpoint can find the business across directories for ~$0.01/query. Apify adds a scraping dependency we don't need. Serper.dev is yet another SERP provider — DataForSEO already covers it.

---

## Appendix: Feature → File Traceability

Every feature that appeared in any analysis file is accounted for below.

| Feature | Files Mentioning | Disposition |
|---|---|---|
| AI Visibility Monitor | 1,2,3,4,5,6,7 | Clone Rank 1 |
| Share of Voice | 2,3,6,7 | Clone Rank 2 |
| Schema Gap Detector | 1,2,3,5,6,7 | Clone Rank 3 |
| llms.txt Generator | 3,5,6,7 | Clone Rank 4 |
| 9-Page Audit PDF | 1,2,3,4,5,6,7 | Clone Rank 5 |
| JSON-LD Schema Generator | 1,2,3,4,6,7 | Clone Rank 6 |
| Content Answer-First Auditor | 1,2,3,6,7 | Clone Rank 7 |
| "Why You Lost" Analyzer | 1,2 | Clone Rank 8 |
| Review Sentiment Summarizer | 1,2,3,4,7 | Clone Rank 9 |
| FAQ Generator | 3,6 | Clone Rank 10 |
| Local AI Grid | 1,2 | Clone Rank 11 |
| Technical GEO Audit | 2,5,6,7 | Clone Rank 12 |
| Mini-Audit / Snapshot Report | 1,2,3 | Clone Rank 13 |
| Citation Consistency Checker | 1,2,4,7 | Clone Rank 14 |
| Content Optimizer / Rewriter | 2,3,5,6,7 | Clone Rank 15 |
| Indexing Check | 2,5,6 | Clone Rank 16 |
| Keyword→Question Converter | 4,7 | Clone Rank 17 |
| Reporting Dashboard | 4,6,7 | Clone Rank 18 |
| GoHighLevel clone | 1,2,3,4,5,6,7 | Skip List |
| Semrush/Ahrefs data | 1,4 | Skip List |
| Vendasta marketplace | 1,7 | Skip List |
| Yext listings sync | 4 | Skip List |
| Duda site builder | 1 | Skip List |
| Nightwatch rank tracking | 6,7 | Skip List |
| Goodie AI attribution | 6 | Skip List |
| Profound enterprise | 6 | Skip List |
| BrightLocal fulfillment | 1,2,3,4,5,6 | Skip List |
| Social Proof Monitor | 4 | Skip List |
| Meeting Intelligence | 4 | Skip List |
| Keyword Magic (SEMrush) | 1 | Skip List |
| Implementation Engine | 1,2,3,4,5,6,7 | Null-Space NS-1 |
| Audit→Fix→Verify Loop | 2,5,6,7 | Null-Space NS-2 |
| Vertical Intelligence | 3,6 | Null-Space NS-3 |
| Competitor-Centric Reports | 2,4,6 | Null-Space NS-4 |
| Causal Score Attribution | 1,2 | Null-Space NS-5 |
| Agentic Commerce Readiness | 1,3,4,7 | Null-Space NS-6 |
| Usage-Based Economics | 5,6 | Null-Space NS-7 |
| Sentiment Analysis | 2,3,6 | Subsumed into Rank 1 (it's a field on the visibility result) |
| Competitor Comparison | 1,2,3,6,7 | Subsumed into Rank 2 + Rank 8 |
| Agentic Commerce Check | 2,7 | Clone Rank → Phase 4h |
| Site Health Check | 4,7 | Subsumed into Rank 12 (Technical GEO Audit) |
