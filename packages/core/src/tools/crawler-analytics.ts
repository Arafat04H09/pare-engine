// Owner: S28 (AI Crawler Analytics)
// Typed tool functions for parsing AI bot visits from web server logs,
// verifying bot identity via official IP ranges, and querying visit history.
//
// Recognized bots: GPTBot, ChatGPT-User, ClaudeBot, anthropic-ai,
// PerplexityBot, Googlebot (AI), Bytespider, Applebot-Extended
//
// This file contains only pure logic and type definitions.
// The webhook route lives in apps/web/app/api/webhooks/crawler-log/route.ts.
// Actual database writes happen in the webhook handler, not here.

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Error Classes
// ---------------------------------------------------------------------------

export class CrawlerAnalyticsError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'CrawlerAnalyticsError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Bot Definitions
// ---------------------------------------------------------------------------

/**
 * Recognized AI bot identifiers. Each has a user-agent pattern,
 * the company that operates it, and an optional URL for their
 * published IP range list.
 */
export interface BotDefinition {
  /** Unique bot identifier used in this system. */
  botName: string;
  /** Regex to match this bot's User-Agent string. */
  userAgentPattern: RegExp;
  /** Company/org that operates the bot. */
  operator: string;
  /**
   * URL to fetch the official IP range list for verification.
   * `null` if the operator does not publish one.
   */
  ipRangeUrl: string | null;
  /** Purpose of the bot. */
  purpose: string;
}

export const AI_BOT_DEFINITIONS: readonly BotDefinition[] = [
  {
    botName: 'GPTBot',
    userAgentPattern: /GPTBot/i,
    operator: 'OpenAI',
    ipRangeUrl: 'https://openai.com/gptbot-ranges.txt',
    purpose: 'OpenAI web crawler for training and browsing',
  },
  {
    botName: 'ChatGPT-User',
    userAgentPattern: /ChatGPT-User/i,
    operator: 'OpenAI',
    ipRangeUrl: 'https://openai.com/chatgpt-user.json',
    purpose: 'ChatGPT user-initiated browsing',
  },
  {
    botName: 'ClaudeBot',
    userAgentPattern: /ClaudeBot/i,
    operator: 'Anthropic',
    ipRangeUrl: null,
    purpose: 'Anthropic web crawler',
  },
  {
    botName: 'anthropic-ai',
    userAgentPattern: /anthropic-ai/i,
    operator: 'Anthropic',
    ipRangeUrl: null,
    purpose: 'Anthropic AI agent requests',
  },
  {
    botName: 'PerplexityBot',
    userAgentPattern: /PerplexityBot/i,
    operator: 'Perplexity',
    ipRangeUrl: null,
    purpose: 'Perplexity AI search crawler',
  },
  {
    botName: 'Googlebot-AI',
    userAgentPattern: /Google-Extended/i,
    operator: 'Google',
    ipRangeUrl: 'https://developers.google.com/static/search/apis/ipranges/googlebot.json',
    purpose: 'Google AI training crawler (Google-Extended)',
  },
  {
    botName: 'Bytespider',
    userAgentPattern: /Bytespider/i,
    operator: 'ByteDance',
    ipRangeUrl: null,
    purpose: 'ByteDance web crawler (TikTok AI)',
  },
  {
    botName: 'Applebot-Extended',
    userAgentPattern: /Applebot-Extended/i,
    operator: 'Apple',
    ipRangeUrl: null,
    purpose: 'Apple AI training crawler',
  },
] as const;

// ---------------------------------------------------------------------------
// Schemas & Types
// ---------------------------------------------------------------------------

export const CrawlerVisitSchema = z.object({
  /** IP address of the visitor. */
  ip: z.string(),
  /** Raw user-agent string. */
  userAgent: z.string(),
  /** ISO 8601 timestamp of the visit. */
  timestamp: z.string().datetime(),
  /** HTTP method (GET, POST, etc.). */
  method: z.string().default('GET'),
  /** Requested URL path. */
  path: z.string(),
  /** HTTP status code returned. */
  statusCode: z.number().int().min(100).max(599),
  /** Response size in bytes, if available. */
  responseSize: z.number().int().nonnegative().optional(),
  /** The domain/host that was visited. */
  domain: z.string(),
});

