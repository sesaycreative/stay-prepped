// Build-time HTML tweaks for Markdown content. No client JavaScript.
//
// 1. GFM task lists ("- [ ] item") become static tick lists: the disabled
//    checkbox is replaced by a decorative tick chip, so screen readers hear a
//    plain list rather than "checkbox, not checked, disabled".
// 2. In tool pages (src/content/tools), each "## " section ("How this is
//    calculated", "Assumptions and limits") is wrapped in a <details>
//    disclosure so the explanation sits below the results without crowding.

const TICK = {
  type: 'element',
  tagName: 'span',
  properties: { className: ['tick-ico'], ariaHidden: 'true' },
  children: [
    {
      type: 'element',
      tagName: 'svg',
      properties: { xmlns: 'http://www.w3.org/2000/svg', width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round', focusable: 'false' },
      children: [{ type: 'element', tagName: 'path', properties: { d: 'M20 6 9 17l-5-5' }, children: [] }],
    },
  ],
};

const hasClass = (node, c) => {
  const cn = node?.properties?.className;
  return Array.isArray(cn) ? cn.includes(c) : typeof cn === 'string' && cn.split(' ').includes(c);
};

function walk(node, fn) {
  fn(node);
  if (node.children) for (const child of node.children) walk(child, fn);
}

function tickLists(tree) {
  walk(tree, (node) => {
    if (node.type !== 'element' || node.tagName !== 'ul' || !hasClass(node, 'contains-task-list')) return;
    node.properties.className = ['tick-list', 'prose-ticks'];
    for (const li of node.children) {
      if (li.type !== 'element' || li.tagName !== 'li') continue;
      li.properties.className = [];
      // Remove the checkbox (directly or inside a <p> for loose lists).
      const strip = (parent) => {
        parent.children = parent.children.filter((c) => !(c.type === 'element' && c.tagName === 'input'));
        for (const c of parent.children) if (c.type === 'element' && c.tagName === 'p') strip(c);
      };
      strip(li);
      // Trim the leading space left behind.
      const first = li.children.find((c) => c.type === 'text' || c.type === 'element');
      if (first?.type === 'text') first.value = first.value.replace(/^\s+/, '');
      li.children = [structuredClone(TICK), { type: 'element', tagName: 'span', properties: {}, children: li.children }];
    }
  });
}

function toolDisclosures(tree) {
  const out = [];
  let current = null;
  for (const node of tree.children) {
    if (node.type === 'element' && node.tagName === 'h2') {
      current = {
        type: 'element',
        tagName: 'details',
        properties: { className: ['disclosure', 'tool-disclosure'] },
        children: [
          { type: 'element', tagName: 'summary', properties: {}, children: [node] },
          { type: 'element', tagName: 'div', properties: { className: ['disclosure-body'] }, children: [] },
        ],
      };
      out.push(current);
    } else if (current) {
      current.children[1].children.push(node);
    } else {
      out.push(node);
    }
  }
  tree.children = out;
}


// ---------------------------------------------------------------------------
// Article reading experience (guides and gear guides only).
// ---------------------------------------------------------------------------
const el = (n, tag) => n && n.type === 'element' && (!tag || n.tagName === tag);
const textOf = (n) => (n.type === 'text' ? n.value : (n.children ?? []).map(textOf).join(''));
const addClass = (n, c) => {
  const cur = n.properties.className;
  n.properties.className = [...(Array.isArray(cur) ? cur : cur ? String(cur).split(' ') : []), c];
};
const h = (tagName, className, children = [], props = {}) => ({
  type: 'element', tagName, properties: { ...(className ? { className: [className] } : {}), ...props }, children,
});
const t = (value) => ({ type: 'text', value });

/**
 * Section numbering rule, shared with ArticleLayout (keep in sync): numbered
 * unless a heading carries its own number that differs from its position
 * (e.g. "Method 1: boiling" as the 2nd section).
 */
export function sectionNumbering(h2Texts) {
  let numbered = true;
  const prefixed = h2Texts.map((text, i) => {
    const lead = text.match(/^(?:Step\s+)?(\d+)[.:]\s+/i);
    const inner = text.match(/\b(?:Method|Step|Part)\s+(\d+)\b/i);
    const n = lead ? Number(lead[1]) : inner ? Number(inner[1]) : null;
    if (n !== null && n !== i + 1) numbered = false;
    return lead ? lead[0] : null;
  });
  return { numbered, prefixed };
}

function wrapTables(node) {
  if (!node.children) return;
  node.children = node.children.map((c) => {
    if (el(c, 'table')) return h('div', 'table-wrap', [c], { tabIndex: 0, role: 'region', ariaLabel: 'Table' });
    wrapTables(c);
    return c;
  });
}

function enhanceLists(tree) {
  wrapTables(tree);
  walk(tree, (node) => {
    if (el(node, 'ol')) addClass(node, 'step-list');
    if (!el(node, 'ul') || (node.properties.className ?? []).includes?.('tick-list')) return;
    const items = node.children.filter((c) => el(c, 'li'));
    if (items.length < 2) return;
    const containerOf = (li) => {
      const els = li.children.filter((c) => el(c) || (c.type === 'text' && c.value.trim()));
      return els.length && el(els[0], 'p') ? els[0] : li;
    };
    const leadStrong = (box) => box.children.find((c) => el(c) || (c.type === 'text' && c.value.trim()));
    // Short, plain items (e.g. a list of hazards) become a compact chip row.
    if (items.length >= 4 && items.every((li) => textOf(li).trim().length <= 32 && !li.children.some((c) => el(c, 'ul') || el(c, 'ol') || el(c, 'p')))) {
      addClass(node, 'chip-list');
      return;
    }
    if (!items.every((li) => el(leadStrong(containerOf(li)), 'strong'))) return;
    addClass(node, 'term-list');
    for (const li of items) {
      const box = containerOf(li);
      const strong = leadStrong(box);
      const idx = box.children.indexOf(strong);
      const rest = box.children.slice(idx + 1);
      // Drop a trailing colon/full stop from the label and a leading one from the body.
      const last = strong.children[strong.children.length - 1];
      if (last?.type === 'text') last.value = last.value.replace(/[:.]\s*$/, '');
      const first = rest.find((c) => c.type === 'text');
      if (first && rest.indexOf(first) === 0) first.value = first.value.replace(/^\s*[:.]?\s*/, '');
      addClass(strong, 'term-label');
      li.children = [strong, h('span', 'term-body', rest)];
    }
  });
}

function keyFactsNode(facts) {
  return h('ul', 'key-facts', facts.map((f) =>
    h('li', 'key-fact', [
      h('span', 'kf-value', [t(f.value)]),
      h('span', 'kf-label', [t(f.label)]),
      ...(f.note ? [h('span', 'kf-note', [t(f.note)])] : []),
    ]),
  ), { ariaLabel: 'Key numbers' });
}

export function enhanceArticle(tree, frontmatter = {}) {
  enhanceLists(tree);
  const kids = tree.children;
  const firstH2 = kids.findIndex((n) => el(n, 'h2'));
  const intro = firstH2 < 0 ? kids : kids.slice(0, firstH2);
  const lead = intro.find((n) => el(n, 'p'));
  const out = [];
  for (const n of intro) {
    out.push(n);
    if (n === lead) {
      addClass(n, 'lead');
      if (Array.isArray(frontmatter.keyFacts) && frontmatter.keyFacts.length) out.push(keyFactsNode(frontmatter.keyFacts));
    }
  }
  if (firstH2 < 0) { tree.children = out; return; }

  const rest = kids.slice(firstH2);
  const h2s = rest.filter((n) => el(n, 'h2'));
  const { numbered, prefixed } = sectionNumbering(h2s.map(textOf));
  let section = null;
  let i = 0;
  for (const n of rest) {
    if (el(n, 'h2')) {
      const num = numbered ? String(i + 1) : '';
      const prefix = prefixed[i];
      if (numbered && prefix) {
        // Keep the heading text (and so its slug) identical; just hide the
        // duplicate number visually, since the chip shows it.
        const ft = n.children[0];
        if (ft?.type === 'text' && ft.value.startsWith(prefix)) {
          const restText = ft.value.slice(prefix.length);
          n.children = [h('span', 'sr-only', [t(prefix)]), t(restText.charAt(0).toUpperCase() + restText.slice(1)), ...n.children.slice(1)];
        }
      }
      n.properties.dataN = num;
      addClass(n, 'g-h2');
      section = h('section', `g-section${numbered ? '' : ' is-unnumbered'}`, [n]);
      out.push(section);
      i++;
    } else if (section) {
      section.children.push(n);
    } else {
      out.push(n);
    }
  }
  tree.children = out;
}

export default function rehypeStayPrepped() {
  return (tree, file) => {
    tickLists(tree);
    const path = String(file?.path ?? file?.history?.[0] ?? '');
    if (path.includes('/content/tools/')) toolDisclosures(tree);
    if (path.includes('/content/guides/') || path.includes('/content/gear/')) {
      enhanceArticle(tree, file?.data?.astro?.frontmatter ?? {});
    }
  };
}
