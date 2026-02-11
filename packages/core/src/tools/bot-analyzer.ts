// Task 4.3: Bot Welcome Mat (AI Crawler Access Analyzer)
// Checks if AI crawlers (GPTBot, ClaudeBot, etc.) can access the client's site
// by parsing their robots.txt file.
// Typed input -> typed output. Designed to be wrappable as an Inngest step.

// ---------------------------------------------------------------------------
// Error Class
// ---------------------------------------------------------------------------

export class BotAnalyzerError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'BotAnalyzerError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Bot Definitions
// ---------------------------------------------------------------------------

interface BotSpec {
  botName: string;
  userAgent: string;
  operator: string;
  isAiBot: boolean;
}

const AI_BOTS: BotSpec[] = [
  { botName: 'GPTBot', userAgent: 'GPTBot', operator: 'OpenAI', isAiBot: true },
  { botName: 'ChatGPT-User', userAgent: 'ChatGPT-User', operator: 'OpenAI', isAiBot: true },
  { botName: 'ClaudeBot', userAgent: 'ClaudeBot', operator: 'Anthropic', isAiBot: true },
  { botName: 'Claude-Web', userAgent: 'Claude-Web', operator: 'Anthropic', isAiBot: true },
  { botName: 'Google-Extended', userAgent: 'Google-Extended', operator: 'Google', isAiBot: true },
  { botName: 'PerplexityBot', userAgent: 'PerplexityBot', operator: 'Perplexity', isAiBot: true },
];

const REFERENCE_BOTS: BotSpec[] = [
  { botName: 'Googlebot', userAgent: 'Googlebot', operator: 'Google', isAiBot: false },
  { botName: 'Bingbot', userAgent: 'Bingbot', operator: 'Microsoft', isAiBot: false },
];

const ALL_BOTS: BotSpec[] = [...AI_BOTS, ...REFERENCE_BOTS];

const DEFAULT_PATHS = ['/', '/products', '/services', '/blog'];

// ---------------------------------------------------------------------------
// Input / Output Types
// ---------------------------------------------------------------------------

export interface BotAnalyzerInput {
  /** Client domain (e.g., "example.com"). */
  domain: string;
  /** Pre-fetched robots.txt content; if omitted, we fetch it. */
  robotsTxtContent?: string;
  /** Specific paths to check (default: ['/', '/products', '/services', '/blog']). */
  pathsToCheck?: string[];
}

export interface BotAccessResult {
  /** Bot identifier (e.g., "GPTBot"). */
  botName: string;
  /** User-Agent string used for matching. */
  userAgent: string;
  /** Overall access determination. */
  overallAccess: 'allowed' | 'blocked' | 'partial' | 'unknown';
  /** Per-path access results. */
  pathResults: Array<{
    path: string;
    allowed: boolean;
  }>;
}

export interface BotAnalyzerOutput {
  /** The domain analyzed. */
  domain: string;
  /** Whether a robots.txt was found. */
  robotsTxtFound: boolean;
  /** Raw robots.txt content, or null if not found. */
  robotsTxtContent: string | null;
  /** Access results for each bot. */
  bots: BotAccessResult[];
  /** True if ALL primary AI bots (GPTBot, ClaudeBot, Google-Extended) are blocked on all paths. */
  aiInvisible: boolean;
  /** Actionable recommendations. */
  recommendations: string[];
  /** Timestamp of analysis. */
  analyzedAt: Date;
}

// ---------------------------------------------------------------------------
// Robots.txt Parser
// ---------------------------------------------------------------------------

interface RobotsRule {
  type: 'allow' | 'disallow';
  path: string;
}

interface RobotsGroup {
  userAgents: string[];
  rules: RobotsRule[];
}

/**
 * Parses robots.txt content into structured groups.
 * Handles standard directives: User-agent, Allow, Disallow.
 * Comments (lines starting with #) and blank lines are ignored.
 */
