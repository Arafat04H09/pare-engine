# Consulting Lifecycle

## Overview

The consulting lifecycle has four phases. Each phase has clear entry criteria, deliverables, automation touchpoints, and exit criteria. The goal is maximum automation with mandatory human review at quality-critical moments.

---

## The Four Phases

### Phase 1: PROSPECT (Week 0)

**Objective:** Identify high-potential businesses and generate interest.

**Sources of prospects:**
- Batch audit (weekly prospecting run on 50 businesses per vertical/geography)
- Referrals from existing clients
- Inbound via website form (audit request)
- LinkedIn content engagement
- Cold outreach (email)

**Process:**
1. Mini-audit run on prospect (fully automated via n8n/Inngest trigger)
2. Prospect scored and ranked by AI Readiness Score
3. Top 20 selected for outreach
4. Personalized outreach sent (email or LinkedIn DM)
5. If response: meeting scheduled
6. If no response: enter cold email sequence

**Automation level:** 90% automated. Manual: selecting top prospects and personalizing outreach.

**Exit criteria:** Meeting scheduled OR prospect marked as cold after sequence completes.

---

### Phase 2: SALES (Week 0-1)

**Objective:** Convert prospect to paying client.

**Process:**
1. Full audit run (automated pipeline + manual quality review)
2. Audit report generated (branded 9-page PDF)
3. Walkthrough call scheduled (30-45 min screen share)
4. During walkthrough call:
   - Screen-share the report, page by page
   - Demo what AI currently says about them vs competitors
   - **LIVE:** Ask ChatGPT about their industry in their city, on screen
   - Walk through the prioritized action plan
   - Present sprint proposal with tier recommendation
   - Address objections
5. Contract sent (PandaDoc or equivalent)
6. 50% deposit collected (Stripe)

**Automation level:** 70% automated. Manual: quality review of audit, walkthrough call, proposal customization.

**The Walkthrough Call Script:**
- Open with their score: "Your AI Readiness Score is [X] out of 100."
- Show competitor comparison: "Your top competitor scores [Y]. Here's what that means."
- Live demo: Open ChatGPT, ask about their industry in their city, show results in real-time
- Walk through each pillar score with specific findings
- Present the action plan: "Here are the 15 things we'd fix in a 4-week sprint."
- Price anchor: "Agencies charge $5-12K/month for this. Our sprint is a one-time $[X]."
- Guarantee: "If your score doesn't improve measurably, we refund the sprint."
- Close: "I have availability starting [date]. Want me to send the contract?"

**Sales Language:**
"Your current AI Readiness Score is 23 out of 100. Your top competitor scores 67. That means when someone asks ChatGPT for a recommendation, your competitor shows up and you don't."

Never lead with price. Lead with the gap. Present sprint deliverables, then price, then guarantee.

**Exit criteria:** Contract signed + deposit received OR prospect moved to Lost.

---

### Phase 3: SPRINT DELIVERY (Week 1-4)

**Objective:** Implement all technical and content changes to improve AI visibility.

#### Week 1: Technical Foundation
- robots.txt configured for AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.)
- llms.txt created and deployed
- Organization schema implemented
- LocalBusiness schema implemented
- BreadcrumbList + WebSite schema implemented
- XML sitemap verified and submitted
- **Deliverable:** Technical infrastructure complete, client notified

#### Week 2: Content & Service Pages
- FAQPage schema deployed on top 5-10 pages
- Service/Product schema deployed for each service line
- Answer-first content restructuring on top 5 pages
- FAQ sections created on service pages
- Statistics and citations inserted into key pages
- **Deliverable:** Content optimization complete, client review requested

#### Week 3: Authority & Local
- Person schema for team members/providers
- Review/AggregateRating schema from testimonials
- Google Business Profile fully optimized
- sameAs links deployed to all verified profiles
- NAP consistency verified across directories
- Remaining page restructuring completed
- **Deliverable:** Authority signals deployed, local optimization complete

#### Week 4: Verification & Handoff
- Full re-audit run (automated)
- Before/after comparison generated
- Client walkthrough of all changes (30-min call)
- Monitoring baseline established (25 queries, 6 platforms)
- Documentation of all changes delivered
- Retainer proposal presented
- 50% final payment collected
- **Deliverable:** Sprint complete, before/after report delivered, retainer proposed

**Automation level:** 60% automated. Agentic workflows generate schema code and content drafts. Human review is mandatory before deployment. Client approval required for content changes.

**Quality gates:**
- All schema validated via Schema.org validator before deployment
- All content reviewed by operator before publishing
- Client approves content changes on their pages
- Re-audit confirms score improvement before handoff

**Exit criteria:** Final payment received + before/after report delivered + retainer proposed.

---

### Phase 4: RETAINER (Ongoing)

**Objective:** Maintain and extend AI visibility gains over time.

