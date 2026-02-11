# [Competitor Recon]: Reverse Engineering & Strategic R&D

## 1. The Landscape: SaaS vs. The Engine
We are not competing with these tools on features. We are competing on **business model**. They sell subscriptions ($29–$989/mo); we sell the ability to *be* the agency ($0.63 marginal cost).

### Competitor Feature Matrix
| Feature | Otterly.ai | AthenaHQ | ZipTie.dev | BrightLocal | **Pare Engine** |
|:---|:---:|:---:|:---:|:---:|:---:|
| **AI Visibility Tracking** | ✅ (Core) | ✅ (Core) | ✅ (Core) | ❌ | ✅ (Tier A) |
| **Sentiment Analysis** | ✅ | ✅ | ✅ | ✅ (Reviews) | ✅ (Tier B) |
| **Implementation (Fixes)** | ❌ | ⚠️ (Content) | ⚠️ (Suggestions) | ❌ | ✅ **(Core IP)** |
| **Traditional Local SEO** | ❌ | ❌ | ❌ | ✅ (Core) | ✅ (Tier A) |
| **Cost Model** | SaaS ($29+) | SaaS ($295+) | SaaS ($99+) | SaaS ($39+) | **Self-Hosted ($0.63)** |
| **Client Reporting** | Dashboard | Dashboard | Dashboard | PDF | **White-label PDF** |

## 2. Reverse Engineering Findings
**How they likely work vs. How we will beat them.**

### A. The "AI Visibility Score" (Otterly/ZipTie)
*   **Mechanism:** They run a headless browser (Puppeteer/Playwright) to query ChatGPT/Gemini/Perplexity with `Brand Name + Geo` or `Service + Geo`. They parse the HTML/JSON response to count mentions.
*   **The Flaw:** They rely on *exact match* mentions.
*   **Our Edge:** We use **Semantic Grounding**. Our `accuracy-scorer.ts` (Tier B) doesn't just look for the name; it asks the LLM: "Does this response recommend Dr. Smith, even implicitly?" This captures "soft" recommendations that regex misses.

### B. "Content Optimization" (ZipTie/Athena)
*   **Mechanism:** They likely scrape the client site and compare keyword density / topic coverage against top-ranking competitors (TF-IDF or vector similarity).
*   **The Flaw:** They optimize for *keywords*.
*   **Our Edge:** We optimize for **Answer Structure**. Our `content-optimizer.ts` (Tier C) forces the content into the "Direct Answer" format (Q&A style, bullet points, JSON-LD) that LLMs prefer for retrieval. We don't just say "add keyword X"; we say "Wrap this paragraph in `<script type="application/ld+json">`."

## 3. Novel R&D Initiatives (The Null Space)
These are tools that no competitor currently offers, leveraging our "Consulting Engine" agility.

### Initiative 1: The "Real-Time Voice Audit" (High Priority)
*   **Concept:** AI Search isn't just text. It's voice (Siri, Gemini Live).
*   **The Tool:** An automated agent (Twilio/Vapi) calls the business phone number.
*   **The Test:**
    1.  "Are you open right now?" (Verifies hours consistency).
    2.  "Do you do Invisalign?" (Verifies service knowledge).
*   **The Output:** A recording + transcript + "Receptionist Score" in the audit PDF.
*   **Why:** Otterly can't do this (too intrusive for SaaS). A consultant *can* do this (high-touch).

### Initiative 2: Visual Search Sabotage Detection
*   **Concept:** Google Lens and Gemini are visual.
*   **The Tool:** Upload the client's storefront image to Google Lens API.
*   **The Test:** "What business is this?"
*   **The Threat:** If Google Lens identifies the storefront as "Generic Building" or a competitor's old listing, the client is invisible to visual search.
*   **Why:** No competitor tracks "Visual SEO" yet.

### Initiative 3: "Agentic Negotiation" (Long Term)
*   **Concept:** Fix inconsistent NAP (Name, Address, Phone) automatically.
*   **The Tool:** An AI agent that fills out the "Suggest an Edit" forms on 50+ directories or even emails directory admins.
*   **Why:** BrightLocal charges $3/site for manual citation building. We can automate it for $0.05.

## 4. Actionable Suggestions (Strategic Roadmap)

### Immediate (Add to Pipeline)
1.  **Enhance `analyze-competitor.ts`:**
    *   Add **"Share of Voice" Matrix**: Instead of just 1 vs 1, run 1 vs Top 5 for a specific keyword set. (Matches ZipTie's "Market Share").
    *   Add **"Sabotage Check"**: Check if competitors are bidding on the client's brand name in Ad Transparency centers.

### Mid-Term (New Tools)
2.  **Build `audit-voice.ts`:**
    *   Integration: Twilio API.
    *   Cost: $0.02/call.
    *   Value: Increases audit perceived value by $100+.

### Long-Term (Moat)
3.  **The "Fix-It" API:**
    *   Turn our `generate-jsonld.ts` and `generate-llmstxt.ts` into a standalone API.
    *   Allow *other* agencies to use our engine for *their* audits (turning competitors into customers).

## 5. Summary
We are not building a dashboard. We are building a **weapon** for consultants. While competitors focus on *monitoring* the decline, we focus on *generating* the fix. The "Voice Audit" and "Visual Audit" are the next frontiers to prove that `pare-engine` is generations ahead of the SaaS incumbents.
