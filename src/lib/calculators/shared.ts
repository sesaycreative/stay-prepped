// Shared constants and helpers for the calculators. Pure functions only:
// no DOM, no storage, so everything here is unit-testable.

/** 1 UK (imperial) gallon in litres. */
export const LITRES_PER_UK_GALLON = 4.54609;
/** 1 US liquid gallon in litres. */
export const LITRES_PER_US_GALLON = 3.785411784;

export const PRESET_DAYS = [3, 7, 14, 30, 90] as const;
export const MIN_DAYS = 1;
export const MAX_DAYS = 365;
/** Upper bound per person-type input; stops typos like 2000 adults. */
export const MAX_PEOPLE_PER_FIELD = 50;
export const MAX_PETS_PER_FIELD = 20;

export type FieldErrors<K extends string = string> = Partial<Record<K, string>>;

export function litresToUkGallons(litres: number): number {
  return litres / LITRES_PER_UK_GALLON;
}

export function litresToUsGallons(litres: number): number {
  return litres / LITRES_PER_US_GALLON;
}

/** Round to a fixed number of decimal places, avoiding -0. */
export function round(value: number, dp = 0): number {
  const f = 10 ** dp;
  const r = Math.round((value + Number.EPSILON) * f) / f;
  return Object.is(r, -0) ? 0 : r;
}

/**
 * Validate a whole-number count input. Accepts numbers or numeric strings
 * (form inputs) and returns a specific, human-readable error or null.
 */
export function validateCount(value: unknown, label: string, max: number): string | null {
  if (value === '' || value === null || value === undefined) return `Enter the number of ${label} (use 0 if none).`;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return `The number of ${label} must be a number.`;
  if (n < 0) return `The number of ${label} cannot be negative.`;
  if (!Number.isInteger(n)) return `The number of ${label} must be a whole number.`;
  if (n > max) return `Enter ${max} or fewer ${label}. For larger groups, run the calculator in batches.`;
  return null;
}

export function validateDays(value: unknown): string | null {
  if (value === '' || value === null || value === undefined) return 'Enter the number of days to plan for.';
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 'Days must be a number.';
  if (!Number.isInteger(n)) return 'Days must be a whole number.';
  if (n < MIN_DAYS || n > MAX_DAYS) return `Days must be between ${MIN_DAYS} and ${MAX_DAYS}.`;
  return null;
}

/** Escape a value for a CSV cell. */
export function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map(csvCell).join(',')).join('\n') + '\n';
}
