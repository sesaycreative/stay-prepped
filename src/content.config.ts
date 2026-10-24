import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { GUIDE_CATEGORY_KEYS, TOOL_CATEGORY_KEYS } from './lib/site';

const source = z.object({
  title: z.string(),
  url: z.string().url(),
  publisher: z.string(),
});

/** Guides (brief §8). File name = slug. */
const guides = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(170),
    category: z.enum(GUIDE_CATEGORY_KEYS),
    publishedAt: z.coerce.date(),
    reviewedAt: z.coerce.date(),
    sources: z.array(source).default([]),
    /** Tool slugs. */
    relatedTools: z.array(z.string()).default([]),
    /** Guide slugs. */
    relatedGuides: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    /** "In short" box: exactly 3 bullets giving the gist of the guide. */
    inShort: z.array(z.string()).length(3).optional(),
  }),
});

/** Tool registry (brief §5). File name = slug. */
const tools = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tools' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    summary: z.string(),
    category: z.enum(TOOL_CATEGORY_KEYS),
    status: z.enum(['live', 'coming-soon']),
    /** Lucide icon name. */
    icon: z.string(),
    order: z.number().int(),
    /** Phase from the build brief: 2 = built, 4 = next, 5 = future. */
    phase: z.number().int().optional(),
    /** Short numbered how-to-use steps shown above the tool. */
    instructions: z.array(z.string()).default([]),
    relatedGuides: z.array(z.string()).default([]),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    safetyNotes: z.array(z.string()).default([]),
    reviewedAt: z.coerce.date().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().max(170).optional(),
    /** Shorter line shown on tool cards instead of the summary. */
    cardSummary: z.string().optional(),
  }),
});

/** Gear buying guides (brief §9). No named products, ratings or claimed testing. */
const gear = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/gear' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(170),
    publishedAt: z.coerce.date(),
    reviewedAt: z.coerce.date(),
    sources: z.array(source).default([]),
    relatedGuides: z.array(z.string()).default([]),
    relatedTools: z.array(z.string()).default([]),
  }),
});

export const collections = { guides, tools, gear };
