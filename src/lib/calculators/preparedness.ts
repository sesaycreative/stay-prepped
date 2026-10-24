// Home Preparedness Score — pure logic (brief §6, Tool 3).
// 10 categories × 3 questions, each 0–3 points.
// Category score = points / 9 × 10 (one decimal).
// Overall = mean of category scores × 10, rounded, out of 100.

import { round } from './shared';

export type Answer = 0 | 1 | 2 | 3;

export const ANSWER_LABELS: Record<Answer, string> = { 0: 'No', 1: 'Partly', 2: 'Mostly', 3: 'Yes' };

export interface Category {
  id: string;
  label: string;
  questions: [string, string, string];
  /** One concrete next step to suggest when this category is a gap. */
  nextStep: string;
  /** Internal links (guides or tools) relevant to this category. */
  links: { label: string; href: string }[];
}

export const CATEGORIES: Category[] = [
  {
    id: 'food',
    label: 'Food',
    questions: [
      'Do you have at least 3 days of food that needs no fridge or freezer?',
      'Can you prepare that food without mains electricity or gas?',
      'Do you rotate your stored food so it is eaten before its best-before date?',
    ],
    nextStep: 'Use the food storage calculator to make a 3-day shopping list, then buy one extra item each shop.',
    links: [
      { label: 'Food storage calculator', href: '/tools/food-storage-calculator/' },
      { label: 'How much food should you store?', href: '/guides/how-much-food-to-store/' },
    ],
  },
  {
    id: 'water',
    label: 'Water',
    questions: [
      'Do you have at least 3 days of stored drinking water for everyone, including pets?',
      'Do you know how long your stored water has been kept and when to replace it?',
      'Do you have a way to make doubtful water safe to drink (boiling, filter or tablets)?',
    ],
    nextStep: 'Work out your household’s 3-day water need with the water calculator and fill or buy that amount.',
    links: [
      { label: 'Water storage calculator', href: '/tools/water-storage-calculator/' },
      { label: 'Emergency water purification', href: '/guides/emergency-water-purification/' },
    ],
  },
  {
    id: 'supplies',
    label: 'Emergency supplies',
    questions: [
      'Do you have torches with working batteries (or wind-up/rechargeable lights)?',
      'Do you have a battery or wind-up radio?',
      'Are your emergency supplies kept together where everyone can find them?',
    ],
    nextStep: 'Gather a torch, spare batteries and a radio into one labelled box this week.',
    links: [{ label: 'How to build a 72-hour emergency bag', href: '/guides/72-hour-emergency-bag/' }],
  },
  {
    id: 'first-aid',
    label: 'First aid',
    questions: [
      'Do you have a stocked first aid kit at home?',
      'Does at least one adult in the household have basic first aid knowledge?',
      'Do you keep a few days’ spare supply of any essential regular medicines, where your prescriber agrees?',
    ],
    nextStep: 'Check your first aid kit against its contents list and replace anything used or out of date.',
    links: [{ label: 'Prepping for beginners', href: '/guides/prepping-for-beginners/' }],
  },
  {
    id: 'communication',
    label: 'Communication',
    questions: [
      'Do you have important phone numbers written on paper, not only stored in your phone?',
      'Can you charge your phone without mains power (power bank, car charger)?',
      'Have you agreed how your household will contact each other if phones are not working?',
    ],
    nextStep: 'Write a paper contact card for each household member and keep a charged power bank.',
    links: [{ label: 'How to make a family emergency plan', href: '/guides/family-emergency-plan/' }],
  },
  {
    id: 'power',
    label: 'Backup power',
    questions: [
      'Could you light your home for several evenings during a power cut?',
      'Do you have a safe way to keep warm without mains power?',
      'Do you know where your fuse box and main switches are, and how to reset them?',
    ],
    nextStep: 'Read the power cut guide and make sure you have a non-flame light source in every main room.',
    links: [{ label: 'Preparing for a power cut', href: '/guides/preparing-for-a-power-cut/' }],
  },
  {
    id: 'plan',
    label: 'Household plan',
    questions: [
      'Does everyone in your household know what to do in an emergency?',
      'Have you agreed a meeting place near home and one further away?',
      'Have you planned for anyone in your household who needs extra help (children, older relatives, pets)?',
    ],
    nextStep: 'Sit down for 20 minutes and agree two meeting places and who collects whom.',
    links: [{ label: 'How to make a family emergency plan', href: '/guides/family-emergency-plan/' }],
  },
  {
    id: 'evacuation',
    label: 'Evacuation readiness',
    questions: [
      'Do you have a packed grab bag you could take in a few minutes?',
      'Do you know at least two routes out of your area?',
      'Do you know where you could stay if you had to leave home (friends, family)?',
    ],
    nextStep: 'Pack a basic grab bag using the 72-hour bag guide and keep it near the door.',
    links: [{ label: 'How to build a 72-hour emergency bag', href: '/guides/72-hour-emergency-bag/' }],
  },
  {
    id: 'financial',
    label: 'Financial',
    questions: [
      'Do you keep some cash at home in case card payments are down?',
      'Do you have savings you could use in an emergency?',
      'Do you know what your home and contents insurance covers?',
    ],
    nextStep: 'Put a small amount of cash in low denominations somewhere safe with your emergency supplies.',
    links: [{ label: 'Essential documents to keep ready', href: '/guides/essential-documents/' }],
  },
  {
    id: 'documents',
    label: 'Essential documents',
    questions: [
      'Do you know where your key documents are (ID, insurance, medical, property)?',
      'Do you have copies stored somewhere other than your home?',
      'Are your documents protected from water and fire damage?',
    ],
    nextStep: 'List your key documents and make secure copies using the essential documents guide.',
    links: [{ label: 'Essential documents to keep ready', href: '/guides/essential-documents/' }],
  },
];

