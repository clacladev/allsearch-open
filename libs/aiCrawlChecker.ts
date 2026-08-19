import { Agent } from 'undici';
import {
  ALLOWED_PORTS,
  ALLOWED_PROTOCOLS,
  assertSafeHost as sharedAssertSafeHost,
  safeLookup,
  SsrfBlockedError,
  type ResolvedAddress,
} from '@/libs/utils/ssrfGuard';
export { isBlockedHost, isBlockedIPv4, isBlockedIPv6 } from '@/libs/utils/ssrfGuard';

// Server-only module. Do not import from client code.

export interface BotInfo {
  name: string;
  operator: string;
  purpose: string;
}

export interface BotResult extends BotInfo {
  allowed: boolean;
  matchedAgents: string[] | null;
}

export type CheckErrorCategory =
  | 'invalid_url'
  | 'ssrf_blocked'
  | 'dns'
  | 'timeout'
  | 'http_5xx'
  | 'too_large'
  | 'network';

/**
 * Per-section status. Each sub-check can independently fail at runtime;
 * the top-level errorCategory is only for input-validation issues.
 */
export interface RobotsTxtCheck {
  robotsUrl: string;
  status: number;
  noRobotsTxt: boolean;
  bots: BotResult[];
  error: string | null;
}

export interface PageResponseCheck {
  finalUrl: string;
  status: number;
  ok: boolean;
  /** URLs visited in order, including the final one. */
  redirectChain: string[];
  error: string | null;
}

export interface RenderingCheck {
  htmlBytes: number;
  /** Length of human-visible text after stripping script/style/markup. */
  visibleTextLength: number;
  /** True when there's enough server-rendered text for an AI bot to extract content. */
  hasMeaningfulContent: boolean;
  /** True when the body looks like a JS-rendered SPA shell. */
  likelyClientSide: boolean;
  /** Frameworks detected from HTML markers (Next.js, React, Vue, etc.). */
  detectedFrameworks: string[];
}

export interface StructuredDataCheck {
  jsonLd: Array<{ type: string; valid: boolean }>;
  openGraphCount: number;
  twitterCardCount: number;
  hasAnyStructuredData: boolean;
}

export interface CheckResult {
  /** Normalized site URL we checked. */
  url: string;
  /** Set only for input-validation failures (invalid_url, ssrf_blocked, dns). */
  errorCategory: CheckErrorCategory | null;
  errorMessage: string | null;
  robotsTxt: RobotsTxtCheck | null;
  pageResponse: PageResponseCheck | null;
  rendering: RenderingCheck | null;
  structuredData: StructuredDataCheck | null;
}

export const AI_BOTS: readonly BotInfo[] = [
  { name: 'GPTBot', operator: 'OpenAI', purpose: 'Training' },
  { name: 'ChatGPT-User', operator: 'OpenAI', purpose: 'User-triggered fetch in ChatGPT' },
  { name: 'OAI-SearchBot', operator: 'OpenAI', purpose: 'Search indexing for ChatGPT' },
  { name: 'ClaudeBot', operator: 'Anthropic', purpose: 'Training crawler' },
  { name: 'Claude-User', operator: 'Anthropic', purpose: 'User-triggered fetch in Claude' },
  { name: 'Claude-SearchBot', operator: 'Anthropic', purpose: 'Search indexing for Claude' },
  { name: 'anthropic-ai', operator: 'Anthropic', purpose: 'Legacy crawler token' },
  { name: 'Google-Extended', operator: 'Google', purpose: 'Gemini / Vertex AI training' },
  { name: 'PerplexityBot', operator: 'Perplexity', purpose: 'Indexing for answers' },
  { name: 'Perplexity-User', operator: 'Perplexity', purpose: 'User-triggered fetch' },
  { name: 'Applebot-Extended', operator: 'Apple', purpose: 'Generative AI training' },
  { name: 'Meta-ExternalAgent', operator: 'Meta', purpose: 'Training / indexing' },
  { name: 'Meta-ExternalFetcher', operator: 'Meta', purpose: 'User-triggered fetch' },
  { name: 'Bytespider', operator: 'ByteDance', purpose: 'Doubao / training' },
  { name: 'CCBot', operator: 'Common Crawl', purpose: 'Open web corpus' },
  { name: 'Amazonbot', operator: 'Amazon', purpose: 'Alexa / AI' },
  { name: 'DuckAssistBot', operator: 'DuckDuckGo', purpose: 'DuckAssist AI' },
  { name: 'cohere-ai', operator: 'Cohere', purpose: 'Training / RAG' },
  { name: 'cohere-training-data-crawler', operator: 'Cohere', purpose: 'Training data collection' },
  { name: 'MistralAI-User', operator: 'Mistral', purpose: 'User-triggered fetch' },
  { name: 'YouBot', operator: 'You.com', purpose: 'AI search' },
  { name: 'Diffbot', operator: 'Diffbot', purpose: 'Structured data / LLM grounding' },
  { name: 'TimpiBot', operator: 'Timpi', purpose: 'AI search index' },
  { name: 'omgili', operator: 'Webz.io', purpose: 'Data licensing for AI' },
];

