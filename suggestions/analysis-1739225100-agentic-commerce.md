# Feature: Agentic Commerce Readiness Audit (The "UCP" Check)

**Date:** February 10, 2026
**Status:** Proposed
**Owner:** System Architect
**Inspiration:** Emerging "Agentic Commerce" trend (Google UCP, OpenAI ACP), Lack of existing audit tools.

---

## 1. Structural Insight (The "Why")

**Market Reality:** The next wave of SEO isn't just about *answering questions*; it's about *executing transactions*.
**Emerging Tech:**
- **Google UCP (Universal Commerce Protocol):** Standardizing how AI agents discover and buy products.
- **OpenAI ACP:** "Instant Checkout" in ChatGPT.
**The Opportunity:** No competitor (Otterly, AthenaHQ) is auditing for this yet. They are stuck on "Visibility."
**The Value Prop:** "I won't just make you visible; I'll make you **buyable** by AI agents." This justifies a $5,000+ "Future-Proofing" sprint.

## 2. The Gap (Null Space)

**Current Capabilities:**
- `schema-completeness.ts`: Checks for generic `LocalBusiness` schema.
- `content-quality.ts`: Checks for "Answer First".

**Missing Logic:**
- **Transactional Schema:** We don't check for `Offer`, `priceCurrency`, `availability`, or `sku` properties required by UCP.
- **API Accessibility:** We don't check if the site blocks `GPTBot` from accessing *pricing* pages (common mistake).
- **Feed Validation:** No check for `MerchantReturnPolicy` or `shippingDetails`.

## 3. Proposed Specification

### User Story
> **As the Consultant,** I want to run an "Agentic Commerce Check" for e-commerce clients
> **So that** I can sell a premium "AI Storefront" setup package.

### Technical Implementation

#### A. New Tool: `audit-agentic-commerce.ts`
*   **Input:** `domain`, `productUrl` (optional)
*   **Process:**
    1.  **Crawl:** Fetch a product/service page.
    2.  **Schema Check (Strict):** Validate against Google UCP spec (not just Schema.org).
        *   Must have: `price`, `currency`, `availability` (InStock).
        *   Must have: `MerchantReturnPolicy`.
    3.  **Bot Access Check:** Verify `robots.txt` allows `GPTBot` and `Google-Extended` specifically on `/product/*` paths.
    4.  **Complexity Analysis:** Is the "Add to Cart" flow accessible to a headless browser, or trapped behind complex JS/captchas? (Agent breaker).
*   **Output:** `AgenticReadinessScore` (0-100).

#### B. Report Section
*   **Title:** "Are You Ready for AI Shoppers?"
*   **Visual:** "Traffic Light" system.
    *   🔴 **Blocked:** AI Agents cannot see your price.
    *   🟡 **Visible:** AI Agents see you, but cannot buy (missing policy data).
    *   🟢 **Buyable:** Fully UCP compliant.

## 4. Pre-Mortem

**Risk:** Niche appeal. Only applies to e-commerce or booking-based local services (e.g., spas).
**Fix:** Make this a *conditional* module. Only run if `vertical === 'ecommerce'` or user enables it.

**Risk:** Spec volatility. UCP/ACP standards are changing.
**Fix:** Hardcode the *current* minimal set (Price, Stock, Policy) which is unlikely to change, rather than the full experimental spec.
