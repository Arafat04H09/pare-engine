# [Novel Tools]: Blue Ocean R&D Specification

## 1. Strategic Thesis
Competitors focus on **Digital SEO** (text, links, metadata).
Pare Engine's "Consulting Thesis" focuses on **Business Reality**.
The "Blue Ocean" opportunity lies in the intersection of **AI Agents** and **Physical Business Operations**.
We will build tools that simulate *future* AI customers (Agents) interacting with the business.

## 2. The "Blue Ocean" Specs

### A. The "Voice Agent Drill" (The Receptionist Audit)
**Insight:** A local business's "last mile" is the phone. If an AI Assistant (like Gemini Live or Siri) calls to book a table and the receptionist is rude or the IVR is a maze, the AI hangs up and calls the next place. No SEO tool tests this.
**User Story:** "As a Consultant, I want to deploy a 'Mystery Shopper Bot' that calls the client's front desk, asks 'Do you accept new patients?', and grades the interaction."

**Technical Implementation:**
*   **Infrastructure:** Twilio Voice API + OpenAI Realtime API (or Vapi.ai for simpler dev).
*   **Flow:**
    1.  User enters phone number + Script ("Ask for pricing on X").
    2.  Pare initiates call.
    3.  AI Agent executes script.
    4.  **Grading:**
        *   Did a human pick up? (Latency).
        *   Was the answer clear?
        *   Sentiment analysis of the receptionist.
*   **Deliverable:** An audio recording of the call embedded in the Audit PDF + a "Phone Readiness Score."

**Value:** "Your SEO is perfect, but your front desk hung up on a $5,000 lead. Fix this."

### B. The "Agentic Commerce Simulator" (The Transaction Audit)
**Insight:** Future AI agents will execute transactions (booking, buying). They don't read marketing copy; they look for semantic actions.
**User Story:** "As a Consultant, I want to see if an autonomous agent can actually *complete* a conversion goal on the client's site."

**Technical Implementation:**
*   **Tool:** `packages/core/src/tools/agentic-sim.ts`
*   **Stack:** Puppeteer + `LLM-driven-navigation` (e.g., encoded screenshot -> "Where do I click to buy?").
*   **Flow:**
    1.  Goal: "Find a Product > Add to Cart > Reach Checkout".
    2.  Agent attempts task.
    3.  Log: "Stuck at Cookie Banner", "Button not semantic", "Form blocked by captcha".
*   **Score:** "Agent Friction Index" (0-100).

**Value:** "ChatGPT tried to buy your product but got stuck on your pop-up. You are invisible to the Agent Economy."

### C. Visual Brand DNA (The Hallucination Check)
**Insight:** AI models are multi-modal. They "see" the brand. If the website logo is blue, the GBP photo is an old red logo, and the Instagram avatar is white, the AI gets confused about brand identity.
**User Story:** "As a Consultant, I want to know if the client's visual identity is consistent across all surfaces."

**Technical Implementation:**
*   **Tool:** `packages/core/src/tools/visual-dna.ts`
*   **Process:**
    1.  Scrape: Website Logo, Favicon, GBP Cover Photo, Facebook Profile Pic.
    2.  Analysis: Send images to GPT-4o-vision.
    3.  Prompt: "Do these images represent the same brand? Rate consistency 0-10."
*   **Output:** "Visual Dissonance Alert."

**Value:** "Your digital footprint looks like 3 different companies. This lowers trust for both Humans and AIs."

## 3. Prioritized Roadmap

| Priority | Tool | Complexity | Why Now? |
| :--- | :--- | :--- | :--- |
| **P1** | **Visual Brand DNA** | Low | Uses existing Vision models. High visual impact in PDF. |
| **P2** | **Agentic Commerce** | Medium | Puppeteer exists. Logic is complex but scalable. |
| **P3** | **Voice Agent Drill** | High | Requires Twilio setup/costs + legal consent (recording laws). |

## 4. Pre-Mortem (Risks)
*   **Voice Recording Laws:** Recording calls requires consent in many jurisdictions (Two-Party Consent states).
    *   *Mitigation:* **Strict "Operator Only" Mode.** The Consultant must own the number or get explicit written permission. The tool must announce "This is an automated test call" immediately.
*   **Agent loops:** The Commerce Simulator might spam the client's cart.
    *   *Mitigation:* Abort after 5 steps. Do not submit final payment forms (stop at Checkout UI).

## 5. Recommendation
Start with **Visual Brand DNA**. It fits perfectly into the "Content Quality" pillar of the existing audit and requires no new infrastructure (just an LLM call with images).