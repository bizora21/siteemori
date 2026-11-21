// Voz do motor. Cada cena obtém o seu próprio áudio + tempos por palavra, de uma
// de três fontes (a escolha é por cena, não por vídeo):
//
//   1. gravação humana  (projects/<projeto>/voice/<cena>.wav|m4a|mp3|ogg|aac)
//   2. Edge TTS / ElevenLabs (lib/social/tts — ElevenLabs só se houver chave)
//   3. Piper (offline)
//
// Por cena, e não numa faixa única, para que o início de cada cena seja EXATO
// (e não estimado) e para permitir regravar uma só cena sem refazer o resto.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanNarration, synthesize, type WordTiming } from '../lib/social/tts';
import { piperAvailable, synthesizePiper } from '../lib/social/piper';
import type { Locale as AppLocale } from '../i18n/config';
import { cleanVoice, duration, hasAudioStream, normalizeAudio, silence, speechBounds, speechIntervals, toWav, trimWav, type Interval } from './ffmpeg';
import type { Locale, Project, Scene, VoiceMode } from './types';

export type VoiceSource = 'human' | 'edge' | 'elevenlabs' | 'piper' | 'clip';

export interface SceneAudio {
  scene: string;
  /** WAV mono 44,1 kHz já limpo, no cache. */
  wav: string;
  /** Tempos relativos ao início deste áudio. */
  words: WordTiming[];
  duration: number;
  source: VoiceSource;
  cached: boolean;
}

const HUMAN_EXT = ['wav', 'm4a', 'mp3', 'ogg', 'aac', 'flac'];

/** Procura a gravação humana de uma cena: campo "audio" ou voice/<id>.<ext>. */
export function findHumanFile(projectDir: string, scene: Scene): string | null {
  if (scene.presenter) {
    const f = join(projectDir, scene.presenter);
    return existsSync(f) ? f : null;
  }
  if (scene.audio) {
    const f = join(projectDir, scene.audio);
    return existsSync(f) ? f : null;
  }
  for (const ext of HUMAN_EXT) {
    const f = join(projectDir, 'voice', `${scene.id}.${ext}`);
    if (existsSync(f)) return f;
  }
  return null;
}

/**
 * Tempos por palavra para áudio humano, SEM modelos de IA: o texto é conhecido,
 * por isso reparte-se a duração (já sem silêncios nas pontas) pelas palavras em
 * proporção ao seu tamanho, com um peso extra nas pausas de pontuação.
 * Suficiente para legendas de vídeo curto; se um dia o desvio incomodar, o
 * ponto de troca é só esta função (ex.: whisper.cpp tiny).
 */
export function alignProportional(text: string, totalSeconds: number): WordTiming[] {
  const tokens = text.split(/\s+/).filter(Boolean);
  const weight = (t: string): number => {
    const letters = t.replace(/[^\p{L}\p{N}]/gu, '').length;
    const pause = /[.!?]$/.test(t) ? 5 : /[,;:—]$/.test(t) ? 2.5 : 0;
    return Math.max(2, letters) + pause;
  };
  const total = tokens.reduce((a, t) => a + weight(t), 0) || 1;
  const words: WordTiming[] = [];
  let acc = 0;
  for (const t of tokens) {
    const w = weight(t);
    const start = (acc / total) * totalSeconds;
    acc += w;
    // O peso da pausa não é "fala": a palavra termina antes de a pausa começar.
    const speech = Math.max(2, t.replace(/[^\p{L}\p{N}]/gu, '').length);
    words.push({ text: t, start, end: start + (speech / w) * ((w / total) * totalSeconds) });
  }
  return words;
}

/**
 * Tempos por palavra ancorados nas PAUSAS reais da gravação. Reparte as palavras só
 * pelo tempo de fala (sem as pausas) e devolve-as ao tempo real, por isso as pausas de
 * fim de frase deixam de acumular desvio. Sem pausas detetáveis, cai no método proporcional.
 */
