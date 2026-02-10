# Steelman Analysis & Risk Register

## What Must Be True for Pare to Work

| Assumption | Confidence | Risk if Wrong |
|------------|------------|---------------|
| AI search usage continues growing | 95% | Fatal — entire thesis fails |
| GEO optimization actually improves AI visibility | 75% | High — need case study proof BEFORE paid work |
| SMBs willing to pay $3-7K for GEO sprints | 70% | Medium — may need to start at $1.5-2K |
| Retainer clients stay 6+ months | 60% | Medium — churn destroys unit economics |
| One person can deliver quality at scale | 80% | Low — agentic workflows de-risk |
| Implementation gap lasts 12-18 months | 55% | High — window could close faster |
| Cold outreach converts at 5%+ meeting rate | 50% | Medium — LinkedIn may need to carry more weight |

## What the Original Specs Overstated

### 1. "527% AI traffic growth" misleading for SMBs
Adobe's data is primarily e-commerce product searches. A local dentist's AI referral traffic might be near-zero for months even after optimization.
**Mitigation:** Set expectations that AI visibility (being mentioned) is the leading indicator; traffic follows as AI adoption in their market matures.

### 2. 12-18 month window is optimistic
Yoast already generates llms.txt. WordPress plugins do basic schema. CMS platforms adding GEO features faster than expected. Window for basic technical implementation may be 6-12 months.
**Mitigation:** The moat isn't basic implementation — it's vertical-specific optimization, competitive intelligence, ongoing strategic management. Plugins do generic; Pare does vertical-specific.

### 3. Retainer churn model (8%/month) is optimistic
At $1,500+/mo, SMB retainers typically churn 10-15%/month unless clear, measurable results shown monthly.
**Mitigation:** Over-communicate. Weekly reports, monthly calls, always show score improving. The moment a client can't articulate why they're paying, they'll cancel.

### 4. Free case study delays revenue
Months 1-2 at $0 while building tools AND doing free work is a strain.
**Mitigation:** Compress to 2 weeks. Simple site (small dental practice, WordPress). Focus on technical foundation only. Extract case study content aggressively.

### 5. API ToS risk under-addressed
Using OpenAI, Anthropic, Perplexity APIs for competitive monitoring may violate ToS or be in gray area.
**Mitigation:** Review each API's ToS carefully. Fallback strategies (manual execution, browser automation). Diversify across providers so losing one isn't fatal.

## What the Specs Understated

### 1. Content quality is the real citation driver
The spec heavily focuses on technical optimization (schema, llms.txt, robots.txt) but research shows content authority is the #1 factor. 95% of AI citations come from non-paid journalistic sources. Schema helps AI understand content; it doesn't make content worth citing.
**Implication:** Content restructuring is more valuable than schema work. Consider "citation-worthy content creation" as a distinct deliverable.

### 2. Third-party signals matter more than on-site optimization
AI models cite businesses appearing consistently across trusted sources. A dental practice on Healthgrades, Zocdoc, local news, dental associations outperforms one with perfect schema but no off-site presence.
**Implication:** Add "citation building" / "digital PR for AI visibility" as premium retainer deliverable.

### 3. The operator dashboard is more important than the client dashboard
The client dashboard is retention. The operator dashboard determines whether you can scale. If spending 2 hours/client/week on manual reporting and coordination, scaling to 10+ clients is impossible.
**Implication:** Build operator view first, client view second.

### 4. Sales motion needs more specificity
"Run batch audits on 50 prospects" needs operational detail: who are the 50? Where found? Exact message? How to avoid spam filters on new domain?
**Implication:** Outbound needs week-by-week playbook for first 8 weeks with volume targets.

## Build / Use / Defer / Kill Matrix

