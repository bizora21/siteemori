import type { Locale } from '@/i18n/config';
import type { FaqItem } from '@/components/FAQ';

/** Imagem de capa (hotlink Unsplash) com atribuição obrigatória. */
export interface ArticleHero {
  src: string;
  alt: string;
  /** nome do fotógrafo */
  credit: string;
  /** perfil do fotógrafo no Unsplash (com utm) */
  creditUrl: string;
}

export interface ArticleMeta {
  slug: string;
  /** H1 e base do <title> */
  title: string;
  /** meta description + og description */
  description: string;
  /** parágrafo TL;DR answer-first (2–3 frases) */
  tldr: string;
  /** ISO date, ex.: '2026-07-04' */
  datePublished: string;
  dateModified?: string;
  readingMinutes: number;
  ogImage?: string;
  /** imagem de capa (Unsplash, hotlink + atribuição) */
  hero?: ArticleHero;
}

export interface ArticleModule {
  meta: ArticleMeta;
  /** Corpo do artigo em prosa (renderizado dentro de .prose-emori) */
  Body: React.ComponentType;
  faq: FaqItem[];
}

export type LocalizedArticle = Record<Locale, ArticleModule>;
