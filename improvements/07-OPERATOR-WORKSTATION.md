# 07 — Operator Workstation: Admin Panel as Daily Command Center

> "I want to generate reports, configure integrations, make documents, get information quickly, input things — all in one place."

## Latent Intent

You don't want a dashboard. You want a **workstation** — the one app you open every morning that lets you run your entire consulting business. View dashboards passively? No. Actively generate deliverables, onboard clients, trigger audits, send reports, manage your pipeline. The admin panel should be the cockpit, not the rearview mirror.

The current admin is **80% read-only**. Only 4 pages have interactive actions (re-run audit, generate proposal, analyze reviews, approve remediations). Everything else is tables and stat cards showing data that doesn't exist yet because there's no way to create it from the UI.

**The chicken-and-egg problem:** The dashboard shows clients and audits, but there's no "Add Client" button. Audits exist only if someone pays through Stripe on the public form. You can't even test your own product without inserting rows into PostgreSQL manually.

---

## What Exists Today (Honest Assessment)

### Can DO from admin:
1. Log in / log out
2. Re-run an audit for an existing client (button on client detail)
3. Generate a proposal/SOW from audit scores
4. Analyze Google reviews + generate campaign materials
5. Generate remediation fixes (JSON-LD, FAQ, llms.txt) and approve/reject them
6. Download audit PDFs

### Can only VIEW:
1. Dashboard stats (all zeros on empty DB)
2. Client list (empty)
3. Audit list (empty)
4. Audit detail (findings, action plan, pillar scores)
5. Competitor gap analysis
6. Verification deltas

### Cannot do at ALL:
1. Add a client
2. Run a new audit (only re-run existing)
3. Configure API keys or settings
4. Send an email to a client
5. Generate a report without a completed audit
6. Track pipeline status (is my audit running? failed? done?)
7. Add notes or context to a client
8. Export data in any format besides PDF
9. See what needs attention today
10. Batch anything

---

## Extrapolated System: The Operator's Daily Workflow

Here's what a typical day should look like with a fully realized workstation:

### Morning (5 min)
1. Open `/admin` → See **action items**: 2 audits completed overnight, 1 pipeline failed, 3 remediations pending review, 1 retainer report due this week
2. Click "Review" on completed audit → skim scores → click "Generate Proposal" → download PDF → email to prospect
3. Click "Retry" on failed pipeline → it re-runs

### Client Onboarding (10 min)
4. Prospect says yes → Click "Add Client" → Enter business name, domain, vertical, contact info, competitors, Google Place ID
5. Click "Run Full Audit" → Pipeline starts → See real-time progress bar
6. While waiting: open another client → review their monthly report draft → click "Send"

### Sprint Work (30 min)
7. Open client's workbench → See 12 remediation items ranked by impact
8. Click "Generate All Drafts" → AI generates JSON-LD, FAQ pages, llms.txt for each
9. Review each → Approve/Reject → Click "Export Approved" → Get a ZIP of all files + implementation instructions

### Proposal/Sales (15 min)
10. Open a prospect who got a mini-audit → Click "Generate Proposal" → Customize line items and pricing → Download branded PDF
11. Open "Quick Audit" → Paste a domain → Get a 1-page mini-report in 2 minutes → Send to cold prospect

### End of Day (5 min)
12. Check pipeline status → All green → Log out

**Total admin time: ~65 min/day to manage 5-8 clients**

---

## The 12 Missing Capabilities

### Tier A: Unblock the Workflow (Without These, Admin Is Unusable)

#### A1. Add Client Form
**Current:** No way to add clients. They only exist if created by Stripe webhook.
**Need:** `/admin/clients/new` — Form with: business name, domain, vertical, city/state, contact name/email/phone, Google Place ID, competitors (multi-input), engagement type, notes.
**Why critical:** You can't use the workstation if you can't put anyone in it. This is the front door.

