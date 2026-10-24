export const SITE = {
  name: 'Stay Prepped',
  url: 'https://stayprepped.co.uk',
  owner: 'Precious Memories Ltd',
  contactEmail: 'updates@stayprepped.co.uk',
  companyNumber: '17332454',
  address: '7 Brabazon Avenue, Wallington SM6 9ES, United Kingdom',
  tagline: 'Be Prepared. Stay Ready. Protect What Matters.',
  description:
    'Practical guides, free tools and printable checklists to help you prepare for emergencies, build resilience and become more self-reliant.',
  author: 'Stay Prepped editorial team',
  locale: 'en_GB',
  lang: 'en-GB',
} as const;

/** Area tone families (design pass 2). Each maps to a .tone-* class in global.css. */
export type Tone = 'water' | 'food' | 'kits' | 'power' | 'home' | 'docs' | 'health' | 'skills' | 'tools' | 'gov' | 'neutral';

export interface NavItem {
  label: string;
  href: string;
}
export interface NavGroupItem extends NavItem {
  icon: string;
  tone: Tone;
  /** Extra path prefixes that count as "in" this item for aria-current. */
  match?: string[];
}

/** The hubs listed under the Guides dropdown and in the mobile drawer. */
export const GUIDE_HUBS: NavGroupItem[] = [
  { label: 'Food & Water', href: '/food-water/', icon: 'droplets', tone: 'water', match: ['/guides/category/food/', '/guides/category/water/'] },
  { label: 'Emergency Kits', href: '/emergency-kits/', icon: 'backpack', tone: 'kits', match: ['/guides/category/emergency-kits/'] },
  { label: 'Power cuts', href: '/guides/category/power-outages/', icon: 'plug-zap', tone: 'power' },
  { label: 'Family & Home', href: '/family-home/', icon: 'house-heart', tone: 'home', match: ['/guides/category/family/', '/guides/category/home/'] },
  { label: 'Survival Skills', href: '/survival-skills/', icon: 'flame', tone: 'skills', match: ['/guides/category/survival-skills/'] },
  { label: 'Why prepare?', href: '/why-prepare/', icon: 'landmark', tone: 'gov' },
  { label: 'Local risk', href: '/local-risk/', icon: 'map-pin', tone: 'gov' },
  { label: 'All guides', href: '/guides/', icon: 'library-big', tone: 'neutral' },
];

/** Top bar: 6 items. "Guides" is a dropdown of GUIDE_HUBS. */
export const NAV: (NavItem | { label: 'Guides'; group: NavGroupItem[] })[] = [
  { label: 'Start here', href: '/start/' },
  { label: 'Guides', group: GUIDE_HUBS },
  { label: 'Free tools', href: '/tools/' },
  { label: 'Gear', href: '/gear/' },
  { label: 'Resources', href: '/resources/' },
  { label: 'About', href: '/about/' },
];

export const FOOTER_EXPLORE: NavItem[] = [
  { label: 'Start here', href: '/start/' },
  { label: 'Why prepare?', href: '/why-prepare/' },
  { label: 'Local risk', href: '/local-risk/' },
  { label: 'My progress', href: '/my-progress/' },
  { label: 'All guides', href: '/guides/' },
  { label: 'Food & Water', href: '/food-water/' },
  { label: 'Emergency Kits', href: '/emergency-kits/' },
  { label: 'Family & Home', href: '/family-home/' },
  { label: 'Survival Skills', href: '/survival-skills/' },
  { label: 'Free tools', href: '/tools/' },
  { label: 'Gear', href: '/gear/' },
  { label: 'Resources', href: '/resources/' },
  { label: 'About', href: '/about/' },
];

export const FOOTER_LEGAL: NavItem[] = [
  { label: 'Privacy policy', href: '/privacy/' },
  { label: 'Cookie policy', href: '/cookies/' },
  { label: 'Terms of use', href: '/terms/' },
  { label: 'Disclaimer', href: '/disclaimer/' },
  { label: 'Affiliate disclosure', href: '/affiliate-disclosure/' },
  { label: 'Contact', href: '/contact/' },
];