### BUILD (Custom, MVP-Critical) — Revised Estimates
| Component | Hours | Notes |
|-----------|-------|-------|
| Multi-LLM Query Engine | ~8h | AI SDK handles providers — custom prompts + parsing only |
| Site Crawler + Analysis | ~10h | Firecrawl for crawling, custom analysis functions |
| Scoring Engine | ~4h | 5-pillar weighted scoring |
| Audit Report PDF | ~12h | HTML/CSS templates + Puppeteer (not React-PDF) |
| Mini-Audit PDF | ~2h | Lead gen tool |
| Integration/Pipeline | ~8h | Inngest durable steps for end-to-end |

### USE (Existing tools)
Playwright, jsonld.js, schema-dts, PostgreSQL (Supabase/Railway), n8n, Perplexity Sonar, OpenAI web search, Gemini grounding, Google Places API, Stripe, Resend, Airtable/Notion

### DEFER (After 3 paying clients)
Client dashboard, operator dashboard (full), automated monitoring, n8n delivery workflows, batch prospecting, outreach automation, monthly report template

### KILL (Over-engineered)
Copilot/Bing monitoring, multi-tenant architecture, agentic commerce as separate product (fold into sprint), competitive intel as standalone product, Invoice Ninja, custom CMS deployment workflows

## Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | GEO doesn't produce measurable results | 25% | Fatal | Free case study BEFORE paid work |
| 2 | API ToS violation/revocation | 20% | High | Review all ToS, diversify providers, manual fallback |
| 3 | JPMorgan conflict | 15% | High | Review moonlighting policy BEFORE filing LLC |
| 4 | Zero inbound leads after 8 weeks | 35% | Medium | LinkedIn content must start before outreach, 3 posts/week |
| 5 | Retainer churn >15%/month | 30% | Medium | Over-communicate, weekly reports, monthly calls |
| 6 | Tool building takes >3 weeks | 40% | Low | MVP only: audit + PDF + website |
| 7 | Market commoditizes in <12 months | 20% | Medium | Speed, vertical playbooks, implementation data moat |
| 8 | Burnout from 50+ hr weeks | 50% | High | Time-box JPM, automate aggressively, max 2 sprints simultaneously |

## Top 5 Time-Waster Risks

### 1. PDF Report Generation Hell (80% likelihood, 1-2 weeks lost)
React-PDF has limited CSS. Charts in PDF are difficult. Use Puppeteer HTML→PDF instead.

### 2. LLM Response Parsing Accuracy (60%, 1 week lost)
Fuzzy brand name matching across diverse AI response formats is harder than expected. Start with exact + simple fuzzy matching. Use Claude Haiku as secondary parser for accuracy.

### 3. API Rate Limits (50%, 3-5 days lost)
100+ queries across 4 platforms will hit limits. Start with Perplexity Sonar + SerpAPI (most consistent), add others incrementally.

### 4. Scope Creep into Dashboard/Workflows (70%, 2-4 weeks lost)
Building dashboard before paying clients = delayed revenue. Enforce: NO dashboard, NO n8n workflows until 2 paying clients.

### 5. Free Case Study Takes Too Long (40%, 2-3 weeks lost)
Compress to 2 weeks, simple site, focus on technical foundation only.

## Research Gaps Still Open
1. Detailed API ToS audit for brand monitoring (legal risk #1)
2. Before/after case study methodology (defensible proof protocol)
3. AI response non-determinism (need statistical methodology — run each query 3-5x)
4. CMS deployment automation per platform (WordPress/Squarespace/Wix REST APIs)

## Schema Markup Reality Check
- Search Atlas empirical study shows NO correlation between schema and citation frequency
- Schema helps comprehension (reducing hallucination, improving accuracy), not ranking
- Reposition: schema is foundational infrastructure, not the primary citation driver
- Content quality is the #1 citation driver (30% weight in revised scoring, up from 20%)

## llms.txt Reality Check
- Google's Gary Illyes explicitly says Google does not support llms.txt
- No major LLM provider confirmed their crawlers read it
- Low adoption despite BuiltWith claiming 844K detections
- Keep in deliverables (5 min to implement, signals sophistication) but don't oversell
