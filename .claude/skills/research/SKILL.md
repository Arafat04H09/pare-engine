---
name: research
description: >
  Hypothesis-driven investigation. Tests beliefs, prioritizes disconfirmation,
  writes durable findings to knowledge/. Reads dispatch briefs for focused parallel
  execution, or runs standalone on a topic.
argument-hint: "[topic-or-thread-brief]"
allowed-tools: Read, Write, Edit, Grep, Glob, WebSearch, WebFetch, Bash(git log *)
context: fork
---

# Research — Hypothesis-Driven Investigation

You are conducting research to test hypotheses and reduce uncertainty for the Pare Engine development strategy. Research is investigation, not information gathering — you are trying to prove or disprove specific beliefs, not accumulate facts.

**The research failure mode is confirmation bias.** You will be tempted to search for evidence that supports the hypothesis. Instead, search for evidence that would DISPROVE it. If you can't disprove it after genuine effort, confidence goes up. If you find contradicting evidence, that's the most valuable output.

## Inputs

Determine what to investigate:

**If $ARGUMENTS is a file path** (e.g., `pipeline/1.5-dispatch/thread-1-geo-2026-02-11.md`): Read that file directly. It is a self-contained dispatch thread brief with pre-framed hypotheses, questions, search strategy, anti-scope, and output location. Execute that thread only — stay within its scope.

**If $ARGUMENTS is a topic** (not a file path): That is the primary investigation topic. Frame it as a hypothesis before researching.

**If neither:** Read the most recent gap analysis from `pipeline/1-gap-analysis/` — focus on "Research Questions" and "Hypotheses to Test" sections. Pick the highest-priority questions.

Also read for context:
- `knowledge/` — What we already know. Don't re-investigate high-confidence knowledge. Build on it.
- `PRODUCT_PLAN.md` — What features are planned (contextualizes why questions matter)
- `CLAUDE.md` — Settled decisions (do NOT research alternatives to these)

## Process

### 1. Frame Hypotheses

Before any search, state each hypothesis explicitly:

> **H1:** We believe [specific claim]. This matters because [decision it affects].
> **Disconfirmation criteria:** This hypothesis is wrong if [specific evidence].
> **Current confidence:** [high/medium/low] based on [source].

If you received a dispatch brief, the hypotheses are pre-framed. If not, extract them from the gap analysis or topic.

### 2. Information Foraging — Breadth First

For each hypothesis, start broad:
- Run 2-3 diverse web searches using different framings
- Scan results for relevance — don't deep-dive yet
- Note which sources look most promising
- Check official documentation first, then blog posts, then forums

**Search strategy per domain:**
- **GEO/Market:** Search for recent studies (2025-2026), conference talks, case studies
- **Technical/API:** Check official docs first, then changelogs, then community forums
- **Competitive:** Search competitor websites, review sites, feature comparison posts
- **Scoring:** Search for academic/industry research on AI citation factors, ranking studies

### 3. Depth on Signal — Disconfirmation Priority

Go deep on the most promising sources, but prioritize sources that might DISPROVE the hypothesis:

- If 3 sources confirm the hypothesis → look for the 1 source that contradicts
- If you find contradicting evidence → investigate it thoroughly before dismissing
- Track the strongest argument FOR and AGAINST each hypothesis

**ACH (Analysis of Competing Hypotheses) method:**
1. List all plausible hypotheses (not just the one you started with)
2. For each piece of evidence, assess which hypotheses it supports/contradicts
3. The surviving hypothesis is the one with the least contradicting evidence
4. If multiple hypotheses survive equally, note the ambiguity — don't force a conclusion

### 4. Saturation Check

Stop researching a hypothesis when:
- **3+ independent sources agree** and no contradicting evidence found → High confidence
- **Contradicting evidence found** → Document both sides, note the specific disagreement
- **No relevant sources after 5+ searches** → Low confidence, flag as genuinely unknown
- **Diminishing returns** → New searches are returning the same information

