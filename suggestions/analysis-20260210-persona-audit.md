# [Persona-Driven AI Audit]: The "Demographic Penetration Test"

## 1. Structural Insight (The "Why")
**Latent Need:** Most SEO tools track "Keywords" (e.g., "Best Dentist Austin"). But AI models don't just process keywords; they process **Intent** and **Context**.
A query from a "Budget-Conscious Student" yields different results than one from a "Luxury Cosmetic Patient," even if they both ask "Who is a good dentist?" because the AI infers context from the conversation history or prompt phrasing.

**The Gap:** `pare-engine` currently runs audits using a "Neutral/Generic" persona. This gives a baseline, but fails to capture the *nuance* of the market.
**The Opportunity:** By simulating specific buyer personas, we can tell the client: *"You own the high-end market, but you are completely invisible to families."*
This creates a powerful narrative for **Content Strategy** (the $3,000 sprint): *"We need to build a 'Family Care' page to capture that lost persona."*

## 2. The Null Space
*   **Existing:** `ai-visibility.ts` runs static queries.
*   **Missing:**
    *   **Persona Generator:** Logic to determine *which* personas matter for a vertical.
    *   **Prompt Injector:** Mechanism to wrap standard queries in a "Role-Playing" wrapper.
    *   **Matrix Reporting:** A "Persona vs. Visibility" heatmap.

## 3. Proposed Specification

### User Story
> **As a Consultant**, I want to select "3 Key Personas" (e.g., Anxious Patient, Price Shopper, Quality Seeker) and see how my client ranks for *each* of them, **so that** I can identify demographic blind spots.

### Technical Implementation

#### A. New Tool: `generate-personas.ts`
*   **Input:** `vertical` (e.g., "Dental"), `count` (default 3).
*   **Logic:**
    *   Call Claude Haiku: "Identify the top 3 distinct buyer personas for {vertical}. Return their 'System Prompt' description and 'Top 3 Concerns'."
*   **Output:**
    ```typescript
    interface Persona {
      name: string; // e.g., "The Anxious Patient"
      description: string; // "You are terrified of pain. You value sedation and gentle manner above price."
      searchStyle: string; // "Tentative, asking about pain relief"
    }
    ```

#### B. Modified Tool: `ai-visibility.ts`
*   **Update:** Add optional `persona: Persona` argument.
*   **Prompt Engineering:**
    *   *Standard:* "Who is the best dentist in Austin?"
    *   *Persona-Injected:* "Act as {persona.description}. Ask: 'Who is the best dentist in Austin for someone like me?'"

#### C. Reporting Layer
*   **New Section:** "Demographic Blind Spots".
*   **Visualization:** Radar Chart.
    *   Axes: The 3-5 Personas.
    *   Data: Visibility Score (0-100).
    *   *Insight:* "Your brand is strong on 'Cosmetic' but weak on 'Emergency'."

## 4. Pre-Mortem (Risks)
*   **Risk:** **Hallucination Variance.** Does the AI *really* change results based on persona?
    *   *Validation:* We must test this. If results are identical across personas, the feature is "Snake Oil."
    *   *Mitigation:* Use "Long-tail" persona prompts that explicitly ask for features (e.g., "cheap", "payment plans") to force differentiation.
*   **Risk:** **Token Cost.** Running 5 personas x 20 queries = 100 queries.
    *   *Mitigation:* Run Persona Audits only on the "Top 5" most important queries, not the full list.

## 5. Strategic Value
This moves `pare-engine` from **Technical SEO** (Robots) to **Marketing Strategy** (Humans). It bridges the gap between the CTO (Technical Audit) and the CMO (Persona Audit).
