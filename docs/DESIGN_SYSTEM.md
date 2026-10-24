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
| `--c-sand` | `#D6D8DE` | n/a | Card top rules, TOC rule, shadows, selection |
| `--bg` | `#FBFBFC` | `#1A1D1F` | Page background |
| `--accent` | `#2F5D3A` | `#8FC29B` | Filled primary buttons (off-white text in light, charcoal in dark). Orange `--c-orange` is now used **only inside illustrations**. |

### Contrast (WCAG 2.2 AA, checked)

| Pair | Ratio |
| --- | --- |
| Charcoal text on background | 13.7:1 |
| Forest on background | 7.0:1 |
| White on forest | 7.6:1 |
| White `#FFFFFF` on forest (primary button) | 7.3:1 |
| Off-white on hover `#244A2E` | 9.14:1 |
| Muted `#5C6166` on background | 5.7:1 |
| Earth text `#6E5236` on background | 6.5:1 |
| Dark: text `#ECE7DD` on `#1A1D1F` | 13.8:1 |
| Dark: primary `#6FA67C` on `#1A1D1F` | 6.0:1 |
| Dark: muted `#A9A49A` on surface `#23272A` | 6.1:1 |
| Dark: button text `#1A1D1F` on `#8FC29B` | 8.36:1 |
| Dark: button text on hover `#A7D2B1` | 10.08:1 |

Buttons: the filled primary is forest green; the secondary/ghost button is outlined in the same green. Focus rings are green too (3px, 2px offset; 6.96:1 light, 8.36:1 dark). Orange is never an action colour.

## Typography

| Role | Family | Notes |
| --- | --- | --- |
| Headings | **Montserrat** (600, 700, 800 for the homepage headline) | A clean geometric sans. Falls back to the system UI font. |
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
| Buttons | `.btn` + `.btn-primary` (filled green) / `.btn-secondary` and `.btn-ghost` (green outline) / `.btn-sm` | Minimum 44px target. |
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
- Visible focus: a 3px green outline (offset 2px).
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
`.card` (+ `.is-link` when the whole card is a link via `.stretched`): 1.5rem radius (`corner-shape: squircle` where supported), tinted surface, same-hue border, two-layer shadow. Hover/focus-within is deliberately obvious: the card lifts 6px, the shadow deepens, the surface brightens a step (`--t-surface-hover`), a 2px ring in the area's strong colour appears, the illustration scales to 1.04 and the `.card-cta` arrow slides right and underlines (180ms ease-out). Under `prefers-reduced-motion` the movement is removed and only the colour and border changes remain. Parts: `.chip` / `.chip-lg` (icon squircle), `.card-art`, `.card-label`, `.card-title`, `.card-text`, `.card-cta`, `.card-meta`. Grids: `.card-grid`, `.card-grid-wide`, `.card-grid-fit`.

### Other components
- `.band` / `.band-plain`: full-width section bands; alternate them so sections separate without reading.
- `.disclosure`: a styled `<details>` for "Why this matters", tool methods and FAQs.
- `.in-short`: the three-bullet box at the top of guides (`inShort` in guide frontmatter, exactly 3).
- `.tick-list` + `.tick-ico`: static checklists. Markdown task lists (`- [ ]`) are converted to this at build time by `src/lib/rehype-stayprepped.mjs`, which also wraps each `##` section of tool pages in a disclosure.

### Illustrations
`src/components/illustrations/`: ten original flat spot illustrations (each under 1 KB), used through `<Illustration name="..." />`. They are drawn with round caps and joins to sit beside Lucide icons, and they take their colours from the area tone, so they work in dark mode with no extra assets. Decorative (`aria-hidden`) unless a `title` is passed.

### Navigation
Six top items: Start here, Guides (dropdown of `GUIDE_HUBS`), Free tools, Gear, Resources, About, plus a "Why prepare?" pill. Below 1080px the nav becomes a full-screen drawer. The dropdown is a disclosure button (`aria-expanded`), with Arrow keys inside, Escape to close and close on focus-out. Exact page matches get `aria-current="page"`; parent sections get `aria-current="true"`. The header shrinks after scrolling.

### Guide reading experience (October 2026, round 4)
Guides and gear guides are restructured at build time by `src/lib/rehype-stayprepped.mjs`, so Markdown stays plain:
- **Lead:** the first paragraph gets `.lead` (larger, 60ch, area-coloured rule).
- **Key numbers:** `keyFacts` in frontmatter (2-4 items of `value`, `label`, optional `note`) render as tiles after the lead. Only use figures already in the guide.
- **Sections:** each `##` and its content becomes a `.g-section`; every other one gets a light area tint. Headings get a numbered chip, unless the headings carry their own conflicting numbers (e.g. "Method 1"), in which case a plain marker is used. A leading "1." or "Step 1:" is hidden visually (still read out and kept in the anchor) because the chip shows it.
- **Lists:** bullets that all start with a bold term become a two-column `.term-list`; four or more short plain bullets become a `.chip-list`; ordered lists become a `.step-list` with numbered chips and a connector; task lists are tick lists; tables are wrapped in a scrollable `.table-wrap` with a tinted header and row banding.
- **Navigator:** `TableOfContents.astro` shows numbered h2s, unfolds the active section's h3s, tracks scroll with an IntersectionObserver, and draws a reading-progress bar under the header. Below 1000px it is a closed "Jump to a section" disclosure.
- **Sources:** a quiet footnote block after the related cards.
- The plugin's source hash is passed as an option in `astro.config.mjs` so Astro's Markdown cache is cleared whenever the plugin changes.

