// Vídeo 3D de produto: o rastreio, visto pelo dono da encomenda (cliente final).
// Voz feminina pt-PT + tempo por palavra → props do Remotion (composição Rastreio3D).
//
//   npm run video3d:rastreio              → voz + props + render
//   npm run video3d:rastreio -- --no-render   → só voz + props (para ver no Studio)
//
// Só mostra o que o sistema FAZ hoje. Em particular, NÃO promete SMS automático ao
// destinatário: não existe (a Edge Function enviar-sms não está implantada).

import { writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { synthesize, cleanNarration, toCaptionLines, type WordTiming } from '../lib/social/tts';

const ID = 'rastreio-clientes';
const LANG = 'pt-pt' as const; // Moçambique usa o português europeu

/** Uma cena = um trecho da narração. A imagem muda quando a voz chega ao trecho. */
const CENAS = [
  'Está à espera de uma encomenda e não sabe onde ela anda?',
  'Com o código de rastreio do talão, fica a saber tudo, a qualquer hora. Sem criar conta e sem instalar nada.',
  'Abra o site no telemóvel, escreva o código, e pronto. Vê logo o estado da encomenda, de onde saiu e para onde vai.',
  'Vê até a fotografia do seu volume, tal como foi entregue na estação, e o nome de quem o enviou. Assim reconhece a sua encomenda de imediato.',
  'Acompanhe cada passo do caminho: registada, a caminho, chegou ao destino e entregue. Com o local e a hora de cada etapa.',
  'E os seus dados ficam protegidos. Os telefones nunca aparecem, e o seu nome surge abreviado.',
  'Rastreie a sua encomenda agora. Escreva o código, e saiba onde ela está.',
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
    cta: 'Rastreie agora',
    site: 'rastreio.movagomz.com',
  };
  writeFileSync(`video3d/props/${ID}.json`, JSON.stringify(props, null, 2));
  console.log(`  ✓ ${total.toFixed(1)}s, ${words.length} palavras, ${lines.length} legendas`);
  console.log(`  cenas (s): ${sceneStarts.map((s) => s.toFixed(1)).join(' · ')}`);

  if (render) {
    const r = spawnSync(
      'npx',
      ['remotion', 'render', 'src/index.ts', 'Rastreio3D', `out/${ID}.mp4`, `--props=props/${ID}.json`],
      { cwd: 'video3d', stdio: 'inherit', shell: true },
    );
    if (r.status !== 0) throw new Error('render falhou');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
