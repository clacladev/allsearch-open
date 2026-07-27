/**
 * Known second-level domain labels that combine with a 2-letter country code to form a
 * compound TLD (e.g., .co.uk, .com.au, .org.nz).
 */
const KNOWN_SECOND_LEVEL_DOMAINS = new Set([
  'co',
  'com',
  'net',
  'org',
  'gov',
  'edu',
  'ac',
  'ne',
  'or',
  'me',
  'ltd',
  'plc',
  'sch',
]);

/**
 * Extracts the base brand name from a hostname, stripping subdomains and TLD extensions.
 * Handles compound TLDs like .co.uk, .com.au, etc.
 *
 * Examples:
 *   - nike.com → nike
 *   - nike.it → nike
 *   - shop.adidas.co.uk → adidas
 *   - it.on.com → on
 *   - adidas.com → adidas
 */
export function extractBaseDomain(hostname: string): string {
  const parts = hostname.toLowerCase().split('.');
  if (parts.length < 2) return hostname.toLowerCase();

  const tld = parts[parts.length - 1];
  const sld = parts[parts.length - 2];

  // Check for compound TLD (e.g., .co.uk, .com.au):
  // a 2-letter country code at the end AND a known SLD before it
  if (tld.length === 2 && KNOWN_SECOND_LEVEL_DOMAINS.has(sld)) {
    // The brand name is the segment just before the compound TLD
    return parts.length >= 3 ? parts[parts.length - 3] : parts[0];
  }

  // Standard case: brand name is the segment just before the TLD
  return sld;
}

/**
 * Returns true if two hostnames belong to the same brand domain.
 * Two hostnames are considered related if they share the same base domain name,
 * regardless of subdomains and TLD extensions.
 *
 * Examples:
 *   - nike.com and nike.it → true
 *   - shop.adidas.co.uk and adidas.com → true
 *   - on.com and it.on.com → true
 *   - nike.com and adidas.com → false
 */
export function areDomainsRelated(hostname1: string, hostname2: string): boolean {
  return extractBaseDomain(hostname1) === extractBaseDomain(hostname2);
}
