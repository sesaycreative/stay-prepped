// Browser-only progress store. Everything a visitor does on the site that we
// remember (household size, ticked checklist items, which areas are ready, an
// outward postcode) lives here, under one localStorage key, and nowhere else.
// Nothing is ever sent to a server. See docs/PROGRESS_STATE.md.
import { itemIds } from './checklist-ids.mjs';
import { medicationReady, type MedicineRow } from './calculators/medication';

export const STORAGE_KEY = 'stayprepped:v1';
export const SCHEMA_VERSION = 1;

/** Older per-tool keys that "Clear everything" also removes. */
export const RELATED_KEYS = [
  'stayprepped:water-calculator:v1',
  'stayprepped:food-calculator:v1',
  'stayprepped:preparedness-score:v1',
];

export type AreaId = 'water' | 'food' | 'bag' | 'power' | 'first-aid' | 'family' | 'home-docs' | 'weather';

export interface AreaInfo {
  id: AreaId;
  label: string;
  /** Tone class used for colour (see global.css). */
  tone: string;
  /** Where "Next" and the progress dots link. */
  href: string;
  /** Plain-English rule, shown on /my-progress/. */
  rule: string;
}

export const AREAS: AreaInfo[] = [
  { id: 'water', label: 'Water', tone: 'water', href: '/guides/how-much-water-to-store/', rule: 'Use the water calculator, or tick every item on the water storage checklist.' },
  { id: 'food', label: 'Food', tone: 'food', href: '/guides/how-much-food-to-store/', rule: 'Use the food calculator, or tick every item on the food storage checklist.' },
  { id: 'bag', label: 'Emergency bag', tone: 'kits', href: '/guides/72-hour-emergency-bag/', rule: 'Tick every item on the "What to pack" checklist in the 72-hour bag guide.' },
  { id: 'power', label: 'Power cuts', tone: 'power', href: '/guides/preparing-for-a-power-cut/', rule: 'Tick every item on the power cut checklist.' },
  { id: 'first-aid', label: 'First aid & medicine', tone: 'health', href: '/guides/prepping-for-beginners/#8-check-your-first-aid-kit-and-medicines', rule: 'Tick every item on the first aid checklist in the beginners guide, or list your medicines in the medication planner with none running low (under 7 days).' },
  { id: 'family', label: 'Family plan', tone: 'home', href: '/guides/family-emergency-plan/', rule: 'Tick every item on the "write it down and share it" checklist in the family plan guide.' },
  { id: 'home-docs', label: 'Home & documents', tone: 'docs', href: '/guides/essential-documents/', rule: 'Tick every item on the "which documents matter most" checklist.' },
  { id: 'weather', label: 'Severe weather & flooding', tone: 'gov', href: '/local-risk/', rule: 'Visit "Why prepare?" and tick "I\'ve checked my flood risk" on the local risk page.' },
];

export const LOCAL_RISK_LIST = 'page/local-risk/your-local-checks';
export const LOCAL_RISK_ITEMS = [
  "I've checked my flood risk",
  "I've signed up to flood or weather alerts",
  "I know my network operator and the power cut number",
];
export const FLOOD_ITEM = itemIds(LOCAL_RISK_ITEMS)[0];

export interface Household {
  adults: number;
  children: number;
  pets: { dogs: number; cats: number };
  /** True once the visitor has set it themselves. */
  set: boolean;
}

export interface ListMeta {
  total: number;
  title: string;
  href: string;
  area?: AreaId;
}

export interface AreaState {
  done: boolean;
  source: string;
  at: string;
}

export interface ProgressState {
  version: number;
  household: Household;
  areas: Partial<Record<AreaId, AreaState>>;
  /** Ticked item ids per checklist id. */
  checklists: Record<string, string[]>;
  /** What we know about each checklist the visitor has seen (for counts). */
  lists: Record<string, ListMeta>;
  /** When each calculator was last used. */
  tools: Partial<Record<'water' | 'food', string>>;
  /** Pages that count towards an area when visited. */
  seen: Record<string, string>;
  /** Outward postcode only (e.g. "SW1A"), never the full postcode. */
  localRisk: { outward?: string };
  /** Tool timers and inputs that must survive a reload. */
  outage?: OutageState;
  waterTimer?: { endsAt: string; litres: number; method: string };
  /** Medication planner rows. Names stay on this device only. */
  medicines?: { rows: MedicineRow[]; leadDays: number };
}