## Light-mode area colours (round 6: derived in OKLCH)

The light-mode area tints were rebuilt from scratch rather than nudged. Run `python3 scripts/derive-tints.py` to reproduce them; it prints every value and the contrast and separation checks. The method:

1. **Anchors.** The cool neutrals (page `#FBFBFC` L 0.988, band `#F5F5F7` L 0.971, both at hue ≈ 286° with chroma under 0.003) and the brand forest `#2F5D3A` (L 0.435, C 0.077, h 150°).
2. **One lightness and chroma per role, for every area**, so the areas read as one family that differs only in hue. Colours outside sRGB keep their L and hue and lose a little chroma until they fit. Bands sit just below the neutral band's lightness (0.955 vs 0.971) with low chroma, so they read as a clean tint of the grey rather than a pastel.

| Role | OKLCH L | OKLCH C | Used for |
| --- | --- | --- | --- |
| Band | 0.955 | 0.020 | Section bands, illustration circles, table headers |
| Surface | 0.976 | 0.012 | Card surfaces |
| Border | 0.860 | 0.050 | Card borders, illustration fills |
| Strong | 0.600 | 0.100 | Hover ring, rules, active states (≥ 3:1 on its surface) |
| Chip | 0.910 | 0.042 | Icon chip fill |
| Ink | 0.410 | 0.090 | Area labels, chip icons, key-number values (≥ 4.5:1) |

   Tools uses the green family one step stronger: band L 0.945 C 0.030, surface 0.970/0.018, border 0.820/0.070, strong 0.560/0.110, and a solid forest chip with white icon.

3. **Hues by harmony around the brand green (150°) and the neutral's cool cast (≈ 286°).** The ones near the neutral (power 300°, gov 240°, water 215°) keep the page cool; the warm ones (kits 85°, family 50°) stay at the same low chroma so they don't fight. Neighbours in the homepage grid (Water, Food, Kits, Power / Health, Family, Home, Weather) are at least 37° apart. Specific choices:
   - Water moves to a cool teal-blue, no longer mint.
   - Food takes the brand green itself.
   - Family (clay, 50°) and Home & documents (plum, 322°) are separate hues, so their two hero cards differ.
   - The homepage "Find your topic" band is neutral grey, so five differently coloured cards don't sit on a sixth colour.
4. **Checked programmatically.** Body text, muted text, links and area ink all reach at least 4.5:1 on their band and surface, and chip icons at least 4.5:1 on their chip. The strong colour reaches at least 3:1 on surface, band and page. Every band also differs visibly from the neutral `#F5F5F7` band (ΔE OKLab ≥ 0.024).

| Area | Hue | Band | Surface | Border | Strong | Chip | Ink | Min text contrast | Min UI contrast |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Water | 215° | `#e2f4f9` | `#eff9fc` | `#acdae6` | `#1b8fa5` | `#c3e9f3` | `#015463` | 5.58:1 | 3.36:1 |
| Food | 148° | `#e8f4e9` | `#f2f9f3` | `#bcdbbf` | `#54915d` | `#cfead2` | `#22572d` | 5.58:1 | 3.32:1 |
| Emergency kits / grab bag | 85° | `#f6efe1` | `#fbf7ee` | `#e0cfac` | `#9c7b31` | `#eee0c2` | `#5f4600` | 5.52:1 | 3.47:1 |
| Power cuts | 300° | `#f2edfc` | `#f8f5fe` | `#d6caee` | `#8972b3` | `#e5dcfa` | `#523e74` | 5.51:1 | 3.57:1 |
| First aid & health | 352° | `#fcebf1` | `#fef4f8` | `#ecc4d4` | `#ae6686` | `#f9d6e4` | `#6e344f` | 5.51:1 | 3.63:1 |
| Family & home (plan) | 50° | `#fcede5` | `#fef5f0` | `#edc8b4` | `#b06d47` | `#fadac9` | `#703a17` | 5.53:1 | 3.59:1 |
| Home & documents | 322° | `#f7ecf8` | `#fbf5fc` | `#e1c7e5` | `#9c6ba4` | `#efd9f2` | `#613867` | 5.51:1 | 3.62:1 |
| Why prepare / government | 240° | `#e5f2fd` | `#f0f8ff` | `#b4d6ef` | `#4188b6` | `#c9e6fb` | `#085076` | 5.55:1 | 3.40:1 |
| Survival skills | 118° | `#eff2e3` | `#f6f8ef` | `#ced6b1` | `#7b883e` | `#dee6c7` | `#46500a` | 5.56:1 | 3.40:1 |
| Tools (green, one step stronger) | 148° | `#e0f3e2` | `#edf9ee` | `#a6d1ab` | `#42864e` | `#2f5d3a` | `#255a2f` | 5.44:1 | 3.81:1 |
| Neutral (cool grey) | 286° | `#f5f5f7` | `#ffffff` | `#e2e3e8` | `#858a94` | `#e7e7ed` | `#464652` | 5.81:1 | 3.18:1 |

Utility colours on the same system:
- `--c-sand` `#dadae3` (L 0.89, C 0.012, h 286)
- `--info-bg` `#e4f3e6` (L 0.95, C 0.024, h 150)
- `--warn-bg` and `--safety-bg` `#fdeae1` (L 0.95, C 0.024, h 50)
- illustration water `#a8cfdc` (L 0.83, C 0.045, h 220)

`--c-earth-text` now points at the kits ink.

Dark mode is unchanged. The new `food` and `docs` tones reuse the dark water and home values.
