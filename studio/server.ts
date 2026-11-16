// Estúdio local do motor de vídeo.   npm run studio   →   http://127.0.0.1:4173
//
// Sem dependências novas: http do Node + o próprio motor (engine/). O build é
// feito pela MESMA CLI de sempre num processo filho — o dashboard não tem um
// caminho de render paralelo, por isso o 3D sai com a qualidade de sempre.
//
// Segurança: por defeito só escuta em 127.0.0.1 (guarda chaves de API e voz de
// pessoas), valida o cabeçalho Host (contra DNS rebinding) e a Origin nos pedidos
// que alteram dados. Ids só aceitam [a-z0-9-] (sem path traversal).
//
// Modo telemóvel (npm run studio -- --lan): escuta também na rede local, mas só
// aceita pedidos de IPs privados E com um código secreto gerado a cada arranque
// (vai no link/QR). É HTTP simples: usar só em Wi-Fi de confiança (a sua casa).

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createServer as createSecureServer } from 'node:https';
import type { TLSSocket } from 'node:tls';
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { networkInterfaces } from 'node:os';
import { basename, extname, join, normalize, relative, resolve, sep } from 'node:path';
import { lintProject } from '../engine/claims';
import { coach } from '../engine/coach';
import { qrSvg } from './qr';
import { FFMPEG } from '../engine/ffmpeg';
import { TEMPLATES } from '../engine/templates';
import { listVersions } from '../engine/versions';
import { validateBrand, validateProject, type Brand, type Issue, type Project } from '../engine/types';
import { findHumanFile } from '../engine/voice';

const PORT = Number(process.env.STUDIO_PORT ?? 4173);
const LAN = process.argv.includes('--lan') || process.env.STUDIO_LAN === '1';
const HOST = '127.0.0.1';
const HTTPS_PORT = PORT + 1;
const TOKEN = randomBytes(16).toString('hex');
const ROOT = resolve('projects');
const OUT = resolve('video3d/out');
const PUBLIC = resolve('studio/public');
const ID_RE = /^[a-z0-9][a-z0-9-]*$/;
const MAX_UPLOAD = 300 * 1024 * 1024;
const MAX_FILE = 2 * 1024 * 1024 * 1024;

const VIDEO_EXT = ['.mp4', '.mov', '.m4v', '.webm', '.mkv', '.avi', '.3gp'];
const AUDIO_EXT = ['.wav', '.m4a', '.mp3', '.aac', '.ogg', '.opus', '.flac', '.amr', '.webm'];
const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic'];

/** Endereços IPv4 desta máquina na rede local (para o link do telemóvel). */
function lanIps(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .filter((n): n is NonNullable<typeof n> => Boolean(n) && n!.family === 'IPv4' && !n!.internal)
    .map((n) => n.address);
}
/**
 * Certificado autoassinado para o telemóvel gravar COM o texto no ecrã: a câmara e o
 * microfone só funcionam dentro da página em HTTPS. O telemóvel avisa "ligação não privada"
 * na primeira vez (é o seu próprio PC): Avançado → Continuar. Precisa do openssl (vem com o Git).
 */
function findOpenssl(): string | null {
  const cands = [process.env.OPENSSL, 'openssl', 'C:\\Program Files\\Git\\usr\\bin\\openssl.exe', 'C:\\Program Files\\Git\\mingw64\\bin\\openssl.exe'].filter((x): x is string => Boolean(x));
  return cands.find((c) => spawnSync(c, ['version'], { encoding: 'utf8' }).status === 0) ?? null;
}

