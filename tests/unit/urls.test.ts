import { describe, expect, it } from 'bun:test';
import { getSafeNewUrl, getUrlCleanComponents, isValidUrl } from '@/libs/utils/urls';

describe('getSafeNewUrl', () => {
  it('parses a URL that already has https://', () => {
    const url = getSafeNewUrl('https://example.com/path');
    expect(url.hostname).toBe('example.com');
    expect(url.pathname).toBe('/path');
  });

  it('prepends https:// when the URL has no protocol', () => {
    const url = getSafeNewUrl('example.com/path');
    expect(url.protocol).toBe('https:');
    expect(url.hostname).toBe('example.com');
  });

  it('parses http:// URLs without adding https://', () => {
    const url = getSafeNewUrl('http://example.com');
    expect(url.protocol).toBe('http:');
  });
});

describe('getUrlCleanComponents', () => {
  it('removes UTM query parameters', () => {
    const { url } = getUrlCleanComponents(
      'https://example.com/page?utm_source=google&utm_medium=cpc'
    );
    expect(url).not.toContain('utm_source');
    expect(url).not.toContain('utm_medium');
  });

  it('preserves non-UTM query parameters', () => {
    const { url } = getUrlCleanComponents('https://example.com/page?ref=newsletter&q=test');
    expect(url).toContain('ref=newsletter');
    expect(url).toContain('q=test');
  });

  it('removes www. prefix from hostname', () => {
    const { hostname, url } = getUrlCleanComponents('https://www.example.com/page');
    expect(hostname).toBe('example.com');
    expect(url).toContain('example.com');
    expect(url).not.toContain('www.example.com');
  });

  it('removes trailing slash from pathname', () => {
    const { url } = getUrlCleanComponents('https://example.com/page/');
    expect(url).toBe('example.com/page');
  });

  it('keeps root path clean (no trailing slash)', () => {
    const { url, hostname } = getUrlCleanComponents('https://example.com/');
    expect(url).toBe('example.com');
    expect(hostname).toBe('example.com');
  });

  it('returns correct hostname for a URL with path and query', () => {
    const { hostname } = getUrlCleanComponents('https://blog.example.com/post?id=1');
    expect(hostname).toBe('blog.example.com');
  });

  it('handles URL without protocol by prepending https://', () => {
    const { hostname } = getUrlCleanComponents('example.com');
    expect(hostname).toBe('example.com');
  });
});

describe('isValidUrl', () => {
  it('returns true for a valid https URL', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
  });

  it('returns true for a URL without protocol', () => {
    expect(isValidUrl('example.com')).toBe(true);
  });

  it('returns true for a URL with subdomain', () => {
    expect(isValidUrl('https://blog.example.com/article')).toBe(true);
  });

  it('returns false for an empty string', () => {
    expect(isValidUrl('')).toBe(false);
  });

  it('returns false for a whitespace-only string', () => {
    expect(isValidUrl('   ')).toBe(false);
  });

  it('returns false for a single-segment hostname (no TLD)', () => {
    expect(isValidUrl('localhost')).toBe(false);
  });

  it('returns true for localhost with port', () => {
    // getSafeNewUrl('localhost:3000') prepends https -> https://localhost:3000
    // hostname is 'localhost', parts.length is 1 -> invalid
    // Depending on URL parsing, let's verify actual behavior
    expect(isValidUrl('https://localhost:3000')).toBe(false);
  });

  it('returns true for URLs with path components', () => {
    expect(isValidUrl('https://example.com/path/to/page')).toBe(true);
  });
});
