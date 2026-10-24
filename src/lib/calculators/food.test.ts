import { describe, expect, it } from 'vitest';
import {
  FOOD_GROUP_SPLIT,
  calculateFood,
  dailyKcal,
  foodChecklistCsv,
  foodChecklistText,
  foodComparison,
  validateFoodInputs,
  type FoodInputs,
} from './food';

const base: FoodInputs = { adults: 2, children: 0, days: 3, diet: 'any', activity: 'normal' };

describe('food: daily calories', () => {
  it('uses 2,000 kcal per adult and 1,500 per child', () => {
    expect(dailyKcal({ adults: 1, children: 0, activity: 'normal' })).toBe(2000);
    expect(dailyKcal({ adults: 0, children: 1, activity: 'normal' })).toBe(1500);
    expect(dailyKcal({ adults: 2, children: 2, activity: 'normal' })).toBe(7000);
  });
  it('applies the ×1.25 high-activity multiplier', () => {
    expect(dailyKcal({ adults: 1, children: 0, activity: 'high' })).toBe(2500);
  });
});

describe('food: totals and split', () => {
  it('multiplies daily calories by days', () => {
    const r = calculateFood(base);
    expect(r.kcalPerDay).toBe(4000);
    expect(r.totalKcal).toBe(12000);
    expect(r.people).toBe(2);
  });

  it('splits calories 40/20/15/15/10 and the split sums to 1', () => {
    const sum = Object.values(FOOD_GROUP_SPLIT).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);
    const r = calculateFood(base);
    const byId = Object.fromEntries(r.groups.map((g) => [g.id, g.kcal]));
    expect(byId.grains).toBeCloseTo(4800);
    expect(byId.protein).toBeCloseTo(2400);
    expect(byId.fruitVeg).toBeCloseTo(1800);
    expect(byId.fatsDairy).toBeCloseTo(1800);
    expect(byId.comfort).toBeCloseTo(1200);
    const lineKcal = r.groups.flatMap((g) => g.lines).reduce((s, l) => s + l.kcal, 0);
    expect(lineKcal).toBeCloseTo(r.totalKcal);
  });

  it('converts calories to weight using the stated densities', () => {
    const r = calculateFood(base);
    const grains = r.groups.find((g) => g.id === 'grains')!.lines[0];
    // 4,800 kcal ÷ 350 kcal/100 g = 13.714 × 100 g = 1.3714 kg
    expect(grains.amount).toBeCloseTo(1.3714, 3);
    expect(grains.unit).toBe('kg');
    const protein = r.groups.find((g) => g.id === 'protein')!.lines[0];
    expect(protein.amount).toBeCloseTo(2400 / 180 / 10, 6);
    const fats = r.groups.find((g) => g.id === 'fatsDairy')!.lines;
    expect(fats.find((l) => l.item === 'Cooking oil')!.amount).toBeCloseTo(900 / 900 / 10, 6);
    expect(fats.find((l) => l.item === 'UHT milk')!.amount).toBeCloseTo(900 / 60 / 10, 6);
    expect(fats.find((l) => l.item === 'UHT milk')!.unit).toBe('L');
  });

  it('swaps protein to beans/lentils and nut butter for vegetarian and vegan diets', () => {
    for (const diet of ['vegetarian', 'vegan'] as const) {
      const r = calculateFood({ ...base, diet });
      const items = r.groups.find((g) => g.id === 'protein')!.lines.map((l) => l.item);
      expect(items).toEqual(['Tinned beans or lentils', 'Nut butter']);
      expect(r.groups.find((g) => g.id === 'protein')!.examples.join(' ')).not.toMatch(/fish|meat/i);
    }
  });

  it('removes milk for vegan diets', () => {
    const r = calculateFood({ ...base, diet: 'vegan' });
    const items = r.groups.find((g) => g.id === 'fatsDairy')!.lines.map((l) => l.item);
    expect(items).not.toContain('UHT milk');
  });
});

describe('food: edge cases', () => {
  it('returns zeros for zero people without throwing', () => {
    const r = calculateFood({ ...base, adults: 0, children: 0 });
    expect(r.totalKcal).toBe(0);
    expect(r.totalKg).toBe(0);
    expect(r.groups.every((g) => g.lines.every((l) => l.amount === 0))).toBe(true);
  });

  it('handles the maximum of 365 days', () => {
    const r = calculateFood({ ...base, adults: 1, days: 365 });
    expect(r.totalKcal).toBe(730000);
    expect(Number.isFinite(r.totalKg)).toBe(true);
  });

  it('validation flags zero people, invalid days and bad counts', () => {
    expect(validateFoodInputs({ adults: 0, children: 0, days: 3 }).people).toBeDefined();
    expect(validateFoodInputs({ adults: 1, children: 0, days: 0 }).days).toBeDefined();
    expect(validateFoodInputs({ adults: 1, children: 0, days: 366 }).days).toBeDefined();
    expect(validateFoodInputs({ adults: -1, children: 0, days: 3 }).adults).toBeDefined();
    expect(validateFoodInputs({ adults: 'x', children: 0, days: 3 }).adults).toBeDefined();
    expect(validateFoodInputs({ adults: 1, children: 2.5, days: 3 }).children).toBeDefined();
    expect(validateFoodInputs({ adults: 1, children: 0, days: 365 })).toEqual({});
  });
});

describe('food: comparison and exports', () => {
  it('compares 3/7/14/30/90 days', () => {
    const rows = foodComparison({ adults: 1, children: 0, diet: 'any', activity: 'normal' });
    expect(rows.map((r) => r.days)).toEqual([3, 7, 14, 30, 90]);
    expect(rows[4].totalKcal).toBe(180000);
  });

  it('builds a checklist text that includes the restriction note but not in the maths', () => {
    const input = { ...base, restrictions: 'No nuts' };
    const r = calculateFood(input);
    expect(r.totalKcal).toBe(calculateFood(base).totalKcal);
    const txt = foodChecklistText(input, r);
    expect(txt).toContain('Notes: No nuts');
    expect(txt).toContain('[ ] Dry rice, pasta or oats');
  });

  it('produces a CSV with a header row', () => {
    const csv = foodChecklistCsv(calculateFood(base));
    expect(csv.split('\n')[0]).toBe('Group,Item,Calories (kcal),Amount,Unit');
  });
});
