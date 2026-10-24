# Build report: Stay Prepped

Build date: 24 October 2026. Spec: `stay-prepped-brief.md` (revised master prompt). This report separates what is **done**, **partial** and **not started**, and lists every assumption made.

## Verification results

| Check | Result |
| --- | --- |
| `npm install` | OK (npm registry). `npm audit` reports advisories in transitive dependencies; not addressed (see Partial). |
| `npm run build` (`astro check` + `astro build` + postbuild) | **0 errors, 0 warnings, 0 hints.** 40 HTML pages; 2 serverless endpoints. |
| `npm test` (Vitest) | **88 tests passing** across 6 files. |
| `npm run linkcheck` (all internal `href`/`src`/`action` in `dist/client`, including `#anchors`) | **1,795 references across 40 pages; all resolve.** |
| Islands in built HTML | All three tool pages contain one `<astro-island client="load">` with server-rendered form markup and a hashed component bundle. |
| Browser test (Playwright/Chromium against the static build) | Water: totals, zero-people error, negative-number error, pregnant > people error, 400-days error, 365 days, CSV download, `localStorage` restore. Food: vegan swap, .txt download. Score: missing-answer error, Back, full 10-step run, result saved, survives reload, "Clear my result" empties storage. Search returns results. Mobile menu opens. No page errors. |
| CSP check | Built site served with the `vercel.json` CSP: islands hydrate and Pagefind search works, with no CSP violations in the console. |
| API endpoints (dev server) | Newsletter and contact return honest "not live yet" messages without env vars; validation errors are field-specific; rate limiter returns 429 after 5 newsletter attempts. |
| Sitemap / robots | `sitemap-index.xml` + `sitemap-0.xml` (39 URLs; 404 excluded); `robots.txt` points to the sitemap and disallows `/api/`. |
| JSON-LD | `WebSite` (home), `Article` (guides, gear), `BreadcrumbList` (all non-home pages), `FAQPage` (tool pages). |

## Done

