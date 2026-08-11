export function formatPrice(amount: number, currency: string, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100); // Assuming the amount is in cents/pence
}

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

/** Formats a byte count for display, in decimal units — the convention every desktop file manager
 * the user will cross-check against uses. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';

  const unitIndex = Math.min(Math.floor(Math.log10(bytes) / 3), BYTE_UNITS.length - 1);
  const value = bytes / 1000 ** unitIndex;
  const fractionDigits = unitIndex === 0 || value >= 100 ? 0 : 1;

  return `${value.toFixed(fractionDigits)} ${BYTE_UNITS[unitIndex]}`;
}

export function toOrdinal(n: number): string {
  const abs = Math.abs(Math.trunc(n));
  const mod100 = abs % 100;

  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;

  switch (abs % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}
