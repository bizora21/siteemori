// Gera o vídeo vertical (1080×1920) de cada artigo — in-house, sem serviços pagos.
//
//   npm run social:video -- --slug=como-desabafar --lang=pt-br
//   npm run social:video -- --slug=… --lang=… --no-voice
//
// Sincronização: cada frame dura do início de uma palavra ao início da seguinte,
// e o último frame de cada cena estica-se até à duração REAL do áudio (medida com
// ffmpeg). Assim o vídeo nunca ganha nem perde tempo em relação à voz.
//
// Legendas: mostra a linha inteira e realça a palavra que está a ser lida (karaoke).
// Movimento: zoom lento e contínuo (retenção) — nunca brusco.
//
// Música: a 1ª faixa em assets/audio/ (gitignored), ligada com --music.

import {
  readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync, statSync, copyFileSync,
} from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { Resvg } from '@resvg/resvg-js';
import ffmpegPath from 'ffmpeg-static';
import type { SocialManifestEntry } from '../lib/social/types';
import {
  synthesize,
  toCaptionLines,
  cleanNarration,
  type CaptionLine,
} from '../lib/social/tts';
import type { Locale } from '../i18n/config';
import { visualForText, visualQuery } from '../lib/social/visuals';
import { synthesizePiper, piperAvailable } from '../lib/social/piper';
import { fetchBackground, type BackgroundClip } from '../lib/social/pexels';

const W = 1080;
const H = 1920;
const PAD = 100;
const FONTS = ['assets/fonts/PTSerif-Bold.ttf', 'assets/fonts/PTSerif-Regular.ttf'];
const AUDIO_DIR = 'assets/audio';
const ffmpeg = ffmpegPath as unknown as string;

/**
 * Primeira faixa em assets/audio/. Aceita qualquer nome de propósito: o nome
 * do ficheiro traz o título e o artista, e é isso que tem de ir no crédito da
 * descrição — obrigar a renomear para "calm.mp3" apagava essa informação.
 */
function musicTrack(): string | null {
  if (!existsSync(AUDIO_DIR)) return null;
  const f = readdirSync(AUDIO_DIR).find((n) => /\.(mp3|m4a|wav|ogg)$/i.test(n));
  return f ? `${AUDIO_DIR}/${f}` : null;
}

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

/** Duração real de um ficheiro de áudio, em segundos (via ffmpeg).
 *  Usa spawnSync porque o ffmpeg escreve a duração no stderr e termina com
 *  sucesso — com execFileSync+try/catch o valor perdia-se e vinha 0. */
