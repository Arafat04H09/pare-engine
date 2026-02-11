# Crawling Rules

## Tooling
1. **Firecrawl**: Use Firecrawl for all heavy-site crawling. No custom Playwright crawlers allowed.
2. **Formats**: Request 'markdown' and 'html' formats to ensure both semantic and structural analysis.

## Parameters
- **Limit**: Default to 20 pages per domain for standard audits.
- **Timeout**: Enforce a 30-second timeout for crawl steps.

## Analysis
- Extracted content must be checked for `robots.txt` AI friendliness.
- Detect presence of `llms.txt` and `llms-full.txt`.
