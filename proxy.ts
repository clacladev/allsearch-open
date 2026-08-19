import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LOOPBACK_HOSTNAMES = ['127.0.0.1', 'localhost', '::1'];

/**
 * `request.nextUrl.host` is derived from the client-controlled Host header, so a DNS-rebinding
 * attacker (attacker.example re-resolved to 127.0.0.1 after page load) can make Origin and Host
 * agree while neither is actually loopback. Require the Host itself to name loopback before
 * trusting any Origin/Referer comparison against it.
 */
function isLoopbackHost(request: NextRequest): boolean {
  return LOOPBACK_HOSTNAMES.includes(request.nextUrl.hostname);
}

/**
 * The server has no auth/session layer (see cli/runtime.ts) — it trusts whoever can reach
 * 127.0.0.1. Without this check, any web page open in the operator's browser could POST/GET
 * `/api/*` cross-origin and trigger side effects (outbound fetches, paid AI calls, DB writes)
 * using the operator's own stored keys. Reject requests whose Origin/Referer disagrees with
 * the host the request actually came in on; same-origin requests (including non-browser
 * clients that send neither header) are unaffected.
 */
function requestClaimsForeignOrigin(request: NextRequest): boolean {
  const requestHost = request.nextUrl.host;
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      return new URL(origin).host !== requestHost;
    } catch {
      return true;
    }
  }
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      return new URL(referer).host !== requestHost;
    } catch {
      return true;
    }
  }
  return false;
}

/**
 * These GET routes have real paid side effects (AI provider calls) driven entirely by query
 * params, so a browser that suppresses both Origin and Referer (e.g. `fetch(url, { mode:
 * 'no-cors', referrerPolicy: 'no-referrer' })`, or an `<img>` tag) must not fall through the
 * "no headers = trusted" case above. Require the custom header appFetch.ts sets, which
 * cross-site no-cors requests and `<img>` tags cannot attach.
 */
const EXPENSIVE_GET_ROUTES = [
  '/api/new-project/prompt-ideas',
  '/api/new-project/topics-ideas',
  '/api/new-project/competitors',
  '/api/new-project/domain-metadata',
];

export function proxy(request: NextRequest) {
  if (!isLoopbackHost(request)) {
    return NextResponse.json({ error: 'Cross-origin requests are not allowed' }, { status: 403 });
  }
  if (requestClaimsForeignOrigin(request)) {
    return NextResponse.json({ error: 'Cross-origin requests are not allowed' }, { status: 403 });
  }
  if (
    EXPENSIVE_GET_ROUTES.includes(request.nextUrl.pathname) &&
    request.headers.get('x-requested-with') !== 'AllSearch'
  ) {
    return NextResponse.json({ error: 'Cross-origin requests are not allowed' }, { status: 403 });
  }
}

export const config = {
  matcher: '/api/:path*',
};
