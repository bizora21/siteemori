// "Cues": instantes-chave do vídeo ancorados a uma PALAVRA da voz. Ex.: no
// "Aprender a Bíblia" o dedo toca na resposta certa quando a voz diz "Noé".
// Em vez de código por vídeo, o projeto declara o cue e o motor resolve-o a
// partir dos tempos reais das palavras (por isso o efeito acompanha a voz,
// seja ela sintética ou humana).

import type { WordTiming } from '../lib/social/tts';
import type { Cue } from './types';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');

function setPath(obj: Record<string, unknown>, path: string, value: number): void {
  const keys = path.split('.');
  let cur = obj;
  keys.slice(0, -1).forEach((k) => {
    if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {};
    cur = cur[k] as Record<string, unknown>;
  });
  cur[keys[keys.length - 1]] = value;
}

export interface CueResult {
  props: Record<string, unknown>;
  /** Cues que não encontraram a palavra e usaram o valor de reserva (para avisar). */
  fallbacks: string[];
}

/** Os cues resolvem-se em ordem: um cue pode apoiar-se num anterior (after.cue). */
export function resolveCues(cues: Cue[] | undefined, words: WordTiming[], sceneStarts: number[]): CueResult {
  const props: Record<string, unknown> = {};
  const values = new Map<string, number>();
  const fallbacks: string[] = [];

  for (const c of cues ?? []) {
    const off = c.offset ?? 0;
    let base: number | undefined;

    if (c.atScene !== undefined) {
      base = sceneStarts[c.atScene];
    } else if (c.word) {
      const lower = c.after?.scene !== undefined ? sceneStarts[c.after.scene] : c.after?.cue ? values.get(c.after.cue) : undefined;
      const upper = c.before?.scene !== undefined ? sceneStarts[c.before.scene] : undefined;
      const hits = words.filter((w) => norm(w.text) === norm(c.word!) && (lower === undefined || w.start > lower) && (upper === undefined || w.start < upper));
      const hit = c.pick === 'last' ? hits[hits.length - 1] : hits[0];
      if (hit) base = (c.edge ?? 'start') === 'end' ? hit.end : hit.start;
    }

    if (base === undefined) {
      const f = c.fallback;
      if (!f) throw new Error(`cue "${c.prop}": palavra "${c.word}" não encontrada e sem fallback`);
      base = f.abs ?? (f.scene !== undefined ? sceneStarts[f.scene] : values.get(f.cue ?? '') ?? 0) + (f.seconds ?? 0);
      fallbacks.push(c.prop);
    }
    const v = base + off;
    values.set(c.prop, v);
    setPath(props, c.prop, v);
  }
  return { props, fallbacks };
}
