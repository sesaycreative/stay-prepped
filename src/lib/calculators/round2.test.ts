import { describe, expect, it } from 'vitest';
import { FOOD_SAFETY, HOUR, assessOutage, formatDuration, fridgeHeadline, freezerHeadline, outageSummaryText, validateOutage, type OutageInputs } from './foodSafety';
import { WATER_TREATMENT, bleachDose, formatClock, formatMl, secondsLeft, treatmentCardText, validateLitres } from './waterTreatment';
import { MEDICATION, addDays, dayStart, isoDay, lightFor, medicationListText, medicationReady, planSupply, supplyFor, validateLeadDays, validateRow, type MedicineRow } from './medication';

const NOW = new Date('2026-10-25T12:00:00Z');
const at = (hoursAgo: number) => new Date(NOW.getTime() - hoursAgo * HOUR);
const base = (o: Partial<OutageInputs> = {}): OutageInputs => ({
  offAt: at(1), restoredAt: null, fridgeDoor: 'shut', hasFridge: true, freezerFill: 'full', freezerDoor: 'shut', ...o,
});

describe('food safety: official windows', () => {
  it('uses the FSA figures', () => {
    expect(FOOD_SAFETY.fridgeHours).toBe(4);
    expect(FOOD_SAFETY.freezerFullHours).toBe(48);
    expect(FOOD_SAFETY.freezerHalfHours).toBe(24);
    expect(FOOD_SAFETY.chilledMaxC).toBe(8);
  });

  it('counts down inside the fridge window', () => {
    const r = assessOutage(base({ offAt: new Date(NOW.getTime() - (2 * HOUR + 40 * 60000)) }), NOW);
    expect(r.fridge!.passed).toBe(false);
    expect(formatDuration(r.fridge!.remainingMs)).toBe('1 h 20 min');
    expect(r.fridge!.light).toBe('green');
    expect(fridgeHeadline(r.fridge!)).toBe('Within the 4-hour window: 1 h 20 min left');
    expect(r.shortOutage).toBe(true);
  });

  it('turns amber in the last hour and red once the window passes', () => {
    expect(assessOutage(base({ offAt: at(3.5) }), NOW).fridge!.light).toBe('amber');
    const r = assessOutage(base({ offAt: at(4) }), NOW);
    expect(r.fridge!.passed).toBe(true);
    expect(r.fridge!.remainingMs).toBe(0);
    expect(r.fridge!.light).toBe('red');
    expect(fridgeHeadline(r.fridge!)).toMatch(/throw away chilled food/);
  });

  it('never reports a passed window as safe, however long the outage', () => {
    const r = assessOutage(base({ offAt: at(24 * 30) }), NOW);
    expect(r.fridge!.light).toBe('red');
    expect(r.freezer!.light).toBe('red');
    expect(fridgeHeadline(r.fridge!)).not.toMatch(/safe/i);
    expect(freezerHeadline(r.freezer!, 'full')).toMatch(/check every item/);
  });

  it('uses 48 h for a full freezer and 24 h for a half-full one', () => {
    expect(assessOutage(base({ offAt: at(30), freezerFill: 'full' }), NOW).freezer!.passed).toBe(false);
    expect(assessOutage(base({ offAt: at(30), freezerFill: 'half' }), NOW).freezer!.passed).toBe(true);
    const r = assessOutage(base({ offAt: at(0), freezerFill: 'full' }), NOW);
    expect(r.freezer!.endsAt.toISOString()).toBe('2026-10-27T12:00:00.000Z');
  });

  it('stops the clock when the power comes back', () => {
    const r = assessOutage(base({ offAt: at(6), restoredAt: at(3) }), NOW);
    expect(r.powerBack).toBe(true);
    expect(r.elapsedMs).toBe(3 * HOUR);
    expect(r.fridge!.restoredInWindow).toBe(true);
    expect(r.fridge!.remainingMs).toBe(0);
    const late = assessOutage(base({ offAt: at(10), restoredAt: at(5) }), NOW);
    expect(late.fridge!.passed).toBe(true);
    expect(late.fridge!.restoredInWindow).toBe(false);
  });

  it('does not shorten the window for door openings (no official figure), but warns', () => {
    const shut = assessOutage(base({ offAt: at(1) }), NOW).fridge!;
    const lots = assessOutage(base({ offAt: at(1), fridgeDoor: 'lots' }), NOW).fridge!;
    expect(lots.remainingMs).toBe(shut.remainingMs);
    expect(lots.doorWarning).toBe(true);
    expect(lots.light).toBe('amber');
    expect(shut.doorWarning).toBe(false);
  });

  it('handles fridge-only and freezer-only homes', () => {
    expect(assessOutage(base({ freezerFill: 'none' }), NOW).freezer).toBeNull();
    expect(assessOutage(base({ hasFridge: false }), NOW).fridge).toBeNull();
  });

  it('validates times', () => {
    expect(validateOutage({ offAt: new Date(NOW.getTime() + HOUR), hasFridge: true, freezerFill: 'full' }, NOW).offAt).toMatch(/future/);
    expect(validateOutage({ offAt: new Date('x'), hasFridge: true, freezerFill: 'full' }, NOW).offAt).toBeTruthy();
    expect(validateOutage({ offAt: at(2), restoredAt: at(3), hasFridge: true, freezerFill: 'full' }, NOW).restoredAt).toMatch(/before/);
    expect(validateOutage({ offAt: at(2), hasFridge: false, freezerFill: 'none' }, NOW).appliances).toBeTruthy();
    expect(validateOutage({ offAt: at(2), hasFridge: true, freezerFill: 'full' }, NOW)).toEqual({});
    // a slightly fast clock is tolerated
    expect(validateOutage({ offAt: new Date(NOW.getTime() + 60000), hasFridge: true, freezerFill: 'full' }, NOW)).toEqual({});
  });

  it('formats durations', () => {
    expect(formatDuration(0)).toBe('0 min');
    expect(formatDuration(45 * 60000)).toBe('45 min');
    expect(formatDuration(2 * HOUR)).toBe('2 h');
    expect(formatDuration(27 * HOUR)).toBe('1 day 3 h');
    expect(formatDuration(-5)).toBe('0 min');
  });

  it('prints a summary that always carries the caveats', () => {
    const t = outageSummaryText(base({ offAt: at(5) }), assessOutage(base({ offAt: at(5) }), NOW), (d) => d.toISOString());
    expect(t).toMatch(/When in doubt, throw it out/);
    expect(t).toMatch(/105/);
    expect(t).toMatch(/throw away chilled food/);
  });
});

