# Progress state (browser only)

Everything Stay Prepped remembers about a visitor is kept in their own browser, in `localStorage`, under one key: **`stayprepped:v1`**. Nothing is sent to a server, there are no accounts, and clearing it is one button on `/my-progress/`.

The module that owns it is `src/lib/progress.ts`. Every feature reads and writes through it; nothing else touches that key.

## Schema (version 1)

```ts
{
  version: 1,
  household: { adults: number, children: number, pets: { dogs: number, cats: number }, set: boolean },
  areas: { [areaId]: { done: true, source: string, at: ISO date } },
  checklists: { [checklistId]: string[] },           // ticked item ids
  lists: { [checklistId]: { total, title, href, area? } }, // what each checklist looks like, for "3 of 7"
  tools: { water?: ISO date, food?: ISO date },       // last time each calculator was used
  seen: { [page]: ISO date },                         // pages that count towards an area ("why-prepare")
  localRisk: { outward?: "SW1A" }                      // outward postcode only, never the full postcode
}
```

- **Safe reads.** Every access is wrapped in try/catch. Anything missing, out of range or of the wrong type falls back to its default. Full postcodes and off-site `href` values are rejected.
- **Versioning.** A stored `version` newer than the code understands is ignored rather than misread.
- **`areas` is derived, not trusted.** It is recomputed from the rules below on every read and write; only the first-done time is carried forward.
- **Pub/sub.** `progress().subscribe(fn)` notifies islands in the same tab. A `storage` event listener keeps other open tabs in step.
- **Clear everything.** `progress().clearAll()` removes `stayprepped:v1` and the older per-calculator keys (`stayprepped:water-calculator:v1`, `stayprepped:food-calculator:v1`, `stayprepped:preparedness-score:v1`). It keeps only the light/dark theme choice.

## Ids

`src/lib/checklist-ids.mjs` is shared by the build-time Markdown plugin and the browser code:

- **Checklist id:** `scope/page/section`, for example `guide/how-much-water-to-store/water-storage-checklist`, `resource/grab-bag/water-and-food`, `tool/food-storage-calculator/shopping-checklist`, `page/local-risk/your-local-checks`.
- **Item id:** a slug of the item's own text, de-duplicated with `-2`, `-3`. Editing other copy in a guide never loses ticks; rewording an item starts that one item unticked.

## Area rules ("done" is automatic)

| Area | Done when |
| --- | --- |
| Water | The water calculator has been used, or every item on the water guide's checklist is ticked |
| Food | The food calculator has been used, or every item on the food guide's checklist is ticked |
| Emergency bag | Every item in the 72-hour bag guide's "What to pack" checklist is ticked |
| Power cuts | Every item on the power cut guide's checklist is ticked |
| First aid & medicine | Every item on the first aid checklist in section 8 of the beginners guide is ticked |
| Family plan | Every item on the family plan guide's checklist is ticked |
| Home & documents | Every item on the essential documents guide's checklist is ticked |
| Severe weather & flooding | `/why-prepare/` has been visited, and "I've checked my flood risk" is ticked on `/local-risk/` |

Each guide checklist is one `##` section: every task list under that heading, including lists under its `###` sub-headings, counts as one checklist. Where a guide has more than one checklist section, only the named section counts towards the area (for example "What to pack", not "Keep it ready"). The mapping is `GUIDE_AREAS` in `checklist-ids.mjs`.

## What crosses into a URL

Only the calculator links carry anything: `?adults=N&children=N&days=3`, which are counts. The calculators read them on load (validated, in range) and ignore anything else. The postcode is never put into a URL, a form submission or a request.
