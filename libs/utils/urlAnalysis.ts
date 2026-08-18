import * as Cheerio from 'cheerio';
import { CompetitorRow } from '@/libs/database/Competitors/types';
import { ProjectRow } from '@/libs/database/Projects/types';
import { getBrandIdsRankingsInText } from '@/libs/utils/brandIdsRanking';
import { Agent, getGlobalDispatcher, setGlobalDispatcher } from 'undici';
import { assertSafeHost, safeLookup } from '@/libs/utils/ssrfGuard';
import { getSafeNewUrl } from '@/libs/utils/urls';

const DEFAULT_USER_AGENT_HEADER = {
  'User-Agent': 'Mozilla/5.0 (compatible; AllSearch/1.0; +https://allsearch.io)',
};
export const DEFAULT_FETCH_TIMEOUT = 10_000;
let _fetchTimeoutMs = DEFAULT_FETCH_TIMEOUT;
export const _setFetchTimeoutMs = (ms: number) => {
  _fetchTimeoutMs = ms;
};

// Increase header size limit to 64KB to avoid UND_ERR_HEADERS_OVERFLOW. connect.lookup goes
// through ssrfGuard.safeLookup so connections only ever bind to validated addresses while the
// URL keeps its real hostname (SNI / virtual hosting work under Node's TLS stack).
const customDispatcher = new Agent({
  connectTimeout: DEFAULT_FETCH_TIMEOUT,
  headersTimeout: DEFAULT_FETCH_TIMEOUT,
  bodyTimeout: DEFAULT_FETCH_TIMEOUT,
  maxHeaderSize: 64 * 1024,
  connect: { lookup: safeLookup },
});

// Node's fetch() silently drops response headers (and therefore redirect handling) when a
// `dispatcher` is passed as a per-call fetch option — see undici/nodejs fetch interaction.
// Swapping the process-wide dispatcher for the duration of the request is the only way to get
// the header-size bump without that breakage; we restore the previous dispatcher immediately
// after so unrelated fetches elsewhere in the app aren't affected by these timeouts.
const MAX_REDIRECTS = 5;

export type DomainMetadata = {
  url: string;
  name: string | undefined;
  description: string | undefined;
  iconUrl: string | undefined;
};

export async function getDomainMetadata(inputUrl: string): Promise<DomainMetadata> {
  const { url, html } = await getUrlHtml(inputUrl);
  const { title, brandName, description, iconUrl } = extractPageMetadata(html, url.href);
  return {
    url: inputUrl,
    name: brandName || title,
    description,
    iconUrl,
  };
}

export type PageHeading = { tag: string; text: string };

export type UrlAnalysis = {
  inputUrl: string;
  resolvedUrl: string | undefined;
  title: string | undefined;
  description: string | undefined;
  headings: PageHeading[];
  brandIdsRanking: string[];
};

export async function getUrlAnalysis(
  inputUrl: string,
  project: ProjectRow,
  competitors: CompetitorRow[]
): Promise<UrlAnalysis> {
  const { url, resolvedUrl, html } = await getUrlHtml(inputUrl);
  const cheerio = Cheerio.load(html);
  const { title, description } = extractPageMetadata(html, url.href, cheerio);

  const headings: PageHeading[] = [];
  cheerio('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const tag = el.tagName.toLowerCase();
    const text = cheerio(el).text().trim();
    if (text) headings.push({ tag, text });
  });

  cheerio('script, style, nozzle, noscript, svg, img, iframe').remove();
  const cleanText = cheerio('body').text().replace(/\s+/g, ' ').trim();

  const brandIdsRanking = getBrandIdsRankingsInText(cleanText, project, competitors);

  return {
    inputUrl,
    resolvedUrl: resolvedUrl.href,
    title,
    description,
    headings,
    brandIdsRanking,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${label}`)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

async function getUrlHtml(inputUrl: string) {
  const urlObj = getSafeNewUrl(inputUrl);

  const previousDispatcher = getGlobalDispatcher();
  setGlobalDispatcher(customDispatcher);
  try {
    let currentUrl = urlObj;
    let response: Response;
    let hop = 0;
    while (true) {
      // Resolve + validate here to surface DNS / SSRF failures with a clear message before
      // connecting; the dispatcher's connect.lookup (safeLookup) re-validates at connect time,
      // so no unvalidated address is ever used for the connection.
      await assertSafeHost(currentUrl.hostname);
      response = await withTimeout(
        fetch(currentUrl, {
          headers: { ...DEFAULT_USER_AGENT_HEADER, Host: currentUrl.host },
          redirect: 'manual',
        }),
        _fetchTimeoutMs,
        inputUrl
      );

      if (response.status < 300 || response.status >= 400) break;

      if (hop >= MAX_REDIRECTS) {
        throw new Error(`Too many redirects fetching ${inputUrl}`);
      }
      const location = response.headers.get('location');
      if (!location) {
        throw new Error(`Redirect from ${currentUrl.href} is missing a Location header`);
      }
      currentUrl = new URL(location, currentUrl);
      hop++;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch ${inputUrl}. Status: ${response.status}`);
    }
    const html = await withTimeout(response.text(), _fetchTimeoutMs, `body:${inputUrl}`);
    return { url: urlObj, resolvedUrl: currentUrl, html };
  } finally {
    setGlobalDispatcher(previousDispatcher);
  }
}