describe('water treatment', () => {
  it('uses the CDC and DWI figures', () => {
    expect(WATER_TREATMENT.boilMinutes).toBe(1);
    expect(WATER_TREATMENT.boilMinutesHigh).toBe(3);
    expect(WATER_TREATMENT.waitMinutes).toBe(30);
    expect(WATER_TREATMENT.boiledStoreHours).toBe(24);
  });

  it('reproduces CDC per-litre doses exactly', () => {
    expect(bleachDose(1, 'standard', 'clear')).toMatchObject({ ok: true, ml: 0.1, drops: 2 });
    expect(bleachDose(1, 'one', 'clear')).toMatchObject({ ok: true, ml: 0.5, drops: 10 });
  });

  it('scales with volume and doubles for cloudy water', () => {
    const five = bleachDose(5, 'standard', 'clear');
    expect(five).toMatchObject({ ok: true, drops: 10, mlLabel: '0.5 ml' });
    const cloudy = bleachDose(5, 'standard', 'cloudy');
    expect(cloudy).toMatchObject({ ok: true, drops: 20, doubled: true, mlLabel: '1 ml' });
    expect(bleachDose(25, 'standard', 'clear')).toMatchObject({ ok: true, drops: 50, mlLabel: '2.5 ml' });
    expect(bleachDose(25, 'one', 'cloudy')).toMatchObject({ ok: true, drops: 500, mlLabel: '25 ml' });
  });

  it('is close to the CDC per-gallon figures (1 US gallon = 3.785 L: 8 drops / 0.5 mL)', () => {
    const g = bleachDose(3.785411784, 'standard', 'clear');
    expect(g.ok && g.drops).toBe(8);
    expect(g.ok && Math.abs(g.ml - 0.5)).toBeLessThan(0.15);
  });

  it('refuses to dose an unknown strength', () => {
    const d = bleachDose(5, 'other', 'clear');
    expect(d.ok).toBe(false);
    expect(!d.ok && d.reason).toMatch(/no published dose/);
  });

  it('validates litres, including zero', () => {
    expect(validateLitres('')).toBeTruthy();
    expect(validateLitres('0')).toMatch(/at least/);
    expect(validateLitres('-1')).toBeTruthy();
    expect(validateLitres('abc')).toBeTruthy();
    expect(validateLitres('1001')).toMatch(/batches/);
    expect(validateLitres('2.5')).toBeNull();
    expect(validateLitres(10)).toBeNull();
  });

  it('formats ml and timers', () => {
    expect(formatMl(0.1)).toBe('0.1 ml');
    expect(formatMl(2.5)).toBe('2.5 ml');
    expect(formatMl(25)).toBe('25 ml');
    expect(secondsLeft(new Date(NOW.getTime() + 90500), NOW)).toBe(91);
    expect(secondsLeft(new Date(NOW.getTime() - 1000), NOW)).toBe(0);
    expect(formatClock(1800)).toBe('30:00');
    expect(formatClock(61)).toBe('1:01');
  });

  it('prints a card with the dose and the warnings', () => {
    const t = treatmentCardText(10, 'clear', 'bleach', 'standard');
    expect(t).toMatch(/20 drops \(1 ml\)/);
    expect(t).toMatch(/Never mix bleach/);
    expect(t).toMatch(/water company/);
    expect(treatmentCardText(10, 'clear', 'bleach', 'other')).toMatch(/no published dose/);
    expect(treatmentCardText(10, 'clear', 'tablets', 'standard')).toMatch(/follow the instructions on the packet/);
  });
});

