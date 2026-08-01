// Lê content/blog/manifest.json e gera, por artigo e idioma, os assets sociais
// prontos a publicar em social/<slug>/<lang>/ (texto + links rastreáveis).
//
//   npm run social:assets                 → todos os artigos
//   npm run social:assets -- --slug=diario-de-gratidao --lang=pt-br
//
// Fase 1: publicação MANUAL (copiar destes ficheiros). Fase 4 alimentará o
// adaptador do Zernio com as mesmas peças.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { buildPieces } from '../lib/social/adapt';
import type { SocialManifestEntry } from '../lib/social/types';

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

if (targets.length === 0) {
  console.error('Nenhum artigo corresponde aos filtros.');
  process.exit(1);
}

for (const entry of targets) {
  const dir = `social/${entry.slug}/${entry.lang}`;
  mkdirSync(dir, { recursive: true });
  const pieces = buildPieces(entry);
  const links: Record<string, string> = {};

  for (const p of pieces) {
    links[p.platform] = p.link;
    if (p.format === 'video') {
      writeFileSync(`${dir}/${p.platform}.txt`, `${p.videoScript}\n\n— LEGENDA (colar) —\n${p.caption}\n`);
    } else if (p.format === 'pin') {
      writeFileSync(`${dir}/pinterest.txt`, `${p.caption}\n\nIMAGEM (Pin): ${p.image ?? '(sem capa)'}\n`);
    } else {
      writeFileSync(`${dir}/facebook.txt`, `${p.caption}\n\n(Preview OG puxa a capa do artigo automaticamente.)\n`);
    }
  }

  writeFileSync(`${dir}/links.json`, `${JSON.stringify(links, null, 2)}\n`);

  const overview = [
    `# ${entry.title}`,
    `Idioma: ${entry.lang} · Artigo: ${entry.url}`,
    '',
    '## Onde publicar',
    '- **TikTok / YouTube Shorts** → grava o vídeo com `tiktok.txt` / `youtube.txt` (link na descrição/bio).',
    '- **Pinterest** → cria o Pin com a capa e o texto de `pinterest.txt`.',
    '- **Facebook** → publica `facebook.txt` (o preview OG puxa a imagem).',
    '',
    '## Links rastreáveis (UTM por plataforma)',
    '```json',
    JSON.stringify(links, null, 2),
    '```',
    '',
    '> Cada link leva ao artigo; o botão da Play no site propaga o UTM para o *install referrer*,',
    '> por isso consegues medir instalações por canal no GA4 / Play Console.',
    '',
  ].join('\n');
  writeFileSync(`${dir}/README.md`, `${overview}\n`);
}

console.log(`✓ social/ gerado para ${targets.length} peça(s)-artigo (${new Set(targets.map((t) => t.slug)).size} artigos).`);
