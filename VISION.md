# VISION: Pare Engine — The AI-Native Consulting Operating System

> **This is a living document.** It declares intent and direction, not final specifications. Any pipeline stage — gap analysis, research, synthesis, or build — may update this document when real-world findings reveal better approaches. The vision evolves as we learn from running real audits, landing real clients, and discovering what actually works. Challenge anything here with evidence. The only things that don't change are the core thesis (audit → implement → verify) and the unified principles.

## Core Purpose

Pare Engine is an **AI-native consulting operating system** for Generative Engine Optimization (GEO). It is not an audit tool. It is not a monitoring dashboard. It is the workspace where a solo consultant manages every phase of the client lifecycle — from prospecting to delivery to retention — with AI as the strategic partner and a deep toolkit as the execution layer.

The consulting industry is broken: consultants spend 70% of their time on operations (research, reporting, document creation, scheduling) and 30% on what clients actually pay for (strategic advice and implementation). Pare inverts this ratio. The AI handles operations. The consultant handles relationships.

## The Thesis

**AI search is the largest channel shift since mobile.** When someone asks ChatGPT "best project management tool for remote teams" or Perplexity "employment lawyer in Dallas," the AI responds with 3-5 direct recommendations. If your business is not in that answer, it does not exist for that buyer. Organic CTR drops 61% when AI Overviews appear — but brands cited in AI responses earn 35% more organic clicks and 91% more paid clicks. Being visible in AI is not defensive. It is a multiplier.

**Nobody closes the loop.** The GEO tool market is flooded with monitoring dashboards ($29-$500/month) that show the problem but don't fix it. Content tools help write pages but don't measure AI impact. No platform connects diagnosis to remediation to re-measurement. Pare does. The audit-to-implement-to-verify loop is the product. Everything else is leverage around it.

**Mid-sized businesses are the ideal client.** Not local dentists who rely on word-of-mouth. Mid-sized companies ($5M-$100M revenue, 50-500 employees) whose customer acquisition is dominated by search-driven inbound. A B2B SaaS company spending $150K/month on content marketing that just lost 40% of its organic MQLs to AI search. A PE-backed healthcare group managing AI visibility across 20 locations. A fintech platform watching its comparison-query traffic evaporate. These businesses have the budget ($3-10K/month), the pain (their marketing channel is eroding), and the sophistication to understand the problem.

**"AI-native consulting operating system" is an unclaimed category.** The PSA (Professional Services Automation) market is $12-40B, but those tools manage operations — time tracking, billing, project management. They have no domain intelligence. The GEO tool market has 20+ monitoring dashboards, but none do implementation. Vertical SaaS grows at 32%/year vs 12% for horizontal. The closest analog is Fieldguide (AI-native platform for accounting audit/advisory) — it proves the model works in an adjacent vertical. Nobody has built it for GEO consulting. The term "AI-native consulting operating system" returns zero search results. This is greenfield.

## The Three Layers

Pare is built in three layers. Each layer is independently valuable. Together, they compound.

### Layer 1: Tools

Modular, composable capabilities. Each tool is a typed function: input in, output out. Tools can be called individually from the UI, chained into workflows, or orchestrated by the AI layer.

**Audit Tools** — Crawl sites (Firecrawl), query AI engines (ChatGPT, Perplexity, Gemini + expanding), analyze content/schema/technical/GBP, score across 5 pillars, generate branded PDF reports, deliver via email.

**Implementation Tools** — Generate JSON-LD schemas, optimize content for answer-first format, create FAQ pages, write llms.txt files, build remediation plans, generate proposals with pricing and timelines.

**Intelligence Tools** — Track share of voice across AI engines, monitor competitor citations, detect score drops, analyze review sentiment, scan for AI hallucinations about client businesses, audit adversarial brand resilience.

**Research Tools** — Web research (Gemini-powered), SERP analysis (Serper.dev), backlink/keyword data (DataForSEO), social monitoring, review scraping, AI crawler analytics.

**Novel Tools (Our IP)** — Agentic commerce readiness scoring, adversarial brand audits (red-team 4 attack vectors), persona-driven audit variants, citation normalization across providers, per-platform optimization roadmaps.

