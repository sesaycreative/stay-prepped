// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// Production domain is https://stayprepped.co.uk. SITE_URL overrides it
// (useful for a preview deployment); otherwise the canonical domain is used.
const site = process.env.SITE_URL || 'https://stayprepped.co.uk';

export default defineConfig({
  site,
  // Static by default; individual routes (the API endpoints) opt out with
  // `export const prerender = false` and run as Vercel serverless functions.
  output: 'static',
  adapter: vercel({
    webAnalytics: { enabled: process.env.PUBLIC_ANALYTICS === 'vercel' },
  }),
  trailingSlash: 'ignore',
  integrations: [
    react(),
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/404') && !page.includes('/newsletter/'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
