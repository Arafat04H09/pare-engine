# Verification Report — YYYY-MM-DD

## Spec Verified
- **ID**: {spec ID}
- **Title**: {spec title}
- **Path**: {spec file path}

## Verdict: {PASS | FAIL}

## Results Summary

| Level | Check | Result | Notes |
|-------|-------|--------|-------|
| 1 | Build | | |
| 1 | Tests | | |
| 2 | Spec Compliance | | |
| 3 | Boundary | | |
| 4 | Conventions | | |
| 5 | Vision Alignment | | |
| 6 | Regression | | |

## Level Details

### Level 1: Build Verification
- **pnpm build**: {PASS/FAIL}
- **pnpm test**: {PASS/FAIL} ({X}/{Y} tests passing)
- **Warnings**: {count}

### Level 2: Spec Compliance
| # | Acceptance Criterion | Result | Evidence |
|---|---------------------|--------|----------|
| 1 | | | file:line |

### Level 3: Boundary Verification
- **Files OWNED**: {count}
- **Files Modified**: {count}
- **Violations**: {count}

| File | Status | Issue |
|------|--------|-------|
| | OWNED + Modified | OK |
| | Modified but NOT OWNED | VIOLATION |
| | OWNED but NOT Modified | WARNING |

### Level 4: Convention Compliance
| Convention | Result | Violations |
|-----------|--------|-----------|
| Named exports | | |
| async/await | | |
| No raw process.env | | |
| generateObject + Zod | | |
| Promise.allSettled | | |
| Custom errors | | |
| Contract imports | | |
| Scoring weights | | |

### Level 5: Vision Alignment
- **Contract-driven**: {OK/CONCERN}
- **Platform agnostic**: {OK/CONCERN}
- **Transparency**: {OK/CONCERN}
- **Aesthetics**: {OK/CONCERN/N/A}

### Level 6: Regression
- **Tests**: {X} passing, {Y} failing (previous: {Z} passing)
- **New TODOs**: {count}
- **New FIXMEs**: {count}
- **Sensitive data check**: {CLEAN/ISSUE}

## Violations
<!-- List all FAIL-causing issues -->
1. ...

## Deviations
<!-- Things that differ from spec but are justified -->
1. ...

## Recommendations
<!-- Follow-up work needed -->
1. ...
