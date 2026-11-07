// Tempo das cenas: tudo deriva dos instantes reais da voz (sceneStarts), nunca de
// durações fixas — assim a imagem acompanha a narração mesmo que a voz mude de ritmo.

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const easeIO = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

/**
 * Valor que muda de `values[i-1]` para `values[i]` ao longo de `dur` segundos a partir
 * do início da cena i. Cada transição soma o seu delta, por isso é contínuo e monótono.
 */
export function keyed(t: number, starts: number[], values: number[], dur = 0.9, offset = 0): number {
  let v = values[0];
  for (let i = 1; i < values.length; i++) {
    v += (values[i] - values[i - 1]) * easeIO(clamp01((t - (starts[i] + offset)) / dur));
  }
  return v;
}

export function sceneOf(t: number, starts: number[]): number {
  let idx = 0;
  starts.forEach((s, k) => {
    if (t >= s) idx = k;
  });
  return idx;
}

/** Progresso 0..1 dentro da cena `i`; `end` é o fim da última cena. */
export function sceneProgress(t: number, starts: number[], i: number, end: number): number {
  const a = starts[i];
  const b = i + 1 < starts.length ? starts[i + 1] : end;
  return clamp01((t - a) / Math.max(0.001, b - a));
}

/** Aleatório determinístico (os frames têm de ser reproduzíveis). */
export function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
