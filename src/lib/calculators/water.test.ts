import { describe, expect, it } from 'vitest';
import { calculateWater, validateWaterInputs, waterCsv, waterSummaryText, type WaterInputs } from './water';

const base: WaterInputs = {
  adults: 1,
  children: 0,
  days: 1,
  climate: 'temperate',
  extraHygiene: false,
  pregnantOrNursing: 0,
  dogsSmall: 0,
  dogsMedium: 0,
  dogsLarge: 0,
  cats: 0,
};

describe('water: base allowance', () => {
  it('plans 4 L per person per day (3 drinking + 1 cooking/hygiene)', () => {
    const r = calculateWater(base);
    expect(r.daily.total).toBe(4);
    expect(r.daily.drinking).toBe(3);
    expect(r.daily.cookingHygiene).toBe(1);
  });

  it('treats children the same as adults', () => {
    expect(calculateWater({ ...base, adults: 0, children: 1 }).daily.total).toBe(4);
  });

  it('multiplies by days', () => {
    const r = calculateWater({ ...base, adults: 2, children: 2, days: 3 });
    expect(r.total.total).toBe(48);
  });
});

describe('water: adjustments', () => {
  it('adds 1 L/person/day for hot climate', () => {
    expect(calculateWater({ ...base, adults: 2, climate: 'hot' }).daily.total).toBe(10);
  });
  it('adds 1 L/day per pregnant or nursing person', () => {
    expect(calculateWater({ ...base, adults: 2, pregnantOrNursing: 1 }).daily.total).toBe(9);
  });
  it('adds 2 L/person/day for extra hygiene', () => {
    const r = calculateWater({ ...base, adults: 2, extraHygiene: true });
    expect(r.daily.total).toBe(12);
    expect(r.daily.cookingHygiene).toBe(6);
  });
  it('adds pet water: small 0.5, medium 1, large 1.5, cat 0.25', () => {
    const r = calculateWater({ ...base, dogsSmall: 1, dogsMedium: 1, dogsLarge: 1, cats: 2 });
    expect(r.daily.pets).toBe(3.5);
    expect(r.daily.total).toBe(7.5);
  });
});

describe('water: conversions and containers', () => {
  it('converts to UK and US gallons', () => {
    const r = calculateWater({ ...base, adults: 2, children: 2, days: 3 }); // 48 L
    expect(r.ukGallons).toBeCloseTo(10.56, 2);
    expect(r.usGallons).toBeCloseTo(12.68, 2);
  });
  it('rounds container counts up', () => {
    const r = calculateWater({ ...base, adults: 2, children: 2, days: 3 }); // 48 L
    expect(r.containers).toEqual([
      { size: 5, count: 10 },
      { size: 10, count: 5 },
      { size: 25, count: 2 },
    ]);
  });
  it('does not round 25 L up to 2 containers due to float error', () => {
    const r = calculateWater({ ...base, adults: 0, children: 0, dogsMedium: 1, days: 25 });
    expect(r.containers.find((c) => c.size === 25)!.count).toBe(1);
  });
});

describe('water: edge cases', () => {
  it('returns zero for zero people and no pets', () => {
    const r = calculateWater({ ...base, adults: 0 });
    expect(r.total.total).toBe(0);
    expect(r.containers.every((c) => c.count === 0)).toBe(true);
  });
  it('handles 365 days', () => {
    expect(calculateWater({ ...base, days: 365 }).total.total).toBe(1460);
  });
  it('validates inputs', () => {
    const ok = { ...base };
    expect(validateWaterInputs(ok)).toEqual({});
    expect(validateWaterInputs({ ...ok, adults: 0 }).people).toBeDefined();
    expect(validateWaterInputs({ ...ok, days: 0 }).days).toBeDefined();
    expect(validateWaterInputs({ ...ok, days: 400 }).days).toBeDefined();
    expect(validateWaterInputs({ ...ok, pregnantOrNursing: 2 }).pregnantOrNursing).toMatch(/more than/);
    expect(validateWaterInputs({ ...ok, cats: -1 }).cats).toBeDefined();
    expect(validateWaterInputs({ ...ok, dogsLarge: 1.5 }).dogsLarge).toBeDefined();
    expect(validateWaterInputs({ ...ok, adults: '' }).adults).toBeDefined();
  });
});

describe('water: exports', () => {
  it('labels UK and US gallons separately in text and CSV', () => {
    const r = calculateWater({ ...base, days: 3 });
    const txt = waterSummaryText({ ...base, days: 3 }, r);
    expect(txt).toContain('UK gallons');
    expect(txt).toContain('US gallons');
    expect(waterCsv(r)).toContain('Total (UK gallons)');
  });
});
