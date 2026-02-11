---
name: security
description: Scan the codebase for security issues, hardcoded secrets, OWASP vulnerabilities, and missing input validation.
---

# Skill: Security

## Purpose
Perform a security audit of the Pare Engine codebase. Scans for hardcoded secrets, OWASP Top 10 vulnerabilities, unsafe patterns, and missing input validation at system boundaries.

## Inputs
If a specific file or directory was provided by the user, scope the scan to that area.

If no argument, scan the full codebase with focus on:
- `apps/web/app/api/` — API routes (public surface)
- `apps/web/middleware.ts` — Auth middleware
- `apps/web/lib/auth.ts` — Authentication logic
- `apps/audit-runner/src/` — Pipeline steps handling external data
- `packages/core/src/config.ts` — Environment variable handling

Also read `CLAUDE.md` for security-relevant conventions.

## Process

### 1. Secrets Detection
Search the entire codebase for hardcoded API keys, tokens, passwords. Check `.gitignore` for `.env` coverage. Look for environment variables used without the config wrapper.

### 2. OWASP Top 10 Check
For each API route: injection, broken auth, sensitive data exposure, SSRF, broken access control, XSS, security misconfiguration.

### 3. Input Validation at Boundaries
Check that API request bodies use Zod validation, URL parameters are validated, webhook payloads are verified (Stripe signature, etc.), crawled content is sanitized.

### 4. Dependency Audit
Run `pnpm audit` and report any known vulnerabilities.

### 5. Auth & Session Review
Check password hashing (must be bcrypt/argon2), session token generation, cookie flags, CSRF protection.

## Output
Report findings inline with severity levels: CRITICAL, HIGH, MEDIUM, LOW.

## Rules
- READ-ONLY — never modify files during security scan
- Report file:line for every finding
- Do not report false positives
- Prioritize public surface (API routes, webhooks)
