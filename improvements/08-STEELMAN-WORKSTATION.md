# 08 — Steelman: The Strongest Version of the Operator Workstation

> If every design decision were made perfectly, what does this become?

---

## The Thesis

The admin panel isn't a dashboard. It's not even a workstation. At its strongest, it's a **consulting operating system** — a single interface that collapses the entire audit-to-retain lifecycle into keyboard shortcuts and one-click actions. Every minute saved in the admin compounds into margin. The operator who does in 45 minutes what a 3-person team does in 8 hours wins on unit economics so decisively that pricing becomes a weapon, not a constraint.

---

## The Strongest Design: Three Modes

The workstation has three modes, toggled by context, not by navigation:

### Mode 1: Prospecting (Finding and Qualifying Leads)

**The action:** Paste a domain. Get a score in 90 seconds. Decide if it's worth pursuing.

- **Quick Audit** takes only a domain + business name. No client record needed. Runs a stripped-down pipeline: crawl 5 pages, query 3 providers with 3 prompts, score all 5 pillars, generate 1-page mini-report.
- Results cached. If you later onboard this prospect as a client, the mini-audit data seeds their profile — nothing wasted.
- **Batch mode:** Paste 20 domains from a Google Maps scrape. System queues mini-audits, runs them in parallel (rate-limited), returns a ranked table sorted by "opportunity score" (inverse of current score — worse score = bigger opportunity = hotter lead).
- **Email draft:** For each qualified prospect, auto-generate a personalized outreach email: "We audited how ChatGPT sees [Business Name] — here's what we found." Attach mini-report PDF. One click to send via Resend.

**Why this is the strongest version:** Prospecting is the bottleneck for a solo consultant. Every hour spent finding leads is an hour not spent serving clients. If the system does lead qualification autonomously, the operator only touches prospects that are already scored and ranked. CAC drops to near-zero.

### Mode 2: Serving (Running Audits and Delivering Sprints)

**The action:** Client says yes. You click "Full Audit." Everything happens. You review, customize, and deliver.

- **Client onboarding:** One form creates the client record, triggers the first audit, and sets up monitoring — all in one submit. No separate steps.
- **Pipeline visibility:** Real-time progress. "Crawling... 12/20 pages" → "Querying ChatGPT..." → "Analyzing content..." → "Scoring..." → "Generating PDF..." → "Done." Each step shows elapsed time. Failed steps show error + retry button.
- **Audit review:** When the audit completes, a notification appears. Click it → full audit detail with all 5 pillars. One-click "Generate Proposal" creates SOW. One-click "Send Report" emails the PDF with a branded template.
- **Sprint workbench:** After the client pays for a sprint, the workbench shows every remediation item ranked by impact-per-effort. Generate all fixes in batch. Review in a diff-like interface (current state vs. proposed fix). Approve all or cherry-pick. Export as ZIP with file structure matching the client's site. Include a `README.md` with implementation instructions.
- **Verification:** After the client implements fixes, click "Run Verification Audit." System runs a full audit with `parentAuditId` linking to the original. Delta report auto-generates: before/after scores, biggest improvements, remaining gaps. This is the case study.

**Why this is the strongest version:** The gap between "audit complete" and "deliverable in client's inbox" should be under 5 minutes. Every manual step (download PDF, open email, write subject line, attach file, send) is a leak in the operator's time. Eliminating those leaks means you can serve 3x the clients.

### Mode 3: Retaining (Monitoring and Reporting)

**The action:** Monthly reports generate themselves. You review and send. Clients never wonder what they're paying for.

- **Automated monitoring:** System runs weekly queries across all retainer clients. Tracks score trends, competitor movements, new AI Overview appearances, review sentiment shifts.
- **Monthly report drafts:** On the 1st of each month, system auto-generates monthly reports for all retainers. Operator reviews a queue: client name, score change, key findings. Click "Approve & Send" or "Edit" to customize before sending.
- **Alert routing:** Score drops >5 points trigger an immediate notification. Competitor gains trigger a briefing. New negative reviews trigger a response recommendation. Each alert has a suggested action and a one-click response.
- **Retainer health dashboard:** For each retainer: months active, MRR, score trajectory (sparkline), last report sent, engagement level (opening emails? requesting changes?). At a glance: which retainers are healthy, which need attention, which are at risk of churning.

**Why this is the strongest version:** Retainer churn is the existential risk (see 05-HIDDEN-RISKS.md, Risk 5). The defense against churn is proactive communication — clients should never have to ask "what am I paying for?" If monthly reports arrive like clockwork with clear value demonstration, the switching cost becomes emotional, not just functional.

---

## The Strongest UX: Command-First, Not Click-First

The strongest version of this workstation is **keyboard-driven with mouse fallback**, not the other way around.

### Command Palette (Ctrl+K)
Every action in the system is reachable from a command palette:
- `audit [domain]` → Quick audit
- `client [name]` → Jump to client
- `report [client]` → Generate monthly report
- `send [client] [document]` → Email a document
- `propose [client]` → Generate SOW
- `compare [client] [date1] [date2]` → Delta between two audits

### Contextual Actions
The right sidebar always shows actions relevant to the current view:
- On client page: "Run Audit", "Generate Report", "Send Email", "Add Note"
- On audit page: "Generate Proposal", "Open Workbench", "Download PDF", "Send to Client"
- On dashboard: "Quick Audit", "Add Client", "View Pipeline", "Generate All Monthly Reports"

