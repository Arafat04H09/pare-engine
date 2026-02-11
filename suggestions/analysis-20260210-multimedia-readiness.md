# [Feature]: Multimedia & Video AI Readiness (The "Dark Data" Unlock)

## 1. Structural Insight (The "Why")
**Latent Intent:** The web is transitioning from Text-First to Video-First.
*   **Market Shift:** TikTok and YouTube are search engines.
*   **AI Shift:** Gemini 1.5 Pro and GPT-4o are **Multimodal**. They can "watch" video and "listen" to audio.
*   **The Problem:** Most SMBs have "Dark Data"—rich video content on Instagram/YouTube that is completely disconnected from their website's entity graph.
    *   *Example:* A dentist has 50 videos on Instagram explaining "Invisalign," but their website is a text desert. The AI sees the text desert.
*   **The Leverage:** If we connect the Video Asset to the Business Entity via **VideoObject Schema** and **Transcripts**, we instantly flood the AI with high-authority content without writing a single new word.
*   **The Spread:** Cost to audit ($0.05). Value of "Unlocking your entire video library for AI Search" ($2,000+).

## 2. The Gap (Null Space)
*   **Existing:**
    *   `content-optimizer.ts`: Analyzes text (Markdown).
    *   `generate-jsonld.ts`: Handles `LocalBusiness`, `FAQ`, `Product`.
*   **Missing:**
    *   **No Video Awareness:** The current crawler (`Firecrawl`) extracts text. It likely ignores `<video>`, `<iframe>`, or YouTube embeds.
    *   **No Schema Support:** `VideoObject` schema is missing from the contracts.
    *   **No Transcript Check:** We don't check if videos have accessible captions/transcripts (critical for older RAG models).

## 3. Proposed Specification

### User Story
**As a Consultant,** I want to scan a client's site (and their YouTube channel) to identify "Unlinked Video Assets," **so that** I can sell a "Multimedia Optimization Sprint" to structure this data for AI indexing.

### Technical Implementation

#### A. New Tool: `audit-multimedia.ts`
*   **Input:** `domain`, `youtubeChannelId` (optional).
*   **Process:**
    1.  **On-Page Scan:** Detect `<iframe>` (YouTube/Vimeo) and `<video>` tags.
    2.  **Schema Check:** For each video, is there a matching `VideoObject` schema?
        *   *Critical Fields:* `name`, `description`, `uploadDate`, `transcript`, `thumbnailUrl`.
    3.  **YouTube Cross-Reference:**
        *   (Tier 2 Integration): Use YouTube Data API (or scrape) to fetch the client's recent uploads.
        *   **Gap Analysis:** "You have 50 videos on YouTube, but only 2 are embedded/schema-marked on your site."
    4.  **Transcript Availability:** Check if the video has Closed Captions (CC) available.
*   **Output:** `MultimediaReadinessResult`.
    *   `score`: 0-100.
    *   `missingSchemaCount`: number.
    *   `unlinkedAssetCount`: number.

#### B. Implementation Generator: `generate-video-schema.ts`
*   **Input:** YouTube URL.
*   **Process:**
    1.  Fetch Metadata (Title, Desc, Thumb).
    2.  Fetch Transcript (if available).
    3.  **Generate JSON-LD:** Create a full `VideoObject` block, including the transcript text (truncated if needed) to feed the AI context window.
*   **Output:** JSON-LD block ready for copy-paste.

#### C. Report Section: "Visual Intelligence"
*   **Narrative:** "Gemini can watch your videos, but only if you tell it where they are. You are currently hiding 90% of your expertise on YouTube."
*   **Visual:** "Video Visibility Graph" (Videos Owned vs. Videos Indexed).

## 4. Pre-Mortem (Risks & Mitigations)

*   **Risk: Cost of YouTube API.**
    *   *Mitigation:* Use `no-cookie` embed scraping first. Only use API for deep channel audits (Tier B/C feature).
*   **Risk: Firecrawl Limitations.**
    *   *Mitigation:* Firecrawl might strip iframes. We may need to configure the crawler to preserve specific selectors (`iframe[src*="youtube"]`) or run a lightweight Puppeteer script just for media extraction.
*   **Risk: "Shorts" vs Long-form.**
    *   *Mitigation:* Treat them differently. Shorts are for brand awareness; Long-form is for "Knowledge Graph" authority. Prioritize Long-form schema.

## 5. Strategic Value
This opens up a new **"Retainer Activity"**:
*   *Month 1:* Audit & Schema.
*   *Month 2+:* "We will optimize 4 videos per month." (Generate Schema + Transcript + Blog Post wrapper).
*   This turns a static asset (old video) into a dynamic SEO asset.
