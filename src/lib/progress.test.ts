import { describe, expect, it } from 'vitest';
import {
  AREAS,
  FLOOD_ITEM,
  LOCAL_RISK_LIST,
  SCHEMA_VERSION,
  STORAGE_KEY,
  RELATED_KEYS,
  createStore,
  doneCount,
  emptyState,
  nationHint,
  nextArea,
  parsePostcode,
  parseState,
  type StorageLike,
} from './progress';
import { areaForGuideList, checklistId, domId, itemIds, slugify } from './checklist-ids.mjs';
import { calculatorQuery, householdFigures, readCalculatorQuery } from './household';
import { inClockChangeWeek, lastSunday, seasonalMessage } from './seasonal';

const memStorage = (init: Record<string, string> = {}): StorageLike & { data: Record<string, string> } => {
  const data = { ...init };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
};

describe('progress state parsing', () => {
  it('returns an empty state for missing, broken or non-object data', () => {
    for (const raw of [null, undefined, '', 'not json', '[]', '42', JSON.stringify('x')]) {
      expect(parseState(raw)).toEqual(emptyState());
    }
  });

  it('ignores a newer schema version rather than misreading it', () => {
    const raw = JSON.stringify({ version: SCHEMA_VERSION + 1, household: { adults: 9, children: 9, set: true } });
    expect(parseState(raw).household.adults).toBe(2);
  });

  it('keeps valid fields and drops bad ones', () => {
    const s = parseState({
      version: 1,
      household: { adults: 3, children: -1, pets: { dogs: 1, cats: 'two' }, set: true },
      checklists: { a: ['x', 'x', 7, 'y'], b: 'nope' },
      lists: { a: { total: 2, title: 'A', href: '/a/', area: 'water' }, bad: { total: 0 }, c: { total: 3, href: 'https://evil.example' } },
      tools: { water: 'not a date', food: '2026-10-24T10:00:00.000Z' },
      localRisk: { outward: 'SW1A 1AA' },
    });
    expect(s.household).toEqual({ adults: 3, children: 0, pets: { dogs: 1, cats: 0 }, set: true });
    expect(s.checklists).toEqual({ a: ['x', 'y'] });
    expect(Object.keys(s.lists).sort()).toEqual(['a', 'c']);
    expect(s.lists.c.href).toBe('/');
    expect(s.tools).toEqual({ food: '2026-10-24T10:00:00.000Z' });
    expect(s.localRisk.outward).toBeUndefined(); // full postcodes are never accepted
  });

  it('accepts a stored outward code only', () => {
    expect(parseState({ localRisk: { outward: 'SW1A' } }).localRisk.outward).toBe('SW1A');
  });
});

describe('area completion rules', () => {
  it('water and food are done by using their calculators', () => {
    const s = parseState({ tools: { water: '2026-10-24T10:00:00.000Z' } });
    expect(s.areas.water?.done).toBe(true);
    expect(s.areas.food).toBeUndefined();
  });

  it('a checklist completes its area only when every item is ticked', () => {
    const lists = { 'guide/72-hour-emergency-bag/what-to-pack': { total: 3, title: 'Pack', href: '/g/', area: 'bag' } };
    expect(parseState({ lists, checklists: { 'guide/72-hour-emergency-bag/what-to-pack': ['a', 'b'] } }).areas.bag).toBeUndefined();
    expect(parseState({ lists, checklists: { 'guide/72-hour-emergency-bag/what-to-pack': ['a', 'b', 'c'] } }).areas.bag?.done).toBe(true);
  });

  it('severe weather needs both the why-prepare visit and the flood risk tick', () => {
    const tick = { checklists: { [LOCAL_RISK_LIST]: [FLOOD_ITEM] } };
    expect(parseState(tick).areas.weather).toBeUndefined();
    expect(parseState({ seen: { 'why-prepare': '2026-10-24T10:00:00.000Z' } }).areas.weather).toBeUndefined();
    expect(parseState({ ...tick, seen: { 'why-prepare': '2026-10-24T10:00:00.000Z' } }).areas.weather?.done).toBe(true);
  });

  it('stored "done" flags are recomputed from the rules, not trusted', () => {
    expect(parseState({ areas: { power: { done: true, source: 'x', at: '2026-10-24T10:00:00.000Z' } } }).areas.power).toBeUndefined();
  });

  it('counts done areas and finds the next one in order', () => {
    const s = parseState({ tools: { water: '2026-10-24T10:00:00.000Z', food: '2026-10-24T10:00:00.000Z' } });
    expect(doneCount(s)).toBe(2);
    expect(nextArea(s)?.id).toBe('bag');
    expect(AREAS).toHaveLength(8);
  });
});