### Notifications as Actions
Notifications aren't just FYI — they're actionable:
- "Audit completed for Acme Corp" → [View] [Send Report] [Generate Proposal]
- "Pipeline failed for XYZ Inc (step: query-engines)" → [Retry] [View Logs]
- "Monthly report ready for 3 clients" → [Review All] [Send All]

---

## The Strongest Data Model: Everything Is a Document

The unifying abstraction: **every output is a document** with a lifecycle.

```
Document {
  id: uuid
  clientId: uuid
  type: 'audit-full' | 'audit-mini' | 'proposal' | 'monthly-report' |
        'sprint-summary' | 'delta-report' | 'review-analysis' | 'remediation-export'
  status: 'draft' | 'reviewed' | 'sent' | 'archived'
  generatedAt: timestamp
  sentAt: timestamp | null
  recipientEmail: string | null
  content: jsonb         // structured data for rendering
  pdfBuffer: bytea | null  // cached PDF
  metadata: jsonb        // generation params, version, etc.
}
```

This lets you:
- See ALL documents for a client in one tab
- Track what's been sent vs. what's sitting in draft
- Re-generate any document from its params
- Audit trail of everything you've delivered

---

## The Strongest Settings: Self-Configuring System

### Integration Health Dashboard
Not just API key input fields — **live connection tests**.

```
Firecrawl     ✅ Connected (v1.2.0)    [Test] [Rotate Key]
OpenAI        ✅ Connected (gpt-4o)     [Test] [Rotate Key]
Perplexity    ✅ Connected (sonar)      [Test] [Rotate Key]
Gemini        ✅ Connected (1.5-pro)    [Test] [Rotate Key]
Anthropic     ⚠️ Key Set (untested)     [Test] [Rotate Key]
Google Places ❌ Not Configured          [Add Key]
Resend        ✅ Connected (3K/mo free) [Test] [Rotate Key]
Stripe        ✅ Connected (test mode)  [Test] [Switch to Live]
Apify         ❌ Not Configured          [Add Key]
Inngest       ✅ Running (3 functions)  [Open Dashboard]
PostgreSQL    ✅ Connected (42 rows)    [Test] [View Schema]
```

### Scoring Configuration
Visual sliders for weights. Default: 30/30/15/10/15. The strongest version lets you:
- Adjust per-vertical (restaurants care more about GBP, SaaS cares more about content)
- Save vertical presets
- Preview how weight changes affect existing client scores
- A/B test weights across client cohorts

### Branding
- Upload logo (appears on all PDFs and emails)
- Set primary/accent colors (propagates to report templates)
- Custom email footer text
- White-label option: client sees "Powered by [Your Brand]" not "Pare Engine"

---

## The Strongest Reporting: Templates as a System

Not just "generate PDF" but a **template engine** where every report is:
1. **Data** — Pulled from audit results, scores, deltas, competitor data
2. **Template** — HTML/CSS with placeholders (already exists as Puppeteer pipeline)
3. **Customization** — Operator can add/remove sections, reorder, add commentary
4. **Delivery** — Preview → PDF → Email with one click

### Template Library
- Full Audit Report (9 pages) — already built
- Mini Audit (1 page) — built
- Monthly Retainer Report — needs building
- Sprint Summary — needs building
- Competitive Analysis — needs building
- Proposal / SOW — built
- Delta / Verification Report — built
- Executive Briefing (1-slide format) — new concept

### Customization Layer
Before sending any document, the operator should be able to:
- Add a personal note at the top ("Hi Sarah, here are this month's results...")
- Highlight specific findings ("Pay special attention to the schema gaps on page 4")
- Hide sections that aren't relevant ("Skip GBP for this SaaS client")
- Add competitor comparison data
- Override the AI-generated executive summary with their own

This isn't a full WYSIWYG editor — it's a structured form with toggle-able sections and text override fields. The template does the heavy lifting; the operator adds the human touch.

---

## The Strongest Defense Against Churn

The workstation's secret weapon is **proof of value at every touchpoint**:

1. **Initial audit email** includes: score, letter grade, top 3 findings, competitor comparison, CTA
2. **Sprint kickoff** includes: prioritized action plan, estimated score improvement, timeline
3. **Sprint progress** (weekly): items completed this week, items remaining, current score estimate
4. **Sprint completion**: delta report (before → after), verified score improvement, case study draft
5. **Monthly retainer report**: score trend, competitor movements, new AI citations found, recommendations
6. **Quarterly review**: 3-month trend, ROI calculation, next quarter priorities

Each of these is a document. Each is generated by the system. Each is sent with one click. The client never wonders "what am I paying for?" because the answer arrives in their inbox regularly with concrete numbers.

---

## Implementation Reality Check

The full vision above is ~150 hours of work. But the 80/20 is:

**21 hours gets you a usable workstation:**
- Add Client form (3h)
- Operator-initiated audit (4h)
- Pipeline status view (6h)
- Settings page with API key management (8h)

**47 hours gets you a productive workstation:**
- + Document generation hub (12h)
- + One-click email delivery (4h)
- + Client 360 tabbed view (10h)

**87 hours gets you a competitive advantage:**
- + Command palette (6h)
- + Morning briefing (8h)
- + Bulk operations (12h)
- + Import/Export (8h)
- + Inline editing (6h)

The strongest version builds incrementally. Ship Tier A, start serving clients, build Tier B from the revenue, build Tier C from the compound knowledge of actually using the system daily.
