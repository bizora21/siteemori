// Operações de áudio só com ffmpeg (já é dependência do projeto: ffmpeg-static).
// Nada de modelos de IA: corre em qualquer máquina, incluindo as fracas.

import ffmpegPath from 'ffmpeg-static';
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const FFMPEG = ffmpegPath as unknown as string;

export function run(args: string[]): void {
  const r = spawnSync(FFMPEG, ['-y', '-loglevel', 'error', ...args], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg falhou: ${(r.stderr ?? '').slice(-800)}`);
}

/** Duração real do ficheiro, em segundos (o ffmpeg escreve-a no stderr). */
export function duration(file: string): number {
  const r = spawnSync(FFMPEG, ['-i', file, '-f', 'null', '-'], { encoding: 'utf8' });
  const m = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(r.stderr ?? '');
  if (!m) throw new Error(`não consegui ler a duração de ${file}`);
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

/**
 * Limpa uma gravação humana: corta silêncio inicial e final, tira graves de
 * ruído (rumble do telemóvel/ar condicionado), reduz ruído de fundo leve e
 * normaliza o volume para -16 LUFS (padrão de vídeo curto). Saída: WAV mono 44,1 kHz.
 */
export function cleanVoice(input: string, outWav: string, opts: { trim?: boolean } = {}): void {
  const trim = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08:detection=peak';
  // Com trim=false a duração fica IGUAL à do original: necessário quando há vídeo
  // do apresentador, para a boca e o som continuarem em sincronia.
  const cut = opts.trim === false ? [] : [trim, 'areverse', trim, 'areverse'];
  const chain = ['highpass=f=80', 'afftdn=nr=12:nf=-45', ...cut, 'loudnorm=I=-16:TP=-1.5:LRA=11'].join(',');
  run(['-i', input, '-vn', '-af', chain, '-ar', '44100', '-ac', '1', '-c:a', 'pcm_s16le', outWav]);
}

/**
 * Onde a fala começa e acaba dentro de um WAV (segundos), medido pelos silêncios
 * das pontas. Permite alinhar as palavras só à parte falada sem cortar o áudio.
 */
export function speechBounds(wav: string): { start: number; end: number } {
  const total = duration(wav);
  const r = spawnSync(FFMPEG, ['-i', wav, '-af', 'silencedetect=n=-40dB:d=0.12', '-f', 'null', '-'], { encoding: 'utf8' });
  const err = r.stderr ?? '';
  const starts = [...err.matchAll(/silence_start:\s*(-?[\d.]+)/g)].map((m) => Math.max(0, Number(m[1])));
  const ends = [...err.matchAll(/silence_end:\s*([\d.]+)/g)].map((m) => Number(m[1]));
  let start = 0;
  let end = total;
  // silêncio inicial: começa em ~0 e termina antes do fim
  if (starts.length && starts[0] < 0.05 && ends.length && ends[0] < total - 0.3) start = ends[0];
  // silêncio final: começa depois do início da fala e não tem "end" correspondente (ou acaba no fim)
  const last = starts[starts.length - 1];
  if (last !== undefined && last > start + 0.3 && (ends.length < starts.length || ends[ends.length - 1] >= total - 0.05)) end = last;
  return { start, end: Math.max(end, start + 0.3) };
}

/** Vídeo do apresentador/ilustração para o Remotion: sem áudio, h264, no máximo 1280 px de largura. */
export function stageVideo(input: string, out: string): void {
  run(['-i', input, '-an', '-vf', "scale='min(1280,iw)':-2", '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-r', '30', out]);
}

/** Converte qualquer áudio (ex.: o mp3 do TTS) para WAV mono 44,1 kHz, sem alterar o volume. */
export function toWav(input: string, outWav: string): void {
  run(['-i', input, '-ar', '44100', '-ac', '1', '-c:a', 'pcm_s16le', outWav]);
}

/** Silêncio de N segundos em WAV (pausa entre cenas). */
export function silence(seconds: number, outWav: string): void {
  run(['-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', String(seconds), '-c:a', 'pcm_s16le', outWav]);
}

/** Junta WAVs (todos com o mesmo formato) e codifica o resultado em mp3. */
export function concatToMp3(wavs: string[], listFile: string, outMp3: string): void {
  // Caminhos absolutos: o ffmpeg resolve os relativos a partir da pasta da lista, não do cwd.
  writeFileSync(listFile, wavs.map((w) => `file '${resolve(w).replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n'));
  run(['-f', 'concat', '-safe', '0', '-i', listFile, '-c:a', 'libmp3lame', '-b:a', '128k', outMp3]);
}