describe('store', () => {
  it('persists under one namespaced key and notifies subscribers', () => {
    const st = memStorage();
    const store = createStore(st);
    const seen: number[] = [];
    store.subscribe((s) => seen.push(s.household.adults));
    store.setHousehold({ adults: 4, children: 1, pets: { dogs: 1, cats: 0 } });
    expect(seen).toEqual([4]);
    expect(Object.keys(st.data)).toEqual([STORAGE_KEY]);
    expect(createStore(st).get().household).toMatchObject({ adults: 4, children: 1, set: true });
  });

  it('records ticks and completes an area', () => {
    const store = createStore(memStorage());
    store.registerList('guide/preparing-for-a-power-cut/power-cut-checklist', { total: 2, title: 'Power', href: '/g/', area: 'power' });
    store.setTicked('guide/preparing-for-a-power-cut/power-cut-checklist', ['a', 'b']);
    expect(store.get().areas.power?.done).toBe(true);
    store.setTicked('guide/preparing-for-a-power-cut/power-cut-checklist', []);
    expect(store.get().areas.power).toBeUndefined();
  });

  it('clear everything removes the store and the old per-tool keys', () => {
    const st = memStorage({ [RELATED_KEYS[0]]: '{}', 'stayprepped:theme': 'dark' });
    const store = createStore(st);
    store.markTool('water');
    store.clearAll();
    expect(st.data).toEqual({ 'stayprepped:theme': 'dark' });
    expect(store.get()).toEqual(emptyState());
  });

  it('keeps working when storage throws', () => {
    const broken: StorageLike = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    const store = createStore(broken);
    store.setHousehold({ adults: 1, children: 0, pets: { dogs: 0, cats: 0 } });
    expect(store.get().household.adults).toBe(1);
    expect(() => store.clearAll()).not.toThrow();
  });
});

describe('checklist ids', () => {
  it('derives stable slugs from item text only', () => {
    expect(slugify('Torches and spare batteries, or rechargeable lights')).toBe('torches-and-spare-batteries-or-rechargeable-lights');
    expect(slugify('Check your first aid kit & medicines')).toBe('check-your-first-aid-kit-and-medicines');
    expect(slugify('')).toBe('item');
    expect(slugify('x'.repeat(80))).toHaveLength(60);
  });

  it('de-duplicates repeated items deterministically', () => {
    expect(itemIds(['Water', 'Food', 'Water'])).toEqual(['water', 'food', 'water-2']);
    expect(itemIds(['Water', 'Food', 'Water'])).toEqual(itemIds(['Water', 'Food', 'Water']));
  });

  it('builds list and DOM ids', () => {
    expect(checklistId('guide', 'how-much-water-to-store', 'Water storage checklist')).toBe('guide/how-much-water-to-store/water-storage-checklist');
    expect(domId('guide/a/b', 'c')).toBe('cl-guide-a-b-c');
  });

  it('maps guide checklists to areas', () => {
    expect(areaForGuideList('how-much-water-to-store', 'anything')).toBe('water');
    expect(areaForGuideList('prepping-for-beginners', '8-check-your-first-aid-kit-and-medicines')).toBe('first-aid');
    expect(areaForGuideList('prepping-for-beginners', 'your-first-week-checklist')).toBeUndefined();
    expect(areaForGuideList('emergency-water-purification', 'a-small-treatment-kit')).toBeUndefined();
    expect(areaForGuideList('72-hour-emergency-bag', 'what-to-pack')).toBe('bag');
    expect(areaForGuideList('72-hour-emergency-bag', 'keep-it-ready')).toBeUndefined();
  });
});

