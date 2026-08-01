// Gera a imagem do Pin (Pinterest 2:3, 1000×1500) para cada artigo — SVG de marca
// renderizado a PNG via @resvg/resvg-js, com fontes empacotadas (assets/fonts) para
// dar exatamente o mesmo resultado em Windows e no Linux da GitHub Action.
//
//   npm run social:images
//   npm run social:images -- --slug=diario-de-gratidao --lang=pt-br
//
// In-house, zero custo, sem Canva nem contas.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import type { SocialManifestEntry } from '../lib/social/types';

const W = 1000;
const H = 1500;
const PAD = 90;
const FONTS = ['assets/fonts/PTSerif-Bold.ttf', 'assets/fonts/PTSerif-Regular.ttf'];

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Quebra o título em linhas por palavras (SVG não faz wrap automático).
function wrap(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function pinSvg(entry: SocialManifestEntry): string {
  const eyebrow = 'DIÁRIO EMOCIONAL';
  const readMore = entry.lang === 'pt-pt' ? 'Lê o guia gratuito' : 'Leia o guia grátis';

  // Título com tamanho adaptativo ao comprimento.
  const clean = entry.title;
  const size = clean.length > 52 ? 58 : 66;
  const maxChars = clean.length > 52 ? 22 : 20;
  const lineH = size + 20;
  const lines = wrap(clean, maxChars).slice(0, 6);
  const blockTop = 430;
  const titleTspans = lines
    .map(
      (l, i) =>
        `<text x="${PAD}" y="${blockTop + i * lineH}" font-family="PT Serif" font-weight="bold" font-size="${size}" fill="#2a2420">${xmlEscape(l)}</text>`,
    )
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <mask id="moon">
      <rect width="${W}" height="${H}" fill="black"/>
      <circle cx="795" cy="250" r="205" fill="white"/>
      <circle cx="880" cy="195" r="188" fill="black"/>
    </mask>
  </defs>
  <rect width="${W}" height="${H}" fill="#faf5ec"/>
  <rect width="${W}" height="${H}" fill="#f3ddc9" mask="url(#moon)"/>
  <text x="${PAD}" y="200" font-family="PT Serif" font-weight="bold" font-size="30" letter-spacing="6" fill="#a2481f">${eyebrow}</text>
  ${titleTspans}
  <rect x="${PAD}" y="1300" width="120" height="4" fill="#dd9470"/>
  <text x="${PAD}" y="1370" font-family="PT Serif" font-weight="normal" font-size="34" fill="#6f6154">${xmlEscape(readMore)}</text>
  <text x="${PAD}" y="1420" font-family="PT Serif" font-weight="bold" font-size="40" fill="#84391b">aemori.com</text>
</svg>`;
}

// ---- run ---------------------------------------------------------------------

const manifest: SocialManifestEntry[] = JSON.parse(
  readFileSync('content/blog/manifest.json', 'utf8'),
);

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);

let targets = manifest;
if (args.slug) targets = targets.filter((e) => e.slug === args.slug);
if (args.lang) targets = targets.filter((e) => e.lang === args.lang);

for (const entry of targets) {
  const dir = `social/${entry.slug}/${entry.lang}`;
  mkdirSync(dir, { recursive: true });
  const svg = pinSvg(entry);
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: W },
    font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'PT Serif' },
    background: '#faf5ec',
  })
    .render()
    .asPng();
  writeFileSync(`${dir}/pin.png`, png);
}

console.log(`✓ pin.png gerado para ${targets.length} peça(s) (${new Set(targets.map((t) => t.slug)).size} artigos).`);
