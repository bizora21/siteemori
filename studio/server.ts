// Estúdio local do motor de vídeo.   npm run studio   →   http://127.0.0.1:4173
//
// Sem dependências novas: http do Node + o próprio motor (engine/). O build é
// feito pela MESMA CLI de sempre num processo filho — o dashboard não tem um
// caminho de render paralelo, por isso o 3D sai com a qualidade de sempre.
//
// Segurança: só escuta em 127.0.0.1 (guarda chaves de API e voz de pessoas),
// valida o cabeçalho Host (contra DNS rebinding) e a Origin nos pedidos que
// alteram dados. Ids só aceitam [a-z0-9-] (sem path traversal).

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { lintProject } from '../engine/claims';
import { FFMPEG } from '../engine/ffmpeg';
import { TEMPLATES } from '../engine/templates';
import { validateBrand, validateProject, type Brand, type Issue, type Project } from '../engine/types';
import { findHumanFile } from '../engine/voice';

const PORT = Number(process.env.STUDIO_PORT ?? 4173);
const HOST = '127.0.0.1';
const ROOT = resolve('projects');
const OUT = resolve('video3d/out');
const PUBLIC = resolve('studio/public');
const ID_RE = /^[a-z0-9][a-z0-9-]*$/;
const MAX_UPLOAD = 300 * 1024 * 1024;

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.srt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

// ── utilitários ──────────────────────────────────────────────────────────
class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const json = (res: ServerResponse, data: unknown, status = 200) => {
  res.writeHead(status, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
};

function readBody(req: IncomingMessage, limit = 2 * 1024 * 1024): Promise<Buffer> {
  return new Promise((ok, fail) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > limit) {
        fail(new HttpError(413, 'ficheiro demasiado grande'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => ok(Buffer.concat(chunks)));
    req.on('error', fail);
  });
}

const needId = (v: string | undefined): string => {
  if (!v || !ID_RE.test(v)) throw new HttpError(400, 'id inválido');
  return v;
};

const projectDir = (id: string) => join(ROOT, id);
const projectFile = (id: string) => join(projectDir(id), 'project.json');

function loadProject(id: string): Project {
  if (!existsSync(projectFile(id))) throw new HttpError(404, 'projeto não encontrado');
  return JSON.parse(readFileSync(projectFile(id), 'utf8')) as Project;
}

function loadBrands(): Brand[] {
  const dir = join(ROOT, 'brands');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as Brand);
}

/** Serve um ficheiro com suporte a Range (o <video> precisa para avançar/recuar). */
function sendFile(req: IncomingMessage, res: ServerResponse, file: string): void {
  if (!existsSync(file) || !statSync(file).isFile()) throw new HttpError(404, 'não encontrado');
  const size = statSync(file).size;
  const type = MIME[extname(file).toLowerCase()] ?? 'application/octet-stream';
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? '');
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
    createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
  createReadStream(file).pipe(res);
}

/** Só devolve caminhos dentro de `base` (defesa contra ../). */
function inside(base: string, ...parts: string[]): string {
  const p = normalize(join(base, ...parts));
  if (p !== base && !p.startsWith(base + sep)) throw new HttpError(400, 'caminho inválido');
  return p;
}

// ── estado de um projeto ─────────────────────────────────────────────────
function summarize(id: string) {
  const p = loadProject(id);
  const dir = projectDir(id);
  const recorded = p.scenes.filter((s) => findHumanFile(dir, s)).length;
  const outs = existsSync(OUT) ? readdirSync(OUT).filter((f) => f.startsWith(id) && f.endsWith('.mp4')) : [];
  return { id, title: p.title, template: p.template, brand: p.brand, scenes: p.scenes.length, recorded, hasDraft: outs.includes(`${id}-rascunho.mp4`), hasFinal: outs.includes(`${id}.mp4`) };
}

