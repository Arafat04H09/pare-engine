---
name: demo
description: >
  Run a quick stripped-down audit for sales demos. Uses 1 provider, 5 prompts,
  and generates a mini report in under 2 minutes.
argument-hint: "example.com [vertical]"
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Demo

You are running a quick demo audit of a business website for a sales call or prospect evaluation.

## When to Use

Use `/demo` when you need a fast audit result for:
- Live sales calls (must complete in ~2 minutes)
- Prospect qualification (is this business a good fit?)
- Showing the product to a potential client
- Quick sanity check before running a full audit

## Inputs

Required: A domain name: $0
Optional: A vertical (dental, legal, hvac, restaurant, etc.): $1

Example: `/demo example-dental.com dental`

## Process

1. **Quick Crawl**: Use Firecrawl to map the domain (limit: 10 pages) and crawl top 5 pages:
   ```typescript
   firecrawl.map(domain, { limit: 10 });
   firecrawl.crawl(domain, { limit: 5, formats: ['markdown', 'html'] });
   ```

2. **Single Provider Query**: Query ONE provider (Perplexity — fastest, has citations) with 5 prompts:
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

4. **Mini Report**: Generate a 1-page summary:
   - Overall score and grade
   - 5-pillar breakdown (visual bar chart)
   - Top 3 findings (biggest gaps)
   - CTA: "Want the full 9-page audit? Let's talk."

5. **Output**: Display the results inline and save to `pipeline/demo/demo-{domain}-{date}.md`.

## Output

- Inline summary with score, grade, and top findings
- Mini report saved to `pipeline/demo/`
- Timing: should complete in under 2 minutes

## Rules
- Speed over completeness — 1 provider, 5 prompts, 5 pages max
- Use the same scoring functions as the full audit (maintain accuracy)
- If Firecrawl or the provider fails, report what you can with available data
- Never promise full audit accuracy from a demo — always note it's a preview
- The demo report is NOT client-deliverable — it's for internal sales use
- Use `Promise.allSettled()` even with a single provider (consistent pattern)