export function alignWithPauses(text: string, speech: Interval[], totalSeconds: number): WordTiming[] {
  const spoken = speech.reduce((a, s) => a + (s.end - s.start), 0);
  // Ruído de fundo constante ou fala sem pausas: não há âncoras fiáveis.
  if (speech.length < 2 || spoken < 0.3 * totalSeconds) return alignProportional(text, totalSeconds);
  const tokens = text.split(/\s+/).filter(Boolean);
  const weight = (t: string) => Math.max(2, t.replace(/[^\p{L}\p{N}]/gu, '').length);
  const cum: number[] = [0]; // peso acumulado antes de cada palavra
  tokens.forEach((t) => cum.push(cum[cum.length - 1] + weight(t)));
  const total = cum[cum.length - 1] || 1;

  /** Trechos de fala recortados a uma janela de tempo real. */
  const clip = (a: number, b: number): Interval[] =>
    speech.map((s) => ({ start: Math.max(s.start, a), end: Math.min(s.end, b) })).filter((s) => s.end - s.start > 1e-6);
  /** Posição na linha do tempo só-de-fala de `iv` → tempo real. atEnd: no limite de um trecho, fica no fim dele. */
  const toReal = (iv: Interval[], sp: number, atEnd: boolean): number => {
    let rest = sp;
    for (const s of iv) {
      const len = s.end - s.start;
      if (rest < len || (atEnd && rest <= len + 1e-9)) return s.start + Math.min(rest, len);
      rest -= len;
    }
    return iv[iv.length - 1].end;
  };

  // 1) Previsão (só pelo tamanho das palavras) de onde cada pausa deveria cair. É refeita a partir
  //    de cada âncora: assim, uma pausa longa antes não desloca a previsão das seguintes.
  const lastFala = speech[speech.length - 1].end;
  let baseK = -1; // última palavra já ancorada
  let baseT = speech[0].start; // onde começa a fala seguinte a essa âncora
  const predictEnd = (k: number) => {
    const iv = clip(baseT, lastFala);
    const sp = iv.reduce((s, x) => s + (x.end - x.start), 0);
    const w = total - cum[baseK + 1] || 1;
    return iv.length ? toReal(iv, ((cum[k + 1] - cum[baseK + 1]) / w) * sp, true) : lastFala;
  };

  // 2) Cada pausa só vira âncora se coincidir com uma pontuação do texto (fim de frase ou vírgula),
  //    senão é uma hesitação a meio de uma frase e fica de fora.
  const boundaries = tokens.map((t, k) => ({ k, strong: /[.!?]$/.test(t), weak: /[,;:—]$/.test(t) })).filter((b) => b.strong || b.weak);
  const anchors: { after: number; t0: number; t1: number }[] = []; // tokens [0..after] antes da pausa
  let lastK = -1;
  for (let i = 0; i + 1 < speech.length; i++) {
    const gapStart = speech[i].end;
    const gapEnd = speech[i + 1].start;
    const gap = gapEnd - gapStart;
    let best: { k: number; err: number } | null = null;
    for (const b of boundaries) {
      if (b.k <= lastK || b.k >= tokens.length - 1) continue;
      if (!b.strong && gap < 0.4) continue; // vírgula: só com pausa nítida
      if (!b.strong && gap >= 0.6) continue; // pausa longa = fim de frase, não vírgula
      const err = Math.abs(predictEnd(b.k) - gapStart);
      if (err < 1.6 && (!best || err < best.err)) best = { k: b.k, err };
    }
    if (best) {
      anchors.push({ after: best.k, t0: gapStart, t1: gapEnd });
      lastK = best.k;
      baseK = best.k;
      baseT = gapEnd;
    }
  }

  // 3) Entre âncoras, reparte as palavras pelo tempo de fala dessa janela.
  const words: WordTiming[] = [];
  const spans = [{ from: 0, to: tokens.length, a: speech[0].start, b: speech[speech.length - 1].end }];
  if (anchors.length) {
    spans.length = 0;
    let from = 0;
    let a = speech[0].start;
    for (const an of anchors) {
      spans.push({ from, to: an.after + 1, a, b: an.t0 });
      from = an.after + 1;
      a = an.t1;
    }
    spans.push({ from, to: tokens.length, a, b: speech[speech.length - 1].end });
  }
  for (const sp of spans) {
    const iv = clip(sp.a, sp.b);
    if (!iv.length || sp.to <= sp.from) continue;
    const spokenHere = iv.reduce((s, x) => s + (x.end - x.start), 0);
    const base = cum[sp.from];
    const w = cum[sp.to] - base || 1;
    for (let k = sp.from; k < sp.to; k++) {
      words.push({
        text: tokens[k],
        start: toReal(iv, ((cum[k] - base) / w) * spokenHere, false),
        end: toReal(iv, ((cum[k + 1] - base) / w) * spokenHere, true),
      });
    }
  }
  // Rede de segurança: se algo correu mal na contagem, volta ao método simples.
  return words.length === tokens.length ? words : alignProportional(text, totalSeconds);
}

