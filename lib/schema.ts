// Geradores de JSON-LD (schema.org) para rich results do Google.
// Nota: pode não afetar diretamente citações de IA, mas ajuda no Google.

import { SITE_URL, ANDROID_PACKAGE, PLAY_STORE_URL, FOUNDER, SOCIAL_LINKS } from './constants';
import { absoluteUrl, localizedPath } from './seo';
import { authorId, type Author } from './authors';
import type { Locale } from '@/i18n/config';
import { bcp47 } from '@/i18n/config';

// Nomes alternativos da marca — ajudam o Google a associar "a Emori", "aemori"
// e "app Emori" ao domínio, capturando as pesquisas long-tail da marca.
const BRAND_ALTERNATE_NAMES = ['a Emori', 'aemori', 'Emori app', 'app Emori'];

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Emori',
    alternateName: BRAND_ALTERNATE_NAMES,
    url: SITE_URL,
    logo: absoluteUrl('/icon-512.svg'),
    description:
      'Emori é um app cristão de oração e comunidade de fé. Registre orações, receba versículos bíblicos e reflexões, e ore com uma comunidade cristã. Gratuito para Android.',
    knowsAbout: [
      'Oração cristã',
      'Versículos bíblicos',
      'Comunidade de fé',
      'Vida devocional',
      'Diário de oração',
      'Intercessão',
    ],
    // Perfis oficiais: ajudam o Google a ligar as contas sociais a esta entidade.
    sameAs: [PLAY_STORE_URL, ...SOCIAL_LINKS.map((s) => s.href)],
    founder: {
      '@type': 'Person',
      name: FOUNDER.name,
      jobTitle: FOUNDER.role,
      url: FOUNDER.linkedin,
      sameAs: [FOUNDER.linkedin],
    },
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Emori',
    alternateName: BRAND_ALTERNATE_NAMES,
    url: SITE_URL,
    inLanguage: ['pt-BR', 'pt-PT'],
  };
}

interface AppSchemaOpts {
  /** avaliação média real da Play Store (ex.: 4.7). Só passar com dados reais. */
  ratingValue?: number;
  ratingCount?: number;
  /** URLs de screenshots reais do app (Front 3). */
  screenshots?: string[];
}

export function softwareApplicationSchema(
  lang: Locale,
  description: string,
  opts: AppSchemaOpts = {},
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Emori',
    alternateName: BRAND_ALTERNATE_NAMES,
    operatingSystem: 'Android 8.0+',
    applicationCategory: 'LifestyleApplication',
    additionalType: 'https://schema.org/ReligiousOrganization',
    inLanguage: bcp47[lang],
    description,
    url: SITE_URL,
    installUrl: PLAY_STORE_URL,
    downloadUrl: PLAY_STORE_URL,
    identifier: ANDROID_PACKAGE,
    author: { '@type': 'Organization', name: 'Emori', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'Emori', url: SITE_URL },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
    },
    ...(opts.screenshots?.length
      ? { screenshot: opts.screenshots.map((s) => absoluteUrl(s)) }
      : {}),
    ...(opts.ratingValue && opts.ratingCount
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: opts.ratingValue,
            ratingCount: opts.ratingCount,
          },
        }
      : {}),
  };
}

export function articleSchema(input: {
  lang: Locale;
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  authorName?: string;
  author?: Author;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    inLanguage: bcp47[input.lang],
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    ...(input.image
      ? { image: [input.image.startsWith('http') ? input.image : absoluteUrl(input.image)] }
      : {}),
    author: input.author
      ? {
          '@type': 'Person',
          '@id': authorId(input.author),
          name: input.author.name,
          url: absoluteUrl(localizedPath(input.lang, input.author.path)),
        }
      : { '@type': 'Organization', name: input.authorName ?? 'Emori', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'Emori',
      logo: { '@type': 'ImageObject', url: absoluteUrl('/icon-512.svg') },
    },
  };
}

export function faqSchema(items: readonly { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// Pessoa (autora) — liga o artigo à entidade, base do E-E-A-T.
export function personSchema(author: Author, lang: Locale) {
  const t = author.text[lang];
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': authorId(author),
    name: author.name,
    jobTitle: t.jobTitle,
    description: t.tagline,
    image: absoluteUrl(author.image),
    url: absoluteUrl(localizedPath(lang, author.path)),
    knowsAbout: author.knowsAbout,
    worksFor: { '@type': 'Organization', name: 'Emori', url: SITE_URL },
  };
}

export function profilePageSchema(author: Author, lang: Locale, dateModified: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    inLanguage: bcp47[lang],
    url: absoluteUrl(localizedPath(lang, author.path)),
    dateModified,
    mainEntity: { '@id': authorId(author) },
  };
}

// Lista de artigos (índice do blog / página da autora).
export function itemListSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: it.url,
    })),
  };
}
