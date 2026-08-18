/**
 * Prevents CSV formula injection: a cell whose value starts with a spreadsheet formula
 * trigger (=, +, -, @, or a leading tab/carriage return) gets a leading apostrophe, which
 * spreadsheet applications render as literal text instead of evaluating it as a formula.
 * Needed because several exported columns come from scraped, attacker-controlled page
 * content (titles, etc.) rather than data this app generated itself.
 */
const FORMULA_TRIGGER_CHARS = new Set(['=', '+', '-', '@', '\t', '\r']);

export function sanitizeCsvCell(value: string): string {
  return value.length > 0 && FORMULA_TRIGGER_CHARS.has(value[0]) ? `'${value}` : value;
}

export function sanitizeCsvRow<T extends Record<string, string | number | boolean | null | undefined>>(
  row: T
): T {
  const sanitized = { ...row };
  for (const key of Object.keys(sanitized) as (keyof T)[]) {
    const value = sanitized[key];
    if (typeof value === 'string') {
      sanitized[key] = sanitizeCsvCell(value) as T[keyof T];
    }
  }
  return sanitized;
}
