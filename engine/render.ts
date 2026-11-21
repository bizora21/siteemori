// Ponte entre o projeto e as composições Remotion. Cada template sabe montar as
// suas props; o resto do motor não sabe nada de Remotion.

import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { basename, extname, join, resolve } from 'node:path';
import { toCaptionLines, type CaptionLine } from '../lib/social/tts';
import { detectBackdrop, duration, run, stageCutout, stageVideo, voiceLevels } from './ffmpeg';
import { resolveCues } from './cues';
import { masterAudio, qualityReport } from './master';
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
/** Textura de grão de filme (256×256, ruído cinzento), criada uma vez. */
function ensureGrain(): void {
  const f = join(VIDEO_DIR, 'public', 'grain.png');
  if (existsSync(f)) return;
  mkdirSync(join(VIDEO_DIR, 'public'), { recursive: true });
  run(['-f', 'lavfi', '-i', 'color=c=gray:s=256x256,noise=alls=100:allf=t+u', '-frames:v', '1', f]);
}

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
  type: 'image' | 'video' | 'presenter' | 'cutout';
  /** Segundo do vídeo em que entra e quanto tempo fica. */
  from: number;
  duration: number;
  /** Duração do clip (para repetir vídeos curtos). */
  clipSeconds?: number;
  /** "contain": mostrar inteira (cartaz com texto). */
  fit?: 'cover' | 'contain';
  /** Vídeo: segundo do ficheiro em que começa a tocar. */
  startFrom?: number;
  /** Transição própria deste cenário. */
  transition?: string;
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

