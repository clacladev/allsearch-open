import { describe, expect, it } from 'bun:test';
import { getDomainMetadata } from '@/libs/utils/urlAnalysis';

// Regression coverage for deepsec findings ssrf-50ce0fd93e and ssrf-9e40c1ac5f: urlAnalysis.ts
// used to have its own, weaker isPrivateIP() (missing IPv4-mapped IPv6 and several reserved
// ranges — see libs/aiCrawlChecker.test.ts's isBlockedIPv6 coverage for that specific gap) and
// no DNS-rebinding protection. It's now wired through the shared libs/utils/ssrfGuard.ts, so
// the same blocklist applies here as in aiCrawlChecker.ts, and its dispatcher resolves via
// the shared validated connect.lookup.
describe('urlAnalysis - SSRF guard', () => {
  it('blocks literal loopback addresses', async () => {
    await expect(getDomainMetadata('http://127.0.0.1/')).rejects.toThrow();
  });

  it('blocks literal cloud-metadata addresses', async () => {
    await expect(getDomainMetadata('http://169.254.169.254/')).rejects.toThrow();
  });

  it('blocks literal RFC1918 addresses', async () => {
    await expect(getDomainMetadata('http://10.0.0.1/')).rejects.toThrow();
  });

  it('blocks the localhost hostname', async () => {
    await expect(getDomainMetadata('http://localhost/')).rejects.toThrow();
  });
});

// Regression coverage for deepsec finding ssrf-b720d8d309: urlAnalysis.ts had no protocol/port
// allowlist (unlike libs/aiCrawlChecker.ts's ALLOWED_PROTOCOLS/ALLOWED_PORTS), so it would open
// TCP connections to arbitrary ports on arbitrary public hosts. It now enforces the same
// allowlist on the initial URL.
describe('urlAnalysis - protocol/port allowlist', () => {
  it('rejects non-http(s) schemes', async () => {
    // getSafeNewUrl only prepends `https://` when the input doesn't start with "http", so a
    // scheme like `httpx://` (which passes that startsWith check unchanged) is the realistic way
    // a non-http(s) scheme reaches the allowlist check on the initial URL.
    await expect(getDomainMetadata('httpx://example.com/')).rejects.toThrow(
      /only http and https/i
    );
  });

  it('rejects non-standard ports', async () => {
    await expect(getDomainMetadata('http://example.com:6379/')).rejects.toThrow(
      /standard web ports/i
    );
  });
});
