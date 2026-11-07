// Anúncio 3D para donos de transportadoras (MOVAGO Logística).
// Objectivo único: o clique em "Saiba mais" → movagomz.com/logistica.
// Voz feminina brasileira + tempo por palavra → props do Remotion (Anuncio3D).
//
//   npm run video3d:anuncio                 → voz + props + render
//   npm run video3d:anuncio -- --no-render  → só voz + props (para ver no Studio)
//
// Só afirma o que a página movagomz.com/logistica afirma: código único sem conta,
// percurso com responsável por trecho, prova com foto e assinatura, funciona sem
// internet (app Android) e o piloto gratuito de 7 dias para as 5 primeiras.

import { writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { synthesize, cleanNarration, toCaptionLines, type WordTiming } from '../lib/social/tts';

const ID = 'anuncio-transportadoras';
const LANG = 'pt-br' as const; // voz brasileira, pedida para o anúncio

/** Estrutura de venda: dor → problema → solução → prova → oferta → CTA. */
const CENAS = [
  'Seu cliente liga toda hora perguntando onde está a encomenda?',
  'E quando a carga chega danificada ou atrasa, quem prova o que aconteceu? Sem prova, quem paga é você.',
  'Conheça a Movago, o sistema de rastreio para transportadoras. Cada encomenda ganha um código, e seu cliente acompanha sozinho, sem criar conta.',
  'Você vê o percurso inteiro, com o responsável de cada trecho. A entrega fica provada com foto e assinatura. E funciona até sem internet.',
  'E agora tem piloto gratuito de sete dias, para as cinco primeiras transportadoras.',
  'Clique em Saiba mais e peça a sua demonstração.',
];

const FPS = 30;
const LEAD = 0.4; // s antes da primeira palavra
const TAIL = 2.6; // s depois da última: o CTA fica no ecrã

const render = !process.argv.includes('--no-render');

async function main() {
  mkdirSync('video3d/public/audio', { recursive: true });
  mkdirSync('video3d/props', { recursive: true });
  mkdirSync('video3d/out', { recursive: true });

  const narration = cleanNarration(CENAS.join(' '));
  const expected = narration.split(/\s+/).length;
  console.log(`\n▶ ${ID} — voz feminina ${LANG}, ${expected} palavras`);

  let words: WordTiming[] = [];
  let duration = 0;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      ({ words, duration } = await synthesize(narration, LANG, `video3d/public/audio/${ID}.mp3`, '+0%'));
    } catch (err) {
      console.warn(`  ⚠ voz indisponível, tentativa ${attempt}/5`);
      if (attempt === 5) throw err;
      await new Promise((r) => setTimeout(r, 4000 * attempt));
      continue;
    }
    if (words.length >= expected * 0.95) break;
    console.warn(`  ⚠ síntese incompleta (${words.length}/${expected}), tentativa ${attempt}/5`);
    if (attempt === 5) throw new Error('voz incompleta');
  }

  // Repõe a pontuação nas palavras (o Edge devolve-as sem ela) para as legendas
  // quebrarem em unidades de sentido.
  const tokens = narration.split(/\s+/);
  const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  let j = 0;
  for (const w of words) {
    const k = tokens.findIndex((tok, idx) => idx >= j && norm(tok) === norm(w.text));
    if (k < 0) continue;
    w.text = tokens[k];
    j = k + 1;
  }

  // Início de cada cena = instante da sua primeira palavra.
  const sceneStarts: number[] = [];
  let acc = 0;
  CENAS.forEach((c, i) => {
    const n = cleanNarration(c).split(/\s+/).length;
    const idx = Math.min(words.length - 1, Math.round((acc * words.length) / expected));
    sceneStarts.push(i === 0 ? 0 : words[idx].start + LEAD - 0.15);
    acc += n;
  });

  const shifted = words.map((w) => ({ ...w, start: w.start + LEAD, end: w.end + LEAD }));
  const lines = toCaptionLines(shifted, 4, 22);
  const total = LEAD + duration + TAIL;
  const props = {
    audio: `audio/${ID}.mp3`,
    music: 'lunatic-ideas.mp3',
    lines,
    durationInFrames: Math.ceil(total * FPS),
    leadSeconds: LEAD,
    voiceEndSeconds: LEAD + duration,
    sceneStarts,
    cta: 'Saiba mais',
    site: 'movagomz.com/logistica',
  };
  writeFileSync(`video3d/props/${ID}.json`, JSON.stringify(props, null, 2));
  console.log(`  ✓ ${total.toFixed(1)}s, ${words.length} palavras, ${lines.length} legendas`);
  console.log(`  cenas (s): ${sceneStarts.map((s) => s.toFixed(1)).join(' · ')}`);

  if (render) {
    const r = spawnSync(
      'npx',
      ['remotion', 'render', 'src/index.ts', 'Anuncio3D', `out/${ID}.mp4`, `--props=props/${ID}.json`],
      { cwd: 'video3d', stdio: 'inherit', shell: true },
    );
    if (r.status !== 0) throw new Error('render falhou');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
