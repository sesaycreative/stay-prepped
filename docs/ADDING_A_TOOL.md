# Adding a tool

Tools are registry-driven. The tools hub (`/tools`), category groupings, homepage, hub pages and sitemap all read from `src/content/tools/*.md`, so a new tool appears everywhere once its entry exists.

There are four steps. Steps 2–4 are only needed when the tool goes live; a coming-soon tool is just step 1.

## 1. Add (or edit) the registry entry

Create `src/content/tools/<slug>.md`. The file name must match `slug`.

```yaml
---
title: Emergency Cooking Calculator
slug: emergency-cooking-calculator
summary: One or two sentences shown on cards and as the page description.
category: food-water          # food-water | kits-supplies | planning-assessments | power-energy | budget | household
status: coming-soon           # coming-soon | live
icon: cooking-pot             # any Lucide icon name (see lucide.dev); falls back to "info"
order: 30                     # sort order within lists
phase: 5                      # optional: brief phase
reviewedAt: 2026-10-24        # optional; shown as "Last reviewed" on live tools
seoTitle: Optional <title> override
seoDescription: Optional meta description (≤170 chars)
instructions:                 # numbered "How to use it" steps (live tools)
  - Enter …
relatedGuides:                # guide slugs (file names in src/content/guides); ≥2 for live tools
  - preparing-for-a-power-cut
  - how-much-food-to-store
faq:                          # rendered on the page and as FAQPage JSON-LD
  - q: Question?
    a: Answer.
safetyNotes:                  # shown in a safety callout
  - …
---

## How this is calculated

Markdown body: method, formulas, assumptions and limits. Aim for ≥300 words (brief §11).
```

Quote YAML values that contain a colon (`title: "A: B"`).

The schema lives in `src/content.config.ts`. `npm run build` fails if a field is missing or wrong. `npm test` (see `src/lib/content.test.ts`) also checks that related guides exist.

A coming-soon tool renders as a non-clickable card with a "Coming soon" badge. It never gets a button or a page, so there are no dead ends.

## 2. Write the pure calculation logic and tests

Create `src/lib/calculators/<name>.ts`:

- Pure functions only: no DOM, no `window`, no storage.
- Export the assumptions as named constants so the page copy and tests can refer to them.
- Export a `validate…Inputs()` function that returns specific, human-readable error messages per field. Reuse `validateCount` and `validateDays` from `shared.ts`.
- Export text/CSV builders for downloads (`toCsv` in `shared.ts` handles escaping).

Create `src/lib/calculators/<name>.test.ts` with Vitest. Cover at least:

- every formula and assumption
- edge cases: zero people, the maximum value of each input (e.g. 365 days), invalid input (negative, decimal, blank, non-numeric)
- download output format

Run `npm test`.

## 3. Build the React island

Create `src/components/tools/<Name>.tsx`:

- Use the helpers in `src/components/tools/ui.tsx`: `NumberField`, `ChoiceGroup`, `DaysField`, `ToolActions` (print + downloads + reset), and `usePersistentForm` (saves inputs to `localStorage` under a versioned key like `stayprepped:<slug>:v1`).
- Every input needs a visible label. Show the error from your validator next to the field (`aria-invalid` + `aria-describedby` are handled by `NumberField`).
- Put the results in a `<section className="panel results">` and wrap the headline result in `aria-live="polite"`.
- Add `className="no-print"` to anything that should not print (the form).
- Never send tool data to a server.

## 4. Wire it into the tool page and go live

In `src/pages/tools/[slug].astro`:

1. Import the component.
2. Add a line alongside the others:

   ```astro
   {t.slug === 'emergency-cooking-calculator' && <EmergencyCookingCalculator client:load />}
   ```

   Astro needs each hydrated component referenced statically, which is why this is an explicit list rather than a lookup table.

Then set `status: live` in the registry entry, add `instructions`, `faq`, `safetyNotes` and `reviewedAt`, and write the "How this is calculated" body.

The content test checks that every live tool is wired up in `[slug].astro` and has at least 300 words of explanatory copy in its body.

**Safety-relevant figures (food safety, water treatment, medicines, health).** Fetch every figure from an official source (UK first: FSA, NHS, GOV.UK, DWI; then WHO, CDC or EPA where the UK is silent), record the verbatim figure and URL in `docs/TOOL_SOURCES.md`, and link it in a "Where the figures come from" section on the tool page. If a figure cannot be verified, leave that feature out and record it under "Not used". Never fill a gap from memory.

**Tool state that should survive a reload** (a countdown, a timer, a list the visitor builds) goes in the shared progress store (`src/lib/progress.ts`): add an optional field, tolerant parsing in `parseState`, a setter, and tests. See `docs/PROGRESS_STATE.md`. Only save once the visitor starts using the tool.

## 5. Verify

```bash
npm test             # calculators + content integrity
npm run build        # type check, build, search index
npm run linkcheck    # every internal link resolves
```

The tool now appears on `/tools`, in its category, in "More free tools" on other tool pages, in the sitemap and in search. Update `docs/TOOL_SPECS.md` to mark it as built.
