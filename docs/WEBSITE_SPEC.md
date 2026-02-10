# Website Specification

## Purpose
The Pare website serves 3 functions:
1. Sales tool — educate prospects and generate inbound leads
2. Credibility signal — proof that Pare practices what it preaches (GEO applied to own site)
3. Admin host — operator dashboard lives on same app behind auth

## Sitemap
```
/                     — Homepage (primary sales page)
/audit                — Free mini-audit CTA + full audit service page
/services             — Sprint + Retainer overview
/services/sprint      — AI Visibility Sprint detail
/services/retainer    — Monthly Retainer detail
/services/agentic     — Agentic Commerce Readiness detail
/case-studies         — Client results (anonymized initially)
/blog                 — Educational content (GEO insights)
/about                — About Pare + Arafat's credentials
/contact              — Contact form + calendar booking
/admin/*              — Operator dashboard (authenticated)
/llms.txt             — For AI crawlers
/llms-full.txt        — Comprehensive version
```

## Homepage Wireframe (Content Blocks)
### Block 1: Hero
- Headline: "Is Your Business Invisible to AI?"
- Subhead: "60% of Google searches end without a click. AI-referred traffic grew 527% last year. When ChatGPT recommends your competitor, where are you?"
- CTA: "Get Your Free AI Visibility Score" → /audit
- Trust: "Trusted by [X] businesses"

### Block 2: The Problem (Visual)
- Side-by-side: ChatGPT recommending competitor vs "This could be you"
- Stat: "Only 2-7 sources get cited per AI response. You're either in the answer or you don't exist."

### Block 3: The Solution (3 pillars)
- "We Audit" → See how AI sees your business
- "We Fix" → Technical optimization + content restructuring
- "We Monitor" → Ongoing tracking + competitive intelligence

### Block 4: Results/Social Proof
- Before/after scores from case studies
- Testimonial quotes

### Block 5: How It Works (4 steps)
1. Free AI Visibility Score (takes 2 minutes)
2. Full Audit + Strategy Call
3. 4-Week Sprint (we fix everything)
4. Ongoing Monitoring

### Block 6: Why Now (urgency)
- AI search growing 527%/year, UCP/ACP enabling AI transactions
- Window is 12-18 months before table stakes

### Block 7: FAQ
- How is this different from SEO?
- How long does it take to see results?
- What AI platforms do you optimize for?
- What if it doesn't work? (guarantee)
- Do I need to change my website?
- How much does it cost?

### Block 8: CTA
- "Get Your Free AI Visibility Score"
- Form: Business name, website URL, email, phone
- Triggers automated mini-audit, results emailed within 24 hours

## Audit Intake Form (/audit)
Fields: business name, website URL, email, phone, industry/vertical, number of locations
Submit triggers: n8n webhook → Inngest audit.requested event → pipeline runs → email results

## Brand Guidelines
### Colors
- Primary (Deep Navy): #1B2A4A — trust, authority
- Accent (Electric Teal): #00D4AA — innovation, tech
- Warning: #FFB020 (amber) — urgency
- Danger/Low score: #EF4444 (red)
- Success: #22C55E (green)
- Background: #FFFFFF + #F8FAFC (light gray)

### Typography
- Headings: Inter or Space Grotesk (modern, clean)
- Body: Inter
- Data/scores: Space Mono (technical precision)

### Logo
- "pare" in lowercase, clean sans-serif
- Tagline: "AI Visibility Consulting"

### Report Style
- Clean, data-forward design
- Charts > walls of text
- Color-coded scores (red → amber → green)
- Client logo alongside Pare logo on cover
- Page numbers + date on every page
- Confidentiality notice in footer

## GEO Self-Optimization (Eat Your Own Cooking)
The Pare website MUST have perfect GEO optimization:
1. Schema: Organization, WebSite+SearchAction, ProfessionalService, Person, FAQPage, Service, BreadcrumbList, Article/BlogPosting
2. llms.txt at /llms.txt with curated links
3. llms-full.txt at /llms-full.txt with full markdown
4. robots.txt explicitly allowing all major AI crawlers
5. Answer-first content structure on all pages
6. FAQ sections with proper markup
7. Statistics cited throughout
8. Author attribution on all content
9. Open Graph + Twitter Card markup
10. Footer note: "This website scores 94/100 on our own AI Readiness audit"

## Content Strategy
### Content Types & Cadence
| Type | Frequency | Source | Platform |
|------|-----------|--------|----------|
| "I asked ChatGPT..." screenshot posts | 2-3/week | Audit data | LinkedIn, X |
| Industry audit summaries | 1/week | Batch audits | LinkedIn, Blog |
| Market education posts | 1/week | Research | LinkedIn, Blog |
| Case study updates | 1/month | Client results | Blog, LinkedIn |
| Technical how-to guides | 2/month | Delivery experience | Blog |

### LinkedIn Templates
**Template 1: "The AI Test"** (Most engaging)
"I asked ChatGPT to recommend a [dentist/lawyer] in [city]. Here's who showed up: [screenshot]. The winner had schema markup, FAQ sections, 200+ reviews, llms.txt. The businesses that didn't appear had no structured data, content in PDFs, robots.txt blocking AI crawlers."

**Template 2: "The Batch Audit"** (Authority builder)
"I audited 50 [dental practices] in [city] for AI readiness. Average score: 23/100. Only 4/50 had schema markup. 31 were blocking AI crawlers. 0 had answer-first content."

**Template 3: "The Market Shift"** (Education)
Google UCP, AI agents booking appointments, structured data requirements for the AI commerce era.

## Implementation Approach
- Scaffold with v0.dev (outputs Next.js + shadcn/ui + Tailwind — exact stack match)
- Export from v0 → refine in Claude Code
- Deploy as part of monorepo `apps/web`
- v0 is for UI scaffolding only — backend logic built in Claude Code