export type CrawlerVisit = z.infer<typeof CrawlerVisitSchema>;

export const ParsedBotVisitSchema = z.object({
  /** The raw visit data. */
  visit: CrawlerVisitSchema,
  /** Identified bot name, or null if not recognized as an AI bot. */
  botName: z.string().nullable(),
  /** Operator company, or null if not recognized. */
  operator: z.string().nullable(),
  /** Whether the bot was identified as a known AI crawler. */
  isAiBot: z.boolean(),
  /** IP verification status. */
  ipVerified: z.enum(['verified', 'unverified', 'pending', 'no_range_available']),
});

export type ParsedBotVisit = z.infer<typeof ParsedBotVisitSchema>;

export const CrawlerLogEntrySchema = z.object({
  /** Raw log line (Common/Combined Log Format, JSON, or custom). */
  raw: z.string(),
  /** Pre-parsed fields, if the caller has already parsed the log. */
  parsed: CrawlerVisitSchema.optional(),
});

export type CrawlerLogEntry = z.infer<typeof CrawlerLogEntrySchema>;

export const CrawlerAnalyticsSummarySchema = z.object({
  /** Domain being analyzed. */
  domain: z.string(),
  /** Time range start (ISO 8601). */
  periodStart: z.string().datetime(),
  /** Time range end (ISO 8601). */
  periodEnd: z.string().datetime(),
  /** Total visits from AI bots in the period. */
  totalAiBotVisits: z.number().int().nonnegative(),
  /** Total unrecognized visits that were logged. */
  totalUnknownVisits: z.number().int().nonnegative(),
  /** Per-bot breakdown. */
  botBreakdown: z.array(z.object({
    botName: z.string(),
    operator: z.string(),
    visitCount: z.number().int().nonnegative(),
    uniquePaths: z.number().int().nonnegative(),
    lastSeen: z.string().datetime(),
    verifiedCount: z.number().int().nonnegative(),
    unverifiedCount: z.number().int().nonnegative(),
  })),
  /** Most visited paths by AI bots. */
  topPaths: z.array(z.object({
    path: z.string(),
    visitCount: z.number().int().nonnegative(),
    bots: z.array(z.string()),
  })),
});

export type CrawlerAnalyticsSummary = z.infer<typeof CrawlerAnalyticsSummarySchema>;

// ---------------------------------------------------------------------------
// Webhook Request/Response Schemas
// ---------------------------------------------------------------------------

export const CrawlerLogWebhookRequestSchema = z.object({
  /** The domain this log data is from. */
  domain: z.string().min(1),
  /** Array of log entries (raw strings or pre-parsed). */
  entries: z.array(CrawlerLogEntrySchema).min(1).max(1000),
});

export type CrawlerLogWebhookRequest = z.infer<typeof CrawlerLogWebhookRequestSchema>;

export const CrawlerLogWebhookResponseSchema = z.object({
  /** Whether the webhook processed successfully. */
  success: z.boolean(),
  /** Number of entries processed. */
  processed: z.number().int().nonnegative(),
  /** Number of AI bot visits identified. */
  aiBotVisitsFound: z.number().int().nonnegative(),
  /** Number of entries that could not be parsed. */
  parseErrors: z.number().int().nonnegative(),
  /** Details of identified bot visits. */
  visits: z.array(ParsedBotVisitSchema),
});

export type CrawlerLogWebhookResponse = z.infer<typeof CrawlerLogWebhookResponseSchema>;

// ---------------------------------------------------------------------------
// Log Parsing
// ---------------------------------------------------------------------------

/**
 * Common Log Format (CLF) regex.
 * Matches: 66.249.64.1 - - [10/Oct/2023:13:55:36 -0700] "GET /page HTTP/1.1" 200 2326
 * Also handles Combined Log Format (CLF + referer + user-agent).
 */
const CLF_REGEX =
  /^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+"(\S+)\s+(\S+)\s+\S+"\s+(\d{3})\s+(\d+|-)/;

