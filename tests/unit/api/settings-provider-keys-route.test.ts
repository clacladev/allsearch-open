import { mock } from 'bun:test';

// Note: next/server is mocked globally in tests/setup.ts

const mockRedactedKeys = [
  { provider: 'google', lastFour: 'abcd', status: 'valid', validatedAt: '2026-01-01T00:00:00Z' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockValidateProviderKey = mock(async (): Promise<any> => ({
  status: 'valid',
  isRejected: false,
  message: 'Key verified.',
}));
const mockGetRedactedProviderKeys = mock(async () => mockRedactedKeys);
const mockSetProviderKey = mock(async () => undefined);
const mockRemoveProviderKey = mock(async () => undefined);

mock.module('@/libs/ai/validateProviderKey', () => ({
  validateProviderKey: mockValidateProviderKey,
}));

mock.module('@/libs/database/Settings/queries', () => ({
  getRedactedProviderKeys: mockGetRedactedProviderKeys,
  setProviderKey: mockSetProviderKey,
  removeProviderKey: mockRemoveProviderKey,
}));

import { describe, expect, it, beforeEach } from 'bun:test';
import { POST, DELETE } from '@/app/api/settings/provider-keys/route';

const RAW_TEST_KEY = 'sk-test-super-secret-value-1234';

function makeRequest(body: unknown, method = 'POST') {
  const url = 'http://localhost/api/settings/provider-keys';
  const req = new Request(url, {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
  Object.defineProperty(req, 'nextUrl', { value: new URL(url) });
  return req;
}

describe('POST /api/settings/provider-keys', () => {
  beforeEach(() => {
    mockValidateProviderKey.mockReset();
    mockGetRedactedProviderKeys.mockReset();
    mockSetProviderKey.mockReset();
    mockRemoveProviderKey.mockReset();

    mockGetRedactedProviderKeys.mockImplementation(async () => mockRedactedKeys);
    mockSetProviderKey.mockImplementation(async () => undefined);
    mockRemoveProviderKey.mockImplementation(async () => undefined);
  });

  it('saves a valid key and returns the redacted list', async () => {
    mockValidateProviderKey.mockImplementation(async () => ({
      status: 'valid',
      isRejected: false,
      message: 'Key verified.',
    }));

    const req = makeRequest({ provider: 'google', key: RAW_TEST_KEY });
    const res = await POST(req as never);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.providerKeys).toEqual(mockRedactedKeys);
    expect(mockSetProviderKey).toHaveBeenCalledTimes(1);
    expect(mockSetProviderKey).toHaveBeenCalledWith('google', RAW_TEST_KEY, 'valid');
  });

  it('rejects an invalid key and never persists it', async () => {
    mockValidateProviderKey.mockImplementation(async () => ({
      status: 'unverified',
      isRejected: true,
      message: 'Google rejected this key.',
    }));

    const req = makeRequest({ provider: 'google', key: RAW_TEST_KEY });
    const res = await POST(req as never);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe('Google rejected this key.');
    expect(mockSetProviderKey).not.toHaveBeenCalled();
  });

  it('persists a rate-limited key with status rate_limited', async () => {
    mockValidateProviderKey.mockImplementation(async () => ({
      status: 'rate_limited',
      isRejected: false,
      message: 'Perplexity reports this key is rate limited right now, but it is a working key.',
    }));

    const req = makeRequest({ provider: 'perplexity', key: RAW_TEST_KEY });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(mockSetProviderKey).toHaveBeenCalledWith('perplexity', RAW_TEST_KEY, 'rate_limited');
  });

  it('never includes the full key value in the response body', async () => {
    mockValidateProviderKey.mockImplementation(async () => ({
      status: 'valid',
      isRejected: false,
      message: 'Key verified.',
    }));

    const req = makeRequest({ provider: 'google', key: RAW_TEST_KEY });
    const res = await POST(req as never);
    const text = await res.text();
    expect(text).not.toContain(RAW_TEST_KEY);
  });

  it('never includes the full key value in a rejection response body either', async () => {
    mockValidateProviderKey.mockImplementation(async () => ({
      status: 'unverified',
      isRejected: true,
      message: 'OpenAI rejected this key.',
    }));

    const req = makeRequest({ provider: 'openai', key: RAW_TEST_KEY });
    const res = await POST(req as never);
    const text = await res.text();
    expect(text).not.toContain(RAW_TEST_KEY);
  });

  it('returns a generic message instead of echoing a storage failure, even one that names the key', async () => {
    mockValidateProviderKey.mockImplementation(async () => ({
      status: 'valid',
      isRejected: false,
      message: 'Key verified.',
    }));
    // Simulates the leak the reviewer forced: a raw DrizzleQueryError-shaped message with the
    // plaintext key bound as a query parameter.
    mockSetProviderKey.mockImplementation(async () => {
      throw new Error(`Failed query: ...\nparams: ...,{"google":{"key":"${RAW_TEST_KEY}"}},id-1`);
    });

    const req = makeRequest({ provider: 'google', key: RAW_TEST_KEY });
    const res = await POST(req as never);
    expect(res.status).toBe(500);

    const text = await res.text();
    expect(text).not.toContain(RAW_TEST_KEY);
    const body = JSON.parse(text);
    expect(body.error).toBe('Failed to save the provider key.');
  });
});

describe('DELETE /api/settings/provider-keys', () => {
  beforeEach(() => {
    mockRemoveProviderKey.mockReset();
    mockGetRedactedProviderKeys.mockReset();
    mockRemoveProviderKey.mockImplementation(async () => undefined);
    mockGetRedactedProviderKeys.mockImplementation(async () => []);
  });

  it('removes the key and returns the fresh redacted list', async () => {
    const req = makeRequest({ provider: 'google' }, 'DELETE');
    const res = await DELETE(req as never);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.providerKeys).toEqual([]);
    expect(mockRemoveProviderKey).toHaveBeenCalledWith('google');
  });
});
