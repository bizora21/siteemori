import type { MetadataRoute } from 'next';
import { locales, bcp47, defaultLocale, type Locale } from '@/i18n/config';
import { SITE_URL } from '@/lib/constants';
import { localizedPath } from '@/lib/seo';
import { getAllSlugs } from '@/content/blog';

// Rotas estáticas (sem idioma). O blog acrescenta uma entrada por slug.
const staticPaths = ['', 'produto', 'pro', 'blog', 'privacidade', 'termos'];

// Necessário para `output: 'export'` — gera sitemap.xml estático.
export const dynamic = 'force-static';

function alternatesFor(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[bcp47[l]] = `${SITE_URL}${localizedPath(l, path)}`;
  }
  languages['x-default'] = `${SITE_URL}${localizedPath(defaultLocale, path)}`;
  return languages;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const allPaths = [...staticPaths, ...getAllSlugs().map((s) => `blog/${s}`)];

  const entries: MetadataRoute.Sitemap = [];
  for (const path of allPaths) {
    for (const l of locales as readonly Locale[]) {
      entries.push({
        url: `${SITE_URL}${localizedPath(l, path)}`,
        lastModified: now,
        changeFrequency: path === '' ? 'weekly' : 'monthly',
        priority: path === '' ? 1 : path.startsWith('blog/') ? 0.6 : 0.8,
        alternates: { languages: alternatesFor(path) },
      });
    }
  }
  return entries;
}
