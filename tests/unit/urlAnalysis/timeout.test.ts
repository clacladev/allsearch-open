import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import * as urlAnalysis from '@/libs/utils/urlAnalysis';

const MOCK_PROJECT = { id: 'proj-1', name: 'TestProject' } as any;
const MOCK_COMPETITORS = [] as any[];
const MOCK_URL = 'https://example-hang.com/page';

const SHORT_TIMEOUT_MS = 50;

describe('urlAnalysis - timeout protection', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    urlAnalysis._setFetchTimeoutMs(SHORT_TIMEOUT_MS);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    urlAnalysis._setFetchTimeoutMs(urlAnalysis.DEFAULT_FETCH_TIMEOUT);
  });

  it('should reject when the response body read hangs indefinitely', async () => {
    global.fetch = mock(async (input: RequestInfo | URL, _init?: RequestInit) => {
      const res = new Response('', {
        status: 200,
        headers: new Headers({ 'Content-Type': 'text/html' }),
      });
      Object.defineProperty(res, 'url', { value: input.toString() });
      // .text() never settles — simulates a server that streams the body infinitely
      res.text = () => new Promise(() => {});
      return res;
    }) as any;

    await expect(
      urlAnalysis.getUrlAnalysis(MOCK_URL, MOCK_PROJECT, MOCK_COMPETITORS)
    ).rejects.toThrow();
  });

  it('should reject when the fetch connection itself hangs indefinitely', async () => {
    global.fetch = mock(
      (_input: RequestInfo | URL, _init?: RequestInit) => new Promise(() => {}) as Promise<Response>
    ) as any;

    await expect(
      urlAnalysis.getUrlAnalysis(MOCK_URL, MOCK_PROJECT, MOCK_COMPETITORS)
    ).rejects.toThrow();
  });
});
