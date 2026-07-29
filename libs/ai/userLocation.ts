/**
 * Hand-written country name → ISO-2 map, plus the aliases that matter. Common
 * countries only; this is not meant to be exhaustive. Matched
 * case-insensitively on trimmed input.
 */
export const COUNTRY_NAME_TO_ISO2: Record<string, string> = {
  'united kingdom': 'GB',
  uk: 'GB',
  england: 'GB',
  scotland: 'GB',
  wales: 'GB',
  'united states': 'US',
  'united states of america': 'US',
  usa: 'US',
  us: 'US',
  'united arab emirates': 'AE',
  uae: 'AE',
  canada: 'CA',
  australia: 'AU',
  germany: 'DE',
  france: 'FR',
  spain: 'ES',
  italy: 'IT',
  ireland: 'IE',
  netherlands: 'NL',
  belgium: 'BE',
  switzerland: 'CH',
  portugal: 'PT',
  sweden: 'SE',
  norway: 'NO',
  denmark: 'DK',
  finland: 'FI',
  poland: 'PL',
  japan: 'JP',
  china: 'CN',
  india: 'IN',
  brazil: 'BR',
  mexico: 'MX',
  'new zealand': 'NZ',
  singapore: 'SG',
};

function resolveCountry(part: string): string | undefined {
  const normalized = part.trim().toLowerCase();
  if (normalized in COUNTRY_NAME_TO_ISO2) return COUNTRY_NAME_TO_ISO2[normalized];
  return undefined;
}

export function parseTargetLocation(
  targetLocation: string | null | undefined
): { city?: string; country?: string } | undefined {
  const parts = (targetLocation ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  let country: string | undefined;
  const cityParts: string[] = [];
  for (const part of parts) {
    const resolved = resolveCountry(part);
    if (resolved) {
      // If several parts resolve to a country, the last one wins.
      country = resolved;
    } else if (part.length > 2) {
      cityParts.push(part);
    }
    // else: an unrecognised token of 2 characters or fewer (e.g. a stray "GB"
    // or "CA") is dropped rather than guessed into the city — a nonsense city
    // name is worse than no location at all. Dropping is not resolving: this
    // must never turn "CA" into Canada.
  }

  const city = cityParts.join(', ') || undefined;

  if (!city && !country) return undefined;
  return { ...(city ? { city } : {}), ...(country ? { country } : {}) };
}