function parseRobotsTxt(content: string): RobotsGroup[] {
  const groups: RobotsGroup[] = [];
  let currentUserAgents: string[] = [];
  let currentRules: RobotsRule[] = [];
  let inGroup = false;

  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    // Strip comments and whitespace
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) {
      continue;
    }

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) {
      continue;
    }

    const directive = line.substring(0, colonIndex).trim().toLowerCase();
    const value = line.substring(colonIndex + 1).trim();

    if (directive === 'user-agent') {
      if (inGroup && currentRules.length > 0) {
        // We had rules, so finalize the previous group
        groups.push({ userAgents: [...currentUserAgents], rules: [...currentRules] });
        currentUserAgents = [];
        currentRules = [];
      }
      if (currentRules.length > 0) {
        // Rules existed before a new User-agent — finalize
        groups.push({ userAgents: [...currentUserAgents], rules: [...currentRules] });
        currentUserAgents = [];
        currentRules = [];
      }
      currentUserAgents.push(value);
      inGroup = true;
    } else if (directive === 'disallow' && inGroup) {
      currentRules.push({ type: 'disallow', path: value });
    } else if (directive === 'allow' && inGroup) {
      currentRules.push({ type: 'allow', path: value });
    }
    // Ignore other directives (Sitemap, Crawl-delay, etc.)
  }

  // Finalize the last group
  if (currentUserAgents.length > 0 && currentRules.length > 0) {
    groups.push({ userAgents: currentUserAgents, rules: currentRules });
  }

  return groups;
}

/**
 * Determines if a given path is allowed for a given bot user-agent,
 * based on parsed robots.txt groups.
 *
 * Matching rules (following standard robots.txt conventions):
 * 1. Look for a group with a matching User-agent (case-insensitive).
 * 2. If no specific group, fall back to the wildcard group (User-agent: *).
 * 3. If no wildcard group, the path is allowed.
 * 4. Within a group, the most specific path match wins.
 * 5. If specificity ties, Allow wins over Disallow.
 * 6. Empty Disallow ("Disallow:") means allow all.
 */
function isPathAllowed(
  groups: RobotsGroup[],
  userAgent: string,
  path: string,
): boolean {
  const normalizedUA = userAgent.toLowerCase();

  // Find the most specific matching group
  let matchedGroup: RobotsGroup | null = null;
  let wildcardGroup: RobotsGroup | null = null;

  for (const group of groups) {
    for (const ua of group.userAgents) {
      const normalizedGroupUA = ua.toLowerCase();
      if (normalizedGroupUA === '*') {
        wildcardGroup = group;
      } else if (normalizedGroupUA === normalizedUA) {
        matchedGroup = group;
      }
    }
  }

  const effectiveGroup = matchedGroup ?? wildcardGroup;

  if (!effectiveGroup) {
    // No rules found for this bot — allowed
    return true;
  }

  return evaluateRules(effectiveGroup.rules, path);
}

/**
 * Evaluates a set of Allow/Disallow rules against a given path.
 * Most specific (longest) path match wins. On tie, Allow wins.
 */
function evaluateRules(rules: RobotsRule[], path: string): boolean {
  let bestMatch: { type: 'allow' | 'disallow'; length: number } | null = null;

  for (const rule of rules) {
    // Empty Disallow means "allow all"
    if (rule.type === 'disallow' && rule.path === '') {
      // This is effectively "allow everything" — only counts if nothing
      // else matches. We treat it as an allow with length 0.
      if (bestMatch === null || 0 > bestMatch.length) {
        bestMatch = { type: 'allow', length: 0 };
      }
      continue;
    }

    if (pathMatches(rule.path, path)) {
      const matchLength = rule.path.length;
      if (
        bestMatch === null
        || matchLength > bestMatch.length
        || (matchLength === bestMatch.length && rule.type === 'allow')
      ) {
        bestMatch = { type: rule.type, length: matchLength };
      }
    }
  }

  if (bestMatch === null) {
    // No rules matched — default is allowed
    return true;
  }

  return bestMatch.type === 'allow';
}

/**
 * Checks if a robots.txt path pattern matches a given URL path.
 * Standard path prefix matching: /products blocks /products, /products/123, etc.
 * but does NOT block /product (no trailing slash).
 *
 * Supports:
 * - Prefix matching (standard)
 * - `$` anchor at end of path (exact match)
 * - `*` wildcard within path
 */
