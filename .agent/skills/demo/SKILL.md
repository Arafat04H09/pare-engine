---
name: demo
description: Run a quick stripped-down audit for sales demos. 1 provider, 5 prompts, mini report in under 2 minutes.
---

# Skill: Demo

## Purpose
Run a quick demo audit of a business website for sales calls or prospect evaluation. Uses minimal resources (1 provider, 5 prompts, 5 pages) to generate a preview score and mini report in under 2 minutes.

## Inputs
Required: A domain name (e.g., `example-dental.com`)
Optional: A vertical (dental, legal, hvac, restaurant, etc.)

## Process

1. **Quick Crawl**: Use Firecrawl to map the domain (limit: 10 pages) and crawl top 5 pages with markdown + HTML formats.

2. **Single Provider Query**: Query Perplexity (fastest, has citations) with 5 prompts:
   - "[business name] [city] [vertical]"
   - "best [vertical] near [city]"
   - "[vertical] recommendations [city]"
   - "[business name] reviews"
   - "top rated [vertical] [city] [year]"

3. **Quick Score**: Run the 5 pillar scorers on available data:
   - AI Visibility (from single provider)
   - Content Quality (from crawled pages)
   - Schema/Structured Data (from crawled HTML)
   - Technical Readiness (robots.txt, llms.txt, sitemap)
   - Local/GBP (from query mentions + basic GBP check)

4. **Mini Report**: Generate a 1-page summary with:
   - Overall score and grade
   - 5-pillar breakdown
   - Top 3 findings (biggest gaps)
   - CTA: "Want the full 9-page audit?"

5. **Output**: Display results inline and save to `pipeline/demo/demo-{domain}-{date}.md`.

## Rules
- Speed over completeness — 1 provider, 5 prompts, 5 pages max
- Use the same scoring functions as the full audit (maintain accuracy)
- If Firecrawl or the provider fails, report what you can with available data
- Never promise full audit accuracy from a demo
- The demo report is NOT client-deliverable — it's for internal sales use
- Use `Promise.allSettled()` even with a single provider (consistent pattern)