/** O Edge devolve palavras sem pontuação; repõe-na a partir do texto original. */
function restorePunctuation(words: WordTiming[], text: string): void {
  const tokens = text.split(/\s+/).filter(Boolean);
  const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  let j = 0;
  for (const w of words) {
    const k = tokens.findIndex((tok, idx) => idx >= j && norm(tok) === norm(w.text));
    if (k < 0) continue;
    w.text = tokens[k];
    j = k + 1;
  }
}

function fingerprint(parts: unknown[]): string {
  return createHash('sha1').update(JSON.stringify(parts)).digest('hex').slice(0, 12);
}

export interface VoiceContext {
  project: Project;
  projectDir: string;
  cacheDir: string;
  locale: Locale;
  mode: VoiceMode;
}

/** Cena real (kind "clip"): o áudio é o som original do vídeo; sem pista de áudio, fica em silêncio. */
function clipScene(ctx: VoiceContext, scene: Scene): SceneAudio {
  mkdirSync(ctx.cacheDir, { recursive: true });
  const file = scene.presenter ? join(ctx.projectDir, scene.presenter) : null;
  if (!file || !existsSync(file)) {
    const wav = join(ctx.cacheDir, `${scene.id}-clip-vazio.wav`);
    silence(1.5, wav);
    console.warn(`  ⚠ cena real "${scene.id}" ainda sem vídeo: ficou 1,5 s em silêncio (carregue o vídeo da cena)`);
    return { scene: scene.id, wav, words: [], duration: 1.5, source: 'clip', cached: false };
  }
  const st = statSync(file);
  const wav = join(ctx.cacheDir, `${scene.id}-clip-${fingerprint(['clip-v1', st.size, Math.round(st.mtimeMs)])}.wav`);
  if (!existsSync(wav)) {
    const seconds = duration(file);
    if (hasAudioStream(file)) normalizeAudio(file, wav, seconds);
    else {
      silence(seconds, wav);
      console.warn(`  ⚠ cena real "${scene.id}": o vídeo não tem som (fica em silêncio)`);
    }
  }
  return { scene: scene.id, wav, words: [], duration: duration(wav), source: 'clip', cached: true };
}