function tlsCredentials(ips: string[]): { key: string; cert: string } | null {
  const openssl = findOpenssl();
  if (!openssl) return null;
  const dir = resolve('.engine-cache/tls');
  mkdirSync(dir, { recursive: true });
  const name = createHash('sha1').update(ips.join(',')).digest('hex').slice(0, 10);
  const key = join(dir, `${name}.key`);
  const crt = join(dir, `${name}.crt`);
  if (!existsSync(key) || !existsSync(crt)) {
    const san = ['DNS:localhost', 'IP:127.0.0.1', ...ips.map((ip) => `IP:${ip}`)].join(',');
    const r = spawnSync(openssl, ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', crt, '-days', '90', '-subj', '/CN=Estudio de video', '-addext', `subjectAltName=${san}`], { encoding: 'utf8' });
    if (r.status !== 0) return null;
  }
  return { key: readFileSync(key, 'utf8'), cert: readFileSync(crt, 'utf8') };
}

const TLS = LAN ? tlsCredentials(lanIps()) : null;
const HOSTS = new Set([
  `${HOST}:${PORT}`,
  `localhost:${PORT}`,
  ...(TLS ? [`${HOST}:${HTTPS_PORT}`, `localhost:${HTTPS_PORT}`] : []),
  ...(LAN ? lanIps().map((ip) => (TLS ? `${ip}:${HTTPS_PORT}` : `${ip}:${PORT}`)) : []),
]);

const isLoopback = (a: string) => a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1';
const isPrivate = (a: string) => {
  const ip = a.replace(/^::ffff:/, '');
  return /^10\./.test(ip) || /^192\.168\./.test(ip) || /^172\.(1[6-9]|2\d|3[01])\./.test(ip) || /^169\.254\./.test(ip);
};

/** Só a chave do Pexels é lida do .env.local (as outras chaves não são do estúdio). */
function pexelsKey(): string | undefined {
  if (process.env.PEXELS_API_KEY) return process.env.PEXELS_API_KEY;
  try {
    const m = /^\s*PEXELS_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?\s*$/m.exec(readFileSync('.env.local', 'utf8'));
    return m?.[1].trim();
  } catch {
    return undefined;
  }
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.m4v': 'video/mp4',
  '.webm': 'video/webm',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
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
  const p = JSON.parse(readFileSync(projectFile(id), 'utf8')) as Project;
  for (const s of p.scenes ?? []) if (s && typeof s.narration !== 'string') s.narration = '';
  return p;
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

/**
 * Tempos das cenas para a linha do tempo: os reais (do último "Ouvir a voz"/rascunho) se estiverem
 * atualizados, senão uma estimativa pelo número de palavras.
 */
function timing(id: string, project: ReturnType<typeof loadProject>) {
  const pf = resolve('video3d/props', `${id}.json`);
  const tokens = project.scenes.map((sc) => (sc.kind === 'clip' ? 0 : String(sc.narration ?? '').split(/\s+/).filter(Boolean).length));
  try {
    if (existsSync(pf)) {
      const p = JSON.parse(readFileSync(pf, 'utf8'));
      const flat: { text: string; start: number; end: number }[] = (p.lines ?? []).flatMap((l: { words: { text: string; start: number; end: number }[] }) => l.words);
      const want = tokens.reduce((x, y) => x + y, 0);
      // Os tempos só servem se ainda correspondem ao texto (mesmas cenas e quase as mesmas palavras).
      if (Array.isArray(p.sceneStarts) && p.sceneStarts.length === project.scenes.length && Array.isArray(p.audioStarts) && Math.abs(flat.length - want) <= Math.max(3, want * 0.03)) {
        let k = 0;
        const wordT = tokens.map((n) => {
          const out: number[] = [];
          for (let j = 0; j < n; j++) out.push(flat[Math.min(k++, flat.length - 1)]?.start ?? 0);
          return out;
        });
        return {
          starts: p.sceneStarts as number[],
          audioStarts: p.audioStarts as number[],
          durations: (p.sceneDurations ?? []) as number[],
          wordT,
          lines: p.lines as unknown[],
          total: p.durationInFrames / 30,
          exact: true,
        };
      }
    }
  } catch { /* usa a estimativa */ }
  let t = 0.4;
  const starts: number[] = [];
  const audioStarts: number[] = [];
  const durations: number[] = [];
  const wordT: number[][] = [];
  project.scenes.forEach((sc, i) => {
    const n = tokens[i];
    const dur = Math.max(2, n / 2.3);
    starts.push(i === 0 ? 0 : t - 0.15);
    audioStarts.push(t);
    durations.push(dur);
    wordT.push(Array.from({ length: n }, (_, j) => t + (j / Math.max(1, n)) * dur));
    t += dur + 0.3;
  });
  return { starts, audioStarts, durations, wordT, lines: [] as unknown[], total: t + 2, exact: false };
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
    return {
      id: s.id,
      recorded: Boolean(f),
      kind: f ? (s.presenter || VIDEO_EXT.includes(extname(f).toLowerCase()) ? 'video' : 'audio') : null,
      // onde ficou guardado no PC (para o telemóvel mostrar "guardado")
      file: f ? relative(dir, f).replace(/\\/g, '/') : null,
      kb: f ? Math.round(statSync(f).size / 1024) : 0,
    };
  });
  const files: string[] = [];
  const packDir = join(OUT, id);
  if (existsSync(packDir)) files.push(...readdirSync(packDir).map((f) => `${id}/${f}`));
  for (const n of [`${id}.mp4`, `${id}-rascunho.mp4`]) if (existsSync(join(OUT, n))) files.push(n);
  const versions = listVersions(project);
  // pacotes de publicação e vídeos de cada versão
  for (const v of versions) {
    const vid = `${id}--${v.id}`;
    const vdir = join(OUT, vid);
    if (existsSync(vdir)) files.push(...readdirSync(vdir).map((f) => `${vid}/${f}`));
    for (const n of [`${vid}.mp4`, `${vid}-rascunho.mp4`]) if (existsSync(join(OUT, n))) files.push(n);
  }
  // O que aconteceu no último trabalho deste vídeo (para a página mostrar o motivo de uma falha)
  const last = jobs.filter((j) => j.project === id).at(-1);
  const lastJob = last
    ? {
        id: last.id,
        label: last.label,
        status: last.status,
        error: last.status === 'failed' ? (last.log.filter((l) => l.startsWith('✗')).pop() ?? last.log.at(-1) ?? 'falhou sem mensagem') : '',
        warnings: last.log.filter((l) => l.includes('⚠')).slice(-6),
      }
    : null;
  const quality = coach(project, dir, scenes.map((x) => x.recorded));
  return { project, brand, issues, scenes, files, versions, lastJob, quality, timing: timing(id, project), status: outputStatus(id, versions.map((v) => v.id)) };
}