/** Faz (ou reaproveita) o vídeo recortado de uma cena; null (com aviso) se não houver fundo uniforme. */
function stageCutoutFile(project: Project, projectDir: string, sceneId: string, rel: string, pl: NonNullable<Project['person']>): { src: string; clip: number } | null {
  const src = join(projectDir, rel);
  if (!existsSync(src)) return null;
  let key = pl.key ?? 'auto';
  if (key === 'verde') key = '#1fa84a';
  else if (key === 'azul') key = '#1f4fd8';
  else if (key === 'auto') {
    const d = detectBackdrop(src);
    if (!d) {
      stageWarnings.push(`cena "${sceneId}": não consegui detetar um fundo de uma só cor nos cantos do vídeo — o recorte não foi feito (use um pano verde ou azul, ou escolha a cor do fundo)`);
      return null;
    }
    key = d;
  }
  const tol = pl.tolerance ?? 0.15;
  const outDir = join(VIDEO_DIR, 'public', 'media', project.id);
  mkdirSync(outDir, { recursive: true });
  const file = `${sceneId}-recorte-${key.replace('#', '')}-${Math.round(tol * 100)}.webm`;
  const dst = join(outDir, file);
  if (!existsSync(dst) || statSync(dst).mtimeMs < statSync(src).mtimeMs) {
    if (!stageCutout(src, dst, key, tol)) {
      stageWarnings.push(`cena "${sceneId}": o recorte falhou — usei o rosto em bolha`);
      return null;
    }
  }
  return { src: `media/${project.id}/${file}`, clip: duration(dst) };
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
  const stab = project.stabilize;
  const file = `${name}${stab ? '-st-' + stab : ''}.mp4`;
  const dst = join(outDir, file);
  if (!existsSync(dst) || statSync(dst).mtimeMs < statSync(src).mtimeMs) {
    if (!stageVideo(src, dst, stab)) stageWarnings.push(`cena "${sceneId}": não consegui estabilizar "${rel}": usei o vídeo como está`);
  }
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
    const isClip = scene.kind === 'clip';
    const wantPresenter = Boolean(scene.presenter) && (audios[i].source === 'human' || audios[i].source === 'clip');
    const end = tl.sceneStarts[i + 1] ?? tl.lead + tl.voiceSeconds + 2;
    const asMedia = (f: { src: string; image: boolean; clip: number }, fit?: 'cover' | 'contain'): SceneMedia =>
      f.image
        ? { src: f.src, type: 'image', from: tl.sceneStarts[i], duration: end - tl.sceneStarts[i], fit: fit ?? project.imageFit }
        : { src: f.src, type: 'video', from: tl.sceneStarts[i], duration: end - tl.sceneStarts[i], clipSeconds: f.clip, fit: fit ?? project.imageFit };
    const asFace = (f: { src: string; clip: number }): SceneMedia => ({ src: f.src, type: 'presenter', from: tl.audioStarts[i], duration: Math.min(f.clip, tl.durations[i]), clipSeconds: f.clip });

    let main: SceneMedia | null = null;
    let face: SceneMedia | null = null;
    if (reportagem) {
      // O rosto e o cenário são camadas separadas: com cenário, o rosto passa a bolha.
      // Nas versões "foto" e "só voz" o vídeo do rosto não aparece (o áudio dele continua a ser a voz da cena).
      if (wantPresenter && (showFaceVideo || isClip)) {
        const pl = { ...project.person, ...scene.person };
        const f = tryStage(project, projectDir, scene.id, scene.presenter!, `${scene.id}-rosto`);
        if (f && !f.image) face = asFace(f);
        // Pessoa "de pé" à frente do cenário: tira a cor do fundo e guarda com transparência.
        if (pl.mode === 'recorte' && face && !isClip) {
          const cut = stageCutoutFile(project, projectDir, scene.id, scene.presenter!, pl);
          if (cut) face = { ...asFace({ src: cut.src, clip: cut.clip }), type: 'cutout' };
        }
      }
      if (scene.media && !isClip) {
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
    const list = isClip ? [] : (scene.cutaways ?? []);
    const anchored = list.some((c) => c.atWord !== undefined);
    const auto = !anchored && list.length > 0 && list.every((c) => c.at === undefined);

    // "Quando digo esta palavra": o instante vem dos tempos reais das palavras da voz.
    const wordOffset = tl.wordCounts.slice(0, i).reduce((a, b) => a + b, 0);
    const wordAt = (w: number): number => {
      const n = tl.wordCounts[i] ?? 0;
      if (!n) return 0;
      const word = tl.words[wordOffset + Math.min(Math.max(0, Math.round(w)), n - 1)];
      return Math.max(0, (word?.start ?? tl.audioStarts[i]) - tl.audioStarts[i]);
    };
    // Cada cenário fica até ao seguinte entrar (o último, até ao fim da fala da cena).
    const order = anchored
      ? list.map((c) => ({ c, at: wordAt(c.atWord ?? 0) })).sort((a, b) => a.at - b.at)
      : list.map((c) => ({ c, at: 0 }));
    const cutaways = order.flatMap(({ c, at: atAnchor }, k): SceneMedia[] => {
      const f = tryStage(project, projectDir, scene.id, c.media, `${scene.id}-c${k + 1}`);
      if (!f) return [];
      const part = tl.durations[i] / list.length;
      const at = anchored ? atAnchor : auto ? k * part : (c.at ?? 0);
      // O último cenário da cena fica até a cena seguinte começar (a pausa entre cenas não mostra um fundo liso);
      // na última cena, até ao fim do vídeo.
      const lastOne = k === order.length - 1;
      const sceneEnd = lastOne
        ? i + 1 < project.scenes.length ? tl.audioStarts[i + 1] : tl.lead + tl.voiceSeconds + (project.tail ?? TEMPLATES[project.template].tail)
        : tl.audioStarts[i] + tl.durations[i];
      const restRel = sceneEnd - tl.audioStarts[i];
      const wanted = anchored ? (order[k + 1] ? order[k + 1].at : restRel) - atAnchor : auto ? (lastOne ? restRel - k * part : part) : (c.duration ?? 2);
      const from = tl.audioStarts[i] + at;
      const dur = Math.max(0.5, Math.min(wanted, sceneEnd - from));
      return [{ src: f.src, type: f.image ? 'image' : 'video', from, duration: dur, clipSeconds: f.image ? undefined : f.clip, fit: c.fit ?? project.imageFit, startFrom: f.image ? undefined : c.startFrom, transition: c.transition }];
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
    const ducking = Boolean(project.music) && project.audio?.ducking !== false;
    if (ducking) levels = voiceLevels(tl.mp3, LEVEL_STEP); // para baixar a música enquanto se fala
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

    if (project.style?.grain) ensureGrain();

    // Um cartaz com texto precisa de tempo para ser lido (≈ 3 s, no mínimo).
    media.forEach((m, i) => {
      for (const c of m.cutaways) {
        if (c.fit !== 'contain' && c.duration < 1.2) warnings.push(`cena "${project.scenes[i].id}": um cenário aparece só ${c.duration.toFixed(1)} s (a palavra escolhida está muito perto do fim da cena): escolha uma palavra mais cedo.`);
      }
      for (const c of [m.main, ...m.cutaways]) {
        if (c?.fit === 'contain' && c.duration < 3) warnings.push(`cena "${project.scenes[i].id}": um cartaz aparece só ${c.duration.toFixed(1)} s — pouco para ler o texto (use menos cenários nesta cena ou uma voz mais longa).`);
      }
    });

    // Textos, emojis e imagens da linha do tempo: o tempo é relativo ao início da fala da cena.
    const overlays = (project.overlays ?? []).flatMap((o, k) => {
      const i = project.scenes.findIndex((s) => s.id === o.scene);
      if (i < 0) {
        warnings.push(`elemento ${k + 1} da linha do tempo: a cena "${o.scene}" já não existe: ignorei-o`);
        return [];
      }
      const from = tl.audioStarts[i] + Math.max(0, o.at ?? 0.5);
      const to = Math.min(tl.audioStarts[i] + tl.durations[i] + 0.5, from + Math.max(0.8, o.seconds ?? 3));
      if (to - from < 0.4) return [];
      let src: string | undefined;
      if (o.kind === 'image') {
        const f = o.media ? tryStage(project, projectDir, o.scene, o.media, `ov-${k + 1}`) : null;
        if (!f || !f.image) return [];
        src = f.src;
      } else if (!o.text?.trim()) return [];
      return [{ kind: o.kind, text: o.text?.trim(), src, from, to, x: o.x ?? 50, y: o.y ?? 30, size: o.size ?? 1, style: o.style ?? 'destaque', anim: o.anim ?? 'pop' }];
    });

    // Sons juntados (ambiente do local, efeitos): convertidos para mp3 e postos na hora certa.
    const sounds = (project.sounds ?? []).flatMap((o, k) => {
      const i = project.scenes.findIndex((s) => s.id === o.scene);
      const src = join(projectDir, o.file);
      if (i < 0 || !existsSync(src)) {
        warnings.push(`som ${k + 1}: ${i < 0 ? `a cena "${o.scene}" já não existe` : 'o ficheiro não foi encontrado'}: ignorei-o`);
        return [];
      }
      const outDir = join(VIDEO_DIR, 'public', 'media', project.id);
      mkdirSync(outDir, { recursive: true });
      const file = `snd-${k + 1}.mp3`;
      const dst = join(outDir, file);
      if (!existsSync(dst) || statSync(dst).mtimeMs < statSync(src).mtimeMs) run(['-i', src, '-vn', '-ar', '44100', '-ac', '2', '-b:a', '160k', dst]);
      const from = tl.audioStarts[i] + Math.max(0, o.at ?? 0);
      return [{ src: `media/${project.id}/${file}`, from, to: from + Math.max(0.3, o.seconds ?? duration(dst)), volume: Math.min(1, Math.max(0, o.volume ?? 0.6)) }];
    });

    return {
      composition: def.composition,
      warnings,
      lines,
      props: {
        ...base,
        lines,
        ...(overlays.length ? { overlays } : {}),
        ...(sounds.length ? { sounds } : {}),
        // para o editor do estúdio (linha do tempo): onde começa a fala de cada cena e quanto dura
        audioStarts: tl.audioStarts,
        sceneDurations: tl.durations,
        scenes: project.scenes.map((s, i) => ({
          title: s.title ?? '',
          location: s.location,
          media: media[i].main ?? undefined,
          face: media[i].face ?? undefined,
          clip: s.kind === 'clip' ? true : undefined,
          // Disposição da pessoa recortada: lado e tamanho (só quando o recorte foi feito).
          person: media[i].face?.type === 'cutout' ? { side: { ...project.person, ...s.person }.side ?? 'centro', size: { ...project.person, ...s.person }.size ?? 78 } : undefined,
          // Assinatura: só nesta cena, no momento escolhido (por defeito 0,3 s a seguir ao início da fala, durante 5 s).
          signature: s.signature?.name?.trim()
            ? {
                name: s.signature.name.trim(),
                role: s.signature.role?.trim() || undefined,
                extra: s.signature.extra?.trim() || undefined,
                from: tl.audioStarts[i] + Math.max(0, s.signature.at ?? 0.3),
                to: Math.min(tl.audioStarts[i] + tl.durations[i], tl.audioStarts[i] + Math.max(0, s.signature.at ?? 0.3) + Math.max(1.5, s.signature.seconds ?? 5)),
              }
            : undefined,
          cutaways: media[i].cutaways,
        })),
        host: project.host?.name?.trim() && !/^(seu nome|nome)$/i.test(project.host.name.trim()) ? project.host : undefined,
        brandName: brand.name,
        colors: brand.colors,
        logo: brand.logo,
        aspect: project.aspect ?? '9:16',
        music: stageMusic(project, projectDir),
        ...(avatar || ducking ? { ...(avatar ? { avatar } : {}), voiceLevels: levels, levelStep: LEVEL_STEP } : {}),
        duck: project.audio?.ducking !== false,
        ...(project.style ? { style: project.style } : {}),
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

/**
 * O Remotion copia para CADA render toda a pasta public. Com o tempo video3d/public enchia-se com os
 * cenários, vozes e músicas de todos os vídeos já gerados (dezenas de MB) e o render passava a falhar por
 * tempo esgotado ("Timed out … while setting up the headless browser"). Por isso cada render usa uma pasta
 * public MÍNIMA em .engine-cache/render-public/<id>/: as fontes e logótipos, mais só os ficheiros deste
 * vídeo. Não se apaga nada de video3d/public; esta pasta é só uma cópia de trabalho (sobrepõe-se a cada render).
 */
function makeRenderPublic(id: string, plan: RenderPlan): string {
  const src = join(VIDEO_DIR, 'public');
  const dest = resolve('.engine-cache', 'render-public', id);
  mkdirSync(dest, { recursive: true });
  const needed = typeof plan.props.music === 'string' && !plan.props.music.includes('/') ? plan.props.music : null;
  for (const name of readdirSync(src, { withFileTypes: true })) {
    // Ficheiros soltos (fontes, logótipos, silence.mp3). As músicas antigas pesadas só vão se este vídeo as usar.
    if (name.isFile() && (!name.name.endsWith('.mp3') || name.name === 'silence.mp3' || name.name === needed)) {
      copyFileSync(join(src, name.name), join(dest, name.name));
    }
  }
  const mine = (sub: string, name: string) => {
    const from = join(src, sub, name);
    if (!existsSync(from)) return;
    mkdirSync(join(dest, sub), { recursive: true });
    cpSync(from, join(dest, sub, name), { recursive: true, force: true });
  };
  mine('media', id);
  mine('music', id);
  mine('audio', `${id}.mp3`);
  return dest;
}

export function renderVideo(project: Project, plan: RenderPlan, opts: { draft: boolean }): string {
  mkdirSync(join(VIDEO_DIR, 'props'), { recursive: true });
  mkdirSync(join(VIDEO_DIR, 'out'), { recursive: true });
  const propsFile = `props/${project.id}.json`;
  writeFileSync(join(VIDEO_DIR, propsFile), JSON.stringify(plan.props, null, 2));

  const out = `out/${project.id}${opts.draft ? '-rascunho' : ''}.mp4`;
  const publicDir = makeRenderPublic(project.id, plan);
  // O Versículo 3D lê sempre music.mp3 da pasta public: na cópia de trabalho põe a música deste projeto, ou silêncio
  // (nunca a de outro vídeo; a music.mp3 original de video3d/public não se toca).
  if (plan.composition === 'Verse3D') {
    const dst = join(publicDir, 'music.mp3');
    const own = project.music ? join('projects', project.id, project.music.file) : '';
    if (own && existsSync(own)) copyFileSync(own, dst);
    else run(['-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-t', '120', '-b:a', '64k', dst]);
  }
  // Rascunho: metade da resolução e 1 só processo — para validar sem fritar uma máquina fraca.
  // O limite de 3 min evita "Timed out after 30000 while setting up the headless browser" em máquinas lentas.
  // Final: CRF 17 (imagem limpa em 1080 p) e som a 192 kb/s. O rascunho prioriza a rapidez.
  const extra = opts.draft ? ['--scale=0.5', '--concurrency=1'] : ['--crf=17', '--audio-bitrate=192k'];
  const r = spawnSync('npx', ['remotion', 'render', 'src/index.ts', plan.composition, out, `--props=${propsFile}`, `--public-dir="${publicDir}"`, '--timeout=180000', ...extra], {
    cwd: VIDEO_DIR,
    stdio: 'inherit',
    shell: true,
  });
  if (r.status !== 0) throw new Error('render falhou');
  const file = join(VIDEO_DIR, out);
  // Acabamento do som e relatório de qualidade (nada disto impede o vídeo se falhar).
  let mastered = false;
  if (project.audio?.master !== false) {
    try {
      const m = masterAudio(file);
      mastered = Boolean(m);
      if (m) console.log(`  ✓ som masterizado: ${m.before?.lufs.toFixed(1) ?? '?'} → ${m.after?.lufs.toFixed(1) ?? '?'} LUFS`);
      else console.warn('  ⚠ não consegui masterizar o som (o vídeo ficou como saiu do render)');
    } catch (e) {
      console.warn('  ⚠ masterização do som falhou: ' + (e instanceof Error ? e.message : e));
    }
  }
  try {
    const rows = qualityReport(file, join(VIDEO_DIR, 'out', project.id, `${project.id}-qualidade.md`), { draft: opts.draft, mastered });
    for (const l of rows) console.log('  ' + l);
  } catch {
    /* o relatório é um extra */
  }
  return file;
}

/** Planeia o render. Ficheiros de apoio em falta (cenários, foto, música) ficam em avisos e não impedem o vídeo. */
export function planRender(project: Project, brand: Brand, tl: Timeline, audioRel: string, projectDir: string, audios: SceneAudio[]): RenderPlan {
  stageWarnings.length = 0;
  const plan = planRenderInner(project, brand, tl, audioRel, projectDir, audios);
  // Legendas desligadas: o vídeo sai sem elas, mas plan.lines (e por isso o .srt) mantém-se.
  const props = project.captions === false ? { ...plan.props, lines: [] } : plan.props;
  return { ...plan, props, warnings: [...plan.warnings, ...stageWarnings] };
}
