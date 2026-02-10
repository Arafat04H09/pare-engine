# Audit Pipeline Specification

## Overview

The audit pipeline is a durable, event-driven workflow that executes as Inngest steps. Each step is independently retriable — if step 3 fails, it retries from step 3, preserving the work from steps 1-2.

## Pipeline Steps

### Step 1: CRAWL — Site Content Extraction

**Tool:** Firecrawl API (or self-hosted Firecrawl)
**Duration:** 30-120 seconds
**Retries:** 3 attempts, exponential backoff

```typescript
// Pseudocode — actual implementation in apps/audit-runner/src/steps/crawl.ts
async function crawlStep(domain: string): Promise<CrawlResult> {
  // 1. Map: discover all URLs on the site
  const urls = await firecrawl.map(domain, { limit: 50 });

  // 2. Crawl: extract content from top 20 pages
  const pages = await firecrawl.crawl(domain, {
    limit: 20,
    formats: ['markdown', 'html'],
    includeTags: ['h1', 'h2', 'h3', 'p', 'script[type="application/ld+json"]'],
  });

  // 3. Store raw crawl data in PostgreSQL
  await db.insert(crawlData).values(
    pages.map(p => ({ auditId, url: p.url, markdown: p.markdown, html: p.html, metadata: p.metadata }))
  );

  return { urls: urls.map(u => u.url), pages };
}
```

**Output:** Raw page content stored in `crawl_data` table.

### Step 2: QUERY — Multi-LLM Brand Monitoring

**Tool:** Vercel AI SDK v6
**Duration:** 60-300 seconds (depends on providers × prompts)
**Retries:** 3 attempts per provider, skip on permanent failure

```typescript
// Pseudocode
async function queryStep(config: AuditConfig): Promise<QueryResult[]> {
  const prompts = getPromptsForVertical(config.vertical, config.location);
  const providers = ['openai', 'perplexity', 'gemini'];
  const results: QueryResult[] = [];

  // Query each provider with each prompt (concurrently within provider limits)
  for (const provider of providers) {
    const providerResults = await Promise.allSettled(
      prompts.map(prompt => queryProvider(provider, prompt, config))
    );

    for (const result of providerResults) {
      if (result.status === 'fulfilled') results.push(result.value);
      // Failed queries are logged but don't block the pipeline
    }
  }

  // Store results
  await db.insert(llmResponses).values(results);
  return results;
}

async function queryProvider(provider: string, prompt: string, config: AuditConfig): Promise<QueryResult> {
  // Use AI SDK generateText for the raw response
  const { text } = await generateText({
    model: getModel(provider), // openai('gpt-4o'), google('gemini-2.0-flash'), etc.
    prompt: prompt,
    // OpenAI-specific: enable web_search tool for grounded responses
  });

  // Use AI SDK generateObject to parse the response into structured data
  const parsed = await generateObject({
    model: anthropic('claude-3-5-haiku-20241022'),
    schema: queryResultSchema, // Zod schema
    prompt: `Analyze this AI response about "${config.businessName}" and extract: brand mentioned (boolean), position among competitors, sentiment, cited URLs, competitor mentions.\n\nResponse:\n${text}`,
  });

  return { ...parsed.object, platform: provider, query: prompt, response: text };
}
```

**Key decisions:**
- Use separate LLM calls for querying (the actual AI engines) and parsing (Claude Haiku for structured extraction)
- `Promise.allSettled` not `Promise.all` — one failed provider shouldn't abort the audit
- OpenAI Responses API has built-in `web_search` — use it for grounded monitoring queries
- Perplexity Sonar returns citations natively — extract from response metadata

**Output:** Parsed query results stored in `llm_responses` table.

### Step 3: ANALYZE — Custom Content Analysis

**Tool:** Custom code (this is our IP)
**Duration:** 5-15 seconds
**Retries:** 3 attempts

This step runs our custom analysis on the crawled content. Unlike crawling and querying, this code is fully custom because it encodes our GEO expertise.

```typescript
async function analyzeStep(crawlData: CrawlResult, auditConfig: AuditConfig): Promise<AnalysisResult> {
  return {
    schema: analyzeSchemaCompleteness(crawlData.pages, auditConfig.vertical),
    content: analyzeContentQuality(crawlData.pages),
    technical: analyzeTechnicalReadiness(crawlData.pages, auditConfig.domain),
    gbp: await analyzeGBP(auditConfig.googlePlaceId),
    misinformation: detectMisinformation(queryResults, knownFacts),
  };
}
```

**Sub-analyses:**
1. **Schema Completeness:** Extract JSON-LD from HTML, compare against required types for vertical, identify gaps
2. **Content Quality:** Use Claude Haiku to evaluate answer-first format, FAQ detection, stats density, author attribution per page
3. **Technical Readiness:** Check robots.txt for AI crawler rules, llms.txt presence, sitemap validation, HTTPS, mobile
4. **GBP Analysis:** Google Places API lookup for rating, reviews, photos, completeness
5. **Misinformation Detection:** Compare LLM responses about the business against known facts (from GBP + website)

