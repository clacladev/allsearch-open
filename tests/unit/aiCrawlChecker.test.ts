import { describe, expect, it } from 'bun:test';
import {
  parseRobotsTxt,
  groupFor,
  isAllowed,
  normalizeInput,
  isBlockedIPv4,
  isBlockedIPv6,
  isBlockedHost,
  InvalidUrlError,
  analyzeRendering,
  analyzeStructuredData,
  pinRequestUrl,
} from '@/libs/aiCrawlChecker';

describe('parseRobotsTxt', () => {
  it('groups consecutive user-agent lines into one group', () => {
    const text = `
User-agent: GPTBot
User-agent: ClaudeBot
Disallow: /private
`;
    const groups = parseRobotsTxt(text);
    expect(groups).toHaveLength(1);
    expect(groups[0].agents).toEqual(['GPTBot', 'ClaudeBot']);
    expect(groups[0].rules).toEqual([{ type: 'disallow', path: '/private' }]);
  });

  it('starts a new group when a user-agent follows a rule', () => {
    const text = `
User-agent: GPTBot
Disallow: /a

User-agent: ClaudeBot
Disallow: /b
`;
    const groups = parseRobotsTxt(text);
    expect(groups).toHaveLength(2);
    expect(groups[0].agents).toEqual(['GPTBot']);
    expect(groups[1].agents).toEqual(['ClaudeBot']);
  });

  it('ignores comments and unknown fields', () => {
    const text = `
# comment
User-agent: GPTBot
Crawl-delay: 5
Disallow: /
Sitemap: https://example.com/sitemap.xml
`;
    const groups = parseRobotsTxt(text);
    expect(groups[0].rules).toEqual([{ type: 'disallow', path: '/' }]);
  });

  it('does not throw on arbitrary garbage input', () => {
    expect(() => parseRobotsTxt('')).not.toThrow();
    expect(() => parseRobotsTxt('not a robots file')).not.toThrow();
    expect(() => parseRobotsTxt(':::\n\n--')).not.toThrow();
    expect(() => parseRobotsTxt('User-agent\nDisallow')).not.toThrow();
  });
});

describe('groupFor', () => {
  const groups = parseRobotsTxt(`
User-agent: *
Disallow: /admin

User-agent: GPTBot
Disallow: /gpt-only

User-agent: GPT
Disallow: /gpt-broad
`);

  it('matches the exact product token (case-insensitive)', () => {
    const g = groupFor(groups, 'GPTBot');
    expect(g?.agents).toContain('GPTBot');
    expect(g?.rules.some((r) => r.path === '/gpt-only')).toBe(true);
  });

  it('does NOT let a shorter token capture a longer product name', () => {
    // "GPT" should not match "GPTBot" — that was the bug in the original script.
    const g = groupFor(groups, 'GPTBot');
    expect(g?.rules.some((r) => r.path === '/gpt-broad')).toBe(false);
  });

  it('falls back to * when no exact token matches', () => {
    const g = groupFor(groups, 'UnknownBot');
    expect(g?.agents).toContain('*');
  });

  it('returns null when there is no matching group and no *', () => {
    const noStar = parseRobotsTxt('User-agent: GPTBot\nDisallow: /\n');
    expect(groupFor(noStar, 'ClaudeBot')).toBeNull();
  });
});

describe('isAllowed', () => {
  it('returns true when group is null', () => {
    expect(isAllowed(null, '/')).toBe(true);
  });

  it('honors longest-prefix-wins', () => {
    const [g] = parseRobotsTxt(`
User-agent: *
Disallow: /
Allow: /public
`);
    expect(isAllowed(g, '/secret')).toBe(false);
    expect(isAllowed(g, '/public/page')).toBe(true);
  });

  it('ties go to allow', () => {
    const [g] = parseRobotsTxt(`
User-agent: *
Disallow: /foo
Allow: /foo
`);
    expect(isAllowed(g, '/foo')).toBe(true);
  });

  it('ignores empty disallow (means allow all)', () => {
    const [g] = parseRobotsTxt(`
User-agent: *
Disallow:
`);
    expect(isAllowed(g, '/anything')).toBe(true);
  });

  it('supports * wildcard and terminal $', () => {
    const [g] = parseRobotsTxt(`
User-agent: *
Disallow: /*.pdf$
`);
    expect(isAllowed(g, '/file.pdf')).toBe(false);
    expect(isAllowed(g, '/file.pdf?x=1')).toBe(true);
  });
});

