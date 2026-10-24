// Makes every [data-checklist] list on the page interactive and persistent.
// Works for Markdown checklists (rehype), the printable resources lists and
// lists rendered by the calculators (which call initChecklists again after
// they render). Ticks are stored through the progress store only.
import { progress } from '../lib/progress';

const store = progress();
const bound = new WeakSet<Element>();

// Leave React islands alone until they have hydrated (Astro removes the "ssr"
// attribute then); touching their DOM earlier causes a hydration mismatch.
// Islands call initChecklists() themselves once rendered.
const ready = (el: Element) => !el.closest('astro-island[ssr]');
const $$ = <T extends Element>(sel: string) => [...document.querySelectorAll<T>(sel)].filter(ready);

function listsFor(id: string): HTMLElement[] {
  return $$<HTMLElement>(`[data-checklist="${CSS.escape(id)}"]`);
}

function render(id: string) {
  const s = store.get();
  const ticked = new Set(s.checklists[id] ?? []);
  const lists = listsFor(id);
  let total = 0;
  let done = 0;
  for (const ul of lists) {
    for (const box of ul.querySelectorAll<HTMLInputElement>('input[data-item]')) {
      total++;
      const on = ticked.has(box.dataset.item!);
      box.checked = on;
      box.closest('li')?.classList.toggle('is-ticked', on);
      if (on) done++;
    }
  }
  for (const c of $$<HTMLElement>(`[data-checklist-count="${CSS.escape(id)}"]`)) {
    c.textContent = done === 0 ? `${total} items` : `${done} of ${total} done`;
    c.classList.toggle('is-started', done > 0);
    c.classList.toggle('is-complete', total > 0 && done === total);
  }
  for (const r of $$<HTMLElement>(`[data-checklist-reset="${CSS.escape(id)}"]`)) r.hidden = done === 0;
}

function register(id: string, first: HTMLElement) {
  const boxes = listsFor(id).flatMap((ul) => [...ul.querySelectorAll<HTMLInputElement>('input[data-item]')]);
  const total = boxes.length;
  if (!total) return;
  // Drop ticks for items that no longer exist (an item was reworded or removed),
  // so "N of M" is the same here and on /my-progress/.
  const valid = new Set(boxes.map((b) => b.dataset.item!));
  const ticked = store.get().checklists[id] ?? [];
  const kept = ticked.filter((i) => valid.has(i));
  if (kept.length !== ticked.length) store.setTicked(id, kept);
  const area = first.dataset.checklistArea;
  store.registerList(id, {
    total,
    title: first.dataset.checklistTitle ?? document.title,
    href: first.dataset.checklistHref ?? location.pathname,
    ...(area ? { area: area as never } : {}),
  });
}

function bind(ul: HTMLElement) {
  if (bound.has(ul)) return;
  bound.add(ul);
  const id = ul.dataset.checklist!;
  for (const box of ul.querySelectorAll<HTMLInputElement>('input[data-item]')) box.disabled = false;
  ul.addEventListener('change', (e) => {
    const box = e.target as HTMLInputElement;
    if (!box.matches('input[data-item]')) return;
    const all = listsFor(id).flatMap((l) => [...l.querySelectorAll<HTMLInputElement>('input[data-item]')]);
    store.setTicked(id, all.filter((b) => b.checked).map((b) => b.dataset.item!));
  });
}

export function initChecklists(root: ParentNode = document) {
  const firsts = new Map<string, HTMLElement>();
  for (const ul of [...root.querySelectorAll<HTMLElement>('[data-checklist]')].filter(ready)) {
    const id = ul.dataset.checklist!;
    if (!firsts.has(id) || ul.dataset.checklistTotal) firsts.set(id, ul);
    bind(ul);
  }
  for (const [id, first] of firsts) {
    register(id, first);
    render(id);
  }
}

// Reset links (delegated, so lists rendered later work too).
document.addEventListener('click', (e) => {
  const btn = (e.target as Element).closest<HTMLButtonElement>('[data-checklist-reset]');
  if (!btn) return;
  const id = btn.dataset.checklistReset!;
  store.setTicked(id, []);
  listsFor(id)[0]?.querySelector<HTMLInputElement>('input[data-item]')?.focus();
});

store.subscribe(() => {
  const ids = new Set($$<HTMLElement>('[data-checklist]').map((u) => u.dataset.checklist!));
  ids.forEach(render);
  renderCardChips();
});

/** "3 of 7" chips on guide and hub cards (data-progress-lists="prefix1 prefix2"). */
export function renderCardChips() {
  const s = store.get();
  for (const chip of document.querySelectorAll<HTMLElement>('[data-progress-lists]')) {
    const prefixes = chip.dataset.progressLists!.split(' ').filter(Boolean);
    let done = 0;
    let total = 0;
    for (const [id, meta] of Object.entries(s.lists)) {
      if (!prefixes.some((p) => id.startsWith(p))) continue;
      total += meta.total;
      done += Math.min(meta.total, s.checklists[id]?.length ?? 0);
    }
    const started = done > 0;
    chip.hidden = !started;
    if (started) chip.textContent = done >= total ? 'Checklist complete' : `${done} of ${total} ticked`;
    chip.classList.toggle('is-complete', started && done >= total);
  }
}

// Enable lists once they come near the viewport; chips straight away.
const pending = $$<HTMLElement>('[data-checklist]');
if (pending.length) {
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          initChecklists();
        }
      },
      { rootMargin: '400px 0px' },
    );
    pending.forEach((ul) => io.observe(ul));
  } else {
    initChecklists();
  }
}
renderCardChips();
