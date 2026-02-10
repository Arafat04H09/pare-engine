# Operator Dashboard Specification

## Purpose

A consolidated admin console for the solo operator (Arafat) to manage all consulting operations without switching between multiple tools. This is NOT a client-facing dashboard -- it is the operator's command center.

Key principle: Build only what cannot be replaced by existing tools. Use Notion, Stripe, and CLI commands until the dashboard proves necessary through friction.

---

## Architecture Decision

The operator dashboard lives inside `apps/web` as admin-only routes behind authentication. Single Next.js app = public website + admin panel. One deployment, one codebase.

**Auth approach:** Simple session-based authentication. Single operator account. No client login needed for MVP. Use NextAuth with a credentials provider (email + password from environment variable) or a simple session cookie with bcrypt-hashed password.

**Future:** Add employee accounts when scaling past solo operation. Add client portal when retainer count exceeds 10.

---

## Route Structure

```
/admin                    -- Dashboard home (overview)
/admin/pipeline           -- Sales pipeline
/admin/clients            -- Active client list
/admin/clients/[id]       -- Individual client detail
/admin/audits             -- Audit queue + history
/admin/monitoring         -- Monitoring alerts + status
/admin/financials         -- Revenue overview
```

All `/admin/*` routes are protected by authentication middleware. Unauthenticated requests redirect to `/admin/login`.

---

## Dashboard Home (/admin)

The home view provides a single-screen overview of business health.

**Metrics Row:**
- Revenue this month (sprints + retainers + audits)
- MRR (monthly recurring revenue from retainers only)
- Active sprints count
- Active retainers count
- Pipeline value (sum of estimated deal values for open prospects)

**Alerts Section:**
- Visibility drops >20% for any monitored client
- Overdue deliverables (sprint tasks past due date)
- Prospect replies requiring response
- Invoices overdue >7 days
- Audit failures (pipeline errors)

**Today's Tasks:**
- Pulled from deliverables table, filtered by due date
- Sorted by priority
- Quick action: mark complete, reschedule

**Recent Monitoring:**
- Last 5 monitoring runs with scores and trend arrows (up/down/flat)
- Click through to client detail

---

## Pipeline View (/admin/pipeline)

Kanban-style board for managing the sales pipeline.

**Columns:**
1. **Prospect** -- Mini-audit sent, no response yet
2. **Contacted** -- Response received, conversation active
3. **Meeting** -- Walkthrough call scheduled or completed
4. **Proposal** -- Sprint proposal sent, awaiting decision
5. **Won** -- Contract signed, deposit received
6. **Lost** -- Declined or went cold

**Card contents:**
- Business name
- Domain
- Vertical
- Mini-audit score (if available)
- Last contact date
- Next action + due date

**Quick actions per card:**
- Move to next/previous stage (drag or button)
- Add note
- Schedule follow-up (date picker)
- Trigger full audit
- Mark as lost (with reason)

**Data source:** Reads from clients table where `engagement_type = 'prospect'` or `engagement_type = 'lead'`. Won prospects transition to `engagement_type = 'sprint_client'`.

---

## Active Clients (/admin/clients)

Table view of all active clients (sprints + retainers).

**Columns:**
- Business name
- Domain
- Vertical
- Engagement type (sprint / retainer / monitoring-only)
- Current AI Readiness Score
- Sprint status (if applicable): Not Started / Week 1 / Week 2 / Week 3 / Week 4 / Complete
- Retainer tier (if applicable)
- Next action date

**Filters:**
- By vertical (dental, legal, HVAC, etc.)
- By engagement type
- By sprint status

**Sort options:**
- By score (ascending = most need attention)
- By next action date
- By business name
- By engagement start date

---

## Client Detail (/admin/clients/[id])

Comprehensive view of a single client.

**Header:**
- Business name, domain, vertical
- Contact name, email, phone
- Engagement type and start date
- Current score with trend indicator

**Tabs or Sections:**

**Score History:**
- Line chart showing AI Readiness Score over time
- Data points from each audit run
- Annotations for sprint milestones (start, midpoint, completion)

**Sprint Progress (if applicable):**
- Checklist of all sprint deliverables grouped by week
- Status per item: Pending / In Progress / Complete / Blocked
- Target completion date per item
- Notes field per item

**Deliverables:**
- All deliverables associated with this client
- Status, due date, completion date
- Link to generated artifacts (PDF reports, schema files)

**Monitoring Results:**
- Last 10 monitoring runs
- Score per platform (ChatGPT, Perplexity, Gemini, etc.)
- Query-level results (which queries mention the client)
- Trend arrows

**Notes & Timeline:**
- Chronological log of all interactions
- Add note button (with timestamp)
- Auto-logged events: audit completed, report sent, payment received, score changed

**Financial:**
- Total revenue from this client
- Payment history
- Current retainer amount (if applicable)
- Outstanding balance