function pathMatches(pattern: string, urlPath: string): boolean {
  if (!pattern) {
    return false;
  }

  // Handle $ anchor (exact match)
  if (pattern.endsWith('$')) {
    const exactPattern = pattern.slice(0, -1);
    if (exactPattern.includes('*')) {
      return wildcardMatch(exactPattern, urlPath, true);
    }
    return urlPath === exactPattern;
  }

  // Handle * wildcard
  if (pattern.includes('*')) {
    return wildcardMatch(pattern, urlPath, false);
  }

  // Standard prefix matching
  return urlPath.startsWith(pattern);
}

/**
 * Simple wildcard matching where `*` matches any sequence of characters.
 */
function wildcardMatch(pattern: string, text: string, exact: boolean): boolean {
  const parts = pattern.split('*');
  let pos = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === '') {
      continue;
    }

    const idx = text.indexOf(part, pos);
    if (idx === -1) {
      return false;
    }

    // First segment must match from start
    if (i === 0 && idx !== 0) {
      return false;
    }

    pos = idx + part.length;
  }

  if (exact) {
    // For exact match with $, the last segment must reach the end
    const lastPart = parts[parts.length - 1];
    if (lastPart !== '') {
      return text.endsWith(lastPart);
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// Robots.txt Fetcher
// ---------------------------------------------------------------------------

const FETCH_TIMEOUT_MS = 10000;

async function fetchRobotsTxt(domain: string): Promise<{ found: boolean; content: string | null }> {
  const normalizedDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');

  const url = `https://${normalizedDomain}/robots.txt`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'PareEngineBot/1.0 (+https://pare.consulting)',
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      // 404 or other error — no robots.txt
      return { found: false, content: null };
    }

    const content = await response.text();

    // Validate it looks like a robots.txt (should contain User-agent or Sitemap)
    const lower = content.toLowerCase();
    if (!lower.includes('user-agent') && !lower.includes('sitemap') && !lower.includes('disallow')) {
      // Content doesn't look like a robots.txt (might be a custom 404 page)
      return { found: false, content: null };
    }

    return { found: true, content };
  } catch {
    // Network error, timeout, etc. — treat as not found
    return { found: false, content: null };
  }
}

// ---------------------------------------------------------------------------
// Recommendation Generator
// ---------------------------------------------------------------------------

