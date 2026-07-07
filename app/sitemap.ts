import type { MetadataRoute } from 'next';
import { locales, bcp47, defaultLocale, type Locale } from '@/i18n/config';
import { SITE_URL } from '@/lib/constants';
import { localizedPath } from '@/lib/seo';
import { getAllSlugs, getArticle } from '@/content/blog';

// Necessário para `output: 'export'` — sem isto o build falha a gerar sitemap.xml estático.
export const dynamic = 'force-static';

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

// Config por rota estática (sem idioma). A raiz "/" sem idioma NÃO entra:
// ela faz redirect via public/_redirects e não deve ser indexada à parte.
const staticRoutes: Record<
  string,
  { priority: number; changeFrequency: ChangeFrequency }
> = {
  '': { priority: 1.0, changeFrequency: 'weekly' }, // home de cada idioma
  produto: { priority: 0.8, changeFrequency: 'monthly' },
  pro: { priority: 0.8, changeFrequency: 'monthly' },
  sobre: { priority: 0.7, changeFrequency: 'monthly' },
  blog: { priority: 0.6, changeFrequency: 'weekly' }, // índice do blog
  privacidade: { priority: 0.3, changeFrequency: 'yearly' },
  termos: { priority: 0.3, changeFrequency: 'yearly' },
};

// hreflang: pt-BR, pt-PT e x-default (→ variante primária) para a mesma página.
function alternatesFor(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[bcp47[l]] = `${SITE_URL}${localizedPath(l, path)}`;
  }
  languages['x-default'] = `${SITE_URL}${localizedPath(defaultLocale, path)}`;
  return languages;
}

// Data de modificação de um artigo: usa dateModified se existir, senão datePublished.
// (mesma data para ambas as variantes) — cai para a data do build se algo faltar.
function articleLastModified(slug: string, buildDate: Date): Date {
  const meta = getArticle(slug, defaultLocale)?.meta;
  const raw = meta?.dateModified ?? meta?.datePublished;
  if (!raw) return buildDate;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? buildDate : d;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const buildDate = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // 1) Rotas estáticas × 2 variantes
  for (const [path, cfg] of Object.entries(staticRoutes)) {
    for (const l of locales as readonly Locale[]) {
      entries.push({
        url: `${SITE_URL}${localizedPath(l, path)}`,
        lastModified: buildDate,
        changeFrequency: cfg.changeFrequency,
        priority: cfg.priority,
        alternates: { languages: alternatesFor(path) },
      });
    }
  }

  // 2) Artigos do blog × 2 variantes (fonte de verdade = getAllSlugs, sempre em sincronia)
  for (const slug of getAllSlugs()) {
    const path = `blog/${slug}`;
    const lastModified = articleLastModified(slug, buildDate);
    for (const l of locales as readonly Locale[]) {
      entries.push({
        url: `${SITE_URL}${localizedPath(l, path)}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.6,
        alternates: { languages: alternatesFor(path) },
      });
    }
  }

  return entries;
}
