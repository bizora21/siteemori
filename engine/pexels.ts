// Pesquisa inteligente de vídeos e fotos no Pexels para as campanhas.
// Em vez de uma palavra solta, cada plano tem várias pesquisas com contexto ("african men walking together");
// os resultados juntam-se, tiram-se os repetidos, ordenam-se por relevância (formato, duração, resolução, palavras
// do título do vídeo) e geram uma folha de contacto numerada para escolher à vista, e não ao acaso.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { FFMPEG } from './ffmpeg';

export interface Candidate {
  id: number;
  type: 'videos' | 'photos';
  /** imagem de pré-visualização */
  thumb: string;
  /** ficheiro a descarregar (mp4 / jpg) */
  link: string;
  author: string;
  /** página do Pexels (o endereço descreve o conteúdo) */
  url: string;
  duration?: number;
  width: number;
  height: number;
  score: number;
  query: string;
}

export function pexelsKey(): string | undefined {
  if (process.env.PEXELS_API_KEY) return process.env.PEXELS_API_KEY;
  try {
    return /^\s*PEXELS_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?\s*$/m.exec(readFileSync('.env.local', 'utf8'))?.[1];
  } catch {
    return undefined;
  }
}

interface RawVideo {
  id: number;
  image: string;
  duration: number;
  url: string;
  user: { name: string };
  video_files: { link: string; width: number; height: number; file_type: string }[];
}

async function get<T>(url: string, key: string): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch(url, { headers: { Authorization: key }, signal: AbortSignal.timeout(20000) }).catch(() => null);
    if (r?.ok) return (await r.json()) as T;
    if (r && r.status !== 429 && r.status < 500) throw new Error(`Pexels respondeu ${r.status}`);
    await new Promise((ok) => setTimeout(ok, 1500 * (attempt + 1)));
  }
  throw new Error('o Pexels não respondeu (verifique a internet)');
}

const words = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter((w) => w.length > 2);

/** Pontua um resultado: o que mais interessa a um vídeo vertical de redes sociais com pessoas reais. */
function score(c: Omit<Candidate, 'score'>, query: string, avoid: string[]): number {
  const slug = words(c.url.replace(/^.*\/(video|photo)\//, '').replace(/-\d+\/?$/, ''));
  const q = words(query).filter((w) => !['with', 'and', 'the', 'for'].includes(w));
  let s = 0;
  s += Math.min(4, q.filter((w) => slug.includes(w)).length * 1.5); // o título do vídeo fala do que se procura
  s += c.height >= c.width ? 2 : 0; // vertical: sem cortar
  s += c.width >= 1080 || c.height >= 1920 ? 1 : 0; // boa resolução
  if (c.duration) s += c.duration >= 5 && c.duration <= 30 ? 1.5 : c.duration < 3 ? -2 : 0;
  // contexto africano: o título costuma dizer
  s += slug.some((w) => ['african', 'africa', 'black', 'mozambique', 'maputo', 'beira', 'ethiopian', 'nigerian', 'kenyan', 'ghana', 'ghanaian', 'tanzania', 'uganda'].includes(w)) ? 2 : 0;
  // o que não serve para esta campanha (violência, tristeza, marcas) ou o que o plano pede para evitar
  const bad = [...avoid, 'violence', 'abuse', 'crying', 'sad', 'depressed', 'bruise', 'fight', 'angry', 'logo', 'watermark', 'gun', 'police'];
  s -= slug.filter((w) => bad.includes(w)).length * 4;
  return s;
}

export async function searchVideos(queries: string[], opts: { avoid?: string[]; perQuery?: number } = {}): Promise<Candidate[]> {
  const key = pexelsKey();
  if (!key) throw new Error('PEXELS_API_KEY não está configurada em .env.local');
  const found = new Map<number, Candidate>();
  for (const query of queries) {
    for (const orientation of ['portrait', 'landscape']) {
      // o horizontal só entra se o vertical der poucos resultados
      if (orientation === 'landscape' && [...found.values()].filter((c) => c.query === query).length >= 4) continue;
      const d = await get<{ videos?: RawVideo[] }>(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=${orientation}&size=medium&per_page=${opts.perQuery ?? 12}`, key);
      for (const v of d.videos ?? []) {
        if (found.has(v.id)) continue;
        // o mais pequeno com pelo menos 720 px do lado menor (a CDN do Pexels é lenta)
        const f = v.video_files.filter((x) => x.file_type === 'video/mp4' && Math.min(x.width, x.height) >= 720).sort((a, b) => Math.min(a.width, a.height) - Math.min(b.width, b.height))[0];
        if (!f) continue;
        const base = { id: v.id, type: 'videos' as const, thumb: v.image, link: f.link, author: v.user.name, url: v.url, duration: v.duration, width: f.width, height: f.height, query };
        found.set(v.id, { ...base, score: score(base, query, opts.avoid ?? []) });
      }
    }
  }
  return [...found.values()].sort((a, b) => b.score - a.score);
}

/** Descarrega com curl (a CDN do Pexels corta ligações longas). */
export function download(link: string, dest: string): boolean {
  const u = new URL(link);
  if (u.protocol !== 'https:' || !(u.hostname === 'pexels.com' || u.hostname.endsWith('.pexels.com'))) throw new Error('só se descarrega do Pexels');
  if (existsSync(dest) && statSync(dest).size > 5000) return true;
  const r = spawnSync('curl', ['-sL', '--retry', '3', '--retry-all-errors', '--speed-limit', '1000', '--speed-time', '90', '--max-time', '1500', '--max-filesize', String(150 * 1024 * 1024), '-o', dest, link]);
  if (r.status === 0 && existsSync(dest) && statSync(dest).size > 5000) return true;
  rmSync(dest, { force: true });
  return false;
}

/** Folha de contacto numerada (1, 2, 3…) dos candidatos, para os ver de uma só vez. */
export function contactSheet(cands: Candidate[], out: string, tmpDir: string): void {
  mkdirSync(tmpDir, { recursive: true });
  const shown = cands.slice(0, 12);
  const files: string[] = [];
  shown.forEach((c, i) => {
    const f = join(tmpDir, `t${i + 1}.jpg`);
    rmSync(f, { force: true }); // sem cache: as miniaturas mudam entre pesquisas
    download(c.thumb, f);
    files.push(f);
  });
  const ok = files.filter((f) => existsSync(f));
  if (!ok.length) return;
  const inputs = ok.flatMap((f) => ['-i', f]);
  const font = 'C\\:/Windows/Fonts/arialbd.ttf';
  const cell = ok.map((_, i) => `[${i}:v]scale=270:480:force_original_aspect_ratio=increase,crop=270:480,drawtext=fontfile='${font}':text='${i + 1}':x=8:y=8:fontsize=44:fontcolor=white:box=1:boxcolor=black@0.7:boxborderw=6[v${i}]`).join(';');
  const cols = Math.min(6, ok.length);
  const rows = Math.ceil(ok.length / cols);
  const layout = ok.map((_, i) => `${(i % cols) * 270}_${Math.floor(i / cols) * 480}`).join('|');
  const filter = `${cell};${ok.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${ok.length}:layout=${layout}[o]`;
  void rows;
  const r = spawnSync(FFMPEG, ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filter, '-map', '[o]', '-frames:v', '1', '-q:v', '4', out], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('não consegui fazer a folha de contacto: ' + (r.stderr ?? '').slice(-400));
}
