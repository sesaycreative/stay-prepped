// One seasonal line under the homepage hero, chosen from the visitor's own
// clock. No fetches. The UK clock-change rule (last Sunday of March and of
// October) is computed, never hard-coded.

export interface SeasonalMessage {
  id: 'clocks' | 'cold' | 'heat';
  text: string;
  href: string;
  link: string;
}

/** Last Sunday of a month (month is 0-based), as a local date at midnight. */
export function lastSunday(year: number, month: number): Date {
  const d = new Date(year, month + 1, 0); // last day of the month
  d.setDate(d.getDate() - d.getDay());
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** True from the Monday before a clock change up to and including its Sunday. */
export function inClockChangeWeek(now: Date): boolean {
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (const m of [2, 9]) {
    const sunday = lastSunday(now.getFullYear(), m);
    const monday = new Date(sunday);
    monday.setDate(sunday.getDate() - 6);
    if (day >= monday && day <= sunday) return true;
  }
  return false;
}

export const SEASONAL: Record<SeasonalMessage['id'], SeasonalMessage> = {
  clocks: { id: 'clocks', text: 'Clocks change this weekend: rotate your stored water.', href: '/guides/how-much-water-to-store/#keeping-it-fresh', link: 'How to rotate it' },
  cold: { id: 'cold', text: 'Storm and cold season: check your torch batteries and a blanket per person.', href: '/guides/preparing-for-a-power-cut/', link: 'Power cut guide' },
  heat: { id: 'heat', text: 'Hot weather: add a litre of water per person per day.', href: '/tools/water-storage-calculator/', link: 'Water calculator' },
};

export function seasonalMessage(now: Date): SeasonalMessage | null {
  if (inClockChangeWeek(now)) return SEASONAL.clocks;
  const m = now.getMonth();
  if (m >= 9 || m <= 1) return SEASONAL.cold; // October to February
  if (m >= 5 && m <= 7) return SEASONAL.heat; // June to August
  return null;
}
