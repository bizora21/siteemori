// Voz off gratuita via Edge TTS (vozes neurais da Microsoft) — sem API key,
// sem limites práticos. Devolve o áudio e o tempo exato de cada palavra, o que
// permite legendas sincronizadas (o maior fator de retenção em vídeo curto).

import { writeFileSync } from 'node:fs';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { spawnSync } from 'node:child_process';
import type { Locale } from '@/i18n/config';

/** Voz feminina e calma em cada variante — a Emori é sempre "ela".
 *  Thalita é a geração "multilingual" (mais recente e natural que a Francisca). */
export const VOICE: Record<Locale, string> = {
  'pt-br': 'pt-BR-ThalitaMultilingualNeural',
  'pt-pt': 'pt-PT-RaquelNeural',
};

/** Uma voz disponível para escolher. */
export interface VoiceInfo {
  /** nome técnico, ex.: pt-PT-DuarteNeural */
  name: string;
  /** nome para mostrar, ex.: Duarte */
  label: string;
  gender: 'Female' | 'Male';
  locale: string;
  /** vozes "multilingue" (de outros países) que também falam português */
  multilingual: boolean;
}

/** Lista de reserva se a Microsoft não responder (sem internet). */
const FALLBACK_VOICES: VoiceInfo[] = [
  { name: 'pt-PT-RaquelNeural', label: 'Raquel', gender: 'Female', locale: 'pt-PT', multilingual: false },
  { name: 'pt-PT-DuarteNeural', label: 'Duarte', gender: 'Male', locale: 'pt-PT', multilingual: false },
  { name: 'pt-BR-FranciscaNeural', label: 'Francisca', gender: 'Female', locale: 'pt-BR', multilingual: false },
  { name: 'pt-BR-AntonioNeural', label: 'Antônio', gender: 'Male', locale: 'pt-BR', multilingual: false },
  { name: 'pt-BR-ThalitaMultilingualNeural', label: 'Thalita (multilingue)', gender: 'Female', locale: 'pt-BR', multilingual: true },
  { name: 'en-US-AvaMultilingualNeural', label: 'Ava (multilingue)', gender: 'Female', locale: 'en-US', multilingual: true },
  { name: 'en-US-AndrewMultilingualNeural', label: 'Andrew (multilingue)', gender: 'Male', locale: 'en-US', multilingual: true },
];

let voicesCache: { at: number; list: VoiceInfo[] } | null = null;

/** As vozes em português (e as multilingues que também o falam), pedidas à Microsoft; guardadas 1 hora. */
export async function listVoices(): Promise<{ voices: VoiceInfo[]; online: boolean }> {
  if (voicesCache && Date.now() - voicesCache.at < 3600_000) return { voices: voicesCache.list, online: true };
  try {
    const raw = await new MsEdgeTTS().getVoices();
    const list: VoiceInfo[] = raw
      .filter((v) => /^pt-/i.test(v.Locale) || /Multilingual/i.test(v.ShortName))
      .map((v) => {
        const multilingual = /Multilingual/i.test(v.ShortName);
        const base = v.ShortName.replace(/^[a-z]{2,3}-[A-Za-z]{2,4}-/, '').replace(/MultilingualNeural$|Neural$/, '');
        return { name: v.ShortName, label: base + (multilingual ? ' (multilingue)' : ''), gender: v.Gender as 'Female' | 'Male', locale: v.Locale, multilingual };
      })
      .sort((a, b) => Number(a.multilingual) - Number(b.multilingual) || a.locale.localeCompare(b.locale) || a.label.localeCompare(b.label));
    if (list.length) {
      voicesCache = { at: Date.now(), list };
      return { voices: list, online: true };
    }
  } catch {
    /* sem internet: lista de reserva */
  }
  return { voices: FALLBACK_VOICES, online: false };
}

/** Uma palavra falada, com início e fim em segundos. */
export interface WordTiming {
  text: string;
  start: number;
  end: number;
}

/** Os offsets do Edge TTS vêm em unidades de 100 nanossegundos. */
const TICKS_PER_SECOND = 10_000_000;

