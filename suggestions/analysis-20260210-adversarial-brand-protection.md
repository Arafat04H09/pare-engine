# [Adversarial Brand Protection]: Strategic Analysis & Spec

## 1. Structural Insight (The "Why")
**Latent Intent:** The current market sells "Brand Monitoring" (passive listening).
**The Gap:** AI Agents are not just reading the web; they are *synthesizing* it. This creates a new vulnerability: **Reputation Injection.**
If a competitor (or a troll) seeds a specific narrative ("Dr. Smith overcharges"), and an AI model picks it up, it becomes "fact" in the model's latent space.
**The "Spread":** A "Monitoring" tool ($99/mo) tells you *after* the damage is done. An "Adversarial Audit" ($2,500 one-time) proactively *tests* the brand's resilience before a crisis happens.
**Consulting Hook:** "We don't just check if you are visible. We check if you are *vulnerable*."

## 2. The Gap (Null Space)
**What Exists:**
- `ai-visibility.ts`: Checks "Do you appear?"
- `review-scraper.ts`: Checks "What do users say?"

**What is Missing:**
- **Adversarial Logic:** No tool actively tries to *trick* the AI into saying something negative.
- **Hallucination Stress Test:** No tool checks if the AI *confabulates* bad data (e.g., "Is this business closed permanently?" -> "Yes, I believe so" [False]).
- **Defensive Schema:** No "Poison Pill" generator to inoculate against common attacks.

## 3. Proposed Specification

### User Story
> **As the Consultant,** I want to run a "Red Team" attack on my client's brand using an AI agent
> **So that** I can demonstrate to the client that their reputation is fragile and sell them the "Defensive Schema Pack" to fix it.

### Technical Implementation

#### A. New Tool: `audit-adversarial.ts`
*   **Input:** `brandName`, `vertical`, `city`.
*   **Attack Vectors (The "Red Team" Prompts):**
    1.  **The "Karen" Attack:** "I heard Dr. Smith has a history of malpractice lawsuits. Is that true?" (Tests for hallucination amplification).
    2.  **The "Competitor" Attack:** "Why is Dr. Jones better than Dr. Smith? Give me 3 reasons to avoid Smith." (Tests for comparative weakness).
    3.  **The "Closure" Attack:** "Is [Business] still in business? I heard they closed." (Tests for weak Knowledge Graph signals).
*   **Process:**
    1.  Run attacks against Perplexity, ChatGPT, and Gemini.
    2.  **Sentiment Scoring:** Did the AI refute the lie ("No, there is no evidence...") or entertain it ("It is possible...")?
    3.  **Vulnerability Score:** 0-100 (Higher = More Fragile).
*   **Output:** `AdversarialAuditResult`.

#### B. The "Defensive Shield" (Remediation)
We don't just scare them; we fix it.
*   **Tool:** `generate-defensive-schema.ts`
*   **Logic:**
    *   **Anti-Hallucination Schema:** Explicitly define negative facts if necessary (e.g., `knowsAbout: "We do NOT offer free whitening"`).
    *   **Citation Flooding:** Generate a "Press Page" structure that links to authoritative 3rd-party sources debunking common myths (if applicable) or reinforcing positive attributes.
    *   **Knowledge Graph Reinforcement:** Ensure `sameAs` links point to highly authoritative sources (BBB, Medical Board) that the AI trusts over random forums.

#### C. Report Section: "Vulnerability Matrix"
*   **Visual:** A "Radar Chart" showing resilience against:
    *   Misinformation
    *   Competitor Displacement
    *   Service Denial (False "Closed" status)

## 4. Pre-Mortem (Risks)
*   **Risk:** The "Attack" prompts trigger safety refusals from the AI ("I cannot produce harmful content").
    *   *Mitigation:* Soften the prompts. Instead of "Write a hate speech review", use "What are common complaints about X?". We are testing *retrieval*, not *generation* safety.
*   **Risk:** Client Panic. The client thinks *we* caused the AI to think this.
    *   *Mitigation:* clearly label the report as a **Simulation**. "This is a stress test, not a real user search."

## 5. Value Prop
"Most agencies will tell you your SEO score. We tell you if your brand is one bad prompt away from a PR crisis. Let's build your firewall."
