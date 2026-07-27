import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';
import { checkAICrawlability } from '@/libs/aiCrawlChecker';
import { getPostHogServer } from '@/libs/posthog';

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
    properties: { tool: 'ai-crawl-checker', input_url: body.url },
  });

  try {
    const result = await checkAICrawlability(body.url);
    const durationMs = Date.now() - start;

    if (result.errorCategory) {
      posthog.capture({
        distinctId: ip,
        event: 'tool_check_failed',
        properties: {
          tool: 'ai-crawl-checker',
          error_category: result.errorCategory,
          duration_ms: durationMs,
          host: safeHost(result.url),
        },
      });
      const status = result.errorCategory === 'invalid_url' ? 400 : 200;
      return NextResponse.json(result, { status });
    }

    const robots = result.robotsTxt;
    const allowedCount = robots?.bots.filter((b) => b.allowed).length ?? 0;
    const blockedCount = (robots?.bots.length ?? 0) - allowedCount;
    posthog.capture({
      distinctId: ip,
      event: 'tool_check_completed',
      properties: {
        tool: 'ai-crawl-checker',
        host: safeHost(result.url),
        duration_ms: durationMs,
        robots_status: robots?.status ?? 0,
        had_robots_txt: robots ? !robots.noRobotsTxt : false,
        allowed_count: allowedCount,
        blocked_count: blockedCount,
        page_status: result.pageResponse?.status ?? 0,
        redirect_hops: Math.max(0, (result.pageResponse?.redirectChain.length ?? 1) - 1),
        rendering_likely_client_side: result.rendering?.likelyClientSide ?? false,
        rendering_visible_text_length: result.rendering?.visibleTextLength ?? 0,
        structured_data_jsonld_count: result.structuredData?.jsonLd.length ?? 0,
        structured_data_og_count: result.structuredData?.openGraphCount ?? 0,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[ai-crawl-checker] unexpected error', error);
    posthog.captureException(error, ip, { tool: 'ai-crawl-checker', input_url: body.url });
    return NextResponse.json(
      { error: 'Something went wrong checking that site' },
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