// ----- robots.txt parsing -----

interface Rule {
  type: 'allow' | 'disallow';
  path: string;
}

interface Group {
  agents: string[];
  rules: Rule[];
}

export function parseRobotsTxt(text: string): Group[] {
  const groups: Group[] = [];
  let agents: string[] = [];
  let rules: Rule[] = [];
  let lastWasAgent = false;

  const flush = () => {
    if (agents.length) groups.push({ agents, rules });
    agents = [];
    rules = [];
  };

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.split('#')[0].trim();
    if (!line) continue;
    const i = line.indexOf(':');
    if (i === -1) continue;
    const field = line.slice(0, i).trim().toLowerCase();
    const value = line.slice(i + 1).trim();

    if (field === 'user-agent') {
      if (!lastWasAgent && rules.length) flush();
      agents.push(value);
      lastWasAgent = true;
    } else if (field === 'allow' || field === 'disallow') {
      rules.push({ type: field, path: value });
      lastWasAgent = false;
    }
  }
  flush();
  return groups;
}

/**
 * Pick the group that applies to a given bot. Per RFC 9309 + Google's docs, the
 * robots.txt user-agent token matches if it is a case-insensitive substring of the
 * crawler's product token, with the longest matching token winning. Otherwise the
 * `*` group is the fallback. Tokens like `GPTBot-Image` should not steal rules from
 * the unrelated `GPTBot` product, so we keep this as a substring match on tokens
 * present in robots.txt and require the bot name itself to contain the token.
 */
export function groupFor(groups: Group[], botName: string): Group | null {
  const ua = botName.toLowerCase();
  let best: Group | null = null;
  let bestLen = -1;
  let star: Group | null = null;

  for (const g of groups) {
    for (const a of g.agents) {
      const al = a.toLowerCase();
      if (al === '*') {
        star = g;
        continue;
      }
      // Robots token matches when it equals the bot product token (case-insensitive).
      // RFC 9309 §2.2.1 says tokens MUST match exactly. We use exact match to avoid
      // false matches (e.g. `User-agent: GPT` shouldn't capture `GPTBot`).
      if (al === ua && al.length > bestLen) {
        best = g;
        bestLen = al.length;
      }
    }
  }
  return best ?? star ?? null;
}

function patternToRegex(pattern: string): RegExp {
  let out = '';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === '*') {
      out += '.*';
    } else if (c === '$' && i === pattern.length - 1) {
      out += '$';
    } else if (/[.+?^${}()|[\]\\]/.test(c)) {
      out += '\\' + c;
    } else {
      out += c;
    }
  }
  return new RegExp('^' + out);
}

