import { type VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  framework: 'nextjs',
  crons: [
    { path: '/api/process-prompts', schedule: '12 11 * * *' }, // 11:12 UTC, so deep night in Pacific
    { path: '/api/process-prompts', schedule: '12 12 * * *' }, // 12:12 UTC, backup run
  ],
};
