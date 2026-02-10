# Pare Engine: Architecture Rating & Pre-Build Improvement Plan

## Context

**What we're building:** A GEO (Generative Engine Optimization) consulting engine — a monorepo that audits how AI engines see local businesses, scores their AI readiness (0-100 across 5 pillars), generates branded PDF reports, and delivers actionable recommendations. The audit-to-implement-to-verify loop is the core business differentiator.

**What prompted this analysis:** Before building production code, we need to evaluate whether the current project scaffolding — documentation, configuration, package structure, and development tooling — is optimized for spec-driven development with multiple parallel Claude Code sessions. The question isn't just "is the spec good?" but "is the spec *machine-readable enough* for Claude to build from efficiently?"

**Intended outcome:** A rated assessment of current architecture + a concrete list of improvements to the development infrastructure (not the product code) that will maximize build velocity when we start implementing.

---

## Part 1: Architecture Rating

### Technical Architecture: 7.5/10

**Strengths (what's working well):**
- Comprehensive CLAUDE.md (root) acts as a project constitution — clear tool choices, coding conventions, stack decisions, and explicit "do NOT" directives. This is excellent for AI-assisted development.
- `.claude/rules/` files (5 of them) enforce domain-specific constraints per concern area (crawling, database, LLM, reports, scoring). This is the right pattern — they load contextually and prevent Claude from deviating.
- 13 documentation files cover business context, technical architecture, scoring algorithm, pipeline specification, and operational playbooks. The depth is unusual and valuable.
- Package-level CLAUDE.md files in each package provide focused context for when Claude works within that package.
- The monorepo structure (Turborepo + pnpm) is the right choice for the scale.
- Drizzle schema is well-designed (UUIDs, timestamps, JSONB for flexible data, cascading deletes).
- The separation between "scaffold code" (current) and "target architecture" (apps/*) is clearly documented.

**Weaknesses:**
- **No spec-driven task decomposition.** The docs describe *what* to build but not the *build order*, *dependencies between tasks*, or *acceptance criteria per task*. This means each Claude session has to re-derive what to do from 13 docs — expensive context and error-prone.
- **No feature graph / dependency map.** Which features block which? Can the scoring algorithm be built independently from the crawling pipeline? What's the critical path? This is implicit in the docs but never explicit.
- **Skills are underutilized.** 5 skills exist but they're operational (deploy, migrate, run-audit) — none are *build* skills. No skills for "implement a scoring pillar," "create an Inngest step," "scaffold an HTML report template," etc.
- **No hooks configured.** No auto-formatting, no protected file enforcement, no context re-injection after compaction. Every session starts cold.
- **No custom subagents.** No `.claude/agents/` directory. The project would benefit from specialized agents (e.g., a "scoring-expert" agent that has scoring docs pre-loaded, or an "audit-pipeline" agent).
- **No MCP servers configured.** The docs reference Drizzle MCP, Stripe MCP, Notion MCP, Firecrawl MCP — but none are configured in the project. This means Claude can't interact with the database, payment system, or crawling API during development.
- **Auto memory is empty.** No accumulated project knowledge from previous sessions. First session starts completely cold.
- **Missing test infrastructure.** No vitest config, no test files, no test patterns established. The CLAUDE.md mentions Vitest + Playwright but nothing is set up.
- **No `.env.example` or config validation.** The docs specify Zod-validated env vars in `packages/core/src/config.ts` but that file doesn't exist yet.

### Spec-Driven Development Readiness: 5/10

**The gap:** Spec-driven development (SDD) requires specifications → technical plans → testable tasks → implementation. Pare has excellent specifications (the docs/) but zero technical plans, zero task decomposition, and zero testable acceptance criteria. The specs are written for human comprehension, not machine execution.

**Specific issues:**
- Docs are narrative-heavy — great for understanding, poor for task extraction
- No `specs/` or `tasks/` directory with structured task definitions
- No dependency tracking between features (which blocks which)
- No definition of "done" per feature
- No interface contracts between packages (what does `apps/audit-runner` expect from `packages/core`?)

### Multi-Session Readiness: 4/10

**The gap:** Running multiple Claude Code sessions in parallel requires:
1. Clear file ownership boundaries (which session owns which files)
2. A shared task list or coordination mechanism
3. Non-overlapping work units
4. Consistent coding patterns enforced by tooling (not just docs)

**Current state:**
- No `.claude/agents/` for specialized parallel agents
- No hooks to enforce formatting consistency across sessions
- No task list infrastructure
- Package boundaries exist but shared types in `packages/core` create potential merge conflicts
- No git worktree setup guidance
- No linting/formatting enforced on save (hooks could do this)

---

## Part 2: What Should Change Before Building

### Priority 1: Spec-Driven Task Infrastructure

**Create a structured task decomposition.** This is the single highest-leverage improvement.

**File: `.claude/specs/README.md`** — Explains the spec-driven workflow
**Directory: `.claude/specs/features/`** — One spec per feature with:
- Description, acceptance criteria, dependencies, file ownership, estimated complexity
- Format: YAML frontmatter + markdown body (machine-parseable)

Example feature specs to create:
```
.claude/specs/features/
  01-core-config.md          # Zod env validation, config.ts
  02-scoring-weights-fix.md  # Fix weights from 35/25/20/10/10 → 30/30/15/10/15
  03-scoring-content.md      # Implement scoreContentQuality()
  04-scoring-technical.md    # Implement scoreTechnicalReadiness()
  05-scoring-gbp.md          # Implement scoreLocalGBP()
  06-scoring-tests.md        # Vitest tests for all scoring functions
  07-firecrawl-integration.md # Replace crawler stub with Firecrawl API
  08-ai-sdk-providers.md     # Replace mocked providers with Vercel AI SDK v6
  09-llm-parser.md           # Replace regex parser with Claude Haiku generateObject()
  10-report-html-templates.md # HTML/CSS report templates (mini + full)
  11-report-puppeteer.md     # Puppeteer page.pdf() generation
  12-inngest-pipeline.md     # Audit pipeline as Inngest steps
  13-nextjs-scaffold.md      # apps/web scaffold with App Router
  14-audit-form.md           # /audit form + mini-audit trigger
  15-admin-scaffold.md       # /admin/* routes + auth
  16-database-indexes.md     # Add missing indexes
  17-email-integration.md    # Resend + React Email setup
  18-stripe-integration.md   # Stripe payment flow
```

Each spec follows this template:
```yaml
---
id: "03-scoring-content"
name: "Implement Content Quality Scoring"
status: pending
priority: high
depends_on: ["01-core-config", "02-scoring-weights-fix"]
blocks: ["06-scoring-tests", "12-inngest-pipeline"]
files_owned:
  - packages/core/src/scoring/content-quality.ts
  - packages/core/src/scoring/content-quality.test.ts
estimated_tokens: 15000
---
```

**Why this matters:** Each Claude session picks up a spec, reads its dependencies, reads the owned files, implements, tests. No re-reading 13 docs. No guessing what to build next.

### Priority 2: MCP Server Configuration

**Create `.claude/settings.json`** with MCP servers that are directly relevant:

| MCP Server | Purpose | Priority |
|---|---|---|
| **Drizzle MCP** (`defrex/drizzle-mcp`) | Schema management, query testing during dev | Day 1 |
| **Stripe MCP** (official) | Payment integration development | Day 1 |
| **Notion MCP** (official) | Client management workflow | Day 1 |
| **Firecrawl MCP** (official) | Test crawling during development | Day 1 |
| **Resend MCP** (official) | Test email sending during development | Phase 2 |
| **Playwright MCP** (Microsoft) | E2E testing, PDF verification | Phase 2 |
| **Sequential Thinking** (official) | Complex reasoning for scoring algorithm design | Day 1 |
| **Memory** (official) | Knowledge graph-based persistent context | Evaluate |

Configuration goes in `.claude/settings.json` (project-level, committed to repo):
```json
{
  "mcpServers": {
    "drizzle": {
      "command": "npx",
      "args": ["-y", "drizzle-mcp"]
    },
    "stripe": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/stripe-mcp"],
      "env": { "STRIPE_SECRET_KEY": "${STRIPE_SECRET_KEY}" }
    },
    "firecrawl": {
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": { "FIRECRAWL_API_KEY": "${FIRECRAWL_API_KEY}" }
    },
    "notion": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/notion-mcp"],
      "env": { "NOTION_API_KEY": "${NOTION_API_KEY}" }
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/sequential-thinking-mcp"]
    }
  }
}
```

**MCP ecosystem context:** The MCP ecosystem now has 1,200+ quality-verified servers across registries like the [Official MCP Registry](https://registry.modelcontextprotocol.io/), [Smithery](https://smithery.ai/), [Glama.ai](https://glama.ai/mcp/servers), and [mcp-awesome.com](https://mcp-awesome.com/). Every external service Pare uses (Drizzle, Stripe, Notion, Firecrawl, Resend, Playwright, n8n) has an official or well-maintained MCP server. Not configuring them means Claude can't test against real services during development — it writes blind code that only fails at runtime.

### Priority 3: Custom Skills for Build Operations

**Upgrade existing skills and add build-focused skills.**

Current skills (operational — keep but improve):
- `create-n8n-workflow.md` — good
- `db-migrate.md` — good
- `deploy.md` — good
- `generate-schema.md` — good
- `run-audit.md` — good

**New skills to add:**

| Skill | Purpose | Key Behavior |
|---|---|---|
| `implement-feature` | Pick up a spec from `.claude/specs/features/`, implement it | Reads spec, checks dependencies are met, implements, runs tests, marks complete |
| `create-inngest-step` | Scaffold a new Inngest pipeline step | Template with typed input/output, error handling, retry config |
| `create-scoring-pillar` | Implement a scoring pillar function | Template with 0-max range, edge case tests, LLM integration for sentiment |
| `create-report-template` | Scaffold an HTML/CSS report template | Brand colors, A4 layout, SVG chart placeholders |
| `validate-scoring` | Run all scoring tests and verify weights sum to 100 | Quick check that scoring algorithm is internally consistent |
| `review-spec` | Have Claude review a feature spec for completeness | Checks: acceptance criteria, dependencies, file ownership, test plan |
| `scaffold-api-route` | Create a Next.js API route with proper error handling | Template with Zod validation, typed response, error classes |

**Skill architecture note:** Skills now support the [Agent Skills](https://agentskills.io) open standard — they're cross-compatible with Codex, Cursor, Gemini CLI, VS Code Copilot. Skills can include supporting files (templates, examples, validation scripts), run in forked subagent contexts (`context: fork`), and use dynamic context injection (`!`command`` syntax to run shell commands before skill content loads). The official [anthropics/skills](https://github.com/anthropics/skills) repository has 50+ reference skills. Community libraries like [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) catalog 300+ skills.

**Skill template example (`.claude/skills/implement-feature/SKILL.md`):**
```yaml
---
name: implement-feature
description: Pick up a feature spec and implement it end-to-end
argument-hint: [spec-id]
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---
# Implement Feature

Read the spec at `.claude/specs/features/$ARGUMENTS.md`.

## Steps
1. Parse the YAML frontmatter to get dependencies, file ownership, acceptance criteria
2. Verify all `depends_on` specs have status: complete
3. Read all files listed in `files_owned` (or create them if they don't exist)
4. Read relevant `.claude/rules/` files based on the feature domain
5. Implement the feature following the spec's acceptance criteria
6. Write tests for the feature
7. Run tests with `pnpm test`
8. Update the spec's status to `complete`
```

### Priority 4: Custom Subagents

**Create `.claude/agents/` with specialized agents for parallel work:**

| Agent | Role | Tools | Model |
|---|---|---|---|
| `scoring-expert` | Implements and tests scoring functions | Read, Write, Edit, Bash, Grep | sonnet |
| `pipeline-builder` | Builds Inngest pipeline steps | Read, Write, Edit, Bash, Grep | sonnet |
| `ui-builder` | Scaffolds Next.js pages and components | Read, Write, Edit, Bash, Glob | sonnet |
| `report-designer` | Creates HTML/CSS report templates | Read, Write, Edit, Bash | sonnet |
| `test-writer` | Writes comprehensive test suites | Read, Write, Edit, Bash, Grep | sonnet |
| `spec-reviewer` | Reviews and improves feature specs | Read, Edit, Grep, Glob | haiku |

**Agent template example (`.claude/agents/scoring-expert.md`):**
```yaml
---
name: scoring-expert
description: Specialist for implementing and testing scoring pillar functions
model: sonnet
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---
# Scoring Expert Agent

You specialize in implementing scoring functions for the Pare Engine GEO audit system.

## Context Files (always read these first)
- `docs/SCORING_ALGORITHM.md` — Complete scoring specification
- `.claude/rules/scoring.md` — Scoring implementation rules
- `packages/core/src/scoring.ts` — Current implementation (has bugs)

## Constraints
- Weights MUST be: AI Visibility 30, Content 30, Schema 15, Technical 10, GBP 15
- Each pillar function returns 0 to its max weight
- Use Math.round() for all final scores
- Sentiment analysis MUST use Claude Haiku via AI SDK generateObject()
- Every function needs tests: 0 input, perfect input, typical, edge cases
- No pillar score can exceed its maximum
- Composite score can never exceed 100
```

**Subagent ecosystem context:** Claude Code supports custom subagents defined as markdown files in `.claude/agents/`. Up to 7 agents can run simultaneously. The experimental **Agent Teams** feature (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) provides built-in multi-agent orchestration with a shared task list, inbox messaging, and file locking. Community repositories like [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) catalog 100+ subagent templates.

### Priority 5: Hooks Configuration

**Add hooks in `.claude/settings.json`:**

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "command": "npx prettier --write $TOOL_INPUT_FILE_PATH 2>/dev/null || true",
        "description": "Auto-format after file edits"
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "command": "node -e \"const f=process.env.TOOL_INPUT_FILE_PATH; if(f && (f.includes('.env') || f.includes('credentials'))) { process.stderr.write('BLOCKED: Cannot edit env/credential files'); process.exit(2); }\"",
        "description": "Block edits to sensitive files"
      }
    ],
    "SessionStart": [
      {
        "matcher": "compact",
        "command": "echo 'REMINDER: Read the active spec before continuing. Check .claude/specs/features/ for your current task. Scoring weights: 30/30/15/10/15. Use AI SDK v6, not custom wrappers. Use Firecrawl, not custom crawlers.'",
        "description": "Re-inject critical context after compaction"
      }
    ],
    "Stop": [
      {
        "command": "echo 'Session pausing. If you implemented code, ensure tests pass before ending.'",
        "description": "Reminder to test before stopping"
      }
    ]
  }
}
```

**Hooks context:** Hooks fire on 14 lifecycle events (SessionStart, PreToolUse, PostToolUse, Stop, etc.) and can be `command` (shell), `prompt` (LLM evaluation), or `agent` (subagent with tool access) types. Exit code 2 blocks the action. Async hooks (`async: true`) run without blocking. The compaction re-injection hook is critical — without it, Claude loses key constraints after context compression.

### Priority 6: Test Infrastructure

**Set up Vitest before building anything:**

- Create `vitest.config.ts` at root (workspace-aware)
- Create `packages/core/vitest.config.ts`
- Add first test file: `packages/core/src/scoring.test.ts` with tests for current (buggy) scoring
- This establishes the pattern before any implementation begins

### Priority 7: Auto Memory Initialization

**Seed `MEMORY.md` with critical project knowledge:**

```markdown
# Pare Engine Memory

## Architecture
- Monorepo: packages/core (foundation), apps/web (Next.js 15), apps/audit-runner (Inngest)
- Current packages/* are Gemini scaffolds — treat as reference, not production
- Target: migrate to apps/* structure per docs/ARCHITECTURE.md

## Critical Constraints
- Scoring weights: 30/30/15/10/15 (NOT the 35/25/20/10/10 in current code)
- LLM: Vercel AI SDK v6 only — no custom provider classes
- Crawling: Firecrawl API only — no custom Playwright crawler
- PDF: HTML/CSS + Puppeteer page.pdf() — NOT React-PDF
- Sentiment: LLM-based (Claude Haiku) — NOT keyword matching
- Parsing: generateObject() with Zod schemas — no manual JSON parsing

## Known Bugs
- packages/core/src/scoring.ts: wrong weights, missing 3 pillar functions
- packages/query-engine: all providers return mocked data
- packages/site-crawler/src/crawler.ts: hardcoded URL stub
- packages/report-generator: uses React-PDF (must migrate)

## File Conventions
- Named exports only, no default exports
- async/await only, no .then() chains
- Interfaces over type aliases, explicit return types
- Custom error classes with `code` property
```

### Priority 8: Environment & Config Foundation

**Create before any feature work:**

- `.env.example` — lists all required env vars with descriptions
- `packages/core/src/config.ts` — Zod-validated env configuration
- This unblocks every feature that needs API keys (Firecrawl, AI SDK, Stripe, Resend, etc.)

### Priority 9: Interface Contracts Between Packages

**Define typed interfaces at package boundaries before implementation:**

Create `packages/core/src/contracts/` with:
- `audit-pipeline.ts` — Input/output types for each pipeline step
- `scoring-input.ts` — What data each scoring function expects
- `report-data.ts` — What data the report templates consume

**Why:** When multiple sessions build different parts (one builds scoring, another builds the pipeline), they need to agree on the data shapes. Contracts defined first prevent integration failures.

### Priority 10: Feature Dependency Graph

**Create `docs/FEATURE_GRAPH.md`** — a visual dependency map:

```
Layer 0 (Foundation - no dependencies):
  [01-core-config] [16-database-indexes]

Layer 1 (Core logic - depends on config):
  [02-scoring-weights-fix] → [01]
  [07-firecrawl-integration] → [01]
  [08-ai-sdk-providers] → [01]

Layer 2 (Feature implementations - depends on core):
  [03-scoring-content] → [02, 08]
  [04-scoring-technical] → [02, 07]
  [05-scoring-gbp] → [02]
  [09-llm-parser] → [08]
  [10-report-html-templates] → [02]

Layer 3 (Integration - depends on features):
  [06-scoring-tests] → [02, 03, 04, 05]
  [11-report-puppeteer] → [10]
  [12-inngest-pipeline] → [07, 08, 09, 03, 04, 05]

Layer 4 (Application - depends on integration):
  [13-nextjs-scaffold] → [01]
  [14-audit-form] → [13, 12]
  [15-admin-scaffold] → [13]
  [17-email-integration] → [01, 11]
  [18-stripe-integration] → [01, 13]
```

**Parallelization opportunities:**
- Layer 0: all specs can run in parallel (2 sessions)
- Layer 1: all 3 specs can run in parallel (3 sessions)
- Layer 2: scoring-content, scoring-technical, scoring-gbp, llm-parser, report-templates can ALL run in parallel (5 sessions)
- Layer 3+: more sequential, but UI work can parallel with pipeline work

---

## Part 3: Tools & Ecosystem Gaps

### MCP Servers You Should Configure

| Server | What It Gives You | Install |
|---|---|---|
| **Drizzle MCP** | Query DB, manage schema, run migrations from Claude | `npx drizzle-mcp` |
| **Stripe MCP** | Create products, test webhooks, manage subscriptions | Official Stripe MCP |
| **Notion MCP** | Manage client records, update CRM data | Official Notion MCP |
| **Firecrawl MCP** | Test crawling, inspect results during development | Official Firecrawl MCP |
| **Resend MCP** | Send test emails during development | Official Resend MCP |
| **Sequential Thinking** | Complex multi-step reasoning for algorithm design | Official Anthropic MCP |
| **Playwright MCP** | E2E testing, browser automation, PDF verification | Microsoft Playwright MCP |
| **Git MCP** | Advanced git operations (rebase, cherry-pick, etc.) | Official reference server |
| **Memory MCP** | Knowledge graph-based persistent context | Official reference server |

**MCP Discovery Resources:**
- [Official MCP Registry](https://registry.modelcontextprotocol.io/) — Authoritative source, OpenAPI-based
- [Smithery](https://smithery.ai/) — Hosted marketplace (runs servers for you)
- [Glama.ai](https://glama.ai/mcp/servers) — Hosted gateway with remote execution
- [mcp-awesome.com](https://mcp-awesome.com/) — 1,200+ quality-verified servers
- [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) — GitHub curated list
- [Docker MCP Catalog](https://hub.docker.com/mcp) — Container-packaged MCP servers

### Skills You're Missing

Beyond the operational skills you have, you need **build-pattern skills**:

1. **`implement-feature`** — The core SDD skill. Reads a spec, implements it, tests it, marks complete.
2. **`create-inngest-step`** — Inngest step scaffolding with typed I/O, retries, idempotency.
3. **`create-scoring-pillar`** — Scoring function with tests, weight validation, LLM integration.
4. **`create-report-template`** — HTML/CSS A4 template with brand colors and SVG charts.
5. **`scaffold-api-route`** — Next.js API route with Zod input validation and error handling.
6. **`scaffold-page`** — Next.js page component with loading/error states and metadata.
7. **`validate-scoring`** — Run scoring test suite, verify weights sum to 100.
8. **`review-spec`** — AI review of a feature spec for completeness and consistency.

**Skill Discovery Resources:**
- [anthropics/skills](https://github.com/anthropics/skills) — 50+ official skills across 9 categories
- [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) — 300+ cross-tool skills
- [travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills) — Curated list
- [SkillsMP.com](https://skillsmp.com/) — Agent Skills Marketplace
- [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) — Complete config collection

### Subagents You're Missing

No `.claude/agents/` directory exists. For parallel multi-session work, you need:

1. **`scoring-expert`** — Scoring algorithm specialist (pre-loaded with SCORING_ALGORITHM.md)
2. **`pipeline-builder`** — Inngest pipeline specialist (pre-loaded with AUDIT_PIPELINE.md)
3. **`ui-builder`** — Next.js + shadcn/ui specialist (pre-loaded with WEBSITE_SPEC.md)
4. **`report-designer`** — HTML/CSS report template specialist (pre-loaded with brand guidelines)
5. **`test-writer`** — Test suite writer (pre-loaded with testing patterns)
6. **`spec-reviewer`** — Spec completeness checker (uses haiku for efficiency)

### Hooks You're Missing

No hooks configured at all. You need:

1. **Auto-format on edit** (PostToolUse + Edit|Write) — Prettier
2. **Block sensitive file edits** (PreToolUse) — .env, credentials
3. **Context re-injection after compaction** (SessionStart + compact) — Critical constraints reminder
4. **Test reminder on stop** (Stop) — "Did you run tests?"

### Tools from the Broader Ecosystem

| Tool | What It Does | Relevance |
|---|---|---|
| **[GitHub Spec Kit](https://github.com/github/spec-kit)** | Spec → Plan → Task → Code workflow (open source, MIT) | High — formalizes your SDD process with JSON task files including dependency tracking |
| **Agent Teams** (experimental) | Multiple Claude sessions with shared task list, inbox messaging, file locking | High — built-in multi-session coordination. Enable: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` |
| **[claude-flow](https://github.com/ruvnet/claude-flow)** | 60+ agent orchestration, distributed swarm intelligence, RAG integration | Medium — overkill for now, evaluate at scale |
| **[Claude Squad](https://github.com/squadrun/claude-squad)** | Multi-agent session manager in one terminal | Medium — useful for managing parallel sessions |
| **[cc-sdd](https://github.com/gotalab/cc-sdd)** | Kiro-style Requirements → Design → Tasks commands | Medium — alternative to Spec Kit, Claude Code native |
| **[claude-code-spec-workflow](https://github.com/Pimzino/claude-code-spec-workflow)** | Automated spec-driven workflows for Claude Code | Medium — pre-built spec workflow automation |
| **Git Worktrees** | Parallel working directories from same repo | High — enables independent Claude sessions on separate branches without conflicts |

---

## Part 4: Recommended Build Order

### Phase 0: Development Infrastructure (do this FIRST, before any feature code)

1. Create `.env.example` with all required env vars
2. Create `packages/core/src/config.ts` (Zod env validation)
3. Set up Vitest (root config + package configs)
4. Configure MCP servers in `.claude/settings.json`
5. Configure hooks in `.claude/settings.json`
6. Create `.claude/agents/` with specialized subagents
7. Upgrade `.claude/skills/` with build-pattern skills
8. Seed auto memory (`MEMORY.md`)
9. Create `packages/core/src/contracts/` with interface contracts
10. Create `.claude/specs/features/` with structured task specs
11. Create `docs/FEATURE_GRAPH.md` with dependency visualization

### Phase 1: Core Foundation (Layer 0-1, parallelizable)

Session A: Fix scoring weights, implement missing pillar functions
Session B: Set up Firecrawl integration, replace crawler stub
Session C: Set up AI SDK v6 providers, replace mocked providers

### Phase 2: Feature Implementation (Layer 2, highly parallelizable)

Session A: Content quality scoring + technical readiness scoring
Session B: LLM parser (generateObject + Zod schemas)
Session C: HTML/CSS report templates (mini + full audit)
Session D: GBP/local scoring
Session E: Test suites for all scoring

### Phase 3: Integration (Layer 3)

Session A: Inngest pipeline (connects all steps)
Session B: Puppeteer PDF generation
Session C: Next.js app scaffold + routing

### Phase 4: Application (Layer 4)

Session A: Audit form + mini-audit flow
Session B: Admin panel scaffold + auth
Session C: Email integration (Resend)
Session D: Stripe integration

---

## Part 5: Summary Ratings

| Dimension | Current | After Improvements |
|---|---|---|
| Technical Architecture | 7.5/10 | 9/10 |
| Spec-Driven Development Readiness | 5/10 | 9/10 |
| Multi-Session Readiness | 4/10 | 8.5/10 |
| MCP/Tool Integration | 2/10 | 8/10 |
| Skills Utilization | 3/10 | 8/10 |
| Memory Management | 1/10 | 7/10 |
| Test Infrastructure | 1/10 | 7/10 |
| **Overall Dev Velocity Readiness** | **3.5/10** | **8/10** |

The documentation and business specs are excellent (9/10). The gap is entirely in **development infrastructure** — the tooling, configuration, and workflow patterns that turn those specs into efficient parallel implementation. Phase 0 (development infrastructure) is a ~2-4 hour investment that will save 10x that time during feature implementation.

---

## Part 6: Key Insight — The Meta-Problem

The latent intent behind this request: **"I have comprehensive documentation but I'm not sure it's the right *format* for Claude to build from."**

The answer: your documentation is among the best I've seen for AI-assisted development. The CLAUDE.md constitution, the `.claude/rules/` files, the package-level context — all excellent. But documentation describes the *destination*. What's missing is the *route map*:

1. **Specs tell Claude *what* each unit of work is** (task boundaries)
2. **The feature graph tells Claude *when* to build each unit** (ordering)
3. **Interface contracts tell Claude *how* units connect** (integration points)
4. **Skills tell Claude *the pattern* for each type of work** (scaffolding)
5. **Hooks enforce constraints *deterministically*** (not relying on LLM memory)
6. **MCP servers give Claude *runtime access*** (test against real services)
7. **Subagents give Claude *specialized focus*** (less context, more precision)

The documentation is the strategy. What's missing is the tactics.

---

## Verification Plan

After implementing Phase 0:
1. `pnpm install` succeeds
2. `pnpm test` runs (even if tests are minimal/placeholder)
3. MCP servers connect (test with a simple query each)
4. Skills are discoverable (list with `/help` or tab-complete)
5. Hooks fire correctly (edit a file, verify formatting; try editing .env, verify blocked)
6. Feature specs parse correctly (YAML frontmatter readable)
7. A second Claude Code session can pick up a spec and understand what to build without reading all 13 docs
