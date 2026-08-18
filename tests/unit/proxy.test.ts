import { describe, expect, it } from 'bun:test';
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';

function requestTo(url: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(url, { headers });
}

describe('proxy', () => {
  it('allows requests with no Origin or Referer header', async () => {
    const res = await proxy(requestTo('http://127.0.0.1:4000/api/tools/ai-crawl-checker'));
    expect(res).toBeUndefined();
  });

  it('allows requests whose Origin matches the request host', async () => {
    const res = await proxy(
      requestTo('http://127.0.0.1:4000/api/tools/ai-crawl-checker', {
        origin: 'http://127.0.0.1:4000',
      })
    );
    expect(res).toBeUndefined();
  });

  it('allows requests whose Referer matches the request host when Origin is absent', async () => {
    const res = await proxy(
      requestTo('http://127.0.0.1:4000/api/tools/ai-crawl-checker', {
        referer: 'http://127.0.0.1:4000/dashboard',
      })
    );
    expect(res).toBeUndefined();
  });

  it('rejects requests with a cross-origin Origin header', async () => {
    const res = await proxy(
      requestTo('http://127.0.0.1:4000/api/tools/ai-crawl-checker', {
        origin: 'https://evil.example',
      })
    );
    expect(res).toBeDefined();
    expect(res?.status).toBe(403);
  });

  it('rejects requests with a cross-origin Referer when Origin is absent', async () => {
    const res = await proxy(
      requestTo('http://127.0.0.1:4000/api/tools/ai-crawl-checker', {
        referer: 'https://evil.example/attack',
      })
    );
    expect(res).toBeDefined();
    expect(res?.status).toBe(403);
  });

  it('rejects requests with an unparseable Origin header', async () => {
    const res = await proxy(
      requestTo('http://127.0.0.1:4000/api/tools/ai-crawl-checker', {
        origin: 'not a url',
      })
    );
    expect(res).toBeDefined();
    expect(res?.status).toBe(403);
  });
});