#### A2. Operator-Initiated Audit (Skip Stripe)
**Current:** Audits only trigger from public form + Stripe payment. Re-run only works for existing clients.
**Need:** "Run Audit" button accessible from: client detail page, client list (batch), and a standalone "Quick Audit" page (`/admin/quick-audit`) that takes just a domain + business name.
**Why critical:** You need to audit prospects for free to sell them. You need to audit clients on demand. Stripe is for the self-serve public funnel — the admin is for operator-initiated work.

#### A3. Pipeline Status Dashboard
**Current:** You click "Run Audit" and... nothing. No feedback. Is it running? Did it fail? How long will it take?
**Need:** `/admin/pipeline` — Live view of Inngest jobs. Show: queued, running (which step), completed, failed. Click to see logs. Retry failed steps.
**Why critical:** Without visibility into the pipeline, you're flying blind. You don't know if the audit you triggered 10 minutes ago is stuck on Firecrawl or waiting for Gemini.

#### A4. Settings / Configuration Page
**Current:** All config in `.env` files. Changing an API key means SSH + restart.
**Need:** `/admin/settings` — Sections for:
- API Keys (Firecrawl, OpenAI, Perplexity, Gemini, Anthropic, Google Places, Resend, Stripe, Apify, Serper)
- Email settings (from address, reply-to, templates)
- Scoring weight overrides (visual sliders, default 30/30/15/10/15)
- Business branding (logo URL, primary/accent colors for reports)
- Database status (connection test, row counts)
**Why critical:** "Configure/integrate it all in one place" — your words. No more `.env` file editing.

### Tier B: Make It Productive (Turn Admin Into a Money-Making Machine)

#### B1. Document Generation Hub
**Current:** Proposal generation exists on one page. PDF download exists. That's it.
**Need:** `/admin/documents` or per-client document tab — Generate:
- Full audit report (9-page PDF) — from existing audit data
- Mini audit report (1-page teaser) — for prospects
- Proposal / SOW — already exists, enhance with editable line items
- Monthly retainer report — score trends, changes, recommendations
- Sprint summary — what was implemented, before/after, next steps
- Implementation checklist — exportable per-pillar action items
All with: preview, download PDF, send via email (Resend), and copy-to-clipboard for text content.
**Why critical:** "Generate reports and stuff I could send to clients" — this is the core ask.

#### B2. One-Click Email Delivery
**Current:** Documents generate but there's no "Send" button. You'd have to download the PDF, open your email client, attach it, write the email.
**Need:** Every document that generates should have a "Send to Client" button. Pre-filled email template (React Email), client's email pre-populated, custom message field, attach PDF. Preview before sending. Delivery confirmation shown in UI.
**Why critical:** The gap between "document generated" and "client received it" should be one click, not five minutes of manual work.

#### B3. Client 360 View (Enhanced)
**Current:** Client detail shows contact info, engagement type, scores, and audit history. Bare minimum.
**Need:** Tabbed interface:
- **Overview** — Current scores, engagement status, key metrics, quick actions
- **Audits** — Full audit history with comparison, delta trends over time
- **Documents** — All generated documents (proposals, reports, sprint summaries)
- **Remediations** — All fixes across all audits, status tracking
- **Competitors** — Competitor list, share of voice trends, gap analysis
- **Reviews** — Review analysis history, campaign artifacts
- **Notes** — Free-form notes, conversation log, reminders
- **Activity** — Timeline of all actions (audits run, emails sent, documents generated)
**Why critical:** "Get information quickly" — everything about a client in one place with tabs, not scattered across 6 different URL paths.

#### B4. Quick Actions Bar
**Current:** Actions are buried in sub-pages. To generate a proposal, you navigate: Dashboard → Audits → Audit Detail → Proposal → Generate.
**Need:** Persistent command bar (keyboard shortcut: Cmd+K / Ctrl+K):
- "Run audit for [client name]"
- "Generate proposal for [client name]"
- "Send report to [client email]"
- "Add new client"
- "View [client name]"
Quick action buttons on dashboard: "New Client", "Quick Audit", "View Pipeline"
**Why critical:** Speed. The difference between a tool you use reluctantly and one you love is how many clicks to do common things.

