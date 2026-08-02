// Adaptação DETERMINÍSTICA da peça-mãe (meta do artigo) para formatos sociais.
// Sem LLM, sem API, sem custo variável — só regras/templates sobre os campos do meta.

import type { Locale } from '@/i18n/config';
import type { SocialManifestEntry, SocialPiece, Platform, Format } from './types';

// ---- utilitários de texto ----------------------------------------------------

function firstSentence(text: string): string {
  const m = text.match(/^.*?[.!?](?:\s|$)/);
  return (m ? m[0] : text).trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

// ---- copy por idioma ---------------------------------------------------------

const COPY: Record<Locale, { ctaSpoken: string; ctaShort: string; readFull: string; linkNote: string }> = {
  'pt-br': {
    ctaSpoken:
      'Salvei o guia completo no site, de graça. Toca no link e conhece a Emori — o diário emocional que lembra de você.',
    ctaShort: 'Guia completo, grátis:',
    readFull: 'Leia o guia completo (grátis) →',
    linkNote: 'Link na descrição / bio.',
  },
  'pt-pt': {
    ctaSpoken:
      'Guardei o guia completo no site, de graça. Toca no link e conhece a Emori — o diário emocional que se lembra de ti.',
    ctaShort: 'Guia completo, grátis:',
    readFull: 'Lê o guia completo (grátis) →',
    linkNote: 'Link na descrição / bio.',
  },
};

const HASHTAGS = [
  '#diarioemocional',
  '#journaling',
  '#saudemental',
  '#autoconhecimento',
  '#bemestar',
];

// ---- UTM ---------------------------------------------------------------------

export function utmLink(
  url: string,
  opts: { source: string; medium?: string; campaign: string; content?: string },
): string {
  const u = new URL(url);
  u.searchParams.set('utm_source', opts.source);
  u.searchParams.set('utm_medium', opts.medium ?? 'social');
  u.searchParams.set('utm_campaign', opts.campaign);
  if (opts.content) u.searchParams.set('utm_content', opts.content);
  return u.toString();
}

// ---- geradores por formato ---------------------------------------------------

/** Script de vídeo 30–60s: gancho nos 3s + 3 pontos + CTA claro. */
export function videoScript(entry: SocialManifestEntry, link: string): string {
  const c = COPY[entry.lang];
  const points = entry.faq.slice(0, 3).map((f, i) => `${i + 1}. ${f.q}\n   → ${firstSentence(f.a)}`);
  return [
    `🎬 SCRIPT (30–60s) — ${entry.title}`,
    '',
    'GANCHO (0–3s) — texto no ecrã + falado:',
    `“${entry.title}”`,
    '',
    'DESENVOLVIMENTO (3–45s):',
    ...points,
    '',
    'CTA (45–60s):',
    c.ctaSpoken,
    `${c.linkNote}`,
    '',
    `LINK RASTREÁVEL: ${link}`,
  ].join('\n');
}

/** Pin do Pinterest: título curto + descrição rica em keyword. */
export function pinContent(entry: SocialManifestEntry, link: string): { title: string; description: string } {
  const c = COPY[entry.lang];
  return {
    title: truncate(entry.title, 100),
    description: `${truncate(entry.tldr, 360)}\n\n${c.readFull} ${link}\n${HASHTAGS.join(' ')}`,
  };
}

/** Post curto (Facebook): 2–3 frases originais + link. Nunca o artigo inteiro. */
export function shortPost(entry: SocialManifestEntry, link: string): string {
  const c = COPY[entry.lang];
  return [entry.title, '', firstSentence(entry.tldr), '', `${c.ctaShort} ${link}`].join('\n');
}

// ---- mapa plataforma → formato ----------------------------------------------

const PLATFORM_FORMAT: { platform: Platform; format: Format }[] = [
  { platform: 'tiktok', format: 'video' },
  // YouTube publica pela API nativa (grátis, sem contar para o limite do Zernio)
  { platform: 'youtube', format: 'video' },
  { platform: 'facebook', format: 'post' },
  { platform: 'pinterest', format: 'pin' },
];

/** Constrói todas as peças (com link+UTM próprios) a partir de um artigo. */
export function buildPieces(entry: SocialManifestEntry): SocialPiece[] {
  return PLATFORM_FORMAT.map(({ platform, format }) => {
    // O Pinterest marca como spam URLs com query strings longas (domínios novos
    // são especialmente vigiados). Usamos só utm_source — continua a ser medível
    // no GA4 e reduz muito o risco de bloqueio do link.
    const link =
      platform === 'pinterest'
        ? `${entry.url}?utm_source=pinterest`
        : utmLink(entry.url, { source: platform, campaign: entry.slug, content: format });

    if (format === 'video') {
      const caption = `${entry.title}\n\n${COPY[entry.lang].linkNote} ${link}\n${HASHTAGS.join(' ')}`;
      return { platform, format, caption, link, videoScript: videoScript(entry, link) };
    }
    if (format === 'pin') {
      const { title, description } = pinContent(entry, link);
      return {
        platform,
        format,
        caption: `${title}\n\n${description}`,
        link,
        image: entry.hero?.src,
      };
    }
    // post
    return { platform, format, caption: shortPost(entry, link), link, image: entry.hero?.src };
  });
}
