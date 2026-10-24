// Stable ids for checklists and their items. Shared by the Markdown pipeline
// (src/lib/rehype-stayprepped.mjs), Astro components and the browser scripts,
// so a tick saved on one page is recognised everywhere.
//
// - A checklist id is "<scope>/<page>/<section>", e.g.
//   "guide/how-much-water-to-store/water-storage-checklist".
// - An item id is a slug of the item's own text, so editing other copy in the
//   guide never changes it. Rewording the item itself starts it unticked.

/** Lower-case ASCII slug, max 60 chars, words joined by hyphens. */
export function slugify(text) {
  return String(text)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '') || 'item';
}

/** Item ids for a list of item texts, de-duplicated with -2, -3... */
export function itemIds(texts) {
  const seen = new Map();
  return texts.map((t) => {
    const base = slugify(t);
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  });
}

/** Checklist id from its parts. */
export function checklistId(scope, page, section) {
  return [scope, page, slugify(section || 'list')].join('/');
}

/** A DOM id for a checkbox: safe characters only. */
export function domId(listId, itemId) {
  return `cl-${listId}-${itemId}`.replace(/[^a-zA-Z0-9_-]/g, '-');
}

/**
 * Which preparedness area a guide's checklists count towards. A string means
 * every checklist in that guide; an object limits it to one section.
 */
export const GUIDE_AREAS = {
  'how-much-water-to-store': 'water',
  'how-much-food-to-store': 'food',
  '72-hour-emergency-bag': { section: 'what-to-pack', area: 'bag' },
  'preparing-for-a-power-cut': 'power',
  'prepping-for-beginners': { section: '8-check-your-first-aid-kit-and-medicines', area: 'first-aid' },
  'family-emergency-plan': { section: 'step-8-write-it-down-and-share-it', area: 'family' },
  'essential-documents': { section: 'which-documents-matter-most', area: 'home-docs' },
};

/** Area for a checklist in a given guide section, or undefined. */
export function areaForGuideList(guideSlug, sectionSlug) {
  const rule = GUIDE_AREAS[guideSlug];
  if (!rule) return undefined;
  if (typeof rule === 'string') return rule;
  return sectionSlug === rule.section ? rule.area : undefined;
}
