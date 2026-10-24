// Emergency Food Storage Calculator — pure logic (brief §6, Tool 1).
// All figures are planning estimates and are shown on the tool page.

import {
  MAX_PEOPLE_PER_FIELD,
  PRESET_DAYS,
  round,
  toCsv,
  validateCount,
  validateDays,
  type FieldErrors,
} from './shared';

export type Diet = 'any' | 'vegetarian' | 'vegan';
export type Activity = 'normal' | 'high';

export interface FoodInputs {
  adults: number;
  children: number;
  days: number;
  diet: Diet;
  activity: Activity;
  /** Free-text note; recorded on the checklist but never used in the maths. */
  restrictions?: string;
}

export const FOOD_ASSUMPTIONS = {
  adultKcal: 2000,
  childKcal: 1500,
  highActivityMultiplier: 1.25,
} as const;

export type FoodGroupId = 'grains' | 'protein' | 'fruitVeg' | 'fatsDairy' | 'comfort';

/** Share of total calories per food group. Sums to 1. */
export const FOOD_GROUP_SPLIT: Record<FoodGroupId, number> = {
  grains: 0.4,
  protein: 0.2,
  fruitVeg: 0.15,
  fatsDairy: 0.15,
  comfort: 0.1,
};

/** Energy densities used to turn calories into weight/volume. kcal per 100 g (or 100 ml). */
export const DENSITIES = {
  dryGrains: 350, // dry rice, pasta, oats
  tinnedBeans: 100,
  tinnedFishMeat: 180,
  nutButter: 590,
  oil: 900,
  uhtMilk: 60, // per 100 ml
  fruitVeg: 70, // tinned or dried, blended average
} as const;

export interface FoodLine {
  /** Display name of the item. */
  item: string;
  /** Calories assigned to this line. */
  kcal: number;
  /** Quantity in kilograms (unit 'kg') or litres (unit 'L'). */
  amount: number;
  unit: 'kg' | 'L';
  /** Energy density used, kcal per 100 g / 100 ml. */
  density: number;
}

export interface FoodGroupResult {
  id: FoodGroupId;
  label: string;
  share: number;
  kcal: number;
  lines: FoodLine[];
  examples: string[];
  storageTip: string;
}

export interface FoodResult {
  people: number;
  kcalPerDay: number;
  totalKcal: number;
  groups: FoodGroupResult[];
  totalKg: number;
  totalLitres: number;
}

export function validateFoodInputs(input: Partial<Record<keyof FoodInputs, unknown>>): FieldErrors<'adults' | 'children' | 'days' | 'people'> {
  const errors: FieldErrors<'adults' | 'children' | 'days' | 'people'> = {};
  const a = validateCount(input.adults, 'adults', MAX_PEOPLE_PER_FIELD);
  if (a) errors.adults = a;
  const c = validateCount(input.children, 'children', MAX_PEOPLE_PER_FIELD);
  if (c) errors.children = c;
  const d = validateDays(input.days);
  if (d) errors.days = d;
  if (!a && !c && Number(input.adults) + Number(input.children) === 0) {
    errors.people = 'Add at least one adult or child to see a plan.';
  }
  return errors;
}

export function dailyKcal(input: Pick<FoodInputs, 'adults' | 'children' | 'activity'>): number {
  const mult = input.activity === 'high' ? FOOD_ASSUMPTIONS.highActivityMultiplier : 1;
  return input.adults * FOOD_ASSUMPTIONS.adultKcal * mult + input.children * FOOD_ASSUMPTIONS.childKcal * mult;
}

function line(item: string, kcal: number, density: number, unit: 'kg' | 'L'): FoodLine {
  // kcal / (kcal per 100) = number of 100 g units; /10 = kg (or litres for ml).
  return { item, kcal, amount: kcal / density / 10, unit, density };
}

const LABELS: Record<FoodGroupId, string> = {
  grains: 'Grains & starches',
  protein: 'Protein',
  fruitVeg: 'Fruit & vegetables',
  fatsDairy: 'Fats & dairy',
  comfort: 'Comfort & other',
};

const STORAGE_TIPS: Record<FoodGroupId, string> = {
  grains: 'Keep dry goods in sealed, airtight containers off the floor, away from damp and pests.',
  protein: 'Check tins for dents, rust or swelling before use. Store at room temperature or below.',
  fruitVeg: 'Tinned fruit in juice and dried fruit both store well. Rotate by the best-before date.',
  fatsDairy: 'Oil and nut butter keep best somewhere cool and dark. Once opened, follow the label.',
  comfort: 'Familiar treats help morale, especially for children. Choose things your household already eats.',
};

function groupExamples(id: FoodGroupId, diet: Diet): string[] {
  switch (id) {
    case 'grains':
      return ['dry rice', 'dry pasta', 'porridge oats', 'crackers or crispbreads'];
    case 'protein':
      return diet === 'any'
        ? ['tinned fish', 'tinned meat', 'tinned beans or lentils']
        : ['tinned beans and chickpeas', 'tinned or dried lentils', 'peanut or other nut butter'];
    case 'fruitVeg':
      return ['tinned vegetables', 'tinned fruit in juice', 'dried fruit', 'tinned tomatoes'];
    case 'fatsDairy':
      return diet === 'vegan'
        ? ['vegetable or olive oil', 'nut or seed butter']
        : ['vegetable or olive oil', 'UHT milk', 'nut butter'];
    case 'comfort':
      return ['biscuits', 'chocolate', 'tea, coffee and hot chocolate', 'stock cubes and spices'];
  }
}