/**
 * Extended CLF with user-agent (Combined Log Format).
 * Matches the referer and user-agent fields after the status/size.
 */
const COMBINED_REGEX =
  /^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+"(\S+)\s+(\S+)\s+\S+"\s+(\d{3})\s+(\d+|-)\s+"[^"]*"\s+"([^"]*)"/;

/**
 * Parse a CLF/Combined Log Format timestamp into ISO 8601.
 * Input: "10/Oct/2023:13:55:36 -0700"
 * Output: ISO 8601 string
 */
function parseClfTimestamp(clfTimestamp: string): string {
  const months: Record<string, string> = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04',
    May: '05', Jun: '06', Jul: '07', Aug: '08',
    Sep: '09', Oct: '10', Nov: '11', Dec: '12',
  };

  // Format: dd/Mon/yyyy:HH:mm:ss +zzzz
  const match = clfTimestamp.match(
    /(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})\s+([+-]\d{4})/
  );

  if (!match) {
    // Fall back to current time if unparseable
    return new Date().toISOString();
  }

  const [, day, monthStr, year, hours, minutes, seconds, tz] = match;
  const month = months[monthStr] ?? '01';
  const tzFormatted = `${tz.slice(0, 3)}:${tz.slice(3)}`;

  return new Date(
    `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${tzFormatted}`
  ).toISOString();
}

/**
 * Parse a raw log line into a CrawlerVisit.
 * Supports Common Log Format, Combined Log Format, and JSON.
 *
 * @param raw - Raw log line
 * @param domain - The domain this log belongs to
 * @returns Parsed visit or null if the line cannot be parsed
 */
