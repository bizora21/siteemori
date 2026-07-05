// Geradores de JSON-LD (schema.org) para rich results do Google.
// Nota: pode não afetar diretamente citações de IA, mas ajuda no Google.

import { SITE_URL, ANDROID_PACKAGE, PLAY_STORE_URL } from './constants';
import { absoluteUrl } from './seo';
import type { Locale } from '@/i18n/config';
import { bcp47 } from '@/i18n/config';

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Emori',
    url: SITE_URL,
    logo: absoluteUrl('/icon-512.svg'),
    description:
      'Emori é um diário emocional com inteligência artificial que conversa com o usuário, lembra do contexto e ajuda a entender as emoções.',
    sameAs: [PLAY_STORE_URL],
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Emori',
    url: SITE_URL,
    inLanguage: ['pt-BR', 'pt-PT'],
  };
}

export function softwareApplicationSchema(lang: Locale, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Emori',
    operatingSystem: 'Android',
    applicationCategory: 'LifestyleApplication',
    inLanguage: bcp47[lang],
    description,
    installUrl: PLAY_STORE_URL,
    downloadUrl: PLAY_STORE_URL,
    identifier: ANDROID_PACKAGE,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
    },
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
    ...(input.image ? { image: [absoluteUrl(input.image)] } : {}),
    author: { '@type': 'Organization', name: 'Emori' },
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
