# Design system

All tokens live in `src/styles/global.css` as CSS custom properties on `:root`, with dark-mode overrides. Tailwind v4 reads them through `@theme inline`, so utilities such as `text-muted`, `bg-surface` and `text-primary` use the same tokens.

## Direction

Calm, practical and trustworthy. The visual idea is a **field notebook and Ordnance Survey map**: warm paper, forest green ink, earthy rules, and one signature motif, the topographic contour lines behind the homepage hero (`src/components/Contours.astro`). Everything else stays quiet. No stock photos, no gradients, no alarmist imagery.

## Colour

Brand palette from the brief (§2):

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--c-forest` / `--primary` | `#2F5D3A` | `#6FA67C` | Primary brand colour, live tool cards, secondary buttons, links |
| `--c-charcoal` / `--text` | `#23272A` | `#ECE7DD` | Body text |
| `--c-earth` | `#8B6B4A` | n/a | Decorative rules only (4.45:1 on the background, so not used for text) |
| `--c-earth-text` | `#6E5236` | `#C9B99B` | Earth-tone text, such as category labels (6.5:1) |
| `--c-sand` | `#C9B99B` | n/a | Card top rules, TOC rule, shadows, selection |
| `--bg` | `#F7F4EE` | `#1A1D1F` | Page background |
| `--accent` | `#D9742B` | `#E89456` | **Primary CTAs only**, with charcoal text |

### Contrast (WCAG 2.2 AA, checked)

| Pair | Ratio |
| --- | --- |
| Charcoal text on background | 13.7:1 |
| Forest on background | 7.0:1 |
| White on forest | 7.6:1 |
| Charcoal on orange (CTA) | 4.65:1 |
| Muted `#5C6166` on background | 5.7:1 |
| Earth text `#6E5236` on background | 6.5:1 |
| Dark: text `#ECE7DD` on `#1A1D1F` | 13.8:1 |
| Dark: primary `#6FA67C` on `#1A1D1F` | 6.0:1 |
| Dark: muted `#A9A49A` on surface `#23272A` | 6.1:1 |
| Dark: CTA text `#1A1D1F` on `#E89456` | 7.1:1 |

White text on the brand orange is only 3.2:1, so **CTA text is always charcoal**, never white.

## Typography

| Role | Family | Notes |
| --- | --- | --- |
| Headings | **Bitter** (500, 700) | A slab serif with a sturdy, practical feel. Falls back to Rockwell, then Georgia. |
| Body | **Atkinson Hyperlegible** (400, 400 italic, 700) | Designed by the Braille Institute for legibility. Falls back to the system UI font. |

Both are Google Fonts, **self-hosted** through Fontsource so no request goes to a third party.

Atkinson Hyperlegible draws zero with a slash (`0`) to tell it apart from the letter O. This is intentional for legibility in the tools' numbers.

- Base size 17px (`html { font-size: 106.25% }`), line height 1.6; articles 1.05rem / 1.7.
- Headings use `text-wrap: balance`; body uses `text-wrap: pretty`.
- Measure: `--measure: 40rem` for reading text.

## Layout

- `.wrap`: maximum width 74rem, with a 16px side gutter on mobile and 24px from 640px.
- The header is sticky. The primary nav collapses to a menu button below 1100px.
- Articles use a two-column layout from 1000px, with a sticky table of contents.

## Components

| Component | File | Notes |
| --- | --- | --- |
| Header (mobile menu, search, theme toggle) | `src/components/Header.astro` | Pagefind UI loads on first open. `/` opens search. |
| Footer | `src/components/Footer.astro` | Always dark charcoal. Includes 999 / 111 / 105. |
| Breadcrumbs | `src/components/Breadcrumbs.astro` | Plus `BreadcrumbList` JSON-LD from `BaseLayout`. |
| Tool card | `src/components/ToolCard.astro` | Live tools have a solid green border and the whole card is a link. Coming-soon tools have a dashed border and badge, and are **not** links. |
| Guide card | `src/components/GuideCard.astro` | Sand top rule, whole card clickable. |
| Category card | `src/components/CategoryCard.astro` | Icon + label + blurb row. |
| Buttons | `.btn` + `.btn-primary` (orange CTA) / `.btn-secondary` (forest) / `.btn-ghost` (outline) / `.btn-sm` | Minimum 44px target. |
| Callout | `src/components/Callout.astro` | `info` / `warning` / `safety`. |
| Checklist item | `.check-item` | Checkbox + label, dashed separator. |
| Form field | `.field`, `.field-label`, `.field-help`, `.field-error`, `.input` | In React: `NumberField`, `ChoiceGroup`, `DaysField` in `src/components/tools/ui.tsx`. |
| Choice chips | `.choice-row` / `.choice` | Real radio inputs, styled. |
| Results panel | `.panel.results` | Green top border; headline wrapped in `aria-live="polite"`. |
| Stats | `.stat`, `.stat-value`, `.stat-label` | Tabular numerals. |
| Coming soon badge | `src/components/ComingSoonBadge.astro` | |
| Table of contents | `src/components/TableOfContents.astro` | h2/h3, shown when there are more than two headings. |
| Last reviewed stamp | `src/components/LastReviewed.astro` | |
| Newsletter form | `src/components/NewsletterForm.astro` | Honeypot, progressive enhancement. |
| Ad slot | `src/components/AdSlot.astro` | Renders nothing unless `PUBLIC_ADS_ENABLED=true`. |
| Icons | `src/components/Icon.astro` (Astro), `lucide-react` (islands) | Lucide, ISC licence. Inlined at build time. |
| Logo | `src/components/Logo.astro`, `public/favicon.svg` | Original mark: a house with a tick. |

