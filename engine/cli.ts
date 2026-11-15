// Motor de vídeo — linha de comandos.
//
//   npm run engine -- list
//   npm run engine -- check  <projeto>            valida + verifica afirmações
//   npm run engine -- sheet  <projeto>            gera a folha de gravação (voz humana)
//   npm run engine -- build  <projeto> [opções]   voz → linha do tempo → props → render
//
// Opções do build:
//   --draft              render a meia resolução, 1 processo (máquinas fracas)
//   --no-render          só voz + props + pacote de publicação
//   --voice=auto|human|synthetic   sobrepõe o modo de voz do projeto
//   --version=<nome>     gera uma versão (rosto, foto, voz, horizontal, ou as do projeto): ficheiros <id>--<nome>
//
// <projeto> é o id de projects/<id>/project.json ou um caminho para o JSON.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { lintProject } from './claims';
import { writePublishPack } from './publish-pack';
import { planRender, renderVideo } from './render';
import { buildTimeline } from './timeline';
import { findHumanFile, voiceScene, type SceneAudio } from './voice';
import { TEMPLATES } from './templates';
import { applyVersion, listVersions } from './versions';
import { validateBrand, validateProject, type Brand, type Issue, type Project, type VoiceMode } from './types';

const ROOT = 'projects';

const args = process.argv.slice(2);
const cmd = args[0];
const target = args[1];
const flag = (n: string) => args.includes(`--${n}`);
const opt = (n: string) => args.find((a) => a.startsWith(`--${n}=`))?.split('=')[1];

function load<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

function locate(id: string): { file: string; dir: string } {
  const file = id.endsWith('.json') ? resolve(id) : join(ROOT, id, 'project.json');
  if (!existsSync(file)) throw new Error(`projeto não encontrado: ${file}`);
  return { file, dir: dirname(file) };
}

function show(issues: Issue[]): boolean {
  for (const i of issues) {
    console.log(`  ${i.level === 'error' ? '✗' : '⚠'} ${i.scene ? `[${i.scene}] ` : ''}${i.message}`);
  }
  return issues.some((i) => i.level === 'error');
}

function open(idOrPath: string): { project: Project; brand: Brand; dir: string } {
  const { file, dir } = locate(idOrPath);
  const project = load<Project>(file);
  const pIssues = validateProject(project);
  if (show(pIssues)) throw new Error('projeto inválido');
  const brandFile = join(ROOT, 'brands', `${project.brand}.json`);
  if (!existsSync(brandFile)) throw new Error(`marca não encontrada: ${brandFile}`);
  const brand = load<Brand>(brandFile);
  if (show(validateBrand(brand))) throw new Error('marca inválida');
  return { project, brand, dir };
}

function list(): void {
  if (!existsSync(ROOT)) return console.log('(sem projetos)');
  for (const d of readdirSync(ROOT, { withFileTypes: true })) {
    if (!d.isDirectory() || d.name === 'brands') continue;
    const f = join(ROOT, d.name, 'project.json');
    if (!existsSync(f)) continue;
    const p = load<Project>(f);
    console.log(`  ${p.id.padEnd(28)} ${p.template.padEnd(14)} ${p.brand.padEnd(10)} ${p.title}`);
  }
}

function check(id: string): boolean {
  const { project, brand } = open(id);
  console.log(`\n▶ check ${project.id} (${project.template}, marca ${brand.id})`);
  const issues = lintProject(project, brand);
  const bad = show(issues);
  if (!issues.length) console.log('  ✓ sem problemas');
  return !bad;
}