Do NOT continue researching past saturation. More searches ≠ more knowledge after the saturation point.

### 5. Extract Actionable Findings

For each hypothesis investigated, extract:
- **Verdict:** Confirmed / Disconfirmed / Ambiguous / Insufficient evidence
- **Confidence level:** High / Medium / Low
- **Key evidence:** The 2-3 most important data points (with source URLs)
- **Implications for Pare:** What this means for what we build and how
- **Decision change:** If this changes a previous decision, state explicitly what changed and why

### 6. Identify Durable Knowledge

Separate findings into:
- **Durable** — Facts that won't change soon (API pricing, competitor features, research findings) → Write to `knowledge/`
- **Ephemeral** — Context-specific to this cycle (which gap to prioritize, what to build next) → Pipeline artifact only

### 7. Cross-Reference

After investigating all hypotheses:
- Do any findings contradict each other?
- Do any findings contradict existing `knowledge/` entries?
- Do any findings contradict VISION.md assumptions?
- Are there emergent patterns across findings?

## Output

**If executing a dispatch thread:** Write to the path specified in the thread brief (e.g., `pipeline/2-research/thread-N-[domain]-YYYY-MM-DD.md`).

**If running standalone:** Write to `pipeline/2-research/research-YYYY-MM-DD.md`.

The output MUST contain:

1. **Hypotheses Investigated** — Numbered list with original hypothesis, disconfirmation criteria, and verdict

2. **Per-Hypothesis Findings:**
   - Evidence FOR (with source URLs)
   - Evidence AGAINST (with source URLs)
   - Verdict + confidence level
   - Implications for Pare
   - Decision changes triggered

3. **Cross-Reference Results** — Contradictions with existing knowledge, vision, or other findings

4. **Durable Knowledge Extracted** — List of findings written to `knowledge/` with file paths

5. **New Questions Discovered** — Questions that emerged during research that weren't in the original brief

6. **Unknowns Remaining** — What we still don't know after this investigation

## Updating Knowledge

After completing research, write durable findings to `knowledge/`:

- New findings → Create file in appropriate subdirectory
- Updated findings → Edit existing file, update `Last verified` date
- Contradictions → Add "Contradiction" section to existing file with both views

Use the standard knowledge file format (see `knowledge/README.md`).

## Refining Vision & Product Plan

VISION.md and PRODUCT_PLAN.md are **living documents**. If research reveals evidence that contradicts them:

- If market data shows the beachhead market should shift, update the Beachhead Market section
- If competitor tools have closed gaps Pare was relying on as differentiators, update Competitive Landscape
- If pricing research shows the revenue model needs adjustment, update it
- If new API capabilities enable features previously marked DEFERRED, update PRODUCT_PLAN.md

Add `<!-- Updated by research — YYYY-MM-DD -->` to any changed sections.

**Stable** (don't change without user discussion): core thesis, three-layer architecture, unified principles.
**Fluid** (update with evidence): market targets, pricing, feature priorities, competitive positioning, technical choices.

## Rules
- **Hypotheses before searches.** Frame what you're testing before you start looking.
- **Disconfirmation over confirmation.** Actively search for evidence that contradicts the hypothesis.
- **Always cite sources with URLs.** Every factual claim needs a source.
- **Distinguish facts from speculation.** Label confidence levels explicitly.
- **Respect anti-scope.** If you received a dispatch brief, stay within your thread's scope.
- **Write durable knowledge.** Findings that will be useful in future cycles go to `knowledge/`, not just the pipeline artifact.
- **Stop at saturation.** Research reduces uncertainty. If uncertainty isn't decreasing, stop.
- **Do not research settled decisions.** CLAUDE.md documents architecture that is final. Don't re-evaluate Puppeteer vs React-PDF.
- **Focus on actionable intelligence.** Every finding should change or confirm a decision. "Interesting but irrelevant" is not a useful finding.
