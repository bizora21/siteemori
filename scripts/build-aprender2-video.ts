// Vídeo 3D de produto v2 (TikTok): a aba "Aprender a Bíblia" com as novidades da app v23.
// Voz feminina pt-BR + tempo por palavra → props do Remotion (composição Aprender3D, version 2).
//
//   npm run video3d:aprender2                → voz + props + render
//   npm run video3d:aprender2 -- --no-render → só voz + props (para ver no Studio)
//
// Só mostra o que a app FAZ hoje (E:\global\src\screens\learn): percurso de 15 níveis em 5 etapas,
// estrelas por nível, meta do dia, dica (tira duas erradas), versículo com explicação, rever o que
// errei, pontos, sequência de dias, conquistas e lembretes suaves. Dados do ecrã são de demonstração.

import { writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { synthesize, cleanNarration, toCaptionLines, type WordTiming } from '../lib/social/tts';

const ID = 'aprender-biblia-v3';
const LANG = 'pt-br' as const;

/** Uma cena = um trecho da narração. A imagem muda quando a voz chega ao trecho. */
const CENAS = [
  'Você acerta esta? Que livro da Bíblia reúne cento e cinquenta cânticos e orações? Pense rápido. É Salmos!',
  'Na Emori, a aba Aprender a Bíblia leva você por quinze níveis, do mais fácil ao mais profundo.',
  'São cinco etapas, de Fundamentos até a Maestria, e cada nível rende até três estrelas.',
  'Cada rodada tem dez perguntas. Ficou em dúvida? Peça uma dica e duas respostas erradas somem. Escolheu? Na hora aparece o versículo com a explicação.',
  'Errou? Sem problema. A Emori guarda a pergunta para você rever depois.',
  'Cumpriu a meta do dia? Você ganha pontos, mantém sua sequência, desbloqueia conquistas e ainda recebe lembretes suaves.',
  'Você consegue, e pode começar hoje. Baixe a Emori, um aplicativo bíblico de fé e orações. Link na bio.',
];

const FPS = 30;
// A voz entra quase no primeiro quadro: é nos 2 primeiros segundos que se decide se a pessoa fica.
const LEAD = 0.1;
const TAIL = 2.6;

const render = !process.argv.includes('--no-render');
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');

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
      ({ words, duration } = await synthesize(narration, LANG, `video3d/public/audio/${ID}.mp3`, '-2%'));
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

  const tokens = narration.split(/\s+/);
  let j = 0;
  for (const w of words) {
    const k = tokens.findIndex((tok, idx) => idx >= j && norm(tok) === norm(w.text));
    if (k < 0) continue;
    w.text = tokens[k];
    j = k + 1;
  }

  const sceneStarts: number[] = [];
  let acc = 0;
  CENAS.forEach((c, i) => {
    const n = cleanNarration(c).split(/\s+/).length;
    const idx = Math.min(words.length - 1, Math.round((acc * words.length) / expected));
    sceneStarts.push(i === 0 ? 0 : words[idx].start + LEAD - 0.15);
    acc += n;
  });

  // Instantes-chave: o toque, a revelação e o lembrete acompanham a palavra dita pela voz.
  const at = (word: string, after: number, fallback: number) => {
    const w = words.find((x) => norm(x.text) === word && x.start + LEAD > after);
    return w ? w.start + LEAD : fallback;
  };
  const tapHint = at('dica', sceneStarts[3], sceneStarts[3] + 3) + 0.1;
  const tapRight = at('escolheu', tapHint, tapHint + 3) + 0.15;
  const badgesAt = at('conquistas', sceneStarts[5], sceneStarts[5] + 7) - 0.4;
  const remindAt = at('lembretes', badgesAt, badgesAt + 3) - 0.2;

  // Gancho-desafio: contagem 3-2-1 depois da pergunta e resposta quando a voz diz "Salmos".
  const lastQ = [...words].reverse().find((x) => norm(x.text) === 'oracoes' && x.start + LEAD < sceneStarts[1]);
  const countFrom = lastQ ? lastQ.end + LEAD + 0.05 : 5;
  const reveal = at('salmos', countFrom, countFrom + 2) - 0.05;

  const shifted = words.map((w) => ({ ...w, start: w.start + LEAD, end: w.end + LEAD }));
  const lines = toCaptionLines(shifted, 4, 22);
  const total = LEAD + duration + TAIL;
  const props = {
    version: 2,
    hook: { countFrom, reveal },
    audio: `audio/${ID}.mp3`,
    music: 'spirit.mp3',
    lines,
    durationInFrames: Math.ceil(total * FPS),
    leadSeconds: LEAD,
    voiceEndSeconds: LEAD + duration,
    sceneStarts,
    tapRight,
    tapWrong: 0,
    tapHint,
    badgesAt,
    remindAt,
    cta: 'Link na bio',
    site: 'Baixe a Emori',
  };
  writeFileSync(`video3d/props/${ID}.json`, JSON.stringify(props, null, 2));
  console.log(`  ✓ ${total.toFixed(1)}s, ${words.length} palavras, ${lines.length} legendas`);
  console.log(`  cenas (s): ${sceneStarts.map((s) => s.toFixed(1)).join(' · ')}`);
  console.log(`  gancho: contagem ${countFrom.toFixed(1)}s → resposta ${reveal.toFixed(1)}s`);
  console.log(`  dica ${tapHint.toFixed(1)}s | resposta ${tapRight.toFixed(1)}s | conquistas ${badgesAt.toFixed(1)}s | lembrete ${remindAt.toFixed(1)}s`);

  if (render) {
    const r = spawnSync(
      'npx',
      ['remotion', 'render', 'src/index.ts', 'Aprender3D', `out/${ID}.mp4`, `--props=props/${ID}.json`],
      { cwd: 'video3d', stdio: 'inherit', shell: true },
    );
    if (r.status !== 0) throw new Error('render falhou');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
