// Ponte entre o projeto e as composições Remotion. Cada template sabe montar as
// suas props; o resto do motor não sabe nada de Remotion.

import { copyFileSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { extname, join } from 'node:path';
import { toCaptionLines, type CaptionLine } from '../lib/social/tts';
import { duration, run, stageVideo } from './ffmpeg';
import { resolveCues } from './cues';
import { TEMPLATES } from './templates';
import type { SceneAudio } from './voice';
import type { Brand, Project } from './types';
import type { Timeline } from './timeline';

export const FPS = 30;
const VIDEO_DIR = 'video3d';

export interface RenderPlan {
  composition: string;
  /** Avisos do planeamento (ex.: cues que não acharam a palavra e usaram reserva). */
  warnings: string[];
  props: Record<string, unknown>;
  lines: CaptionLine[];
}

/** Garante que existe uma faixa de música válida (silêncio, se o projeto não tiver). */
function musicFile(project: Project): string {
  if (project.music) {
    if (!existsSync(join(VIDEO_DIR, 'public', project.music.file))) {
      throw new Error(`música "${project.music.file}" não existe em ${VIDEO_DIR}/public/`);
    }
    return project.music.file;
  }
  const f = join(VIDEO_DIR, 'public', 'silence.mp3');
  if (!existsSync(f)) {
    mkdirSync(join(VIDEO_DIR, 'public'), { recursive: true });
    // 60 s de silêncio: a composição exige uma faixa, o projeto não.
    run(['-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', '60', '-c:a', 'libmp3lame', '-b:a', '32k', f]);
  }
  return 'silence.mp3';
}

export interface SceneMedia {
  src: string;
  type: 'image' | 'video' | 'presenter';
  /** Segundo do vídeo em que entra e quanto tempo fica. */
  from: number;
  duration: number;
  /** Duração do clip (para repetir vídeos curtos). */
  clipSeconds?: number;
}

const IMAGE_EXT = /\.(png|jpe?g|webp|gif)$/i;

/**
 * Prepara a mídia das cenas em video3d/public/media/<projeto>/ (o Remotion só lê
 * dali). Vídeos perdem o áudio — a voz vem sempre da faixa única do motor.
 * O apresentador só aparece se a voz da cena for mesmo a dele (humana); com voz
 * sintética mostrar-lhe a boca a mexer fora de sincronia seria pior que nada.
 */
function stageMedia(project: Project, projectDir: string, tl: Timeline, audios: SceneAudio[]): (SceneMedia | null)[] {
  const outDir = join(VIDEO_DIR, 'public', 'media', project.id);
  return project.scenes.map((scene, i) => {
    const wantPresenter = Boolean(scene.presenter) && audios[i].source === 'human';
    const rel = wantPresenter ? scene.presenter : scene.media;
    if (!rel) return null;
    const src = join(projectDir, rel);
    if (!existsSync(src)) throw new Error(`cena "${scene.id}": ficheiro não encontrado: ${rel}`);
    mkdirSync(outDir, { recursive: true });

    const next = tl.sceneStarts[i + 1];
    const end = next ?? tl.lead + tl.voiceSeconds + 2;
    if (IMAGE_EXT.test(rel) && !wantPresenter) {
      const name = `${scene.id}${extname(rel).toLowerCase()}`;
      copyFileSync(src, join(outDir, name));
      return { src: `media/${project.id}/${name}`, type: 'image', from: tl.sceneStarts[i], duration: end - tl.sceneStarts[i] };
    }
    const name = `${scene.id}.mp4`;
    const dst = join(outDir, name);
    if (!existsSync(dst) || statSync(dst).mtimeMs < statSync(src).mtimeMs) stageVideo(src, dst);
    const clip = duration(dst);
    if (wantPresenter) {
      return { src: `media/${project.id}/${name}`, type: 'presenter', from: tl.audioStarts[i], duration: Math.min(clip, tl.durations[i]), clipSeconds: clip };
    }
    return { src: `media/${project.id}/${name}`, type: 'video', from: tl.sceneStarts[i], duration: end - tl.sceneStarts[i], clipSeconds: clip };
  });
}

export function planRender(
  project: Project,
  brand: Brand,
  tl: Timeline,
  audioRel: string,
  projectDir: string,
  audios: SceneAudio[],
): RenderPlan {
  const def = TEMPLATES[project.template];
  const tail = project.tail ?? def.tail;
  const total = tl.lead + tl.voiceSeconds + tail;
  const base = {
    audio: audioRel,
    durationInFrames: Math.ceil(total * FPS),
    leadSeconds: tl.lead,
    voiceEndSeconds: tl.lead + tl.voiceSeconds,
    ...(def.usesSceneStarts ? { sceneStarts: tl.sceneStarts } : {}),
    cta: project.cta ?? brand.cta,
    site: project.site ?? brand.site,
  };
  const lines = toCaptionLines(tl.words, def.captions[0], def.captions[1]);

  if (project.template === 'institucional') {
    const inst = project.institutional!;
    const media = stageMedia(project, projectDir, tl, audios);
    return {
      composition: def.composition,
      warnings: [],
      lines,
      props: {
        ...base,
        lines,
        scenes: project.scenes.map((s, i) => ({ title: s.title ?? '', source: s.source, media: media[i] ?? undefined })),
        entity: inst.entity,
        department: inst.department,
        disclaimer: inst.disclaimer,
        colors: brand.colors,
        logo: brand.logo,
        aspect: project.aspect ?? '16:9',
        music: project.music?.file,
      },
    };
  }

  // Templates 3D: as composições existentes, com as props de sempre.
  const cues = resolveCues(project.cues, tl.words, tl.sceneStarts);
  const warnings = cues.fallbacks.map((p) => `cue "${p}": a palavra não apareceu na voz — usei o valor de reserva`);
  const props = deepMerge(
    { ...base, lines, ...(def.music ? { music: musicFile(project) } : {}) },
    deepMerge(project.props ?? {}, cues.props),
  );
  return { composition: def.composition, warnings, lines, props };
}

function deepMerge(a: Record<string, unknown>, b: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...a };
  for (const [k, v] of Object.entries(b)) {
    const cur = out[k];
    out[k] = v && typeof v === 'object' && !Array.isArray(v) && cur && typeof cur === 'object' && !Array.isArray(cur)
      ? deepMerge(cur as Record<string, unknown>, v as Record<string, unknown>)
      : v;
  }
  return out;
}

export function renderVideo(project: Project, plan: RenderPlan, opts: { draft: boolean }): string {
  mkdirSync(join(VIDEO_DIR, 'props'), { recursive: true });
  mkdirSync(join(VIDEO_DIR, 'out'), { recursive: true });
  const propsFile = `props/${project.id}.json`;
  writeFileSync(join(VIDEO_DIR, propsFile), JSON.stringify(plan.props, null, 2));

  const out = `out/${project.id}${opts.draft ? '-rascunho' : ''}.mp4`;
  // Rascunho: metade da resolução e 1 só processo — para validar sem fritar uma máquina fraca.
  const extra = opts.draft ? ['--scale=0.5', '--concurrency=1'] : [];
  const r = spawnSync('npx', ['remotion', 'render', 'src/index.ts', plan.composition, out, `--props=${propsFile}`, ...extra], {
    cwd: VIDEO_DIR,
    stdio: 'inherit',
    shell: true,
  });
  if (r.status !== 0) throw new Error('render falhou');
  return join(VIDEO_DIR, out);
}
