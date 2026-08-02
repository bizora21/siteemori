// Gera o vídeo vertical (1080×1920) de cada artigo — in-house, sem serviços pagos.
//
//   npm run social:video -- --slug=como-desabafar --lang=pt-br
//   npm run social:video -- --slug=… --lang=… --no-voice
//
// Sincronização: cada frame dura do início de uma palavra ao início da seguinte,
// e o último frame de cada cena estica-se até à duração REAL do áudio (medida com
// ffmpeg). Assim o vídeo nunca ganha nem perde tempo em relação à voz.
//
// Legendas: mostra a linha inteira e realça a palavra que está a ser lida (karaoke).
// Movimento: zoom lento e contínuo (retenção) — nunca brusco.
//
// Música: assets/audio/calm.mp3 (gitignored). Sem o ficheiro, sai só com voz.

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { Resvg } from '@resvg/resvg-js';
import ffmpegPath from 'ffmpeg-static';
import type { SocialManifestEntry } from '../lib/social/types';
import {
  synthesize,
  toCaptionLines,
  cleanNarration,
  type CaptionLine,
} from '../lib/social/tts';
import type { Locale } from '../i18n/config';

const W = 1080;
const H = 1920;
const PAD = 100;
const FONTS = ['assets/fonts/PTSerif-Bold.ttf', 'assets/fonts/PTSerif-Regular.ttf'];
const AUDIO = 'assets/audio/calm.mp3';
const ffmpeg = ffmpegPath as unknown as string;

function xmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function wrap(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Duração real de um ficheiro de áudio, em segundos (via ffmpeg).
 *  Usa spawnSync porque o ffmpeg escreve a duração no stderr e termina com
 *  sucesso — com execFileSync+try/catch o valor perdia-se e vinha 0. */
function audioDuration(file: string): number {
  const res = spawnSync(ffmpeg, ['-i', file, '-f', 'null', '-'], { encoding: 'utf8' });
  const out = `${res.stderr ?? ''}`;
  const m = out.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  return m ? +m[1] * 3600 + +m[2] * 60 + parseFloat(m[3]) : 0;
}

/** Ícones do nicho (traço, estilo lucide). */
const ICONS: Record<string, string> = {
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
  sparkle: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
};

/** Tons de fundo por cena — dá cor e variação sem sair da marca. */
const TINTS = ['#f3ddc9', '#e9efe6', '#f6ddd0', '#eef0e3', '#f3e3d3'];

interface Scene {
  eyebrow?: string;
  title: string;
  narration: string;
  icon: keyof typeof ICONS;
  tint: string;
  accent?: boolean;
  hideCaption?: boolean;
  /** texto do botão final (ex.: "Baixar grátis") */
  cta?: string;
}

/** Um frame: cena + linha de legenda com a palavra atual realçada. */
function frameSvg(scene: Scene, line: CaptionLine | null, activeWord: number): string {
  const titleSize = scene.title.length > 58 ? 60 : scene.title.length > 32 ? 68 : 78;
  const titleLines = wrap(scene.title, scene.title.length > 58 ? 24 : 20).slice(0, 5);
  const lineH = titleSize + 20;
  const titleTop = 640;

  const titleEls = titleLines
    .map(
      (l, i) =>
        `<text x="${PAD}" y="${titleTop + i * lineH}" font-family="PT Serif" font-weight="bold" font-size="${titleSize}" fill="${scene.accent ? '#84391b' : '#2a2420'}">${xmlEscape(l)}</text>`,
    )
    .join('\n  ');

  // Legenda: quebra a linha em no máximo 2 filas e realça a palavra lida.
  let capEls = '';
  if (line && !scene.hideCaption) {
    const capTop = titleTop + titleLines.length * lineH + 170;
    const rows: { text: string; from: number }[] = [];
    let row = '';
    let from = 0;
    line.words.forEach((w, i) => {
      const next = row ? `${row} ${w.text}` : w.text;
      if (next.length > 18 && row) {
        rows.push({ text: row, from });
        row = w.text;
        from = i;
      } else row = next;
    });
    if (row) rows.push({ text: row, from });

    capEls = rows
      .map((r, ri) => {
        const parts = r.text.split(' ');
        // Largura aproximada para centrar manualmente (a serifada ~0.5em/char).
        const totalW = r.text.length * 31;
        let x = W / 2 - totalW / 2;
        const tspans = parts
          .map((p, pi) => {
            const idx = r.from + pi;
            const on = idx === activeWord;
            const el = `<text x="${x}" y="${capTop + ri * 78}" font-family="PT Serif" font-weight="bold" font-size="62" fill="${on ? '#a2481f' : '#8a7d70'}">${xmlEscape(p)}</text>`;
            x += (p.length + 1) * 31;
            return el;
          })
          .join('');
        return tspans;
      })
      .join('\n  ');
  }

  const ctaEls = scene.cta
    ? `<rect x="${W / 2 - 300}" y="1560" width="600" height="110" rx="55" fill="#a2481f"/>
  <text x="${W / 2}" y="1630" text-anchor="middle" font-family="PT Serif" font-weight="bold" font-size="46" fill="#faf5ec">${xmlEscape(scene.cta)}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <mask id="moon">
      <rect width="${W}" height="${H}" fill="black"/>
      <circle cx="830" cy="300" r="235" fill="white"/>
      <circle cx="930" cy="238" r="215" fill="black"/>
    </mask>
  </defs>
  <rect width="${W}" height="${H}" fill="#faf5ec"/>
  <rect width="${W}" height="${H}" fill="${scene.tint}" mask="url(#moon)"/>

  <g transform="translate(${PAD} 300) scale(2.6)" fill="none" stroke="#c05a2e" stroke-width="1.7"
     stroke-linecap="round" stroke-linejoin="round">
    <path d="${ICONS[scene.icon]}"/>
  </g>

  ${scene.eyebrow ? `<text x="${PAD}" y="520" font-family="PT Serif" font-weight="bold" font-size="32" letter-spacing="7" fill="#a2481f">${xmlEscape(scene.eyebrow)}</text>` : ''}
  ${titleEls}
  ${capEls}
  ${ctaEls}

  <text x="${W / 2}" y="${scene.cta ? 1780 : 1790}" text-anchor="middle" font-family="PT Serif" font-weight="bold" font-size="44" fill="#84391b">aemori.com</text>
</svg>`;
}

function renderFrame(scene: Scene, line: CaptionLine | null, active: number, file: string) {
  const png = new Resvg(frameSvg(scene, line, active), {
    fitTo: { mode: 'width', value: W },
    font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'PT Serif' },
    background: '#faf5ec',
  })
    .render()
    .asPng();
  writeFileSync(file, png);
}

function buildScenes(entry: SocialManifestEntry): Scene[] {
  const isPT = entry.lang === 'pt-pt';
  // Até 4 perguntas e a resposta COMPLETA → vídeo mais longo e com mais substância.
  const points = entry.faq.slice(0, 4);
  const icons: (keyof typeof ICONS)[] = ['book', 'heart', 'sparkle', 'sun'];

  return [
    {
      eyebrow: 'DIÁRIO EMOCIONAL',
      title: entry.title,
      narration: cleanNarration(entry.title),
      icon: 'moon',
      tint: TINTS[0],
      hideCaption: true,
    },
    ...points.map((f, i) => ({
      title: f.q,
      narration: cleanNarration(f.a),
      icon: icons[i] ?? 'sparkle',
      tint: TINTS[(i + 1) % TINTS.length],
    })),
    {
      title: isPT ? 'Já disponível na Google Play' : 'Já disponível na Google Play',
      narration: isPT
        ? 'A Emori já está disponível na Google Play. Descarrega gratuitamente e começa hoje.'
        : 'A Emori já está disponível na Google Play. Baixe grátis e comece hoje.',
      icon: 'moon',
      tint: TINTS[0],
      accent: true,
      hideCaption: true,
      cta: isPT ? 'Descarregar grátis' : 'Baixar grátis',
    },
  ];
}

