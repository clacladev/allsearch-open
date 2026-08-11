import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { getDomainMetadata } from '@/libs/utils/urlAnalysis';
import fs from 'fs';
import path from 'path';

const FIXTURES_DIR = path.join(process.cwd(), 'tests/unit/urlAnalysis/__fixtures__');

describe('urlAnalysis - redirect handling', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('follows a redirect chain and resolves metadata from the final destination', async () => {
    let calls = 0;
    global.fetch = mock(async (input: RequestInfo | URL) => {
      calls++;
      const url = new URL(input.toString());
      if (url.hostname === 'puma.com') {
        return new Response(null, {
          status: 301,
          headers: new Headers({ Location: 'https://nike.com/' }),
        });
      }
      const html = fs.readFileSync(path.join(FIXTURES_DIR, `${url.hostname}.html`), 'utf8');
      return new Response(html, {
        status: 200,
        headers: new Headers({ 'Content-Type': 'text/html' }),
      });
    }) as any;

    const metadata = await getDomainMetadata('https://puma.com');

    // One request to puma.com (301) plus one to the redirect target.
    expect(calls).toBe(2);
    // The reported url stays the one the caller asked about...
    expect(metadata.url).toBe('https://puma.com');
    // ...but the metadata comes from where the redirect actually landed.
    expect(metadata.name).toBe('Nike');
  });

  it('throws after exceeding the redirect limit instead of looping forever', async () => {
    global.fetch = mock(async (input: RequestInfo | URL) => {
      const url = new URL(input.toString());
      return new Response(null, {
        status: 302,
        headers: new Headers({ Location: `${url.origin}${url.pathname}/next` }),
      });
    }) as any;

    await expect(getDomainMetadata('https://nike.com')).rejects.toThrow(/Too many redirects/);
  });
});
