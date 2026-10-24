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

export interface NavItem {
  label: string;
  href: string;
}

export const NAV: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Start Prepping', href: '/start/' },
  { label: 'Guides', href: '/guides/' },
  { label: 'Food & Water', href: '/food-water/' },
  { label: 'Emergency Kits', href: '/emergency-kits/' },
  { label: 'Survival Skills', href: '/survival-skills/' },
  { label: 'Gear', href: '/gear/' },
  { label: 'Free Tools', href: '/tools/' },
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
