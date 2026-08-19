import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
];

export function proxy(request: NextRequest) {
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
