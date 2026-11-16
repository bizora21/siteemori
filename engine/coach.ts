// "Treinador de qualidade": olha para o projeto e diz, em linguagem simples, o que falta para o vídeo
// ficar com qualidade profissional (quantos cenários por cena, voz, rosto, música, acabamento…).
// Nunca bloqueia nada: são só conselhos, com a pontuação a subir à medida que se corrigem.

import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { FFMPEG } from './ffmpeg';
import type { Project } from './types';

export interface CoachItem {
  /** falta = estraga a qualidade; melhorar = ficava melhor; ok = já está bem */
  level: 'falta' | 'melhorar' | 'ok';
  text: string;
  /** O que fazer, em uma frase. */
  how?: string;
}
export interface CoachReport {
  score: number;
  verdict: string;
  seconds: number;
  items: CoachItem[];
}

const WORDS_PER_SECOND = 2.3; // a voz portuguesa em ritmo calmo (medido nos nossos projetos)
const SECONDS_PER_SCENERY = 4; // um cenário novo a cada ~4 s mantém o vídeo vivo
const dimCache = new Map<string, { w: number; h: number } | null>();

function dims(file: string): { w: number; h: number } | null {
  if (!existsSync(file)) return null;
  const key = `${file}:${statSync(file).mtimeMs}`;
  if (dimCache.has(key)) return dimCache.get(key)!;
  const r = spawnSync(FFMPEG, ['-hide_banner', '-i', file], { encoding: 'utf8' });
  const m = /Video:.*?,\s(\d{2,5})x(\d{2,5})/.exec(r.stderr ?? '');
  const v = m ? { w: Number(m[1]), h: Number(m[2]) } : null;
  dimCache.set(key, v);
  return v;
}

const isImage = (f: string) => /\.(png|jpe?g|webp)$/i.test(f);

