---
name: scaffold
description: Generate implementation stubs from contract files with correct types, imports, and test skeletons.
---

# Skill: Scaffold

## Purpose
Generate implementation stubs from Pare Engine contract files. Reads `*.contract.ts` Zod schemas and creates typed function skeletons with correct imports, enforcing the contract-first architecture.

## Inputs
A contract file path must be provided by the user (e.g., `packages/core/src/contracts/crawl.contract.ts`).

If no argument, list all contract files in `packages/core/src/contracts/` and ask which to scaffold from.

## Process

1. **Read the Contract**: Parse the contract file. Extract all exported Zod schemas, `z.infer<>` type derivations, interfaces, types, constants, and utility functions.

2. **Identify What Needs Stubs**: For each schema/type, check if an implementation already exists in `packages/core/src/tools/` or `apps/audit-runner/src/steps/`. Only generate stubs for unimplemented types.

3. **Generate Function Stubs**: Create typed async functions:
   ```typescript
   import { CrawlInput, CrawlOutput } from '@pare-engine/core/contracts';
   export async function crawlSite(input: CrawlInput): Promise<CrawlOutput> {
     // TODO: Implement — scaffolded from crawl.contract.ts
     throw new Error('Not implemented: crawlSite');
   }
   ```

4. **Follow Patterns**: Match codebase conventions — `generateObject()` + Zod for LLM, `Promise.allSettled()` for multi-provider, import from contracts only.

5. **Generate Test Stubs**: Create matching Vitest test files with `it.todo()` for each expected behavior.

6. **Update Index**: Add re-exports to `packages/core/src/index.ts` if needed.

## Output
- Typed function stubs in the appropriate directory
- Matching test stubs
- Updated index file if needed

## Rules
- NEVER modify contract files — they are the source of truth
- Stubs must have correct TypeScript types matching the contract
- Every stub must throw `new Error('Not implemented')` until implemented
- Do not generate stubs for types that already have implementations
- Follow all CLAUDE.md coding conventions
