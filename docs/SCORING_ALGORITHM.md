# Scoring Algorithm Specification

## Overview

Every audit produces a composite score from 0-100 across 5 pillars. The score represents how well a business is positioned for AI engine visibility.

**Key insight from research:** Content quality is the #1 citation driver (not schema markup). Schema helps AI comprehension but does NOT correlate with citation frequency. The weights below reflect this.

## Weights

| Pillar | Points | Weight | Rationale |
|--------|--------|--------|-----------|
| AI Visibility | 30 | 30% | Direct measurement of current AI presence |
| Content Quality | 30 | 30% | #1 factor in citation frequency (research-validated) |
| Schema/Structured Data | 15 | 15% | Helps comprehension, not citation rates |
| Technical Readiness | 10 | 10% | Necessary foundation, not differentiator |
| Local/GBP + Third-Party | 15 | 15% | Local signal strength + directory mentions |
| **Total** | **100** | **100%** | |

## Pillar 1: AI Visibility (0-30 points)

Measures how AI engines currently reference the business.

### Inputs
- `queryResults: QueryResult[]` — responses from querying AI platforms about the business

### Sub-scores

| Component | Points | Formula |
|-----------|--------|---------|
| Mention Rate | 0-12 | `(mentioned_queries / total_queries) * 12` |
| Citation Rate | 0-8 | `(queries_with_url_cited / total_queries) * 8` |
| Position Quality | 0-5 | `avg_position <= 1 → 5; <= 2 → 4; <= 3 → 3; <= 4 → 2; <= 5 → 1; else 0` |
| Sentiment | 0-5 | `(positive_mentions / total_mentions) * 5` |

### Notes
- Position = rank among all brands mentioned in a single response (1 = mentioned first = best)
- If brand is not mentioned at all, position is null (excluded from average)
- Sentiment should be determined by LLM-as-judge (Claude Haiku), NOT regex keyword matching
- Minimum sample size: 10 queries across 2+ platforms for reliable scoring

## Pillar 2: Content Quality (0-30 points)

Measures how well the website's content is structured for AI consumption.

### Inputs
- Crawled page content (Markdown/HTML from Firecrawl)

### Sub-scores

| Component | Points | How to Measure |
|-----------|--------|---------------|
| Answer-First Format | 0-8 | First paragraph directly answers a question someone would ask. Score per page (0-100), average across site, scale to 0-8. Use LLM to evaluate, not string length. |
| FAQ Presence | 0-5 | Pages with Q&A structured content. `min(faq_pages / total_pages * 10, 5)` |
| Statistics Density | 0-5 | Data points per page (percentages, numbers, "X years", "Y clients"). `min(avg_stats_per_page, 5)` |
| Author Attribution | 0-4 | Pages with named authors, bios, credentials. `(attributed_pages / total_pages) * 4` |
| Content Depth | 0-4 | Average word count per page relative to competitors. >1000 words on service pages = good. |
| Freshness | 0-4 | Content updated within last 6 months. `(fresh_pages / total_pages) * 4` |

### Notes
- Answer-first is the most impactful content signal for GEO
- "Answer-first" means the page leads with a direct, concise answer before elaborating
- Example: "The best dentist in Albany is [Name] because..." vs "Welcome to our practice, founded in..."
- Use Claude Haiku to evaluate answer-first quality per page (structured output: score 0-100 + reasoning)

## Pillar 3: Schema/Structured Data (0-15 points)

Measures the completeness and correctness of structured data on the website.

### Inputs
- Extracted JSON-LD, Microdata, RDFa from crawled pages

### Sub-scores

| Component | Points | Formula |
|-----------|--------|---------|
| Required Types Present | 0-8 | `(present_required / total_required) * 8` |
| Recommended Types Present | 0-4 | `(present_recommended / total_recommended) * 4` |
| Validation | 0-3 | `max(0, 3 - validation_error_count)` |

### Required Types by Vertical

| Vertical | Required Schema Types |
|----------|---------------------|
| **Base (all)** | Organization, LocalBusiness, WebSite, BreadcrumbList |
| dental | Dentist, FAQPage, MedicalProcedure, OpeningHoursSpecification |
| legal | LegalService, Attorney, FAQPage, Person (attorney bios) |
| hvac | HomeAndConstructionBusiness, Service, FAQPage, Offer |
| accounting | ProfessionalService, AccountingService, FAQPage |
| restaurant | Restaurant, Menu, FAQPage, AggregateRating |
| real_estate | RealEstateAgent, Offer, FAQPage |
| medical | MedicalBusiness, Physician, MedicalProcedure, FAQPage |

