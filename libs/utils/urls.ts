export function getSafeNewUrl(inputUrl: string) {
  return new URL(inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`);
}

export function getUrlCleanComponents(inputUrl: string): { url: string; hostname: string } {
  const url = getSafeNewUrl(inputUrl);

  const utmKeys = [...url.searchParams.keys()].filter((key) => key.startsWith('utm_'));
  utmKeys.forEach((key) => url.searchParams.delete(key));

  const hostname = url.hostname.replace(/^www\./, '');
  const pathname = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
  const search = url.search;

  return {
    url: `${hostname}${pathname}${search}`,
    hostname,
  };
}

export function isValidUrl(url: string) {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return false;

  try {
    const urlObj = getSafeNewUrl(trimmedUrl);
    const hostname = urlObj.hostname;
    const parts = hostname.split('.');

    // Ensure it has at least a domain and an extension (e.g., domain.com)
    return parts.length >= 2 && parts.every((part) => part.length > 0);
  } catch {
    return false;
  }
}