export function parseLogLine(raw: string, domain: string): CrawlerVisit | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  // Try JSON format first
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      // Attempt to map common JSON log field names
      const visit: CrawlerVisit = {
        ip: parsed.ip ?? parsed.remote_addr ?? parsed.client_ip ?? parsed.clientIp ?? '',
        userAgent: parsed.userAgent ?? parsed.user_agent ?? parsed.http_user_agent ?? '',
        timestamp: parsed.timestamp ?? parsed.time ?? parsed['@timestamp'] ?? new Date().toISOString(),
        method: parsed.method ?? parsed.request_method ?? 'GET',
        path: parsed.path ?? parsed.url ?? parsed.request_uri ?? parsed.uri ?? '/',
        statusCode: Number(parsed.statusCode ?? parsed.status ?? parsed.response_code ?? 200),
        responseSize: parsed.responseSize ?? parsed.body_bytes_sent ?? parsed.bytes ?? undefined,
        domain,
      };

      // Validate timestamp format
      if (!visit.timestamp.includes('T') && !visit.timestamp.includes('Z')) {
        visit.timestamp = new Date(visit.timestamp).toISOString();
      }

      return visit;
    } catch {
      // Not valid JSON, try CLF
    }
  }

  // Try Combined Log Format (has user-agent)
  const combinedMatch = trimmed.match(COMBINED_REGEX);
  if (combinedMatch) {
    const [, ip, timestamp, method, path, statusStr, sizeStr, userAgent] = combinedMatch;
    return {
      ip,
      userAgent,
      timestamp: parseClfTimestamp(timestamp),
      method,
      path,
      statusCode: Number(statusStr),
      responseSize: sizeStr === '-' ? undefined : Number(sizeStr),
      domain,
    };
  }

  // Try Common Log Format (no user-agent)
  const clfMatch = trimmed.match(CLF_REGEX);
  if (clfMatch) {
    const [, ip, timestamp, method, path, statusStr, sizeStr] = clfMatch;
    return {
      ip,
      userAgent: '', // CLF doesn't include user-agent
      timestamp: parseClfTimestamp(timestamp),
      method,
      path,
      statusCode: Number(statusStr),
      responseSize: sizeStr === '-' ? undefined : Number(sizeStr),
      domain,
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Bot Identification
// ---------------------------------------------------------------------------

/**
 * Identify which AI bot (if any) made a request based on the User-Agent string.
 *
 * @param userAgent - The User-Agent header value
 * @returns The matching BotDefinition, or null if not a recognized AI bot
 */
export function identifyAiBot(userAgent: string): BotDefinition | null {
  if (!userAgent) {
    return null;
  }

  for (const botDef of AI_BOT_DEFINITIONS) {
    if (botDef.userAgentPattern.test(userAgent)) {
      return botDef;
    }
  }

  return null;
}

/**
 * Parse a single crawler log entry and identify AI bot visits.
 * This is the main entry point for log parsing.
 *
 * @param logEntry - Raw log line string
 * @param domain - The domain this log belongs to
 * @returns Parsed bot visit with identification info, or null if unparseable
 */
export function parseCrawlerLog(logEntry: string, domain: string = 'unknown'): ParsedBotVisit | null {
  const visit = parseLogLine(logEntry, domain);
  if (!visit) {
    return null;
  }

  const botDef = identifyAiBot(visit.userAgent);

  return {
    visit,
    botName: botDef?.botName ?? null,
    operator: botDef?.operator ?? null,
    isAiBot: botDef !== null,
    ipVerified: 'pending',
  };
}

/**
 * Parse a pre-parsed CrawlerVisit and identify AI bot visits.
 * Used when the caller has already parsed log fields (e.g., from a structured webhook payload).
 *
 * @param visit - Already-parsed visit data
 * @returns Parsed bot visit with identification info
 */
export function identifyCrawlerVisit(visit: CrawlerVisit): ParsedBotVisit {
  const botDef = identifyAiBot(visit.userAgent);

  return {
    visit,
    botName: botDef?.botName ?? null,
    operator: botDef?.operator ?? null,
    isAiBot: botDef !== null,
    ipVerified: 'pending',
  };
}

// ---------------------------------------------------------------------------
// IP Verification
// ---------------------------------------------------------------------------

/**
 * In-memory cache for IP ranges fetched from official sources.
 * Keyed by bot name, holds CIDR ranges and a TTL.
 */
interface IpRangeCache {
  ranges: string[];
  fetchedAt: number;
  ttlMs: number;
}

const ipRangeCacheMap = new Map<string, IpRangeCache>();

/** Default TTL for cached IP ranges: 24 hours. */
const DEFAULT_IP_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Parse a CIDR notation string into a base IP (as a BigInt for v4, or string for v6)
 * and a prefix length.
 */
function parseCidr(cidr: string): { base: bigint; prefixLength: number; isV6: boolean } | null {
  const parts = cidr.split('/');
  if (parts.length !== 2) {
    return null;
  }

  const [ipStr, prefixStr] = parts;
  const prefixLength = Number(prefixStr);
  if (Number.isNaN(prefixLength)) {
    return null;
  }

  // IPv6
  if (ipStr.includes(':')) {
    const expanded = expandIpv6(ipStr);
    if (!expanded) {
      return null;
    }
    const base = ipv6ToBigInt(expanded);
    return { base, prefixLength, isV6: true };
  }

  // IPv4
  const octets = ipStr.split('.');
  if (octets.length !== 4) {
    return null;
  }
  const base = octets.reduce((acc, octet) => (acc << 8n) | BigInt(Number(octet)), 0n);
  return { base, prefixLength, isV6: false };
}

/**
 * Expand an IPv6 address to its full 8-group representation.
 */
function expandIpv6(ip: string): string | null {
  try {
    let groups: string[];

    if (ip.includes('::')) {
      const [left, right] = ip.split('::');
      const leftGroups = left ? left.split(':') : [];
      const rightGroups = right ? right.split(':') : [];
      const missingGroups = 8 - leftGroups.length - rightGroups.length;
      if (missingGroups < 0) {
        return null;
      }
      groups = [
        ...leftGroups,
        ...Array(missingGroups).fill('0'),
        ...rightGroups,
      ];
    } else {
      groups = ip.split(':');
    }

    if (groups.length !== 8) {
      return null;
    }

    return groups.map((g) => g.padStart(4, '0')).join(':');
  } catch {
    return null;
  }
}

/**
 * Convert a fully expanded IPv6 address to a BigInt.
 */
function ipv6ToBigInt(expanded: string): bigint {
  const groups = expanded.split(':');
  let result = 0n;
  for (const group of groups) {
    result = (result << 16n) | BigInt(parseInt(group, 16));
  }
  return result;
}

/**
 * Convert an IPv4 address string to a BigInt.
 */
function ipv4ToBigInt(ip: string): bigint {
  const octets = ip.split('.');
  if (octets.length !== 4) {
    return -1n;
  }
  return octets.reduce((acc, octet) => (acc << 8n) | BigInt(Number(octet)), 0n);
}

/**
 * Check if an IP address falls within a CIDR range.
 */
function ipInCidr(ip: string, cidr: string): boolean {
  const parsed = parseCidr(cidr);
  if (!parsed) {
    return false;
  }

  const { base, prefixLength, isV6 } = parsed;

  if (isV6) {
    // IPv6
    if (!ip.includes(':')) {
      return false; // Can't compare v4 IP against v6 range
    }
    const expanded = expandIpv6(ip);
    if (!expanded) {
      return false;
    }
    const ipBigInt = ipv6ToBigInt(expanded);
    const totalBits = 128;
    const mask = ((1n << BigInt(totalBits)) - 1n) ^ ((1n << BigInt(totalBits - prefixLength)) - 1n);
    return (ipBigInt & mask) === (base & mask);
  }

  // IPv4
  if (ip.includes(':')) {
    return false; // Can't compare v6 IP against v4 range
  }
  const ipBigInt = ipv4ToBigInt(ip);
  if (ipBigInt < 0n) {
    return false;
  }
  const totalBits = 32;
  const mask = ((1n << BigInt(totalBits)) - 1n) ^ ((1n << BigInt(totalBits - prefixLength)) - 1n);
  return (ipBigInt & mask) === (base & mask);
}

/**
 * Fetch official IP ranges for a bot from its published URL.
 * Supports plain-text CIDR lists (OpenAI) and JSON formats (Google).
 *
 * @param url - URL to fetch IP ranges from
 * @returns Array of CIDR strings
 */
async function fetchIpRanges(url: string): Promise<string[]> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'pare-engine-crawler-analytics/1.0' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new CrawlerAnalyticsError(
        `Failed to fetch IP ranges from ${url}: ${response.status} ${response.statusText}`,
        'IP_RANGE_FETCH_FAILED'
      );
    }

    const contentType = response.headers.get('content-type') ?? '';
    const body = await response.text();

    // JSON format (Google style: { prefixes: [{ ipv4Prefix: "..." }, { ipv6Prefix: "..." }] })
    if (contentType.includes('json') || body.trim().startsWith('{')) {
      try {
        const json = JSON.parse(body);
        const ranges: string[] = [];

        // Google format
        if (Array.isArray(json.prefixes)) {
          for (const entry of json.prefixes) {
            if (entry.ipv4Prefix) {
              ranges.push(entry.ipv4Prefix);
            }
            if (entry.ipv6Prefix) {
              ranges.push(entry.ipv6Prefix);
            }
          }
          return ranges;
        }

        // OpenAI JSON format (if they switch)
        if (Array.isArray(json.ranges)) {
          return json.ranges.filter((r: unknown): r is string => typeof r === 'string');
        }

        // ChatGPT-User format: { "prefixes": ["cidr1", "cidr2"] } (array of strings)
        if (Array.isArray(json)) {
          return json.filter((r: unknown): r is string => typeof r === 'string');
        }

        return ranges;
      } catch {
        // Fall through to plain-text parsing
      }
    }

    // Plain-text CIDR list (one per line, OpenAI style)
    return body
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && (line.includes('/') || line.includes('.')));
  } catch (error) {
    if (error instanceof CrawlerAnalyticsError) {
      throw error;
    }
    throw new CrawlerAnalyticsError(
      `Failed to fetch IP ranges from ${url}: ${error instanceof Error ? error.message : String(error)}`,
      'IP_RANGE_FETCH_FAILED'
    );
  }
}