### Phase 1: platform
- **Design system** (§2): tokens in `src/styles/global.css` (light and dark, contrast-checked), Bitter + Atkinson Hyperlegible self-hosted, an original house-and-tick SVG mark and favicon, a generated OG image, a print stylesheet and reduced-motion support. Documented in `docs/DESIGN_SYSTEM.md`.
- **Components** (§2): header with mobile menu, search and theme toggle; footer; breadcrumbs; tool, guide and category cards; buttons (primary, secondary, ghost); callouts (info, warning, safety); checklist item; form fields with label, help and error; results panel; Coming Soon badge; table of contents; last-reviewed stamp; newsletter form; `AdSlot` (renders nothing unless configured).
- **Navigation** (§3): all 10 nav items, each linking to a real page; breadcrumbs on every non-home page; Pagefind search dialog.
- **Homepage** (§4): hero with both CTAs; Getting Started; Free Tools (live first, then 3 coming soon); Popular Guides; Preparedness Topics; Preparedness Score CTA; Latest Articles; Newsletter; Gear section (shown because one gear guide exists).
- **Tools hub** (§5): registry-driven from `src/content/tools/*.md`, grouped by the 6 categories, live tools first. Coming-soon cards are not links and have no buttons.
- **Tool page template** (§5): title, summary, instructions, island, results, print and download, how it is calculated, assumptions, safety notes, FAQ, related guides, last reviewed. Each has ≥300 words of explanatory copy.
- **Pages** (§10): `/start`, `/guides` (+ 7 category pages, built only for categories with content), `/food-water`, `/emergency-kits`, `/survival-skills`, `/gear` (+ 1 guide), `/tools`, `/resources` (+ 4 printable checklists), `/about`, `/contact`, `/privacy`, `/cookies`, `/terms`, `/disclaimer`, `/affiliate-disclosure`, `404`.
- **SEO** (§11): per-page title, description, canonical, Open Graph and Twitter card, JSON-LD, sitemap, robots.txt, clean slugs.
- **Privacy and security** (§12): no cookies. Tool state and theme are in `localStorage` only. Endpoints validate input, use a honeypot and are rate-limited (in-memory, per instance). Secrets come only from env vars. Security headers are in `vercel.json` and are also injected into `.vercel/output/config.json` by `scripts/postbuild.mjs`. Skip link, landmarks, focus styles and `aria-live` results are in place.
- **Newsletter and contact** (§0 #8, §10): `/api/newsletter` uses Resend when `RESEND_API_KEY` and `RESEND_SEGMENT_ID` are set; otherwise it says plainly that sign-up is not live and stores nothing. `/api/contact` sends through Resend when configured; otherwise, if `PUBLIC_CONTACT_EMAIL` is set, it offers a prefilled `mailto:` link.
- **Analytics** (§0 #8): cookieless, env-gated (`PUBLIC_ANALYTICS=vercel|plausible`); off by default.
- **Docs**: `README.md`, `docs/ADDING_A_TOOL.md`, `docs/TOOL_SPECS.md`, `docs/DESIGN_SYSTEM.md` and this report.

### Phase 2: tools (fully functional)
- **Tool 1, Food Storage Calculator**: every formula from §6 (2,000 / 1,500 kcal, ×1.25, 40/20/15/15/10 split, the stated densities, vegetarian/vegan protein swap). Outputs total kcal, per-group kg or litres, example items, storage tips, a tickable shopping checklist and a 3/7/14/30/90-day comparison. Downloads as .txt and .csv.
- **Tool 2, Water Storage Calculator**: 4 L base (3 drinking + 1 cooking/hygiene); +1 hot; +1 pregnant or nursing; +2 hygiene; dogs 0.5/1/1.5; cats 0.25. Outputs the drinking vs hygiene vs pets split, litres, UK gallons (4.54609) and US gallons (3.785411784) labelled separately, 5/10/25 L container counts (rounded up) and rotation guidance. Downloads as .txt and .csv.
- **Tool 3, Home Preparedness Score**: 10 categories × 3 questions, 0–3 points. Category = points ÷ 9 × 10 (one decimal); overall = mean × 10, rounded. Bands as specified. Shows category bars, top 3 strengths, and top 3 gaps each with a next step and links. A stepper with Back and clickable completed steps. Last result saved in `localStorage`, with "Clear my result". Downloads as .txt.
- Pure logic in `src/lib/calculators/{food,water,preparedness,shared}.ts`, with tests covering every formula and the edge cases zero people, 365 days (maximum) and invalid input (negative, decimal, blank, non-numeric, out of range, more pregnant people than people, corrupt saved data).

### Phase 3: content
- 8 starter guides (§8), each 668–892 words of body text (plus checklists and sources), UK English, no invented statistics, no named products. Each has an auto TOC, checklists, related guides and tools, sources, last-reviewed date and the "Stay Prepped editorial team" author line.
- 1 gear guide, "How to choose a water filter for emergencies": what to look for, who each type suits, limitations and price bands. No products, ratings or claimed testing. The price bands are labelled as our own rough estimates.

### Registry (Phase 4 and future)
- 7 Phase 4 tools (Tools 4–10) and 13 future tools registered as `coming-soon` (the brief asked for at least 8).

## Partial (with remaining work)

1. **`docs/TOOL_SPECS.md`: original specs unavailable.** The brief says to copy "the original prompt's input/output specs" for Tools 4–10, but the original master prompt was not provided; the brief itself names the tools only. The doc contains the brief's text verbatim, every constraint the brief does state (for example Tool 9's "stored only on this device" notice), and *draft* specs clearly marked as drafts. **Remaining:** paste in the original specs if available, or review the drafts.
2. **Privacy policy: data controller details.** Now names Precious Memories Ltd as controller with updates@stayprepped.co.uk as the contact. Company number 17332454 and the registered address (7 Brabazon Avenue, Wallington SM6 9ES) are included. **Remaining:** name the analytics provider once chosen, and have the legal pages reviewed before launch.
3. **Production domain.** Set to `https://stayprepped.co.uk` as the default for canonical, OG, sitemap and robots URLs; `SITE_URL` overrides it for previews. **Remaining:** point the domain's DNS at the host.
4. **Rate limiting** is in-memory per serverless instance, so it is a best-effort brake. **Remaining:** add a Vercel Firewall rule on `/api/*` for robust limits.
5. **Deployment not tested on Vercel itself.** The build produces a valid `.vercel/output` (static files, a function and a config with headers), but no deployment was made from this environment. The Resend calls are written against Resend's public REST API but have not been run against a live account.
6. **`npm audit`** reports advisories in transitive dependencies. Not triaged; run `npm audit` and upgrade as appropriate.
7. **Accessibility** has been built to WCAG 2.2 AA (labels, contrast-checked tokens, keyboard operation, focus management, `aria-live`) and checked in a browser, but no automated audit (axe or Lighthouse) or screen-reader test was run. **Remaining:** run axe and a VoiceOver/NVDA pass.

## Not started (documented only, as the brief specifies)

- **Phase 1b:** git-based admin UI (Keystatic or Decap). Content is file-based MDX/Markdown with typed frontmatter, which serves as the CMS for now. No admin panel was built or faked.
- **Newsletter provider wiring** beyond the env-gated Resend stub (double opt-in, welcome email, sending campaigns).
- **Phase 4/5 tools:** registry entries only (see `docs/TOOL_SPECS.md`).
- **Gear guides beyond the one template guide**; no affiliate links exist.
- **Ad network:** `AdSlot` exists but renders nothing.

## Assumptions

### Product and content
- "Hybrid output" (brief §19) is implemented as Astro 5's `output: 'static'` with `prerender = false` on the two API routes. Astro 5 removed the separate `hybrid` mode and this is its direct replacement.
- `trailingSlash: 'ignore'`; internal links use trailing slashes to match the built `/path/index.html` files.
- Nav items "Food & Water", "Emergency Kits" and "Survival Skills" are hub pages (`/food-water`, `/emergency-kits`, `/survival-skills`) that collect guides and tools, since the guide categories in §8 do not map one-to-one to them.
- Guide category pages are built only for categories that have at least one guide, to avoid empty pages. The guides index names the categories still to come.
- Resources = 4 printable checklists (home supplies, grab bag, power cut, documents) plus 10 official links, each checked with WebFetch on 24 October 2026.
- The site was written for UK readers; US guidance is cited only for the water comparison the brief asked for.

### Figures and sources
- **Verified with WebFetch on 24 October 2026 (figures quoted only, never sentences):** the UK Be Ready checklist (`beready.campaign.gov.uk`, which gov.uk/prepare now redirects to) gives **3 litres per person per day** for drinking and plans for **3 days** of supplies; Ready.gov gives **1 US gallon per person per day** for drinking and sanitation, for "several days". The NHS food-label page did not state the 2,000 kcal figure and the NHS reference-intake page could not be fetched; the British Heart Foundation food-labelling page confirmed **2,000 kcal**. The site describes it as "the adult reference intake used on UK food labels" without attributing it to the NHS.
- Every source listed in a guide's `sources` was fetched and confirmed to exist. Pages that could not be fetched (CDC, an NHS food-label page, a gov.uk emergency-alerts publication, ready.gov/power-outages) were not cited.
- WHO "Boil water" guidance was checked: it says a rolling boil is sufficient and gives no time figure, so the guides give no boiling time.
- **Child kcal (1,500)** and all densities, splits, pet and adjustment figures are the brief's own planning assumptions and are presented as such on the tool pages.
- **The comfort-food group** has no density in the brief; the calculator uses the dry-goods density (350 kcal/100 g), stated on the page.
- **Fats and dairy** are split 50/50 between oil and UHT milk (vegan: oil and nut/seed butter). **The vegetarian/vegan protein swap** is split 50/50 between tinned beans/lentils and nut butter. The brief named the foods but not the split, so these splits are stated on the page.
- **Water:** children are planned at the adult rate (the brief gives one per-person figure). The pregnant/nursing count must be ≤ total people. The +1 L for hot climate and pregnancy is counted under "drinking", and the +2 L hygiene under "cooking and hygiene".
- **Input limits:** people ≤ 50 per field and pets ≤ 20 per field, to catch typos; days 1–365 (the brief's custom range).
- **Score:** unanswered questions count as 0 in the pure function, but the UI requires all three answers before moving on. Ties keep category order. Strengths exclude 0-scoring categories; gaps exclude categories already at 10.
- **Gear price bands** (£ ranges) are our own rough estimates, labelled as such, not a survey.

### Technical
- Package versions: Astro 5.18.2 (the brief says Astro 5; the latest major on npm is 7), `@astrojs/react` 4.4.2, `@astrojs/mdx` 4.3.14, `@astrojs/vercel` 8.2.11, `@astrojs/sitemap` 3.6.0, React 19, Tailwind 4, Vitest 3, TypeScript 5, Pagefind 1.5.2.
- Fonts are from Google Fonts' catalogue (Bitter, Atkinson Hyperlegible), self-hosted through Fontsource rather than loaded from fonts.googleapis.com, to stay cookieless and third-party-free.
- Icons are Lucide: inlined at build time in Astro components, and `lucide-react` in islands.
- Pagefind is run through its Node API in `scripts/postbuild.mjs`, writing the index to both `dist/client/pagefind` and `.vercel/output/static/pagefind`. The Vercel adapter copies static files before the postbuild step runs.
- `astro preview` is unsupported by the Vercel adapter, so the static build was verified by serving `dist/client`, and the endpoints were tested through `astro dev`.
- The task list (TaskCreate) tool was not available in this environment, so progress was tracked in this report instead.
