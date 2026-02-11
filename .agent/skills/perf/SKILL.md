---
name: perf
description: Profile and analyze performance bottlenecks in the audit pipeline or specific modules.
---

# Skill: Perf

## Purpose
Analyze performance characteristics of the Pare Engine codebase to identify bottlenecks and optimization opportunities. Focuses on the critical path (audit pipeline) first.

## Inputs
If a specific file or area was provided by the user, focus analysis there. Areas: `pipeline`, `scoring`, `tools`, `web`.

If no argument, analyze all areas.

## Process

### 1. Static Analysis
Read code and identify performance anti-patterns:
- Sequential awaits where parallel is possible
- Redundant API calls (same data fetched multiple times)
- Missing caching for repeated expensive computations
- Large payloads between Inngest steps
- N+1 database queries (queries inside loops)
- Unbounded operations (loops without limits)

### 2. Pipeline Timing Estimate
For the audit pipeline steps:
- Estimate wall-clock time per step based on external API calls
- Identify which steps can run in parallel
- Calculate theoretical minimum audit time
- Compare against current implementation

### 3. Bundle Analysis (Web)
For `apps/web/`: heavy client-side imports, unnecessary `use client`, dynamic import opportunities.

### 4. Database Query Efficiency
Missing indexes, unnecessary joins, over-fetching (SELECT *).

### 5. External API Optimization
Rate limits, batch vs single-request patterns, retry strategies.

## Output
Report findings with impact levels: HIGH (>30% improvement), MEDIUM (efficiency gain), LOW (nice-to-have). Include specific code suggestions for HIGH items.

## Rules
- Focus on the critical path first
- Don't optimize what isn't slow
- Prefer simple solutions (parallelization, caching) over complex ones
- Never suggest premature optimization for rarely-run code
- Consider the 10-client scale — don't over-engineer