/** Sintetiza com tentativas — a ligação ao Edge TTS falha ocasionalmente. */
export async function synthesize(
  text: string,
  lang: Locale,
  outFile: string,
  rate = '-8%',
  attempts = 3,
  /** Voz escolhida (ex.: pt-PT-DuarteNeural); por defeito a da marca/idioma. */
  voiceName?: string,
): Promise<{ words: WordTiming[]; duration: number }> {
  if (process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID) {
    try {
      return await synthesizeElevenLabs(text, outFile, rate);
    } catch (err) {
      console.warn(`  ⚠ ElevenLabs falhou (${err instanceof Error ? err.message : err}) — a usar Edge TTS`);
    }
  }
  for (let i = 1; i <= attempts; i += 1) {
    try {
      return await synthesizeOnce(text, lang, outFile, rate, voiceName);
    } catch (err) {
      // 403 = a Microsoft mudou a autenticação do endpoint; repetir não resolve.
      // Falha já, para o chamador cair no Piper sem esperas inúteis.
      const msg = err instanceof Error ? err.message : String(err);
      if (/40[13]/.test(msg) || i === attempts) {
        // O WebSocket do Node falha em algumas redes; o Python (edge-tts) costuma passar.
        const viaPy = synthesizePython(text, lang, outFile, rate, voiceName);
        if (viaPy) return viaPy;
        throw err;
      }
      console.warn(`  ⚠ TTS falhou (tentativa ${i}/${attempts}) — a repetir…`);
      await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
  throw new Error('inalcançável');
}

/** Voz clonada (ElevenLabs): devolve áudio e tempos por caractér, convertidos em palavras. */
async function synthesizeElevenLabs(
  text: string,
  outFile: string,
  rate: string,
): Promise<{ words: WordTiming[]; duration: number }> {
  const pct = Number.parseFloat(rate);
  const speed = Math.min(1.2, Math.max(0.7, 1 + (Number.isFinite(pct) ? pct : 0) / 100));
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY as string, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: process.env.ELEVENLABS_MODEL ?? 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.85, speed },
      }),
    },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);

  const json = (await res.json()) as {
    audio_base64: string;
    alignment: {
      characters: string[];
      character_start_times_seconds: number[];
      character_end_times_seconds: number[];
    };
  };
  writeFileSync(outFile, Buffer.from(json.audio_base64, 'base64'));

  const { characters, character_start_times_seconds: starts, character_end_times_seconds: ends } = json.alignment;
  const words: WordTiming[] = [];
  let cur: WordTiming | null = null;
  characters.forEach((ch, i) => {
    if (/\s/.test(ch)) {
      cur = null;
      return;
    }
    if (!cur) {
      cur = { text: '', start: starts[i], end: ends[i] };
      words.push(cur);
    }
    cur.text += ch;
    cur.end = ends[i];
  });
  console.warn('  ✓ voz clonada (ElevenLabs)');
  return { words, duration: words.length ? words[words.length - 1].end : 0 };
}

/** Alternativa em Python: scripts/edge_tts_py.py (dependência em tools/pylib). */
function synthesizePython(
  text: string,
  lang: Locale,
  outFile: string,
  rate: string,
  voiceName?: string,
): { words: WordTiming[]; duration: number } | null {
  const py = process.env.PYTHON_BIN ?? 'C:/Users/COSSA/AppData/Local/Programs/Python/Python312/python.exe';
  const r = spawnSync(py, ['-I', 'scripts/edge_tts_py.py', text, voiceName ?? VOICE[lang], outFile, rate], {
    encoding: 'utf8',
    maxBuffer: 20_000_000,
    // Sem rede o edge-tts pode ficar pendurado para sempre: falha e deixa o chamador decidir.
    timeout: 90_000,
  });
  if (r.status !== 0) return null;
  try {
    const out = JSON.parse(r.stdout.trim().split('\n').pop() ?? '{}') as { words?: WordTiming[] };
    const words = out.words ?? [];
    if (words.length === 0) return null;
    console.warn('  ✓ voz via Python (edge-tts)');
    return { words, duration: words[words.length - 1].end };
  } catch {
    return null;
  }
}

export async function synthesizeOnce(
  text: string,
  lang: Locale,
  outFile: string,
  /** ritmo da fala; ligeiramente mais lento soa mais calmo e dá tempo de ler */
  rate = '-8%',
  voiceName?: string,
): Promise<{ words: WordTiming[]; duration: number }> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voiceName ?? VOICE[lang], OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3, {
    wordBoundaryEnabled: true,
    sentenceBoundaryEnabled: false,
  });

  const { audioStream, metadataStream } = tts.toStream(text, { rate });

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

/** Uma linha de legenda com as palavras que a compõem (para realçar a atual). */
export interface CaptionLine {
  words: WordTiming[];
  start: number;
  end: number;
}

/**
 * Agrupa as palavras em linhas curtas, mantendo cada palavra individual — o que
 * permite mostrar a linha inteira e realçar apenas a que está a ser lida.
 */
export function toCaptionLines(words: WordTiming[], maxWords = 5, maxChars = 30): CaptionLine[] {
  const lines: CaptionLine[] = [];
  let buf: WordTiming[] = [];

  const flush = () => {
    if (!buf.length) return;
    lines.push({ words: buf, start: buf[0].start, end: buf[buf.length - 1].end });
    buf = [];
  };

  for (const w of words) {
    const candidate = [...buf, w].map((x) => x.text).join(' ');
    if (buf.length >= maxWords || candidate.length > maxChars) flush();
    buf.push(w);
    if (/[.!?,;:—]$/.test(w.text)) flush();
  }
  flush();
  return lines;
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
