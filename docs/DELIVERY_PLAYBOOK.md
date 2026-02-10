# Delivery Playbook

## Sprint Delivery Checklist (Operator-Facing)

### Client Setup
```
CLIENT: [Name]
DOMAIN: [domain.com]
CMS: [WordPress/Squarespace/Wix/Custom]
VERTICAL: [dental/legal/hvac/accounting/restaurant]
SPRINT START: [date]
SPRINT END: [date + 4 weeks]
```

### Week 1: Technical Foundation
- [ ] robots.txt: AI crawler rules deployed (verify GPTBot, ClaudeBot, PerplexityBot, Google-Extended allowed)
- [ ] llms.txt: Created and deployed at /llms.txt (verify accessible)
- [ ] llms-full.txt: Created and deployed
- [ ] Organization schema: Deployed on homepage (validated via Rich Results Test)
- [ ] LocalBusiness schema: Deployed on contact/location pages (validated)
- [ ] BreadcrumbList: Deployed site-wide
- [ ] WebSite + SearchAction: Deployed on homepage
- [ ] Sitemap: Verified in Google Search Console + Bing Webmaster

### Week 2: Content & Service Pages
- [ ] FAQPage schema: Pages 1-5 [urls] — [status each]
- [ ] Service schema: All service pages — [count] pages
- [ ] Answer-first restructure: Pages 1-5 [urls] — [status each]
- [ ] FAQ sections added: [count] questions across [count] pages
- [ ] Statistics inserted: [count] data points added
- [ ] Author bios: Added to content pages with Person schema

### Week 3: Authority & Local
- [ ] Person schema: [count] team members
- [ ] Review/AggregateRating: Deployed on testimonial pages
- [ ] sameAs links: Connected to [list social profiles]
- [ ] NAP consistency: Verified across website, GBP, Yelp
- [ ] GBP: Description optimized
- [ ] GBP: Categories updated
- [ ] GBP: Photos added/updated
- [ ] GBP: Q&A section populated
- [ ] Remaining pages restructured
- [ ] HowTo schema: Deployed on guide pages

### Week 4: Verification & Handoff
- [ ] Re-audit completed (before score: [X] → after score: [Y] = +[Z] points)
- [ ] Before/after report generated (PDF)
- [ ] Monitoring baseline set (tracking [count] queries)
- [ ] Client walkthrough completed (recorded with Loom)
- [ ] Documentation delivered (CMS-specific maintenance guide)
- [ ] Retainer proposal presented (outcome: [accepted/pending/declined])
- [ ] Final invoice sent and collected

## Agentic Delivery Workflows

### Workflow 1: Schema Generator
Trigger → Crawl page → Classify page type (LLM) → Select schema template (vertical-specific) → Generate JSON-LD (LLM) → Validate (Rich Results Test) → Generate CMS instructions → Save + notify
Time savings: 4-6 hours manual → 15-30 minutes automated

### Workflow 2: llms.txt Generator
Trigger → Discover sitemap → Classify URLs by importance (LLM) → Generate llms.txt (structured markdown) → Generate llms-full.txt (full content extraction) → CMS deployment instructions
Time savings: 2-3 hours manual → 10 minutes automated

### Workflow 3: Content Restructurer
Trigger → Crawl current page → Identify target queries (LLM) → Generate restructured content in answer-first format (LLM) → Generate diff → Output for human review
Time savings: 45-60 min/page manual → 10-15 min automated
NOTE: Human review is MANDATORY. AI generates draft, consultant reviews.

### Workflow 4: Competitive Intelligence Report
Trigger → Generate 25-50 industry queries → Fire across all platforms → Parse for each brand → Gap analysis (LLM) → Generate branded PDF
Time savings: 6-8 hours manual → 20-30 minutes automated

## Retainer Operations

### Weekly Cadence
- Monday: Monitoring runs (automated), review delta report, flag alerts
- Tue-Thu: Content optimization tasks, new schema deployment, client questions
- Friday: Generate weekly summary, send to client, update tracker

### Monthly Cadence
- 1st week: Full monthly report with trend analysis, 30-min strategy call, invoice sent

### Quarterly
- Full re-audit, comprehensive trend report, strategic recommendations, retainer adjustment discussion

## Deliverable Templates (10 types)
| Document | Format | When | Priority |
|----------|--------|------|----------|
| Mini-Audit Summary | PDF (1 page) | Lead gen / outreach | HIGH |
| Full Audit Report | PDF (9 pages) | Sales / post-purchase | HIGH |
| Sprint Kickoff Brief | PDF (2 pages) | Sprint start | MEDIUM |
| Weekly Monitoring Report | Email + PDF | Weekly retainer | HIGH |
| Monthly Performance Report | PDF (4-6 pages) | Monthly retainer | HIGH |
| Sprint Completion Report | PDF (6-8 pages) | Sprint end | HIGH |
| Competitive Intelligence Report | PDF (4-6 pages) | As needed | MEDIUM |
| CMS Maintenance Guide | PDF + Google Doc | Sprint handoff | MEDIUM |
| Retainer Proposal | PDF (2 pages) | Post-sprint | HIGH |
| Service Agreement | PDF (contract) | Before sprint | HIGH |

## Client Communication Cadence (Without Dashboard)
Until dashboard is built, retention relies on over-communication:
1. Weekly email with score + highlights
2. Monthly Loom video walkthrough of changes
3. Proactive content optimization (don't wait for client to ask)
4. Quarterly re-audit showing cumulative improvement
The human touch replaces the dashboard until it's built.

## Quality Gates
- All schema validated via Google Rich Results Test before deployment
- All content restructuring reviewed by consultant before client sees it
- All before/after audits run with same queries, same platforms, same conditions
- Proof protocol: measure at 30/60/90 days post-sprint