export function coach(project: Project, projectDir: string, recorded: boolean[]): CoachReport {
  const items: CoachItem[] = [];
  const add = (level: CoachItem['level'], text: string, how?: string) => items.push({ level, text, how });
  if (project.template !== 'reportagem') return { score: 100, verdict: '', seconds: 0, items };

  const portrait = (project.aspect ?? '9:16') !== '16:9';
  const frame = project.aspect === '16:9' ? 16 / 9 : project.aspect === '1:1' ? 1 : 9 / 16;
  let total = 0;
  let sceneriesTotal = 0;
  let narrated = 0;
  let faceScenes = 0;

  project.scenes.forEach((s, i) => {
    if (s.kind === 'clip') {
      total += 8; // cena real: duração do ficheiro (estimativa)
      return;
    }
    narrated++;
    const words = String(s.narration ?? '').split(/\s+/).filter(Boolean).length;
    const secs = Math.max(2, words / WORDS_PER_SECOND);
    total += secs;
    const label = `Cena ${i + 1}`;
    const list = s.cutaways ?? [];
    sceneriesTotal += list.length;
    const hasFace = Boolean(s.presenter) && recorded[i];
    if (hasFace) faceScenes++;
    const wanted = Math.max(1, Math.round(secs / SECONDS_PER_SCENERY));

    if (list.length === 0 && !hasFace) {
      add('falta', `${label} (~${Math.round(secs)} s) não tem nenhum cenário: fica só com o fundo liso.`, `Junte pelo menos ${wanted} imagens ou vídeos (um a cada ${SECONDS_PER_SCENERY} s).`);
    } else if (list.length > 0 && list.length < wanted && !hasFace) {
      add('melhorar', `${label} (~${Math.round(secs)} s) tem ${list.length} cenário(s); o ideal são ~${wanted}.`, `Junte mais ${wanted - list.length} para o vídeo não parecer parado.`);
    }
    const posters = list.filter((c) => c.fit === 'contain' || (c.fit === undefined && project.imageFit === 'contain')).length;
    if (posters > 0 && secs / list.length < 3) {
      add('melhorar', `${label}: ${posters} cartaz(es) aparecem só ~${(secs / list.length).toFixed(1)} s, pouco para ler o texto.`, `Deixe no máximo ${Math.max(1, Math.floor(secs / 3))} cenários nesta cena.`);
    }
    for (const c of list) {
      const f = join(projectDir, c.media);
      const d = dims(f);
      if (!d) {
        add('falta', `${label}: o ficheiro "${c.media.split('/').pop()}" não foi encontrado.`, 'Carregue-o de novo ou remova o cenário.');
        continue;
      }
      if (Math.min(d.w, d.h) < 700) add('melhorar', `${label}: "${c.media.split('/').pop()}" é pequena (${d.w}×${d.h}) e pode ficar desfocada.`, 'Use uma imagem com pelo menos 1080 px de largura.');
      const cover = c.fit === 'cover' || (c.fit === undefined && project.imageFit !== 'contain');
      if (cover && isImage(c.media) && Math.abs(Math.log((d.w / d.h) / frame)) > Math.log(1.7)) {
        add('melhorar', `${label}: "${c.media.split('/').pop()}" tem formato muito diferente do vídeo e vai ser cortada.`, 'Se tem texto, marque "Cartaz (inteira)" ou use "Imagens inteiras" no topo.');
      }
    }
  });

  const synthetic = recorded.filter((r, i) => !r && project.scenes[i]?.kind !== 'clip').length;
  if (narrated > 0 && synthetic === narrated) add('melhorar', 'Todas as cenas usam voz sintética.', 'Grave a sua voz (📱 Gravar no telemóvel): a voz humana dá confiança e qualidade.');
  else if (synthetic > 0) add('melhorar', `${synthetic} cena(s) ainda com voz sintética, misturada com a sua.`, 'Grave também essas cenas para o vídeo ter a mesma voz do início ao fim.');

  if (!project.avatar && faceScenes === 0) add('melhorar', 'O vídeo não mostra o seu rosto.', 'Carregue a sua foto (Mais opções do vídeo) ou grave o rosto: as pessoas ligam-se mais a quem veem.');
  if ((project.avatarFocus?.zoom ?? 1) > 1.8) add('melhorar', 'A foto está muito aproximada: o rosto pode sair cortado.', 'Baixe o cursor "Aproximar" em Mais opções do vídeo.');
  if (!project.music) add('melhorar', 'Sem música de fundo.', 'Junte uma música livre (bloco Música): o vídeo fica mais envolvente.');
  if (!project.style || !(project.style.look && project.style.look !== 'natural')) add('melhorar', 'Ainda sem acabamento (cor, transições, vinheta).', 'Abra "✨ Acabamento" e carregue em "Aspeto profissional".');
  if (project.captions === false) add('melhorar', 'As legendas estão desligadas.', 'A maioria vê sem som: ligue as legendas.');

  const seconds = Math.round(total);
  if (narrated > 0 && seconds < 20) add('melhorar', `O vídeo tem só ~${seconds} s.`, 'Entre 30 e 60 s funciona melhor nas redes: acrescente uma cena.');
  if (seconds > 90) add('melhorar', `O vídeo tem ~${seconds} s: é longo para redes.`, 'Corte texto ou divida em dois vídeos.');
  if (narrated > 0 && sceneriesTotal === 0 && faceScenes === 0) add('falta', 'Nenhuma cena tem imagens nem vídeos.', 'Junte cenários: sem eles o vídeo é só texto sobre fundo liso.');

  const falta = items.filter((x) => x.level === 'falta').length;
  const melhorar = items.filter((x) => x.level === 'melhorar').length;
  const score = Math.max(10, 100 - falta * 14 - melhorar * 6);
  if (!items.length) add('ok', 'Tudo no sítio: o vídeo tem tudo o que é preciso para boa qualidade.');
  const verdict = score >= 90 ? 'Excelente' : score >= 75 ? 'Bom' : score >= 55 ? 'Pode melhorar' : 'Faltam coisas importantes';
  return { score, verdict, seconds, items };
}