describe('normalizeInput', () => {
  it('adds https:// when no scheme is present', () => {
    expect(normalizeInput('nytimes.com').url.origin).toBe('https://nytimes.com');
  });

  it('preserves http://', () => {
    expect(normalizeInput('http://example.com').url.protocol).toBe('http:');
  });

  it('strips credentials', () => {
    const { url } = normalizeInput('https://user:pass@example.com');
    expect(url.username).toBe('');
    expect(url.password).toBe('');
  });

  it('strips trailing dot from hostname', () => {
    expect(normalizeInput('example.com.').url.hostname).toBe('example.com');
  });

  it('rejects unsupported schemes', () => {
    expect(() => normalizeInput('ftp://example.com')).toThrow(InvalidUrlError);
    expect(() => normalizeInput('file:///etc/passwd')).toThrow(InvalidUrlError);
  });

  it('rejects non-standard ports', () => {
    expect(() => normalizeInput('https://example.com:6379')).toThrow(InvalidUrlError);
    expect(() => normalizeInput('http://example.com:22')).toThrow(InvalidUrlError);
  });

  it('rejects empty input', () => {
    expect(() => normalizeInput('')).toThrow(InvalidUrlError);
    expect(() => normalizeInput('   ')).toThrow(InvalidUrlError);
  });

  it('rejects unparseable input', () => {
    expect(() => normalizeInput('http://')).toThrow(InvalidUrlError);
  });
});

describe('isBlockedIPv4', () => {
  it('blocks loopback', () => {
    expect(isBlockedIPv4('127.0.0.1')).toBe(true);
    expect(isBlockedIPv4('127.255.255.255')).toBe(true);
  });

  it('blocks RFC1918', () => {
    expect(isBlockedIPv4('10.0.0.1')).toBe(true);
    expect(isBlockedIPv4('172.16.5.5')).toBe(true);
    expect(isBlockedIPv4('192.168.1.1')).toBe(true);
  });

  it('blocks link-local (cloud metadata)', () => {
    expect(isBlockedIPv4('169.254.169.254')).toBe(true);
  });

  it('blocks CGNAT', () => {
    expect(isBlockedIPv4('100.64.0.1')).toBe(true);
  });

  it('blocks 0.0.0.0/8', () => {
    expect(isBlockedIPv4('0.0.0.0')).toBe(true);
  });

  it('allows public addresses', () => {
    expect(isBlockedIPv4('8.8.8.8')).toBe(false);
    expect(isBlockedIPv4('1.1.1.1')).toBe(false);
    expect(isBlockedIPv4('151.101.1.1')).toBe(false);
  });
});

describe('isBlockedIPv6', () => {
  it('blocks loopback', () => {
    expect(isBlockedIPv6('::1')).toBe(true);
  });

  it('blocks unspecified', () => {
    expect(isBlockedIPv6('::')).toBe(true);
  });

  it('blocks ULA (fc00::/7)', () => {
    expect(isBlockedIPv6('fc00::1')).toBe(true);
    expect(isBlockedIPv6('fd12:3456:789a::1')).toBe(true);
  });

  it('blocks link-local (fe80::/10)', () => {
    expect(isBlockedIPv6('fe80::1')).toBe(true);
  });

  it('blocks IPv4-mapped IPv6 to loopback', () => {
    expect(isBlockedIPv6('::ffff:127.0.0.1')).toBe(true);
  });

  it('allows public IPv6', () => {
    expect(isBlockedIPv6('2606:4700:4700::1111')).toBe(false);
  });
});

describe('isBlockedHost', () => {
  it('blocks cloud metadata hostnames', () => {
    expect(isBlockedHost('metadata.google.internal')).toBe(true);
    expect(isBlockedHost('METADATA.GOOGLE.INTERNAL')).toBe(true);
  });

  it('allows normal hostnames', () => {
    expect(isBlockedHost('nytimes.com')).toBe(false);
  });
});