describe('postcodes', () => {
  it('accepts full and outward-only UK postcodes and keeps only the outward code', () => {
    expect(parsePostcode('sw1a 1aa')).toEqual({ ok: true, normalised: 'SW1A 1AA', outward: 'SW1A', full: true });
    expect(parsePostcode('EC1A1BB')).toMatchObject({ ok: true, outward: 'EC1A' });
    expect(parsePostcode(' w1a 0ax ')).toMatchObject({ ok: true, outward: 'W1A' });
    expect(parsePostcode('M1 1AE')).toMatchObject({ ok: true, outward: 'M1' });
    expect(parsePostcode('bt7')).toEqual({ ok: true, normalised: 'BT7', outward: 'BT7', full: false });
  });

  it('rejects things that are not UK postcodes', () => {
    for (const bad of ['', '12345', 'SW1A 1AAA', 'hello', 'Q1 1AA1', '1AB 2CD']) expect(parsePostcode(bad).ok).toBe(false);
  });

  it('only flags Northern Ireland from BT', () => {
    expect(nationHint('BT1')).toBe('ni');
    expect(nationHint('CF10')).toBe('gb');
    expect(nationHint('EH1')).toBe('gb');
  });
});

describe('household figures', () => {
  it('uses the calculators: 2 adults, 1 child, 3 days', () => {
    const f = householdFigures({ adults: 2, children: 1, pets: { dogs: 0, cats: 0 } });
    expect(f.waterLitres).toBe(36); // 3 people x 4 L x 3 days
    expect(f.foodKcal).toBe(16500); // (2x2000 + 1500) x 3
    expect(f.people).toBe(3);
  });

  it('adds pet water', () => {
    const f = householdFigures({ adults: 1, children: 0, pets: { dogs: 1, cats: 1 } });
    expect(f.waterLitres).toBe(16); // 12 + 3 (dog) + 0.75 (cat), rounded
  });

  it('builds and reads a counts-only query string', () => {
    const q = calculatorQuery({ adults: 2, children: 1 });
    expect(q).toBe('?adults=2&children=1&days=3');
    expect(readCalculatorQuery(q)).toEqual({ adults: 2, children: 1, days: 3 });
    expect(readCalculatorQuery('?adults=999&children=-1&days=abc&name=x')).toEqual({ adults: undefined, children: undefined, days: undefined });
  });
});

describe('seasonal line', () => {
  it('computes the last Sunday of March and October', () => {
    expect(lastSunday(2026, 2).getDate()).toBe(29);
    expect(lastSunday(2026, 9).getDate()).toBe(25);
    expect(lastSunday(2027, 9).getDate()).toBe(31);
  });

  it('shows the clock change message in the week before the change', () => {
    expect(inClockChangeWeek(new Date(2026, 9, 24))).toBe(true);
    expect(inClockChangeWeek(new Date(2026, 9, 25))).toBe(true);
    expect(inClockChangeWeek(new Date(2026, 9, 26))).toBe(false);
    expect(inClockChangeWeek(new Date(2026, 9, 18))).toBe(false);
    expect(seasonalMessage(new Date(2026, 9, 24))?.id).toBe('clocks');
  });

  it('chooses by month otherwise', () => {
    expect(seasonalMessage(new Date(2026, 11, 10))?.id).toBe('cold');
    expect(seasonalMessage(new Date(2027, 1, 10))?.id).toBe('cold');
    expect(seasonalMessage(new Date(2026, 6, 10))?.id).toBe('heat');
    expect(seasonalMessage(new Date(2026, 4, 10))).toBeNull();
    expect(seasonalMessage(new Date(2026, 8, 10))).toBeNull();
  });
});