/** O mais recente de tudo o que entra no vídeo (texto, gravações, cenários, música). */
function newestInput(id: string): number {
  const dir = projectDir(id);
  let t = existsSync(projectFile(id)) ? statSync(projectFile(id)).mtimeMs : 0;
  for (const sub of ['voice', 'presenter', 'media', 'music']) {
    const d = join(dir, sub);
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d)) t = Math.max(t, statSync(join(d, f)).mtimeMs);
  }
  return t;
}

/**
 * O que já foi gerado e se continua válido. "fresh" = gerado depois da última alteração:
 * o vídeo final só se aprova a partir de um rascunho fresco (foi esse que a pessoa viu e ouviu).
 */
function outputStatus(id: string, versionIds: string[] = []) {
  const newest = newestInput(id);
  const info = (file: string) => {
    if (!existsSync(file)) return { exists: false, fresh: false };
    return { exists: true, fresh: statSync(file).mtimeMs >= newest };
  };
  const of = (oid: string) => ({
    audio: info(resolve('video3d/public/audio', `${oid}.mp3`)),
    draft: info(join(OUT, `${oid}-rascunho.mp4`)),
    final: info(join(OUT, `${oid}.mp4`)),
  });
  // Cada versão (id--versão) tem o seu áudio, rascunho e final, e é aprovada à parte.
  return { ...of(id), versions: Object.fromEntries(versionIds.map((v) => [v, of(`${id}--${v}`)])) };
}

