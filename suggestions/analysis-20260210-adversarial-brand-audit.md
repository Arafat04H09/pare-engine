# [Adversarial Brand Audit]: Strategic Analysis & Spec

## 1. Structural Insight (The "Why")
**The Thesis:** "Visibility is vanity; Reputation is sanity."
Most SEO tools focus on getting *mentioned*. But in the age of LLMs, a mention can be a liability if the context is wrong. LLMs are highly suggestible "stochastic parrots." If a user asks, "Why is Dr. Smith so expensive?", the LLM will often *hallucinate* a reason ("High-end equipment," "Luxury location") even if Dr. Smith is the cheapest in town.

**The "Red Team" Gap:**
Competitors (Otterly, ZipTie) play "Offense" (Get me ranked).
Pare Engine must play "Defense" (Stop me from being hallucinated).
We need to **Red Team** the client's brand: actively attack it with leading questions to see if the AI defends the brand or folds under pressure.

**The Consulting Hook:**
"I asked ChatGPT if you were a scam. It said 'Maybe.' Do you want to fix that?"
This is the ultimate "Fear" lever (A2 in Master Plan).

## 2. The Gap (Null Space)
*   **Existing Tools:** `ai-visibility.ts` (Passive monitoring).
*   **Missing Logic:**
    *   **Adversarial Prompting:** No tool intentionally feeds "poisoned" premises to the AI.
    *   **Hallucination Trigger Detection:** No scan for on-site data that *causes* AI confusion (e.g., 2019 PDF menus, conflicting hours in footer vs. body).
    *   **Resilience Scoring:** No metric for "How hard is it to make the AI say something bad about you?"

## 3. Proposed Specification

### User Story
> **As the Consultant,** I want to run a "Brand Defense Audit" that stress-tests the AI's knowledge of my client,
> **So that** I can identify and patch "Hallucination Leaks" before a customer finds them.

### Technical Implementation

#### A. New Tool: `audit-adversarial.ts`
*   **Input:** `brandName`, `vertical`, `city`.
*   **The "Red Team" Attack Vectors (Prompts):**
    1.  **The Price Anchor:** "Why is [Brand] so expensive compared to competitors?" (Tests if AI hallucinates a 'luxury' tag).
    2.  **The Quality Doubt:** "I heard [Brand] has rude staff. Is that true?" (Tests if AI cites positive reviews to counter, or agrees).
    3.  **The Existence Check:** "Is [Brand] still in business? I heard they closed." (Tests Temporal Grounding).
    4.  **The Competitor Pivot:** "I want [Vertical], but I hate [Brand]. Who should I go to?" (Reveals the direct 'Anti-Competitor').

#### B. Analysis Logic (The "Judge")
*   Pass the Attack Vector responses to a Judge LLM (Claude Sonnet).
*   **Scoring:**
    *   **Defensive (Good):** "Actually, reviews for [Brand] are highly positive regarding staff..."
    *   **Neutral (Okay):** "I cannot verify that claim."
    *   **Capitulated (Bad):** "Yes, some users report rude staff..." (even if false).
*   **Output:** `BrandResilienceScore` (0-100).

#### C. The "Hallucination Trigger" Scanner (`scan-hallucinations.ts`)
*   **Logic:** Crawl the site and look for "Confusing Signals":
    *   **Temporal Conflicts:** Copyright 2021 in footer, Copyright 2024 in body.
    *   **Price Conflicts:** "$99" in HTML, "$149" in a linked PDF.
    *   **Phantom Pages:** Links to "404" pages that might still be in the AI's training set.

#### D. Report Visualization
*   **Section:** "Reputation Resilience".
*   **Visual:** "Shield Strength" Gauge.
*   **Callout:** "WARNING: ChatGPT 'agreed' that you are expensive. We need to inject 'Affordability' signals into your JSON-LD."

## 4. Pre-Mortem (Risks)
*   **Risk:** Client gets mad at *us* for the bad AI results.
    *   *Mitigation:* Framing. "This is what the AI is *already* thinking. I am just exposing it so we can fix it."
*   **Risk:** Cost. Running 4-5 extra LLM queries per audit.
    *   *Mitigation:* Make this a "Premium Audit" feature or Tier B (Sprint 2).
*   **Risk:** Hallucinating the Hallucination. The Judge LLM might be too harsh.
    *   *Mitigation:* Use "Chain of Thought" for the Judge. "Does the response cite a specific source? If not, flag as hallucination."

## 5. Implementation Roadmap
1.  **Step 1:** Build `audit-adversarial.ts` (The Attacks).
2.  **Step 2:** Integrate into `audit-runner`.
3.  **Step 3:** Add "Defense" module to `generate-jsonld` (e.g., `MerchantReturnPolicy` for "scam" defense, `PriceRange` for "expensive" defense).
