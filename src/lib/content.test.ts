// Content integrity checks that run without building the site: every tool
// registry entry is well formed, live tools have islands, and cross-links
// between tools and guides point at files that exist.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TOOL_CATEGORY_KEYS, GUIDE_CATEGORY_KEYS } from './site';

const root = join(__dirname, '..');
const fm = (file: string) => {
  const m = readFileSync(file, 'utf8').match(/^---\n([\s\S]*?)\n---/);
  if (!m) throw new Error(`No frontmatter in ${file}`);
  return m[1];
};
const field = (src: string, key: string) => src.match(new RegExp(`^${key}: (.+)$`, 'm'))?.[1]?.replace(/^"|"$/g, '');
const list = (src: string, key: string) => {
  const m = src.match(new RegExp(`^${key}:\\n((?:  - .+\\n?)+)`, 'm'));
  return m ? m[1].trim().split('\n').map((l) => l.replace(/^\s*- /, '').trim()) : [];
};

const toolsDir = join(root, 'content/tools');
const guidesDir = join(root, 'content/guides');
const toolFiles = readdirSync(toolsDir).filter((f) => f.endsWith('.md'));
const guideSlugs = new Set(readdirSync(guidesDir).map((f) => f.replace(/\.mdx?$/, '')));
const toolSlugs = new Set(toolFiles.map((f) => f.replace(/\.md$/, '')));

describe('tool registry', () => {
  it('has the 6 live tools, 7 Phase 4 tools and at least 20 future tools', () => {
    const entries = toolFiles.map((f) => fm(join(toolsDir, f)));
    expect(entries.filter((e) => field(e, 'status') === 'live')).toHaveLength(6);
    expect(entries.filter((e) => field(e, 'phase') === '4')).toHaveLength(7);
    expect(entries.filter((e) => field(e, 'phase') === '5').length).toBeGreaterThanOrEqual(20);
  });

  for (const f of toolFiles) {
    const src = fm(join(toolsDir, f));
    it(`${f} is well formed`, () => {
      expect(field(src, 'slug')).toBe(f.replace(/\.md$/, ''));
      expect(TOOL_CATEGORY_KEYS).toContain(field(src, 'category'));
      expect(['live', 'coming-soon']).toContain(field(src, 'status'));
      for (const g of list(src, 'relatedGuides')) expect(guideSlugs.has(g), `unknown guide ${g}`).toBe(true);
    });
    if (field(src, 'status') === 'live') {
      it(`${f} (live) has an island, FAQ and safety notes`, () => {
        const page = readFileSync(join(root, 'pages/tools/[slug].astro'), 'utf8');
        expect(page).toContain(`t.slug === '${field(src, 'slug')}'`);
        expect(src).toMatch(/^faq:/m);
        expect(src).toMatch(/^safetyNotes:/m);
        expect(list(src, 'relatedGuides').length).toBeGreaterThanOrEqual(2);
        const body = readFileSync(join(toolsDir, f), 'utf8').replace(/^---\n[\s\S]*?\n---/, '');
        expect(body.split(/\s+/).filter(Boolean).length, 'at least 300 words of copy').toBeGreaterThanOrEqual(300);
      });
    }
  }
});

describe('guides', () => {
  for (const slug of guideSlugs) {
    const src = fm(join(guidesDir, `${slug}.md`));
    it(`${slug} has a valid category and existing related links`, () => {
      expect(GUIDE_CATEGORY_KEYS).toContain(field(src, 'category'));
      for (const t of list(src, 'relatedTools')) expect(toolSlugs.has(t), `unknown tool ${t}`).toBe(true);
      for (const g of list(src, 'relatedGuides')) expect(guideSlugs.has(g), `unknown guide ${g}`).toBe(true);
    });
  }
  it('has the 8 starter guides', () => {
    expect(guideSlugs.size).toBe(8);
  });
  it('has a tool spec doc for future tools', () => {
    expect(existsSync(join(root, '..', 'docs/TOOL_SPECS.md'))).toBe(true);
  });
});
