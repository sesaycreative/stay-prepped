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

export default function rehypeStayPrepped() {
  return (tree, file) => {
    tickLists(tree);
    const path = String(file?.path ?? file?.history?.[0] ?? '');
    if (path.includes('/content/tools/')) toolDisclosures(tree);
  };
}
