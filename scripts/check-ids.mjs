// Fails if any built page has the same element id more than once. Run after
// `npm run build` (it is part of `npm run linkcheck`). Duplicate ids break
// label/for, aria-describedby and in-page anchors.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

export function duplicateIds(html) {
  // Ignore <template>, <script>, <style> and comments, which are not in the DOM tree.
  const body = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|template)\b[\s\S]*?<\/\1>/gi, '');
  const seen = new Map();
  for (const m of body.matchAll(/<[a-zA-Z][^>]*?\sid=("([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    const id = m[2] ?? m[3] ?? m[4];
    seen.set(id, (seen.get(id) ?? 0) + 1);
  }
  return [...seen].filter(([, n]) => n > 1).map(([id, n]) => ({ id, n }));
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isMain) {
  const ROOT = 'dist/client';
  if (!existsSync(ROOT)) {
    console.error(`No build found at ${ROOT}. Run npm run build first.`);
    process.exit(1);
  }
  const walk = (dir) => readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
  const pages = walk(ROOT).filter((f) => f.endsWith('.html') && !f.includes('/pagefind/'));
  let bad = 0;
  for (const f of pages) {
    const d = duplicateIds(readFileSync(f, 'utf8'));
    if (d.length) {
      bad++;
      console.error(`${relative(ROOT, f)}: ${d.map((x) => `#${x.id} ×${x.n}`).join(', ')}`);
    }
  }
  if (bad) {
    console.error(`\n${bad} page(s) have duplicate ids.`);
    process.exit(1);
  }
  console.log(`No duplicate ids across ${pages.length} HTML pages.`);
}
