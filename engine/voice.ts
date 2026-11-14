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
import { cleanVoice, duration, speechBounds, toWav } from './ffmpeg';
import type { Locale, Project, Scene, VoiceMode } from './types';

export type VoiceSource = 'human' | 'edge' | 'elevenlabs' | 'piper';

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

export async function voiceScene(ctx: VoiceContext, scene: Scene): Promise<SceneAudio> {
  mkdirSync(ctx.cacheDir, { recursive: true });
  const text = cleanNarration(scene.narration);
  const human = ctx.mode === 'synthetic' ? null : findHumanFile(ctx.projectDir, scene);

  if (ctx.mode === 'human' && !human) {
    throw new Error(`falta a gravação da cena "${scene.id}" (modo human). Esperado: voice/${scene.id}.wav`);
  }

  // ── 1. Gravação humana ────────────────────────────────────────────────
  if (human) {
    const st = statSync(human);
    const isPresenter = Boolean(scene.presenter);
    const key = fingerprint(['human', text, st.size, Math.round(st.mtimeMs), isPresenter]);
    const wav = join(ctx.cacheDir, `${scene.id}-${key}.wav`);
    const meta = `${wav}.json`;
    if (existsSync(wav) && existsSync(meta)) {
      return { ...(JSON.parse(readFileSync(meta, 'utf8')) as SceneAudio), cached: true };
    }
    // Apresentador: NÃO se corta silêncio (a duração tem de igualar a do vídeo, para
    // a boca e o som ficarem em sincronia); as palavras alinham-se só à parte falada.
    cleanVoice(human, wav, { trim: !isPresenter });
    const dur = duration(wav);
    let words: WordTiming[];
    if (isPresenter) {
      const b = speechBounds(wav);
      words = alignProportional(text, b.end - b.start).map((w) => ({ ...w, start: w.start + b.start, end: w.end + b.start }));
    } else {
      words = alignProportional(text, dur);
    }
    const out: SceneAudio = { scene: scene.id, wav, words, duration: dur, source: 'human', cached: false };
    writeFileSync(meta, JSON.stringify(out));
    return out;
  }

  // ── 2/3. Voz sintética (Edge/ElevenLabs → Piper) ──────────────────────
  const rate = ctx.project.voice?.rate ?? '+0%';
  const key = fingerprint(['synthetic', text, ctx.locale, rate, Boolean(process.env.ELEVENLABS_API_KEY)]);
  const wav = join(ctx.cacheDir, `${scene.id}-${key}.wav`);
  const meta = `${wav}.json`;
  if (existsSync(wav) && existsSync(meta)) {
    return { ...(JSON.parse(readFileSync(meta, 'utf8')) as SceneAudio), cached: true };
  }

  const mp3 = join(ctx.cacheDir, `${scene.id}-${key}.mp3`);
  let words: WordTiming[];
  let source: VoiceSource = process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID ? 'elevenlabs' : 'edge';
  try {
    ({ words } = await synthesize(text, ctx.locale as AppLocale, mp3, rate));
    if (words.length === 0) throw new Error('síntese sem palavras');
    restorePunctuation(words, text);
  } catch (err) {
    if (!piperAvailable(ctx.locale as AppLocale)) throw err;
    console.warn(`  ⚠ ${scene.id}: TTS online indisponível — a usar Piper (offline)`);
    source = 'piper';
    ({ words } = synthesizePiper(text, ctx.locale as AppLocale, mp3, ctx.cacheDir));
  }
  toWav(mp3, wav);
  const dur = duration(wav);
  const out: SceneAudio = { scene: scene.id, wav, words, duration: dur, source, cached: false };
  writeFileSync(meta, JSON.stringify(out));
  return out;
}
