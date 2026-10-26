# Security audit — 26 October 2026

Production-dependency audit (`npm audit --omit=dev`) of Stay Prepped, run on
`main` at `98e84f1` before the `security-upgrade` branch, and again after it.

## Context: what is actually exposed

Stay Prepped is a static Astro site. Every page is rendered at build time from
content in this repository; no visitor-supplied text is ever rendered into a
page. The only code that runs on demand in production is the `_render`
serverless function on Vercel, which serves:

- `/api/newsletter` and `/api/contact` (form handlers; validation is hand-written
  in `src/lib/forms.ts`, no Zod at runtime);
- `/_image` — Astro's image-optimisation endpoint, which the Vercel adapter
  routes to the serverless function even in `output: 'static'`;
- `/_server-islands/*` (unused by this site).

So "build-time only" advisories (Zod, path-to-regexp, sharp as used by the
build, esbuild) cannot be reached by a visitor, while anything in Astro's
request handling or the `/_image` endpoint can be.

## Before (main @ 98e84f1)

`npm audit --omit=dev`: **10 vulnerabilities — 1 critical, 7 high, 0 moderate, 2 low.**

Installed versions: astro 5.18.2, @astrojs/vercel 8.2.11, @astrojs/mdx 4.3.14,
@astrojs/sitemap 3.6.0, zod 3.25.76, sharp 0.34.5, path-to-regexp 6.1.0
(via @vercel/routing-utils 5.3.3), esbuild 0.27.7 (astro's copy), zod-to-ts 1.2.0.

| Package (installed) | Severity | Advisory | Plausibly applies here? |
| --- | --- | --- | --- |
| astro 5.18.2 | critical | GHSA-26w7-cxv4-gfx2 — RCE through AVIF image optimisation (< 7.2.8) | **Yes.** `/_image` is served by the production serverless function, so the image pipeline is reachable at runtime, not just at build. Highest-priority item. |
| astro 5.18.2 | high | GHSA-2pvr-wf23-7pc7 — Host-header SSRF in prerendered error-page fetch (< 6.4.6) | **Partly.** Only on-demand routes (the two API endpoints and `/_image`) can trigger the error-page fetch. Low impact on Vercel but reachable. |
| astro 5.18.2 | high | GHSA-8hv8-536x-4wqp — reflected XSS via unescaped slot name (< 6.3.3) | Unlikely. Slot names come from templates in this repo, never from requests. |
| astro 5.18.2 | moderate | GHSA-j687-52p2-xcff — XSS in `define:vars` (< 6.1.6) | Unlikely. `define:vars` values are build-time constants. |
| astro 5.18.2 | moderate | GHSA-jrpj-wcv7-9fh9, GHSA-f48w-9m4c-m7f5 — XSS via spread attribute names (< 7.0.6) | Unlikely. No visitor data reaches component props. |
| astro 5.18.2 | moderate | GHSA-4g3v-8h47-v7g6, GHSA-7pw4-f3q4-r2p2 — XSS via view-transition / `transition:*` values (≤ 7.0.9) | No. The site does not use view transitions. |
| astro 5.18.2 | moderate | GHSA-376h-93r7-7g6f — base-path boundary check bypass (≤ 7.2.3) | No. No `base` is configured. |
| astro 5.18.2 | moderate | GHSA-98hj-9722-w3j8 — XSS via `<script>`/`<style>` content in JSX/MDX (< 7.3.2) | Unlikely. MDX content is authored in this repo. |
| astro 5.18.2 | low | GHSA-xr5h-phrj-8vxv — server-island parameter replay (< 6.1.10) | No. Server islands are not used. |
| zod 3.25.76 (via astro, @astrojs/sitemap, zod-to-ts) | high | GHSA-mrhx-c7xc-m3w5 — memory exhaustion on oversized constrained collections (< 4.6.6) | No. Zod validates content-collection frontmatter at build time only; the API routes do not use it. |
| path-to-regexp 6.1.0 (via @vercel/routing-utils → @astrojs/vercel) | high | GHSA-9wv6-86v2-598j — backtracking regular expressions (< 6.3.0) | No. Used by the adapter at build time to emit the Vercel routes config; not loaded at runtime. |
| sharp 0.34.5 (via astro) | high | GHSA-f88m-g3jw-g9cj, GHSA-rgj7-g3m4-5g8c, GHSA-wq5f-xc86-pv6w — libvips / libheif / librsvg CVEs (< 0.35.5) | **Partly.** Build-time processing of the repo's own images is safe, but `/_image` can call sharp at runtime (see the critical item). |
| esbuild 0.27.7 (astro's copy) | low | GHSA-g7r4-m6w7-qqqr — arbitrary file read from the dev server on Windows (< 0.28.1) | No. Dev server only, Windows only. |
| @astrojs/vercel 8.2.11 | high (transitive) | GHSA-mr6q-rp88-fx84 — path override via `x-astro-path` header (< 10.0.2) | **Partly.** Affects the on-demand function's routing; the only on-demand routes are the API endpoints and `/_image`. |
| @astrojs/mdx 4.3.14, @astrojs/sitemap 3.6.0, zod-to-ts 1.2.0 | low–high (transitive) | Flagged only because they depend on the vulnerable astro / zod above | Same assessment as the package they inherit from. |

Summary before: of the 10 findings, the one that genuinely matters is the
critical AVIF RCE in Astro's image endpoint, because `/_image` is live in
production. Everything else is build-time only, dev-only, or needs a code path
this site does not have.

## Upgrade steps and results

_(filled in below as the `security-upgrade` branch progresses)_
