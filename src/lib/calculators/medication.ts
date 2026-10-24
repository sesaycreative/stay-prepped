// Medication supply planner. Pure logic. Planning only: it counts days of
// supply from what the user enters. It never suggests doses or stockpiling.
// Lead-time basis: NHS "request the prescription up to 5 working days before
// you need your medicine" (docs/TOOL_SOURCES.md).

export const MEDICATION = {
  /** NHS: up to 5 working days. 7 calendar days covers that plus a weekend. */
  defaultLeadDays: 7,
  nhsWorkingDays: 5,
  minLeadDays: 0,
  maxLeadDays: 60,
  /** Traffic light (planning convention from the brief, not an NHS figure). */
  greenFromDays: 14,
  amberFromDays: 7,
  maxRows: 10,
  maxPerDay: 50,
  maxPerPack: 1000,
  maxPacks: 100,
  maxLoose: 5000,
} as const;

export interface MedicineRow {
  id: string;
  name: string;
  /** Tablets, capsules or doses taken per day (may be a half, e.g. 0.5). */
  perDay: number;
  /** Units in one pack. */
  perPack: number;
  /** Whole packs on hand. */
  packs: number;
  /** Loose units outside full packs. */
  loose: number;
  /** ISO date (yyyy-mm-dd) the count was made. */
  countedOn: string;
  /** Optional next repeat or order date, ISO yyyy-mm-dd. */
  nextRepeat?: string;
}

export type Light = 'green' | 'amber' | 'red';

export interface MedicineResult {
  id: string;
  name: string;
  unitsOnHand: number;
  /** Whole days of supply left from today. */
  daysLeft: number;
  /** The last day with a full day's supply is the day before this. */
  runsOutOn: Date;
  orderBy: Date;
  orderNow: boolean;
  light: Light;
  /** Next repeat is after the run-out date. */
  repeatTooLate: boolean;
  nextRepeat?: Date;
}

export type RowErrors = Partial<Record<'name' | 'perDay' | 'perPack' | 'packs' | 'loose' | 'nextRepeat', string>>;

const DAY = 24 * 60 * 60 * 1000;

/** Midnight UTC of an ISO date, or of a Date's local calendar day. */
export function dayStart(d: Date | string): Date {
  if (typeof d === 'string') {
    const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return new Date(NaN);
    return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  }
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

export function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY);
}

const num = (v: unknown): number | null => {
  const s = typeof v === 'number' ? String(v) : typeof v === 'string' ? v.trim() : '';
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
};

export function validateRow(row: { name?: unknown; perDay?: unknown; perPack?: unknown; packs?: unknown; loose?: unknown; nextRepeat?: unknown }): RowErrors {
  const e: RowErrors = {};
  if (typeof row.name !== 'string' || !row.name.trim()) e.name = 'Enter a name so you can tell the rows apart.';
  else if (row.name.trim().length > 60) e.name = 'Keep the name to 60 characters or fewer.';
  const perDay = num(row.perDay);
  if (perDay === null) e.perDay = 'Enter how many you take a day, like 1 or 0.5.';
  else if (perDay <= 0) e.perDay = 'Enter more than 0 a day. For medicines taken less often, check with your pharmacist.';
  else if (perDay > MEDICATION.maxPerDay) e.perDay = `Enter ${MEDICATION.maxPerDay} or fewer a day.`;
  else if (Math.round(perDay * 4) !== perDay * 4) e.perDay = 'Use whole numbers, halves or quarters, like 1, 1.5 or 0.25.';
  const perPack = num(row.perPack);
  if (perPack === null || !Number.isInteger(perPack) || perPack < 1) e.perPack = 'Enter how many are in one pack, like 28.';
  else if (perPack > MEDICATION.maxPerPack) e.perPack = `Enter ${MEDICATION.maxPerPack} or fewer.`;
  const packs = num(row.packs);
  if (packs === null || !Number.isInteger(packs)) e.packs = 'Enter the number of full packs, like 2. Put any extras in "loose".';
  else if (packs > MEDICATION.maxPacks) e.packs = `Enter ${MEDICATION.maxPacks} or fewer packs.`;
  if (row.loose !== undefined && row.loose !== '') {
    const loose = num(row.loose);
    if (loose === null || Math.round(loose * 4) !== loose * 4) e.loose = 'Enter a number, like 5 or 2.5.';
    else if (loose > MEDICATION.maxLoose) e.loose = `Enter ${MEDICATION.maxLoose} or fewer.`;
  }
  if (row.nextRepeat !== undefined && row.nextRepeat !== '' && Number.isNaN(dayStart(String(row.nextRepeat)).getTime())) e.nextRepeat = 'Enter a valid date, or leave it blank.';
  return e;
}

