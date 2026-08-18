import { promises as dns } from 'node:dns';
import { isIP, isIPv4 } from 'node:net';

// Server-only module. Do not import from client code.

export type ResolvedAddress = { address: string; family: number };

export type SsrfBlockReason = 'blocked_host' | 'blocked_ip' | 'dns';

export class SsrfBlockedError extends Error {
  reason: SsrfBlockReason;
  constructor(message: string, reason: SsrfBlockReason) {
    super(message);
    this.name = 'SsrfBlockedError';
    this.reason = reason;
  }
}

const BLOCKED_HOSTS = new Set(['metadata.google.internal', 'metadata']);

function ipv4ToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function inRange(ip: number, start: string, prefix: number): boolean {
  const startInt = ipv4ToInt(start);
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return (ip & mask) === (startInt & mask);
}

export function isBlockedIPv4(ip: string): boolean {
  if (!isIPv4(ip)) return false;
  const n = ipv4ToInt(ip);
  // Private + special-use IPv4 ranges that must not be reachable from a public tool.
  return (
    inRange(n, '0.0.0.0', 8) || // current network
    inRange(n, '10.0.0.0', 8) || // RFC1918
    inRange(n, '100.64.0.0', 10) || // CGNAT
    inRange(n, '127.0.0.0', 8) || // loopback
    inRange(n, '169.254.0.0', 16) || // link-local / cloud metadata
    inRange(n, '172.16.0.0', 12) || // RFC1918
    inRange(n, '192.0.0.0', 24) || // IETF protocol assignments
    inRange(n, '192.168.0.0', 16) || // RFC1918
    inRange(n, '198.18.0.0', 15) || // benchmarking
    inRange(n, '224.0.0.0', 4) || // multicast
    inRange(n, '240.0.0.0', 4) // reserved
  );
}

export function isBlockedIPv6(ip: string): boolean {
  if (isIPv4(ip)) return false;
  const lower = ip.toLowerCase();
  if (lower === '::' || lower === '::1') return true;
  // IPv4-mapped IPv6 (::ffff:a.b.c.d) — extract the v4 portion and check.
  const v4Mapped = lower.match(/^::ffff:([0-9a-f.:]+)$/);
  if (v4Mapped) {
    const inner = v4Mapped[1];
    if (isIPv4(inner)) return isBlockedIPv4(inner);
  }
  // fc00::/7 (ULA) and fe80::/10 (link-local).
  if (/^f[cd]/.test(lower)) return true;
  if (/^fe[89ab]/.test(lower)) return true;
  return false;
}

export function isBlockedHost(host: string): boolean {
  return BLOCKED_HOSTS.has(host.toLowerCase());
}

/**
 * Resolves `hostname` and rejects it if it (or any address it resolves to) falls in a
 * private/loopback/link-local/metadata range. Returns the validated addresses so the
 * caller can pin the actual network connection to one of them via pinRequestUrl — fetch()
 * re-resolving the hostname itself would reopen a DNS-rebinding TOCTOU window.
 */
export async function assertSafeHost(hostname: string): Promise<ResolvedAddress[]> {
  const lower = hostname.toLowerCase();
  if (isBlockedHost(lower) || lower === 'localhost' || lower === '[::1]') {
    throw new SsrfBlockedError('Internal hostnames are not allowed', 'blocked_host');
  }
  // If the hostname is already a literal IP, validate directly.
  if (isIP(lower)) {
    if (isBlockedIPv4(lower) || isBlockedIPv6(lower)) {
      throw new SsrfBlockedError('That IP range is not allowed', 'blocked_ip');
    }
    return [{ address: lower, family: isIPv4(lower) ? 4 : 6 }];
  }
  let addrs: ResolvedAddress[];
  try {
    addrs = await dns.lookup(hostname, { all: true });
  } catch {
    throw new SsrfBlockedError(`Could not resolve hostname: ${hostname}`, 'dns');
  }
  if (!addrs.length) {
    throw new SsrfBlockedError(`Could not resolve hostname: ${hostname}`, 'dns');
  }
  for (const { address } of addrs) {
    if (isBlockedIPv4(address) || isBlockedIPv6(address)) {
      throw new SsrfBlockedError('That address resolves to a blocked range', 'blocked_ip');
    }
  }
  return addrs;
}

/**
 * Rewrites `url` to point at a validated IP literal instead of its hostname, so the TCP
 * connection can't be re-resolved to a different (unvalidated) address between the
 * assertSafeHost check and the actual fetch. The original hostname must still be sent as
 * the Host header / TLS SNI (via the `tls.serverName` fetch option) for virtual hosting
 * and certificate validation to work.
 */
export function pinRequestUrl(url: URL, address: ResolvedAddress): string {
  const host = address.family === 6 ? `[${address.address}]` : address.address;
  const port = url.port ? `:${url.port}` : '';
  return `${url.protocol}//${host}${port}${url.pathname}${url.search}`;
}