describe('analyzeRendering', () => {
  it('flags a server-rendered page as having meaningful content', () => {
    const html = `<!doctype html><html><body><h1>Title</h1><p>${'word '.repeat(200)}</p></body></html>`;
    const r = analyzeRendering(html);
    expect(r.hasMeaningfulContent).toBe(true);
    expect(r.likelyClientSide).toBe(false);
    expect(r.visibleTextLength).toBeGreaterThan(500);
  });

  it('flags an empty SPA shell as likely client-side', () => {
    const html = `<!doctype html><html><body><div id="__next"></div><script src="/_next/static/main.js"></script></body></html>`;
    const r = analyzeRendering(html);
    expect(r.hasMeaningfulContent).toBe(false);
    expect(r.likelyClientSide).toBe(true);
    expect(r.detectedFrameworks).toContain('Next.js');
  });

  it('detects React when the root div is empty', () => {
    const html = `<html><body><div id="root"></div><script>boot()</script></body></html>`;
    const r = analyzeRendering(html);
    expect(r.detectedFrameworks).toContain('React');
  });

  it('strips script and style content from the visible text count', () => {
    const html = `<html><body><style>${'a '.repeat(2000)}</style><script>${'b '.repeat(2000)}</script><p>tiny</p></body></html>`;
    const r = analyzeRendering(html);
    expect(r.visibleTextLength).toBeLessThan(20);
  });

  it('does not flag content-rich pages as client-side even with framework markers', () => {
    const longText = 'paragraph '.repeat(200);
    const html = `<html><body><div id="__next"><p>${longText}</p></div></body></html>`;
    const r = analyzeRendering(html);
    expect(r.hasMeaningfulContent).toBe(true);
    expect(r.likelyClientSide).toBe(false);
  });
});

describe('pinRequestUrl', () => {
  it('rewrites the hostname to the validated IPv4 address, keeping path and query', () => {
    const url = new URL('https://example.com/robots.txt?x=1');
    const pinned = pinRequestUrl(url, { address: '93.184.216.34', family: 4 });
    expect(pinned).toBe('https://93.184.216.34/robots.txt?x=1');
  });

  it('brackets IPv6 addresses', () => {
    const url = new URL('https://example.com/');
    const pinned = pinRequestUrl(url, { address: '2606:4700::1111', family: 6 });
    expect(pinned).toBe('https://[2606:4700::1111]/');
  });

  it('preserves a non-default port', () => {
    const url = new URL('https://example.com:8443/a');
    const pinned = pinRequestUrl(url, { address: '1.2.3.4', family: 4 });
    expect(pinned).toBe('https://1.2.3.4:8443/a');
  });
});

describe('analyzeStructuredData', () => {
  it('extracts @type from a valid JSON-LD block', () => {
    const html = `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: 'x' })}</script>`;
    const r = analyzeStructuredData(html);
    expect(r.jsonLd).toEqual([{ type: 'Article', valid: true }]);
    expect(r.hasAnyStructuredData).toBe(true);
  });

  it('handles an array of objects in a single JSON-LD block', () => {
    const arr = [
      { '@type': 'Organization' },
      { '@type': 'WebSite' },
    ];
    const html = `<script type="application/ld+json">${JSON.stringify(arr)}</script>`;
    const r = analyzeStructuredData(html);
    expect(r.jsonLd.map((j) => j.type)).toEqual(['Organization', 'WebSite']);
  });

  it('handles an array @type value', () => {
    const html = `<script type="application/ld+json">${JSON.stringify({ '@type': ['Person', 'Author'] })}</script>`;
    const r = analyzeStructuredData(html);
    expect(r.jsonLd.map((j) => j.type)).toEqual(['Person', 'Author']);
  });

  it('marks invalid JSON-LD as invalid', () => {
    const html = `<script type="application/ld+json">{not json</script>`;
    const r = analyzeStructuredData(html);
    expect(r.jsonLd[0]).toEqual({ type: 'Invalid JSON', valid: false });
  });

  it('counts Open Graph and Twitter Card meta tags', () => {
    const html = `<meta property="og:title" content="x"><meta property="og:image" content="y"><meta name="twitter:card" content="summary">`;
    const r = analyzeStructuredData(html);
    expect(r.openGraphCount).toBe(2);
    expect(r.twitterCardCount).toBe(1);
    expect(r.hasAnyStructuredData).toBe(true);
  });

  it('reports no structured data when none is present', () => {
    const r = analyzeStructuredData('<html><body><p>hi</p></body></html>');
    expect(r.jsonLd).toEqual([]);
    expect(r.openGraphCount).toBe(0);
    expect(r.twitterCardCount).toBe(0);
    expect(r.hasAnyStructuredData).toBe(false);
  });
});
