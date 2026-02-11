---
name: onboard
description: >
  Help a new agent or developer quickly understand the Pare Engine codebase.
  Generates a context briefing tailored to a specific area of work.
argument-hint: "[area: scoring | pipeline | web | tools | all]"
allowed-tools: Read, Grep, Glob, Bash(git log *), Bash(ls *), Bash(wc *)
context: fork
agent: Explore
---

# Onboard

You are generating a context briefing to help a new agent or developer quickly understand the Pare Engine codebase.

## Inputs

If an area was specified, focus the briefing: $ARGUMENTS

Areas:
- `scoring` — The 5-pillar scoring system
- `pipeline` — The Inngest audit pipeline
- `web` — The Next.js web app and admin panel
- `tools` — The tool functions in packages/core/src/tools/
- `contracts` — The contract-first type system
- `all` — Full codebase overview (default)

## Process

1. **Read Foundation**: Always start with:
   - `CLAUDE.md` — Project constitution
   - `VISION.md` — What we're building toward
   - `PRODUCT_PLAN.md` — Current feature inventory

2. **Scan Architecture**: For the requested area, read key files and summarize:
   - What exists (file counts, key exports)
   - What works (passing tests, complete features)
   - What's broken or incomplete (TODOs, stubs, known issues)
   - Key patterns to follow

3. **Map Dependencies**: Show how the requested area connects to other parts:
   - What it imports from (contracts, config, tools)
   - What imports from it (consumers, pipeline steps)
   - External services it depends on (APIs, databases)

4. **List Conventions**: Extract the most relevant coding conventions for this area:
   - Required patterns (e.g., `generateObject()` + Zod for LLM code)
   - Forbidden patterns (e.g., `Promise.all()` for multi-provider)
   - Naming conventions, file structure

5. **Quick Start**: Provide:
   - The 3-5 files to read first
   - How to run/test this area
   - Common pitfalls specific to this area

## Output

Display the briefing inline. Format as a structured document that a new agent can reference throughout their session.

## Rules
- Be accurate — verify claims by reading actual code, not just docs
- Be concise — this is a reference, not a tutorial
- Highlight what's broken honestly — don't sugarcoat
- Focus on "what do I need to know to be productive in 5 minutes"
- Include file paths for everything referenced
