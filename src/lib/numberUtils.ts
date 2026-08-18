/**
 * Centralized Numeric Safety Utilities to prevent Runtime Errors, NaN, Infinity, and White Screens.
 */

export function safeNum(val: unknown, fallback = 0): number {
  if (typeof val === 'number') {
    return Number.isNaN(val) || !Number.isFinite(val) ? fallback : val;
  }
  if (typeof val === 'string' && val.trim() !== '') {
    const parsed = Number(val);
    return Number.isNaN(parsed) || !Number.isFinite(parsed) ? fallback : parsed;
  }
  return fallback;
}

export function safeFixed(val: unknown, digits = 2, fallback = 0): string {
  const n = safeNum(val, fallback);
  return n.toFixed(digits);
}

export function safeLocale(val: unknown, locale = 'en-US', options?: Intl.NumberFormatOptions): string {
  const n = safeNum(val, 0);
  return n.toLocaleString(locale, options);
}

export function safeDiv(numerator: unknown, denominator: unknown, fallback = 0): number {
  const num = safeNum(numerator, 0);
  const den = safeNum(denominator, 0);
  if (den === 0) return fallback;
  const result = num / den;
  return Number.isNaN(result) || !Number.isFinite(result) ? fallback : result;
}

export function safeSum<T>(items: T[] | undefined | null, extractor: (item: T) => unknown): number {
  if (!Array.isArray(items)) return 0;
  return items.reduce((acc, item) => acc + safeNum(extractor(item), 0), 0);
}
