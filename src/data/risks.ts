// Situations the UK government's Be Ready campaign asks households to prepare
// for. Source: https://beready.campaign.gov.uk/be-ready-for-emergencies/
// (checked 24 October 2026). Wording is our paraphrase; do not add a risk or
// a recommendation here unless it appears on that page.
import type { IllustrationKey, Tone } from '../lib/site';

export const BE_READY_URL = 'https://beready.campaign.gov.uk/be-ready-for-emergencies/';
export const NRR_URL = 'https://www.gov.uk/government/publications/national-risk-register-2025';

export interface Risk {
  id: string;
  title: string;
  /** One line: what it looks like at home. */
  looks: string;
  /** One line: a first step, from the Be Ready advice. */
  first: string;
  href: string;
  linkLabel: string;
  tone: Tone;
  art?: IllustrationKey;
  icon: string;
}

export const RISKS: Risk[] = [
  {
    id: 'power-cuts',
    title: 'Power cuts and supply interruptions',
    looks: 'No electricity, heating or running water at home for a while.',
    first: 'Keep a torch, spare batteries and a radio together, and write 105 on paper.',
    href: '/guides/preparing-for-a-power-cut/',
    linkLabel: 'Power cut guide',
    tone: 'power',
    art: 'power-cut',
    icon: 'plug-zap',
  },
  {
    id: 'flooding',
    title: 'Flooding',
    looks: 'Water coming into your home or cutting off your road.',
    first: 'Check your flood risk and agree an escape route with your household.',
    href: '/family-home/',
    linkLabel: 'Plan as a household',
    tone: 'water',
    art: 'flood',
    icon: 'house',
  },
  {
    id: 'fire',
    title: 'Fire',
    looks: 'A fire at home or nearby that means getting out fast.',
    first: 'Test your smoke alarms at least once a month.',
    href: '/guides/family-emergency-plan/',
    linkLabel: 'Make a family plan',
    tone: 'home',
    art: 'home-safety',
    icon: 'flame',
  },
  {
    id: 'severe-weather',
    title: 'Severe weather',
    looks: 'Storms, heatwaves, snow and ice that keep you at home.',
    first: 'Have 3 days of water, food and warm layers ready indoors.',
    href: '/survival-skills/',
    linkLabel: 'Coping at home',
    tone: 'skills',
    art: 'severe-weather',
    icon: 'cloud-lightning',
  },
  {
    id: 'evacuation',
    title: 'Having to leave home quickly',
    looks: 'Being told to evacuate, with only minutes to go.',
    first: 'Keep essentials in a grab bag and agree a meeting point.',
    href: '/guides/72-hour-emergency-bag/',
    linkLabel: 'Grab bag guide',
    tone: 'kits',
    art: 'grab-bag',
    icon: 'door-open',
  },
  {
    id: 'transport',
    title: 'Transport disruption',
    looks: 'Delays, closed roads or getting stuck in wintry weather.',
    first: 'Keep a torch, blankets, warm clothes, food and drink in the car.',
    href: '/why-prepare/#car-kit',
    linkLabel: 'What to keep in the car',
    tone: 'gov',
    icon: 'car-front',
  },
];

/** The Be Ready home checklist, paraphrased, with links to our matching tools. */
export const BE_READY_CHECKLIST: { item: string; note?: string; href?: string; link?: string; extra?: { href: string; link: string } }[] = [
  { item: 'Bottled water for 3 days', note: 'The government suggests 3 litres per person per day for drinking, plus more for cooking and washing.', href: '/tools/water-storage-calculator/', link: 'Work out how much', extra: { href: '/tools/water-treatment-calculator/', link: 'How to treat doubtful water' } },
  { item: 'Non-perishable food for 3 days', note: 'Food that needs no fridge or cooking, and that you normally eat.', href: '/tools/food-storage-calculator/', link: 'Make a shopping list', extra: { href: '/tools/power-cut-food-safety/', link: 'Is fridge food safe in a power cut?' } },
  { item: 'Hand sanitiser, wet wipes and bathroom products' },
  { item: 'A torch and spare batteries', note: 'Torches are safer than candles.' },
  { item: 'Blankets, sleeping bags and warm clothing' },
  { item: 'A battery or wind-up FM radio', note: 'With your local news station frequencies written down.' },
  { item: 'A charged power bank' },
  { item: 'Cash in notes and coins, and your cards' },
  { item: 'Printed copies of IDs and important documents', href: '/guides/essential-documents/', link: 'Which documents' },
  { item: 'A written list of key contacts and regular medicines', href: '/guides/family-emergency-plan/', link: 'Build your plan' },
  { item: 'A first aid kit' },
  { item: 'Essential medication', note: 'Request repeat prescriptions up to 5 working days before you run out.', href: '/tools/medication-supply-planner/', link: 'See when to order' },
  { item: 'Ready-to-feed baby formula, nappies and wipes, if needed' },
  { item: 'Pet food and bottled water, if needed' },
];
