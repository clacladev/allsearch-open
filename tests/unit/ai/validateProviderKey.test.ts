import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { validateProviderKey } from '@/libs/ai/validateProviderKey';

// This file only stubs the global `fetch`, never `mock.module()` — validateProviderKey.ts has no
// dependency on any other project module, so the mock.module process-wide pollution hazard
// documented at tests/unit/ai/models.test.ts:10-27 doesn't apply here.

const SECRET_KEY = 'sk-super-secret-value-should-never-leak';

function jsonResponse(status: number) {
  return new Response(JSON.stringify({}), { status });
}

describe('validateProviderKey', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('google', () => {
    it('returns valid on a 2xx response', async () => {
      global.fetch = mock(async () => jsonResponse(200)) as unknown as typeof fetch;
      const result = await validateProviderKey('google', SECRET_KEY);
      expect(result).toMatchObject({ status: 'valid', isRejected: false });
    });

    it('rejects on 401 and names the provider', async () => {
      global.fetch = mock(async () => jsonResponse(401)) as unknown as typeof fetch;
      const result = await validateProviderKey('google', SECRET_KEY);
      expect(result.isRejected).toBe(true);
      expect(result.message).toContain('Google');
    });

    it('rejects on 403 and names the provider', async () => {
      global.fetch = mock(async () => jsonResponse(403)) as unknown as typeof fetch;
      const result = await validateProviderKey('google', SECRET_KEY);
      expect(result.isRejected).toBe(true);
      expect(result.message).toContain('Google');
    });

    it('saves as rate_limited on 429, not rejected', async () => {
      global.fetch = mock(async () => jsonResponse(429)) as unknown as typeof fetch;
      const result = await validateProviderKey('google', SECRET_KEY);
      expect(result).toMatchObject({ status: 'rate_limited', isRejected: false });
    });

    it('is unverified (and not rejected) on a network throw', async () => {
      global.fetch = mock(async () => {
        throw new TypeError('fetch failed');
      }) as unknown as typeof fetch;
      const result = await validateProviderKey('google', SECRET_KEY);
      expect(result).toMatchObject({ status: 'unverified', isRejected: false });
    });

    it('is unverified (and not rejected) on a timeout', async () => {
      global.fetch = mock(async () => {
        const error = new DOMException('The operation was aborted.', 'TimeoutError');
        throw error;
      }) as unknown as typeof fetch;
      const result = await validateProviderKey('google', SECRET_KEY);
      expect(result).toMatchObject({ status: 'unverified', isRejected: false });
    });

    it('is unverified (and not rejected) on any other non-2xx status', async () => {
      global.fetch = mock(async () => jsonResponse(500)) as unknown as typeof fetch;
      const result = await validateProviderKey('google', SECRET_KEY);
      expect(result).toMatchObject({ status: 'unverified', isRejected: false });
    });
  });

  describe('openai', () => {
    it('returns valid on a 2xx response and sends the key as a bearer token', async () => {
      const fetchMock = mock((_url: string, _init?: RequestInit) => jsonResponse(200));
      global.fetch = fetchMock as unknown as typeof fetch;

      const result = await validateProviderKey('openai', SECRET_KEY);

      expect(result).toMatchObject({ status: 'valid', isRejected: false });
      const [, init] = fetchMock.mock.calls[0];
      expect((init?.headers as Record<string, string>).Authorization).toBe(`Bearer ${SECRET_KEY}`);
    });

    it('rejects on 401 and names the provider', async () => {
      global.fetch = mock(async () => jsonResponse(401)) as unknown as typeof fetch;
      const result = await validateProviderKey('openai', SECRET_KEY);
      expect(result.isRejected).toBe(true);
      expect(result.message).toContain('OpenAI');
    });

    it('rejects on 403 and names the provider', async () => {
      global.fetch = mock(async () => jsonResponse(403)) as unknown as typeof fetch;
      const result = await validateProviderKey('openai', SECRET_KEY);
      expect(result.isRejected).toBe(true);
      expect(result.message).toContain('OpenAI');
    });

    it('saves as rate_limited on 429, not rejected', async () => {
      global.fetch = mock(async () => jsonResponse(429)) as unknown as typeof fetch;
      const result = await validateProviderKey('openai', SECRET_KEY);
      expect(result).toMatchObject({ status: 'rate_limited', isRejected: false });
    });

    it('is unverified (and not rejected) on a network throw', async () => {
      global.fetch = mock(async () => {
        throw new TypeError('fetch failed');
      }) as unknown as typeof fetch;
      const result = await validateProviderKey('openai', SECRET_KEY);
      expect(result).toMatchObject({ status: 'unverified', isRejected: false });
    });

    it('is unverified (and not rejected) on a timeout', async () => {
      global.fetch = mock(async () => {
        throw new DOMException('The operation was aborted.', 'TimeoutError');
      }) as unknown as typeof fetch;
      const result = await validateProviderKey('openai', SECRET_KEY);
      expect(result).toMatchObject({ status: 'unverified', isRejected: false });
    });
  });

  describe('perplexity', () => {
    it('never calls fetch and returns unverified immediately', async () => {
      const fetchMock = mock(async () => jsonResponse(200));
      global.fetch = fetchMock as unknown as typeof fetch;

      const result = await validateProviderKey('perplexity', SECRET_KEY);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result).toMatchObject({ status: 'unverified', isRejected: false });
    });
  });

  describe('key confidentiality', () => {
    it('never includes the key value in any message across every branch', async () => {
      const statuses = [200, 401, 403, 429, 500];
      for (const status of statuses) {
        global.fetch = mock(async () => jsonResponse(status)) as unknown as typeof fetch;
        for (const provider of ['google', 'openai'] as const) {
          const result = await validateProviderKey(provider, SECRET_KEY);
          expect(result.message).not.toContain(SECRET_KEY);
        }
      }

      global.fetch = mock(async () => {
        throw new TypeError('fetch failed');
      }) as unknown as typeof fetch;
      for (const provider of ['google', 'openai'] as const) {
        const result = await validateProviderKey(provider, SECRET_KEY);
        expect(result.message).not.toContain(SECRET_KEY);
      }

      const perplexityResult = await validateProviderKey('perplexity', SECRET_KEY);
      expect(perplexityResult.message).not.toContain(SECRET_KEY);
    });
  });
});
