// Gera o vídeo vertical (1080×1920) de cada artigo — in-house, sem serviços externos.
// Cenas (gancho → 3 pontos → CTA) renderizadas em PNG pelo resvg e montadas pelo
// ffmpeg com fades + música de fundo opcional.
//
//   npm run social:video -- --slug=diario-de-gratidao --lang=pt-br
//   npm run social:video                      → todos os artigos (demora)
//
// Música: assets/audio/calm.mp3 (gitignored — Pixabay não permite redistribuir o
// ficheiro). Se não existir, o vídeo é gerado à mesma, em silêncio.

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { Resvg } from '@resvg/resvg-js';
import ffmpegPath from 'ffmpeg-static';
import type { SocialManifestEntry } from '../lib/social/types';

const W = 1080;
const H = 1920;
const PAD = 110;
const FONTS = ['assets/fonts/PTSerif-Bold.ttf', 'assets/fonts/PTSerif-Regular.ttf'];
const AUDIO = 'assets/audio/calm.mp3';
const FADE = 0.6; // segundos de transição entre cenas

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

interface Scene {
  eyebrow?: string;
  title: string;
  body?: string;
  seconds: number;
  accent?: boolean;
}

/** Uma cena: fundo creme, lua, rótulo, título serifado grande e corpo opcional. */
function sceneSvg(scene: Scene): string {
  const titleSize = scene.title.length > 60 ? 62 : scene.title.length > 34 ? 72 : 84;
  const titleMax = scene.title.length > 60 ? 24 : 20;
  const titleLines = wrap(scene.title, titleMax).slice(0, 7);
  const lineH = titleSize + 22;
  const bodyLines = scene.body ? wrap(scene.body, 32).slice(0, 6) : [];

  // Bloco de texto centrado verticalmente.
  const totalH = titleLines.length * lineH + (bodyLines.length ? 60 + bodyLines.length * 52 : 0);
  const top = Math.max(420, (H - totalH) / 2);

  const titleEls = titleLines
    .map(
      (l, i) =>
        `<text x="${PAD}" y="${top + i * lineH}" font-family="PT Serif" font-weight="bold" font-size="${titleSize}" fill="${scene.accent ? '#84391b' : '#2a2420'}">${xmlEscape(l)}</text>`,
    )
    .join('\n  ');

  const bodyTop = top + titleLines.length * lineH + 60;
  const bodyEls = bodyLines
    .map(
      (l, i) =>
        `<text x="${PAD}" y="${bodyTop + i * 52}" font-family="PT Serif" font-weight="normal" font-size="40" fill="#6f6154">${xmlEscape(l)}</text>`,
    )
    .join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <mask id="moon">
      <rect width="${W}" height="${H}" fill="black"/>
      <circle cx="820" cy="300" r="240" fill="white"/>
      <circle cx="920" cy="235" r="220" fill="black"/>
    </mask>
  </defs>
  <rect width="${W}" height="${H}" fill="#faf5ec"/>
  <rect width="${W}" height="${H}" fill="#f3ddc9" mask="url(#moon)"/>
  ${scene.eyebrow ? `<text x="${PAD}" y="290" font-family="PT Serif" font-weight="bold" font-size="34" letter-spacing="7" fill="#a2481f">${xmlEscape(scene.eyebrow)}</text>` : ''}
  ${titleEls}
  ${bodyEls}
  <rect x="${PAD}" y="1700" width="130" height="5" fill="#dd9470"/>
  <text x="${PAD}" y="1790" font-family="PT Serif" font-weight="bold" font-size="46" fill="#84391b">aemori.com</text>
</svg>`;
}

function renderScene(scene: Scene, file: string) {
  const png = new Resvg(sceneSvg(scene), {
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
  return [
    { eyebrow: 'DIÁRIO EMOCIONAL', title: entry.title, seconds: 5 },
    ...points.map((f) => ({
      title: f.q,
      body: firstSentence(f.a),
      seconds: 7,
    })),
    {
      title: isPT ? 'A Emori lembra-se de ti.' : 'A Emori lembra de você.',
      body: isPT
        ? 'Guia completo e app gratuita no site.'
        : 'Guia completo e app grátis no site.',
      seconds: 6,
      accent: true,
    },
  ];
}

// ---- run ---------------------------------------------------------------------

const manifest: SocialManifestEntry[] = JSON.parse(readFileSync('content/blog/manifest.json', 'utf8'));
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
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
const hasAudio = existsSync(AUDIO);
if (!hasAudio) {
  console.warn(`⚠ ${AUDIO} não encontrado — vídeo será gerado sem música.`);
}

for (const entry of targets) {
  const dir = `social/${entry.slug}/${entry.lang}`;
  const tmp = `${dir}/.frames`;
  mkdirSync(tmp, { recursive: true });

  const scenes = buildScenes(entry);
  scenes.forEach((s, i) => renderScene(s, `${tmp}/scene-${i}.png`));

  const total = scenes.reduce((a, s) => a + s.seconds, 0);

  // Cada cena vira um clip com fade in/out; concatenados em sequência.
  const inputs: string[] = [];
  const filters: string[] = [];
  scenes.forEach((s, i) => {
    inputs.push('-loop', '1', '-t', String(s.seconds), '-i', `${tmp}/scene-${i}.png`);
    filters.push(
      `[${i}:v]scale=${W}:${H},fps=30,format=yuv420p,` +
        `fade=t=in:st=0:d=${FADE},fade=t=out:st=${s.seconds - FADE}:d=${FADE}[v${i}]`,
    );
  });
  const concat = scenes.map((_, i) => `[v${i}]`).join('') + `concat=n=${scenes.length}:v=1:a=0[v]`;

  const audioArgs: string[] = [];
  let filterComplex = `${filters.join(';')};${concat}`;
  if (hasAudio) {
    audioArgs.push('-i', AUDIO);
    const ai = scenes.length; // índice do input de áudio
    filterComplex += `;[${ai}:a]atrim=0:${total},afade=t=in:st=0:d=1,afade=t=out:st=${total - 2}:d=2,volume=0.35[a]`;
  }

  const out = `${dir}/video.mp4`;
  const cmd = [
    '-y',
    ...inputs,
    ...audioArgs,
    '-filter_complex',
    filterComplex,
    '-map',
    '[v]',
    ...(hasAudio ? ['-map', '[a]'] : []),
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '20',
    '-pix_fmt',
    'yuv420p',
    ...(hasAudio ? ['-c:a', 'aac', '-b:a', '128k'] : []),
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
  console.log(`✓ ${out} (${total}s${hasAudio ? ' + música' : ', sem música'})`);
}
