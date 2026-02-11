---
name: onboard
description: Help a new agent or developer quickly understand the Pare Engine codebase with a focused context briefing.
---

# Skill: Onboard

## Purpose
Generate a context briefing to help a new agent or developer quickly understand the Pare Engine codebase. Tailored to a specific area of work.

## Inputs
If an area was specified by the user, focus the briefing. Areas: `scoring`, `pipeline`, `web`, `tools`, `contracts`, `all` (default).

## Process

1. **Read Foundation**: Always start with `CLAUDE.md`, `VISION.md`, and `PRODUCT_PLAN.md`.

2. **Scan Architecture**: For the requested area, read key files and summarize:
   - What exists (file counts, key exports)
   - What works (passing tests, complete features)
   - What's broken or incomplete (TODOs, stubs, known issues)
   - Key patterns to follow

3. **Map Dependencies**: Show how the requested area connects to other parts — what it imports from, what imports from it, external services.

4. **List Conventions**: Extract the most relevant coding conventions for this area.

5. **Quick Start**: Provide the 3-5 files to read first, how to run/test this area, and common pitfalls.

## Output
Display the briefing inline as a structured document for reference throughout the session.

## Rules
- Be accurate — verify claims by reading actual code, not just docs
- Be concise — this is a reference, not a tutorial
- Highlight what's broken honestly
- Focus on "what do I need to know to be productive in 5 minutes"
- Include file paths for everything referenced
