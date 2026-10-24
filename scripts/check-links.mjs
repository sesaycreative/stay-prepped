// Checks every internal link and asset reference in the built site resolves
// to a file in dist/client (or to a known serverless endpoint). Also checks
// in-page #anchors. Run after `npm run build`: `npm run linkcheck`.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = 'dist/client';
const ENDPOINTS = new Set(['/api/newsletter', '/api/contact']);
if (!existsSync(ROOT)) {
  console.error(`No build found at ${ROOT}. Run npm run build first.`);
  process.exit(1);
}

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const files = walk(ROOT);
const htmlFiles = files.filter((f) => f.endsWith('.html') && !f.includes('/pagefind/'));

function resolveTarget(pathname) {
  const clean = decodeURIComponent(pathname);
  const candidates = [join(ROOT, clean), join(ROOT, clean, 'index.html'), join(ROOT, clean + '.html')];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile());
}

const idsCache = new Map();
function idsIn(file) {
  if (!idsCache.has(file)) {
    const html = readFileSync(file, 'utf8');
    idsCache.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return idsCache.get(file);
}

const broken = [];
let checked = 0;
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const pagePath = '/' + relative(ROOT, file).replace(/index\.html$/, '').replace(/\.html$/, '/');
  const refs = [...html.matchAll(/\s(?:href|src|action)="([^"]+)"/g)].map((m) => m[1]);
  for (const ref of refs) {
    if (/^(https?:|mailto:|tel:|data:|javascript:)/.test(ref) || ref.startsWith('//')) continue;
    checked++;
    const url = new URL(ref.replace(/&amp;/g, '&'), 'http://x' + pagePath);
    if (ENDPOINTS.has(url.pathname.replace(/\/$/, ''))) continue;
    const target = url.pathname === pagePath && ref.startsWith('#') ? file : resolveTarget(url.pathname);
    if (!target) {
      broken.push(`${pagePath} -> ${ref} (missing file)`);
      continue;
    }
    if (url.hash && target.endsWith('.html')) {
      const id = decodeURIComponent(url.hash.slice(1));
      if (id && !idsIn(target).has(id)) broken.push(`${pagePath} -> ${ref} (missing #${id})`);
    }
  }
}

console.log(`Checked ${checked} internal references across ${htmlFiles.length} HTML pages.`);
if (broken.length) {
  console.error(`Broken (${broken.length}):\n  ` + broken.join('\n  '));
  process.exit(1);
}
console.log('All internal links resolve.');
