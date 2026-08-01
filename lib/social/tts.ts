// Voz off gratuita via Edge TTS (vozes neurais da Microsoft) — sem API key,
// sem limites práticos. Devolve o áudio e o tempo exato de cada palavra, o que
// permite legendas sincronizadas (o maior fator de retenção em vídeo curto).

import { writeFileSync } from 'node:fs';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import type { Locale } from '@/i18n/config';

/** Voz feminina e calma em cada variante — a Emori é sempre "ela". */
export const VOICE: Record<Locale, string> = {
  'pt-br': 'pt-BR-FranciscaNeural',
  'pt-pt': 'pt-PT-RaquelNeural',
};

/** Uma palavra falada, com início e fim em segundos. */
export interface WordTiming {
  text: string;
  start: number;
  end: number;
}

/** Os offsets do Edge TTS vêm em unidades de 100 nanossegundos. */
const TICKS_PER_SECOND = 10_000_000;

export async function synthesize(
  text: string,
  lang: Locale,
  outFile: string,
): Promise<{ words: WordTiming[]; duration: number }> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICE[lang], OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3, {
    wordBoundaryEnabled: true,
    sentenceBoundaryEnabled: false,
  });

  const { audioStream, metadataStream } = tts.toStream(text);

  const chunks: Buffer[] = [];
  audioStream.on('data', (c: Buffer) => chunks.push(c));

  const words: WordTiming[] = [];
  metadataStream?.on('data', (m: Buffer) => {
    try {
      const parsed = JSON.parse(m.toString()) as {
        Metadata?: { Type: string; Data: { Offset: number; Duration: number; text: { Text: string } } }[];
      };
      for (const ev of parsed.Metadata ?? []) {
        if (ev.Type !== 'WordBoundary') continue;
        const start = ev.Data.Offset / TICKS_PER_SECOND;
        words.push({
          text: ev.Data.text.Text,
          start,
          end: start + ev.Data.Duration / TICKS_PER_SECOND,
        });
      }
    } catch {
      /* frames não-JSON são ignorados */
    }
  });

  await new Promise<void>((resolve) => audioStream.on('close', () => resolve()));
  tts.close();

  writeFileSync(outFile, Buffer.concat(chunks));
  const duration = words.length ? words[words.length - 1].end : 0;
  return { words, duration };
}

/**
 * Agrupa palavras em blocos de legenda curtos (estilo "karaoke"), que é como
 * as legendas de vídeo curto retêm melhor: poucas palavras, troca frequente.
 */
export function toCaptions(words: WordTiming[], maxWords = 4, maxChars = 26): WordTiming[] {
  const out: WordTiming[] = [];
  let buf: WordTiming[] = [];

  const flush = () => {
    if (!buf.length) return;
    out.push({
      text: buf.map((w) => w.text).join(' '),
      start: buf[0].start,
      end: buf[buf.length - 1].end,
    });
    buf = [];
  };

  for (const w of words) {
    const candidate = [...buf, w].map((x) => x.text).join(' ');
    if (buf.length >= maxWords || candidate.length > maxChars) flush();
    buf.push(w);
    // Quebra em pontuação (final OU vírgula/dois-pontos): mantém a legenda
    // alinhada com unidades de sentido, em vez de cortar a meio de uma ideia.
    if (/[.!?,;:—]$/.test(w.text)) flush();
  }
  flush();
  return out;
}

/**
 * Prepara texto para narração: remove apartes entre parênteses (que soam mal
 * lidos em voz alta e partem as legendas), aspas e espaços a mais.
 */
export function cleanNarration(text: string): string {
  return text
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/[“”"']/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
}
