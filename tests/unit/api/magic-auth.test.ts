import { mock } from 'bun:test';

// Mock server-only and Supabase before importing the route
mock.module('server-only', () => ({}));

// Provide a controllable mock for the env module
// In production mode: isDevEnv = false → route should return 403
mock.module('@/libs/env', () => ({
  isDevEnv: false,
  isProdEnv: true,
  isPreviewEnv: false,
  isPreProductionEnv: false,
  getEnvironment: () => 'production',
}));

mock.module('@/libs/database/supabase/serverAsAdmin', () => ({
  createClient: async () => ({
    auth: {
      admin: {
        generateLink: async () => ({
          data: { properties: { email_otp: '654321' } },
          error: null,
        }),
      },
    },
  }),
}));

import { describe, expect, it } from 'bun:test';
import { GET } from '@/app/api/admin/magic-auth/route';

describe('GET /api/admin/magic-auth — environment protection', () => {
  it('returns 403 when not in dev environment', async () => {
    const res = await GET();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Not allowed');
  });
});