/**
 * Get cached IP ranges for a bot, fetching fresh data if expired or absent.
 *
 * @param botName - The bot identifier
 * @param ipRangeUrl - URL to fetch ranges from
 * @param ttlMs - Cache TTL in milliseconds (default: 24 hours)
 * @returns Array of CIDR strings, or empty array on fetch failure
 */
async function getCachedIpRanges(
  botName: string,
  ipRangeUrl: string,
  ttlMs: number = DEFAULT_IP_CACHE_TTL_MS,
): Promise<string[]> {
  const cached = ipRangeCacheMap.get(botName);
  const now = Date.now();

  if (cached && (now - cached.fetchedAt) < cached.ttlMs) {
    return cached.ranges;
  }

  try {
    const ranges = await fetchIpRanges(ipRangeUrl);
    ipRangeCacheMap.set(botName, {
      ranges,
      fetchedAt: now,
      ttlMs,
    });
    return ranges;
  } catch (error) {
    console.error(`[S28] Failed to fetch IP ranges for ${botName}:`, error);
    // Return stale cache if available, otherwise empty
    return cached?.ranges ?? [];
  }
}

/**
 * Verify whether an IP address belongs to the official IP ranges of a given bot.
 *
 * - If the bot has no published IP range URL, returns 'no_range_available'.
 * - If the IP matches a published range, returns 'verified'.
 * - Otherwise returns 'unverified'.
 *
 * @param ip - IP address to verify
 * @param botName - The bot identifier (must match a value in AI_BOT_DEFINITIONS)
 * @returns Verification status
 */