export const QUESTIONS_PER_CATEGORY = 3;
export const MAX_POINTS_PER_CATEGORY = QUESTIONS_PER_CATEGORY * 3; // 9

export type Answers = Record<string, (Answer | null)[]>;

export interface Band {
  min: number;
  max: number;
  label: string;
  summary: string;
}

export const BANDS: Band[] = [
  { min: 0, max: 39, label: 'Getting started', summary: 'You have taken the first step by checking. Pick one gap below and close it this week.' },
  { min: 40, max: 69, label: 'Building', summary: 'You have some good foundations. Focus on your biggest gaps to round things out.' },
  { min: 70, max: 89, label: 'Well prepared', summary: 'Your household is in a good position. Keep supplies rotated and plans up to date.' },
  { min: 90, max: 100, label: 'Highly prepared', summary: 'Excellent. Review your plans every few months and help others get started.' },
];

export function isAnswer(v: unknown): v is Answer {
  return v === 0 || v === 1 || v === 2 || v === 3;
}

export function emptyAnswers(): Answers {
  return Object.fromEntries(CATEGORIES.map((c) => [c.id, [null, null, null]]));
}

export function categoryComplete(answers: Answers, id: string): boolean {
  const a = answers[id];
  return Array.isArray(a) && a.length === QUESTIONS_PER_CATEGORY && a.every(isAnswer);
}

export function allComplete(answers: Answers): boolean {
  return CATEGORIES.every((c) => categoryComplete(answers, c.id));
}

/** Category score out of 10, one decimal. Unanswered questions count as 0. */
export function categoryScore(points: (Answer | null)[]): number {
  if (points.some((p) => p !== null && !isAnswer(p))) throw new Error('Invalid answer value');
  const sum = points.reduce<number>((s, p) => s + (p ?? 0), 0);
  return round((sum / MAX_POINTS_PER_CATEGORY) * 10, 1);
}

export function bandFor(score: number): Band {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  return BANDS.find((b) => s >= b.min && s <= b.max) ?? BANDS[0];
}

export interface CategoryResult {
  id: string;
  label: string;
  score: number;
  nextStep: string;
  links: Category['links'];
}

export interface ScoreResult {
  overall: number;
  band: Band;
  categories: CategoryResult[];
  strengths: CategoryResult[];
  gaps: CategoryResult[];
}

export function calculateScore(answers: Answers): ScoreResult {
  const categories: CategoryResult[] = CATEGORIES.map((c) => {
    const pts = answers[c.id] ?? [null, null, null];
    if (pts.length !== QUESTIONS_PER_CATEGORY) throw new Error(`Category ${c.id} must have ${QUESTIONS_PER_CATEGORY} answers`);
    return { id: c.id, label: c.label, score: categoryScore(pts), nextStep: c.nextStep, links: c.links };
  });
  const mean = categories.reduce((s, c) => s + c.score, 0) / categories.length;
  const overall = Math.round(mean * 10);

  // Stable sort keeps the original category order for ties.
  const byHigh = [...categories].sort((a, b) => b.score - a.score);
  const byLow = [...categories].sort((a, b) => a.score - b.score);
  // Strengths must have scored something; gaps must have room to improve.
  const strengths = byHigh.filter((c) => c.score > 0).slice(0, 3);
  const gaps = byLow.filter((c) => c.score < 10).slice(0, 3);

  return { overall, band: bandFor(overall), categories, strengths, gaps };
}

/** Shape stored in localStorage. Versioned so we can migrate later. */
export interface SavedScore {
  v: 1;
  savedAt: string;
  answers: Answers;
}

export function parseSavedScore(raw: string | null): SavedScore | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<SavedScore>;
    if (data?.v !== 1 || typeof data.savedAt !== 'string' || typeof data.answers !== 'object' || !data.answers) return null;
    for (const c of CATEGORIES) {
      const a = data.answers[c.id];
      if (!Array.isArray(a) || a.length !== QUESTIONS_PER_CATEGORY || !a.every(isAnswer)) return null;
    }
    return data as SavedScore;
  } catch {
    return null;
  }
}

export function scoreSummaryText(r: ScoreResult): string {
  return [
    'Stay Prepped: home preparedness score',
    `Overall: ${r.overall}/100 (${r.band.label})`,
    '',
    ...r.categories.map((c) => `${c.label}: ${c.score.toFixed(1)}/10`),
    '',
    'Next steps:',
    ...r.gaps.map((g) => `[ ] ${g.label}: ${g.nextStep}`),
  ].join('\n') + '\n';
}