function groupLines(id: FoodGroupId, kcal: number, diet: Diet): FoodLine[] {
  switch (id) {
    case 'grains':
      return [line('Dry rice, pasta or oats', kcal, DENSITIES.dryGrains, 'kg')];
    case 'protein':
      return diet === 'any'
        ? [line('Tinned fish or meat', kcal, DENSITIES.tinnedFishMeat, 'kg')]
        : [
            line('Tinned beans or lentils', kcal / 2, DENSITIES.tinnedBeans, 'kg'),
            line('Nut butter', kcal / 2, DENSITIES.nutButter, 'kg'),
          ];
    case 'fruitVeg':
      return [line('Tinned or dried fruit & vegetables', kcal, DENSITIES.fruitVeg, 'kg')];
    case 'fatsDairy':
      return diet === 'vegan'
        ? [line('Cooking oil', kcal / 2, DENSITIES.oil, 'L'), line('Nut or seed butter', kcal / 2, DENSITIES.nutButter, 'kg')]
        : [line('Cooking oil', kcal / 2, DENSITIES.oil, 'L'), line('UHT milk', kcal / 2, DENSITIES.uhtMilk, 'L')];
    case 'comfort':
      // No density is specified for this group; we use the dry-goods figure
      // as a stated planning assumption.
      return [line('Comfort foods and drinks', kcal, DENSITIES.dryGrains, 'kg')];
  }
}

export function calculateFood(input: FoodInputs): FoodResult {
  const people = input.adults + input.children;
  const kcalPerDay = dailyKcal(input);
  const totalKcal = kcalPerDay * input.days;

  const groups: FoodGroupResult[] = (Object.keys(FOOD_GROUP_SPLIT) as FoodGroupId[]).map((id) => {
    const kcal = totalKcal * FOOD_GROUP_SPLIT[id];
    return {
      id,
      label: LABELS[id],
      share: FOOD_GROUP_SPLIT[id],
      kcal,
      lines: groupLines(id, kcal, input.diet),
      examples: groupExamples(id, input.diet),
      storageTip: STORAGE_TIPS[id],
    };
  });

  let totalKg = 0;
  let totalLitres = 0;
  for (const g of groups)
    for (const l of g.lines) {
      if (l.unit === 'kg') totalKg += l.amount;
      else totalLitres += l.amount;
    }

  return { people, kcalPerDay, totalKcal, groups, totalKg, totalLitres };
}

export interface FoodComparisonRow {
  days: number;
  totalKcal: number;
  totalKg: number;
  totalLitres: number;
}

/** Same household across the preset durations (3/7/14/30/90 days). */
export function foodComparison(input: Omit<FoodInputs, 'days'>): FoodComparisonRow[] {
  return PRESET_DAYS.map((days) => {
    const r = calculateFood({ ...input, days });
    return { days, totalKcal: r.totalKcal, totalKg: r.totalKg, totalLitres: r.totalLitres };
  });
}

export function formatAmount(amount: number, unit: 'kg' | 'L'): string {
  const dp = amount < 10 ? 1 : 0;
  return `${round(amount, dp).toLocaleString('en-GB')} ${unit === 'kg' ? 'kg' : 'litres'}`;
}

export function foodChecklistText(input: FoodInputs, result: FoodResult): string {
  const lines: string[] = [];
  lines.push('Stay Prepped: emergency food shopping checklist');
  lines.push(`Household: ${input.adults} adult(s), ${input.children} child(ren) under 12`);
  lines.push(`Days: ${input.days} | Diet: ${input.diet} | Activity: ${input.activity}`);
  if (input.restrictions?.trim()) lines.push(`Notes: ${input.restrictions.trim()}`);
  lines.push(`Total: ${Math.round(result.totalKcal).toLocaleString('en-GB')} kcal`);
  lines.push('');
  for (const g of result.groups) {
    lines.push(`${g.label} (${Math.round(g.share * 100)}% of calories)`);
    for (const l of g.lines) lines.push(`[ ] ${l.item}: about ${formatAmount(l.amount, l.unit)}`);
    lines.push(`    Ideas: ${g.examples.join(', ')}`);
    lines.push('');
  }
  lines.push('Planning estimate only. Nutritional needs vary; infants, pregnancy and medical diets need professional advice.');
  return lines.join('\n') + '\n';
}

export function foodChecklistCsv(result: FoodResult): string {
  const rows: (string | number)[][] = [['Group', 'Item', 'Calories (kcal)', 'Amount', 'Unit']];
  for (const g of result.groups)
    for (const l of g.lines) rows.push([g.label, l.item, Math.round(l.kcal), round(l.amount, 2), l.unit === 'kg' ? 'kg' : 'litres']);
  return toCsv(rows);
}