---

## Audit Queue (/admin/audits)

Manage the audit pipeline.

**Sections:**

**Queued:**
- Audits waiting to run
- Business name, domain, requested by, queued timestamp
- Quick action: prioritize, cancel

**Running:**
- Currently executing audits
- Business name, domain, Inngest job ID, current step, elapsed time
- Progress indicator (which pipeline step is active)
- Quick action: view logs

**Completed:**
- Recently completed audits (last 30 days)
- Business name, domain, score, completion timestamp
- Links: View report PDF, view raw data, re-run audit
- Quick action: trigger new audit for same domain

**Failed:**
- Audits that errored
- Business name, domain, error message, failed step
- Quick action: retry, view logs

**New Audit Button:**
- Form: domain, business name (optional), competitor domains (optional)
- Triggers Inngest audit pipeline

---

## Monitoring Overview (/admin/monitoring)

Track all client monitoring in one view.

**Client Monitoring Table:**
- All clients with active monitoring
- Latest overall score
- Score delta since last run (with color coding: green = improved, red = declined, gray = unchanged)
- Last run timestamp
- Next scheduled run
- Quick action: trigger manual re-run

**Alerts Panel:**
- Visibility drops >20% for any client
- New competitors detected in AI responses
- Sentiment shifts (negative mentions appearing)
- Platform-specific alerts (e.g., dropped from ChatGPT but still in Perplexity)

**Alert actions:**
- Acknowledge (dismiss)
- Investigate (opens client detail)
- Escalate (create task / send email to client)

---

## Financial Overview (/admin/financials)

Revenue tracking without replacing Stripe as the source of truth.

**Metrics:**
- Revenue this month (total)
- Revenue by type: sprints, retainers, audits
- MRR (monthly recurring revenue from active retainers)
- Pipeline value by stage

**Client Revenue Table:**
- Client name
- Engagement type
- Total revenue to date
- Monthly retainer amount (if applicable)
- Last payment date
- Outstanding balance

**Outstanding Invoices:**
- Invoices sent but not paid
- Amount, client, days overdue
- Quick action: send reminder, mark as paid

**Data source:** Reads from clients table (`total_revenue`, `monthly_retainer_amount` fields) and syncs with Stripe via webhook for payment confirmations.

---

## Implementation Priority

### Day 1 (MVP) -- Build These First

These provide immediate operational value and are simple to implement:

1. **`/admin`** with overview stats (revenue, active counts, alerts)
2. **`/admin/clients`** list with filters and sort
3. **`/admin/audits`** queue (pending, running, completed, failed)
4. **Simple auth** -- NextAuth credentials provider with env-based email/password

Estimated effort: 8-12 hours with v0.dev scaffolding + refinement.

### Phase 2 -- Build When Friction Demands It

These replace manual workarounds only when the workaround becomes painful:

5. **`/admin/clients/[id]`** detail page (replace: reading DB directly)
6. **`/admin/monitoring`** overview (replace: checking email alerts)
7. **`/admin/pipeline`** kanban (replace: Notion CRM board)

### Phase 3 -- Build at Scale

These are unnecessary for solo operation but needed when scaling:

8. **`/admin/financials`** dashboard (replace: Stripe dashboard)
9. Rich monitoring alerts with thresholds and escalation rules
10. Client portal (client-facing view of their scores and reports)
11. Multi-user auth with role-based access

---

## What Replaces the Dashboard Until Built

Each dashboard feature has a manual equivalent that works fine at low volume:

| Dashboard Feature | Manual Replacement | Switch When |
|---|---|---|
| CRM / Pipeline | Notion board via MCP | >20 active prospects |
| Financial tracking | Stripe dashboard | >15 clients |
| Audit queue | CLI commands (`pnpm audit:run`) | >5 audits/week |
| Monitoring alerts | Email notifications via n8n | >10 monitored clients |
| Sprint tracking | Notion checklist template | >3 concurrent sprints |
| Client detail | Direct DB queries | >10 active clients |
| Reporting | Automated PDF via pipeline | Never (PDF is the product) |

---

## Technical Notes

**State management:** Server components for data fetching. No complex client state needed -- this is a read-heavy dashboard with occasional write actions.

**Data fetching:** All data comes from the PostgreSQL database via Drizzle ORM queries. No separate API layer needed -- use Next.js server components and server actions.

**Real-time updates:** Not needed for MVP. Polling on 30-second interval for audit queue status is sufficient. WebSockets deferred until scale demands it.

**UI framework:** shadcn/ui components. Use v0.dev to scaffold initial layouts, then refine. Key components: DataTable, Card, Badge, Chart (recharts), Kanban (custom or dnd-kit).

**Mobile:** Responsive but not mobile-first. This is a desktop tool. Ensure basic usability on tablet for checking alerts on the go.