/** Cria a versão personalizada (cenários + rosto) de um projeto 3D, com o mesmo texto e as gravações. */
function personalize(id: string): string {
  const src = loadProject(id);
  let nid = `${id}-pessoal`;
  for (let n = 2; existsSync(projectFile(nid)); n++) nid = `${id}-pessoal-${n}`;
  const p: Project = {
    id: nid,
    brand: src.brand,
    template: 'reportagem',
    title: `${src.title.replace(/\s*\(3D[^)]*\)\s*/i, ' ').trim()} (personalizado)`,
    locale: src.locale,
    aspect: '9:16',
    voice: { mode: src.voice?.mode === 'human-only' ? 'human' : (src.voice?.mode ?? 'auto'), rate: src.voice?.rate, pauseSeconds: src.voice?.pauseSeconds ?? 0.3 },
    cta: src.cta,
    site: src.site,
    ...(src.music ? { music: src.music } : {}),
    scenes: src.scenes.map((s) => ({ id: s.id, narration: s.narration, title: s.title, shot: s.shot, location: s.location, presenter: s.presenter })),
  };
  mkdirSync(projectDir(nid), { recursive: true });
  // As gravações (voz, rosto) e a música vêm juntas: não é preciso gravar outra vez.
  for (const sub of ['voice', 'presenter', 'music']) if (existsSync(join(projectDir(id), sub))) cpSync(join(projectDir(id), sub), join(projectDir(nid), sub), { recursive: true });
  writeFileSync(projectFile(nid), JSON.stringify(p, null, 2) + '\n');
  return nid;
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

// ── envio de ficheiros (vídeos de telemóvel têm centenas de MB: vai direto para o disco) ──
function streamToFile(req: IncomingMessage, dest: string, limit = MAX_FILE): Promise<number> {
  return new Promise((ok, fail) => {
    const out = createWriteStream(dest);
    let size = 0;
    let dead = false;
    const abort = (e: Error) => {
      if (dead) return;
      dead = true;
      out.destroy();
      rmSync(dest, { force: true });
      req.destroy();
      fail(e);
    };
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > limit) abort(new HttpError(413, 'ficheiro demasiado grande'));
    });
    req.on('error', abort);
    out.on('error', abort);
    out.on('finish', () => !dead && ok(size));
    req.pipe(out);
  });
}

const safeName = (n: string) => basename(n).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-80) || 'ficheiro';

async function uploadFile(req: IncomingMessage, id: string, kind: string, sceneId: string | undefined, name: string): Promise<Record<string, unknown>> {
  const dir = projectDir(id);
  const ext = extname(name).toLowerCase();
  const project = loadProject(id);
  const scene = sceneId ? project.scenes.find((s) => s.id === sceneId) : undefined;
  if (sceneId && !scene) throw new HttpError(404, 'cena não encontrada');

  if (kind === 'presenter') {
    if (!scene) throw new HttpError(400, 'falta a cena');
    if (!VIDEO_EXT.includes(ext)) throw new HttpError(415, `formato de vídeo não suportado (${ext || 'sem extensão'})`);
    mkdirSync(join(dir, 'presenter'), { recursive: true });
    for (const e of VIDEO_EXT) rmSync(join(dir, 'presenter', `${scene.id}${e}`), { force: true });
    const tmp = join(dir, `.upload-${Date.now()}${ext}`);
    await streamToFile(req, tmp);
    renameSync(tmp, join(dir, 'presenter', `${scene.id}${ext}`));
    scene.presenter = `presenter/${scene.id}${ext}`;
    writeFileSync(projectFile(id), JSON.stringify(project, null, 2) + '\n');
    return { path: scene.presenter };
  }

  if (kind === 'voice') {
    if (!scene) throw new HttpError(400, 'falta a cena');
    if (!AUDIO_EXT.includes(ext)) throw new HttpError(415, `formato de áudio não suportado (${ext || 'sem extensão'})`);
    mkdirSync(join(dir, 'voice'), { recursive: true });
    const tmp = join(dir, `.upload-${Date.now()}${ext}`);
    try {
      await streamToFile(req, tmp);
      for (const e of EXTS) rmSync(join(dir, 'voice', `${scene.id}.${e}`), { force: true });
      ffmpegConvert(tmp, ['-vn', '-ar', '44100', '-ac', '1', '-c:a', 'pcm_s16le'], join(dir, 'voice', `${scene.id}.wav`));
    } finally {
      rmSync(tmp, { force: true });
    }
    return { path: `voice/${scene.id}.wav` };
  }

  if (kind === 'media' || kind === 'cutaway' || kind === 'scenemedia') {
    if (![...IMAGE_EXT, ...VIDEO_EXT].includes(ext)) throw new HttpError(415, `formato de imagem/vídeo não suportado (${ext || 'sem extensão'})`);
    mkdirSync(join(dir, 'media'), { recursive: true });
    const file = `${scene ? scene.id + '-' : ''}${Date.now()}${ext}`;
    await streamToFile(req, join(dir, 'media', file));
    const path = `media/${file}`;
    // O telemóvel liga o ficheiro à cena diretamente (o computador escolhe onde pô-lo na interface).
    if (kind === 'cutaway' && scene) {
      (scene.cutaways ??= []).push({ media: path, at: 1, duration: 2 });
      writeFileSync(projectFile(id), JSON.stringify(project, null, 2) + '\n');
    } else if (kind === 'scenemedia' && scene) {
      scene.media = path;
      writeFileSync(projectFile(id), JSON.stringify(project, null, 2) + '\n');
    }
    return { path };
  }

  if (kind === 'avatar') {
    if (!IMAGE_EXT.includes(ext) || ext === '.gif' || ext === '.heic') throw new HttpError(415, 'a foto deve ser jpg, png ou webp');
    for (const e of IMAGE_EXT) rmSync(join(dir, `avatar${e}`), { force: true });
    await streamToFile(req, join(dir, `avatar${ext}`));
    project.avatar = `avatar${ext}`;
    writeFileSync(projectFile(id), JSON.stringify(project, null, 2) + '\n');
    return { path: project.avatar };
  }

  if (kind === 'music') {
    if (!AUDIO_EXT.includes(ext) || ext === '.webm') throw new HttpError(415, 'a música deve ser mp3, wav, m4a, ogg ou flac');
    mkdirSync(join(dir, 'music'), { recursive: true });
    const file = safeName(name);
    await streamToFile(req, join(dir, 'music', file));
    return { path: `music/${file}` };
  }
  throw new HttpError(400, 'tipo de envio desconhecido');
}