export async function verifyCrawlerIp(
  ip: string,
  botName: string,
): Promise<'verified' | 'unverified' | 'no_range_available'> {
  const botDef = AI_BOT_DEFINITIONS.find((b) => b.botName === botName);

  if (!botDef) {
    return 'unverified';
  }

  if (!botDef.ipRangeUrl) {
    return 'no_range_available';
  }

  const ranges = await getCachedIpRanges(botName, botDef.ipRangeUrl);

  if (ranges.length === 0) {
    // Could not fetch ranges; don't assume verified
    return 'unverified';
  }

  for (const cidr of ranges) {
    if (ipInCidr(ip, cidr)) {
      return 'verified';
    }
  }

  return 'unverified';
}

/**
 * Manually clear the IP range cache (useful in tests).
 */
export function clearIpRangeCache(): void {
  ipRangeCacheMap.clear();
}

// ---------------------------------------------------------------------------
// Batch Processing
// ---------------------------------------------------------------------------

/**
 * Process a batch of log entries, identifying AI bot visits.
 *
 * @param entries - Array of CrawlerLogEntry objects
 * @param domain - The domain these logs belong to
 * @returns Processed results with identified bot visits
 */
export async function processCrawlerLogBatch(
  entries: CrawlerLogEntry[],
  domain: string,
): Promise<CrawlerLogWebhookResponse> {
  let processed = 0;
  let parseErrors = 0;
  let aiBotVisitsFound = 0;
  const visits: ParsedBotVisit[] = [];

  for (const entry of entries) {
    let parsedVisit: ParsedBotVisit | null = null;

    if (entry.parsed) {
      // Pre-parsed entry
      parsedVisit = identifyCrawlerVisit(entry.parsed);
      processed += 1;
    } else {
      // Parse from raw log line
      parsedVisit = parseCrawlerLog(entry.raw, domain);
      if (parsedVisit) {
        processed += 1;
      } else {
        parseErrors += 1;
        continue;
      }
    }

    // Verify IP for identified AI bots
    if (parsedVisit.isAiBot && parsedVisit.botName) {
      try {
        parsedVisit = {
          ...parsedVisit,
          ipVerified: await verifyCrawlerIp(parsedVisit.visit.ip, parsedVisit.botName),
        };
      } catch (error) {
        console.error(`[S28] IP verification failed for ${parsedVisit.botName}:`, error);
        parsedVisit = { ...parsedVisit, ipVerified: 'unverified' };
      }
    } else {
      // Not an AI bot -- mark as N/A
      parsedVisit = { ...parsedVisit, ipVerified: 'pending' };
    }

    if (parsedVisit.isAiBot) {
      aiBotVisitsFound += 1;
    }

    visits.push(parsedVisit);
  }

  return {
    success: true,
    processed,
    aiBotVisitsFound,
    parseErrors,
    visits,
  };
}