The tool ecosystem is the arsenal. It includes reverse-engineered capabilities from competitors (share of voice tracking, AI crawler analytics, prompt trending) plus novel tools no competitor has (adversarial audits, agentic commerce scoring, vertical-specific schema gap analysis for AI citation). Basic, medium, and complex — tiered by depth.

### Layer 2: Intelligence — The Cognitive Team

The intelligence layer is not one AI. It is a **cognitive team** — multiple models used for what each does best, coordinated through typed contracts. The architecture is model-agnostic: today's models will be replaced. The contracts between them will not.

#### The Three Roles

| Role | Responsibility | Model (Current) | Strength Used | Context Budget |
|------|---------------|-----------------|---------------|----------------|
| **Analyst** | Comprehend large datasets, produce structured briefings | Gemini 2.5 Pro | 1M+ token context, fast comprehension, grounded web search | Large — reads everything |
| **Strategist** | Reason over briefings, make decisions, orchestrate tools, converse with operator | Claude | Strong reasoning, judgment, structured outputs, tool use | Focused — reads briefings, acts on decisions |
| **Specialist** | Fast structured extraction (sentiment, schema parsing, content scoring) | Claude Haiku | Speed, cost efficiency, accurate structured outputs | Minimal — single-task extraction |

**The user always talks to Claude (the Strategist).** One voice, one relationship. The Analyst and Specialist work behind the scenes. The operator never needs to know which model did what.

#### How It Operates

**The Analyst reads. The Strategist decides. Tools execute.**

```
Raw Data (large)              → Analyst (comprehend + compress)  → Client Intelligence File (small)
  100 crawled pages               "Summarize this client's          { contentGaps: [...],
  50 AI engine responses           content quality, schema            schemaIssues: [...],
  3 months of monitoring           health, and competitive            competitorPosition: {...},
  Competitor audit data            position"                          keyFindings: [...],
                                                                     recommendedActions: [...] }
                                                                            ↓
                                                                   Strategist (decide + act)
                                                                     "Based on this briefing,
                                                                      prioritize JSON-LD for
                                                                      service pages. Here's
                                                                      the sprint plan..."
                                                                            ↓
                                                                   Tools (execute)
                                                                     generate-jsonld()
                                                                     content-optimizer()
                                                                     generate-proposal()
```

#### Client Intelligence Files

Every client gets a continuously updated **intelligence file** — a structured document that the Analyst maintains and the Strategist reads. This is the tiered context mechanism.

```
Client Intelligence File (maintained by Analyst, consumed by Strategist)
├── businessProfile        — What this company does, vertical, size, contacts
├── auditHistory[]         — Score trends, pillar breakdowns over time
├── contentInventory       — Page-by-page content quality summary
├── schemaHealth           — What JSON-LD exists, what's missing
├── competitorLandscape    — Who's winning, who's losing, why
├── aiVisibility           — Share of voice per platform per query category
├── activeEngagement       — Sprint status, deliverables, deadlines
├── keyFindings[]          — Top insights, prioritized by impact
├── recommendedActions[]   — What to do next, with reasoning
└── lastUpdated            — Timestamp of last Analyst refresh
```

When the operator opens a client in the workspace, the Strategist loads this file (~3-5K tokens) instead of raw data (100K+ tokens). Fast, informed conversation. If the Strategist needs deeper data, it requests a targeted deep-dive from the Analyst on demand.

#### Key Operating Patterns

**Daily Briefing (async):**
Overnight, the Analyst refreshes intelligence files for all active clients, flags significant changes. When the operator opens Pare, the Strategist reads flagged changes across all clients and generates the morning agenda: "Client A's score dropped — investigate. Client B's sprint is due Friday. Prospect C opened their email twice — follow up."

**Research Flow:**
Operator asks "research this company's competitive landscape." The Strategist interprets the request and generates research queries. The Analyst executes research (web search, large-context processing of competitor sites). The Analyst returns structured findings. The Strategist synthesizes into strategic recommendation and drafts the deliverable.