/** Corre o ffmpeg e falha ruidosamente, com o stderr que interessa. */
function run(bin: string, args: string[]): void {
  try {
    execFileSync(bin, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (err) {
    const e = err as { stderr?: Buffer; message?: string };
    throw new Error(e.stderr?.toString().slice(-1200) ?? e.message ?? 'ffmpeg falhou');
  }
}

/**
 * Corta o silêncio no FIM da faixa de voz (deixa 0,15s de respiração).
 *
 * O Piper fecha cada frase com meio segundo de silêncio. Como a duração da
 * cena é a duração real do áudio, esse silêncio esticava cada plano — e no
 * primeiro, que é o que decide a entrega, empurrava o corte para os 4,6s.
 * Sete cenas × meio segundo são também ~3s de vídeo sem nada a acontecer.
 *
 * Só o fim, nunca o início: os tempos das palavras vêm do TTS contados desde
 * o zero, e cortar à cabeça desalinharia a legenda toda.
 */
function trimTail(file: string, tmp: string): void {
  const out = `${tmp}/trim-${file.split('/').pop()}`;
  try {
    run(ffmpeg, [
      '-y', '-loglevel', 'error', '-i', file,
      '-af', 'areverse,silenceremove=start_periods=1:start_silence=0.15:start_threshold=-45dB,areverse',
      out,
    ]);
    if (existsSync(out) && statSync(out).size > 1000) copyFileSync(out, file);
  } catch {
    /* sem corte, segue com a faixa original */
  }
}

/**
 * Luminância média de um clip (0–255). Os clips do Pexels variam muito: uns
 * vêm quase pretos, outros lavados. Sem medir, o resultado dependia da sorte.
 */
function clipLuma(file: string): number {
  const res = spawnSync(
    ffmpeg,
    ['-t', '2', '-i', file, '-vf', 'signalstats,metadata=print:key=lavfi.signalstats.YAVG', '-f', 'null', '-'],
    { encoding: 'utf8' },
  );
  const vals = [...`${res.stderr ?? ''}`.matchAll(/YAVG=([0-9.]+)/g)].map((m) => +m[1]);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 128;
}

/**
 * Correção de brilho para trazer o clip a um alvo comum.
 *
 * Medimos a abertura a 39/255 (~15%) — num feed, um frame quase preto lê-se
 * como "não há nada aqui" e perde-se o espectador antes de a voz dizer a
 * primeira frase. O alvo deixa a filmagem visível mantendo o texto branco
 * legível; o scrim faz o resto.
 */
function lumaFix(file: string): string {
  const TARGET = 88;
  const luma = clipLuma(file);
  const delta = (TARGET - luma) / 255;
  const b = Math.max(-0.12, Math.min(0.30, delta)).toFixed(3);
  return `eq=brightness=${b}:saturation=0.95:contrast=1.04`;
}

function audioDuration(file: string): number {
  const res = spawnSync(ffmpeg, ['-i', file, '-f', 'null', '-'], { encoding: 'utf8' });
  const out = `${res.stderr ?? ''}`;
  const m = out.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  return m ? +m[1] * 3600 + +m[2] * 60 + parseFloat(m[3]) : 0;
}

/** Tons de fundo por cena — dá cor e variação sem sair da marca. */
const TINTS = ['#f3ddc9', '#e9efe6', '#f6ddd0', '#eef0e3', '#f3e3d3'];

/** Paleta por tema de cena: escuro dá muito mais contraste no telemóvel. */
const THEME = {
  light: { bg: '#faf5ec', title: '#2a2420', caption: '#8a7d70', active: '#a2481f', foot: '#84391b' },
  dark: { bg: '#2a2420', title: '#faf5ec', caption: '#a89a8c', active: '#e0a079', foot: '#e0a079' },
  photo: { bg: '#1c1713', title: '#ffffff', caption: '#d8cec4', active: '#f0b98f', foot: '#f0b98f' },
  // Texto sobre vídeo: branco puro e alto contraste (o clip já vai escurecido).
  video: { bg: 'transparent', title: '#ffffff', caption: '#ddd4ca', active: '#f5c39a', foot: '#f5c39a' },
} as const;

interface Scene {
  eyebrow?: string;
  title: string;
  narration: string;
  /** visual de arranque da cena (nome no VISUAL_VOCAB) */
  visual: string;
  /** linha de apoio sob o título (usada no CTA final) */
  note?: string;
  tint: string;
  theme: keyof typeof THEME;
  /** foto de fundo em base64 (data URI), usada no tema 'photo' */
  photo?: string;
  hideCaption?: boolean;
}

/** Um frame: cena + símbolo do que está a ser dito + legenda com a palavra atual. */
function frameSvg(scene: Scene, line: CaptionLine | null, activeWord: number): string {
  const C = THEME[scene.theme];
  const titleSize = scene.title.length > 58 ? 60 : scene.title.length > 32 ? 68 : 78;
  const titleLines = wrap(scene.title, scene.title.length > 58 ? 24 : 20).slice(0, 5);
  const lineH = titleSize + 20;
  // Zona segura do TikTok: a legenda e o nome do autor tapam ~300px em baixo e
  // os botões de ação ~160px à direita. Todo o texto vive entre os 450 e os
  // 1560 px — fora disso, a plataforma tapa-o e o espectador não o lê.
  const titleTop = 500;

  const titleEls = titleLines
    .map(
      (l, i) =>
        `<text x="${PAD}" y="${titleTop + i * lineH}" font-family="PT Serif" font-weight="bold" font-size="${titleSize}" fill="${C.title}">${xmlEscape(l)}</text>`,
    )
    .join('\n  ');

  // Legenda: quebra a linha em no máximo 2 filas e realça a palavra lida.
  let capEls = '';
  if (line && !scene.hideCaption) {
    const capTop = titleTop + titleLines.length * lineH + 170;
    const rows: { text: string; from: number }[] = [];
    let row = '';
    let from = 0;
    line.words.forEach((w, i) => {
      const next = row ? `${row} ${w.text}` : w.text;
      if (next.length > 18 && row) {
        rows.push({ text: row, from });
        row = w.text;
        from = i;
      } else row = next;
    });
    if (row) rows.push({ text: row, from });

    capEls = rows
      .map((r, ri) => {
        // Um único <text> centrado, com um <tspan> por palavra. Assim quem
        // mede as larguras é o renderizador, com os glifos reais: posicionar
        // à mão (largura fixa por carácter) fazia as palavras longas colidirem
        // com a seguinte, porque a PT Serif não é monoespaçada.
        const tspans = r.text
          .split(' ')
          .map((p, pi) => {
            const on = r.from + pi === activeWord;
            return `<tspan fill="${on ? C.active : C.caption}">${xmlEscape(p)}</tspan>`;
          })
          .join(' ');
        return `<text x="${W / 2}" y="${capTop + ri * 78}" text-anchor="middle" xml:space="preserve" font-family="PT Serif" font-weight="bold" font-size="62">${tspans}</text>`;
      })
      .join('\n  ');
  }

  // Linha de apoio do CTA: texto, nunca um botão. Um botão desenhado num vídeo
  // não é clicável — só sinaliza "anúncio" e faz saltar. A instrução real vai
  // na voz, que é o que as pessoas seguem no TikTok.
  const noteEls = scene.note
    ? `<text x="${W / 2}" y="${titleTop + titleLines.length * lineH + 60}" text-anchor="middle"
     font-family="PT Serif" font-weight="bold" font-size="48" fill="${C.active}">${xmlEscape(scene.note)}</text>`
    : '';

  // Fundo. Com vídeo por trás (tema 'video'), o frame fica TRANSPARENTE — o
  // ffmpeg compõe o texto sobre o clip já escurecido. É isso que dá movimento
  // real em vez de um slide parado.
  const bg =
    scene.theme === 'video'
      ? // Scrim: gradiente escuro por trás do texto. Sem isto, um clip claro
        // "come" o texto branco e a legibilidade depende da sorte do fundo.
        `<rect width="${W}" height="${H}" fill="url(#scrim)"/>`
      : scene.theme === 'photo' && scene.photo
        ? `<image href="${scene.photo}" x="0" y="0" width="${W}" height="${H}"
        preserveAspectRatio="xMidYMid slice"/>
  <rect width="${W}" height="${H}" fill="#140f0b" opacity="0.62"/>`
        : `<rect width="${W}" height="${H}" fill="${C.bg}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#140f0b" stop-opacity="0.10"/>
      <stop offset="25%" stop-color="#140f0b" stop-opacity="0.42"/>
      <stop offset="78%" stop-color="#140f0b" stop-opacity="0.48"/>
      <stop offset="100%" stop-color="#140f0b" stop-opacity="0.28"/>
    </linearGradient>
  </defs>
  ${bg}

  ${scene.eyebrow ? `<text x="${W / 2}" y="580" text-anchor="middle" font-family="PT Serif" font-weight="bold" font-size="32" letter-spacing="7" fill="${C.active}">${xmlEscape(scene.eyebrow)}</text>` : ''}
  ${titleEls}
  ${noteEls}
  ${capEls}

  <text x="${W / 2}" y="1560" text-anchor="middle" font-family="PT Serif" font-weight="bold" font-size="44" fill="${C.foot}">aemori.com</text>
</svg>`;
}

function renderFrame(scene: Scene, line: CaptionLine | null, active: number, file: string) {
  const png = new Resvg(frameSvg(scene, line, active), {
    fitTo: { mode: 'width', value: W },
    font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'PT Serif' },
    // Sobre vídeo o frame TEM de manter alfa, para o ffmpeg poder compor o
    // texto por cima do clip. Nos outros temas o fundo é opaco.
    ...(scene.theme === 'video' ? {} : { background: '#faf5ec' }),
  })
    .render()
    .asPng();
  writeFileSync(file, png);
}

/** Descarrega a foto do artigo e devolve-a como data URI (para embutir no SVG). */
async function fetchPhoto(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const buf = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get('content-type') ?? 'image/jpeg';
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch {
    return undefined;
  }
}

function buildScenes(entry: SocialManifestEntry, photo?: string, hasVideoBg = false): Scene[] {
  if (hasVideoBg) return buildVideoScenes(entry);
  return buildStaticScenes(entry, photo);
}

/**
 * Gancho de abertura, em DOIS tempos curtos.
 *
 * Uma frase declarativa sozinha ("a tua mente repassa a mesma cena há horas")
 * dá reconhecimento mas fecha-se: o espectador concorda e vai-se embora. O que
 * segura é um ciclo aberto — reconhecimento e, logo a seguir, a pergunta que
 * ele próprio não sabe responder. A resposta fica em dívida, e é essa dívida
 * que faz ver até ao fim.
 *
 * Curtos de propósito: dois planos em ~4s dão logo um corte, e movimento cedo
 * é o que distingue "vídeo" de "imagem com legenda" aos olhos de quem passa.
 */
function sentences(text: string, n: number): string {
  return text
    .split(/(?<=[.!?])\s+/)
    .slice(0, n)
    .join(' ')
    .trim();
}

/**
 * Frases inteiras dentro de uma janela de palavras (nunca corta a meio).
 *
 * Precisa de mínimo E máximo. Só com máximo, uma resposta que abre com uma
 * frase curta ("Esvaziando, não dormindo mais.") produzia um vídeo de 4
 * segundos — curto demais para dizer alguma coisa e para o algoritmo o
 * considerar conteúdo. Abaixo do mínimo, aceita ultrapassar o máximo.
 */
function clampWords(text: string, min: number, max: number): string {
  const frases = text.split(/(?<=[.!?])\s+/);
  const out: string[] = [];
  let n = 0;
  for (const f of frases) {
    const w = f.trim().split(/\s+/).length;
    if (out.length && n >= min && n + w > max) break;
    out.push(f.trim());
    n += w;
  }
  return out.join(' ');
}

function hookOf(entry: SocialManifestEntry): string {
  const first = sentences(entry.description, 1);
  return first.length >= 25 && first.length <= 120 ? first : entry.title;
}

/**
 * Parte o gancho em dois planos.
 *
 * O TikTok disse-nos onde perdemos as pessoas: **0:02**. Nessa altura o vídeo
 * antigo ainda estava no primeiro plano, com onze palavras em serifada para
 * ler. Ninguém lê onze palavras enquanto decide se fica. Partido em dois, cada
 * plano tem 5–7 palavras — legível de relance — e ganha-se um CORTE antes do
 * instante da decisão, em vez de só aos 4 segundos.
 *
 * Corta numa fronteira natural (vírgula, "e", "mas", travessão) para a voz não
 * soar partida ao meio; sem fronteira, ao pé do meio.
 */
function splitHook(text: string): [string, string] | null {
  const t = text.replace(/\.$/, '');
  const marks = [...t.matchAll(/,\s+|\s+—\s+|\s+e\s+não\s+|\s+mas\s+|\s+e\s+/g)];
  // A fronteira mais CEDO que ainda deixe as duas metades com corpo: quanto
  // mais curto o 1º tempo, mais cedo cai o corte — e é o corte que segura.
  const best = marks
    .map((m) => ({ at: m.index ?? 0 }))
    .filter((m) => m.at >= 12 && t.length - m.at >= 12)
    .sort((a, b) => a.at - b.at)[0];

  if (!best) return null;
  const head = t.slice(0, best.at).trim();
  const tail = t.slice(best.at).replace(/^[,\s—]+/, '').trim();
  return head && tail ? [head, tail] : null;
}

/**
 * UM vídeo curto por pergunta do FAQ: 15–20s, uma ideia só.
 *
 * A razão está nos números do TikTok, não em gosto. Os vídeos de 60s retinham
 * 7,8s em média — 12% vistos, 1,7% de conclusão. O algoritmo pesa a CONCLUSÃO
 * acima de tudo, por isso lia isso como "88% abandonaram" e parava de
 * distribuir. Os mesmos 7,8s num vídeo de 15s leem-se como ~50% de conclusão:
 * conteúdo igual, sinal oposto. A faixa de máxima viralidade é 11–18s.
 *
 * Efeito lateral bom: cada artigo passa a dar 3–4 peças em vez de uma.
 */
function buildShortScenes(entry: SocialManifestEntry, i: number): Scene[] {
  const f = entry.faq[i];
  // Orçamento por PALAVRAS, não por nº de frases: as respostas do FAQ variam
  // muito de comprimento, e cortar "1 frase" dava peças de 6s numas e de 25s
  // noutras. A ~2,5 palavras/segundo, 34 palavras ≈ 14s de resposta; com a
  // pergunta à frente dá os 15–18s que é a faixa que o TikTok distribui.
  const resposta = clampWords(f.a, 22, 42);
  const vq = visualForText(f.q) ?? 'mente';
  const va = visualForText(resposta) ?? (vq === 'calma' ? 'tempo' : 'calma');

  return [
    // Pergunta sozinha: o ciclo aberto, e o corte cai quando ela é respondida.
    {
      title: f.q,
      narration: cleanNarration(f.q),
      visual: vq,
      tint: TINTS[0],
      theme: 'video',
      hideCaption: true,
    },
    // Resposta com legenda em karaokê. Sem cena de fecho nem CTA: aos 15s um
    // remate de produto custaria 20% do vídeo e é justamente o que derruba a
    // conclusão. A marca fica no aemori.com do rodapé e na bio.
    {
      title: f.q,
      narration: cleanNarration(resposta),
      visual: va !== vq ? va : 'tempo',
      tint: TINTS[1],
      theme: 'video',
    },
  ];
}

/** Cenas para fundo em vídeo: todas transparentes, texto branco sobre o clip. */
function buildVideoScenes(entry: SocialManifestEntry): Scene[] {
  const isPT = entry.lang === 'pt-pt';
  // TRÊS perguntas, não quatro, e só as 2 primeiras frases de cada resposta.
  // No TikTok a taxa de conclusão pesa mais do que o conteúdo entregue: um
  // vídeo de 45s visto até ao fim é distribuído, um de 90s abandonado a meio
  // não é. O artigo continua a ter tudo — o vídeo é a isca, não o produto.
  const points = entry.faq.slice(0, 3);
  const hook = hookOf(entry);
  // O ciclo aberto: a 1ª pergunta do FAQ é a que o espectador tem na cabeça.
  const openLoop = entry.faq[0]?.q ?? entry.title;

  // Gancho em 1 ou 2 planos, conforme parta bem — o corte cedo é o objetivo.
  const parts = splitHook(hook) ?? [hook];
  const v0 = visualForText(parts[0]) ?? 'mente';
  // O 2º tempo TEM de ter clip diferente do 1º. As duas metades da mesma frase
  // casam quase sempre no mesmo conceito ("mente" nas duas), e aí o vocabulário
  // devolvia o mesmo clip: ficavam dois planos de texto sobre uma imagem só, ou
  // seja, nenhum corte. Medimos o 1º corte aos 5,4s por causa disto — depois do
  // instante em que o TikTok nos diz que as pessoas saem (0:02).
  const v1raw = parts[1] ? (visualForText(parts[1]) ?? 'tempo') : null;
  const v1 = v1raw && v1raw !== v0 ? v1raw : 'tempo';

  return [
    ...parts.map((p, i) => ({
      title: p,
      narration: cleanNarration(p),
      visual: i === 0 ? v0 : v1,
      tint: TINTS[i % TINTS.length],
      theme: 'video' as keyof typeof THEME,
      hideCaption: true,
    })),
    {
      title: openLoop,
      narration: cleanNarration(openLoop),
      // Mesmo visual da cena seguinte de propósito: a pergunta aparece sozinha
      // e a resposta surge por baixo, no mesmo plano. Cortar aqui partiria o
      // ciclo aberto exatamente no instante em que ele se fecha.
      visual: visualForText(`${points[0]?.q ?? ''} ${points[0]?.a ?? ''}`) ?? 'mente',
      tint: TINTS[1],
      theme: 'video',
      hideCaption: true,
    },
    ...points.map((f, i) => ({
      title: f.q,
      narration: cleanNarration(sentences(f.a, 2)),
      visual: visualForText(`${f.q} ${f.a}`) ?? 'calma',
      tint: TINTS[(i + 1) % TINTS.length],
      theme: 'video' as keyof typeof THEME,
    })),
    closingScene(isPT, 'video'),
  ];
}

function buildStaticScenes(entry: SocialManifestEntry, photo?: string): Scene[] {
  const isPT = entry.lang === 'pt-pt';
  // Até 4 perguntas e a resposta COMPLETA → vídeo mais longo e com mais substância.
  const points = entry.faq.slice(0, 4);
  const hook = hookOf(entry);

  return [
    {
      title: hook,
      narration: cleanNarration(hook),
      visual: visualForText(hook) ?? 'mente',
      tint: TINTS[0],
      // Abre com a foto do artigo escurecida: máximo contraste e impacto.
      theme: photo ? 'photo' : 'dark',
      photo,
      hideCaption: true,
    },
    // Alterna claro/escuro entre pontos — dá ritmo e mantém sempre alto contraste.
    ...points.map((f, i) => ({
      title: f.q,
      narration: cleanNarration(f.a),
      visual: visualForText(`${f.q} ${f.a}`) ?? 'calma',
      tint: TINTS[(i + 1) % TINTS.length],
      theme: (i % 2 === 0 ? 'light' : 'dark') as keyof typeof THEME,
    })),
    { ...closingScene(isPT, photo ? 'photo' : 'dark'), photo },
  ];
}

/**
 * Fecho com CTA — fundido numa só cena, de propósito.
 *
 * Uma cena de produto separada ("já disponível na Google Play" + botão) lê-se
 * como anúncio colado no fim e faz saltar. Mas sem CTA nenhum ninguém sabe o
 * que fazer a seguir, e no TikTok isso custa instalações. A solução é o CTA
 * sair da mesma frase que fecha a ideia: primeiro o remate emocional, depois,
 * na mesma respiração, onde encontrar a app.
 *
 * A instrução vai sobretudo na VOZ, que é o que se segue no TikTok — o ecrã só
 * confirma. E diz "Play Store" por extenso: "baixe o app" sem dizer onde deixa
 * a pessoa sem saber para onde ir.
 */
function closingScene(isPT: boolean, theme: keyof typeof THEME): Scene {
  return {
    title: isPT ? 'Dá nome ao que sentes' : 'Dê nome ao que você sente',
    narration: isPT
      ? 'O que tem nome deixa de andar às voltas. A Emori é um diário emocional gratuito: descarregas na Play Store do Android, e tens o link aqui na bio.'
      : 'O que tem nome deixa de dar voltas. A Emori é um diário emocional gratuito: você baixa na Play Store do Android, e o link está aqui na bio.',
    note: isPT ? 'grátis na Play Store · link na bio' : 'grátis na Play Store · link na bio',
    visual: 'escrever',
    tint: TINTS[0],
    theme,
    hideCaption: true,
  };
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

  const withVoice = args['no-voice'] !== true;
  const noVideoBg = args['no-video-bg'] === true;
  // Música DESLIGADA por defeito: "livre de direitos" não chega. Uma faixa do
  // Pixabay já nos valeu uma reivindicação de Content ID (Audiam/HAAWK) que
  // bloqueou o vídeo em todo o mundo. Só ligar com faixas de fontes que emitam
  // isenção para o canal (Uppbeat) ou da Biblioteca de Áudio do YouTube.
  // Coloca a faixa em assets/audio/ e gera com --music.
  const track = args.music === true ? musicTrack() : null;
  const hasMusic = track !== null;
  if (args.music === true && !track) {
    console.warn(`⚠ Nenhuma faixa em ${AUDIO_DIR}/ — a gerar sem música.`);
  } else if (track) {
    console.log(`  ♪ música: ${track.split('/').pop()}`);
  }

  // --short: uma peça de 15–20s por pergunta do FAQ, em vez de um vídeo longo.
  const shortMode = args.short === true;
  const jobs = targets.flatMap((entry) =>
    shortMode
      ? entry.faq.slice(0, 4).map((_, i) => ({ entry, i }))
      : [{ entry, i: null as number | null }],
  );

  for (const { entry, i: shortIdx } of jobs) {
    const dir = `social/${entry.slug}/${entry.lang}`;
    const tmp = `${dir}/.frames${shortIdx === null ? '' : `-${shortIdx}`}`;
    mkdirSync(tmp, { recursive: true });

    // Um clip POR CENA, escolhido pelo que está a ser dito nessa cena — fala em
    // água, mostra água. É a substituição do símbolo desenhado: filmagem real do
    // assunto lê-se de imediato, um ícone de linha tem de ser descodificado
    // primeiro, e a 3 segundos por frase não há tempo para isso.
    const bgTrack = `${tmp}/bg-track.mp4`;
    const scenesDraft =
      shortIdx === null
        ? buildScenes(entry, undefined, !noVideoBg)
        : buildShortScenes(entry, shortIdx);
    const clips: (BackgroundClip | null)[] = [];
    if (!noVideoBg) {
      for (const [si, scene] of scenesDraft.entries()) {
        const q = visualQuery(scene.visual);
        clips.push(await fetchBackground(q, `${tmp}/bg-${si}.mp4`));
      }
      const ok = clips.filter(Boolean) as BackgroundClip[];
      if (ok.length) {
        const autores = [...new Set(ok.map((c) => c.author))].join(', ');
        console.log(`  ▸ ${ok.length}/${clips.length} cenas com filmagem (Pexels: ${autores})`);
      }
    }

    // Só cai na foto estática se NENHUMA cena arranjou filmagem.
    const anyClip = clips.some(Boolean);
    const photo = anyClip ? undefined : entry.hero?.src ? await fetchPhoto(entry.hero.src) : undefined;
    const scenes =
      anyClip || shortIdx !== null ? scenesDraft : buildScenes(entry, photo, false);
    const frames: { file: string; seconds: number; scene: number }[] = [];
    const voiceFiles: string[] = [];

    for (const [si, scene] of scenes.entries()) {
      let lines: CaptionLine[] = [];
      let sceneDuration: number;

      if (withVoice) {
        const voiceFile = `${tmp}/voice-${si}.mp3`;
        let words;
        try {
          // 1ª opção: Edge TTS (vozes neurais, timing por palavra nativo).
          ({ words } = await synthesize(scene.narration, entry.lang as Locale, voiceFile));
        } catch (err) {
          // 2ª opção: Piper offline — nunca depende de endpoints de terceiros.
          if (!piperAvailable(entry.lang as Locale)) throw err;
          if (si === 0) console.warn('  ⚠ Edge TTS indisponível — a usar Piper (offline).');
          ({ words } = synthesizePiper(scene.narration, entry.lang as Locale, voiceFile, tmp));
        }
        trimTail(voiceFile, tmp);
        voiceFiles.push(voiceFile);
        lines = toCaptionLines(words);
        // Duração REAL do áudio — é o que garante a sincronia (não o último word boundary).
        sceneDuration = audioDuration(voiceFile) || (words.at(-1)?.end ?? 3);
      } else {
        const chunks = wrap(scene.narration, 30);
        lines = chunks.map((c, i) => ({
          words: c.split(' ').map((t) => ({ text: t, start: i * 2, end: i * 2 + 2 })),
          start: i * 2,
          end: (i + 1) * 2,
        }));
        sceneDuration = chunks.length * 2;
      }

      // Um frame por palavra: dura do início dessa palavra ao início da seguinte.
      // O último estica até ao fim REAL do áudio → zero desvio acumulado.
      const flat: { line: CaptionLine; wordIdx: number; start: number }[] = [];
      lines.forEach((line) => {
        line.words.forEach((w, wi) => flat.push({ line, wordIdx: wi, start: w.start }));
      });

      if (flat.length === 0) {
        const file = `${tmp}/f-${si}-0.png`;
        renderFrame(scene, null, -1, file);
        frames.push({ file, seconds: sceneDuration, scene: si });
        continue;
      }

      flat.forEach((f, i) => {
        const file = `${tmp}/f-${si}-${i}.png`;
        renderFrame(scene, f.line, f.wordIdx, file);
        // O primeiro frame absorve o silêncio inicial (start = 0).
        const from = i === 0 ? 0 : f.start;
        const to = i + 1 < flat.length ? flat[i + 1].start : sceneDuration;
        // Sem piso artificial: um mínimo por frame inflaria as palavras curtas e
        // o vídeo ficaria mais longo que a voz. O quantizador garante ≥1 frame.
        frames.push({ file, seconds: Math.max(0, to - from), scene: si });
      });
    }

    // Quantiza cada duração para um número INTEIRO de frames a 30fps, usando o
    // tempo acumulado como referência. Sem isto, cada duração é arredondada para
    // cima ao encaixar na grelha de fps e o erro soma-se (a legenda vai ficando
    // cada vez mais atrasada em relação à voz).
    const FPS = 30;
    let exactAcc = 0;
    let emitted = 0;
    const quantized = frames.map((f) => {
      exactAcc += f.seconds;
      const target = Math.round(exactAcc * FPS);
      const n = Math.max(1, target - emitted);
      emitted += n;
      return { file: f.file, seconds: n / FPS, scene: f.scene };
    });

    // Duração de cada cena JÁ quantizada — é sobre esta grelha que os segmentos
    // de fundo têm de ser cortados, senão a imagem troca fora do sítio da voz.
    const sceneFrames = new Map<number, number>();
    quantized.forEach((f) => {
      sceneFrames.set(f.scene, (sceneFrames.get(f.scene) ?? 0) + Math.round(f.seconds * FPS));
    });

    const listFile = `${tmp}/frames.txt`;
    const body = quantized
      .map((f) => `file '${f.file.split('/').pop()}'\nduration ${f.seconds.toFixed(6)}`)
      .join('\n');
    writeFileSync(listFile, `${body}\nfile '${quantized.at(-1)!.file.split('/').pop()}'\n`);

    const total = emitted / FPS;

    // Concatenar MP3 com `-c copy` acrescenta padding por ficheiro (~0.5s cada),
    // o que faria a voz atrasar-se progressivamente. O filtro `concat` decodifica
    // e junta sem intervalos, mantendo a sincronia.
    const hasVoice = withVoice && voiceFiles.length > 0;

    // Zoom lento e contínuo (retenção sem ser brusco).
    // IMPORTANTE: `fps` tem de vir ANTES do zoompan — senão o zoompan trata cada
    // imagem como um só frame e o vídeo colapsa para (nº imagens / fps) segundos.
    const fps = FPS;
    const totalFrames = Math.max(1, emitted);
    const zoomStep = (0.12 / totalFrames).toFixed(8); // ~12% de zoom ao longo do vídeo
    const zoom =
      `fps=${fps},scale=${Math.round(W * 1.3)}:${Math.round(H * 1.3)},` +
      `zoompan=z='min(1+${zoomStep}*on,1.12)':d=1:fps=${fps}:` +
      `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${W}x${H},format=yuv420p`;

    const inputs = ['-f', 'concat', '-safe', '0', '-i', listFile];
    const filters: string[] = [];
    const maps = ['-map', '[v]'];
    // Quantos inputs antes das faixas de voz (as imagens e, se houver, o clip).
    let audioBase = 1;

    if (anyClip) {
      // Monta a faixa de fundo ANTES: um segmento por cena, cada um cortado à
      // duração já quantizada dessa cena, e concatenados. Fazer isto num só
      // filtergraph com N entradas seria ilegível e rebentava com o limite de
      // filtros; em passes separados cada erro fica localizado.
      const segs: string[] = [];
      let lastOk: string | null = null;
      scenes.forEach((_, si) => {
        const nf = sceneFrames.get(si) ?? 0;
        if (nf === 0) return;
        const dur = (nf / FPS).toFixed(6);
        const src = clips[si]?.file ?? lastOk; // sem clip próprio, repete o anterior
        if (!src) return;
        lastOk = src;
        const seg = `${tmp}/seg-${si}.mp4`;
        run(ffmpeg, [
          '-y', '-loglevel', 'error',
          '-stream_loop', '-1', '-i', src,
          '-vf',
          `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},` +
            // Brilho medido e corrigido por clip, não um valor fixo: com um
            // escurecimento constante os clips escuros ficavam pretos e os
            // claros comiam o texto.
            `fps=${fps},${lumaFix(src)},format=yuv420p`,
          '-t', dur, '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
          seg,
        ]);
        segs.push(seg);
      });

      const segList = `${tmp}/segs.txt`;
      writeFileSync(segList, segs.map((s) => `file '${s.split('/').pop()}'`).join('\n') + '\n');
      run(ffmpeg, [
        '-y', '-loglevel', 'error',
        '-f', 'concat', '-safe', '0', '-i', segList,
        '-c', 'copy', bgTrack,
      ]);

      inputs.push('-i', bgTrack);
      audioBase = 2;
      filters.push(
        `[1:v]fps=${fps},trim=0:${total},setpts=PTS-STARTPTS[bg]`,
        `[0:v]fps=${fps},format=rgba[txt]`,
        `[bg][txt]overlay=0:0:shortest=1,format=yuv420p[v]`,
      );
    } else {
      filters.push(`[0:v]${zoom}[v]`);
    }

    // Índices: [0] imagens · [1] clip (se houver) · seguintes: vozes · depois música
    if (hasVoice) {
      voiceFiles.forEach((v) => inputs.push('-i', v));
      const chain = voiceFiles.map((_, i) => `[${i + audioBase}:a]`).join('');
      filters.push(`${chain}concat=n=${voiceFiles.length}:v=0:a=1[voice]`);
    }

    let mixLabel: string | null = null;
    if (hasVoice && hasMusic) {
      const mi = voiceFiles.length + audioBase;
      inputs.push('-stream_loop', '-1', '-i', track as string);
      filters.push(
        // Cama sonora a -20 dB: presente, nunca a competir com a voz. Entra e
        // sai em fade — música que arranca ou corta a seco denuncia a montagem.
        `[${mi}:a]atrim=0:${total},volume=0.10,` +
          `afade=t=in:st=0:d=2,afade=t=out:st=${Math.max(0, total - 3)}:d=3[mus]`,
        // normalize=0 é essencial: por defeito o amix divide cada entrada por
        // n, o que enterrava a voz 6 dB. Os níveis já vêm definidos acima.
        `[voice][mus]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[mix]`,
      );
      mixLabel = '[mix]';
    } else if (hasVoice) {
      mixLabel = '[voice]';
    } else if (hasMusic) {
      inputs.push('-stream_loop', '-1', '-i', track as string);
      filters.push(`[${audioBase}:a]atrim=0:${total},volume=0.35[mus]`);
      mixLabel = '[mus]';
    }

    if (mixLabel) {
      // Normalização final para -16 LUFS. O YouTube alinha tudo a cerca de
      // -14 LUFS; sem isto o vídeo tocava ~10 dB abaixo do resto do feed, o
      // que se lê como amadorismo e faz as pessoas passarem à frente em vez
      // de subirem o volume. TP=-1.5 deixa margem para a recompressão da
      // plataforma não distorcer os picos.
      filters.push(`${mixLabel}loudnorm=I=-16:TP=-1.5:LRA=11[aout]`);
      maps.push('-map', '[aout]');
    }

    const out = shortIdx === null ? `${dir}/video.mp4` : `${dir}/short-${shortIdx + 1}.mp4`;
    const cmd = [
      '-y',
      ...inputs,
      '-filter_complex',
      filters.join(';'),
      ...maps,
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '20',
      ...(hasVoice || hasMusic ? ['-c:a', 'aac', '-b:a', '128k', '-shortest'] : []),
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
    console.log(`✓ ${out} — ${total.toFixed(1)}s, ${frames.length} frames${withVoice ? ' + voz' : ''}${hasMusic ? ' + música' : ''}`);
  }
}

main().catch((err) => {
  console.error('❌', err instanceof Error ? err.message : err);
  process.exit(1);
});
