// Gera content/blog/manifest.json — a "peça-mãe" limpa que o pipeline social
// consome (title/description/tldr/faq/hero por artigo e idioma), desacoplada do TSX.
//
//   npm run social:manifest
//
// Corre com tsx (transpila o registo TSX; os componentes Body são definidos mas
// nunca renderizados, por isso não há efeitos colaterais).

import { writeFileSync } from 'node:fs';
import { postOrder, getArticle } from '../content/blog';
import { locales, type Locale } from '../i18n/config';
import { SITE_URL } from '../lib/constants';
import type { SocialManifestEntry } from '../lib/social/types';

function localizedPath(lang: Locale, path: string): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  return `/${lang}/${clean ? `${clean}/` : ''}`;
}

const entries: SocialManifestEntry[] = [];

for (const slug of postOrder) {
  for (const lang of locales) {
    const article = getArticle(slug, lang);
    if (!article) continue;
    const { meta, faq } = article;
    entries.push({
      lang,
      slug,
      url: `${SITE_URL}${localizedPath(lang, `blog/${slug}`)}`,
      title: meta.title,
      description: meta.description,
      tldr: meta.tldr,
      datePublished: meta.datePublished,
      readingMinutes: meta.readingMinutes,
      hero: meta.hero ?? null,
      faq: faq.map((f) => ({ q: f.q, a: f.a })),
    });
  }
}

const out = 'content/blog/manifest.json';
writeFileSync(out, `${JSON.stringify(entries, null, 2)}\n`);
console.log(`✓ ${out} — ${entries.length} entradas (${postOrder.length} artigos × ${locales.length} idiomas)`);
