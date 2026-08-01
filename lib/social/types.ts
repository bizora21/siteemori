import type { Locale } from '@/i18n/config';

/** Uma entrada do manifest social — o meta limpo de um artigo, por idioma. */
export interface SocialManifestEntry {
  lang: Locale;
  slug: string;
  url: string;
  title: string;
  description: string;
  tldr: string;
  datePublished: string;
  readingMinutes: number;
  hero: { src: string; alt: string; credit: string; creditUrl: string } | null;
  faq: { q: string; a: string }[];
}

/** Plataformas suportadas (mapeadas depois para socialAccountIds do Zernio). */
export type Platform = 'tiktok' | 'youtube' | 'facebook' | 'pinterest' | 'instagram';

/** Formato de conteúdo derivado da peça-mãe. */
export type Format = 'video' | 'pin' | 'post';

/** Uma peça pronta a publicar (texto + link rastreável + formato/plataforma). */
export interface SocialPiece {
  platform: Platform;
  format: Format;
  /** legenda/descrição pronta a colar */
  caption: string;
  /** link já com UTM da plataforma+formato */
  link: string;
  /** imagem de capa a usar (Pin/post), quando aplicável */
  image?: string;
  /** script de vídeo estruturado (só para format 'video') */
  videoScript?: string;
}
