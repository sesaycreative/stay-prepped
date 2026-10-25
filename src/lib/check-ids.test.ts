import { describe, expect, it } from 'vitest';
import { duplicateIds } from '../../scripts/check-ids.mjs';

describe('duplicate id check', () => {
  it('finds repeated ids', () => {
    expect(duplicateIds('<p id="a"></p><span id="a"></span><b id="b"></b>')).toEqual([{ id: 'a', n: 2 }]);
  });
  it('ignores ids inside scripts, templates and comments', () => {
    expect(duplicateIds('<p id="a"></p><!-- <p id="a"> --><script>const s = \'<p id="a">\'</script><template><p id="a"></p></template>')).toEqual([]);
  });
  it('does not confuse data-id or aria attributes with id', () => {
    expect(duplicateIds('<p id="a" data-id="a"></p><p aria-labelledby="a"></p>')).toEqual([]);
  });
});

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Runs against the built site when it exists (after `npm run build`).
const DIST = join(__dirname, '../../dist/client');
describe.skipIf(!existsSync(DIST))('built pages', () => {
  const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
  const pages = existsSync(DIST) ? walk(DIST).filter((f) => f.endsWith('.html') && !f.includes('/pagefind/')) : [];
  it('have no duplicate element ids', () => {
    const bad = pages.map((f) => ({ f, d: duplicateIds(readFileSync(f, 'utf8')) })).filter((x) => x.d.length);
    expect(bad).toEqual([]);
  });
  it('have at most one newsletter form each', () => {
    const multi = pages.filter((f) => (readFileSync(f, 'utf8').match(/<form[^>]*data-newsletter/g) ?? []).length > 1);
    expect(multi).toEqual([]);
  });
});