/** Guide categories (brief §8). */
export const GUIDE_CATEGORIES = {
  'getting-started': { label: 'Getting started', icon: 'compass', blurb: 'Where to begin if you have never prepared before.' },
  food: { label: 'Food', icon: 'wheat', blurb: 'Building a food store you will actually eat and rotate.' },
  water: { label: 'Water', icon: 'droplet', blurb: 'Storing, rotating and treating water for drinking and hygiene.' },
  'emergency-kits': { label: 'Emergency kits', icon: 'backpack', blurb: 'Grab bags, home kits and what goes in them.' },
  'power-outages': { label: 'Power cuts', icon: 'plug-zap', blurb: 'Light, warmth and communication when the electricity goes off.' },
  'first-aid-health': { label: 'First aid & health', icon: 'heart-pulse', blurb: 'First aid basics, medicines and staying well.' },
  home: { label: 'Home', icon: 'house', blurb: 'Documents, utilities and making your home more resilient.' },
  'survival-skills': { label: 'Survival skills', icon: 'flame', blurb: 'Practical skills that help when normal services stop.' },
  financial: { label: 'Financial', icon: 'piggy-bank', blurb: 'Cash, savings and insurance for when things go wrong.' },
  family: { label: 'Family', icon: 'users', blurb: 'Plans that work for everyone in your household.' },
} as const;

export type GuideCategory = keyof typeof GUIDE_CATEGORIES;
export const GUIDE_CATEGORY_KEYS = Object.keys(GUIDE_CATEGORIES) as [GuideCategory, ...GuideCategory[]];

/** Tool hub categories (brief §5). */
export const TOOL_CATEGORIES = {
  'food-water': { label: 'Food & water', icon: 'droplets' },
  'kits-supplies': { label: 'Kits & supplies', icon: 'backpack' },
  'planning-assessments': { label: 'Planning & assessments', icon: 'clipboard-check' },
  'power-energy': { label: 'Power & energy', icon: 'zap' },
  budget: { label: 'Budget', icon: 'wallet' },
  household: { label: 'Household', icon: 'house' },
} as const;

export type ToolCategory = keyof typeof TOOL_CATEGORIES;
export const TOOL_CATEGORY_KEYS = Object.keys(TOOL_CATEGORIES) as [ToolCategory, ...ToolCategory[]];

export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}


/** Area tone for each guide category. */
export const GUIDE_CATEGORY_TONE: Record<GuideCategory, Tone> = {
  'getting-started': 'tools',
  food: 'food',
  water: 'water',
  'emergency-kits': 'kits',
  'power-outages': 'power',
  'first-aid-health': 'health',
  home: 'docs',
  'survival-skills': 'skills',
  financial: 'kits',
  family: 'home',
};

/** Area tone for each tool category. */
export const TOOL_CATEGORY_TONE: Record<ToolCategory, Tone> = {
  'food-water': 'water',
  'kits-supplies': 'kits',
  'planning-assessments': 'tools',
  'power-energy': 'power',
  budget: 'kits',
  household: 'home',
};

/** Spot illustration for a guide or tool slug, where one fits. */
export const SLUG_ILLUSTRATION: Record<string, IllustrationKey> = {
  'how-much-water-to-store': 'water-storage',
  'emergency-water-purification': 'water-storage',
  'how-much-food-to-store': 'food-cupboard',
  '72-hour-emergency-bag': 'grab-bag',
  'preparing-for-a-power-cut': 'power-cut',
  'family-emergency-plan': 'family-plan',
  'essential-documents': 'documents',
  'prepping-for-beginners': 'home-safety',
  'water-storage-calculator': 'water-storage',
  'food-storage-calculator': 'food-cupboard',
  'preparedness-score': 'preparedness-score',
};
export type IllustrationKey =
  | 'water-storage' | 'food-cupboard' | 'grab-bag' | 'power-cut' | 'flood'
  | 'severe-weather' | 'family-plan' | 'documents' | 'home-safety' | 'preparedness-score' | 'first-aid';

/** Colour family for a tool's illustration (tools themselves have neutral fills). */
export const TOOL_ART_TONE: Record<string, Tone> = {
  'food-storage-calculator': 'food',
  'water-storage-calculator': 'water',
  'preparedness-score': 'gov',
};

/** Checklist id prefixes that count towards each hub's "N of M" chip. */
export const HUB_PROGRESS: Record<string, string> = {
  '/food-water/': 'guide/how-much-water-to-store/ guide/how-much-food-to-store/ guide/emergency-water-purification/ tool/food-storage-calculator/',
  '/emergency-kits/': 'guide/72-hour-emergency-bag/ resource/grab-bag/ resource/home-emergency-supplies/',
  '/guides/category/power-outages/': 'guide/preparing-for-a-power-cut/ resource/power-cut/',
  '/family-home/': 'guide/family-emergency-plan/ guide/essential-documents/ resource/essential-documents/',
  '/survival-skills/': 'guide/emergency-water-purification/',
};

/** Is `path` inside `href` (or one of its extra match prefixes)? */
export function inSection(path: string, href: string, match: string[] = []): boolean {
  if (href === '/') return path === '/';
  return [href, ...match].some((h) => path.startsWith(h));
}