/** Folha de gravação: o que cada pessoa tem de ler, por cena, com o nome do ficheiro. */
function sheet(id: string): void {
  const { project, brand, dir } = open(id);
  const wps = 2.6; // palavras por segundo, leitura calma
  const lines: string[] = [
    `# Folha de gravação — ${project.title}`,
    '',
    `Marca: **${brand.name}** · idioma: **${brand.locale}**`,
    '',
    'Como gravar: sítio silencioso, telemóvel a ~20 cm da boca, ritmo calmo.',
    'Uma gravação por cena. Guarde na pasta `voice/` com o nome indicado (wav, m4a ou mp3).',
    'Pode regravar uma cena sem mexer nas outras.',
    '',
  ];
  project.scenes.forEach((s, i) => {
    const words = s.narration.split(/\s+/).filter(Boolean).length;
    const have = findHumanFile(dir, s);
    lines.push(
      `## ${String(i + 1).padStart(2, '0')} · ${s.id} ${have ? '✅ gravada' : '⬜ por gravar'}`,
      '',
      s.presenter || project.template === 'reportagem'
        ?`Grave em VÍDEO (pessoa a falar para a câmara, plano fixo, boa luz) e carregue no estúdio em "Carregar vídeo"${s.presenter ? `: \`${s.presenter}\`` : ''}${s.voice ? ` · apresentador: ${s.voice}` : ''} · ≈ ${Math.max(1, Math.round(words / wps))} s`
        : `Ficheiro: \`voice/${s.id}.wav\`${s.voice ? ` · voz: ${s.voice}` : ''} · ≈ ${Math.max(1, Math.round(words / wps))} s`,
      '',
      ...(s.location ? [`Local: **${s.location}**`] : []),
      ...(s.shot ? [`Nota de gravação: ${s.shot}`] : []),
      '',
      `> ${s.narration.trim()}`,
      '',
    );
  });
  mkdirSync(join(dir, 'voice'), { recursive: true });
  const out = join(dir, 'FOLHA-DE-GRAVACAO.md');
  writeFileSync(out, lines.join('\n'));
  console.log(`✓ ${out}`);
}

async function build(id: string): Promise<void> {
  const { project: base, brand, dir } = open(id);
  // Uma versão é o mesmo projeto com alterações (ver versions.ts); o id ganha o sufixo "--<versão>"
  // e por isso as props, o áudio e os ficheiros de saída ficam separados. A cache da voz é partilhada.
  const version = opt('version');
  const project = applyVersion(base, version);
  const draft = flag('draft');
  console.log(`\n▶ build ${project.id} — ${project.template}${version ? ` (versão ${version})` : ''}${draft ? ' (rascunho)' : ''}`);

  const issues = lintProject(project, brand);
  if (show(issues)) throw new Error('o roteiro viola as regras da marca — corrija antes de gerar');
  if (project.template === 'institucional' && !project.approval && !draft && !flag('no-render')) {
    throw new Error('vídeo institucional sem "approval": preencha quem autorizou o conteúdo (ou use --draft / --no-render)');
  }

  const mode = (opt('voice') as VoiceMode | undefined) ?? project.voice?.mode ?? 'auto';
  const cacheDir = join('.engine-cache', base.id);
  const def = TEMPLATES[project.template];
  const ctx = { project, projectDir: dir, cacheDir, locale: project.locale ?? brand.locale, mode };

  const audios: SceneAudio[] = [];
  for (const scene of project.scenes) {
    const a = await voiceScene(ctx, scene);
    audios.push(a);
    console.log(`  ✓ ${scene.id.padEnd(22)} ${a.source.padEnd(10)} ${a.duration.toFixed(1)}s${a.cached ? ' (cache)' : ''}`);
  }

  const audioRel = `audio/${project.id}.mp3`;
  mkdirSync('video3d/public/audio', { recursive: true });
  const tl = buildTimeline(audios, {
    lead: project.lead ?? def.lead,
    pause: project.voice?.pauseSeconds ?? 0.3,
    cacheDir,
    outMp3: join('video3d/public', audioRel),
  });

  const plan = planRender(project, brand, tl, audioRel, dir, audios);
  for (const w of plan.warnings) console.log(`  ⚠ ${w}`);
  const pack = writePublishPack(join('video3d/out', project.id), project, brand, plan.lines, tl.sceneStarts);
  console.log(`  ✓ ${tl.voiceSeconds.toFixed(1)}s de voz, ${tl.words.length} palavras, ${plan.lines.length} legendas`);
  console.log(`  ✓ pacote de publicação: video3d/out/${project.id}/ (${pack.join(', ')})`);

  if (flag('no-render')) {
    mkdirSync('video3d/props', { recursive: true });
    writeFileSync(`video3d/props/${project.id}.json`, JSON.stringify(plan.props, null, 2));
    console.log(`  ✓ props: video3d/props/${project.id}.json (sem render)`);
    return;
  }
  const out = renderVideo(project, plan, { draft });
  console.log(`  ✓ vídeo: ${out}`);
}

async function main(): Promise<void> {
  if (cmd === 'list') return list();
  if (!target) throw new Error('uso: engine <list|check|sheet|build> <projeto>');
  if (cmd === 'check') {
    if (!check(target)) process.exit(1);
    return;
  }
  if (cmd === 'sheet') return sheet(target);
  if (cmd === 'build') return build(target);
  throw new Error(`comando desconhecido: ${cmd}`);
}

main().catch((e) => {
  console.error(`\n✗ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
