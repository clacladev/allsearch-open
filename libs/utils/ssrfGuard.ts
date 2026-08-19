import { promises as dns } from 'node:dns';
import { BlockList, isIP, isIPv4, type LookupFunction } from 'node:net';

// Server-only module. Do not import from client code.

export type ResolvedAddress = { address: string; family: number };

export type SsrfBlockReason = 'blocked_host' | 'blocked_ip' | 'dns';

// Shared allowlist for outbound-fetch callers (urlAnalysis.ts, aiCrawlChecker.ts): only plain
// http(s) on standard/common web ports. Applied to the initial URL and re-checked on every
// redirect hop so a redirect can't smuggle a scheme/port change past the guard.
export const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
export const ALLOWED_PORTS = new Set(['', '80', '443', '8080', '8443']);

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

// Structural IPv6 blocklist (net.BlockList) rather than ad-hoc string/regex matching, so the
// guard is correct on its own — it doesn't depend on a caller having already normalized the
// address (e.g. via the WHATWG URL serializer's dotted-form rewrite of IPv4-mapped addresses).
const blockedIPv6Ranges = new BlockList();
blockedIPv6Ranges.addAddress('::', 'ipv6');
blockedIPv6Ranges.addAddress('::1', 'ipv6');
blockedIPv6Ranges.addSubnet('fc00::', 7, 'ipv6'); // ULA
blockedIPv6Ranges.addSubnet('fe80::', 10, 'ipv6'); // link-local
// IPv4-mapped (::ffff:0:0/96, covers both dotted `::ffff:a.b.c.d` and hex `::ffff:7f00:1` forms),
// NAT64 (64:ff9b::/96), 6to4 (2002::/16), and Teredo (2001::/32) all tunnel/translate an
// embedded IPv4 address; block the whole range rather than trying to decode the embedded
// address, since legitimate hostnames never resolve to these forms.
blockedIPv6Ranges.addSubnet('::ffff:0:0', 96, 'ipv6');
blockedIPv6Ranges.addSubnet('64:ff9b::', 96, 'ipv6');
blockedIPv6Ranges.addSubnet('2002::', 16, 'ipv6');
blockedIPv6Ranges.addSubnet('2001::', 32, 'ipv6');

export function isBlockedIPv6(ip: string): boolean {
  if (isIPv4(ip)) return false;
  if (isIP(ip) !== 6) return false;
  return blockedIPv6Ranges.check(ip, 'ipv6');
}

export function isBlockedHost(host: string): boolean {
  return BLOCKED_HOSTS.has(host.toLowerCase());
}

/**
 * Resolves `hostname` and rejects it if it (or any address it resolves to) falls in a
 * private/loopback/link-local/metadata range. Returns the validated addresses so callers can
 * enforce the same gate on the actual connection via `safeLookup`.
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
 * A `node:net` lookup function that resolves a hostname through the same SSRF validation as
 * `assertSafeHost` and returns only the addresses that pass. Wire it into an undici Agent's
 * `connect.lookup` so the socket resolves via this validated gate; because the lookup result is
 * exactly what the connection binds to, there is no second, unvalidated DNS resolution to
 * exploit (DNS rebinding). The request URL keeps its real hostname, so SNI, the Host header,
 * and virtual hosting are all handled normally by the TLS stack.
 */
export const safeLookup: LookupFunction = (hostname, options, callback) => {
  assertSafeHost(hostname)
    .then((addrs) => {
      if (options?.all) {
        callback(null, addrs.map((a) => ({ address: a.address, family: a.family })));
      } else {
        const first = addrs[0];
        callback(null, first.address, first.family);
      }
    })
    .catch((err: unknown) => {
      const lookupErr = err as NodeJS.ErrnoException;
      (callback as (err: NodeJS.ErrnoException) => void)(lookupErr);
    });
};
