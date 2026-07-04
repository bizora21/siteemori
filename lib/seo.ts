import type { Metadata } from 'next';
import { SITE_URL, DEFAULT_OG_IMAGE } from './constants';
import { locales, bcp47, ogLocale, defaultLocale, type Locale } from '@/i18n/config';

// Constrói o caminho absoluto de uma rota localizada.
// `path` é o segmento após o idioma, sem barras nas pontas: '' | 'produto' | 'blog/slug'.
export function localizedPath(lang: Locale, path = ''): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  const suffix = clean ? `${clean}/` : '';
  return `/${lang}/${suffix}`;
}

export function absoluteUrl(pathname: string): string {
  return `${SITE_URL}${pathname.startsWith('/') ? '' : '/'}${pathname}`;
}

// Gera o mapa de hreflang (pt-BR, pt-PT, x-default) para a mesma página.
function buildLanguageAlternates(path: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const l of locales) {
    map[bcp47[l]] = absoluteUrl(localizedPath(l, path));
  }
  // x-default aponta para a variante primária.
  map['x-default'] = absoluteUrl(localizedPath(defaultLocale, path));
  return map;
}

interface PageMetaInput {
  lang: Locale;
  /** Segmento após o idioma, ex.: '' | 'produto' | 'blog/como-comecar' */
  path?: string;
  title: string;
  description: string;
  ogImage?: string;
  /** 'website' (default) ou 'article' */
  type?: 'website' | 'article';
  publishedTime?: string;
  noindex?: boolean;
}

// Helper central de metadados: title, description, canonical, hreflang, OG e Twitter.
export function buildMetadata({
  lang,
  path = '',
  title,
  description,
  ogImage = DEFAULT_OG_IMAGE,
  type = 'website',
  publishedTime,
  noindex,
}: PageMetaInput): Metadata {
  const canonicalPath = localizedPath(lang, path);
  const canonical = absoluteUrl(canonicalPath);
  const ogImageUrl = ogImage.startsWith('http') ? ogImage : absoluteUrl(ogImage);

  return {
    // absolute → não herda o template de título do layout (evita duplicar "Emori").
    title: { absolute: title },
    description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical,
      languages: buildLanguageAlternates(path),
    },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type,
      siteName: 'Emori',
      title,
      description,
      url: canonical,
      locale: ogLocale[lang],
      alternateLocale: locales.filter((l) => l !== lang).map((l) => ogLocale[l]),
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}
