import * as Cheerio from 'cheerio';
import { CompetitorRow } from '@/libs/database/Competitors/types';
import { ProjectRow } from '@/libs/database/Projects/types';
import { getBrandIdsRankingsInText } from '@/libs/utils/brandIdsRanking';
import { Agent } from 'undici';
import { resolve4, resolve6 } from 'node:dns/promises';
import { getSafeNewUrl } from '@/libs/utils/urls';

const DEFAULT_USER_AGENT_HEADER = {
  'User-Agent': 'Mozilla/5.0 (compatible; AllSearch/1.0; +https://allsearch.io)',
};
export const DEFAULT_FETCH_TIMEOUT = 10_000;
let _fetchTimeoutMs = DEFAULT_FETCH_TIMEOUT;
export const _setFetchTimeoutMs = (ms: number) => {
  _fetchTimeoutMs = ms;
};

// Increase header size limit to 64KB to avoid UND_ERR_HEADERS_OVERFLOW
const customDispatcher = new Agent({
  connectTimeout: DEFAULT_FETCH_TIMEOUT,
  headersTimeout: DEFAULT_FETCH_TIMEOUT,
  bodyTimeout: DEFAULT_FETCH_TIMEOUT,
  maxHeaderSize: 64 * 1024,
});

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

function isPrivateIP(ip: string): boolean {
  // IPv4 private/reserved ranges
  if (/^127\./.test(ip)) return true; // loopback
  if (/^10\./.test(ip)) return true; // 10.0.0.0/8
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true; // 172.16.0.0/12
  if (/^192\.168\./.test(ip)) return true; // 192.168.0.0/16
  if (/^169\.254\./.test(ip)) return true; // link-local
  if (/^0\./.test(ip)) return true; // 0.0.0.0/8
  if (ip === '255.255.255.255') return true; // broadcast
  // IPv6 private/reserved
  if (ip === '::1' || ip === '::') return true; // loopback / unspecified
  if (/^f[cd]/i.test(ip)) return true; // unique local (fc00::/7)
  if (/^fe80/i.test(ip)) return true; // link-local
  return false;
}

async function assertPublicHostname(hostname: string): Promise<void> {
  // Block obvious private hostnames
  if (hostname === 'localhost' || hostname === '[::1]') {
    throw new Error('Requests to private/internal addresses are not allowed');
  }

  // Resolve hostname and check all returned IPs
  try {
    const addresses = await resolve4(hostname).catch(() => [] as string[]);
    const addresses6 = await resolve6(hostname).catch(() => [] as string[]);
    const allAddresses = [...addresses, ...addresses6];

    if (allAddresses.length === 0) {
      throw new Error(`Could not resolve hostname: ${hostname}`);
    }

    for (const ip of allAddresses) {
      if (isPrivateIP(ip)) {
        throw new Error('Requests to private/internal addresses are not allowed');
      }
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes('not allowed')) throw e;
    throw new Error(`Could not resolve hostname: ${hostname}`);
  }
}

async function getUrlHtml(inputUrl: string) {
  const urlObj = getSafeNewUrl(inputUrl);
  await assertPublicHostname(urlObj.hostname);
  const controller = new AbortController();
  const response = await withTimeout(
    fetch(urlObj.href, {
      headers: { ...DEFAULT_USER_AGENT_HEADER },
      signal: controller.signal,
      // @ts-expect-error - dispatcher is supported in Node.js fetch (undici) but not in standard types
      dispatcher: customDispatcher,
    }),
    _fetchTimeoutMs,
    inputUrl
  );
  if (!response.ok) {
    controller.abort();
    throw new Error(`Failed to fetch ${inputUrl}. Status: ${response.status}`);
  }
  const html = await withTimeout(response.text(), _fetchTimeoutMs, `body:${inputUrl}`);
  const resolvedUrl = getSafeNewUrl(response.url);
  return { url: urlObj, resolvedUrl, html };
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
