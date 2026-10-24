// Emergency Water Storage Calculator — pure logic (brief §6, Tool 2).

import {
  MAX_PEOPLE_PER_FIELD,
  MAX_PETS_PER_FIELD,
  litresToUkGallons,
  litresToUsGallons,
  round,
  toCsv,
  validateCount,
  validateDays,
  type FieldErrors,
} from './shared';

export type Climate = 'temperate' | 'hot';

export interface WaterInputs {
  adults: number;
  children: number;
  days: number;
  climate: Climate;
  extraHygiene: boolean;
  /** Number of people (within the household) who are pregnant or breastfeeding. */
  pregnantOrNursing: number;
  dogsSmall: number;
  dogsMedium: number;
  dogsLarge: number;
  cats: number;
}

export const WATER_ASSUMPTIONS = {
  /** Planning basis per person per day, all uses. */
  basePerPerson: 4,
  /** Of the base, the part allocated to drinking. */
  drinkingPerPerson: 3,
  /** Of the base, the part allocated to cooking and basic hygiene. */
  cookingHygienePerPerson: 1,
  hotClimateExtra: 1,
  pregnantNursingExtra: 1,
  extraHygiene: 2,
  dogSmall: 0.5,
  dogMedium: 1,
  dogLarge: 1.5,
  cat: 0.25,
} as const;

export const CONTAINER_SIZES = [5, 10, 25] as const;

export interface WaterResult {
  people: number;
  pets: number;
  /** Litres per day. */
  daily: { drinking: number; cookingHygiene: number; pets: number; total: number };
  /** Litres for the whole period. */
  total: { drinking: number; cookingHygiene: number; pets: number; total: number };
  ukGallons: number;
  usGallons: number;
  containers: { size: number; count: number }[];
}

type WaterField =
  | 'adults'
  | 'children'
  | 'days'
  | 'pregnantOrNursing'
  | 'dogsSmall'
  | 'dogsMedium'
  | 'dogsLarge'
  | 'cats'
  | 'people';

export function validateWaterInputs(input: Partial<Record<keyof WaterInputs, unknown>>): FieldErrors<WaterField> {
  const e: FieldErrors<WaterField> = {};
  const set = (k: WaterField, v: string | null) => {
    if (v) e[k] = v;
  };
  set('adults', validateCount(input.adults, 'adults', MAX_PEOPLE_PER_FIELD));
  set('children', validateCount(input.children, 'children', MAX_PEOPLE_PER_FIELD));
  set('days', validateDays(input.days));
  set('pregnantOrNursing', validateCount(input.pregnantOrNursing, 'pregnant or breastfeeding people', MAX_PEOPLE_PER_FIELD));
  set('dogsSmall', validateCount(input.dogsSmall, 'small dogs', MAX_PETS_PER_FIELD));
  set('dogsMedium', validateCount(input.dogsMedium, 'medium dogs', MAX_PETS_PER_FIELD));
  set('dogsLarge', validateCount(input.dogsLarge, 'large dogs', MAX_PETS_PER_FIELD));
  set('cats', validateCount(input.cats, 'cats', MAX_PETS_PER_FIELD));

  if (!e.adults && !e.children) {
    const people = Number(input.adults) + Number(input.children);
    if (people === 0) e.people = 'Add at least one adult or child to see a plan.';
    else if (!e.pregnantOrNursing && Number(input.pregnantOrNursing) > people)
      e.pregnantOrNursing = `This can’t be more than the ${people} ${people === 1 ? 'person' : 'people'} in your household.`;
  }
  return e;
}

export function calculateWater(input: WaterInputs): WaterResult {
  const A = WATER_ASSUMPTIONS;
  const people = input.adults + input.children;
  const pets = input.dogsSmall + input.dogsMedium + input.dogsLarge + input.cats;

  const drinkingPerDay =
    people * A.drinkingPerPerson +
    (input.climate === 'hot' ? people * A.hotClimateExtra : 0) +
    input.pregnantOrNursing * A.pregnantNursingExtra;
  const cookingHygienePerDay = people * A.cookingHygienePerPerson + (input.extraHygiene ? people * A.extraHygiene : 0);
  const petsPerDay =
    input.dogsSmall * A.dogSmall + input.dogsMedium * A.dogMedium + input.dogsLarge * A.dogLarge + input.cats * A.cat;
  const totalPerDay = drinkingPerDay + cookingHygienePerDay + petsPerDay;

  const total = {
    drinking: drinkingPerDay * input.days,
    cookingHygiene: cookingHygienePerDay * input.days,
    pets: petsPerDay * input.days,
    total: totalPerDay * input.days,
  };

  return {
    people,
    pets,
    daily: { drinking: drinkingPerDay, cookingHygiene: cookingHygienePerDay, pets: petsPerDay, total: totalPerDay },
    total,
    ukGallons: litresToUkGallons(total.total),
    usGallons: litresToUsGallons(total.total),
    containers: CONTAINER_SIZES.map((size) => ({ size, count: Math.ceil(round(total.total, 6) / size) })),
  };
}

export function waterSummaryText(input: WaterInputs, r: WaterResult): string {
  const l = (n: number) => `${round(n, 1).toLocaleString('en-GB')} L`;
  return [
    'Stay Prepped: emergency water plan',
    `Household: ${input.adults} adult(s), ${input.children} child(ren); ${input.pregnantOrNursing} pregnant or breastfeeding`,
    `Pets: ${input.dogsSmall} small dog(s), ${input.dogsMedium} medium dog(s), ${input.dogsLarge} large dog(s), ${input.cats} cat(s)`,
    `Days: ${input.days} | Climate: ${input.climate} | Extra hygiene: ${input.extraHygiene ? 'yes' : 'no'}`,
    '',
    `Per day: ${l(r.daily.total)} (drinking ${l(r.daily.drinking)}, cooking and hygiene ${l(r.daily.cookingHygiene)}, pets ${l(r.daily.pets)})`,
    `Total: ${l(r.total.total)}`,
    `      = ${round(r.ukGallons, 1)} UK gallons`,
    `      = ${round(r.usGallons, 1)} US gallons`,
    '',
    'Containers (choose one size, or mix):',
    ...r.containers.map((c) => `[ ] ${c.count} x ${c.size} litre containers`),
    '',
    'Rotation: replace shop-bought bottled water by its printed date; replace home-filled water every 6 months.',
  ].join('\n') + '\n';
}

export function waterCsv(r: WaterResult): string {
  return toCsv([
    ['Use', 'Litres per day', 'Litres total'],
    ['Drinking', round(r.daily.drinking, 2), round(r.total.drinking, 2)],
    ['Cooking and hygiene', round(r.daily.cookingHygiene, 2), round(r.total.cookingHygiene, 2)],
    ['Pets', round(r.daily.pets, 2), round(r.total.pets, 2)],
    ['Total', round(r.daily.total, 2), round(r.total.total, 2)],
    ['Total (UK gallons)', '', round(r.ukGallons, 2)],
    ['Total (US gallons)', '', round(r.usGallons, 2)],
  ]);
}
