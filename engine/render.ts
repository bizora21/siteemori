// Ponte entre o projeto e as composições Remotion. Cada template sabe montar as
// suas props; o resto do motor não sabe nada de Remotion.

import { copyFileSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { basename, extname, join } from 'node:path';
import { toCaptionLines, type CaptionLine } from '../lib/social/tts';
import { duration, run, stageVideo, voiceLevels } from './ffmpeg';
import { resolveCues } from './cues';
import { TEMPLATES } from './templates';
import type { SceneAudio } from './voice';
import type { Brand, Project } from './types';
import type { Timeline } from './timeline';

export const FPS = 30;
/** Resolução do volume da voz para animar a foto (segundos por amostra). */
const LEVEL_STEP = 0.05;
const VIDEO_DIR = 'video3d';

export interface RenderPlan {
  composition: string;
  /** Avisos do planeamento (ex.: cues que não acharam a palavra e usaram reserva). */
  warnings: string[];
  props: Record<string, unknown>;
  lines: CaptionLine[];
}

/**
 * Prepara a música do projeto em video3d/public/music/<id>/ (o Remotion só lê de
 * public/). Procura primeiro em projects/<id>/ e depois em video3d/public/.
 * Devolve o caminho relativo a public/, ou undefined se o projeto não tem música.
 */
function stageMusic(project: Project, projectDir: string): string | undefined {
  if (!project.music) return undefined;
  const rel = project.music.file;
  const local = join(projectDir, rel);
  if (existsSync(local)) {
    const outDir = join(VIDEO_DIR, 'public', 'music', project.id);
    mkdirSync(outDir, { recursive: true });
    const name = basename(rel);
    copyFileSync(local, join(outDir, name));
    return `music/${project.id}/${name}`;
  }
  if (existsSync(join(VIDEO_DIR, 'public', rel))) return rel;
  stageWarnings.push(`música "${rel}" não encontrada: o vídeo sai sem música.`);
  return undefined;
}

/** Os 3D exigem uma faixa: usa a do projeto ou 60 s de silêncio. */
function musicFile(project: Project, projectDir: string): string {
  const staged = stageMusic(project, projectDir);
  if (staged) return staged;
  const f = join(VIDEO_DIR, 'public', 'silence.mp3');
  if (!existsSync(f)) {
    mkdirSync(join(VIDEO_DIR, 'public'), { recursive: true });
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
  /** "contain": mostrar inteira (cartaz com texto). */
  fit?: 'cover' | 'contain';
}

const IMAGE_EXT = /\.(png|jpe?g|webp|gif)$/i;

interface StagedScene {
  /** Institucional: apresentador OU imagem. Reportagem: o cenário de fundo da cena. */
  main: SceneMedia | null;
  /** Reportagem: o rosto (vídeo do apresentador), à parte do fundo. */
  face: SceneMedia | null;
  cutaways: SceneMedia[];
}

/** Copia/transcodifica um ficheiro para video3d/public/media/<projeto>/ (o Remotion só lê dali). */
/** Ficheiro de apoio em falta: o vídeo gera-se sem ele, com um aviso. */
class MissingFile extends Error {}
const stageWarnings: string[] = [];
/** Prepara um ficheiro; se faltar, regista um aviso e devolve null em vez de falhar. */
function tryStage(project: Project, projectDir: string, sceneId: string, rel: string, name: string): { src: string; image: boolean; clip: number } | null {
  try {
    return stageFile(project, projectDir, sceneId, rel, name);
  } catch (e) {
    if (e instanceof MissingFile) {
      stageWarnings.push(e.message);
      return null;
    }
    throw e;
  }
}

function stageFile(project: Project, projectDir: string, sceneId: string, rel: string, name: string): { src: string; image: boolean; clip: number } {
  const src = join(projectDir, rel);
  if (!existsSync(src)) throw new MissingFile(`cena "${sceneId}": o ficheiro "${rel}" não existe (foi apagado ou mudou de sítio): ignorei-o`);
  const outDir = join(VIDEO_DIR, 'public', 'media', project.id);
  mkdirSync(outDir, { recursive: true });
  if (IMAGE_EXT.test(rel)) {
    const file = `${name}${extname(rel).toLowerCase()}`;
    copyFileSync(src, join(outDir, file));
    return { src: `media/${project.id}/${file}`, image: true, clip: 0 };
  }
  const file = `${name}.mp4`;
  const dst = join(outDir, file);
  if (!existsSync(dst) || statSync(dst).mtimeMs < statSync(src).mtimeMs) stageVideo(src, dst);
  return { src: `media/${project.id}/${file}`, image: false, clip: duration(dst) };
}

/**
 * Prepara a mídia das cenas. Vídeos perdem o áudio — a voz vem sempre da faixa
 * única do motor. O apresentador só aparece se a voz da cena for mesmo a dele
 * (humana); com voz sintética mostrar-lhe a boca a mexer fora de sincronia seria
 * pior que nada. Os cortes (cutaways) cobrem o ecrã enquanto a voz continua.
 */
function stageMedia(project: Project, projectDir: string, tl: Timeline, audios: SceneAudio[], showFaceVideo = true): StagedScene[] {
  const reportagem = project.template === 'reportagem';
  return project.scenes.map((scene, i) => {
    const wantPresenter = Boolean(scene.presenter) && audios[i].source === 'human';
    const end = tl.sceneStarts[i + 1] ?? tl.lead + tl.voiceSeconds + 2;
    const asMedia = (f: { src: string; image: boolean; clip: number }, fit?: 'cover' | 'contain'): SceneMedia =>
      f.image
        ? { src: f.src, type: 'image', from: tl.sceneStarts[i], duration: end - tl.sceneStarts[i], fit }
        : { src: f.src, type: 'video', from: tl.sceneStarts[i], duration: end - tl.sceneStarts[i], clipSeconds: f.clip, fit };
    const asFace = (f: { src: string; clip: number }): SceneMedia => ({ src: f.src, type: 'presenter', from: tl.audioStarts[i], duration: Math.min(f.clip, tl.durations[i]), clipSeconds: f.clip });

    let main: SceneMedia | null = null;
    let face: SceneMedia | null = null;
    if (reportagem) {
      // O rosto e o cenário são camadas separadas: com cenário, o rosto passa a bolha.
      // Nas versões "foto" e "só voz" o vídeo do rosto não aparece (o áudio dele continua a ser a voz da cena).
      if (wantPresenter && showFaceVideo) {
        const f = tryStage(project, projectDir, scene.id, scene.presenter!, `${scene.id}-rosto`);
        if (f && !f.image) face = asFace(f);
      }
      if (scene.media) {
        const f = tryStage(project, projectDir, scene.id, scene.media, scene.id);
        if (f) main = asMedia(f, scene.mediaFit);
      }
    } else {
      // Institucional: ou o apresentador ou a imagem da cena.
      const rel = wantPresenter ? scene.presenter : scene.media;
      if (rel) {
        const f = tryStage(project, projectDir, scene.id, rel, scene.id);
        if (f) main = wantPresenter && !f.image ? asFace(f) : asMedia(f);
      }
    }

    // Cenários em sequência durante a fala. Sem tempos indicados, repartem a cena em partes iguais
    // (o utilizador só escolhe as imagens; ajustar os tempos é opcional).
    const list = scene.cutaways ?? [];
    const auto = list.length > 0 && list.every((c) => c.at === undefined);
    const cutaways = list.flatMap((c, k): SceneMedia[] => {
      const f = tryStage(project, projectDir, scene.id, c.media, `${scene.id}-c${k + 1}`);
      if (!f) return [];
      const part = tl.durations[i] / list.length;
      const at = auto ? k * part : (c.at ?? 0);
      const wanted = auto ? part : (c.duration ?? 2);
      const from = tl.audioStarts[i] + at;
      // Nunca passa do fim da fala da cena.
      const dur = Math.max(0.5, Math.min(wanted, tl.audioStarts[i] + tl.durations[i] - from));
      return [{ src: f.src, type: f.image ? 'image' : 'video', from, duration: dur, clipSeconds: f.image ? undefined : f.clip, fit: c.fit }];
    });
    return { main, face, cutaways };
  });
}

function planRenderInner(
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
        scenes: project.scenes.map((s, i) => ({ title: s.title ?? '', source: s.source, media: media[i].main ?? undefined })),
        entity: inst.entity,
        department: inst.department,
        disclaimer: inst.disclaimer,
        colors: brand.colors,
        logo: brand.logo,
        aspect: project.aspect ?? '16:9',
        music: stageMusic(project, projectDir),
      },
    };
  }

  if (project.template === 'reportagem') {
    const mode = project.faceMode ?? 'video';
    const warnings: string[] = [];
    const media = stageMedia(project, projectDir, tl, audios, mode === 'video');

    // Foto animada pela voz: a foto da pessoa + o volume da voz ao longo do tempo.
    let avatar: { src: string } | undefined;
    let levels: number[] | undefined;
    if (mode === 'photo') {
      if (!project.avatar) {
        warnings.push('versão "foto animada": falta a sua foto (Mais opções do vídeo → Carregar a minha foto). Sai sem foto.');
      } else {
        const f = tryStage(project, projectDir, 'avatar', project.avatar, 'avatar');
        if (!f) {
          warnings.push('a foto da pessoa não foi encontrada: o vídeo sai sem ela.');
        } else if (f.image) {
          avatar = { src: f.src, ...(project.avatarFocus ?? {}) };
          levels = voiceLevels(tl.mp3, LEVEL_STEP);
        } else {
          warnings.push('a foto da pessoa tem de ser uma imagem (jpg, png ou webp).');
        }
      }
    }

    // Um cartaz com texto precisa de tempo para ser lido (≈ 3 s, no mínimo).
    media.forEach((m, i) => {
      for (const c of [m.main, ...m.cutaways]) {
        if (c?.fit === 'contain' && c.duration < 3) warnings.push(`cena "${project.scenes[i].id}": um cartaz aparece só ${c.duration.toFixed(1)} s — pouco para ler o texto (use menos cenários nesta cena ou uma voz mais longa).`);
      }
    });

    return {
      composition: def.composition,
      warnings,
      lines,
      props: {
        ...base,
        lines,
        scenes: project.scenes.map((s, i) => ({
          title: s.title ?? '',
          location: s.location,
          media: media[i].main ?? undefined,
          face: media[i].face ?? undefined,
          cutaways: media[i].cutaways,
        })),
        host: project.host?.name?.trim() && !/^(seu nome|nome)$/i.test(project.host.name.trim()) ? project.host : undefined,
        brandName: brand.name,
        colors: brand.colors,
        logo: brand.logo,
        aspect: project.aspect ?? '9:16',
        music: stageMusic(project, projectDir),
        ...(avatar ? { avatar, voiceLevels: levels, levelStep: LEVEL_STEP } : {}),
        ...(project.event?.title?.trim() ? { event: project.event } : {}),
      },
    };
  }

  // Templates 3D: as composições existentes, com as props de sempre.
  const cues = resolveCues(project.cues, tl.words, tl.sceneStarts);
  const warnings = cues.fallbacks.map((p) => `cue "${p}": a palavra não apareceu na voz — usei o valor de reserva`);
  const props = deepMerge(
    { ...base, lines, ...(def.music ? { music: musicFile(project, projectDir) } : {}) },
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

/** Planeia o render. Ficheiros de apoio em falta (cenários, foto, música) ficam em avisos e não impedem o vídeo. */
export function planRender(project: Project, brand: Brand, tl: Timeline, audioRel: string, projectDir: string, audios: SceneAudio[]): RenderPlan {
  stageWarnings.length = 0;
  const plan = planRenderInner(project, brand, tl, audioRel, projectDir, audios);
  return { ...plan, warnings: [...plan.warnings, ...stageWarnings] };
}