## Motion

Minimal. There are colour transitions on buttons and no entrance animations. `prefers-reduced-motion: reduce` disables transitions and animations globally.

## Dark mode

Follows the system setting by default. The header toggle stores an override in `localStorage` (`stayprepped:theme`); an inline script applies it before paint to avoid a flash.

## Print

`@media print` hides the header, footer, navigation, forms (`.no-print`), the newsletter and the TOC; switches to black on white; and prints external link URLs after links in articles. Tool results and checklists print cleanly.

## Accessibility checklist

- Skip link, landmarks (`header`, `nav`, `main`, `footer`), one `h1` per page.
- Visible focus: a 3px orange outline.
- Every input has a visible `<label>`. Errors are linked with `aria-describedby` and `aria-invalid`.
- Results announce through `aria-live`.
- The score stepper moves focus to the new step heading, and uses `aria-current="step"`.
- Touch targets are at least 44px for buttons.
- CSS is in cascade layers (`@layer base`, `@layer components`) so Tailwind utilities override base element styles predictably.

## Design pass 2 (October 2026): cards, area colours, illustrations

### Area tones
Each content area has a tint family in `global.css` (`--water-*`, `--kits-*`, `--power-*`, `--home-*`, `--skills-*`, `--tools-*`, `--gov-*`, `--neutral-*`), each with a light and dark value. Add `.tone-<name>` to any wrapper and everything inside (bands, cards, chips, labels, tick lists, illustrations) picks it up through the `--t-*` variables. Mappings live in `src/lib/site.ts` (`GUIDE_CATEGORY_TONE`, `TOOL_CATEGORY_TONE`, `GUIDE_HUBS`).

| Area | Tone |
| --- | --- |
| Food & Water | `water` (green) |
| Emergency kits, gear, budget | `kits` (sand/earth) |
| Power cuts | `power` (slate, warm highlight) |
| Family & Home | `home` (warm clay) |
| Survival skills | `skills` (deep moss) |
| Tools | `tools` (primary green) |
| Why prepare / official advice | `gov` (calm blue-grey) |

All text pairs (body, muted, links, area ink, chip ink) were checked at 4.5:1 or better on each band and surface, in both themes.

### Card primitive
`.card` (+ `.is-link` when the whole card is a link via `.stretched`): 1.5rem radius (`corner-shape: squircle` where supported), tinted surface, same-hue border, two-layer shadow. Hover/focus-within lifts 3px, deepens the shadow, strengthens the border and nudges the `.card-cta` arrow. Motion is removed under `prefers-reduced-motion`. Parts: `.chip` / `.chip-lg` (icon squircle), `.card-art`, `.card-label`, `.card-title`, `.card-text`, `.card-cta`, `.card-meta`. Grids: `.card-grid`, `.card-grid-wide`, `.card-grid-fit`.

### Other components
- `.band` / `.band-plain`: full-width section bands; alternate them so sections separate without reading.
- `.disclosure`: a styled `<details>` for "Why this matters", tool methods and FAQs.
- `.in-short`: the three-bullet box at the top of guides (`inShort` in guide frontmatter, exactly 3).
- `.tick-list` + `.tick-ico`: static checklists. Markdown task lists (`- [ ]`) are converted to this at build time by `src/lib/rehype-stayprepped.mjs`, which also wraps each `##` section of tool pages in a disclosure.

### Illustrations
`src/components/illustrations/`: ten original flat spot illustrations (each under 1 KB), used through `<Illustration name="..." />`. They are drawn with round caps and joins to sit beside Lucide icons, and they take their colours from the area tone, so they work in dark mode with no extra assets. Decorative (`aria-hidden`) unless a `title` is passed.

### Navigation
Six top items: Start here, Guides (dropdown of `GUIDE_HUBS`), Free tools, Gear, Resources, About, plus a "Why prepare?" pill. Below 1080px the nav becomes a full-screen drawer. The dropdown is a disclosure button (`aria-expanded`), with Arrow keys inside, Escape to close and close on focus-out. Exact page matches get `aria-current="page"`; parent sections get `aria-current="true"`. The header shrinks after scrolling.