function generateRecommendations(bots: BotAccessResult[], aiInvisible: boolean): string[] {
  const recommendations: string[] = [];

  if (aiInvisible) {
    recommendations.push(
      'Your site is invisible to all major AI engines. This severely impacts your AI discoverability. '
      + 'Consider allowing GPTBot, ClaudeBot, and Google-Extended in your robots.txt to appear in AI-generated responses.',
    );
    return recommendations;
  }

  const blockedAiBots = bots.filter(
    (b) => AI_BOTS.some((ab) => ab.botName === b.botName) && b.overallAccess === 'blocked',
  );
  const partialAiBots = bots.filter(
    (b) => AI_BOTS.some((ab) => ab.botName === b.botName) && b.overallAccess === 'partial',
  );

  if (blockedAiBots.length > 0) {
    const botNames = blockedAiBots.map((b) => b.botName).join(', ');
    recommendations.push(
      `The following AI crawlers are fully blocked: ${botNames}. `
      + 'Consider allowing them to improve your visibility in AI-generated responses.',
    );
  }

  if (partialAiBots.length > 0) {
    const botNames = partialAiBots.map((b) => b.botName).join(', ');
    recommendations.push(
      `The following AI crawlers have partial access: ${botNames}. `
      + 'Review your robots.txt rules to ensure key content pages (services, products, blog) are accessible.',
    );
  }

  if (blockedAiBots.length === 0 && partialAiBots.length === 0) {
    recommendations.push(
      'Your site is accessible to all major AI crawlers. '
      + 'This is optimal for AI discoverability.',
    );
  }

  // Check specific high-value bots
  const gptBotResult = bots.find((b) => b.botName === 'GPTBot');
  if (gptBotResult && gptBotResult.overallAccess === 'blocked') {
    recommendations.push(
      'GPTBot (OpenAI) is blocked. This means ChatGPT cannot crawl your site for real-time browsing or training data.',
    );
  }

  const claudeBotResult = bots.find((b) => b.botName === 'ClaudeBot');
  if (claudeBotResult && claudeBotResult.overallAccess === 'blocked') {
    recommendations.push(
      'ClaudeBot (Anthropic) is blocked. This limits your visibility in Claude-powered applications.',
    );
  }

  const googleExtResult = bots.find((b) => b.botName === 'Google-Extended');
  if (googleExtResult && googleExtResult.overallAccess === 'blocked') {
    recommendations.push(
      'Google-Extended is blocked. This prevents Google from using your content for AI training and Gemini responses.',
    );
  }

  return recommendations;
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

/**
 * Analyzes a site's robots.txt to determine AI crawler access.
 *
 * Checks whether major AI bots (GPTBot, ClaudeBot, PerplexityBot, etc.)
 * can access key paths on the client's site, and generates actionable
 * recommendations.
 *
 * If `robotsTxtContent` is provided in the input, the fetch is skipped.
 * Otherwise, the function fetches `https://{domain}/robots.txt`.
 *
 * Graceful degradation: if the fetch fails, the function returns results
 * indicating the robots.txt was not found (all bots assumed allowed).
 */
export async function analyzeBotAccess(input: BotAnalyzerInput): Promise<BotAnalyzerOutput> {
  const { domain, robotsTxtContent, pathsToCheck } = input;

  if (!domain || !domain.trim()) {
    throw new BotAnalyzerError('Domain is required', 'MISSING_DOMAIN');
  }

  const paths = pathsToCheck && pathsToCheck.length > 0 ? pathsToCheck : DEFAULT_PATHS;

  // Fetch or use provided robots.txt
  let robotsTxtFound: boolean;
  let content: string | null;

  if (robotsTxtContent !== undefined && robotsTxtContent !== null) {
    robotsTxtFound = true;
    content = robotsTxtContent;
  } else {
    const fetchResult = await fetchRobotsTxt(domain);
    robotsTxtFound = fetchResult.found;
    content = fetchResult.content;
  }

  // Parse robots.txt
  const groups = content ? parseRobotsTxt(content) : [];

  // Analyze each bot
  const bots: BotAccessResult[] = ALL_BOTS.map((botSpec) => {
    const pathResults = paths.map((path) => ({
      path,
      allowed: isPathAllowed(groups, botSpec.userAgent, path),
    }));

    const allowedCount = pathResults.filter((r) => r.allowed).length;
    let overallAccess: 'allowed' | 'blocked' | 'partial' | 'unknown';

    if (!robotsTxtFound) {
      // No robots.txt means all bots are allowed (but we report "unknown" if
      // the fetch failed). Since we can't distinguish "no file" from "fetch error"
      // cleanly, treat no-robots.txt as allowed (standard behavior).
      overallAccess = 'allowed';
    } else if (allowedCount === paths.length) {
      overallAccess = 'allowed';
    } else if (allowedCount === 0) {
      overallAccess = 'blocked';
    } else {
      overallAccess = 'partial';
    }

    return {
      botName: botSpec.botName,
      userAgent: botSpec.userAgent,
      overallAccess,
      pathResults,
    };
  });

  // Determine if the site is completely invisible to AI
  // True if GPTBot AND ClaudeBot AND Google-Extended are ALL blocked
  const criticalBots = ['GPTBot', 'ClaudeBot', 'Google-Extended'];
  const aiInvisible = criticalBots.every((botName) => {
    const botResult = bots.find((b) => b.botName === botName);
    return botResult?.overallAccess === 'blocked';
  });

  const recommendations = generateRecommendations(bots, aiInvisible);

  return {
    domain,
    robotsTxtFound,
    robotsTxtContent: content,
    bots,
    aiInvisible,
    recommendations,
    analyzedAt: new Date(),
  };
}
