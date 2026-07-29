import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';
import { checkAICrawlability } from '@/libs/aiCrawlChecker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  url: z.string().min(1).max(2048),
});

// Per-IP rate limit: token bucket with refill.
// Note: in-memory. On Vercel Fluid Compute / serverless this is per-instance,
// not global. Sufficient v1 protection; upgrade to Upstash if abuse appears.
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

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }


  try {
    const result = await checkAICrawlability(body.url);

    if (result.errorCategory) {
      const status = result.errorCategory === 'invalid_url' ? 400 : 200;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[ai-crawl-checker] unexpected error', error);
    return NextResponse.json(
      { error: 'Something went wrong checking that site' },
      { status: 500 }
    );
  }
}
