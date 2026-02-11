---
name: scaffold
description: >
  Generate implementation stubs from contract files. Reads *.contract.ts
  Zod schemas and creates typed function skeletons with correct imports.
argument-hint: "packages/core/src/contracts/crawl.contract.ts"
allowed-tools: Read, Write, Edit, Grep, Glob
---

# Scaffold

You are generating implementation stubs from Pare Engine contract files. This enforces the contract-first architecture — contracts define the types, this skill generates the skeleton code.

## Inputs

A contract file path MUST be provided: $ARGUMENTS

If no argument, list all contract files and ask which to scaffold from:
```
packages/core/src/contracts/*.contract.ts
```

## Process

1. **Read the Contract**: Parse the contract file. Extract:
   - All exported Zod schemas (e.g., `CrawlInputSchema`, `CrawlOutputSchema`)
   - All `z.infer<>` type derivations (e.g., `type CrawlInput = z.infer<typeof CrawlInputSchema>`)
   - All exported interfaces and types
   - Any exported constants (e.g., `SCORING_WEIGHTS`)
   - Any exported utility functions (e.g., `scoreToGrade()`)

2. **Identify What Needs Stubs**: For each schema/type pair, determine if an implementation already exists:
   - Search `packages/core/src/tools/` for functions using these types
   - Search `apps/audit-runner/src/steps/` for pipeline steps using these types
   - Only generate stubs for types that lack implementations

3. **Generate Function Stubs**: For each unimplemented type, create a typed function:
   ```typescript
   import { CrawlInput, CrawlOutput } from '@pare-engine/core/contracts';

   export async function crawlSite(input: CrawlInput): Promise<CrawlOutput> {
     // TODO: Implement — scaffolded from crawl.contract.ts
     throw new Error('Not implemented: crawlSite');
   }
   ```

4. **Follow Patterns**: Match the existing codebase patterns:
   - Functions in `packages/core/src/tools/` are pure typed tools
   - Functions in `apps/audit-runner/src/steps/` are Inngest step wrappers
   - Use `generateObject()` + Zod for any LLM parsing
   - Use `Promise.allSettled()` for multi-provider calls
   - Import from `@pare-engine/core/contracts`, not sibling code

5. **Generate Test Stubs**: For each function stub, create a matching test:
   ```typescript
   import { describe, it, expect } from 'vitest';
   import { crawlSite } from './crawl';

   describe('crawlSite', () => {
     it.todo('returns CrawlOutput for valid input');
     it.todo('handles empty URL gracefully');
     it.todo('respects page limit');
   });
   ```

6. **Update Index**: If creating new files in `packages/core/src/tools/`, update `packages/core/src/index.ts` with re-exports.

## Output

- Typed function stubs in the appropriate directory
- Matching test stubs
- Updated index file if needed
- Summary of what was generated

## Rules
- NEVER modify contract files — they are the source of truth
- Stubs must have correct TypeScript types (input → output matching the contract)
- Every stub must have a `// TODO: Implement` comment with the source contract
- Every stub must throw `new Error('Not implemented: functionName')` until implemented
- Do not generate stubs for types that already have implementations
- Follow all CLAUDE.md coding conventions in generated code
