// Server-side helper that turns a Lucide icon name into an inline SVG string.
// Lucide is ISC/MIT licensed; we read its icon node data at build time so no
// icon JavaScript ships to the browser.
import nodes from 'lucide-static/icon-nodes.json';

type IconNode = [string, Record<string, string>][];
const ICONS = nodes as unknown as Record<string, IconNode>;

export function hasIcon(name: string): boolean {
  return name in ICONS;
}

export function iconSvg(name: string, opts: { size?: number; strokeWidth?: number; className?: string; label?: string } = {}): string {
  const node = ICONS[name] ?? ICONS['info'];
  const { size = 24, strokeWidth = 2, className = '', label } = opts;
  const inner = node
    .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')} />`)
    .join('');
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="icon ${className}" ${a11y}>${inner}</svg>`;
}