export interface OutageState {
  offAt: string;
  restoredAt?: string;
  fridgeDoor: 'shut' | 'few' | 'lots';
  hasFridge: boolean;
  freezerFill: 'full' | 'half' | 'none';
  freezerDoor: 'shut' | 'few' | 'lots';
}

export const DEFAULT_HOUSEHOLD: Household = { adults: 2, children: 0, pets: { dogs: 0, cats: 0 }, set: false };

export function emptyState(): ProgressState {
  return {
    version: SCHEMA_VERSION,
    household: { ...DEFAULT_HOUSEHOLD, pets: { ...DEFAULT_HOUSEHOLD.pets } },
    areas: {},
    checklists: {},
    lists: {},
    tools: {},
    seen: {},
    localRisk: {},
  };
}

/* --------------------------------------------------------------------------
   Parsing: tolerant of missing fields, wrong types and unknown versions.
-------------------------------------------------------------------------- */
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const count = (v: unknown, max: number, fallback: number) =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max ? v : fallback;
const isIso = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v));
const AREA_IDS = new Set<string>(AREAS.map((a) => a.id));
const OUTWARD_RE = /^[A-Z]{1,2}[0-9][A-Z0-9]?$/;

export function parseState(raw: unknown): ProgressState {
  const s = emptyState();
  let data: unknown = raw;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw);
    } catch {
      return s;
    }
  }
  if (!isObj(data)) return s;
  // A future schema we don't understand: start fresh rather than misread it.
  if (typeof data.version === 'number' && data.version > SCHEMA_VERSION) return s;

  if (isObj(data.household)) {
    const h = data.household;
    const pets = isObj(h.pets) ? h.pets : {};
    s.household = {
      adults: count(h.adults, 50, DEFAULT_HOUSEHOLD.adults),
      children: count(h.children, 50, DEFAULT_HOUSEHOLD.children),
      pets: { dogs: count(pets.dogs, 20, 0), cats: count(pets.cats, 20, 0) },
      set: h.set === true,
    };
  }
  if (isObj(data.checklists)) {
    for (const [id, items] of Object.entries(data.checklists)) {
      if (Array.isArray(items)) s.checklists[id] = [...new Set(items.filter((i): i is string => typeof i === 'string'))];
    }
  }
  if (isObj(data.lists)) {
    for (const [id, m] of Object.entries(data.lists)) {
      if (!isObj(m) || typeof m.total !== 'number' || m.total < 1) continue;
      s.lists[id] = {
        total: Math.floor(m.total),
        title: typeof m.title === 'string' ? m.title : id,
        href: typeof m.href === 'string' && m.href.startsWith('/') ? m.href : '/',
        area: typeof m.area === 'string' && AREA_IDS.has(m.area) ? (m.area as AreaId) : undefined,
      };
    }
  }
  if (isObj(data.tools)) {
    for (const k of ['water', 'food'] as const) if (isIso(data.tools[k])) s.tools[k] = data.tools[k] as string;
  }
  if (isObj(data.seen)) {
    for (const [k, v] of Object.entries(data.seen)) if (isIso(v)) s.seen[k] = v;
  }
  if (isObj(data.localRisk) && typeof data.localRisk.outward === 'string' && OUTWARD_RE.test(data.localRisk.outward)) {
    s.localRisk.outward = data.localRisk.outward;
  }
  const door = (v: unknown) => (v === 'shut' || v === 'few' || v === 'lots' ? v : 'shut');
  if (isObj(data.outage) && isIso(data.outage.offAt)) {
    const o = data.outage;
    s.outage = {
      offAt: o.offAt as string,
      ...(isIso(o.restoredAt) ? { restoredAt: o.restoredAt as string } : {}),
      fridgeDoor: door(o.fridgeDoor),
      hasFridge: o.hasFridge !== false,
      freezerFill: o.freezerFill === 'half' || o.freezerFill === 'none' ? o.freezerFill : 'full',
      freezerDoor: door(o.freezerDoor),
    };
  }
  if (isObj(data.waterTimer) && isIso(data.waterTimer.endsAt)) {
    const w = data.waterTimer;
    s.waterTimer = { endsAt: w.endsAt as string, litres: typeof w.litres === 'number' ? w.litres : 0, method: typeof w.method === 'string' ? w.method : 'bleach' };
  }
  if (isObj(data.medicines) && Array.isArray(data.medicines.rows)) {
    const rows: MedicineRow[] = [];
    for (const r of data.medicines.rows.slice(0, 10)) {
      if (!isObj(r)) continue;
      const n = (v: unknown, max: number) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max ? v : null);
      const perDay = n(r.perDay, 50), perPack = n(r.perPack, 1000), packs = n(r.packs, 100);
      if (typeof r.id !== 'string' || typeof r.name !== 'string' || !perDay || !perPack || packs === null) continue;
      rows.push({
        id: r.id.slice(0, 40), name: r.name.slice(0, 60), perDay, perPack, packs,
        loose: n(r.loose, 5000) ?? 0,
        countedOn: typeof r.countedOn === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.countedOn) ? r.countedOn : new Date().toISOString().slice(0, 10),
        ...(typeof r.nextRepeat === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.nextRepeat) ? { nextRepeat: r.nextRepeat } : {}),
      });
    }
    const lead = data.medicines.leadDays;
    s.medicines = { rows, leadDays: typeof lead === 'number' && Number.isInteger(lead) && lead >= 0 && lead <= 60 ? lead : 7 };
  }
  if (isObj(data.areas)) {
    for (const [k, v] of Object.entries(data.areas)) {
      if (AREA_IDS.has(k) && isObj(v) && v.done === true && isIso(v.at)) {
        s.areas[k as AreaId] = { done: true, source: typeof v.source === 'string' ? v.source : '', at: v.at };
      }
    }
  }
  return withAreas(s);
}