**Weekly cadence:**
- Monitoring execution runs automatically (25 queries across 6 platforms)
- Operator reviews deltas and flags
- Alerts triggered for visibility drops >20%, new competitors entering, sentiment shifts
- Content updates deployed if scheduled

**Monthly cadence:**
- Full monitoring report generated (automated PDF)
- Trend analysis prepared
- 2-3 pages optimized or new content created
- 30-min strategy call with client
- Invoice sent (Stripe recurring)

**Quarterly cadence:**
- Full re-audit run
- Comprehensive trend report (quarter-over-quarter comparison)
- Strategic recommendations for next quarter
- Pricing review (upsell opportunity if scope has grown)

**Ongoing:**
- Content optimization (1-3 pages/month)
- New schema deployed as client adds pages/services
- Competitive intelligence updates
- Respond to client questions via email/Slack

**Automation level:** 80% automated. Manual: strategy calls, content review, strategic recommendations.

**Exit criteria:** Client cancels OR upgrades to higher tier.

---

## Outbound Sales Process

### Batch Prospecting (Weekly)

1. Select target vertical + geography (e.g., "dentists in Austin, TX")
2. Run batch mini-audit on 50 prospects (automated via n8n workflow)
3. Score and rank all 50 by AI Readiness Score
4. Select top 20 with lowest scores (highest need) and highest revenue potential
5. Generate personalized outreach for each

### Cold Email Sequence (3 Emails)

**Email 1 (Day 0): The Hook**
- Subject: "I asked ChatGPT about [industry] in [city]"
- Body: One specific finding from their mini-audit. No pitch. Just the finding.
- CTA: "Want to see your full results?"

**Email 2 (Day 4): The Competitor**
- Subject: "Your competitor [name] shows up in ChatGPT. You don't."
- Body: Context on why this matters (AI referral growth stats). Offer to show them the full picture.
- CTA: "I put together a quick analysis -- want me to send it over?"

**Email 3 (Day 9): The Score**
- Subject: "Your AI Readiness Score: [number]/100"
- Body: 1-page summary of their audit attached. Clear next step.
- CTA: Calendar link to schedule walkthrough call.

### Meeting Script

1. Open: "Thanks for taking the time. I'm going to show you exactly how AI search engines see your business today."
2. Screen share the audit report
3. Walk through each section
4. Live demo: Ask ChatGPT about their industry
5. Present sprint proposal
6. Handle objections
7. Close: Contract + deposit

---

## Client Onboarding Checklist

Before sprint work begins, collect the following from the client:

**Technical Access:**
- [ ] CMS type + admin access (or designated implementer contact)
- [ ] Hosting provider and access level
- [ ] Domain registrar access (for DNS if needed)
- [ ] Google Search Console access (viewer or higher)
- [ ] Google Business Profile access (manager or higher)

**Business Information:**
- [ ] Legal business name
- [ ] Address(es) -- all locations
- [ ] Phone number(s)
- [ ] Business hours
- [ ] Complete list of services/products with descriptions
- [ ] Team members/providers (names, titles, bios)
- [ ] Existing testimonials/reviews

**Strategic Information:**
- [ ] Top 3-5 competitors (by name)
- [ ] Target service area (cities, regions, zip codes)
- [ ] Top 5 services by revenue
- [ ] Any existing marketing agency or SEO provider (to coordinate, not conflict)

---

## Automation Touchpoints

| Stage | Automated | Manual |
|-------|-----------|--------|
| Mini-audit | Fully automated (n8n/Inngest trigger) | Review results, select top prospects |
| Outreach emails | Template generation automated | Personalization review, send approval |
| Full audit | Automated pipeline | Quality review before delivery |
| Report generation | Fully automated (HTML to PDF) | Review before sending to client |
| Walkthrough call | N/A | Entirely manual (relationship-critical) |
| Sprint delivery | Agentic workflows generate code/content | Human review mandatory before deployment |
| Schema deployment | Code generated automatically | Client approval + deployment verification |
| Monitoring | Fully automated (weekly) | Review alerts, flag significant changes |
| Monthly reporting | Automated PDF generation | Strategy call, personalized recommendations |
| Invoicing | Stripe recurring | N/A |

---

## Key Metrics to Track

**Sales metrics:**
- Mini-audits sent per week
- Response rate to cold outreach
- Meeting-to-proposal conversion rate
- Proposal-to-close conversion rate
- Average deal size
- Sales cycle length (days from first contact to deposit)

**Delivery metrics:**
- Sprint delivery time (target: 4 weeks)
- Hours per sprint (target: declining over time with automation)
- Client satisfaction score (post-sprint survey)
- Score improvement (before/after delta)

**Retention metrics:**
- Sprint-to-retainer conversion rate
- Retainer churn rate (monthly)
- Average retainer lifetime
- Net revenue retention

**Operational metrics:**
- API costs per audit
- API costs per monitoring cycle
- Hours per retainer client per month
- Automation coverage (% of tasks automated)
