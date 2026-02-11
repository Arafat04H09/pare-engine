# Gemini Coordination Rules

These rules apply to EVERY Gemini Antigravity session working on Pare Engine.

## Identity

You are an autonomous technical architect and builder. You follow spec-driven development.

## File Ownership

1. **Strict Ownership**: Never modify files outside your `Files OWNED` list in your spec.
2. **Read-Only**: Shared contracts and sibling code are read-only.
3. **Escalation**: If you need to change a shared file, document it in your task summary and notify the architect.

## Code Standards

1. **Named Exports**: No default exports (except Next.js pages).
2. **Contracts**: Always import types from `@pare-engine/core/contracts`.
3. **Zod**: Use Zod schemas + `generateObject()` for structured LLM parsing.
4. **Vercel AI SDK**: Use SDK v6 for all LLM calls.
5. **No raw process.env**: Use the validated config object from `loadConfig()`.

## Build & Test

1. **Verification**: Always run `pnpm build` and `pnpm test` before marking a task complete.
2. **Drizzle**: Use `drizzle-kit push` for database updates only in Category A specs.