function detail(id: string) {
  const project = loadProject(id);
  const dir = projectDir(id);
  const brand = loadBrands().find((b) => b.id === project.brand);
  const issues: Issue[] = [...validateProject(project)];
  if (brand) issues.push(...lintProject(project, brand));
  else issues.push({ level: 'error', message: `marca "${project.brand}" não existe em projects/brands/` });
  const scenes = project.scenes.map((s) => {
    const f = findHumanFile(dir, s);
    return { id: s.id, recorded: Boolean(f), kind: f ? (extname(f).toLowerCase() === '.mp4' ? 'video' : 'audio') : null };
  });
  const files: string[] = [];
  const packDir = join(OUT, id);
  if (existsSync(packDir)) files.push(...readdirSync(packDir).map((f) => `${id}/${f}`));
  for (const n of [`${id}.mp4`, `${id}-rascunho.mp4`]) if (existsSync(join(OUT, n))) files.push(n);
  return { project, brand, issues, scenes, files };
}

// ── gravações ────────────────────────────────────────────────────────────
const EXTS = ['wav', 'm4a', 'mp3', 'ogg', 'aac', 'flac'];

function ffmpegConvert(input: string, args: string[], out: string): void {
  const r = spawnSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', input, ...args, out], { encoding: 'utf8' });
  if (r.status !== 0) throw new HttpError(422, `não consegui converter a gravação: ${(r.stderr ?? '').slice(-300)}`);
}

async function saveRecording(req: IncomingMessage, id: string, sceneId: string, kind: 'audio' | 'video'): Promise<void> {
  const project = loadProject(id);
  const scene = project.scenes.find((s) => s.id === sceneId);
  if (!scene) throw new HttpError(404, 'cena não encontrada');
  const body = await readBody(req, MAX_UPLOAD);
  if (body.length < 1000) throw new HttpError(400, 'gravação vazia');
  const dir = projectDir(id);
  const tmp = join(dir, `.upload-${Date.now()}.webm`);
  writeFileSync(tmp, body);
  try {
    if (kind === 'audio') {
      mkdirSync(join(dir, 'voice'), { recursive: true });
      for (const e of EXTS) rmSync(join(dir, 'voice', `${sceneId}.${e}`), { force: true });
      ffmpegConvert(tmp, ['-vn', '-ar', '44100', '-ac', '1', '-c:a', 'pcm_s16le'], join(dir, 'voice', `${sceneId}.wav`));
    } else {
      mkdirSync(join(dir, 'presenter'), { recursive: true });
      ffmpegConvert(tmp, ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '160k'], join(dir, 'presenter', `${sceneId}.mp4`));
      scene.presenter = `presenter/${sceneId}.mp4`;
      writeFileSync(projectFile(id), JSON.stringify(project, null, 2) + '\n');
    }
  } finally {
    rmSync(tmp, { force: true });
  }
}