export function validateLeadDays(v: unknown): string | null {
  const n = num(v);
  if (n === null || !Number.isInteger(n)) return 'Enter a whole number of days, like 7.';
  if (n < MEDICATION.minLeadDays || n > MEDICATION.maxLeadDays) return `Enter between ${MEDICATION.minLeadDays} and ${MEDICATION.maxLeadDays} days.`;
  return null;
}

export function lightFor(daysLeft: number): Light {
  if (daysLeft >= MEDICATION.greenFromDays) return 'green';
  if (daysLeft >= MEDICATION.amberFromDays) return 'amber';
  return 'red';
}

/**
 * Supply for one medicine as of `today`. Units are counted on `countedOn`;
 * each day since then uses `perDay`.
 */
export function supplyFor(row: MedicineRow, today: Date, leadDays: number = MEDICATION.defaultLeadDays): MedicineResult {
  const start = dayStart(today);
  const counted = dayStart(row.countedOn);
  const countedValid = !Number.isNaN(counted.getTime()) && counted.getTime() <= start.getTime() ? counted : start;
  const daysSinceCount = Math.round((start.getTime() - countedValid.getTime()) / DAY);
  const counted_units = row.packs * row.perPack + (row.loose || 0);
  const unitsOnHand = Math.max(0, counted_units - daysSinceCount * row.perDay);
  const daysLeft = Math.floor(unitsOnHand / row.perDay + 1e-9);
  const runsOutOn = addDays(start, daysLeft);
  const orderBy = addDays(runsOutOn, -leadDays);
  const nextRepeat = row.nextRepeat ? dayStart(row.nextRepeat) : undefined;
  const validRepeat = nextRepeat && !Number.isNaN(nextRepeat.getTime()) ? nextRepeat : undefined;
  return {
    id: row.id,
    name: row.name.trim(),
    unitsOnHand,
    daysLeft,
    runsOutOn,
    orderBy,
    orderNow: orderBy.getTime() <= start.getTime(),
    light: lightFor(daysLeft),
    repeatTooLate: !!validRepeat && validRepeat.getTime() > runsOutOn.getTime(),
    nextRepeat: validRepeat,
  };
}

export function planSupply(rows: MedicineRow[], today: Date, leadDays: number = MEDICATION.defaultLeadDays) {
  const results = rows.map((r) => supplyFor(r, today, leadDays));
  const soonest = [...results].sort((a, b) => a.daysLeft - b.daysLeft)[0] ?? null;
  return { results, soonest, anyRed: results.some((r) => r.light === 'red') };
}

/** First aid area counts as ready: at least one medicine, none red. */
export function medicationReady(rows: MedicineRow[], today: Date): boolean {
  if (!rows.length) return false;
  return !planSupply(rows, today).anyRed;
}

export function medicationListText(results: MedicineResult[], fmt: (d: Date) => string, leadDays: number): string {
  const lines = ['My medicines (Stay Prepped planning aid; not medical advice)', `Order lead time: ${leadDays} days`, ''];
  for (const r of results) {
    lines.push(`${r.name}: ${r.daysLeft} ${r.daysLeft === 1 ? 'day' : 'days'} left. Runs out ${fmt(r.runsOutOn)}. Order by ${fmt(r.orderBy)}${r.orderNow ? ' (order now)' : ''}.`);
  }
  lines.push(
    '',
    'Request repeat prescriptions up to 5 working days before you need them (NHS).',
    'Run out? Use NHS 111 online (111.nhs.uk/emergency-prescription) or ask a pharmacy. In an emergency call 999.',
  );
  return lines.join('\n');
}
