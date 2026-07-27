import { mock } from 'bun:test';

// Mock external dependencies before importing the route
mock.module('server-only', () => ({}));
mock.module('workflow/api', () => ({
  start: async () => ({ runId: 'mock-run-id-123' }),
}));
mock.module('@/libs/workflows/fetchDailyPrompts', () => ({
  fetchDailyPromptsWorkflow: 'mock-daily-prompts-workflow',
}));

import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import { GET } from '@/app/api/process-prompts/route';

const CRON_SECRET = 'super-secret-cron-token';

describe('GET /api/process-prompts — CRON_SECRET auth gate', () => {
  beforeAll(() => {
    process.env.CRON_SECRET = CRON_SECRET;
  });

  afterAll(() => {
    delete process.env.CRON_SECRET;
  });

  it('returns 401 when Authorization header is missing', async () => {
    const req = new Request('http://localhost/api/process-prompts');
    const res = await GET(req);
    expect(res.status).toBe(401);
    expect(await res.text()).toBe('Unauthorized');
  });

  it('returns 401 when Authorization header has the wrong token', async () => {
    const req = new Request('http://localhost/api/process-prompts', {
      headers: { Authorization: 'Bearer wrong-token' },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
    expect(await res.text()).toBe('Unauthorized');
  });

  it('returns 401 when Authorization header is malformed (no Bearer prefix)', async () => {
    const req = new Request('http://localhost/api/process-prompts', {
      headers: { Authorization: CRON_SECRET }, // missing "Bearer "
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 200 with a runId when the correct CRON_SECRET is provided', async () => {
    const req = new Request('http://localhost/api/process-prompts', {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.runId).toBe('mock-run-id-123');
    expect(body.message).toContain('fetchDailyPromptsWorkflow');
  });
});
