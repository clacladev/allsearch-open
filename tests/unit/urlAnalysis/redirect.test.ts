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
    // The fetch keeps the real hostname URL (SSRF protection happens via the dispatcher's
    // validated connect.lookup), so the mock can key off the hostname from the request URL.
    global.fetch = mock(async (input: RequestInfo | URL, init?: RequestInit) => {
      calls++;
      const url = new URL(input.toString());
      const hostname = new Headers(init?.headers).get('host') ?? url.hostname;
      if (hostname === 'puma.com') {
        return new Response(null, {
          status: 301,
          headers: new Headers({ Location: 'https://nike.com/' }),
        });
      }
      const html = fs.readFileSync(path.join(FIXTURES_DIR, `${hostname}.html`), 'utf8');
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

  // Regression coverage for deepsec finding ssrf-b720d8d309: the redirect loop re-validated the
  // hostname on every hop but never re-checked scheme/port, so a redirect Location header could
  // smuggle a non-http(s) scheme or arbitrary port past the initial-URL check.
  it('rejects a redirect to a non-standard port', async () => {
    global.fetch = mock(async () => {
      return new Response(null, {
        status: 302,
        headers: new Headers({ Location: 'http://nike.com:6379/' }),
      });
    }) as any;

    await expect(getDomainMetadata('https://puma.com')).rejects.toThrow(/standard web ports/i);
  });

  it('rejects a redirect to a non-http(s) scheme', async () => {
    global.fetch = mock(async () => {
      return new Response(null, {
        status: 302,
        headers: new Headers({ Location: 'ftp://nike.com/' }),
      });
    }) as any;

    await expect(getDomainMetadata('https://puma.com')).rejects.toThrow(/only http and https/i);
  });
});

// Regression coverage for deepsec findings other-resource-exhaustion-741243debb/f17b43766b:
// getUrlHtml used response.text() with no byte cap, so a huge (or gzip-bombed) body was fully
// buffered into memory. It now streams the body and truncates past a cap, mirroring
// libs/aiCrawlChecker.ts's fetchPage.
describe('urlAnalysis - response body cap', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('truncates an oversized body instead of buffering it all into memory', async () => {
    const MAX_BODY_BYTES = 3_000_000;
    // A marker placed well past the cap must never make it into the extracted metadata if
    // truncation is actually happening.
    const filler = 'a'.repeat(MAX_BODY_BYTES + 1_000_000);
    const html = `<html><head><title>Real Title</title></head><body>${filler}<span id="marker">SHOULD_BE_TRUNCATED</span></body></html>`;

    global.fetch = mock(async () => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          // Push in chunks so the cap logic exercises the streaming path, not a single read().
          const chunkSize = 65_536;
          for (let offset = 0; offset < html.length; offset += chunkSize) {
            controller.enqueue(encoder.encode(html.slice(offset, offset + chunkSize)));
          }
          controller.close();
        },
      });
      return new Response(stream, {
        status: 200,
        headers: new Headers({ 'Content-Type': 'text/html' }),
      });
    }) as any;

    const metadata = await getDomainMetadata('https://nike.com');

    expect(metadata.name).toBe('Real Title');
    // The marker sits well beyond MAX_BODY_BYTES, so it must have been cut off.
    expect(JSON.stringify(metadata)).not.toContain('SHOULD_BE_TRUNCATED');
  });
});
