// Campanhas: um "preset" (engine/campaigns/<id>.json) descreve o vídeo todo — cenas, locução, textos no ecrã e os planos
// a procurar no Pexels — e este comando monta o projeto a partir dele. Reutilizável para futuras campanhas.
//
//   npm run campaign -- search <preset>        procura candidatos no Pexels e gera folhas numeradas para ESCOLHER à vista
//   npm run campaign -- build  <preset>        descarrega as escolhas (picks.json), cria o projeto, gera a voz e sincroniza os textos
//
// As escolhas ficam em projects/<id>/campaign/picks.json: { "<cena>": [ { "pick": 3, "from": 1.5 }, ... ] }
// (pick = número na folha do plano, ou "cena#plano:n" para um vídeo da folha de outro plano; from = segundo do vídeo onde começar, opcional).

import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanNarration } from '../lib/social/tts';
import { contactSheet, download, searchVideos, type Candidate } from './pexels';
import { run } from './ffmpeg';
import type { Overlay, Project } from './types';

interface Shot {
  atWord: number;
  queries?: string[];
  avoid?: string[];
  /** imagem/vídeo teu, já dentro do projeto (ex.: media/cartaz.png): não se procura no Pexels */
  media?: string;
  fit?: 'cover' | 'contain';
  startFrom?: number;
}
interface Text { text: string; when: string; until?: string; offset?: number; y?: number; size?: number; style?: Overlay['style']; anim?: Overlay['anim'] }
interface PresetScene { id: string; narration: string; shots: Shot[]; texts: Text[]; /** fundo gráfico (sem vídeo): gradiente entre duas cores */ background?: { gradient: [string, string] } }
interface Preset {
  id: string;
  title: string;
  brand: Record<string, unknown> & { id: string };
  project: Partial<Project>;
  scenes: PresetScene[];
}
type Pick = { pick: number | string; from?: number };

const [cmd, presetArg] = process.argv.slice(2);
if (!cmd || !presetArg) {
  console.log('uso: npm run campaign -- search|build <preset>   (preset = id em engine/campaigns/)');
  process.exit(1);
}
const presetFile = presetArg.endsWith('.json') ? presetArg : join('engine', 'campaigns', `${presetArg}.json`);
const preset = JSON.parse(readFileSync(presetFile, 'utf8')) as Preset;
const dir = join('projects', preset.id);
const campDir = join(dir, 'campaign');
const key = (scene: string, k: number) => `${scene}#${k}`;

// ── 1. procurar e mostrar ─────────────────────────────────────────────────
async function search(): Promise<void> {
  mkdirSync(campDir, { recursive: true });
  const candFile = join(campDir, 'candidates.json');
  const all: Record<string, Candidate[]> = existsSync(candFile) ? JSON.parse(readFileSync(candFile, 'utf8')) : {};
  const used = new Set<number>(); // não repetir o mesmo vídeo em planos diferentes (nem de outros projetos)
  for (const d of readdirSync('projects', { withFileTypes: true })) {
    if (!d.isDirectory() || d.name === preset.id) continue;
    try {
      const other = JSON.parse(readFileSync(join('projects', d.name, 'project.json'), 'utf8')) as Project;
      for (const c of other.credits ?? []) for (const m of c.matchAll(/-(\d+)\/?(?:\s|$)/g)) used.add(Number(m[1]));
    } catch { /* projeto sem ficheiro */ }
  }
  for (const s of preset.scenes) {
    for (const [k, shot] of s.shots.entries()) {
      if (shot.media || !shot.queries) continue;
      const id = key(s.id, k);
      let cands = all[id];
      if (!cands) {
        cands = (await searchVideos(shot.queries, { avoid: shot.avoid })).filter((c) => !used.has(c.id)).slice(0, 12);
        all[id] = cands;
        contactSheet(cands, join(campDir, `${s.id}-${k}.jpg`), join(campDir, 'tmp', id.replace('#', '-')));
      }
      cands.slice(0, 3).forEach((c) => used.add(c.id));
      console.log(`${id}: ${cands.length} candidatos → ${join(campDir, `${s.id}-${k}.jpg`)}`);
      cands.forEach((c, i) => console.log(`   ${i + 1}. #${c.id} ${c.duration ?? '?'}s ${c.width}×${c.height} pts ${c.score.toFixed(1)}  ${c.url.replace('https://www.pexels.com/', '')}`));
    }
  }
  writeFileSync(candFile, JSON.stringify(all, null, 1));
  console.log('\nVeja as folhas numeradas e escreva as escolhas em', join(campDir, 'picks.json'));
}

// ── 2. montar o projeto ───────────────────────────────────────────────────
const norm = (w: string) => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

