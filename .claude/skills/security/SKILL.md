---
name: security
description: >
  Scan the codebase for security issues: hardcoded secrets, OWASP vulnerabilities,
  unsafe patterns, and missing input validation at system boundaries.
argument-hint: "[file-path-or-scope]"
allowed-tools: Read, Grep, Glob, Bash(git diff *), Bash(git log *)
context: fork
agent: Explore
---

# Security

You are performing a security audit of the Pare Engine codebase.

## Inputs

If a specific file or directory was provided, scope the scan: $ARGUMENTS

If no argument, scan the full codebase with focus on:
- `apps/web/app/api/` — API routes (public surface)
- `apps/web/middleware.ts` — Auth middleware
- `apps/web/lib/auth.ts` — Authentication logic
- `apps/audit-runner/src/` — Pipeline steps handling external data
- `packages/core/src/config.ts` — Environment variable handling

Also read: `CLAUDE.md` — Security-relevant conventions

## Process

### 1. Secrets Detection
Search the entire codebase for:
- Hardcoded API keys, tokens, passwords (regex: `/[A-Za-z0-9_-]{20,}/` near `key`, `token`, `secret`, `password`)
- `.env` files committed to git (check `.gitignore`)
- Secrets in test files (even mock secrets that look real)
- Environment variables used without the config wrapper

### 2. OWASP Top 10 Check
For each API route in `apps/web/app/api/`:
- **Injection**: Raw SQL, unparameterized queries, template literal injection
- **Broken Auth**: Missing auth checks, session fixation, weak password hashing
- **Sensitive Data Exposure**: PII in logs, unencrypted storage, verbose error messages
- **XXE/SSRF**: URL inputs passed to fetch/crawl without validation
- **Broken Access Control**: Missing middleware on admin routes, IDOR vulnerabilities
- **Security Misconfiguration**: Missing CORS headers, permissive CSP, debug mode in prod
- **XSS**: Unsanitized user input rendered in HTML (especially report templates)

### 3. Input Validation at Boundaries
Check that all external inputs are validated:
- API request bodies parsed with Zod (not raw `req.body`)
- URL parameters validated before use
- Webhook payloads verified (Stripe signature, etc.)
- Crawled content sanitized before storage

### 4. Dependency Audit
```bash
pnpm audit
```
Report any known vulnerabilities in dependencies.

### 5. Auth & Session Review
- Password hashing algorithm (must be bcrypt/argon2, not MD5/SHA)
- Session token generation (must be cryptographically random)
- Cookie flags (httpOnly, secure, sameSite)
- CSRF protection on state-changing endpoints

## Output

Report findings inline with severity levels:
- **CRITICAL**: Immediate fix required (hardcoded secrets, SQL injection, auth bypass)
- **HIGH**: Fix before production (XSS, missing validation, weak crypto)
- **MEDIUM**: Fix in next cycle (verbose errors, missing rate limiting)
- **LOW**: Improve when convenient (missing headers, logging improvements)

## Rules
- This is READ-ONLY — never modify files during security scan
- Report file:line for every finding
- Do not report false positives — verify before flagging
- Prioritize findings that affect the public surface (API routes, webhooks)
- Do not flag development-only patterns (console.log in dev, test credentials in .env.example)
