# Pare Engine — Coding Conventions Quick Reference

## Imports
```typescript
// Contracts (source of truth for types)
import { CrawlOutput, MultiProviderResult } from '@pare-engine/core/contracts';

// AI SDK v6
import { generateText, generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';

// Zod
import { z } from 'zod';

// Drizzle
import { db } from '@pare-engine/core/database';
```

## Exports
```typescript
// Named exports only — no default exports
export function scoreAIVisibility(...) { }   // ✅
export default function handler(...) { }      // ❌ (except Next.js pages)
```

## Async
```typescript
// async/await only — no .then() chains
const result = await generateText({ ... });   // ✅
generateText({ ... }).then(r => ...);         // ❌
```

## LLM Integration
```typescript
// Always use generateObject() + Zod for structured output
const { object } = await generateObject({
  model: anthropic('claude-3-haiku-20240307'),
  schema: z.object({
    sentiment: z.enum(['positive', 'neutral', 'negative']),
    confidence: z.number().min(0).max(1),
  }),
  prompt: `Analyze sentiment: ${text}`,
});

// Multi-provider: Promise.allSettled(), never Promise.all()
const results = await Promise.allSettled([
  queryOpenAI(prompt),
  queryPerplexity(prompt),
  queryGemini(prompt),
]);
```

## Environment Variables
```typescript
// Always via validated config — never raw process.env
import { config } from '@pare-engine/core/config';
const apiKey = config.firecrawlApiKey;         // ✅
const apiKey = process.env.FIRECRAWL_API_KEY;  // ❌
```

## Error Handling
```typescript
// Custom error classes with code property
export class CrawlError extends Error {
  code = 'CRAWL_FAILED' as const;
  constructor(message: string, public readonly url: string) {
    super(message);
    this.name = 'CrawlError';
  }
}

// External API failures: catch, log, skip — never throw
try {
  const result = await firecrawl.crawl(url);
} catch (error) {
  console.error(`Crawl failed for ${url}:`, error);
  failedUrls.push(url);
  // Continue with remaining URLs
}
```

## Scoring
```typescript
// Weights are canonical: 30/30/15/10/15 = 100
// Each scorer returns 0 to its max
// Composite = sum of all pillars (already weighted)
// Grades: A (90-100), B (80-89), C (70-79), D (60-69), F (0-59)
// Always Math.round() final scores
```

## PDF Generation
```typescript
// HTML/CSS + Puppeteer — never React-PDF
import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'networkidle0' });
const pdf = await page.pdf({ format: 'A4', printBackground: true });
await browser.close();
```

## Platform Enum
```typescript
// Only these three — no 'claude', no 'google_aio'
type Platform = 'chatgpt' | 'perplexity' | 'gemini';
```

## Database
```typescript
// Drizzle ORM only — no raw SQL
// UUID primary keys, createdAt/updatedAt timestamps
// jsonb for flexible nested data
// Foreign keys cascade on delete
```
