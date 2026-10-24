// Runs after `astro build` (see package.json "build").
// 1. Builds the Pagefind search index from the static HTML in dist/client.
//    The Vercel adapter has already copied static files to
//    .vercel/output/static, so the index is written to both places.
// 2. Copies the security headers defined in vercel.json into the Build Output
//    API config, so they apply to the prebuilt output as well. vercel.json
//    stays the single source of truth for headers.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import * as pagefind from 'pagefind';

const SOURCE = 'dist/client';
const VERCEL_STATIC = '.vercel/output/static';
const VERCEL_CONFIG = '.vercel/output/config.json';

// --- Pagefind ---------------------------------------------------------------
const { index, errors } = await pagefind.createIndex({});
if (!index) throw new Error(`Pagefind failed to start: ${errors.join(', ')}`);
const added = await index.addDirectory({ path: SOURCE });
if (added.errors.length) throw new Error(`Pagefind indexing errors: ${added.errors.join(', ')}`);
console.log(`[postbuild] pagefind indexed ${added.page_count} pages`);
for (const out of [`${SOURCE}/pagefind`, `${VERCEL_STATIC}/pagefind`]) {
  if (out.startsWith(VERCEL_STATIC) && !existsSync(VERCEL_STATIC)) continue;
  const res = await index.writeFiles({ outputPath: out });
  if (res.errors.length) throw new Error(`Pagefind write errors: ${res.errors.join(', ')}`);
  console.log(`[postbuild] pagefind index written to ${out}`);
}
await pagefind.close();

// --- Security headers -------------------------------------------------------
if (existsSync(VERCEL_CONFIG) && existsSync('vercel.json')) {
  const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
  const config = JSON.parse(readFileSync(VERCEL_CONFIG, 'utf8'));
  const sourceToRegex = (src) => '^' + src.replace(/\(\.\*\)/g, '(.*)').replace(/\//g, '/') + '$';
  const headerRoutes = (vercel.headers ?? []).map((h) => ({
    src: sourceToRegex(h.source),
    headers: Object.fromEntries(h.headers.map((x) => [x.key.toLowerCase(), x.value])),
    continue: true,
  }));
  // Drop identical routes from a previous run (so re-running is safe), then
  // prepend ours so they apply before the filesystem handler.
  const ours = new Set(headerRoutes.map((r) => JSON.stringify(r)));
  config.routes = (config.routes ?? []).filter((r) => !ours.has(JSON.stringify(r)));
  config.routes.unshift(...headerRoutes);
  writeFileSync(VERCEL_CONFIG, JSON.stringify(config, null, '\t'));
  console.log(`[postbuild] added ${headerRoutes.length} header routes to ${VERCEL_CONFIG}`);
}
