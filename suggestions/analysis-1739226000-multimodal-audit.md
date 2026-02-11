# [Feature]: Multi-modal Intelligence Audit (Video & Visual Retrieval)

## 1. Structural Insight (The "Why")
**The Shift:** Search has moved beyond text. Google's Gemini and OpenAI's GPT-4o are native multi-modal engines. They "watch" YouTube videos and "read" images to answer user queries (e.g., "Show me how Dr. Smith does a root canal" or "Does this café have outdoor seating?").
**The Gap:** `pare-engine` is currently text-blind. `crawl-site.ts` extracts Markdown and HTML, but it ignores the 2nd largest search engine (YouTube) and the visual context feeding Google Lens/Gemini.
**The Opportunity:** A client with 50 high-quality YouTube videos may be "invisible" to Gemini because they lack `VideoObject` schema or transcripts.
**The "Fear" Sell:** "Gemini is blind to your best content. I asked it 'How do you handle anxiety patients?' and it said 'I don't know', even though you have a 20-minute video on exactly that. We need to translate your video library into language the AI can index."

## 2. The Gap (Null Space)
*   **Current State:**
    *   `packages/core/src/contracts/crawl.contract.ts`: Captures `markdown` and `html`. No field for `mediaAssets` (video/audio).
    *   `packages/core/src/tools/crawl-site.ts`: Generic crawler. Doesn't extract video metadata.
    *   `packages/core/src/tools/generate-jsonld.ts`: Generates `LocalBusiness` schema, but likely misses `VideoObject` or `ImageObject` specificities.
*   **Missing:**
    *   **Media Extraction:** No logic to parse `<video>`, `<iframe>` (YouTube/Vimeo), or `<img>` tags for SEO viability (Alt text, EXIF, transcripts).
    *   **Transcript Analysis:** No tool to fetch YouTube captions and check them for "Answer-First" structure.
    *   **Visual Schema:** No validation for `VideoObject` properties (`uploadDate`, `description`, `thumbnailUrl`) which are required for video key moments in Search.

## 3. Proposed Specification

### User Story
**As the Consultant,** I want to audit the client's "Multi-modal Footprint" (Video & Images), **so that** I can prove they are losing traffic from Visual Search and Video Results, and sell a "Media Optimization" sprint.

### Technical Implementation

#### A. Contract Updates (`packages/core/src/contracts/crawl.contract.ts`)
Add `media` to the crawled page structure.

```typescript
export const MediaAssetSchema = z.object({
  type: z.enum(['video', 'image', 'audio']),
  url: z.string(),
  platform: z.enum(['youtube', 'vimeo', 'self-hosted', 'other']).optional(),
  altText: z.string().optional(),
  schemaPresent: z.boolean(), // Is there a VideoObject/ImageObject wrapping this?
  transcriptAvailable: z.boolean(),
});

export const CrawledPageSchema = z.object({
  // ... existing fields ...
  media: z.array(MediaAssetSchema).default([]),
});
```

#### B. Tool Updates (`packages/core/src/tools/extract-media.ts`)
New tool (or enhancement to `crawl-site`) that runs on the HTML:
1.  **YouTube/Vimeo Detection:** Regex match `youtube.com/embed/`, `vimeo.com/`.
2.  **Schema Match:** Check if the iframe/video tag is inside a JSON-LD `VideoObject` block.
3.  **Accessibility Check:** Check `<img>` tags for `alt` attributes and high-res source URLs.

#### C. New Tool: `analyze-video-seo.ts`
*   **Input:** `youtubeUrl`.
*   **Logic:**
    1.  Fetch public metadata (Title, Description, Tags) via generic scraper (no API key needed if possible, or use DataForSEO).
    2.  **Transcript Check:** Does it have captions? (Crucial for AI indexing).
    3.  **Key Moments:** Does the description have timestamps? (Required for "Key Moments" in Search).
*   **Output:** `VideoSeoScore` (0-100).

#### D. Reporting (`apps/web/app/admin`)
*   **New Section:** "Multi-modal Visibility".
*   **Visual:** "Video Graveyard" list (Videos with 0 schema/0 transcripts).
*   **Metric:** "Media Indexability Rate" (e.g., "Only 10% of your visual assets are readable by Gemini").

### 4. Pre-Mortem (Risks & Mitigations)

*   **Risk:** **YouTube API Quotas.** Fetching transcripts/metadata might require API keys.
    *   *Mitigation:* Use `ytdl-core` (or similar lightweight scrapers) for basic metadata, or rely on the embedded metadata on the client's page (Open Graph tags). We don't need deep analytics, just "existence" checks.
*   **Risk:** **False Positives.** Identifying "decorative" images as "missing SEO".
    *   *Mitigation:* Only audit images > 200x200px or those inside `<article>` tags. Ignore icons/UI elements.
*   **Risk:** **Scope Creep.** Video editing is expensive. We can't "fix" the video itself.
    *   *Mitigation:* The "Fix" is **Metadata & Schema**, not video editing. We sell the *wrapper* (JSON-LD, YouTube Description update, Transcript upload), not the *content* production.

## 5. Integration Plan
1.  **Step 1:** Update `crawl.contract.ts`.
2.  **Step 2:** Implement `extract-media.ts` (Parses HTML string).
3.  **Step 3:** Wire into `apps/audit-runner/src/steps/crawl.ts` (Post-processing step).
4.  **Step 4:** Add to PDF Report template.
