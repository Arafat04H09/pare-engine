# Build Brief — {Spec ID}: {Spec Title}

## Metadata
- **Prepared**: YYYY-MM-DD
- **Spec**: `{spec-path}`
- **Work Types**: {ui, api, backend, data, integration, pipeline, template, config, test}
- **Cognitive Role**: {Analyst | Strategist | Specialist}
- **Estimated Hours**: {from spec}
- **Pre-flight Status**: {READY | BLOCKED | CONFLICT}

## Pre-flight Checks

| Check | Status | Notes |
|-------|--------|-------|
| `pnpm build` passes | | |
| All OWNED parent dirs exist | | |
| All READ-ONLY files importable | | |
| Dependencies installed | | |
| No uncommitted conflicts | | |
| File ownership clean | | |

## Toolkit

### Activate These MCPs
<!-- Only list MCPs that are relevant to this specific spec -->
- `{mcp-name}` — {why it helps}

### Key References
<!-- Existing files the builder should read before implementing -->
1. `{file-path}:{line-range}` — {what pattern it demonstrates}
2. `{file-path}:{line-range}` — {what pattern it demonstrates}

### Dependencies to Verify
```bash
pnpm ls {package-name}  # should be installed
```

## Implementation Approach

### Pattern to Follow
<!-- Concrete code snippet showing the pattern the builder should use -->
```typescript
// From {reference-file}:{line}
// Adapt this pattern for {spec-specific-context}
```

### Step-by-Step
1. **{First step}** — {what to do, which file}
2. **{Second step}** — {what to do, which file}
3. **{Third step}** — {what to do, which file}

### Contract Interfaces
<!-- Key types the builder needs from contracts -->
```typescript
// From {contract-file}
interface {TypeName} {
  // relevant fields
}
```

## Pitfalls

### Must Avoid
- {Specific pitfall with explanation}

### Known Issues
- {Any known issues from MEMORY.md, previous builds, or CLAUDE.md constraints}

### Boundary Watch
<!-- Files that are close to the ownership boundary -->
- `{file}` — OWNED by this spec. Safe to modify.
- `{file}` — OWNED by {other-spec}. DO NOT MODIFY.

## Verification Strategy

### Acceptance Criteria Mapping
| # | Criterion | How to Verify |
|---|-----------|---------------|
| 1 | {criterion from spec} | {specific check — file:line, test, build} |

### Test Strategy
- {What tests to write, what edge cases to cover}

## Notes
<!-- Any additional context, warnings, or recommendations -->