**Document Generation:**
Proposals, reports, case studies, sprint plans, client emails — the Strategist generates these contextually from the intelligence file + conversation context. Drag documents into the conversation for the Analyst to process and the Strategist to reason over.

**Depth on Demand:**
"Tell me more about this client's schema issues" → Strategist requests a schema-specific deep-dive from the Analyst → Analyst reads raw JSON-LD data across all crawled pages → returns expanded schema briefing → Strategist incorporates into conversation.

#### Design Principles for the Cognitive Team

1. **Model-agnostic contracts.** The Analyst and Strategist roles are defined by Zod schemas for their inputs and outputs, not by which model fills the role. If a better comprehension model appears, swap it in. The contract stays the same. Today: Gemini for Analyst, Claude for Strategist, Haiku for Specialist. Tomorrow: whatever's best.
2. **Analyst processes are async and cached.** Never call the Analyst during a live conversation. Pre-process intelligence files on a schedule (after audits, daily for retainer clients) and cache them. The Strategist reads from cache.
3. **The Strategist can request depth.** When cached intelligence isn't enough, the Strategist triggers a targeted Analyst query. This is the exception, not the norm.
4. **The handoff schema is sacred.** The `ClientIntelligence` schema (what the Analyst outputs and the Strategist consumes) is the most important contract in the system. It gets the same rigor as `scoring.contract.ts`.
5. **Specialists handle grunt work.** Sentiment analysis, content scoring, schema parsing, citation extraction — structured extraction tasks where Haiku is fast, cheap, and accurate. Don't waste the Strategist on these.
6. **One voice to the operator.** The Strategist is the only model the operator interacts with. Consistent personality, consistent quality, no context-switching.
7. **Route by task, not by complexity.** Static task-based routing (a lookup table, not a classifier) determines which role handles each operation. Deterministic, observable, no ML overhead.
8. **Retrieval beats context stuffing.** Even with 1M token windows, structured retrieval (embeddings + pgvector in PostgreSQL) outperforms raw context for accuracy on reasoning tasks. Intelligence files work for <10 clients. At scale, embedding-based retrieval becomes the context layer.

#### Cost Architecture

The cognitive team is also a cost optimization. The Analyst role uses large-context models that are cheap per token for comprehension. The Strategist uses expensive models only for the focused decisions that matter. The Specialist uses the cheapest models for repetitive extraction.

| Role | Estimated Cost | Example |
|------|---------------|---------|
| Analyst (ingestion) | ~$0.03 per 200K tokens | Ingesting a full website crawl |
| Analyst (cached) | ~$0.003 per 200K tokens | Re-querying same client data (90% cache discount) |
| Strategist (reasoning) | ~$0.38 per analysis | Analyzing audit results, generating recommendations |
| Specialist (extraction) | ~$0.01 per parse | Sentiment analysis, schema parsing, citation extraction |
| **Full audit (routed)** | **~$0.65** | vs ~$1.30 with single-model (50% savings) |
| **50 clients/month (routed)** | **~$57** | vs ~$167 without routing (66% savings) |

This means AI costs are negligible relative to client revenue. A $5K/month retainer client costs ~$1.15/month in AI — a 4,348x revenue-to-cost ratio.

### Layer 3: Workspace

The unified interface where every consulting activity happens. Not a collection of admin CRUD pages — a cockpit.

**Chat-First Interface** — The chat is how you act. Not a sidebar. The primary interaction model. You talk to the AI about strategy, and it executes through tools. You can also access every tool directly without the AI if you prefer.

**Dashboards** — Client overview, pipeline health, score trends, retainer metrics, competitive intelligence. Visual at a glance, deep on click.

**Prospecting** — Batch domain analysis, opportunity scoring (lower AI score = bigger opportunity = hotter lead), outreach draft generation, prospect pipeline tracking.

**Delivery** — Audit results, remediation workbench (side-by-side before/after), proposal builder, sprint milestone tracking, verification deltas.

**Monitoring** — Score alerts, competitor movement, review velocity, monthly trend reports. The retention machine that proves ongoing value.