export function isAllowed(group: Group | null, path: string): boolean {
  if (!group) return true;
  let winner: Rule | null = null;
  let winLen = -1;

  for (const rule of group.rules) {
    if (rule.path === '') continue;
    if (patternToRegex(rule.path).test(path)) {
      const len = rule.path.length;
      if (len > winLen || (len === winLen && rule.type === 'allow')) {
        winner = rule;
        winLen = len;
      }
    }
  }
  if (!winner) return true;
  return winner.type === 'allow';
}

// ----- URL normalization -----

export interface NormalizedUrl {
  url: URL;
  /** Origin we'll fetch robots.txt from. */
  robotsUrl: string;
}

export class InvalidUrlError extends Error {
  category: CheckErrorCategory;
  constructor(message: string, category: CheckErrorCategory = 'invalid_url') {
    super(message);
    this.name = 'InvalidUrlError';
    this.category = category;
  }
}

export function normalizeInput(input: string): NormalizedUrl {
  const trimmed = input.trim();
  if (!trimmed) throw new InvalidUrlError('URL is required');

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    throw new InvalidUrlError('Enter a valid URL like example.com');
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new InvalidUrlError('Only http and https URLs are supported');
  }

  if (!ALLOWED_PORTS.has(parsed.port)) {
    throw new InvalidUrlError('Only standard web ports (80, 443, 8080, 8443) are supported');
  }

  if (!parsed.hostname) throw new InvalidUrlError('Enter a valid URL like example.com');

  // Strip credentials, fragment.
  parsed.username = '';
  parsed.password = '';
  parsed.hash = '';
  // Strip trailing dot from hostname.
  if (parsed.hostname.endsWith('.') && parsed.hostname.length > 1) {
    parsed.hostname = parsed.hostname.slice(0, -1);
  }

  return { url: parsed, robotsUrl: `${parsed.origin}/robots.txt` };
}

// ----- SSRF guard -----
//
// The actual range-checking logic lives in libs/utils/ssrfGuard.ts and is shared with
// libs/utils/urlAnalysis.ts, so both outbound-fetch paths in this codebase get the same
// coverage instead of silently drifting apart (see deepsec finding ssrf-50ce0fd93e). We run
// these fetches through `crawlerDispatcher`, whose connect.lookup resolves via `safeLookup`,
// so every connection uses only validated addresses while the URL keeps its real hostname
// (SNI / virtual hosting stay intact under Node's TLS stack).
//
// `crawlerDispatcher` is passed per-call via fetch's `dispatcher` option (fetchRobots/fetchPage)
// rather than installed as the process-wide dispatcher: two checks running concurrently (two
// tabs, or this racing urlAnalysis.ts's getUrlHtml) would otherwise race the global save/restore
// — one check's `finally` could restore the default dispatcher while the other is still mid
// redirect-loop, or leave this dispatcher permanently installed for unrelated fetches (e.g. AI
// provider calls).

const crawlerDispatcher = new Agent({ connect: { lookup: safeLookup } });

async function assertSafeHost(hostname: string): Promise<ResolvedAddress[]> {
  try {
    return await sharedAssertSafeHost(hostname);
  } catch (err) {
    if (!(err instanceof SsrfBlockedError)) throw err;
    const category: CheckErrorCategory = err.reason === 'dns' ? 'dns' : 'ssrf_blocked';
    throw new InvalidUrlError(err.message, category);
  }
}

// ----- Cache -----

interface CacheEntry {
  expires: number;
  body: { robotsUrl: string; status: number; text: string };
}

const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_MAX = 500;
const robotsCache = new Map<string, CacheEntry>();

function cacheGet(host: string): CacheEntry['body'] | null {
  const entry = robotsCache.get(host);
  if (!entry) return null;
  if (entry.expires < Date.now()) {
    robotsCache.delete(host);
    return null;
  }
  return entry.body;
}

function cacheSet(host: string, body: CacheEntry['body']): void {
  if (robotsCache.size >= CACHE_MAX) {
    const firstKey = robotsCache.keys().next().value;
    if (firstKey !== undefined) robotsCache.delete(firstKey);
  }
  robotsCache.set(host, { expires: Date.now() + CACHE_TTL_MS, body });
}

