// Acabamento do SOM e controlo de qualidade do vídeo final. Só ffmpeg: corre em qualquer máquina.
//
//  - Masterização: filtro de graves, compressor suave e normalização a -14 LUFS (o padrão das redes
//    sociais), com o pico limitado a -1 dBTP. Dois passos, por isso o resultado é exato.
//  - Relatório de qualidade (<id>-qualidade.md): resolução, duração, débito, volume e pico, com ✓/⚠.

import { spawnSync } from 'node:child_process';
import { renameSync, writeFileSync } from 'node:fs';
import { FFMPEG } from './ffmpeg';

const TARGET_LUFS = -14;
const TARGET_TP = -1;
/** Voz mais limpa e uniforme antes de normalizar: tira rumble e achata picos de volume. */
const VOICE_CHAIN = 'highpass=f=70,acompressor=threshold=-20dB:ratio=2.2:attack=15:release=250:makeup=2';

interface LoudnormStats {
  input_i: string;
  input_tp: string;
  input_lra: string;
  input_thresh: string;
  target_offset: string;
}

function measure(file: string, chain: string): LoudnormStats | null {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-nostats', '-i', file, '-af', `${chain},loudnorm=I=${TARGET_LUFS}:TP=${TARGET_TP}:LRA=9:print_format=json`, '-vn', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  const m = /\{[^{}]*"input_i"[^{}]*\}/.exec(r.stderr ?? '');
  if (!m) return null;
  try {
    return JSON.parse(m[0]) as LoudnormStats;
  } catch {
    return null;
  }
}

/** Mede o volume (LUFS integrado e pico real) de um ficheiro. */
export function loudness(file: string): { lufs: number; peak: number } | null {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=true', '-vn', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  const err = r.stderr ?? '';
  const i = /Integrated loudness:\s*\n\s*I:\s*(-?[\d.]+) LUFS/.exec(err);
  const p = /True peak:\s*\n\s*Peak:\s*(-?[\d.]+) dBFS/.exec(err);
  return i ? { lufs: Number(i[1]), peak: p ? Number(p[1]) : NaN } : null;
}

/**
 * Masteriza o áudio de um .mp4 já renderizado (o vídeo não é recodificado). Devolve o volume antes e
 * depois, ou null se não houve nada a fazer. Se falhar, o ficheiro original fica intacto.
 */
export function masterAudio(file: string): { before: { lufs: number; peak: number } | null; after: { lufs: number; peak: number } | null } | null {
  const before = loudness(file);
  const stats = measure(file, VOICE_CHAIN);
  if (!stats) return null;
  const tmp = file.replace(/\.mp4$/, '.master.mp4');
  const af = `${VOICE_CHAIN},loudnorm=I=${TARGET_LUFS}:TP=${TARGET_TP}:LRA=9:measured_I=${stats.input_i}:measured_TP=${stats.input_tp}:measured_LRA=${stats.input_lra}:measured_thresh=${stats.input_thresh}:offset=${stats.target_offset}:linear=true`;
  const r = spawnSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', file, '-c:v', 'copy', '-af', af, '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', tmp], { encoding: 'utf8' });
  if (r.status !== 0) return null;
  renameSync(tmp, file);
  return { before, after: loudness(file) };
}

/** Dados técnicos do vídeo (resolução, fps, débito, duração), lidos do cabeçalho. */
function probe(file: string): { width: number; height: number; fps: number; kbps: number; seconds: number } {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-i', file], { encoding: 'utf8' });
  const err = r.stderr ?? '';
  const dim = /Video:.*?(\d{3,4})x(\d{3,4})/.exec(err);
  const fps = /(\d+(?:\.\d+)?) fps/.exec(err);
  const br = /bitrate:\s*(\d+) kb\/s/.exec(err);
  const d = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(err);
  return {
    width: dim ? Number(dim[1]) : 0,
    height: dim ? Number(dim[2]) : 0,
    fps: fps ? Number(fps[1]) : 0,
    kbps: br ? Number(br[1]) : 0,
    seconds: d ? Number(d[1]) * 3600 + Number(d[2]) * 60 + Number(d[3]) : 0,
  };
}

/** Escreve o relatório de qualidade ao lado do vídeo. Devolve as linhas, para mostrar no terminal. */
export function qualityReport(file: string, reportPath: string, opts: { draft: boolean; mastered: boolean }): string[] {
  const v = probe(file);
  const l = loudness(file);
  const rows: { ok: boolean; text: string }[] = [];
  const full = v.width >= 1080 || v.height >= 1080;
  rows.push({ ok: opts.draft || full, text: `Resolução: ${v.width}×${v.height}${opts.draft ? ' (rascunho a meia resolução, de propósito)' : full ? '' : ' — abaixo de 1080 p'}` });
  rows.push({ ok: v.fps >= 29, text: `Imagens por segundo: ${v.fps || '?'}` });
  rows.push({ ok: opts.draft || v.kbps >= 2500, text: `Débito total: ${v.kbps} kb/s${opts.draft ? '' : v.kbps >= 2500 ? '' : ' — baixo para 1080 p (a imagem pode ficar com blocos)'}` });
  rows.push({ ok: true, text: `Duração: ${v.seconds.toFixed(1)} s` });
  if (l) {
    rows.push({ ok: l.lufs >= -16 && l.lufs <= -12, text: `Volume: ${l.lufs.toFixed(1)} LUFS (alvo das redes: −14)${opts.mastered ? ' — masterizado' : ' — não masterizado'}` });
    rows.push({ ok: !Number.isFinite(l.peak) || l.peak <= -0.9, text: `Pico de som: ${Number.isFinite(l.peak) ? l.peak.toFixed(1) + ' dBFS' : '?'} (deve ficar abaixo de −1, senão distorce)` });
  } else {
    rows.push({ ok: false, text: 'Volume: não consegui medir (sem pista de áudio?)' });
  }
  const lines = rows.map((r) => `${r.ok ? '✓' : '⚠'} ${r.text}`);
  writeFileSync(reportPath, `# Relatório de qualidade\n\nFicheiro: \`${file.split(/[\\/]/).pop()}\`\n\n${lines.map((x) => `- ${x}`).join('\n')}\n`);
  return lines;
}