**Aesthetics First** — Every screen, every report, every email feels premium. Deep Navy (#1B2A4A), Electric Teal (#00D4AA). Mid-sized clients paying $5K/month expect Semrush-level polish.

## How It All Operates

The three layers work together through the consulting lifecycle. Here's how each phase flows:

### Prospecting → "Who should I pursue?"
```
Workspace: Operator opens prospecting view or asks Strategist "find me SaaS companies to prospect"
Intelligence: Strategist generates research criteria → Analyst researches domains (web search, public data)
Tools: batch-mini-audit runs across candidate domains → opportunity scores calculated
Intelligence: Strategist ranks prospects, drafts personalized outreach
Workspace: Operator reviews, approves, sends
```

### Audit → "Show them the problem"
```
Workspace: Operator triggers audit (admin button or Stripe payment)
Tools: Pipeline executes — crawl → query → analyze → score → report → deliver
Intelligence: Analyst processes raw audit data → updates Client Intelligence File
Intelligence: Strategist generates strategy call talking points from intelligence file
Workspace: Operator reviews report, delivers to client
```

### Sprint → "Fix the problem"
```
Workspace: Operator opens client's workbench
Intelligence: Strategist reads intelligence file, recommends prioritized remediation plan
Tools: generate-jsonld(), content-optimizer(), generate-faq(), generate-llmstxt() — produce deliverables
Intelligence: Strategist drafts implementation guide tailored to client's CMS
Workspace: Operator reviews, packages deliverables, tracks sprint milestones
Tools: Verification audit runs at sprint end → score-delta() measures improvement
Intelligence: Analyst updates intelligence file with delta data
```

### Retainer → "Prove ongoing value"
```
Background (automated): Weekly monitoring queries, monthly intelligence file refresh
Intelligence: Analyst detects changes — score drops, competitor gains, review velocity shifts
Intelligence: Strategist generates monthly report, flags items needing operator attention
Workspace: Morning briefing shows what needs action today across all retainer clients
Tools: Monthly report PDF generated, score alerts emitted
Workspace: Operator reviews, approves, sends monthly reports
```

### The Daily Loop
```
Morning:   Open Pare → Strategist presents agenda (briefing from overnight Analyst runs)
Working:   Chat with Strategist about clients → it orchestrates tools → produces deliverables
Reactive:  Alerts surface (score drops, competitor movement) → Strategist recommends response
Evening:   Background jobs run — monitoring, intelligence refresh, report queuing
```

The operator's job is **relationships and judgment**. Everything else is handled by the cognitive team and the tool layer.

## Dynamic Scoring

The 5-pillar scoring system adapts to the client's industry and business type. Fixed weights assume every business cares about the same things — they don't.

| Profile | AI Visibility | Content Quality | Schema | Technical | Local/GBP | Total |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|
| **Default** | 30 | 30 | 15 | 10 | 15 | 100 |
| **B2B SaaS** | 35 | 35 | 15 | 15 | 0 | 100 |
| **Ecommerce** | 25 | 25 | 20 | 10 | 20 | 100 |
| **Professional Services** | 30 | 25 | 15 | 10 | 20 | 100 |
| **Multi-Location Healthcare** | 25 | 25 | 15 | 10 | 25 | 100 |
| **Local Service** | 25 | 25 | 15 | 10 | 25 | 100 |

Scoring profiles are a configuration, not code. Editable from the admin UI. New profiles created as verticals are added. The 5 pillars remain constant — the weights shift.

## Beachhead Market

### Primary: B2B SaaS ($8M-$40M ARR)

**Why:**
- 73% of B2B websites experienced significant organic traffic loss from AI search (2024-2025)
- They allocate 15-25% of ARR to marketing — a $15M ARR company spends $2.25-$3.75M/year. A $5K/month GEO retainer is a rounding error
- Sophisticated buyers who already track organic MQLs and content ROI. No education needed on why search matters — only that AI search is eating their existing channel
- High retainer stickiness: 100+ pages, 10-20 competitors, continuous content production. GEO is not a one-time fix
- SaaS CMOs know other SaaS CMOs. One case study spreads through Slack communities, podcasts, and LinkedIn faster than any outbound campaign
- GBP is irrelevant, eliminating the most commoditized part of GEO

**Ideal Client:** VP Marketing at an 80-200 person B2B SaaS company with $8-30M ARR. Their organic traffic drove 60% of MQLs and has dropped 40% in the past year. Content team produces 8-12 blog posts/month but they're being synthesized by AI without attribution. Pipeline is down, CAC is up, and the board is asking questions. A $5K/month GEO retainer that recovers 20% of lost MQLs is a 4x ROI.

### Secondary: PE-Backed Multi-Location Healthcare

**Why:**
- Bridge from existing verticals (dental prompt library already exists, DSOs are "dental at scale")
- PE operating partners demand data — audit reports are exactly what they want for board meetings
- Budget scales with location count ($150/location/month is trivial)
- After 3-5 DSO clients, accumulated vertical intelligence becomes a genuine moat

### Future: Ecommerce (after agentic commerce protocols stabilize), Fintech (after regulatory compliance patterns established), Professional Services (law, accounting, consulting firms)

## Revenue Model

Three nested loops, priced for mid-market:

| Loop | Price Range | What They Get | Retention Driver |
|------|-----------|---------------|-----------------|
| **Audit** | $2,000-$5,000 | Full 5-pillar audit + branded PDF + strategy call | The diagnosis that makes the problem visible |
| **Sprint** | $5,000-$15,000 | 2-4 week implementation of top findings + verification re-audit | Measurable score improvement proves value |
| **Retainer** | $3,000-$10,000/mo | Monthly monitoring, competitor tracking, continuous optimization, monthly reports | Ongoing competitive pressure means they can't stop |

The moat compounds: after 20 clients in a vertical, the system knows which prompts surface businesses, which fixes move scores, and which patterns work. This knowledge is unreplicable without doing the work.

## The Competitive Landscape

### What Exists (Monitoring Tools — Show the Problem)

| Tier | Tools | Price | Gap |
|------|-------|-------|-----|
| Enterprise | Profound ($499/mo), Goodie AI ($495/mo), Bluefish AI (custom) | $495-$2,000+/mo | Dashboards only. No implementation. No verification. |
| Mid-Market | Otterly.ai ($29-$989/mo), Peec AI ($104-$580/mo), Scrunch AI ($300-$500/mo) | $100-$1,000/mo | Monitoring + alerts. Some optimization guidance. No implementation. |
| Budget | Passionfruit ($19-$99/mo), Geoptie ($49-$199/mo), SE Ranking (included) | $19-$250/mo | Basic tracking. No depth. |
| SEO Incumbents | Semrush One ($99-$199/mo + AI), Ahrefs Brand Radar ($249+$99/mo) | $100-$500/mo | AI features bolted onto traditional SEO. Generic, not vertical-specific. |

### What Nobody Does (Pare's Moat)

1. **Audit-to-Implement-to-Verify loop** — Every competitor stops at monitoring. None close the loop.
2. **Vertical-specific intelligence** — No tool has dental/SaaS/ecommerce-specific prompt libraries, schema requirements, or scoring profiles
3. **Schema gap analysis for AI citation** — GPT-4 goes from 16% to 54% accuracy with structured data. No tool systematically exploits this.
4. **LLM-based sentiment analysis** — Competitors use keyword matching. We use Claude Haiku to evaluate how AI presents brands.
5. **Consulting-oriented attribution** — No tool connects specific audit findings to specific sprint implementations to specific score improvements over time
6. **AI-native workspace** — Every competitor is a dashboard you look at. Pare is a workspace you work in, with an AI partner.

### Biggest Threat

**Semrush One** — bundles traditional SEO + AI visibility at accessible prices. Defense: vertical specialization, hands-on implementation, and the intelligence layer no SaaS dashboard can replicate.

## The Data Moat

What compounds over time and becomes defensible:

- **Prompt Performance Database** — After 100 audits, we know which prompts actually surface businesses in each vertical. No competitor can match this without doing the work.
- **Fix-to-Improvement Correlations** — Which specific changes (JSON-LD, FAQ pages, llms.txt) drive the most score improvement in each vertical? This data makes every subsequent sprint faster and more effective.
- **Vertical Benchmarks** — "The average B2B SaaS company in your category scores 31/100. Your top competitor scores 67. You score 24." Anonymized, aggregated, increasingly accurate.
- **AI Behavior Changelog** — How AI engines change their citation preferences over time. What worked 6 months ago may not work today. Continuous intelligence.
- **Consulting Playbooks** — Engagement templates refined by real client outcomes. "For B2B SaaS clients scoring below 40, the highest-ROI first sprint is: JSON-LD implementation + content restructuring for answer-first format + competitor citation analysis."

## Unified Principles

1. **The AI is the senior partner.** It reads the data, synthesizes the strategy, generates the deliverables. The consultant manages relationships and makes judgment calls.
2. **Tools are first-class citizens.** Every capability is a typed, composable function — callable by the AI, from the UI, or via API. The pipeline is one workflow. The system runs many.
3. **Contract-driven.** Zod schemas are the source of truth. Every tool input, tool output, and data structure is typed and validated.
4. **Aesthetics are non-negotiable.** Every report, email, and UI screen must feel premium. Mid-sized clients paying $5-10K/month expect it.
5. **Close the loop.** Diagnose, implement, verify. If we can't measure the improvement, we didn't deliver value.
6. **Vertical depth over horizontal breadth.** Be the best GEO consultant for B2B SaaS before being adequate for 10 verticals.
7. **Leverage, not labor.** Every manual step today should become a tool or AI-automated workflow tomorrow.

## Success Metrics (6-Month)

1. **First paid audit delivered** — End-to-end pipeline works on a real business, produces a report the client finds valuable
2. **First sprint completed with verified improvement** — Score delta > 15 points, documented in a verification report
3. **First retainer signed** — $3-5K/month, client sees monthly reports and ongoing value
4. **5 B2B SaaS audits completed** — Enough data to publish vertical benchmarks and refine prompt libraries
5. **Workspace is the daily operating tool** — The operator uses Pare every day to manage the consulting business, not spreadsheets or Notion

## What Pare Is NOT

- **Not a self-service SaaS dashboard.** Pare is a consulting operating system for an operator, not a product clients log into.
- **Not a monitoring-only tool.** If we only show the problem, we're a $500/month commodity. We fix the problem.
- **Not an agency platform (yet).** Built for one operator. Multi-tenant, team accounts, and white-labeling come after product-market fit.
- **Not a traditional SEO tool.** We don't track keyword rankings or manage backlinks. We optimize for AI engines.
- **Not trying to serve everyone.** B2B SaaS first. Expand deliberately.

## Market Context

- **GEO market:** $886M (2024) → $7.3B by 2031 (34% CAGR)
- **73% of B2B websites** experienced significant organic traffic loss from AI search
- **Only 1.2%** of business locations recommended by ChatGPT
- **AI-referred leads convert 6-27x higher** than traditional search
- **61% CTR drop** when AI Overviews appear — but cited brands get 35% more clicks
- **The window is open.** The GEO consulting market is forming now. Early movers establish compounding advantages.

---

## How to Update This Document

This vision is maintained through the development pipeline:

- **`/gap-analysis`** may identify that a section is wrong or incomplete based on what the codebase actually shows. Update the vision accordingly.
- **`/research`** may surface market data, competitor moves, or technical capabilities that shift priorities. Update the relevant sections.
- **`/synthesize`** may reveal that the phasing or revenue model needs adjustment. Update the critical path.
- **`/build`** sessions that encounter friction may reveal architectural assumptions that don't hold. Flag them and update.
- **Client feedback** (once we have clients) overrides everything. If a paying client's needs conflict with the vision, the vision adapts.

**What's stable:** The core thesis (audit → implement → verify loop), the three-layer architecture (Tools, Intelligence, Workspace), and the unified principles. These change only with deliberate, reasoned discussion.

**What's fluid:** Specific market targets, pricing, scoring profiles, tool inventory, competitive positioning, technical choices. These evolve with evidence.

When updating, add a comment at the top of the changed section: `<!-- Updated by [stage/reason] — [date] -->` so the evolution is traceable.

---

*Read this before starting any development session. When in doubt, build what closes the audit-to-implement-to-verify loop faster.*