// Test-only cache reset.
export function _resetCacheForTests(): void {
  robotsCache.clear();
}

// ----- Fetch with redirect-manual + decompression-bomb cap -----

const FETCH_TIMEOUT_MS = 10_000;
const MAX_BODY_BYTES = 1_000_000;
// Page HTML cap. Larger than robots.txt because real pages can be multi-megabyte;
// we truncate at this point rather than failing, since the heuristics only need
// the head + early body.
const MAX_PAGE_BYTES = 3_000_000;
const MAX_REDIRECTS = 3;
const USER_AGENT =
  'Mozilla/5.0 (compatible; AllSearchBotChecker/1.0; +https://allsearch.app)';

async function fetchRobots(
  origin: string
): Promise<{ robotsUrl: string; status: number; text: string }> {
  let currentUrl = `${origin}/robots.txt`;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const parsed = new URL(currentUrl);
    await assertSafeHost(parsed.hostname);

    const res = await fetch(currentUrl, {
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/plain,text/*;q=0.9,*/*;q=0.5',
        Host: parsed.host,
      },
      dispatcher: crawlerDispatcher,
    } as RequestInit);

    // Manual redirect handling.
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) return { robotsUrl: currentUrl, status: res.status, text: '' };
      currentUrl = new URL(location, currentUrl).toString();
      const next = new URL(currentUrl);
      if (!ALLOWED_PROTOCOLS.has(next.protocol) || !ALLOWED_PORTS.has(next.port)) {
        throw new InvalidUrlError('Redirected to a blocked scheme or port', 'ssrf_blocked');
      }
      continue;
    }

    if (!res.ok) {
      return { robotsUrl: currentUrl, status: res.status, text: '' };
    }

    // Stream body, abort if it exceeds MAX_BODY_BYTES (post-decompression).
    const reader = res.body?.getReader();
    if (!reader) {
      const text = await res.text();
      return { robotsUrl: currentUrl, status: res.status, text: text.slice(0, MAX_BODY_BYTES) };
    }
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new InvalidUrlError('robots.txt is too large', 'too_large');
      }
      chunks.push(value);
    }
    const buf = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      buf.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const text = new TextDecoder('utf-8', { fatal: false }).decode(buf);
    return { robotsUrl: currentUrl, status: res.status, text };
  }
  throw new InvalidUrlError('Too many redirects fetching robots.txt', 'network');
}

// ----- Page fetch (with redirect chain) -----

interface FetchPageResult {
  finalUrl: string;
  status: number;
  redirectChain: string[];
  html: string;
}

async function fetchPage(url: URL): Promise<FetchPageResult> {
  let currentUrl = url.toString();
  const chain: string[] = [];
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    chain.push(currentUrl);
    const parsed = new URL(currentUrl);
    await assertSafeHost(parsed.hostname);

    const res = await fetch(currentUrl, {
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5',
        Host: parsed.host,
      },
      dispatcher: crawlerDispatcher,
    } as RequestInit);

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) {
        return { finalUrl: currentUrl, status: res.status, redirectChain: chain, html: '' };
      }
      currentUrl = new URL(location, currentUrl).toString();
      const next = new URL(currentUrl);
      if (!ALLOWED_PROTOCOLS.has(next.protocol) || !ALLOWED_PORTS.has(next.port)) {
        throw new InvalidUrlError('Redirected to a blocked scheme or port', 'ssrf_blocked');
      }
      continue;
    }

    if (!res.ok) {
      return { finalUrl: currentUrl, status: res.status, redirectChain: chain, html: '' };
    }

    const reader = res.body?.getReader();
    if (!reader) {
      const html = (await res.text()).slice(0, MAX_BODY_BYTES);
      return { finalUrl: currentUrl, status: res.status, redirectChain: chain, html };
    }
    // For pages we truncate at the cap rather than failing — head + early body
    // is enough for rendering / structured-data heuristics, and large pages
    // (news homepages, etc.) are common.
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (total + value.byteLength > MAX_PAGE_BYTES) {
        const remaining = MAX_PAGE_BYTES - total;
        if (remaining > 0) chunks.push(value.subarray(0, remaining));
        total = MAX_PAGE_BYTES;
        await reader.cancel();
        break;
      }
      total += value.byteLength;
      chunks.push(value);
    }
    const buf = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      buf.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const html = new TextDecoder('utf-8', { fatal: false }).decode(buf);
    return { finalUrl: currentUrl, status: res.status, redirectChain: chain, html };
  }
  throw new InvalidUrlError('Too many redirects fetching that page', 'network');
}

