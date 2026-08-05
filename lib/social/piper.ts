// Voz off offline com Piper TTS — alternativa robusta ao Edge TTS (que passou a
// devolver 403). Corre localmente, é gratuito e nunca depende de um endpoint.
//
// DESAFIO: ao contrário do Edge TTS, o Piper não devolve o tempo de cada palavra.
// SOLUÇÃO: sintetizamos UMA LINHA DE LEGENDA de cada vez e medimos a duração real
// de cada ficheiro. Assim o início/fim de cada linha fica exato (que é o que se
// nota), e dentro da linha distribuímos as palavras proporcionalmente ao número
// de caracteres — aproximação boa o suficiente para o realce.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
import type { Locale } from '@/i18n/config';
import type { WordTiming } from './tts';

const PIPER = 'tools/piper/piper/piper.exe';
const MODELS: Record<Locale, string> = {
  'pt-br': 'tools/voices/pt_BR-faber-medium.onnx',
  'pt-pt': 'tools/voices/pt_PT-tugao-medium.onnx',
};

export function piperAvailable(lang: Locale): boolean {
  return existsSync(PIPER) && existsSync(MODELS[lang]);
}

const ffmpeg = ffmpegPath as unknown as string;

function durationOf(file: string): number {
  const res = spawnSync(ffmpeg, ['-i', file, '-f', 'null', '-'], { encoding: 'utf8' });
  const m = (res.stderr ?? '').match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  return m ? +m[1] * 3600 + +m[2] * 60 + parseFloat(m[3]) : 0;
}

/** Sintetiza um texto curto para WAV com o Piper. */
function speak(text: string, lang: Locale, outFile: string): void {
  execFileSync(PIPER, ['--model', MODELS[lang], '--output_file', outFile], {
    input: text,
    stdio: ['pipe', 'ignore', 'pipe'],
  });
}

/** Divide o texto em linhas curtas (mesma lógica das legendas). */
export function splitLines(text: string, maxWords = 5, maxChars = 30): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let buf: string[] = [];
  const flush = () => {
    if (buf.length) lines.push(buf.join(' '));
    buf = [];
  };
  for (const w of words) {
    if (buf.length >= maxWords || [...buf, w].join(' ').length > maxChars) flush();
    buf.push(w);
    if (/[.!?,;:—]$/.test(w)) flush();
  }
  flush();
  return lines;
}

/**
 * Sintetiza a narração e devolve os tempos por palavra + o áudio concatenado.
 * Cada linha é sintetizada em separado para termos âncoras temporais exatas.
 */
export function synthesizePiper(
  text: string,
  lang: Locale,
  outFile: string,
  tmpDir: string,
): { words: WordTiming[]; duration: number } {
  const lines = splitLines(text);
  const parts: string[] = [];
  const words: WordTiming[] = [];
  let clock = 0;

  lines.forEach((line, i) => {
    const wav = `${tmpDir}/piper-${i}.wav`;
    speak(line, lang, wav);
    parts.push(wav);

    const dur = durationOf(wav);
    // Distribui as palavras da linha proporcionalmente ao nº de caracteres.
    const tokens = line.split(/\s+/);
    const totalChars = tokens.reduce((a, t) => a + t.length, 0) || 1;
    let acc = clock;
    for (const t of tokens) {
      const slice = (t.length / totalChars) * dur;
      words.push({ text: t, start: acc, end: acc + slice });
      acc += slice;
    }
    clock += dur;
  });

  // Concatena os WAV numa só faixa.
  const listFile = `${tmpDir}/piper-list.txt`;
  writeFileSync(listFile, parts.map((p) => `file '${p.split('/').pop()}'`).join('\n'));
  execFileSync(
    ffmpeg,
    ['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c:a', 'libmp3lame', '-b:a', '128k', outFile],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );

  return { words, duration: durationOf(outFile) || clock };
}