/* --------------------------------------------------------------------------
   Area rules (pure). See AREAS[].rule for the plain-English version.
-------------------------------------------------------------------------- */
export function listComplete(s: ProgressState, id: string): boolean {
  const meta = s.lists[id];
  return !!meta && (s.checklists[id]?.length ?? 0) >= meta.total;
}

export function areaSource(s: ProgressState, area: AreaId): string | null {
  if (area === 'water' && s.tools.water) return 'tool:water';
  if (area === 'food' && s.tools.food) return 'tool:food';
  if (area === 'first-aid' && s.medicines?.rows.length && medicationReady(s.medicines.rows, new Date())) return 'tool:medication';
  if (area === 'weather') {
    return s.seen['why-prepare'] && s.checklists[LOCAL_RISK_LIST]?.includes(FLOOD_ITEM) ? `checklist:${LOCAL_RISK_LIST}` : null;
  }
  for (const [id, meta] of Object.entries(s.lists)) {
    if (meta.area === area && listComplete(s, id)) return `checklist:${id}`;
  }
  return null;
}

/** Recompute s.areas from the rules, keeping the first-done time. */
export function withAreas(s: ProgressState, now = new Date()): ProgressState {
  const areas: ProgressState['areas'] = {};
  for (const a of AREAS) {
    const source = areaSource(s, a.id);
    if (source) areas[a.id] = { done: true, source, at: s.areas[a.id]?.at ?? now.toISOString() };
  }
  return { ...s, areas };
}

export function doneCount(s: ProgressState): number {
  return AREAS.filter((a) => s.areas[a.id]?.done).length;
}

export function nextArea(s: ProgressState): AreaInfo | null {
  return AREAS.find((a) => !s.areas[a.id]?.done) ?? null;
}

/** Ticked/total across every list whose id starts with one of the prefixes. */
export function listsProgress(s: ProgressState, prefixes: string[]): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const [id, meta] of Object.entries(s.lists)) {
    if (!prefixes.some((p) => id.startsWith(p))) continue;
    total += meta.total;
    done += Math.min(meta.total, s.checklists[id]?.length ?? 0);
  }
  return { done, total };
}

/* --------------------------------------------------------------------------
   Postcodes. Only the outward code is ever stored.
-------------------------------------------------------------------------- */
export interface PostcodeResult {
  ok: boolean;
  /** Normalised, e.g. "SW1A 1AA" or "SW1A". */
  normalised?: string;
  outward?: string;
  full?: boolean;
}