describe('medication supply', () => {
  const TODAY = new Date(2026, 9, 25); // local 25 Oct 2026
  const row = (o: Partial<MedicineRow> = {}): MedicineRow => ({ id: 'a', name: 'Tablet A', perDay: 1, perPack: 28, packs: 1, loose: 0, countedOn: '2026-10-25', ...o });

  it('counts days left, run-out and order-by dates (NHS 5 working days -> 7 day default)', () => {
    const r = supplyFor(row(), TODAY);
    expect(r.daysLeft).toBe(28);
    expect(isoDay(r.runsOutOn)).toBe('2026-11-22');
    expect(isoDay(r.orderBy)).toBe('2026-11-15');
    expect(r.light).toBe('green');
    expect(MEDICATION.defaultLeadDays).toBe(7);
  });

  it('handles twice daily, halves and loose tablets', () => {
    expect(supplyFor(row({ perDay: 2 }), TODAY).daysLeft).toBe(14);
    expect(supplyFor(row({ perDay: 0.5 }), TODAY).daysLeft).toBe(56);
    expect(supplyFor(row({ packs: 0, loose: 10, perDay: 3 }), TODAY).daysLeft).toBe(3);
  });

  it('zero packs means zero days and red, order now', () => {
    const r = supplyFor(row({ packs: 0, loose: 0 }), TODAY);
    expect(r.daysLeft).toBe(0);
    expect(r.light).toBe('red');
    expect(r.orderNow).toBe(true);
  });

  it('applies the traffic-light boundaries', () => {
    expect(lightFor(14)).toBe('green');
    expect(lightFor(13)).toBe('amber');
    expect(lightFor(7)).toBe('amber');
    expect(lightFor(6)).toBe('red');
  });

  it('counts down from the day the count was made; future count dates are treated as today', () => {
    expect(supplyFor(row({ countedOn: '2026-10-20' }), TODAY).daysLeft).toBe(23);
    expect(supplyFor(row({ countedOn: '2026-09-01' }), TODAY).daysLeft).toBe(0); // long past: used up
    expect(supplyFor(row({ countedOn: '2026-11-30' }), TODAY).daysLeft).toBe(28);
  });

  it('flags a next repeat that is after the run-out date', () => {
    expect(supplyFor(row({ nextRepeat: '2026-12-01' }), TODAY).repeatTooLate).toBe(true);
    expect(supplyFor(row({ nextRepeat: '2026-11-10' }), TODAY).repeatTooLate).toBe(false);
  });

  it('respects a custom lead time', () => {
    expect(isoDay(supplyFor(row(), TODAY, 14).orderBy)).toBe('2026-11-08');
    expect(validateLeadDays('7')).toBeNull();
    expect(validateLeadDays('-1')).toBeTruthy();
    expect(validateLeadDays('61')).toBeTruthy();
    expect(validateLeadDays('2.5')).toBeTruthy();
  });

  it('finds the soonest and the first-aid "ready" rule', () => {
    const rows = [row({ id: 'a', packs: 2 }), row({ id: 'b', name: 'B', perDay: 2, packs: 0, loose: 10 })];
    const p = planSupply(rows, TODAY);
    expect(p.soonest?.id).toBe('b');
    expect(p.anyRed).toBe(true);
    expect(medicationReady(rows, TODAY)).toBe(false);
    expect(medicationReady([row({ packs: 2 })], TODAY)).toBe(true);
    expect(medicationReady([], TODAY)).toBe(false);
  });

  it('validates rows with plain messages', () => {
    expect(validateRow({ name: '', perDay: '1', perPack: '28', packs: '1' }).name).toBeTruthy();
    expect(validateRow({ name: 'A', perDay: '0', perPack: '28', packs: '1' }).perDay).toMatch(/more than 0/);
    expect(validateRow({ name: 'A', perDay: '0.3', perPack: '28', packs: '1' }).perDay).toMatch(/halves or quarters/);
    expect(validateRow({ name: 'A', perDay: '1', perPack: '0', packs: '1' }).perPack).toBeTruthy();
    expect(validateRow({ name: 'A', perDay: '1', perPack: '28', packs: '1.5' }).packs).toBeTruthy();
    expect(validateRow({ name: 'A', perDay: '1', perPack: '28', packs: '0' })).toEqual({});
    expect(validateRow({ name: 'A', perDay: '1', perPack: '28', packs: '0', nextRepeat: 'soon' }).nextRepeat).toBeTruthy();
  });

  it('date helpers are calendar-safe', () => {
    expect(isoDay(dayStart('2026-10-25'))).toBe('2026-10-25');
    expect(isoDay(addDays(dayStart('2026-10-25'), 7))).toBe('2026-11-01'); // across the clock change
    expect(Number.isNaN(dayStart('25/10/2026').getTime())).toBe(true);
  });

  it('prints a list with the NHS routes', () => {
    const t = medicationListText(planSupply([row()], TODAY).results, isoDay, 7);
    expect(t).toMatch(/Tablet A: 28 days left/);
    expect(t).toMatch(/111/);
    expect(t).toMatch(/5 working days/);
  });
});