async function build(): Promise<void> {
  const picksFile = join(campDir, 'picks.json');
  const candFile = join(campDir, 'candidates.json');
  if (!existsSync(picksFile) || !existsSync(candFile)) throw new Error('faltam as escolhas: corra "search" e escreva picks.json');
  const picks = JSON.parse(readFileSync(picksFile, 'utf8')) as Record<string, Pick[]>;
  const cands = JSON.parse(readFileSync(candFile, 'utf8')) as Record<string, Candidate[]>;

  // marca da campanha
  mkdirSync(join('projects', 'brands'), { recursive: true });
  writeFileSync(join('projects', 'brands', `${preset.brand.id}.json`), JSON.stringify(preset.brand, null, 2) + '\n');

  mkdirSync(join(dir, 'media'), { recursive: true });
  const credits: string[] = [];
  const scenes = preset.scenes.map((s) => {
    const cutaways = s.shots.flatMap((shot, k) => {
      if (shot.media) return [{ media: shot.media, atWord: shot.atWord, ...(shot.fit ? { fit: shot.fit } : {}), ...(shot.startFrom ? { startFrom: shot.startFrom } : {}) }];
      const p = picks[s.id]?.[k];
      // pick: número na folha deste plano, ou "cena#plano:n" para usar um vídeo da folha de outro plano
      const ref = p ? (typeof p.pick === 'number' ? { k: key(s.id, k), n: p.pick } : { k: p.pick.split(':')[0], n: Number(p.pick.split(':')[1]) }) : undefined;
      const c = ref ? cands[ref.k]?.[ref.n - 1] : undefined;
      if (!c) { console.log(`  ⚠ ${s.id} plano ${k + 1}: sem escolha — ficou sem vídeo`); return []; }
      const rel = `media/${s.id}-${k + 1}-pexels-${c.id}.mp4`;
      if (!download(c.link, join(dir, rel))) { console.log(`  ⚠ ${s.id} plano ${k + 1}: o descarregamento falhou`); return []; }
      credits.push(`Vídeo: ${c.author} (Pexels) ${c.url}`);
      return [{ media: rel, atWord: shot.atWord, ...(p.from ? { startFrom: p.from } : {}) }];
    });
    // Ecrã gráfico: um gradiente vibrante em vez de vídeo (ex.: o ecrã com a data, hora e local).
    if (s.background) {
      const rel = `media/bg-${s.id}.png`;
      const [c0, c1] = s.background.gradient.map((c) => c.replace('#', '0x'));
      run(['-f', 'lavfi', '-i', `gradients=s=1080x1920:c0=${c0}:c1=${c1}:x0=0:y0=0:x1=700:y1=1920:n=2:d=1`, '-frames:v', '1', join(dir, rel)]);
      cutaways.push({ media: rel, atWord: 0 });
    }
    return { id: s.id, narration: s.narration, ...(cutaways.length ? { cutaways } : {}) };
  });

  // não perder o que se juntou à mão (música…) se o projeto já existe
  const file = join(dir, 'project.json');
  let keep: Partial<Project> = {};
  if (existsSync(file)) {
    const old = JSON.parse(readFileSync(file, 'utf8')) as Project;
    copyFileSync(file, join(campDir, `project.${Date.now()}.bak.json`));
    keep = { music: old.music, audio: old.audio };
  }
  const project: Project = {
    ...(preset.project as Project),
    id: preset.id,
    brand: preset.brand.id,
    title: preset.title,
    scenes,
    credits: [...new Set(credits)],
    overlays: [],
    ...(keep.music ? { music: keep.music } : {}),
    ...(keep.audio ? { audio: keep.audio } : {}),
  };
  writeFileSync(file, JSON.stringify(project, null, 2) + '\n');
  console.log(`✓ projeto ${file} (${scenes.length} cenas, ${credits.length} vídeos)`);

  // voz e tempos: depois sincronizam-se os textos com as palavras
  const r = spawnSync('npx', ['tsx', 'engine/cli.ts', 'build', preset.id, '--no-render'], { stdio: 'inherit', shell: true });
  if (r.status !== 0) throw new Error('a geração da voz falhou');
  placeTexts(project);
  writeFileSync(file, JSON.stringify(project, null, 2) + '\n');
  console.log('✓ textos sincronizados com a voz. Agora: npx tsx engine/cli.ts build ' + preset.id + ' --draft');
}

/** Põe cada texto no instante exato em que se diz a palavra indicada (tempos reais da voz). */
function placeTexts(project: Project): void {
  const props = JSON.parse(readFileSync(join('video3d', 'props', `${project.id}.json`), 'utf8')) as {
    lines: { words: { text: string; start: number; end: number }[] }[];
    audioStarts: number[];
    sceneDurations: number[];
  };
  const flat = props.lines.flatMap((l) => l.words);
  let offset = 0;
  const overlays: Overlay[] = [];
  project.scenes.forEach((s, i) => {
    const n = cleanNarration(s.narration).split(/\s+/).filter(Boolean).length;
    const ws = flat.slice(offset, offset + n);
    offset += n;
    const a0 = props.audioStarts[i];
    const end = (props.sceneDurations[i] ?? 3) + 0.25;
    const find = (spec: string, from = 0): number => {
      if (/^\d+$/.test(spec)) return Math.min(Number(spec), ws.length - 1);
      const [tok, nth] = spec.split('#');
      let seen = 0;
      for (let j = 0; j < ws.length; j++) {
        if (norm(ws[j].text) === norm(tok) && ++seen >= Number(nth ?? 1) && j >= from) return j;
      }
      throw new Error(`cena "${s.id}": não achei a palavra "${spec}" na narração`);
    };
    const texts = preset.scenes.find((x) => x.id === s.id)?.texts ?? [];
    for (const t of texts) {
      const w = find(t.when);
      const at = Math.max(0, ws[w].start - a0 + (t.offset ?? 0) - 0.05);
      const to = !t.until || t.until === 'end' ? end : ws[find(t.until, w)].end - a0 + 0.1;
      overlays.push({ kind: 'text', scene: s.id, at: Math.round(at * 10) / 10, seconds: Math.max(0.8, Math.round((to - at) * 10) / 10), text: t.text, x: 50, y: t.y ?? 28, size: t.size ?? 1, style: t.style ?? 'destaque', anim: t.anim ?? 'pop' });
    }
  });
  project.overlays = overlays;
}

(cmd === 'search' ? search() : cmd === 'build' ? build() : Promise.reject(new Error('comando desconhecido: ' + cmd))).catch((e) => {
  console.error('✗', e.message);
  process.exit(1);
});