export function parsePostcode(input: string): PostcodeResult {
  const v = String(input ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (v === 'GIR0AA') return { ok: true, normalised: 'GIR 0AA', outward: 'GIR', full: true };
  const full = v.match(/^([A-Z]{1,2}[0-9][A-Z0-9]?)([0-9][A-Z]{2})$/);
  if (full) return { ok: true, normalised: `${full[1]} ${full[2]}`, outward: full[1], full: true };
  if (OUTWARD_RE.test(v)) return { ok: true, normalised: v, outward: v, full: false };
  return { ok: false };
}

/** Nation hint: only Northern Ireland (BT) is certain from the outward code. */
export function nationHint(outward: string): 'ni' | 'gb' {
  return /^BT/.test(outward) ? 'ni' : 'gb';
}

/* --------------------------------------------------------------------------
   Store: safe storage access + tiny pub/sub (same tab and other tabs).
-------------------------------------------------------------------------- */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

type Listener = (s: ProgressState) => void;

export function createStore(storage: StorageLike | null) {
  const listeners = new Set<Listener>();
  let cache: ProgressState | null = null;

  const read = (): ProgressState => {
    if (cache) return cache;
    let raw: string | null = null;
    try {
      raw = storage?.getItem(STORAGE_KEY) ?? null;
    } catch {
      raw = null;
    }
    cache = raw ? parseState(raw) : emptyState();
    return cache;
  };

  const write = (next: ProgressState) => {
    cache = withAreas(next);
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch {
      /* storage full or blocked: keep working in memory */
    }
    listeners.forEach((l) => l(cache!));
  };

  const update = (fn: (s: ProgressState) => ProgressState) => write(fn(structuredClone(read())));

  return {
    get: read,
    subscribe(fn: Listener) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    /** Called when another tab changed storage. */
    reload() {
      cache = null;
      const s = read();
      listeners.forEach((l) => l(s));
    },
    setHousehold(h: Omit<Household, 'set'>) {
      update((s) => ({ ...s, household: { ...h, pets: { ...h.pets }, set: true } }));
    },
    clearHousehold() {
      update((s) => ({ ...s, household: { ...DEFAULT_HOUSEHOLD, pets: { ...DEFAULT_HOUSEHOLD.pets } } }));
    },
    registerList(id: string, meta: ListMeta) {
      const cur = read().lists[id];
      if (cur && cur.total === meta.total && cur.title === meta.title && cur.href === meta.href && cur.area === meta.area) return;
      update((s) => ({ ...s, lists: { ...s.lists, [id]: meta } }));
    },
    setTicked(id: string, items: string[]) {
      update((s) => {
        const checklists = { ...s.checklists };
        if (items.length) checklists[id] = [...new Set(items)];
        else delete checklists[id];
        return { ...s, checklists };
      });
    },
    markTool(tool: 'water' | 'food') {
      update((s) => ({ ...s, tools: { ...s.tools, [tool]: new Date().toISOString() } }));
    },
    markSeen(page: string) {
      if (read().seen[page]) return;
      update((s) => ({ ...s, seen: { ...s.seen, [page]: new Date().toISOString() } }));
    },
    setOutage(o: OutageState | undefined) {
      update((s) => {
        const next = { ...s };
        if (o) next.outage = o;
        else delete next.outage;
        return next;
      });
    },
    setWaterTimer(t: ProgressState['waterTimer']) {
      update((s) => {
        const next = { ...s };
        if (t) next.waterTimer = t;
        else delete next.waterTimer;
        return next;
      });
    },
    setMedicines(m: ProgressState['medicines']) {
      update((s) => {
        const next = { ...s };
        if (m && m.rows.length) next.medicines = m;
        else delete next.medicines;
        return next;
      });
    },
    setOutward(outward: string | undefined) {
      update((s) => ({ ...s, localRisk: outward ? { outward } : {} }));
    },
    /** Remove everything this site stores on the device (except the theme choice). */
    clearAll() {
      try {
        storage?.removeItem(STORAGE_KEY);
        for (const k of RELATED_KEYS) storage?.removeItem(k);
      } catch {
        /* ignore */
      }
      cache = emptyState();
      listeners.forEach((l) => l(cache!));
    },
  };
}

export type ProgressStore = ReturnType<typeof createStore>;

let browserStore: ProgressStore | null = null;

/** The shared store for this page. Safe to call during SSR (returns an in-memory store). */
export function progress(): ProgressStore {
  if (browserStore) return browserStore;
  let storage: StorageLike | null = null;
  try {
    storage = typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    storage = null;
  }
  browserStore = createStore(storage);
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === null || e.key === STORAGE_KEY) browserStore?.reload();
    });
  }
  return browserStore;
}
