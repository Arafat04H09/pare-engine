---
name: research
description: Deep research on GEO, AI engine behaviors, competitor tools, API capabilities, and market trends.
---

# Skill: Research

## Purpose
Conduct deep research to inform the Pare Engine development strategy. Reads research questions from the most recent gap analysis and investigates them using web search, official documentation, and competitor analysis.

## Inputs

Read the most recent gap analysis from `pipeline/1-gap-analysis/` — focus on the "Research Questions" section.

If a specific topic was provided by the user, prioritize that topic.

Also read for context:
- `PRODUCT_PLAN.md` — What features exist and what is planned
- `CLAUDE.md` — Architectural constraints (do not research alternatives to settled decisions)

## Process

1. **Extract Research Questions**: From the gap analysis, identify 3-7 specific questions. If the user provided a specific topic, that is the primary question.

2. **Search Strategy**: For each question, conduct 2-3 web searches using different angles:
   - Official documentation (OpenAI, Google, Perplexity, Firecrawl, Inngest, Vercel AI SDK)
   - Recent blog posts and changelogs (2025-2026)
   - Competitor analysis (BrightLocal, Semrush, Moz for GEO features)
   - Technical specifications (API schemas, rate limits, pricing)

3. **Cross-Reference**: Verify claims across multiple sources. Flag single-source claims.

4. **Extract Actionable Data**: For each finding, extract:
   - Specific API endpoints, schemas, or configuration
   - Pricing / rate limits / quotas
   - Code examples or integration patterns
   - Competitor feature comparisons

5. **Identify Opportunities**: Look for capabilities competitors do not offer but are technically feasible with existing Pare architecture.

## Output

Write to `pipeline/2-research/research-YYYY-MM-DD.md` using the template in `templates/research-brief.md` in this directory.

The output MUST contain:
- Research questions addressed (numbered, matching gap analysis)
- Per-question findings with cited sources (URLs)
- Raw data tables (API pricing, feature matrices, etc.)
- "Implications for Pare" section per finding
- "New Opportunities Discovered" section
- "Unknowns Remaining" section

## Rules
- Always cite sources with URLs
- Distinguish between confirmed facts and speculation
- Do not research alternatives to settled architectural decisions (no React-PDF, no custom crawlers)
- Focus on actionable intelligence, not general knowledge
- Prioritize official documentation over blog posts
