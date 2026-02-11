# Hidden Risks the Architecture Doesn't Address

## Risk 1: The Score Might Not Move

The entire business thesis rests on: "We fix things, the score improves, here's proof." But the 5-pillar scoring is partially self-referential.

**The problem:** Pillars 2-5 (Content, Schema, Technical, GBP) are based on the client's own website. Pare controls these. Fixing schema markup will always improve the Schema pillar score. Deploying llms.txt will always improve the Technical pillar score. These improvements are real but tautological -- "we fixed the thing our scoring system measures."

Pillar 1 (AI Visibility, 30 points) is the only external validation. It measures whether AI engines actually mention and cite the business. This score may NOT improve after a sprint because:
- AI engines update their training data on their own schedule (weeks to months)
- Citation is influenced by factors outside Pare's control (domain authority, backlink profile, third-party mentions)
- AI responses are non-deterministic -- the same query gives different results each time
- The Princeton study's "30-40% visibility gains" may not apply to local businesses specifically

**What this means:** A sprint could improve the composite score from 23 to 55 by fixing Schema (0->12), Technical (2->9), Content (8->22), and GBP (5->12) while AI Visibility stays at 8. The report would say "+32 points" but the client might say "ChatGPT still doesn't mention me."

**Mitigation:**
- Frame technical fixes as "preparing the foundation" -- separate from "visibility results which lag 30-90 days"
- Set clear expectations: "Technical score improves immediately. Visibility score improves over weeks."
- Track AI Visibility separately as a "leading indicator" that requires patience
- If possible, include a "projected visibility" metric based on historical data from similar clients

## Risk 2: Non-Determinism Undermines the Delta

AI responses are stochastic. The same query to ChatGPT returns different results every time. This means:
- Monday's audit might show 3/10 queries mention the business
- Tuesday's audit might show 5/10 queries mention the business
- Neither is "wrong" -- AI responses are inherently variable

**Impact:** If the "before" audit happens to catch a bad day (2/10 mentions) and the "after" audit catches a good day (6/10 mentions), the delta looks amazing but is mostly noise. Conversely, if the reverse happens, a successful sprint looks like a failure.

**Mitigation:**
- Run each query 5x and take the average (increases API cost 5x but gives statistical validity)
- Report mention rate as a range with confidence interval, not a single number
- Compare moving averages (last 3 runs) rather than single-point measurements
- Be transparent in reports: "AI responses vary; these scores represent averages across N runs"

## Risk 3: API ToS Violations

Using OpenAI/Perplexity/Gemini APIs to query about specific businesses for competitive monitoring purposes may violate terms of service. This has not been legally reviewed.

**Specific concerns:**
- OpenAI ToS prohibits "automated competitive analysis" in some interpretations
- Perplexity's API is designed for application builders, not monitoring services
- Google's Gemini API has usage policies around commercial intelligence gathering
- Running 50+ queries per business, across 50+ businesses per week, looks like automated scraping

**Impact if caught:** API access revoked for one or more providers. Without all 3 providers, the audit quality degrades and the scoring system loses credibility.

**Mitigation:**
- Legal review of each provider's current ToS before launch
- Rate limit aggressively (max 100 queries/day across all clients)
- Build fallback: if one provider is lost, reweight scoring to the remaining two
- Consider adding Serper.dev AIO detection as a non-API-dependent signal

## Risk 4: The Operator Bottleneck

The system is designed for one person. But one person has:
- 168 hours/week (40 working hours realistically)
- At 10 retainer clients: 40 hours/month on retainer work alone
- At 2 sprints/month: 10-30 hours/month on sprint work
- Plus: sales calls, content marketing, tool maintenance, bookkeeping

**The math breaks at ~8 retainer clients + 2 sprints/month.** At that point, the operator is working 50-60 hours/week with zero buffer for sales development.

**Mitigation:**
- Prioritize automation of retainer delivery (weekly emails, monthly reports) before scaling past 5 retainers
- Build the workbench UI early -- it's not just a nice-to-have, it's the bottleneck breaker
- Hire a VA for non-technical work (scheduling, invoice follow-up, client communication) at 8+ clients
- Consider partnering with a freelance developer for sprint delivery at 10+ clients

## Risk 5: The Website Is the Weakest Link

The system has 26,700 lines of code in the engine. The website has 3 stub pages. There is no homepage, no intake form, no pricing page, no case studies, no blog. The website spec exists in detail (`WEBSITE_SPEC.md`) but nothing is built.

**Impact:** Zero inbound leads. All sales must be outbound (cold email, LinkedIn DM). The sales funnel has no top-of-funnel without a website.

**Why this matters more than it seems:** GEO consulting credibility requires the consultant's own website to demonstrate GEO best practices. A consultant selling "I'll make your website visible to AI" whose own website is invisible to AI has zero credibility.

**Mitigation:** The website is Tier 2 priority, but it might need to be Tier 1. Consider a minimum viable website:
- Homepage with hero, problem statement, 3-step solution, CTA
- Intake form connected to Stripe
- Schema markup on the site itself (Organization, ProfessionalService, FAQPage)
- llms.txt deployed
- "This website scores 94/100 on our own audit" in the footer

## Risk 6: Case Study Chicken-and-Egg

The sales thesis requires case studies ("we improved this dentist's score from 23 to 78"). But getting the first case study requires:
1. Finding a willing business (free or deeply discounted)
2. Running the full audit
3. Delivering the full sprint
4. Waiting 30-90 days for AI Visibility changes
5. Running the verification audit
6. Writing up the case study

This is 3-4 months of work before the sales pitch is ready. During this time, revenue is zero.

**Mitigation:**
- Split the case study into two parts:
  - Part 1 (Week 4): "Technical Improvement" -- schema, robots.txt, llms.txt, content restructuring. Score delta is immediate for pillars 2-5.
  - Part 2 (Month 3): "Visibility Improvement" -- AI Visibility pillar shows change over time.
- Use Part 1 immediately in sales materials while waiting for Part 2
- Start selling paid audits ($750) during the case study period -- audits don't require case study proof

## Risk 7: The 138 TODOs

The DEPLOYMENT_TASKS.md identifies 138 TODO/FIXME/stub markers across 63 files. This technical debt is not just cosmetic -- it represents incomplete logic paths, unhandled edge cases, and architectural shortcuts.

**Impact:** Unknown failure modes in production. A client audit might produce nonsensical scores, broken PDFs, or silent failures that go undetected until the client notices.

**Mitigation:**
- Before serving real clients, grep for all TODO/FIXME/STUB markers in the critical path
- Categorize: (a) safe to ship, (b) must fix before production, (c) needs investigation
- Priority: fix all stubs in the pipeline steps (pipeline.ts -> deliver.ts -> report)
- Accept that non-critical TODOs can live until they cause actual problems

## Risk 8: No Error Visibility

The system logs errors to `console.error`. There is no:
- Error tracking service (Sentry, LogRocket)
- Alert on pipeline failure
- Audit failure notification to operator
- Health check endpoint
- Uptime monitoring

**Impact:** Audits fail silently. The operator doesn't know until a client emails "I never received my report."

**Mitigation:**
- Add Sentry (free tier: 5K errors/month)
- Add email notification on Inngest step failure
- Add `/api/health` endpoint for uptime monitoring
- Add "Failed Audits" section to admin dashboard (already spec'd in OPERATOR_DASHBOARD.md)