// ----- Rendering heuristic -----

const FRAMEWORK_MARKERS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'Next.js', pattern: /<div\s+id=["']__next["']/ },
  { name: 'Next.js', pattern: /\/_next\/static\// },
  { name: 'React', pattern: /<div\s+id=["']root["'][^>]*>\s*(?:<!--[^>]*-->\s*)?<\/div>/ },
  { name: 'Vue', pattern: /<div\s+id=["']app["'][^>]*>\s*<\/div>/ },
  { name: 'Nuxt', pattern: /<div\s+id=["']__nuxt["']/ },
  { name: 'Nuxt', pattern: /\/_nuxt\// },
  { name: 'Svelte', pattern: /<div\s+id=["']svelte["']/ },
  { name: 'Angular', pattern: /<app-root[\s>]/ },
  { name: 'Gatsby', pattern: /<div\s+id=["']___gatsby["']/ },
  { name: 'Remix', pattern: /window\.__remixContext\b/ },
];

export function analyzeRendering(html: string): RenderingCheck {
  const htmlBytes = html.length;
  const stripped = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const visibleTextLength = stripped.length;

  const detectedFrameworks = Array.from(
    new Set(FRAMEWORK_MARKERS.filter((m) => m.pattern.test(html)).map((m) => m.name))
  );

  const hasMeaningfulContent = visibleTextLength >= 500;
  const likelyClientSide = !hasMeaningfulContent && detectedFrameworks.length > 0;

  return {
    htmlBytes,
    visibleTextLength,
    hasMeaningfulContent,
    likelyClientSide,
    detectedFrameworks,
  };
}

// ----- Structured data analysis -----

export function analyzeStructuredData(html: string): StructuredDataCheck {
  const jsonLd: Array<{ type: string; valid: boolean }> = [];
  const scriptRe = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptRe.exec(html)) !== null) {
    const raw = match[1].trim();
    try {
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item && typeof item === 'object' && '@type' in item) {
          const t = (item as { '@type': unknown })['@type'];
          if (Array.isArray(t)) {
            for (const sub of t) jsonLd.push({ type: String(sub), valid: true });
          } else {
            jsonLd.push({ type: String(t), valid: true });
          }
        } else {
          jsonLd.push({ type: 'Unknown', valid: true });
        }
      }
    } catch {
      jsonLd.push({ type: 'Invalid JSON', valid: false });
    }
  }

  const ogCount = (html.match(/<meta[^>]+property=["']og:[^"']+["']/gi) ?? []).length;
  const twCount = (html.match(/<meta[^>]+name=["']twitter:[^"']+["']/gi) ?? []).length;

  return {
    jsonLd,
    openGraphCount: ogCount,
    twitterCardCount: twCount,
    hasAnyStructuredData: jsonLd.length > 0 || ogCount > 0 || twCount > 0,
  };
}

// ----- Sub-check helpers (return per-section results, never throw) -----

async function analyzeRobotsForOrigin(origin: string, host: string): Promise<RobotsTxtCheck> {
  const cached = cacheGet(host);
  let fetched: { robotsUrl: string; status: number; text: string };
  try {
    fetched = cached ?? (await fetchRobots(origin));
  } catch (err) {
    const isTimeout =
      err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
    const message =
      err instanceof InvalidUrlError
        ? err.message
        : isTimeout
          ? 'The site took too long to respond when we asked for robots.txt'
          : "Couldn't reach robots.txt for that site";
    return {
      robotsUrl: `${origin}/robots.txt`,
      status: 0,
      noRobotsTxt: false,
      bots: [],
      error: message,
    };
  }

  if (!cached && fetched.status > 0 && fetched.status < 500) {
    cacheSet(host, fetched);
  }

  const noRobots = fetched.status >= 400 && fetched.status < 500;
  if (fetched.status >= 500) {
    return {
      robotsUrl: fetched.robotsUrl,
      status: fetched.status,
      noRobotsTxt: false,
      bots: [],
      error: 'The site returned an error when we asked for robots.txt',
    };
  }

  const groups = noRobots ? [] : parseRobotsTxt(fetched.text);
  const bots: BotResult[] = AI_BOTS.map((bot) => {
    const g = groupFor(groups, bot.name);
    return {
      ...bot,
      allowed: isAllowed(g, '/'),
      matchedAgents: g ? g.agents : null,
    };
  });

  return {
    robotsUrl: fetched.robotsUrl,
    status: fetched.status,
    noRobotsTxt: noRobots,
    bots,
    error: null,
  };
}

interface PageBundle {
  pageResponse: PageResponseCheck;
  rendering: RenderingCheck | null;
  structuredData: StructuredDataCheck | null;
}

async function analyzePage(url: URL): Promise<PageBundle> {
  let fetched: FetchPageResult;
  try {
    fetched = await fetchPage(url);
  } catch (err) {
    const isTimeout =
      err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
    const message =
      err instanceof InvalidUrlError
        ? err.message
        : isTimeout
          ? 'The site took too long to respond'
          : "Couldn't reach that page";
    return {
      pageResponse: {
        finalUrl: url.toString(),
        status: 0,
        ok: false,
        redirectChain: [url.toString()],
        error: message,
      },
      rendering: null,
      structuredData: null,
    };
  }

  const pageResponse: PageResponseCheck = {
    finalUrl: fetched.finalUrl,
    status: fetched.status,
    ok: fetched.status >= 200 && fetched.status < 300,
    redirectChain: fetched.redirectChain,
    error: null,
  };

  if (!pageResponse.ok || !fetched.html) {
    return { pageResponse, rendering: null, structuredData: null };
  }

  return {
    pageResponse,
    rendering: analyzeRendering(fetched.html),
    structuredData: analyzeStructuredData(fetched.html),
  };
}

// ----- Public entry point -----

export async function checkAICrawlability(input: string): Promise<CheckResult> {
  let normalized: NormalizedUrl;
  try {
    normalized = normalizeInput(input);
  } catch (err) {
    const e = err as InvalidUrlError;
    return {
      url: input,
      errorCategory: e.category ?? 'invalid_url',
      errorMessage: e.message,
      robotsTxt: null,
      pageResponse: null,
      rendering: null,
      structuredData: null,
    };
  }

  try {
    await assertSafeHost(normalized.url.hostname);
  } catch (err) {
    const e = err as InvalidUrlError;
    return {
      url: normalized.url.toString(),
      errorCategory: e.category ?? 'ssrf_blocked',
      errorMessage: e.message,
      robotsTxt: null,
      pageResponse: null,
      rendering: null,
      structuredData: null,
    };
  }

  const [robotsResult, pageBundle] = await Promise.all([
    analyzeRobotsForOrigin(normalized.url.origin, normalized.url.host),
    analyzePage(normalized.url),
  ]);

  return {
    url: normalized.url.toString(),
    errorCategory: null,
    errorMessage: null,
    robotsTxt: robotsResult,
    pageResponse: pageBundle.pageResponse,
    rendering: pageBundle.rendering,
    structuredData: pageBundle.structuredData,
  };
}
