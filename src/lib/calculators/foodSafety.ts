// Power cut: is my food still safe? Pure logic.
// Every figure is from docs/TOOL_SOURCES.md (FSA first, CDC where the FSA is
// silent). This is a planning aid: it never says food is safe, only whether
// the official time window has passed.

export const HOUR = 60 * 60 * 1000;

export const FOOD_SAFETY = {
  /** FSA: "Your fridge should stay cold for up to 4 hours." */
  fridgeHours: 4,
  /** FSA: "up to 48 hours in a full freezer" */
  freezerFullHours: 48,
  /** FSA: "(or 24 hours if it's half full)" */
  freezerHalfHours: 24,
  /** FSA: "Chilled foods first need to be kept below 8°C to keep them safe." */
  chilledMaxC: 8,
  /** FSA: fridges "between 0 and 5°C" normally. */
  fridgeNormalMaxC: 5,
  /** CDC (no UK equivalent found): refreeze if ice crystals remain or at 40 °F or below. */
  refreezeMaxF: 40,
  /** Allow small clock differences when checking "in the future". */
  futureToleranceMs: 2 * 60 * 1000,
  /** Amber when less than this is left. */
  warnWithinMs: 60 * 60 * 1000,
} as const;

export type DoorUse = 'shut' | 'few' | 'lots';
export type FreezerFill = 'full' | 'half' | 'none';

export interface OutageInputs {
  /** When the power went off. */
  offAt: Date;
  /** When it came back, if it has. */
  restoredAt?: Date | null;
  fridgeDoor: DoorUse;
  hasFridge: boolean;
  freezerFill: FreezerFill;
  freezerDoor: DoorUse;
}

export type Light = 'green' | 'amber' | 'red';

export interface ApplianceStatus {
  /** The official window in ms. */
  windowMs: number;
  /** Time without power so far (or in total if restored). */
  elapsedMs: number;
  /** Time left in the window; 0 once passed or when power is back. */
  remainingMs: number;
  /** When the window ends (or ended). */
  endsAt: Date;
  /** The window has passed while the power was off. */
  passed: boolean;
  /** Power came back inside the window. */
  restoredInWindow: boolean;
  /** Doors were opened: the window may be shorter than the estimate. */
  doorWarning: boolean;
  light: Light;
}

export interface OutageResult {
  now: Date;
  powerBack: boolean;
  elapsedMs: number;
  /** FSA: under 4 hours is "unlikely to impact the safety of food". */
  shortOutage: boolean;
  fridge: ApplianceStatus | null;
  freezer: ApplianceStatus | null;
}

export type OutageErrors = Partial<Record<'offAt' | 'restoredAt' | 'appliances', string>>;

const isDate = (d: unknown): d is Date => d instanceof Date && !Number.isNaN(d.getTime());

export function validateOutage(input: Partial<OutageInputs>, now: Date): OutageErrors {
  const e: OutageErrors = {};
  if (!isDate(input.offAt)) e.offAt = 'Enter when the power went off.';
  else if (input.offAt.getTime() > now.getTime() + FOOD_SAFETY.futureToleranceMs) e.offAt = 'That time is in the future. Enter when the power went off.';
  if (input.restoredAt != null) {
    if (!isDate(input.restoredAt)) e.restoredAt = 'Enter a valid time, or leave this blank if the power is still off.';
    else if (isDate(input.offAt) && input.restoredAt.getTime() < input.offAt.getTime()) e.restoredAt = 'The power came back before it went off. Check both times.';
    else if (input.restoredAt.getTime() > now.getTime() + FOOD_SAFETY.futureToleranceMs) e.restoredAt = 'That time is in the future. Leave this blank if the power is still off.';
  }
  if (input.hasFridge === false && input.freezerFill === 'none') e.appliances = 'Choose at least a fridge or a freezer.';
  return e;
}

