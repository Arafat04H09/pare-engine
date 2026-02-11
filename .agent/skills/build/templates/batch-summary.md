# Batch Build Summary — YYYY-MM-DD

## Overview
- **Mode**: {folder | wave N | next N | all}
- **Execution**: {parallel (worktrees) | sequential (fallback)}
- **Queue Size**: {total specs in queue}
- **Attempted**: {count}
- **Passed**: {count}
- **Failed**: {count}
- **Remaining**: {count — not attempted due to failure or queue limit}

## Wave Execution

| Wave | Specs | Execution | Agents | Result |
|------|-------|-----------|--------|--------|
| 1 | A1, A2 | sequential | 1 | PASS |
| 2 | B1.1, B1.2, B2.1, B2.2 | parallel (worktrees) | 4 | 3 PASS, 1 FAIL |
| 3 | — | not attempted | — | — |

## Per-Spec Results

| # | Spec ID | Title | Wave | Result | Files Changed | Notes |
|---|---------|-------|------|--------|---------------|-------|
| 1 | {id} | {title} | {wave} | PASS | {count} | |
| 2 | {id} | {title} | {wave} | PASS | {count} | |
| 3 | {id} | {title} | {wave} | FAIL | {count} | {error summary} |

## Integration Verification

| Wave | Post-Merge Check | Notes |
|------|-----------------|-------|
| 1 | PASS | |
| 2 | PASS | |

## Failure Details
<!-- Only include if a spec failed -->

### {Spec ID}: {Title}
- **Wave**: {N}
- **Error**: {build error, test failure, boundary violation, merge conflict, etc.}
- **Files Modified**: {list}
- **Attempted Fix**: {yes/no, what was tried}
- **Root Cause**: {if identifiable}
- **Branch Preserved**: {yes/no — for debugging}

## Remaining Queue
<!-- Only include if specs were not attempted -->

| # | Spec ID | Title | Wave | Why Not Attempted |
|---|---------|-------|------|-------------------|
| | {id} | {title} | {wave} | {reason} |

## Index Updates
<!-- Specs marked "done" in specs/index.md -->
- {spec-id}: done
- {spec-id}: done

## Build Logs
- Per-spec details: `pipeline/6-build/build-log-YYYY-MM-DD.md`
