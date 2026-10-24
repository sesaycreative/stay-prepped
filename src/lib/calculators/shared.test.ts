import { describe, expect, it } from 'vitest';
import { litresToUkGallons, litresToUsGallons, round, toCsv, validateCount, validateDays } from './shared';

describe('unit conversions', () => {
  it('converts litres to UK and US gallons', () => {
    expect(litresToUkGallons(4.54609)).toBeCloseTo(1, 10);
    expect(litresToUsGallons(3.785411784)).toBeCloseTo(1, 10);
    expect(litresToUkGallons(0)).toBe(0);
  });
});

describe('round', () => {
  it('rounds and avoids negative zero', () => {
    expect(round(1.005, 2)).toBe(1.01);
    expect(Object.is(round(-0.0001, 1), 0)).toBe(true);
  });
});

describe('validateCount', () => {
  it('accepts zero and whole numbers within range', () => {
    expect(validateCount(0, 'adults', 50)).toBeNull();
    expect(validateCount('3', 'adults', 50)).toBeNull();
    expect(validateCount(50, 'adults', 50)).toBeNull();
  });
  it('rejects blank, negative, fractional, non-numeric and too-large values', () => {
    expect(validateCount('', 'adults', 50)).toMatch(/Enter the number/);
    expect(validateCount(-1, 'adults', 50)).toMatch(/negative/);
    expect(validateCount(1.5, 'adults', 50)).toMatch(/whole number/);
    expect(validateCount('abc', 'adults', 50)).toMatch(/must be a number/);
    expect(validateCount(Infinity, 'adults', 50)).toMatch(/must be a number/);
    expect(validateCount(51, 'adults', 50)).toMatch(/50 or fewer/);
  });
});

describe('validateDays', () => {
  it('accepts 1 to 365', () => {
    expect(validateDays(1)).toBeNull();
    expect(validateDays(365)).toBeNull();
  });
  it('rejects out-of-range and invalid values', () => {
    expect(validateDays(0)).toMatch(/between 1 and 365/);
    expect(validateDays(366)).toMatch(/between 1 and 365/);
    expect(validateDays(2.5)).toMatch(/whole number/);
    expect(validateDays('')).toMatch(/Enter the number of days/);
    expect(validateDays(NaN)).toMatch(/must be a number/);
  });
});

describe('toCsv', () => {
  it('escapes commas and quotes', () => {
    expect(toCsv([['a,b', 'say "hi"', 3]])).toBe('"a,b","say ""hi""",3\n');
  });
});