// ── Pexels (imagens e vídeos de apoio; NÃO tem música) ─────────────────────
interface PexelsHit {
  type: 'photos' | 'videos';
  id: number;
  thumb: string;
  link: string;
  author: string;
  url: string;
  duration?: number;
  width: number;
  height: number;
}

async function pexelsSearch(q: string, type: string, orientation: string): Promise<PexelsHit[]> {
  const key = pexelsKey();
  if (!key) throw new HttpError(503, 'PEXELS_API_KEY não está configurada em .env.local');
  const o = ['portrait', 'landscape', 'square'].includes(orientation) ? orientation : 'portrait';
  if (type === 'videos') {
    const r = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&orientation=${o}&size=medium&per_page=12`, { headers: { Authorization: key } });
    if (!r.ok) throw new HttpError(502, `Pexels respondeu ${r.status}`);
    const d = (await r.json()) as { videos?: { id: number; image: string; duration: number; url: string; user: { name: string }; video_files: { link: string; width: number; height: number; file_type: string }[] }[] };
    return (d.videos ?? []).flatMap((v) => {
      // O mais pequeno com pelo menos 720 px de largura (a CDN do Pexels é lenta).
      const f = v.video_files.filter((x) => x.file_type === 'video/mp4' && x.width >= 720).sort((a, b) => a.width - b.width)[0];
      return f ? [{ type: 'videos' as const, id: v.id, thumb: v.image, link: f.link, author: v.user.name, url: v.url, duration: v.duration, width: f.width, height: f.height }] : [];
    });
  }
  const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&orientation=${o}&per_page=12`, { headers: { Authorization: key } });
  if (!r.ok) throw new HttpError(502, `Pexels respondeu ${r.status}`);
  const d = (await r.json()) as { photos?: { id: number; url: string; photographer: string; width: number; height: number; src: { large2x: string; medium: string } }[] };
  return (d.photos ?? []).map((p) => ({ type: 'photos' as const, id: p.id, thumb: p.src.medium, link: p.src.large2x, author: p.photographer, url: p.url, width: p.width, height: p.height }));
}

/** Descarrega para a pasta do projeto (curl: a CDN do Pexels corta ligações longas e o fetch não recupera). */
interface Download {
  id: number;
  project: string;
  status: 'running' | 'done' | 'failed';
  dest: string;
  total: number;
  path?: string;
  error?: string;
}
const downloads: Download[] = [];

/**
 * Arranca o descarregamento em SEGUNDO PLANO e devolve logo. Os vídeos do Pexels descarregam a poucos
 * KB/s e um pedido em espera caducava ao fim de minutos (a página parecia presa e depois falhava).
 * O progresso vê-se em GET /api/downloads/:n.
 */