**Output:** Structured analysis results.

### Step 4: SCORE — Apply Scoring Algorithm

**Tool:** Custom scoring functions from `packages/core/src/scoring/`
**Duration:** <1 second
**Retries:** 1 (deterministic, shouldn't fail)

```typescript
async function scoreStep(analysis: AnalysisResult, queryResults: QueryResult[]): Promise<ScoredAudit> {
  const scores = {
    aiVisibility: scoreAIVisibility(queryResults),       // 0-30
    content: scoreContentQuality(analysis.content),       // 0-30
    schema: scoreSchemaCompleteness(analysis.schema),     // 0-15
    technical: scoreTechnicalReadiness(analysis.technical), // 0-10
    gbp: scoreLocalGBP(analysis.gbp),                     // 0-15
  };

  const overall = Object.values(scores).reduce((sum, s) => sum + s, 0);
  const grade = scoreToGrade(overall);

  return { ...scores, overall, grade };
}
```

**Output:** Scored audit stored in `audit_results` table.

### Step 5: REPORT — Generate Branded PDF

**Tool:** Puppeteer `page.pdf()` on HTML/CSS templates
**Duration:** 5-15 seconds
**Retries:** 2 attempts

```typescript
async function reportStep(audit: ScoredAudit, config: AuditConfig): Promise<string> {
  // 1. Load HTML template
  const template = loadTemplate(audit.type === 'mini' ? 'audit-mini.html' : 'audit-full.html');

  // 2. Inject data into template (handlebars or template literals)
  const html = renderTemplate(template, { audit, config });

  // 3. Generate PDF
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
  });
  await browser.close();

  // 4. Store PDF (local file or S3-compatible storage)
  const url = await storePDF(pdf, `${config.domain}-audit-${Date.now()}.pdf`);

  // 5. Update audit record with PDF URL
  await db.update(auditResults)
    .set({ reportPdfUrl: url })
    .where(eq(auditResults.id, audit.id));

  return url;
}
```

**Output:** PDF file stored, URL saved to `audit_results.report_pdf_url`.

### Step 6: DELIVER — Send Report via Email

**Tool:** Resend API + React Email templates
**Duration:** 2-5 seconds
**Retries:** 3 attempts

```typescript
async function deliverStep(pdfUrl: string, config: AuditConfig): Promise<void> {
  const pdf = await fetchPDF(pdfUrl);

  await resend.emails.send({
    from: 'reports@pareconsulting.com',
    to: config.clientEmail,
    subject: `Your AI Readiness Report — ${config.businessName}`,
    react: AuditDeliveryEmail({ businessName: config.businessName, score: audit.overall, grade: audit.grade }),
    attachments: [{
      filename: `${config.businessName.replace(/\s/g, '-')}-AI-Audit.pdf`,
      content: pdf,
    }],
  });

  // Update client record
  await db.update(clients)
    .set({ currentScore: audit.overall, updatedAt: new Date() })
    .where(eq(clients.id, config.clientId));
}
```

**Output:** Email sent, client record updated.

## Inngest Configuration

```typescript
// apps/audit-runner/src/pipeline.ts
import { inngest } from './inngest-client';

export const auditPipeline = inngest.createFunction(
  { id: 'audit-pipeline', name: 'Full Audit Pipeline' },
  { event: 'audit/requested' },
  async ({ event, step }) => {
    const config = event.data; // { domain, vertical, location, clientEmail, ... }

    const crawlResult = await step.run('crawl-site', () => crawlStep(config.domain));
    const queryResults = await step.run('query-llms', () => queryStep(config));
    const analysis = await step.run('analyze-content', () => analyzeStep(crawlResult, config));
    const scored = await step.run('calculate-scores', () => scoreStep(analysis, queryResults));
    const pdfUrl = await step.run('generate-report', () => reportStep(scored, config));
    await step.run('deliver-report', () => deliverStep(pdfUrl, config));

    return { score: scored.overall, grade: scored.grade, pdfUrl };
  }
);
```

## Partial Audit Mode

If a provider fails (e.g., Perplexity API is down), the pipeline continues with available data:
- Step 2 uses `Promise.allSettled` — failed providers are logged, not fatal
- Scoring adjusts: AI Visibility score based on available platforms only (normalize by sample size)
- Report notes which platforms were unavailable
- This resolves the "partial audit" spec gap identified in STEELMAN_AND_RISKS.md

## Mini-Audit Pipeline (Simplified)

For the website form's free audit:
- Step 1: Skip full crawl, just fetch homepage + /about + /services
- Step 2: Query only 1 provider (OpenAI) with 5 prompts
- Step 3: Schema extraction + basic content check only
- Step 4: Score normally but flag as "preliminary"
- Step 5: Generate 1-page mini-report PDF
- Step 6: Email with CTA for full audit

Duration: 30-60 seconds total.
