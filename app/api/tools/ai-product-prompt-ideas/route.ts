import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';
import { getProductPromptIdeas } from '@/libs/ai/productPromptIdeas/getProductPromptIdeas';
import { getPostHogServer } from '@/libs/posthog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  url: z.string().min(1).max(2048),
});

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_BUCKET_MAX = 5_000;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

function rateLimit(ip: string): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = rateBuckets.get(ip);
  if (!entry || entry.resetAt < now) {
    if (rateBuckets.size >= RATE_LIMIT_BUCKET_MAX) {
      const firstKey = rateBuckets.keys().next().value;
      if (firstKey !== undefined) rateBuckets.delete(firstKey);
    }
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { ok: true, retryAfterSec: 0 };
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { ok: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = rateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Try again in a minute.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }

  const posthog = getPostHogServer();
  const start = Date.now();

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  posthog.capture({
    distinctId: ip,
    event: 'tool_check_started',
    properties: { tool: 'ai-product-prompt-ideas', input_url: body.url },
  });

  try {
    const result = await getProductPromptIdeas(body.url);
    const durationMs = Date.now() - start;

    posthog.capture({
      distinctId: ip,
      event: 'tool_check_completed',
      properties: {
        tool: 'ai-product-prompt-ideas',
        host: safeHost(body.url),
        duration_ms: durationMs,
        group_count: result.length,
        prompt_count: result.reduce((sum, g) => sum + g.prompts.length, 0),
      },
    });

    return NextResponse.json({ url: body.url, groups: result });
  } catch (error) {
    console.error('[ai-product-prompt-ideas] unexpected error', error);
    posthog.captureException(error, ip, {
      tool: 'ai-product-prompt-ideas',
      input_url: body.url,
    });
    return NextResponse.json(
      { error: 'Something went wrong analyzing that page' },
      { status: 500 }
    );
  }
}

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return 'unknown';
  }
}