// ── fila de trabalhos (um de cada vez: a máquina é fraca) ─────────────────
interface Job {
  id: number;
  project: string;
  args: string[];
  label: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  log: string[];
  progress: string;
  listeners: Set<ServerResponse>;
}
const jobs: Job[] = [];
let running = false;
const ANSI = /\x1b\[[0-9;]*m/g;

function emit(job: Job, type: string, data: string) {
  for (const l of job.listeners) l.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
}

function pump() {
  if (running) return;
  const job = jobs.find((j) => j.status === 'queued');
  if (!job) return;
  running = true;
  job.status = 'running';
  emit(job, 'status', job.status);
  // O id foi validado ([a-z0-9-]); as opções vêm de uma lista fixa.
  const child = spawn('npx', ['tsx', 'engine/cli.ts', 'build', job.project, ...job.args], { shell: true, env: process.env });
  const feed = (buf: Buffer) => {
    for (const raw of buf.toString().split(/\r?\n|\r/)) {
      const line = raw.replace(ANSI, '').trim();
      if (!line || line.startsWith('(node:') || line.includes('DeprecationWarning') || line.startsWith('(Use `node')) continue;
      if (/^(Rendered|Stitched|Bundling|Compositing)\b/.test(line)) {
        job.progress = line;
        emit(job, 'progress', line);
      } else {
        job.log.push(line);
        emit(job, 'log', line);
      }
    }
  };
  child.stdout.on('data', feed);
  child.stderr.on('data', feed);
  child.on('close', (code) => {
    job.status = code === 0 ? 'done' : 'failed';
    emit(job, 'status', job.status);
    for (const l of job.listeners) l.end();
    job.listeners.clear();
    running = false;
    pump();
  });
}

function enqueue(project: string, opts: { draft?: boolean; noRender?: boolean; voice?: string }): Job {
  const args: string[] = [];
  if (opts.draft) args.push('--draft');
  if (opts.noRender) args.push('--no-render');
  if (opts.voice && ['auto', 'human', 'synthetic'].includes(opts.voice)) args.push(`--voice=${opts.voice}`);
  const label = opts.noRender ? 'voz + props' : opts.draft ? 'rascunho' : 'final';
  const job: Job = { id: jobs.length + 1, project, args, label, status: 'queued', log: [], progress: '', listeners: new Set() };
  jobs.push(job);
  pump();
  return job;
}

// ── rotas ────────────────────────────────────────────────────────────────
async function route(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', `http://${HOST}:${PORT}`);
  const parts = url.pathname.split('/').filter(Boolean);
  const method = req.method ?? 'GET';

  // Defesa contra DNS rebinding e pedidos de outros sites.
  const host = req.headers.host ?? '';
  if (host !== `${HOST}:${PORT}` && host !== `localhost:${PORT}`) throw new HttpError(403, 'host não permitido');
  if (method !== 'GET' && req.headers.origin && req.headers.origin !== `http://${host}`) throw new HttpError(403, 'origem não permitida');

  if (parts[0] !== 'api' && parts[0] !== 'media') {
    const rel = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    return sendFile(req, res, inside(PUBLIC, rel));
  }

  if (parts[0] === 'media') return sendFile(req, res, inside(OUT, ...parts.slice(1)));

  // /api/state
  if (parts[1] === 'state' && method === 'GET') {
    const ids = existsSync(ROOT) ? readdirSync(ROOT, { withFileTypes: true }).filter((d) => d.isDirectory() && d.name !== 'brands' && existsSync(projectFile(d.name))).map((d) => d.name) : [];
    return json(res, {
      templates: Object.values(TEMPLATES),
      brands: loadBrands().map((b) => ({ id: b.id, name: b.name, locale: b.locale })),
      projects: ids.map(summarize),
    });
  }

  // /api/jobs, /api/jobs/:n/events
  if (parts[1] === 'jobs') {
    if (!parts[2]) return json(res, jobs.map(({ listeners: _l, log: _g, ...j }) => j));
    const job = jobs.find((j) => j.id === Number(parts[2]));
    if (!job) throw new HttpError(404, 'trabalho não encontrado');
    if (parts[3] === 'events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
      res.write(`event: status\ndata: ${JSON.stringify(job.status)}\n\n`);
      for (const l of job.log) res.write(`event: log\ndata: ${JSON.stringify(l)}\n\n`);
      if (job.progress) res.write(`event: progress\ndata: ${JSON.stringify(job.progress)}\n\n`);
      if (job.status === 'done' || job.status === 'failed') return void res.end();
      job.listeners.add(res);
      req.on('close', () => job.listeners.delete(res));
      return;
    }
    return json(res, { id: job.id, status: job.status, log: job.log, progress: job.progress });
  }

  // POST /api/projects  (criar a partir de um template)
  if (parts[1] === 'projects' && !parts[2] && method === 'POST') {
    const b = JSON.parse((await readBody(req)).toString() || '{}') as { id?: string; brand?: string; template?: keyof typeof TEMPLATES; title?: string };
    const id = needId(b.id);
    if (existsSync(projectFile(id))) throw new HttpError(409, 'já existe um projeto com esse id');
    const def = b.template ? TEMPLATES[b.template] : undefined;
    if (!def) throw new HttpError(400, 'template inválido');
    if (!loadBrands().some((x) => x.id === b.brand)) throw new HttpError(400, 'marca inválida');
    const roles = def.sceneRoles ?? (def.id === 'verse3d' ? ['narracao'] : def.id === 'reportagem' ? ['abertura', 'local-1', 'local-2', 'fecho'] : ['abertura', 'desenvolvimento', 'fecho']);
    const project: Project = {
      id,
      brand: b.brand!,
      template: def.id,
      title: b.title?.trim() || id,
      voice: { mode: 'auto' },
      scenes: roles.map((r) => ({ id: r.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase().replace(/^-|-$/g, ''), narration: 'Escreva aqui a narração desta cena.', title: def.id === 'institucional' ? r : undefined })),
      ...(def.id === 'institucional' ? { institutional: { entity: 'Nome da Entidade', disclaimer: '' }, aspect: '16:9' as const } : {}),
      ...(def.id === 'reportagem' ? { host: { name: 'Seu nome', role: '' }, aspect: '9:16' as const } : {}),
      ...(def.id === 'verse3d' ? { props: { title: ['LINHA 1', 'LINHA 2'] } } : {}),
    };
    mkdirSync(projectDir(id), { recursive: true });
    writeFileSync(projectFile(id), JSON.stringify(project, null, 2) + '\n');
    return json(res, { id }, 201);
  }

  if (parts[1] === 'projects' && parts[2]) {
    const id = needId(parts[2]);
    const sub = parts[3];

    if (!sub && method === 'GET') return json(res, detail(id));

    if (!sub && method === 'PUT') {
      const p = JSON.parse((await readBody(req)).toString()) as Project;
      if (p.id !== id) throw new HttpError(400, 'o id não pode mudar');
      const errs = validateProject(p).filter((i) => i.level === 'error');
      if (errs.length) return json(res, { ok: false, issues: errs }, 422);
      writeFileSync(projectFile(id), JSON.stringify(p, null, 2) + '\n');
      return json(res, { ok: true });
    }

    if (sub === 'build' && method === 'POST') {
      const b = JSON.parse((await readBody(req)).toString() || '{}') as { draft?: boolean; noRender?: boolean; voice?: string };
      loadProject(id);
      if (jobs.some((j) => j.project === id && (j.status === 'queued' || j.status === 'running'))) throw new HttpError(409, 'este projeto já tem um trabalho na fila');
      const job = enqueue(id, b);
      return json(res, { job: job.id }, 202);
    }

    if ((sub === 'voice' || sub === 'presenter') && parts[4]) {
      const scene = needId(parts[4]);
      if (method === 'POST') {
        await saveRecording(req, id, scene, sub === 'voice' ? 'audio' : 'video');
        return json(res, { ok: true });
      }
      if (method === 'GET') {
        const project = loadProject(id);
        const s = project.scenes.find((x) => x.id === scene);
        const f = s ? findHumanFile(projectDir(id), s) : null;
        if (!f) throw new HttpError(404, 'sem gravação');
        return sendFile(req, res, f);
      }
      if (method === 'DELETE') {
        const project = loadProject(id);
        const s = project.scenes.find((x) => x.id === scene);
        if (!s) throw new HttpError(404, 'cena não encontrada');
        const f = findHumanFile(projectDir(id), s);
        if (f) rmSync(f, { force: true });
        if (s.presenter) {
          delete s.presenter;
          writeFileSync(projectFile(id), JSON.stringify(project, null, 2) + '\n');
        }
        return json(res, { ok: true });
      }
    }
  }
  throw new HttpError(404, 'rota desconhecida');
}

createServer((req, res) => {
  route(req, res).catch((e: unknown) => {
    const status = e instanceof HttpError ? e.status : 500;
    if (res.headersSent) return void res.end();
    json(res, { error: e instanceof Error ? e.message : String(e) }, status);
  });
}).listen(PORT, HOST, () => {
  console.log(`\n  Estúdio do motor de vídeo: http://${HOST}:${PORT}\n  (só acessível a partir deste computador; Ctrl+C para sair)\n`);
});

// Para o `tsc` ver este ficheiro como módulo mesmo sem exports.
export {};
