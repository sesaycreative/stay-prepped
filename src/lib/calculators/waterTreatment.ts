// Water treatment: boiling, household bleach, tablets, filters. Pure logic.
// Figures from docs/TOOL_SOURCES.md: DWI for boil-water notices, CDC and
// US EPA for the bleach dose (no UK household dose was found).

export type Clarity = 'clear' | 'cloudy';
export type BleachStrength = 'standard' | 'one' | 'other';
export type Method = 'boil' | 'bleach' | 'tablets' | 'filter';

export const WATER_TREATMENT = {
  /** CDC: rolling boil for 1 minute. DWI: boil "until it reaches a rolling ball". */
  boilMinutes: 1,
  /** CDC: 3 minutes above 6,500 feet. */
  boilMinutesHigh: 3,
  highAltitudeFeet: 6500,
  /** DWI: discard boiled water "if not used within 24 hours". */
  boiledStoreHours: 24,
  /** CDC: 5% to 9% sodium hypochlorite, 1 litre: 2 drops / 0.1 mL. EPA: 8.25%, 1 litre: 2 drops. */
  mlPerLitreStandard: 0.1,
  /** CDC: 1% sodium hypochlorite, 1 litre: 10 drops / 0.5 mL. */
  mlPerLitreOnePercent: 0.5,
  /** CDC and EPA: double for cloudy, coloured or very cold water. */
  cloudyMultiplier: 2,
  /** CDC: "at least 30 minutes". */
  waitMinutes: 30,
  /** EPA: no chlorine smell -> repeat the dose and wait another 15 minutes. */
  repeatWaitMinutes: 15,
  /** Stated assumption; reproduces CDC's pairs (2 drops = 0.1 mL, 10 drops = 0.5 mL). */
  mlPerDrop: 0.05,
  minLitres: 0.25,
  maxLitres: 1000,
} as const;

export const STRENGTH_LABEL: Record<BleachStrength, string> = {
  standard: '5% to 9% (includes 6% and 8.25%)',
  one: '1%',
  other: 'Something else, or I can’t tell',
};

export function feetToMetres(ft: number): number {
  return Math.round(ft * 0.3048);
}

export function validateLitres(value: unknown): string | null {
  const s = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : '';
  if (s === '') return 'Enter how many litres you want to treat.';
  if (!/^\d+(\.\d+)?$/.test(s)) return 'Enter a number of litres, like 5.';
  const n = Number(s);
  if (n < WATER_TREATMENT.minLitres) return `Enter at least ${WATER_TREATMENT.minLitres} litres.`;
  if (n > WATER_TREATMENT.maxLitres) return `Enter ${WATER_TREATMENT.maxLitres} litres or fewer. Treat large amounts in batches.`;
  return null;
}

export interface BleachDose {
  ok: true;
  ml: number;
  drops: number;
  /** Rounded for display. */
  mlLabel: string;
  waitMinutes: number;
  doubled: boolean;
}
export interface NoDose {
  ok: false;
  reason: string;
}

/** Bleach dose for the volume. Returns no dose for unknown strengths. */
export function bleachDose(litres: number, strength: BleachStrength, clarity: Clarity): BleachDose | NoDose {
  if (strength === 'other') {
    return { ok: false, reason: 'There is no published dose for this strength. Do not guess: boil the water, use purification tablets, or use bottled water.' };
  }
  const perLitre = strength === 'standard' ? WATER_TREATMENT.mlPerLitreStandard : WATER_TREATMENT.mlPerLitreOnePercent;
  const doubled = clarity === 'cloudy';
  const ml = litres * perLitre * (doubled ? WATER_TREATMENT.cloudyMultiplier : 1);
  const drops = Math.round(ml / WATER_TREATMENT.mlPerDrop);
  return { ok: true, ml, drops, mlLabel: formatMl(ml), waitMinutes: WATER_TREATMENT.waitMinutes, doubled };
}

export function formatMl(ml: number): string {
  if (ml < 1) return `${Math.round(ml * 100) / 100} ml`;
  if (ml < 10) return `${Math.round(ml * 10) / 10} ml`;
  return `${Math.round(ml)} ml`;
}

/** Remaining whole seconds on a timer that ends at endsAt. */
export function secondsLeft(endsAt: Date, now: Date): number {
  return Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / 1000));
}

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function treatmentCardText(litres: number, clarity: Clarity, method: Method, strength: BleachStrength): string {
  const lines = ['Water treatment card (Stay Prepped planning aid)', 'Follow your water company’s notice first.', ''];
  lines.push(`Water: ${litres} litres, ${clarity === 'cloudy' ? 'cloudy (settle and strain through a clean cloth first)' : 'clear'}`);
  if (method === 'boil') {
    lines.push(
      `Boil: bring to a rolling boil for ${WATER_TREATMENT.boilMinutes} minute (${WATER_TREATMENT.boilMinutesHigh} minutes above ${WATER_TREATMENT.highAltitudeFeet.toLocaleString('en-GB')} feet).`,
      'Let it cool naturally. Store covered, in the fridge, and use within 24 hours.',
    );
  } else if (method === 'bleach') {
    const d = bleachDose(litres, strength, clarity);
    if (d.ok) {
      lines.push(
        `Bleach (${STRENGTH_LABEL[strength]}, plain unscented only): ${d.drops} drops (${d.mlLabel})${d.doubled ? ', doubled for cloudy water' : ''}.`,
        `Stir and wait at least ${d.waitMinutes} minutes. It should smell slightly of chlorine; if not, repeat the dose and wait another ${WATER_TREATMENT.repeatWaitMinutes} minutes.`,
      );
    } else lines.push(`Bleach: ${d.reason}`);
  } else if (method === 'tablets') {
    lines.push('Tablets: follow the instructions on the packet exactly, including the dose and the waiting time.');
  } else {
    lines.push('Filter: most portable filters do not remove viruses. Do not rely on a filter alone during a boil water notice.');
  }
  lines.push(
    '',
    'Never mix bleach with ammonia or any other cleaner.',
    'Do not use scented, colour-safe bleach or bleach with added cleaners.',
    'Water with fuel or chemicals cannot be made safe by boiling or bleach. Use bottled water.',
    'Sources: Drinking Water Inspectorate; CDC; US EPA. Details at stayprepped.co.uk/tools/water-treatment-calculator/',
  );
  return lines.join('\n');
}