### Recommended Types (all verticals)
Person, AggregateRating, Review, Article, HowTo, Service, Offer, Event, VideoObject

### Notes
- Schema helps AI COMPREHENSION but does NOT directly increase citation rates
- Position this correctly in reports: "Schema ensures AI engines understand your business correctly"
- No CMS plugin generates vertical-specific schema (Dentist, Attorney, MedicalProcedure) — this is Pare's moat
- Interconnected schema graphs (Organization → LocalBusiness → Service → Review) are more valuable than isolated types

## Pillar 4: Technical Readiness (0-10 points)

Measures whether the website's technical setup supports AI engine access.

### Sub-scores

| Component | Points | How to Measure |
|-----------|--------|---------------|
| robots.txt AI Rules | 0-3 | Check if GPTBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended, Googlebot, Bingbot are allowed. `(allowed_bots / total_bots) * 3` |
| llms.txt Present | 0-2 | 1 point for llms.txt, 1 point for llms-full.txt |
| Sitemap | 0-2 | 1 point for sitemap.xml present, 1 point for valid |
| Mobile-Friendly | 0-1 | Binary: passes mobile test |
| HTTPS | 0-1 | Binary: site uses HTTPS |
| Page Speed | 0-1 | LCP < 2.5s = 1 point |

### AI Crawler User-Agents to Check
```
GPTBot, ChatGPT-User          # OpenAI
ClaudeBot, anthropic-ai        # Anthropic
PerplexityBot                   # Perplexity
Google-Extended, Googlebot      # Google
Bingbot                         # Microsoft/Copilot
```

### Notes
- llms.txt has low adoption and no confirmed crawler support, but easy to implement
- robots.txt blocking AI crawlers is the #1 quick-fix technical issue
- Most businesses don't know they're blocking AI crawlers — high-impact finding for reports

## Pillar 5: Local/GBP + Third-Party Signals (0-15 points)

Measures local search presence and third-party mention density.

### Sub-scores

| Component | Points | How to Measure |
|-----------|--------|---------------|
| GBP Profile Completeness | 0-5 | Description, categories, hours, photos (>10), Q&A, services listed. Each = 1 point, cap at 5. |
| Review Signals | 0-4 | Rating >= 4.0 = 2pts. Review count > 50 = 2pts. |
| NAP Consistency | 0-3 | Name, Address, Phone match across website + GBP + top 3 directories. Each consistent = 1pt. |
| Third-Party Mentions | 0-3 | Presence on Yelp, BBB, industry directories. Each with complete profile = 1pt, cap at 3. |

### Notes
- GBP data via Google Places API (requires API key)
- NAP consistency check: compare website footer, GBP listing, Yelp, BBB
- Third-party mentions are signals AI engines use for entity verification

## Letter Grade Scale

| Score | Grade |
|-------|-------|
| 90-100 | A |
| 80-89 | B |
| 70-79 | C |
| 60-69 | D |
| 0-59 | F |

## Implementation Notes

### Current Bugs in `packages/core/src/scoring.ts`
1. `calculateOverallScore()` sums raw pillar scores instead of normalizing to weights. Since each pillar already scores to its max weight, the sum works IF pillar scores are correctly bounded. But `DEFAULT_WEIGHTS` is declared and never used — the constant should be removed or the calculation should explicitly use weights.
2. `scoreAIVisibility()` uses max 35 points (old weight). Must be updated to 30.
3. `scoreSchema()` uses max 25 points (old weight). Must be updated to 15.
4. Content scoring and technical scoring functions are missing entirely.
5. GBP scoring function is missing.
6. Sentiment analysis in the parser uses keyword matching — must use LLM.

### Calculating the Composite Score
```typescript
function calculateOverallScore(audit: AuditResult): number {
  // Each pillar is already scored to its maximum (30, 30, 15, 10, 15)
  // The composite is simply the sum, capped at 100
  return Math.min(100, Math.round(
    audit.aiVisibility.score +
    audit.content.score +
    audit.schema.score +
    audit.technical.score +
    audit.gbp.score
  ));
}
```