### Tier C: Scale and Differentiate (After 5+ Clients)

#### C1. Morning Briefing / Action Items
**Current:** Dashboard shows aggregate stats. No sense of "what needs my attention."
**Need:** Dashboard top section — "Today's Actions":
- Audits completed overnight (review + send)
- Pipeline failures (retry or investigate)
- Remediations pending review (approve/reject)
- Monthly reports due this week (generate + send)
- Score drops detected (investigate + notify client)
- Retainer renewals approaching
Each item is one-click actionable.
**Why critical:** Solo operator can't afford to forget things. The system should tell you what to do, not make you hunt.

#### C2. Bulk Operations
**Current:** Everything is one-at-a-time.
**Need:**
- Batch mini-audits: Paste 10 domains → run mini-audits on all → compare results in a table → pick the best prospects
- Batch email: Select 5 clients → send monthly reports to all
- Batch export: Select audits → download all PDFs as ZIP
**Why critical:** Prospecting at scale. Monthly report delivery for 10 retainers shouldn't take 10 separate workflows.

#### C3. Data Import/Export
**Current:** No import, PDF-only export.
**Need:**
- Import: CSV upload for clients (bulk onboarding), paste competitor URLs
- Export: CSV of all clients + scores, CSV of audit history, JSON API for integrations
- Clipboard: Copy any table, any score breakdown, any finding as formatted text
**Why critical:** You'll want to put data into spreadsheets, pull data into other tools, paste scores into emails.

#### C4. Inline Editing
**Current:** Client data is read-only in the admin. To change a client's email or add a competitor, you'd need to edit the database directly.
**Need:** Click any client field to edit it inline. Add/remove competitors. Update engagement type. Change contact info. All saved to DB immediately.
**Why critical:** "Input things" — your words. Data entry should be frictionless.

---

## Priority Matrix

| Capability | Impact | Effort | Depends On | Priority |
|-----------|--------|--------|------------|----------|
| A1. Add Client Form | Unblocks everything | 3h | Nothing | **Do first** |
| A2. Operator Audit Trigger | Revenue-enabling | 4h | A1 | **Do first** |
| A3. Pipeline Status | Confidence/trust | 6h | Inngest API | **Do second** |
| A4. Settings Page | Self-service config | 8h | Nothing | **Do second** |
| B1. Document Hub | Core value prop | 12h | Existing generators | **Do third** |
| B2. One-Click Email | 10x time savings | 4h | Resend integration | **Do third** |
| B3. Client 360 | Information density | 10h | Existing pages | **Do fourth** |
| B4. Quick Actions Bar | UX quality | 6h | Nothing | **Do fourth** |
| C1. Morning Briefing | Operator efficiency | 8h | Pipeline status | Later |
| C2. Bulk Operations | Scale | 12h | A2 | Later |
| C3. Import/Export | Data portability | 8h | Nothing | Later |
| C4. Inline Editing | Friction reduction | 6h | Nothing | Later |

**Total effort to full workstation: ~87 hours**
**Effort to usable workstation (Tier A + B): ~47 hours**
**Effort to minimum viable workstation (Tier A only): ~21 hours**

---

## What This Unlocks

With Tier A alone (21 hours), you go from "admin panel I can't use" to:
- Add clients manually
- Run audits on demand (no Stripe required)
- See pipeline progress
- Configure API keys from the UI

With Tier A + B (47 hours), you have:
- A real consulting workstation
- Document generation for every client touchpoint
- One-click email delivery
- Everything about a client in one tabbed view
- Speed via quick actions

With the full workstation (87 hours), you're operating like a 5-person agency from a single browser tab.
