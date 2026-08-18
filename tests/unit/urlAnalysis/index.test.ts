import { describe, it, expect, mock, beforeAll, afterAll } from 'bun:test';
import { getDomainMetadata } from '@/libs/utils/urlAnalysis';
import fs from 'fs';
import path from 'path';

/**
 * INSTRUCTIONS FOR ADDING MOCKS OR NEW TEST CASES:
 *
 * 1. To add a new URL to test, first fetch its HTML content and save it to a file.
 *    You can do this by running a quick script or using curl:
 *    `curl -A "Mozilla/5.0 (compatible; AllSearch/1.0; +https://allsearch.io)" https://example.com > libs/utils/urlAnalysis/__fixtures__/example.com.html`
 *
 * 2. Add the URL to the test suite below inside the `describe` block. Use the `domainCases` array
 *    or write a custom `it` block.
 *
 * 3. The `global.fetch` has been mocked to intercept any network requests matching the
 *    known URLs and instead return the corresponding `.html` file from `__fixtures__/`.
 *    If you add a new URL, ensure its `.html` file is named after its hostname (e.g. `example.com.html`).
 */

const FIXTURES_DIR = path.join(process.cwd(), 'tests/unit/urlAnalysis/__fixtures__');

// We test against specific known hostnames that we have downloaded HTML for
const domainCases = [
  { url: 'https://allsearch.io', expectedName: 'AllSearch' },
  { url: 'https://nike.com', expectedName: 'Nike' },
  { url: 'https://lnks.to', expectedName: 'Lnks' }, // Fallback to domain name
  { url: 'https://bgwdoors.com', expectedName: 'BGW Doors' }, // Real brand from Site Title
  { url: 'https://liveyogateachers.com', expectedName: 'Liveyogateachers' }, // Raw fallback as no spaced name is provided in DOM
  { url: 'https://nomadretreats.co', expectedName: 'Nomad Retreats' },
  { url: 'https://sportiva.com', expectedName: 'Sportiva' },
  { url: 'https://puma.com', expectedName: 'Puma' },
  { url: 'https://stanley1913.com', expectedName: 'Stanley 1913' },
  { url: 'https://hoka.com', expectedName: 'Hoka' },
];

describe('urlAnalysis - getDomainMetadata', () => {
  let originalFetch: typeof fetch;

  beforeAll(() => {
    originalFetch = global.fetch;

    // Mock global fetch to return local files instead of hitting the network. The fetch keeps
    // the real hostname URL (SSRF protection happens via the dispatcher's validated
    // connect.lookup), so the fixture lookup can key off the hostname from the request URL.
    global.fetch = mock(async (input: RequestInfo | URL, init?: RequestInit) => {
      const targetUrl = new URL(input.toString());
      const headers = new Headers(init?.headers);
      const hostname = headers.get('host') ?? targetUrl.hostname;

      const fixturePath = path.join(FIXTURES_DIR, `${hostname}.html`);

      if (fs.existsSync(fixturePath)) {
        const html = fs.readFileSync(fixturePath, 'utf8');
        const res = new Response(html, {
          status: 200,
          headers: new Headers({ 'Content-Type': 'text/html' }),
        });
        // fetch response.url is read-only but required by urlAnalysis
        Object.defineProperty(res, 'url', { value: targetUrl.href });
        return res;
      }

      // If no mock exists, throw to ensure we don't accidentally hit the real network in tests
      throw new Error(
        `Mock failed: No HTML fixture found for ${targetUrl.href}. Please add ${hostname}.html to tests/unit/urlAnalysis/__fixtures__/`
      );
    }) as any;
  });

  afterAll(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  for (const { url, expectedName } of domainCases) {
    it(`should correctly extract brand name for ${url}`, async () => {
      const metadata = await getDomainMetadata(url);

      // We mainly care that it resolves a string value and doesn't crash here.
      // To strictly test the outcome, we evaluate what's inside.
      expect(metadata).toBeDefined();
      expect(metadata.url).toBe(url);

      // Just visually logging the result to see what the heuristic decided.
      // If you're confident in exactly what each string returns, you can uncomment strict expectations:
      expect(metadata.name).toBe(expectedName);
      // console.log(`[TEST] Result for ${url}:`, metadata.name);
    });
  }
});
