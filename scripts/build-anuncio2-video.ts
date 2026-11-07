// Anúncio 3D B — "torre de controlo": percurso, responsável por trecho e painel (MOVAGO Logística).
// Objectivo único: o clique em "Saiba mais" → movagomz.com/logistica.
// Voz feminina brasileira + tempo por palavra → props do Remotion (Anuncio3DB).
//
//   npm run video3d:anuncio2                   → voz + props + render
//   npm run video3d:anuncio2 -- --no-render    → só voz + props (para ver no Studio)
//
// Só afirma o que o sistema faz: código único, percurso com paragens e responsável
// por trecho, painel do admin, foto da recepção no rastreio do cliente, prova com
// foto e assinatura, e o piloto gratuito de 7 dias para as 5 primeiras.
// Fora de propósito, a pedido: nada sobre chamadas nem sobre funcionar sem internet.

import { writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { synthesize, cleanNarration, toCaptionLines, type WordTiming } from '../lib/social/tts';

const ID = 'anuncio-b';
const LANG = 'pt-br' as const; // voz brasileira, pedida para o anúncio

/** Criativo B: perda do rasto → percurso → controlo → cliente e prova → oferta → CTA.
 *  Sem chamadas e sem "funciona sem internet" (pedido expresso). */
const CENAS = [
  'Neste exato momento, você sabe onde está cada carga da sua transportadora?',
  'Sem controle do percurso, a carga se perde entre o armazém e o destino, e ninguém sabe em que trecho foi.',
  'A Movago resolve isso. Cada encomenda ganha um código e um percurso completo, com todas as paradas.',
  'No painel, você vê quem está com a carga em cada trecho, e a que horas ela passou.',
  'O seu cliente acompanha sozinho, só com o código, e vê até a foto da carga na recepção. E a entrega fica provada com foto e assinatura.',
  'Piloto gratuito de sete dias, para as cinco primeiras transportadoras.',
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
      ({ words, duration } = await synthesize(narration, LANG, `video3d/public/audio/${ID}.mp3`, '+2%'));
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
    musicStart: 30,
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
      ['remotion', 'render', 'src/index.ts', 'Anuncio3DB', `out/${ID}.mp4`, `--props=props/${ID}.json`],
      { cwd: 'video3d', stdio: 'inherit', shell: true },
    );
    if (r.status !== 0) throw new Error('render falhou');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
