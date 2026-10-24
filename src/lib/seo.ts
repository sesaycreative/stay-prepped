import { SITE } from './site';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function absolute(path: string, site: URL | undefined): string {
  return new URL(path, site ?? SITE.url).toString();
}

export function websiteLd(site: URL | undefined) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: absolute('/', site),
    description: SITE.description,
    inLanguage: SITE.lang,
  };
}

export function breadcrumbLd(items: BreadcrumbItem[], current: string, site: URL | undefined) {
  const all = [{ label: 'Home', href: '/' }, ...items];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: absolute(c.href ?? current, site),
    })),
  };
}

export function articleLd(opts: {
  title: string;
  description: string;
  url: string;
  published: Date;
  modified: Date;
  site: URL | undefined;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.title,
    description: opts.description,
    mainEntityOfPage: opts.url,
    datePublished: opts.published.toISOString(),
    dateModified: opts.modified.toISOString(),
    inLanguage: SITE.lang,
    author: { '@type': 'Organization', name: SITE.author },
    publisher: { '@type': 'Organization', name: SITE.name },
    image: absolute('/og-default.png', opts.site),
  };
}

export function faqLd(faq: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/** Serialise JSON-LD safely for embedding in a <script> tag. */
export function ldJson(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
