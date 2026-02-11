# [Feature Spec]: Multimodal & Community Signal Audit (The "Hidden Gems" Engine)

## 1. Structural Insight (The "Why")
**The Thesis:** The traditional "Local SEO" playbook (Google Business Profile + Website) is dead. The 2024+ landscape is dominated by:
1.  **Google's "Hidden Gems" Update:** Prioritizing forums (Reddit/Quora) and authentic human discussion.
2.  **Multimodal AI:** Gemini and OpenAI "watch" videos to generate answers.
3.  **Perplexity's Sourcing:** Heavy reliance on Reddit for "truth".

**The Gap:** `pare-engine` currently audits the *Website* (Tier A) and the *Brand Mentions* (Tier A). It completely ignores the **Community** (Reddit/Nextdoor) and **Video** (YouTube) layers. If a client has perfect JSON-LD but gets bashed on r/Austin or has zero video content for "How-to" queries, they lose the AI recommendation.

**The Leverage:**
*   **Competitors (Otterly, BrightLocal):** Do not audit Reddit sentiment or Video content structure.
*   **Our Edge:** We can scrape Reddit threads for the brand, analyze sentiment, and check for Video Schema presence—all via APIs we already use (Serper/Firecrawl).

## 2. The Null Space (What is Missing)
*   **Video Audit:** No check for `VideoObject` schema or YouTube channel presence.
*   **Forum Audit:** No check for "r/[City]" mentions or "best [service] reddit" visibility.
*   **Multimodal Consistency:** Does the YouTube thumbnail match the website branding? (Visual DNA extended).

## 3. Proposed Specification

### User Story
**As a Consultant,** I want to know if my client is visible in "Human" spaces (Reddit) and "Visual" spaces (YouTube), **so that** I can sell "Community Management" and "Video Optimization" sprints.

### Technical Implementation

#### A. New Tool: `audit-multimodal.ts`
*   **Input:** `brandName`, `vertical`, `city`.
*   **Component 1: The "Reddit Pulse"**
    *   **Logic:** Query Serper for `site:reddit.com "[Brand Name]" [City]`.
    *   **Analysis:**
        *   Count threads in last 12 months.
        *   Extract top 3 thread titles.
        *   Sentiment Check: Are they "Hidden Gems" (Positive recommendations) or "Warning Signs" (Complaints)?
    *   **Scoring:** "Community Trust Score" (0-100).
*   **Component 2: The "Video Void"**
    *   **Logic:** Query Serper for `[Service] [City] site:youtube.com`.
    *   **Check:** Is the client in the top 5 results?
    *   **On-Site Check:** Does the client's homepage have `VideoObject` schema? (Critical for Gemini Grounding).
    *   **Scoring:** "Visual Readiness Score" (0-100).

#### B. Database Schema Update
*   Add `community_signals` JSONB to `audit_results` table.
*   Add `video_signals` JSONB to `audit_results` table.

#### C. Report Section: "The Human & Visual Web"
*   **Visual:** "Reddit Radar" (Heatmap of sentiment).
*   **Visual:** "Video Gap" (Competitor's YouTube thumbnail vs. Your empty slot).
*   **Action Item:** "Sponsor a local YouTuber" or "Answer 5 questions on r/Austin."

## 4. Pre-Mortem (Risks)
*   **Risk:** Reddit API is expensive/closed.
    *   *Mitigation:* Use *Google Search* (`site:reddit.com`) via Serper (Tier 2 Integration). We don't need the Reddit API; we need to know what *Google sees* on Reddit.
*   **Risk:** "No Data" for small businesses.
    *   *Mitigation:* If 0 Reddit mentions found, the score isn't 0. The output is "Opportunity: Be the first to start the conversation." (Positive framing).
*   **Risk:** Sentiment nuance (Sarcasm).
    *   *Mitigation:* Use Claude Haiku for sentiment classification of thread titles. It detects sarcasm better than simple NLP.

## 5. Strategic Roadmap
1.  **Phase 1 (MVP):** Build the `audit-multimodal.ts` tool using Serper.
2.  **Phase 2 (Report):** Add the "Hidden Gems" section to the PDF.
3.  **Phase 3 (Product):** Sell a "Community Seeding" sprint (Writing helpful Reddit comments—transparently).

This moves `pare-engine` from "Technical SEO" to "Holistic Brand Engineering," aligning with the 2026 AI landscape where *trust* (Reddit) and *visuals* (Video) outrank keywords.