function appliance(windowMs: number, offAt: Date, endMs: number, powerBack: boolean, door: DoorUse): ApplianceStatus {
  const elapsedMs = Math.max(0, endMs - offAt.getTime());
  const endsAt = new Date(offAt.getTime() + windowMs);
  const passed = elapsedMs >= windowMs;
  const restoredInWindow = powerBack && !passed;
  const remainingMs = powerBack || passed ? 0 : windowMs - elapsedMs;
  const doorWarning = door !== 'shut';
  let light: Light = 'green';
  if (passed) light = 'red';
  else if (!powerBack && (remainingMs <= FOOD_SAFETY.warnWithinMs || door === 'lots')) light = 'amber';
  else if (doorWarning) light = 'amber';
  return { windowMs, elapsedMs, remainingMs, endsAt, passed, restoredInWindow, doorWarning, light };
}

export function assessOutage(input: OutageInputs, now: Date): OutageResult {
  const powerBack = isDate(input.restoredAt ?? null);
  const endMs = powerBack ? (input.restoredAt as Date).getTime() : now.getTime();
  const elapsedMs = Math.max(0, endMs - input.offAt.getTime());
  const freezerHours = input.freezerFill === 'full' ? FOOD_SAFETY.freezerFullHours : FOOD_SAFETY.freezerHalfHours;
  return {
    now,
    powerBack,
    elapsedMs,
    shortOutage: elapsedMs < FOOD_SAFETY.fridgeHours * HOUR,
    fridge: input.hasFridge ? appliance(FOOD_SAFETY.fridgeHours * HOUR, input.offAt, endMs, powerBack, input.fridgeDoor) : null,
    freezer: input.freezerFill === 'none' ? null : appliance(freezerHours * HOUR, input.offAt, endMs, powerBack, input.freezerDoor),
  };
}

/** "1 h 20 min", "45 min", "2 days 3 h". */
export function formatDuration(ms: number): string {
  const mins = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `${d} ${d === 1 ? 'day' : 'days'}${h ? ` ${h} h` : ''}`;
  if (h > 0) return `${h} h${m ? ` ${m} min` : ''}`;
  return `${m} min`;
}

/** Short, plain-English headline for each appliance. Never says food is safe. */
export function fridgeHeadline(s: ApplianceStatus): string {
  if (s.restoredInWindow) return 'Power came back within the 4-hour window';
  if (s.passed) return 'More than 4 hours: throw away chilled food';
  return `Within the 4-hour window: ${formatDuration(s.remainingMs)} left`;
}

export function freezerHeadline(s: ApplianceStatus, fill: FreezerFill): string {
  const hours = fill === 'full' ? 48 : 24;
  if (s.restoredInWindow) return `Power came back within the ${hours}-hour window`;
  if (s.passed) return `More than ${hours} hours: check every item`;
  return `Should stay frozen for about ${formatDuration(s.remainingMs)} more`;
}

export function outageSummaryText(input: OutageInputs, r: OutageResult, fmtTime: (d: Date) => string): string {
  const lines = [
    'Power cut food check (Stay Prepped planning aid; follow official advice)',
    `Power off since: ${fmtTime(input.offAt)}`,
    r.powerBack ? `Power back at: ${fmtTime(input.restoredAt as Date)}` : `Checked at: ${fmtTime(r.now)}`,
    `Time without power: ${formatDuration(r.elapsedMs)}`,
    '',
  ];
  if (r.fridge) lines.push(`Fridge: ${fridgeHeadline(r.fridge)}. Window ends ${fmtTime(r.fridge.endsAt)}.`);
  if (r.freezer) lines.push(`Freezer (${input.freezerFill === 'full' ? 'full' : 'half full'}): ${freezerHeadline(r.freezer, input.freezerFill)}. Window ends ${fmtTime(r.freezer.endsAt)}.`);
  lines.push(
    '',
    'Keep fridge and freezer doors shut. Chilled food must stay below 8°C.',
    'These are estimates. When in doubt, throw it out.',
    'Report a power cut: call 105 (England, Scotland, Wales).',
    'Sources: Food Standards Agency, Food safety in a power cut; CDC, Keep Food Safe After a Disaster or Emergency.',
  );
  return lines.join('\n');
}
