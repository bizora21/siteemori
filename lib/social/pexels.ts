// Vídeos de fundo do Pexels — dão movimento real ao vídeo, que é o que separa
// um slide animado de um vídeo que prende. Licença Pexels: uso comercial livre,
// sem atribuição obrigatória (creditamos à mesma no README da peça).

import { existsSync, statSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const API = 'https://api.pexels.com/videos/search';

// Cache local dos clips. O download do Pexels é a única parte lenta da geração
// (a CDN serve a ~0,1 MB/s), por isso paga-se uma vez por tema e nunca mais:
// o 2º vídeo do mesmo artigo, e qualquer regeneração, saem instantâneos.
const CACHE = 'assets/video-bg';

const cacheKey = (query: string) => query.replace(/[^a-z0-9]+/gi, '-').toLowerCase();

export interface BackgroundClip {
  id: number;
  author: string;
  url: string;
  duration: number;
  file: string;
}

/** Consulta de fundo por tema do artigo — visualmente calma, nunca literal. */
export function backgroundQuery(slug: string): string {
  const map: Record<string, string> = {
    // Ondas concêntricas na água: o pensamento que gira sem sair do sítio.
    'como-parar-de-pensar-demais': 'water ripples slow motion dark calm',
    'cansaco-que-dormir-nao-resolve': 'soft morning light curtains slow',
    'como-melhorar-autoestima': 'calm sunrise horizon slow motion',
    'inteligencia-emocional': 'calm ocean waves slow motion',
    'como-desabafar': 'rain window night calm',
    'como-controlar-as-emocoes': 'gentle waves slow motion calm',
    'afirmacoes-positivas': 'sunlight leaves gentle breeze',
    'diario-de-gratidao': 'warm sunlight nature calm',
    'diario-de-humor': 'clouds time lapse soft',
  };
  return map[slug] ?? 'calm nature slow motion minimal';
}

/**
 * Procura um clip vertical e descarrega-o. Prefere ~1080×1920 e clips longos
 * (menos repetição visível quando fazemos loop).
 */
export async function fetchBackground(
  query: string,
  outFile: string,
): Promise<BackgroundClip | null> {
  // Cache primeiro: nem chamada à API, nem download.
  mkdirSync(CACHE, { recursive: true });
  const cached = `${CACHE}/${cacheKey(query)}.mp4`;
  const meta = `${CACHE}/${cacheKey(query)}.json`;
  if (existsSync(cached) && existsSync(meta) && statSync(cached).size > 100_000) {
    copyFileSync(cached, outFile);
    return { ...(JSON.parse(readFileSync(meta, 'utf8')) as Omit<BackgroundClip, 'file'>), file: outFile };
  }

  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;

  const url = `${API}?query=${encodeURIComponent(query)}&orientation=portrait&size=medium&per_page=15`;
  // Duas tentativas: um soluço de rede não pode custar o clip. E qualquer
  // falha aqui devolve null em vez de rebentar — o gerador cai no fundo
  // estático e o vídeo sai à mesma. Antes, um `fetch failed` abortava a
  // geração de todos os idiomas seguintes.
  let data: {
    videos?: {
      id: number;
      duration: number;
      user: { name: string };
      url: string;
      video_files: { link: string; width: number; height: number; file_type: string }[];
    }[];
  } | null = null;

  for (let i = 0; i < 2 && !data; i++) {
    try {
      const res = await fetch(url, { headers: { Authorization: key } });
      if (res.ok) data = await res.json();
    } catch {
      /* tenta outra vez; se falhar de novo, segue sem fundo em vídeo */
    }
  }
  if (!data) return null;

  const all = (data.videos ?? []).filter((v) => v.duration >= 5);
  if (!all.length) return null;

  // Janela de duração: 8–25s. Clips longos pesam 100+ MB e a CDN do Pexels
  // serve a ~0,1 MB/s — o download rebentava por timeout. Um clip curto em
  // loop, com o zoom lento por cima, é visualmente indistinguível e desce
  // o peso para ~1/4. Dentro da janela, o mais longo (menos repetição).
  const janela = all.filter((v) => v.duration >= 8 && v.duration <= 25);
  const video = (janela.length ? janela : all).sort((a, b) => b.duration - a.duration)[0];
  const file = video.video_files
    .filter((f) => f.file_type === 'video/mp4' && f.height > f.width && f.width >= 720)
    .sort((a, b) => Math.abs(a.width - 1080) - Math.abs(b.width - 1080))[0];
  if (!file) return null;

  // Download com curl, não com fetch: a CDN do Pexels corta ligações longas
  // (ECONNRESET) e o fetch do Node não recupera. O curl retoma e repete sozinho.
  // --speed-limit/--speed-time abortam só se parar mesmo (<2 KB/s por 60s);
  // uma ligação lenta mas viva tem até 15 min para acabar.
  const dl = spawnSync(
    'curl',
    [
      '-sL', '--retry', '3', '--retry-all-errors',
      '--speed-limit', '2000', '--speed-time', '60',
      '--max-time', '900',
      '-o', outFile, file.link,
    ],
    { encoding: 'utf8' },
  );
  if (dl.status !== 0 || !existsSync(outFile) || statSync(outFile).size < 100_000) return null;

  const info = {
    id: video.id,
    author: video.user.name,
    url: video.url,
    duration: video.duration,
  };
  // Guarda no cache para as próximas gerações deste tema.
  copyFileSync(outFile, cached);
  writeFileSync(meta, JSON.stringify(info, null, 2));

  return { ...info, file: outFile };
}
