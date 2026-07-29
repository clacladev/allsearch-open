// URL param key prefix for column filters
const PREFIX = 'filter_';

export function parseTextFilter(
  params: Record<string, string | undefined>,
  key: string
): string | undefined {
  const value = params[`${PREFIX}${key}`];
  return value && value.trim() ? value.trim() : undefined;
}

export function parseMultiSelectFilter(
  params: Record<string, string | undefined>,
  key: string
): string[] {
  const value = params[`${PREFIX}${key}`];
  if (!value || !value.trim()) return [];
  return value.split(',').filter(Boolean);
}

export function parseNumberRangeFilter(
  params: Record<string, string | undefined>,
  key: string
): { min?: number; max?: number } {
  const value = params[`${PREFIX}${key}`];
  if (!value) return {};
  const [minStr, maxStr] = value.split(',');
  const min = minStr && minStr.trim() ? Number(minStr.trim()) : undefined;
  const max = maxStr && maxStr.trim() ? Number(maxStr.trim()) : undefined;
  return {
    min: min !== undefined && !isNaN(min) ? min : undefined,
    max: max !== undefined && !isNaN(max) ? max : undefined,
  };
}

export function filterParamValue(value: string | undefined): Record<string, string | undefined> {
  return value ? { value } : {};
}

// --- Data filtering helpers ---

export function applyTextFilter<T>(data: T[], field: keyof T, value: string | undefined): T[] {
  if (!value) return data;
  const lower = value.toLowerCase();
  return data.filter((item) => {
    const fieldValue = item[field];
    if (typeof fieldValue !== 'string') return false;
    return fieldValue.toLowerCase().includes(lower);
  });
}

export function applyMultiSelectFilter<T>(data: T[], field: keyof T, values: string[]): T[] {
  if (!values.length) return data;
  return data.filter((item) => {
    const fieldValue = item[field];
    if (typeof fieldValue !== 'string') return true;
    return values.includes(fieldValue);
  });
}

export function applyNumberRangeFilter<T>(
  data: T[],
  field: keyof T,
  min: number | undefined,
  max: number | undefined
): T[] {
  if (min === undefined && max === undefined) return data;
  return data.filter((item) => {
    const fieldValue = item[field];
    if (typeof fieldValue !== 'number') return true;
    if (min !== undefined && fieldValue < min) return false;
    if (max !== undefined && fieldValue > max) return false;
    return true;
  });
}

// Encode filter values for URL params
export function encodeTextFilter(value: string | undefined): string | undefined {
  return value && value.trim() ? value.trim() : undefined;
}

export function encodeMultiSelectFilter(values: string[]): string | undefined {
  return values.length ? values.join(',') : undefined;
}

export function encodeNumberRangeFilter(
  min: number | undefined,
  max: number | undefined
): string | undefined {
  if (min === undefined && max === undefined) return undefined;
  return `${min ?? ''},${max ?? ''}`;
}
