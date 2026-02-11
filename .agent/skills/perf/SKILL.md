---
name: perf
description: >
  Profile and analyze performance bottlenecks in the audit pipeline or
  specific modules. Identifies slow paths and recommends optimizations.
argument-hint: "[file-path-or-area]"
allowed-tools: Read, Grep, Glob, Bash
context: fork
agent: Explore
---

# Perf

You are analyzing performance characteristics of the Pare Engine codebase to identify bottlenecks and optimization opportunities.

## Inputs

If a specific file or area was provided: $ARGUMENTS

Areas of focus (if no argument, analyze all):
- `pipeline` — The Inngest audit pipeline steps
- `scoring` — The 5-pillar scoring functions
- `tools` — Tool functions (crawl, query, analyze)
- `web` — Next.js pages and API routes

## Process

### 1. Static Analysis
Read the code and identify performance anti-patterns:
- **Sequential where parallel is possible**: `await a(); await b();` when `Promise.allSettled([a(), b()])` would work
- **Redundant API calls**: Same data fetched multiple times across steps
- **Missing caching**: Repeated expensive computations without memoization
- **Large payloads**: Oversized data passed between Inngest steps
- **N+1 queries**: Database queries inside loops
- **Unbounded operations**: Loops without limits, uncontrolled recursion

### 2. Pipeline Timing Estimate
For the audit pipeline (`apps/audit-runner/src/steps/`):
- Estimate wall-clock time per step based on external API calls
- Identify which steps can run in parallel vs must be sequential
- Calculate theoretical minimum audit time
- Compare against current sequential implementation

### 3. Bundle Analysis (Web)
For `apps/web/`:
- Check for heavy imports on client-side pages
- Identify server components vs client components
- Check for unnecessary `use client` directives
- Look for dynamic imports that should be static (or vice versa)

### 4. Database Query Efficiency
For files using Drizzle ORM:
- Check for missing indexes on frequently queried columns
- Identify joins that could be simplified
- Look for queries fetching more data than needed (SELECT *)

### 5. External API Optimization
For each external API integration:
- Rate limits and how close we are to hitting them
- Batch vs single-request patterns
- Retry strategies and their impact on latency

## Output

Report findings inline with impact estimates:
- **HIGH impact**: Changes that would save >30% time on critical path
- **MEDIUM impact**: Changes that improve efficiency but aren't blocking
- **LOW impact**: Nice-to-have optimizations

Include specific code suggestions for HIGH impact items.

## Rules
- Focus on the critical path (audit pipeline) first
- Don't optimize what isn't slow — identify the actual bottleneck
- Prefer simple solutions (parallelization, caching) over complex ones
- Never suggest premature optimization for code that runs rarely
- Consider the 10-client scale — don't over-engineer for thousands
