// Gera o vídeo vertical (1080×1920) de cada artigo — in-house, sem serviços pagos.
//
//   npm run social:video -- --slug=diario-de-gratidao --lang=pt-br
//   npm run social:video -- --slug=… --lang=… --no-voice      (sem voz off)
//
// Como funciona:
//   1. Cada cena vira narração → Edge TTS (voz neural PT grátis) devolve o áudio
//      e o tempo exato de cada palavra;
//   2. As palavras são agrupadas em legendas curtas e cada uma vira um frame PNG
//      (resvg), com a duração exata da fala → legendas perfeitamente sincronizadas;
//   3. ffmpeg junta os frames, a voz e (se existir) a música de fundo.
//
// Música: assets/audio/calm.mp3 (gitignored — Pixabay não permite redistribuir).
// Sem o ficheiro, o vídeo sai só com voz.

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { Resvg } from '@resvg/resvg-js';
import ffmpegPath from 'ffmpeg-static';
import type { SocialManifestEntry } from '../lib/social/types';
import { synthesize, toCaptions, cleanNarration, type WordTiming } from '../lib/social/tts';
import type { Locale } from '../i18n/config';

const W = 1080;
const H = 1920;
const PAD = 100;
const FONTS = ['assets/fonts/PTSerif-Bold.ttf', 'assets/fonts/PTSerif-Regular.ttf'];
const AUDIO = 'assets/audio/calm.mp3';

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

function firstSentence(text: string): string {
  const m = text.match(/^.*?[.!?](?:\s|$)/);
  return (m ? m[0] : text).trim();
}

/** Ícones do nicho (linha, estilo lucide) desenhados como path SVG. */
const ICONS: Record<string, string> = {
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
  sparkle: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z',
};

interface Scene {
  eyebrow?: string;
  title: string;
  narration: string;
  icon: keyof typeof ICONS;
  accent?: boolean;
  /** Cenas em que o título já é o texto falado — legenda seria redundante. */
  hideCaption?: boolean;
}

