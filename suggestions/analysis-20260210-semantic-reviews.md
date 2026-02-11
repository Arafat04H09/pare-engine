# [Feature Spec]: Semantic Review Orchestration (The "Voice of Customer" Injection)

## 1. Structural Insight (The "Why")
**Latent Intent:** The "Consulting Engine" thesis rests on the "Audit → Fix → Verify" loop. We fix schema, content, and technical debt. But we ignore the most powerful external signal: **User Generated Content (UGC)**.
**The Mechanism:** AI models (Gemini, ChatGPT) trust "Voice of Customer" data (Reviews, Reddit threads) more than "Voice of Brand" data (Website copy).
*   *Website:* "We offer the fastest emergency dental service." (AI skepticism: High).
*   *Review:* "I called at 2am and Dr. Smith saw me in 20 minutes." (AI trust: High).
**The Gap:** Most local businesses ask for "a review." They get: "Great service, 5 stars." This is useless for AI retrieval.
**The Innovation:** We don't just ask for reviews. We **orchestrate the semantics** of the reviews. We tell the client: "You need 5 reviews that mention '2am', 'emergency', and 'root canal' to win the 'Emergency Dentist' query."

## 2. The Gap (Null Space)
*   **Existing:**
    *   `ai-visibility.ts`: Tracks if we rank.
    *   `content-optimizer.ts`: Optimizes *our* words.
*   **Missing:**
    *   `generate-review-campaign.ts`: Optimizes *their* words.
    *   No tool analyzes the *semantic gap* in existing reviews (e.g., "Competitor has 50 mentions of 'Invisalign', you have 2").

## 3. Proposed Specification

### User Story
**As the Consultant,**
I want to analyze the semantic gap between my client's reviews and the top-ranking competitor's reviews,
**So that** I can generate a "Review Request Campaign" that explicitly guides customers to use the specific keywords (e.g., "gentle", "financing") that will trigger AI recommendations.

### Technical Implementation

#### A. New Tool: `packages/core/src/tools/analyze-review-semantics.ts`
*   **Input:** `clientReviews[]`, `competitorReviews[]` (Fetched via `google-places.ts` or `apify`).
*   **Process:**
    1.  **Tokenization:** Extract n-grams (1-3 words) and entities (using `compromise` or `claude-haiku`).
    2.  **Sentiment Mapping:** Associate keywords with positive/negative sentiment.
    3.  **Gap Analysis:**
        *   "Competitor wins on: 'pricing', 'payment plan', 'insurance'."
        *   "Client wins on: 'friendly', 'parking'."
    4.  **Target Selection:** Identify the top 3 missing semantic clusters.

#### B. New Tool: `packages/core/src/tools/generate-review-campaign.ts`
*   **Input:** `missingSemanticClusters[]` (e.g., ["Payment Plans", "Emergency"]).
*   **Process:**
    1.  **Prompt Engineering:** Ask Claude Haiku to generate 3 distinct "Request Scripts" (Email/SMS/QR Code context).
    2.  **Psychological Nudge:** "Don't just say 'leave a review'. Say: 'Could you mention how our *payment plan* helped you?'"
*   **Output:** `ReviewCampaignArtifacts`
    *   *Email Template:* "Subject: Quick question about your payment plan experience..."
    *   *SMS:* "Hi [Name], glad we could help! If you have a sec, mentioning our [Service] helps others find us..."
    *   *Q&A Seed:* "Question: Do you offer payment plans? Answer: Yes, and our patients love it (see reviews)."

#### C. Integration (Web Admin)
*   **Route:** `/admin/audit/[id]/reviews`
*   **UI:**
    *   **Semantic Cloud:** Visual comparison of Client vs. Competitor keywords.
    *   **Campaign Builder:** Copy-paste ready templates.
    *   **GBP Q&A Sync:** Button to "Post FAQ to GBP" (Using the Q&A Seeding strategy).

## 4. Pre-Mortem (Risks & Mitigations)
*   **Risk:** "Review Gating" or Solicitation Policy violations.
    *   *Mitigation:* We never *force* keywords or gate negative reviews. We use **Psychological Priming** (asking a specific question) rather than "Incentivized Reviews." The tool must include a disclaimer: "For educational/suggestion purposes only. Do not offer rewards for reviews."
*   **Risk:** Artificial sounding reviews.
    *   *Mitigation:* The prompts must ask the customer to describe *their* experience with a topic, not just "paste this text."
*   **Risk:** Low response rate.
    *   *Mitigation:* The "Consulting" value is providing the *strategy*, not guaranteeing the *click*. Even 3 semantic reviews can flip a ranking.

## 5. Strategic Value
This moves Pare Engine from "Passive Observer" (Reporting) to "Active Participant" (Influence). It turns the "Black Box" of AI ranking into a solvable "Word Problem" for the client.