// ---- execução ----------------------------------------------------------------

async function main() {
  const manifest: SocialManifestEntry[] = JSON.parse(readFileSync('content/blog/manifest.json', 'utf8'));
  const args: Record<string, string | boolean> = Object.fromEntries(
    process.argv.slice(2).map((a): [string, string | boolean] => {
      const [k, v] = a.replace(/^--/, '').split('=');
      return [k, v ?? true];
    }),
  );

  let targets = manifest;
  if (args.slug) targets = targets.filter((e) => e.slug === args.slug);
  if (args.lang) targets = targets.filter((e) => e.lang === args.lang);
  if (targets.length === 0) {
    console.error('Nenhum artigo corresponde aos filtros.');
    process.exit(1);
  }

  const withVoice = args['no-voice'] !== true;
  const hasMusic = existsSync(AUDIO);

  for (const entry of targets) {
    const dir = `social/${entry.slug}/${entry.lang}`;
    const tmp = `${dir}/.frames`;
    mkdirSync(tmp, { recursive: true });

    const scenes = buildScenes(entry);
    const frames: { file: string; seconds: number }[] = [];
    const voiceFiles: string[] = [];

    for (const [si, scene] of scenes.entries()) {
      let lines: CaptionLine[] = [];
      let sceneDuration: number;

      if (withVoice) {
        const voiceFile = `${tmp}/voice-${si}.mp3`;
        const { words } = await synthesize(scene.narration, entry.lang as Locale, voiceFile);
        voiceFiles.push(voiceFile);
        lines = toCaptionLines(words);
        // Duração REAL do áudio — é o que garante a sincronia (não o último word boundary).
        sceneDuration = audioDuration(voiceFile) || (words.at(-1)?.end ?? 3);
      } else {
        const chunks = wrap(scene.narration, 30);
        lines = chunks.map((c, i) => ({
          words: c.split(' ').map((t) => ({ text: t, start: i * 2, end: i * 2 + 2 })),
          start: i * 2,
          end: (i + 1) * 2,
        }));
        sceneDuration = chunks.length * 2;
      }

      // Um frame por palavra: dura do início dessa palavra ao início da seguinte.
      // O último estica até ao fim REAL do áudio → zero desvio acumulado.
      const flat: { line: CaptionLine; wordIdx: number; start: number }[] = [];
      lines.forEach((line) => {
        line.words.forEach((w, wi) => flat.push({ line, wordIdx: wi, start: w.start }));
      });

      if (flat.length === 0) {
        const file = `${tmp}/f-${si}-0.png`;
        renderFrame(scene, null, -1, file);
        frames.push({ file, seconds: sceneDuration });
        continue;
      }

      flat.forEach((f, i) => {
        const file = `${tmp}/f-${si}-${i}.png`;
        renderFrame(scene, f.line, f.wordIdx, file);
        // O primeiro frame absorve o silêncio inicial (start = 0).
        const from = i === 0 ? 0 : f.start;
        const to = i + 1 < flat.length ? flat[i + 1].start : sceneDuration;
        // Sem piso artificial: um mínimo por frame inflaria as palavras curtas e
        // o vídeo ficaria mais longo que a voz. O quantizador garante ≥1 frame.
        frames.push({ file, seconds: Math.max(0, to - from) });
      });
    }

    // Quantiza cada duração para um número INTEIRO de frames a 30fps, usando o
    // tempo acumulado como referência. Sem isto, cada duração é arredondada para
    // cima ao encaixar na grelha de fps e o erro soma-se (a legenda vai ficando
    // cada vez mais atrasada em relação à voz).
    const FPS = 30;
    let exactAcc = 0;
    let emitted = 0;
    const quantized = frames.map((f) => {
      exactAcc += f.seconds;
      const target = Math.round(exactAcc * FPS);
      const n = Math.max(1, target - emitted);
      emitted += n;
      return { file: f.file, seconds: n / FPS };
    });

    const listFile = `${tmp}/frames.txt`;
    const body = quantized
      .map((f) => `file '${f.file.split('/').pop()}'\nduration ${f.seconds.toFixed(6)}`)
      .join('\n');
    writeFileSync(listFile, `${body}\nfile '${quantized.at(-1)!.file.split('/').pop()}'\n`);

    const total = emitted / FPS;

    // Concatenar MP3 com `-c copy` acrescenta padding por ficheiro (~0.5s cada),
    // o que faria a voz atrasar-se progressivamente. O filtro `concat` decodifica
    // e junta sem intervalos, mantendo a sincronia.
    const hasVoice = withVoice && voiceFiles.length > 0;

    // Zoom lento e contínuo (retenção sem ser brusco).
    // IMPORTANTE: `fps` tem de vir ANTES do zoompan — senão o zoompan trata cada
    // imagem como um só frame e o vídeo colapsa para (nº imagens / fps) segundos.
    const fps = FPS;
    const totalFrames = Math.max(1, emitted);
    const zoomStep = (0.12 / totalFrames).toFixed(8); // ~12% de zoom ao longo do vídeo
    const zoom =
      `fps=${fps},scale=${Math.round(W * 1.3)}:${Math.round(H * 1.3)},` +
      `zoompan=z='min(1+${zoomStep}*on,1.12)':d=1:fps=${fps}:` +
      `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${W}x${H},format=yuv420p`;

    const inputs = ['-f', 'concat', '-safe', '0', '-i', listFile];
    const filters = [`[0:v]${zoom}[v]`];
    const maps = ['-map', '[v]'];

    // Índices: [0] imagens · [1..n] vozes · [n+1] música
    if (hasVoice) {
      voiceFiles.forEach((v) => inputs.push('-i', v));
      const chain = voiceFiles.map((_, i) => `[${i + 1}:a]`).join('');
      filters.push(`${chain}concat=n=${voiceFiles.length}:v=0:a=1[voice]`);
    }

    if (hasVoice && hasMusic) {
      const mi = voiceFiles.length + 1;
      inputs.push('-stream_loop', '-1', '-i', AUDIO);
      filters.push(
        `[${mi}:a]atrim=0:${total},volume=0.08,afade=t=out:st=${Math.max(0, total - 2)}:d=2[bg]`,
        `[voice][bg]amix=inputs=2:duration=first:dropout_transition=0[a]`,
      );
      maps.push('-map', '[a]');
    } else if (hasVoice) {
      maps.push('-map', '[voice]');
    } else if (hasMusic) {
      inputs.push('-stream_loop', '-1', '-i', AUDIO);
      filters.push(`[1:a]atrim=0:${total},volume=0.35[a]`);
      maps.push('-map', '[a]');
    }

    const out = `${dir}/video.mp4`;
    const cmd = [
      '-y',
      ...inputs,
      '-filter_complex',
      filters.join(';'),
      ...maps,
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '20',
      ...(hasVoice || hasMusic ? ['-c:a', 'aac', '-b:a', '128k', '-shortest'] : []),
      '-movflags',
      '+faststart',
      out,
    ];

    try {
      execFileSync(ffmpeg, cmd, { stdio: ['ignore', 'ignore', 'pipe'] });
    } catch (err) {
      const e = err as { stderr?: Buffer; message?: string };
      console.error('ffmpeg falhou:\n', e.stderr?.toString().slice(-2500) ?? e.message);
      process.exit(1);
    }

    rmSync(tmp, { recursive: true, force: true });
    console.log(`✓ ${out} — ${total.toFixed(1)}s, ${frames.length} frames${withVoice ? ' + voz' : ''}${hasMusic ? ' + música' : ''}`);
  }
}

main().catch((err) => {
  console.error('❌', err instanceof Error ? err.message : err);
  process.exit(1);
});