export async function voiceScene(ctx: VoiceContext, scene: Scene): Promise<SceneAudio> {
  mkdirSync(ctx.cacheDir, { recursive: true });
  // Cena real: o som é o do próprio vídeo. Não há texto, voz sintética nem legendas.
  if (scene.kind === 'clip') return clipScene(ctx, scene);

  const text = cleanNarration(scene.narration);
  const human = ctx.mode === 'synthetic' ? null : findHumanFile(ctx.projectDir, scene);

  if (ctx.mode === 'human-only' && !human) {
    throw new Error(`falta a gravação da cena "${scene.id}" (modo só voz humana). Grave-a, ou mude a origem da voz para "Automático".`);
  }
  // Modo "human": a voz humana é a preferida, mas uma cena sem gravação não bloqueia nada.
  if (ctx.mode === 'human' && !human) console.warn(`  ⚠ cena "${scene.id}" sem gravação: usei voz sintética (grave-a quando quiser; não bloqueia).`);

  // ── 1. Gravação humana ────────────────────────────────────────────────
  if (human) {
    const st = statSync(human);
    const isPresenter = Boolean(scene.presenter);
    const key = fingerprint(['human-v2', text, st.size, Math.round(st.mtimeMs), isPresenter]);
    const wav = join(ctx.cacheDir, `${scene.id}-${key}.wav`);
    const meta = `${wav}.json`;
    if (existsSync(wav) && existsSync(meta)) {
      return { ...(JSON.parse(readFileSync(meta, 'utf8')) as SceneAudio), cached: true };
    }
    // Apresentador: NÃO se corta silêncio (a duração tem de igualar a do vídeo, para
    // a boca e o som ficarem em sincronia); as palavras alinham-se só à parte falada.
    cleanVoice(human, wav, { trim: !isPresenter });
    let dur = duration(wav);
    // Palavras ancoradas nas pausas reais da gravação (sem pausas detetáveis, cai no método proporcional).
    let speech = speechIntervals(wav);
    // Corta o "ar morto" do início e do fim. O corte de silêncio por limiar fixo falha quando há
    // ruído de fundo; este usa o limiar adaptável. Com o apresentador não se corta (vídeo e som têm
    // de manter a mesma duração).
    if (!isPresenter && speech.length >= 1 && !(speech.length === 1 && speech[0].start === 0 && speech[0].end >= dur - 0.01)) {
      const t0 = Math.max(0, speech[0].start - 0.15);
      const t1 = Math.min(dur, speech[speech.length - 1].end + 0.3);
      if (t0 > 0.2 || dur - t1 > 0.3) {
        trimWav(wav, t0, t1);
        dur = duration(wav);
        speech = speech
          .map((s) => ({ start: Math.max(0, s.start - t0), end: Math.min(dur, s.end - t0) }))
          .filter((s) => s.end - s.start > 0.05);
      }
    }
    let words: WordTiming[];
    if (isPresenter) {
      const b = speechBounds(wav);
      words = alignWithPauses(text, speech.filter((s) => s.end > b.start && s.start < b.end), b.end - b.start);
    } else {
      words = alignWithPauses(text, speech, dur);
    }
    const out: SceneAudio = { scene: scene.id, wav, words, duration: dur, source: 'human', cached: false };
    writeFileSync(meta, JSON.stringify(out));
    return out;
  }

  // ── 2/3. Voz sintética (Edge/ElevenLabs → Piper) ──────────────────────
  const rate = ctx.project.voice?.rate ?? '+0%';
  const voiceName = scene.voiceName?.trim() || ctx.project.voice?.name?.trim() || undefined;
  const pitch = ctx.project.voice?.pitch?.trim() || undefined;
  const key = fingerprint(['synthetic-v2', text, ctx.locale, rate, Boolean(process.env.ELEVENLABS_API_KEY), voiceName ?? '', pitch ?? '']);
  const wav = join(ctx.cacheDir, `${scene.id}-${key}.wav`);
  const meta = `${wav}.json`;
  if (existsSync(wav) && existsSync(meta)) {
    return { ...(JSON.parse(readFileSync(meta, 'utf8')) as SceneAudio), cached: true };
  }

  const mp3 = join(ctx.cacheDir, `${scene.id}-${key}.mp3`);
  let words: WordTiming[];
  let source: VoiceSource = process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID ? 'elevenlabs' : 'edge';
  try {
    ({ words } = await synthesize(text, ctx.locale as AppLocale, mp3, rate, 3, voiceName, pitch));
    if (words.length === 0) throw new Error('síntese sem palavras');
    restorePunctuation(words, text);
  } catch (err) {
    if (!piperAvailable(ctx.locale as AppLocale)) throw err;
    console.warn(`  ⚠ ${scene.id}: TTS online indisponível — a usar Piper (offline)`);
    source = 'piper';
    ({ words } = synthesizePiper(text, ctx.locale as AppLocale, mp3, ctx.cacheDir));
  }
  toWav(mp3, wav, { trimTail: true });
  const dur = duration(wav);
  const out: SceneAudio = { scene: scene.id, wav, words, duration: dur, source, cached: false };
  // A voz offline de reserva não fica em cache: da próxima vez tenta-se de novo a voz boa.
  if (source !== 'piper') writeFileSync(meta, JSON.stringify(out));
  return out;
}
