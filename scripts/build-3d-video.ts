// Prepara os vídeos 3D curtos (TikTok): voz feminina + tempo por palavra → props do Remotion.
//
//   npm run video3d              → prepara e renderiza todos
//   npm run video3d -- --id=salmo-46   → só um
//   npm run video3d -- --no-render     → só voz + props (para abrir no Remotion Studio)
//
// A cena 3D vive em video3d/ (projeto isolado, para não pesar o deploy do site).

import { writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { synthesize, cleanNarration, toCaptionLines, VOICE, type WordTiming } from '../lib/social/tts';
import type { Locale } from '../i18n/config';

interface Video3D {
  id: string;
  lang: Locale;
  /** linhas do título em 3D (MAIÚSCULAS, no máx. ~12 caracteres cada) */
  title: string[];
  /** narração: gancho (3s) → ideia única → CTA */
  text: string;
  slug: string;
  /** CTA final (omitido = "Link na bio ↑" + aemori.com) */
  cta?: string;
  site?: string;
  /** s antes da primeira palavra (omitido = 0,5). Ganchos curtos pedem ~0,1. */
  lead?: number;
}

const VIDEOS: Video3D[] = [
  {
    id: 'salmo-46',
    lang: 'pt-br',
    slug: 'salmo-46-explicado',
    title: ['SALMO 46', 'LIDO ERRADO'],
    text:
      'Você lê o Salmo 46 errado. Aquietai-vos e sabei que eu sou Deus não é só um convite à calma. Deus diz isso às nações em guerra: parem de lutar. Solte o que você não controla, porque ele é socorro bem presente na angústia. A explicação completa está no link da bio.',
  },
  {
    id: 'salmo-121',
    lang: 'pt-br',
    slug: 'salmo-121-explicado',
    title: ['SALMO 121', 'NÃO DORME'],
    text:
      'Três da manhã e o sono não vem? O Salmo 121 diz que o guarda de Israel não dormita nem dorme. Seis vezes, esse salmo repete a palavra guardar. Você pode descansar, porque alguém já está vigiando. O estudo completo está no link da bio.',
  },
  {
    id: 'salmo-91',
    lang: 'pt-br',
    slug: 'salmo-91-explicado',
    title: ['SALMO 91', 'A VERDADE'],
    text:
      'O Salmo 91 não promete que nada de mau vai acontecer. Até Satanás o citou para tentar Jesus, e Jesus recusou essa leitura. A promessa é outra: estarei com ele na angústia. Descubra o que o salmo realmente diz, no link da bio.',
  },
  {
    // Artigo: como-ouvir-a-voz-de-deus (1 Reis 19:11-13). CTA: Emori na Play Store.
    id: 'voz-de-deus',
    lang: 'pt-br',
    slug: 'como-ouvir-a-voz-de-deus',
    title: ['NEM NO VENTO', 'NEM NO FOGO'],
    lead: 0.1,
    cta: 'Baixe na Play Store',
    site: 'Emori · aplicativo bíblico',
    text:
      'Deus não estava no vento. Nem no terremoto. Nem no fogo. Então onde ele estava? O profeta Elias descobriu numa caverna: Deus estava numa voz mansa e delicada. Muitas vezes ele fala no sutil, não no espetacular. Para ouvir, você precisa parar e prestar atenção. Na Emori você guarda o que Deus fala com você. Baixe na Play Store.',
  },
];

const FPS = 30;
const LEAD = 0.5; // s antes da primeira palavra
const TAIL = 1.6; // s depois da última (CTA respira)

const arg = (n: string) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=')[1];
const only = arg('id');
const render = !process.argv.includes('--no-render');

async function main() {
  mkdirSync('video3d/public/audio', { recursive: true });
  mkdirSync('video3d/props', { recursive: true });
  mkdirSync('video3d/out', { recursive: true });

  for (const v of VIDEOS.filter((x) => !only || x.id === only)) {
    console.log(`\n▶ ${v.id} — voz ${VOICE[v.lang]}`);
    const narration = cleanNarration(v.text);
    const expected = narration.split(/\s+/).length;
    // A ligação ao Edge TTS corta o áudio de vez em quando: só aceita a síntese completa.
    let words: WordTiming[] = [];
    let duration = 0;
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      try {
        ({ words, duration } = await synthesize(
          narration,
          v.lang,
          `video3d/public/audio/${v.id}.mp3`,
          '-4%',
        ));
      } catch (err) {
        console.warn(`  ⚠ voz indisponível, tentativa ${attempt}/5`);
        if (attempt === 5) throw err;
        await new Promise((r) => setTimeout(r, 4000 * attempt));
        continue;
      }
      if (words.length >= expected * 0.95) break;
      console.warn(`  ⚠ síntese incompleta (${words.length}/${expected} palavras), tentativa ${attempt}/5`);
      if (attempt === 5) throw new Error(`voz incompleta: ${v.id}`);
    }
    // O Edge devolve as palavras sem pontuação: repõe-a a partir do texto, para as legendas
    // quebrarem em unidades de sentido (só quando a contagem bate certo).
    const tokens = narration.split(/\s+/);
    const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    let j = 0;
    for (const w of words) {
      const k = tokens.findIndex((tok, idx) => idx >= j && norm(tok) === norm(w.text));
      if (k < 0) continue;
      w.text = tokens[k];
      j = k + 1;
    }
    const lead = v.lead ?? LEAD;
    const shifted = words.map((w) => ({ ...w, start: w.start + lead, end: w.end + lead }));
    const lines = toCaptionLines(shifted, 4, 24);
    const total = lead + duration + TAIL;
    const props = {
      title: v.title,
      audio: `audio/${v.id}.mp3`,
      lines,
      durationInFrames: Math.ceil(total * FPS),
      leadSeconds: lead,
      voiceEndSeconds: lead + duration,
      cta: v.cta ?? 'Link na bio',
      site: v.site ?? 'aemori.com',
      ctaArrow: v.cta === undefined,
      skipIntro: v.lead !== undefined,
    };
    writeFileSync(`video3d/props/${v.id}.json`, JSON.stringify(props, null, 2));
    console.log(`  ✓ ${total.toFixed(1)}s, ${words.length} palavras, ${lines.length} linhas de legenda`);

    if (render) {
      const r = spawnSync(
        'npx',
        ['remotion', 'render', 'src/index.ts', 'Verse3D', `out/${v.id}.mp4`, `--props=props/${v.id}.json`],
        { cwd: 'video3d', stdio: 'inherit', shell: true },
      );
      if (r.status !== 0) throw new Error(`render falhou: ${v.id}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