function startPexelsDownload(id: string, sceneId: string | undefined, hit: { type: string; link: string; author: string; url: string }): Download {
  let u: URL;
  try {
    u = new URL(hit.link);
  } catch {
    throw new HttpError(400, 'ligação inválida');
  }
  // Só descarrega do Pexels (nada de pedidos a endereços arbitrários).
  if (u.protocol !== 'https:' || !(u.hostname === 'pexels.com' || u.hostname.endsWith('.pexels.com'))) throw new HttpError(400, 'só se descarrega do Pexels');
  loadProject(id);
  const ext = hit.type === 'videos' ? '.mp4' : '.jpg';
  const dir = join(projectDir(id), 'media');
  mkdirSync(dir, { recursive: true });
  const file = `${sceneId ? sceneId + '-' : ''}pexels-${Date.now()}${ext}`;
  const dest = join(dir, file);
  const dl: Download = { id: downloads.length + 1, project: id, status: 'running', dest, total: 0 };
  downloads.push(dl);
  // Tamanho total (para a percentagem): pedido rápido, sem bloquear nada.
  fetch(hit.link, { method: 'HEAD', signal: AbortSignal.timeout(10000) })
    .then((r) => (dl.total = Number(r.headers.get('content-length')) || 0))
    .catch(() => undefined);
  const c = spawn('curl', ['-sL', '--retry', '3', '--retry-all-errors', '--speed-limit', '1000', '--speed-time', '90', '--max-time', '1500', '--max-filesize', String(150 * 1024 * 1024), '-o', dest, hit.link]);
  c.on('close', (code) => {
    if (code === 0 && existsSync(dest) && statSync(dest).size > 5000) {
      // A licença do Pexels dispensa crédito, mas guardamos a origem (prova e boa prática).
      const p = loadProject(id);
      const credit = `${hit.type === 'videos' ? 'Vídeo' : 'Foto'}: ${hit.author} (Pexels) ${hit.url}`;
      p.credits = [...new Set([...(p.credits ?? []), credit])];
      writeFileSync(projectFile(id), JSON.stringify(p, null, 2) + '\n');
      dl.path = `media/${file}`;
      dl.status = 'done';
    } else {
      rmSync(dest, { force: true });
      dl.error = 'o descarregamento do Pexels falhou (rede lenta ou ligação cortada). Tente outro vídeo ou uma foto.';
      dl.status = 'failed';
    }
  });
  return dl;
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

function enqueue(project: string, opts: { draft?: boolean; noRender?: boolean; voice?: string; version?: string }): Job {
  const args: string[] = [];
  // O nome da versão só entra na linha de comandos depois de validado ([a-z0-9]).
  if (opts.version && /^[a-z0-9]+$/.test(opts.version)) args.push(`--version=${opts.version}`);
  if (opts.draft) args.push('--draft');
  if (opts.noRender) args.push('--no-render');
  if (opts.voice && ['auto', 'human', 'human-only', 'synthetic'].includes(opts.voice)) args.push(`--voice=${opts.voice}`);
  const label = `${opts.noRender ? 'voz + props' : opts.draft ? 'rascunho' : 'final'}${opts.version ? ' · ' + opts.version : ''}`;
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
  if (!HOSTS.has(host)) throw new HttpError(403, 'host não permitido');
  const secure = Boolean((req.socket as TLSSocket).encrypted);
  if (method !== 'GET' && req.headers.origin && req.headers.origin !== `${secure ? 'https' : 'http'}://${host}`) throw new HttpError(403, 'origem não permitida');

  // Fora deste computador: só em modo --lan, só IPs privados e só com o código secreto.
  const remote = req.socket.remoteAddress ?? '';
  const local = isLoopback(remote);
  if (!local) {
    if (!LAN || !isPrivate(remote)) throw new HttpError(403, 'acesso só neste computador');
    const cookie = /(?:^|;\s*)st=([a-f0-9]+)/.exec(req.headers.cookie ?? '')?.[1];
    const given = url.searchParams.get('t');
    if (given === TOKEN) res.setHeader('Set-Cookie', `st=${TOKEN}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${secure ? '; Secure' : ''}`);
    else if (cookie !== TOKEN) throw new HttpError(401, 'precisa do link com o código (veja o terminal do computador)');
  }

  if (parts[0] === 'api' && parts[1] === 'info') {
    // O código só é entregue a quem está no próprio computador.
    const want = url.searchParams.get('p');
    const open = want && ID_RE.test(want) && existsSync(projectFile(want)) ? `&p=${want}` : '';
    const urls = local && LAN ? lanIps().map((ip) => (TLS ? `https://${ip}:${HTTPS_PORT}` : `http://${ip}:${PORT}`) + `/m.html?t=${TOKEN}${open}`) : [];
    // O QR é gerado aqui, neste computador: o link (com o código) nunca sai da sua rede.
    return json(res, { lan: LAN, secure: Boolean(TLS), urls, qr: urls.map((u) => qrSvg(u, 300)), pexels: Boolean(pexelsKey()) });
  }

  if (parts[0] === 'api' && parts[1] === 'pexels' && parts[2] === 'search' && method === 'GET') {
    const q = url.searchParams.get('q')?.trim();
    if (!q || q.length > 80) throw new HttpError(400, 'pesquisa inválida');
    return json(res, await pexelsSearch(q, url.searchParams.get('type') ?? 'photos', url.searchParams.get('orientation') ?? 'portrait'));
  }

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

  // GET /api/downloads/:n — progresso de um descarregamento do Pexels
  if (parts[1] === 'downloads' && parts[2]) {
    const d = downloads.find((x) => x.id === Number(parts[2]));
    if (!d) throw new HttpError(404, 'descarregamento não encontrado');
    const received = existsSync(d.dest) ? statSync(d.dest).size : 0;
    return json(res, { status: d.status, received, total: d.total, path: d.path, error: d.error });
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
      ...(def.id === 'reportagem' ? { aspect: '9:16' as const } : {}),
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
      const b = JSON.parse((await readBody(req)).toString() || '{}') as { draft?: boolean; noRender?: boolean; voice?: string; version?: string };
      if (b.version && !listVersions(loadProject(id)).some((v) => v.id === b.version)) throw new HttpError(400, 'versão desconhecida');
      loadProject(id);
      if (jobs.some((j) => j.project === id && (j.status === 'queued' || j.status === 'running'))) throw new HttpError(409, 'este projeto já tem um trabalho na fila');
      const job = enqueue(id, b);
      return json(res, { job: job.id }, 202);
    }

    // GET /api/projects/:id/audio — a voz montada (para ouvir antes de gerar o vídeo)
    if (sub === 'audio' && method === 'GET') {
      const v = url.searchParams.get('version');
      const oid = v && /^[a-z0-9]+$/.test(v) ? `${id}--${v}` : id;
      return sendFile(req, res, resolve('video3d/public/audio', `${oid}.mp3`));
    }

    // POST /api/projects/:id/personalize — versão personalizada (cenários + rosto) de um projeto 3D
    if (sub === 'personalize' && method === 'POST') {
      if (!TEMPLATES[loadProject(id).template] || TEMPLATES[loadProject(id).template].kind !== '3d') throw new HttpError(400, 'só se personaliza um vídeo 3D');
      return json(res, { id: personalize(id) }, 201);
    }

    // GET /api/projects/:id/file?p=media/x.jpg — pré-visualização (só estas subpastas)
    if (sub === 'file' && method === 'GET') {
      const p = url.searchParams.get('p') ?? '';
      if (!/^(media|presenter|music|voice)\/|^avatar\.(jpg|jpeg|png|webp)$/.test(p)) throw new HttpError(400, 'caminho inválido');
      return sendFile(req, res, inside(projectDir(id), ...p.split('/')));
    }

    // POST /api/projects/:id/upload?kind=presenter|voice|media|music&scene=<id>&name=<ficheiro>
    if (sub === 'upload' && method === 'POST') {
      const kind = url.searchParams.get('kind') ?? '';
      const scene = url.searchParams.get('scene');
      const out = await uploadFile(req, id, kind, scene ? needId(scene) : undefined, url.searchParams.get('name') ?? '');
      return json(res, { ok: true, ...out });
    }

    // POST /api/projects/:id/pexels  { type, link, author, url, scene }
    if (sub === 'pexels' && method === 'POST') {
      const b = JSON.parse((await readBody(req)).toString() || '{}') as { type?: string; link?: string; author?: string; url?: string; scene?: string };
      if (!b.link || !b.author || !b.url) throw new HttpError(400, 'faltam dados da imagem');
      const dl = startPexelsDownload(id, b.scene ? needId(b.scene) : undefined, { type: b.type ?? 'photos', link: b.link, author: b.author, url: b.url });
      return json(res, { ok: true, download: dl.id }, 202);
    }

    // PATCH /api/projects/:id/meta  { hostName?, hostRole? } — quem aparece no vídeo (telemóvel)
    if (sub === 'meta' && method === 'PATCH') {
      const project = loadProject(id);
      const b = JSON.parse((await readBody(req)).toString() || '{}') as { hostName?: string; hostRole?: string };
      const host = project.host ?? { name: '' };
      if (typeof b.hostName === 'string') host.name = b.hostName.trim().slice(0, 120);
      if (typeof b.hostRole === 'string') host.role = b.hostRole.trim().slice(0, 160);
      project.host = host;
      writeFileSync(projectFile(id), JSON.stringify(project, null, 2) + '\n');
      return json(res, { ok: true });
    }

    // PATCH /api/projects/:id/scene/:scene  { location?, shot?, narration? } — o telemóvel edita só isto
    if (sub === 'scene' && parts[4] && method === 'PATCH') {
      const project = loadProject(id);
      const s = project.scenes.find((x) => x.id === needId(parts[4]));
      if (!s) throw new HttpError(404, 'cena não encontrada');
      const b = JSON.parse((await readBody(req)).toString() || '{}') as { location?: string; shot?: string; narration?: string };
      for (const k of ['location', 'shot', 'narration'] as const) {
        if (typeof b[k] === 'string') {
          const v = b[k]!.trim().slice(0, 2000);
          if (k === 'narration' && !v) throw new HttpError(400, 'a narração não pode ficar vazia');
          (s as unknown as Record<string, unknown>)[k] = v || undefined;
        }
      }
      writeFileSync(projectFile(id), JSON.stringify(project, null, 2) + '\n');
      return json(res, { ok: true });
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

const handler = (req: IncomingMessage, res: ServerResponse) => {
  route(req, res).catch((e: unknown) => {
    const status = e instanceof HttpError ? e.status : 500;
    if (res.headersSent) return void res.end();
    json(res, { error: e instanceof Error ? e.message : String(e) }, status);
  });
};

// PC: HTTP só em 127.0.0.1 (sem avisos de certificado). Telemóvel: HTTPS na rede local (se houver
// openssl); sem openssl cai para HTTP na rede local e o telemóvel grava com a câmara normal.
createServer(handler).listen(PORT, LAN && !TLS ? '0.0.0.0' : HOST, () => {
  console.log(`\n  Estúdio do motor de vídeo: http://${HOST}:${PORT}`);
  if (!LAN) console.log('  (só acessível a partir deste computador; para usar o telemóvel: iniciar-estudio.bat)\n');
});

if (LAN && TLS) {
  createSecureServer(TLS, handler).listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log('\n  MODO TELEMÓVEL ligado (HTTPS, grava com o texto no ecrã). Abra no telemóvel, no mesmo Wi-Fi:');
    for (const ip of lanIps()) console.log(`    https://${ip}:${HTTPS_PORT}/m.html?t=${TOKEN}`);
    console.log('  Na 1.ª vez o telemóvel avisa "ligação não privada": é o seu PC. Toque em Avançado → Continuar.');
    console.log('  O código vale só até fechar este programa. Use só no Wi-Fi da sua casa.\n');
  });
} else if (LAN) {
  console.log('\n  MODO TELEMÓVEL ligado (HTTP: sem openssl, o telemóvel grava com a câmara normal). Links:');
  for (const ip of lanIps()) console.log(`    http://${ip}:${PORT}/m.html?t=${TOKEN}`);
  console.log('  O código vale só até fechar este programa. HTTP simples: use só no Wi-Fi da sua casa.\n');
}

// Para o `tsc` ver este ficheiro como módulo mesmo sem exports.
export {};
