// Vídeo 3D da TOACA EXPRESS para quem envia ou recebe uma encomenda: rastreio em comboio de
// passageiros, linha Beira → Dondo → Cheringoma → Caia → Mutarara → Moatize.
// A empresa cuida de tudo, do recebimento ao destino final; o logótipo fecha o vídeo.
// Voz feminina pt-PT + tempo por palavra → props do Remotion (composição Rastreio3D).
//
//   npm run video3d:comboio              → voz + props + render
//   npm run video3d:comboio -- --no-render   → só voz + props (para ver no Studio)
//
// Só mostra o que o sistema FAZ hoje. Em particular, NÃO promete SMS automático ao
// destinatário: não existe (a Edge Function enviar-sms não está implantada).

import { writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { synthesize, cleanNarration, toCaptionLines, type WordTiming } from '../lib/social/tts';

const ID = 'rastreio-comboio-toaca';
const LANG = 'pt-br' as const; // voz feminina brasileira, a pedido

/** Uma cena = um trecho da narração. A imagem muda quando a voz chega ao trecho. */
const CENAS = [
  'Vai enviar uma encomenda, ou já enviou, e não sabe onde ela está?',
  'A Toaca Express cuida de tudo para você, desde o recebimento da encomenda, até o destino final. Você recebe um código, no talão.',
  'Para acompanhar, abra o site no celular, escreva o código, e pronto. Sem criar conta e sem instalar nada. Assim que a estação registra, você vê onde a encomenda está.',
  'Você vê até a foto da sua encomenda, tirada quando ela foi recebida, e o nome de quem enviou.',
  'Acompanhe a viagem de comboio, da Beira até Moatize, passando por Dondo, Cheringoma, Caia e Mutarara. Recebida, a caminho, chegou ao destino, e entregue.',
  'E os seus dados ficam protegidos. O seu telefone nunca aparece, e o seu nome surge abreviado.',
  'Toaca Express. Do recebimento até a entrega, a sua encomenda em boas mãos. Acompanhe agora.',
];

const FPS = 30;
const LEAD = 0.5; // s antes da primeira palavra
const TAIL = 2.2; // s depois da última (o fecho respira)

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

  // Início de cada cena = instante da sua primeira palavra (proporcional se a
  // contagem de palavras da voz não bater certo com o texto).
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
    lines,
    durationInFrames: Math.ceil(total * FPS),
    leadSeconds: LEAD,
    voiceEndSeconds: LEAD + duration,
    sceneStarts,
    music: 'lunatic-ideas.mp3',
    musicStart: 20,
    cta: 'Rastreie agora',
    site: 'rastreio.movagomz.com',
  };
  writeFileSync(`video3d/props/${ID}.json`, JSON.stringify(props, null, 2));
  console.log(`  ✓ ${total.toFixed(1)}s, ${words.length} palavras, ${lines.length} legendas`);
  console.log(`  cenas (s): ${sceneStarts.map((s) => s.toFixed(1)).join(' · ')}`);

  if (render) {
    const r = spawnSync(
      'npx',
      ['remotion', 'render', 'src/index.ts', 'RastreioComboio3D', `out/${ID}.mp4`, `--props=props/${ID}.json`],
      { cwd: 'video3d', stdio: 'inherit', shell: true },
    );
    if (r.status !== 0) throw new Error('render falhou');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