function extractPageMetadata(html: string, currentUrl: string, loadedCheerio?: Cheerio.CheerioAPI) {
  const cheerio = loadedCheerio || Cheerio.load(html);

  let title =
    cheerio('meta[property="og:title"]').attr('content') ||
    cheerio('meta[name="twitter:title"]').attr('content') ||
    cheerio('meta[name="title"]').attr('content') ||
    cheerio('title').text();
  title = title?.trim();

  const brandName = extractBrandName(cheerio, title, currentUrl);

  const description =
    cheerio('meta[property="og:description"]').attr('content') ||
    cheerio('meta[name="twitter:description"]').attr('content') ||
    cheerio('meta[name="description"]').attr('content');

  let iconUrl =
    cheerio('link[rel="apple-touch-icon"]').attr('href') ||
    cheerio('link[rel="icon"]').attr('href') ||
    cheerio('link[rel="shortcut icon"]').attr('href') ||
    cheerio('meta[property="og:image"]').attr('content');

  if (iconUrl) {
    // Resolve relative URLs
    try {
      if (!iconUrl.startsWith('http')) {
        iconUrl = new URL(iconUrl, currentUrl).toString();
      }
    } catch (_) {
      // ignore invalid URLs
      console.warn('Invalid icon URL:', iconUrl);
      iconUrl = undefined;
    }
  }

  return {
    title,
    brandName,
    description: description?.trim(),
    iconUrl,
  };
}

function extractBrandName(
  cheerio: Cheerio.CheerioAPI,
  title?: string,
  currentUrl?: string
): string | undefined {
  const candidates: string[] = [];

  const ogSiteName = cheerio('meta[property="og:site_name"]').attr('content');
  if (ogSiteName) candidates.push(ogSiteName);

  cheerio('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse(cheerio(el).html() || '{}');
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if ((item['@type'] === 'Organization' || item['@type'] === 'WebSite') && item.name) {
          if (typeof item.name === 'string') {
            candidates.push(item.name);
          }
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  });

  if (title) candidates.push(title);

  let domainName = '';
  try {
    if (currentUrl) {
      const urlObj = new URL(currentUrl);
      const parts = urlObj.hostname.replace(/^www\./, '').split('.');
      if (parts.length >= 2) {
        domainName = parts[parts.length - 2];
        if (parts.length >= 3 && ['co', 'com', 'org', 'net'].includes(domainName)) {
          domainName = parts[parts.length - 3];
        }
      } else if (parts.length === 1 && parts[0]) {
        domainName = parts[0];
      }
    }
  } catch {}

  const cleanCandidate = (str: string) => {
    // Split by common title separators
    const parts = str.split(/\s[|\-–—:]\s/);
    // Usually the brand is the shortest part
    let best = parts.reduce((a, b) => (a.length <= b.length ? a : b)).trim();
    // Remove common domain extensions
    best = best.replace(/\.(com|co|to|io|org|net)$/i, '');
    return best.trim();
  };

  const domainLower = domainName.toLowerCase();

  for (const candidate of candidates) {
    let cleaned = cleanCandidate(candidate);
    if (!cleaned) continue;

    if (domainLower) {
      // Check if cleaned candidate (ignoring spaces/punctuation) matches domain exactly
      const noSpace = cleaned.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (noSpace === domainLower) {
        if (cleaned === cleaned.toLowerCase() || cleaned === cleaned.toUpperCase()) {
          cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
        }
        return cleaned; // e.g. "BGW Doors", "Nomad Retreats", "Stanley 1913"
      }

      // Check if the domain name is a substring inside the candidate
      // For example: domain is "sportiva", candidate is "La Sportiva North America"
      // We extract "Sportiva".
      const matchIndex = cleaned.toLowerCase().indexOf(domainLower);
      if (matchIndex !== -1) {
        let matchedSubstring = cleaned.substring(matchIndex, matchIndex + domainLower.length);
        if (
          matchedSubstring === matchedSubstring.toLowerCase() ||
          matchedSubstring === matchedSubstring.toUpperCase()
        ) {
          matchedSubstring =
            matchedSubstring.charAt(0).toUpperCase() + matchedSubstring.slice(1).toLowerCase();
        }
        return matchedSubstring;
      }
    }

    // Fallback if domain parsing fails but we have a cleaned candidate
    if (cleaned.length > 1 && cleaned.length < 40) {
      if (cleaned.toLowerCase() === cleaned) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }
      return cleaned;
    }
  }

  // Final fallback to raw capitalized domain name
  if (domainName) {
    return domainName.charAt(0).toUpperCase() + domainName.slice(1);
  }

  return undefined;
}