// ---------------------------------------------------------------------------
// Analytics Queries
// ---------------------------------------------------------------------------

/**
 * Build a summary of AI crawler activity from a list of parsed visits.
 * This is a pure function operating on in-memory data.
 *
 * @param visits - Array of parsed bot visits
 * @param domain - The domain being analyzed
 * @param periodStart - Start of the analysis period (ISO 8601)
 * @param periodEnd - End of the analysis period (ISO 8601)
 * @returns CrawlerAnalyticsSummary with per-bot breakdown and top paths
 */
export function buildCrawlerAnalyticsSummary(
  visits: ParsedBotVisit[],
  domain: string,
  periodStart: string,
  periodEnd: string,
): CrawlerAnalyticsSummary {
  const startDate = new Date(periodStart);
  const endDate = new Date(periodEnd);

  // Filter to the requested period
  const filteredVisits = visits.filter((v) => {
    const ts = new Date(v.visit.timestamp);
    return ts >= startDate && ts <= endDate;
  });

  // Separate AI bot visits from unknown
  const aiBotVisits = filteredVisits.filter((v) => v.isAiBot);
  const unknownVisits = filteredVisits.filter((v) => !v.isAiBot);

  // Per-bot breakdown
  const botMap = new Map<string, {
    botName: string;
    operator: string;
    visitCount: number;
    paths: Set<string>;
    lastSeen: string;
    verifiedCount: number;
    unverifiedCount: number;
  }>();

  for (const visit of aiBotVisits) {
    const key = visit.botName ?? 'unknown';
    let entry = botMap.get(key);
    if (!entry) {
      entry = {
        botName: key,
        operator: visit.operator ?? 'unknown',
        visitCount: 0,
        paths: new Set<string>(),
        lastSeen: visit.visit.timestamp,
        verifiedCount: 0,
        unverifiedCount: 0,
      };
      botMap.set(key, entry);
    }

    entry.visitCount += 1;
    entry.paths.add(visit.visit.path);

    if (new Date(visit.visit.timestamp) > new Date(entry.lastSeen)) {
      entry.lastSeen = visit.visit.timestamp;
    }

    if (visit.ipVerified === 'verified') {
      entry.verifiedCount += 1;
    } else if (visit.ipVerified === 'unverified') {
      entry.unverifiedCount += 1;
    }
  }

  const botBreakdown = Array.from(botMap.values())
    .map((entry) => ({
      botName: entry.botName,
      operator: entry.operator,
      visitCount: entry.visitCount,
      uniquePaths: entry.paths.size,
      lastSeen: entry.lastSeen,
      verifiedCount: entry.verifiedCount,
      unverifiedCount: entry.unverifiedCount,
    }))
    .sort((a, b) => b.visitCount - a.visitCount);

  // Top paths by AI bot visit count
  const pathMap = new Map<string, { count: number; bots: Set<string> }>();
  for (const visit of aiBotVisits) {
    let entry = pathMap.get(visit.visit.path);
    if (!entry) {
      entry = { count: 0, bots: new Set<string>() };
      pathMap.set(visit.visit.path, entry);
    }
    entry.count += 1;
    if (visit.botName) {
      entry.bots.add(visit.botName);
    }
  }

  const topPaths = Array.from(pathMap.entries())
    .map(([path, data]) => ({
      path,
      visitCount: data.count,
      bots: Array.from(data.bots),
    }))
    .sort((a, b) => b.visitCount - a.visitCount)
    .slice(0, 20);

  return {
    domain,
    periodStart: startDate.toISOString(),
    periodEnd: endDate.toISOString(),
    totalAiBotVisits: aiBotVisits.length,
    totalUnknownVisits: unknownVisits.length,
    botBreakdown,
    topPaths,
  };
}
