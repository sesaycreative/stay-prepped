// Turns the saved household into the one-liners on the homepage boxes, using
// the calculators' own pure functions (nothing here re-implements their maths).
import { calculateWater } from './calculators/water';
import { calculateFood } from './calculators/food';
import type { Household } from './progress';

export const DAYS = 3;

export interface HouseholdFigures {
  people: number;
  waterLitres: number;
  foodKcal: number;
  foodKg: number;
  bags: { adults: number; children: number };
  pets: number;
}

export function householdFigures(h: Pick<Household, 'adults' | 'children' | 'pets'>): HouseholdFigures {
  // Dogs are planned as medium dogs; the water calculator notes these are rough averages.
  const water = calculateWater({
    adults: h.adults,
    children: h.children,
    days: DAYS,
    climate: 'temperate',
    extraHygiene: false,
    pregnantOrNursing: 0,
    dogsSmall: 0,
    dogsMedium: h.pets.dogs,
    dogsLarge: 0,
    cats: h.pets.cats,
  });
  const food = calculateFood({ adults: h.adults, children: h.children, days: DAYS, diet: 'any', activity: 'normal' });
  return {
    people: h.adults + h.children,
    waterLitres: Math.round(water.total.total),
    foodKcal: Math.round(food.totalKcal),
    foodKg: Math.round(food.totalKg * 10) / 10,
    bags: { adults: h.adults, children: h.children },
    pets: h.pets.dogs + h.pets.cats,
  };
}

/** Query string for the calculators. Counts only; nothing personal. */
export function calculatorQuery(h: Pick<Household, 'adults' | 'children'>): string {
  return `?adults=${h.adults}&children=${h.children}&days=${DAYS}`;
}

/** Read household counts from a calculator URL. Returns only valid, in-range values. */
export function readCalculatorQuery(search: string): { adults?: number; children?: number; days?: number } {
  const p = new URLSearchParams(search);
  const n = (k: string, min: number, max: number) => {
    const raw = p.get(k);
    if (raw === null || !/^\d{1,3}$/.test(raw)) return undefined;
    const v = Number(raw);
    return v >= min && v <= max ? v : undefined;
  };
  return { adults: n('adults', 0, 50), children: n('children', 0, 50), days: n('days', 1, 365) };
}
