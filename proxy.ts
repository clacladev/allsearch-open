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
/**
 * Next.js normalizes `request.nextUrl`'s hostname (`127.0.0.1` becomes `localhost`), while the
 * browser's Origin/Referer headers keep the literal host the page was loaded from. So a page
 * served at `http://127.0.0.1:3001` sends `Origin: http://127.0.0.1:3001` but `nextUrl.host`
 * reads `localhost:3001` — a naive string comparison rejects every same-origin request from
 * the CLI's own URL (`http://127.0.0.1:<port>`, see cli/runtime.ts). Canonicalize all loopback
 * spellings to one name before comparing, so the check still catches real cross-origin
 * attackers without breaking the app's own loopback clients.
 */
function canonicalLoopbackHostname(hostname: string): string {
  const lower = hostname.toLowerCase();
  // Bracketed IPv6 literals as URL parsers report them.
  const bare = lower.startsWith('[') && lower.endsWith(']') ? lower.slice(1, -1) : lower;
  return LOOPBACK_HOSTNAMES.includes(bare) ? 'localhost' : lower;
}

function sameLoopbackHost(a: string, b: string): boolean {
  let urlA: URL;
  let urlB: URL;
  try {
    urlA = new URL(a);
    urlB = new URL(b);
  } catch {
    return false;
  }
  return (
    canonicalLoopbackHostname(urlA.hostname) === canonicalLoopbackHostname(urlB.hostname) &&
    urlA.port === urlB.port
  );
}

function requestClaimsForeignOrigin(request: NextRequest): boolean {
  // Compare against the raw Host header the client actually sent — `nextUrl.host` is already
  // normalized by Next and can disagree with it on loopback (see above).
  const requestHost = request.headers.get('host') ?? request.nextUrl.host;
  const requestUrl = `http://${requestHost}`;
  const origin = request.headers.get('origin');
  if (origin) {
    return !sameLoopbackHost(origin, requestUrl);
  }
  const referer = request.headers.get('referer');
  if (referer) {
    return !sameLoopbackHost(referer, requestUrl);
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
