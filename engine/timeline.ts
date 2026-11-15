// Junta os áudios por cena numa faixa única e calcula, a partir deles, o início
// EXATO de cada cena (os scripts antigos estimavam-no pela posição da palavra).
//
// Convenção herdada das composições Remotion: o mp3 começa na 1ª palavra e a
// composição atrasa-o `leadSeconds` (Sequence from=lead). Por isso o LEAD NÃO vai
// cozido no mp3; só é somado aos tempos de palavras e de cenas.

import { join } from 'node:path';
import type { WordTiming } from '../lib/social/tts';
import { concatToMp3, silence } from './ffmpeg';
import type { SceneAudio } from './voice';

export interface Timeline {
  mp3: string;
  /** Palavras com tempo absoluto no vídeo (LEAD já somado). */
  words: WordTiming[];
  /** Início de cada cena no vídeo, em segundos (a 1ª é sempre 0). */
  sceneStarts: number[];
  /** Instante exato (no vídeo) em que o áudio de cada cena começa. */
  audioStarts: number[];
  /** Duração do áudio de cada cena. */
  durations: number[];
  /** Quantas palavras tem cada cena na linha do tempo (para localizar "a palavra n da cena"). */
  wordCounts: number[];
  /** Duração da faixa de voz (sem LEAD). */
  voiceSeconds: number;
  lead: number;
}

export function buildTimeline(
  audios: SceneAudio[],
  opts: { lead: number; pause: number; cacheDir: string; outMp3: string },
): Timeline {
  const pauseWav = join(opts.cacheDir, `pause-${opts.pause}.wav`);
  silence(opts.pause, pauseWav);

  const parts: string[] = [];
  const words: WordTiming[] = [];
  const sceneStarts: number[] = [];
  const audioStarts: number[] = [];
  const wordCounts: number[] = [];
  let clock = 0; // relógio da faixa de áudio

  audios.forEach((a, i) => {
    audioStarts.push(opts.lead + clock);
    wordCounts.push(a.words.length);
    sceneStarts.push(i === 0 ? 0 : Math.max(0, opts.lead + clock - 0.15));
    for (const w of a.words) words.push({ text: w.text, start: opts.lead + clock + w.start, end: opts.lead + clock + w.end });
    parts.push(a.wav);
    clock += a.duration;
    if (i < audios.length - 1) {
      parts.push(pauseWav);
      clock += opts.pause;
    }
  });

  concatToMp3(parts, join(opts.cacheDir, 'concat.txt'), opts.outMp3);
  return { mp3: opts.outMp3, words, sceneStarts, audioStarts, wordCounts, durations: audios.map((a) => a.duration), voiceSeconds: clock, lead: opts.lead };
}
