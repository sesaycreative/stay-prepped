# Stay Prepped

*Be Prepared. Stay Ready. Protect What Matters.*

An emergency-preparedness website for UK households, with practical guides, free in-browser tools and printable checklists.

- **Stack:** Astro 5, React 19 islands, TypeScript, Tailwind CSS 4, Vitest, Pagefind, `@astrojs/sitemap` and the `@astrojs/vercel` adapter.
- **Output:** static pages, plus two serverless endpoints (`/api/newsletter`, `/api/contact`). In Astro 5, the old "hybrid" mode is `output: 'static'` with per-route `prerender = false`.
- **No database.** All tool data stays in the visitor's browser (`localStorage`).

## Requirements

- Node.js 18.20.8 or later (tested on Node 22)
- npm

## Run locally

```bash
npm install
npm run dev          # http://localhost:4321
```

Search (Pagefind) only works after a build, because its index is generated from the built HTML. In `npm run dev` the search dialog says so.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server. The API endpoints run here too. |
| `npm run build` | `astro check` (types), `astro build`, then `scripts/postbuild.mjs` (Pagefind index and security headers). |
| `npm test` | Vitest: calculator logic, form validation and content integrity. |
| `npm run linkcheck` | Checks every internal link and anchor in `dist/client` resolves. Run after a build. |
| `npm run check` | Type check only. |

`astro preview` is not supported by the Vercel adapter. To view the static build locally, serve `dist/client` with any static server (for example `npx serve dist/client`). The API endpoints need `npm run dev` or a Vercel deployment.

## Project structure

```
src/
  content.config.ts            Collection schemas (guides, tools, gear)
  content/guides/*.md          Articles (file name = slug)
  content/tools/*.md           Tool registry (live and coming soon)
  content/gear/*.md            Buying guides
  components/                  Astro components (header, cards, callouts…)
  components/tools/*.tsx       React islands for the tools, plus shared ui.tsx
  layouts/                     Base, Article, Hub and Page layouts
  lib/calculators/*.ts         Pure calculation logic + *.test.ts
  lib/forms.ts                 Endpoint validation and rate limiting
  lib/site.ts, seo.ts, icons.ts
  data/checklists.ts           Printable checklists and official links
  pages/                       Routes, including api/*.ts endpoints
  styles/global.css            Design tokens and base styles
docs/                          ADDING_A_TOOL, TOOL_SPECS, DESIGN_SYSTEM
scripts/                       postbuild.mjs, check-links.mjs
```

## Content: the file-based CMS

- **New guide:** add `src/content/guides/<slug>.md` with the frontmatter in `content.config.ts` (`title`, `description`, `category`, `publishedAt`, `reviewedAt`, `sources[]`, `relatedTools[]`, `relatedGuides[]`, `featured`). Only cite sources you have checked exist.
- **New tool:** see [`docs/ADDING_A_TOOL.md`](docs/ADDING_A_TOOL.md).
- **Checklists and official links:** edit `src/data/checklists.ts`.

The build fails on invalid frontmatter or on a related link to a guide or tool that does not exist.

A git-based admin UI (Keystatic or Decap) is planned as Phase 1b; see `BUILD_REPORT.md`.

## Environment variables

Copy `.env.example` to `.env` for local development, or set these in the Vercel project settings. **Every variable is optional**, and the site builds and works without any of them.

| Variable | Purpose |
| --- | --- |
| `SITE_URL` | Canonical origin. Defaults to `https://stayprepped.co.uk`; override for preview deployments. Used for canonical URLs, Open Graph, the sitemap and robots.txt. |
| `RESEND_API_KEY` | Enables the newsletter and contact form through [Resend](https://resend.com). |
| `RESEND_SEGMENT_ID` | The Resend segment (formerly "audience") that newsletter sign-ups are added to. |
| `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` | Where contact messages go, and the verified sender address. |
| `PUBLIC_CONTACT_EMAIL` | Shown as a mailto link on `/contact` (defaults to `updates@stayprepped.co.uk`). When the form is not configured, the form offers to open the visitor's email app instead. |
| `PUBLIC_ANALYTICS` | `vercel` (Vercel Web Analytics) or `plausible`. Both are cookieless. Leave it empty for no analytics. |
| `PUBLIC_PLAUSIBLE_DOMAIN` | Required when `PUBLIC_ANALYTICS=plausible`. |
| `PUBLIC_ADS_ENABLED` | `AdSlot` renders nothing unless this is `true`. No ad network is wired up. |

If Resend is not configured, the newsletter endpoint replies that sign-up is not live yet and stores nothing. The contact endpoint replies that the form is not live yet.

## Deploy (Vercel)

1. Push the repo to GitHub and import it in Vercel. The framework preset is detected as Astro.
2. Build command `npm run build` (the default); output is handled by the adapter.
3. Set `SITE_URL`, plus any optional variables above.
4. Deploy.

Security headers (CSP, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`) are defined in `vercel.json`. `scripts/postbuild.mjs` also copies them into `.vercel/output/config.json` so they apply to the prebuilt output.

The API endpoints have a small in-memory rate limiter and a honeypot field. Serverless instances do not share memory, so for stronger protection add a Vercel Firewall rate-limit rule on `/api/*`.

**Other hosts:** swap `@astrojs/vercel` for `@astrojs/netlify` or `@astrojs/cloudflare` in `astro.config.mjs`, and move the headers into that host's config.

## Testing

```bash
npm test
```

- `src/lib/calculators/*.test.ts`: every formula in brief §6, unit conversions, validation, and the edge cases zero people, 365 days and invalid input.
- `src/lib/forms.test.ts`: email and contact validation, the rate limiter, HTML escaping.
- `src/lib/content.test.ts`: the registry shape, that live tools are wired to an island, and that cross-links exist.

## Licences

- Code: add a licence of your choice before publishing.
- Icons: [Lucide](https://lucide.dev), ISC licence.
- Fonts: Montserrat and Atkinson Hyperlegible, SIL Open Font License, via Fontsource.