/** Uma cena com a legenda actual destacada em baixo. */
function frameSvg(scene: Scene, caption: string): string {
  const titleSize = scene.title.length > 58 ? 60 : scene.title.length > 32 ? 68 : 78;
  const titleLines = wrap(scene.title, scene.title.length > 58 ? 24 : 20).slice(0, 5);
  const lineH = titleSize + 20;
  const titleTop = 700;

  const titleEls = titleLines
    .map(
      (l, i) =>
        `<text x="${PAD}" y="${titleTop + i * lineH}" font-family="PT Serif" font-weight="bold" font-size="${titleSize}" fill="${scene.accent ? '#84391b' : '#2a2420'}">${xmlEscape(l)}</text>`,
    )
    .join('\n  ');

  // Legenda: bloco central-baixo, grande e legível sem som.
  const capLines = caption ? wrap(caption, 22).slice(0, 3) : [];
  // Logo abaixo do título (mantendo distância do rodapé, onde a UI do TikTok tapa).
  const capTop = titleTop + titleLines.length * lineH + 170;
  const capEls = capLines
    .map(
      (l, i) =>
        `<text x="${W / 2}" y="${capTop + i * 76}" text-anchor="middle" font-family="PT Serif" font-weight="bold" font-size="62" fill="#2a2420">${xmlEscape(l)}</text>`,
    )
    .join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <mask id="moon">
      <rect width="${W}" height="${H}" fill="black"/>
      <circle cx="830" cy="300" r="235" fill="white"/>
      <circle cx="930" cy="238" r="215" fill="black"/>
    </mask>
  </defs>
  <rect width="${W}" height="${H}" fill="#faf5ec"/>
  <rect width="${W}" height="${H}" fill="#f3ddc9" mask="url(#moon)"/>

  <g transform="translate(${PAD} 300) scale(2.6)" fill="none" stroke="#c05a2e" stroke-width="1.7"
     stroke-linecap="round" stroke-linejoin="round">
    <path d="${ICONS[scene.icon]}"/>
  </g>

  ${scene.eyebrow ? `<text x="${PAD}" y="520" font-family="PT Serif" font-weight="bold" font-size="32" letter-spacing="7" fill="#a2481f">${xmlEscape(scene.eyebrow)}</text>` : ''}
  ${titleEls}

  ${capLines.length ? `<rect x="${W / 2 - 60}" y="${capTop - 100}" width="120" height="4" fill="#dd9470"/>` : ''}
  ${capEls}

  <text x="${W / 2}" y="1790" text-anchor="middle" font-family="PT Serif" font-weight="bold" font-size="44" fill="#84391b">aemori.com</text>
</svg>`;
}

function renderFrame(scene: Scene, caption: string, file: string) {
  const png = new Resvg(frameSvg(scene, caption), {
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
  const points = entry.faq.slice(0, 3);
  const icons: (keyof typeof ICONS)[] = ['book', 'heart', 'sparkle'];

  return [
    {
      eyebrow: 'DIÁRIO EMOCIONAL',
      title: entry.title,
      narration: cleanNarration(entry.title),
      icon: 'moon',
      hideCaption: true,
    },
    // A pergunta fica no ecrã (título) e a voz narra só a resposta — assim a
    // legenda nunca repete o que já se lê em cima.
    ...points.map((f, i) => ({
      title: f.q,
      narration: cleanNarration(firstSentence(f.a)),
      icon: icons[i] ?? 'sparkle',
    })),
    {
      title: isPT ? 'A Emori lembra-se de ti.' : 'A Emori lembra de você.',
      narration: isPT
        ? 'A Emori lembra-se de ti. Guia completo e aplicação gratuita no site aemori ponto com.'
        : 'A Emori lembra de você. Guia completo e aplicativo grátis no site aemori ponto com.',
      icon: 'moon',
      accent: true,
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

  const ffmpeg = ffmpegPath as unknown as string;
  const withVoice = args['no-voice'] !== true;
  const hasMusic = existsSync(AUDIO);

  for (const entry of targets) {
    const dir = `social/${entry.slug}/${entry.lang}`;
    const tmp = `${dir}/.frames`;
    mkdirSync(tmp, { recursive: true });

    const scenes = buildScenes(entry);
    const frames: { file: string; seconds: number }[] = [];
    const voiceFiles: string[] = [];
    let sceneIndex = 0;

    for (const scene of scenes) {
      let captions: WordTiming[];

      if (withVoice) {
        const voiceFile = `${tmp}/voice-${sceneIndex}.mp3`;
        const { words } = await synthesize(scene.narration, entry.lang as Locale, voiceFile);
        voiceFiles.push(voiceFile);
        captions = toCaptions(words);
        // Pequena pausa no fim de cada cena, para respirar.
        if (captions.length) captions[captions.length - 1].end += 0.5;
      } else {
        // Sem voz: ritmo fixo de leitura.
        const chunks = wrap(scene.narration, 28);
        captions = chunks.map((c, i) => ({ text: c, start: i * 1.8, end: (i + 1) * 1.8 }));
      }

      captions.forEach((cap, i) => {
        const file = `${tmp}/f-${sceneIndex}-${i}.png`;
        renderFrame(scene, scene.hideCaption ? '' : cap.text, file);
        frames.push({ file, seconds: Math.max(0.5, cap.end - cap.start) });
      });
      sceneIndex += 1;
    }

    // Lista para o concat demuxer (duração exata por frame = sincronia perfeita).
    const listFile = `${tmp}/frames.txt`;
    const listBody = frames
      .map((f) => `file '${f.file.split('/').pop()}'\nduration ${f.seconds.toFixed(3)}`)
      .join('\n');
    writeFileSync(listFile, `${listBody}\nfile '${frames[frames.length - 1].file.split('/').pop()}'\n`);

    const total = frames.reduce((a, f) => a + f.seconds, 0);

    // Voz: concatena os ficheiros das cenas.
    let voiceFile: string | null = null;
    if (withVoice && voiceFiles.length) {
      const vList = `${tmp}/voices.txt`;
      writeFileSync(vList, voiceFiles.map((v) => `file '${v.split('/').pop()}'`).join('\n'));
      voiceFile = `${tmp}/voice.mp3`;
      execFileSync(ffmpeg, ['-y', '-f', 'concat', '-safe', '0', '-i', vList, '-c', 'copy', voiceFile], {
        stdio: ['ignore', 'ignore', 'pipe'],
      });
    }

    // Montagem final.
    const inputs = ['-f', 'concat', '-safe', '0', '-i', listFile];
    const filters: string[] = [];
    const maps = ['-map', '0:v'];

    if (voiceFile && hasMusic) {
      inputs.push('-i', voiceFile, '-stream_loop', '-1', '-i', AUDIO);
      filters.push(
        `[2:a]atrim=0:${total},volume=0.10,afade=t=out:st=${Math.max(0, total - 2)}:d=2[bg]`,
        `[1:a][bg]amix=inputs=2:duration=first:dropout_transition=0[a]`,
      );
      maps.push('-map', '[a]');
    } else if (voiceFile) {
      inputs.push('-i', voiceFile);
      maps.push('-map', '1:a');
    } else if (hasMusic) {
      inputs.push('-stream_loop', '-1', '-i', AUDIO);
      filters.push(`[1:a]atrim=0:${total},volume=0.35,afade=t=out:st=${Math.max(0, total - 2)}:d=2[a]`);
      maps.push('-map', '[a]');
    }

    const out = `${dir}/video.mp4`;
    const cmd = [
      '-y',
      ...inputs,
      ...(filters.length ? ['-filter_complex', filters.join(';')] : []),
      ...maps,
      '-vf',
      `scale=${W}:${H},fps=30,format=yuv420p`,
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '20',
      ...(voiceFile || hasMusic ? ['-c:a', 'aac', '-b:a', '128k', '-shortest'] : []),
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
    console.log(
      `✓ ${out} — ${total.toFixed(1)}s, ${frames.length} legendas` +
        `${withVoice ? ' + voz' : ''}${hasMusic ? ' + música' : ''}`,
    );
  }
}

main().catch((err) => {
  console.error('❌', err instanceof Error ? err.message : err);
  process.exit(1);
});
