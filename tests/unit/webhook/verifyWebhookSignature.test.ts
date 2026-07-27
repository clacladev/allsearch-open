import { mock } from 'bun:test';

// Mock server-only and Supabase before importing anything that depends on them
mock.module('server-only', () => ({}));
mock.module('@/libs/database/supabase/serverAsAdmin', () => ({
  createClient: async () => ({}),
}));

import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import crypto from 'crypto';
import { verifyWebhookSignature } from '@/app/api/webhook/lemonsqueezy/helpers';

const SECRET = 'test-hmac-signing-secret';

function makeSignature(body: string, secret = SECRET): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

describe('verifyWebhookSignature', () => {
  beforeAll(() => {
    process.env.LEMONSQUEEZY_SIGNING_SECRET = SECRET;
  });

  afterAll(() => {
    delete process.env.LEMONSQUEEZY_SIGNING_SECRET;
  });

  it('does not throw when the signature matches the body', () => {
    const body = '{"event":"subscription_created"}';
    const headers = new Headers({ 'x-signature': makeSignature(body) });
    expect(() => verifyWebhookSignature(body, headers)).not.toThrow();
  });

  it('throws "Invalid signature" when the signature is wrong', () => {
    const body = '{"event":"subscription_created"}';
    const badSig = 'a'.repeat(64); // 64 hex chars, but wrong value
    const headers = new Headers({ 'x-signature': badSig });
    expect(() => verifyWebhookSignature(body, headers)).toThrow('Invalid signature');
  });

  it('throws when the body has been tampered with after signing', () => {
    const originalBody = '{"event":"subscription_created","amount":100}';
    const tamperedBody = '{"event":"subscription_created","amount":999}';
    const headers = new Headers({ 'x-signature': makeSignature(originalBody) });
    expect(() => verifyWebhookSignature(tamperedBody, headers)).toThrow('Invalid signature');
  });

  it('throws when signed with a different secret', () => {
    const body = '{"event":"subscription_created"}';
    const headers = new Headers({ 'x-signature': makeSignature(body, 'wrong-secret') });
    expect(() => verifyWebhookSignature(body, headers)).toThrow('Invalid signature');
  });

  it('accepts an empty body with a matching signature', () => {
    const body = '';
    const headers = new Headers({ 'x-signature': makeSignature(body) });
    expect(() => verifyWebhookSignature(body, headers)).not.toThrow();
  });
});
