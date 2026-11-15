// Pacote de publicação: tudo o que acompanha o vídeo (descrição pronta, hashtags,
// legendas .srt e transcrição). Serve também o SEO: a transcrição e as legendas
// alimentam o VideoObject/a página do artigo correspondente.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CaptionLine } from '../lib/social/tts';
import type { Brand, Project } from './types';

function srtTime(s: number): string {
  const ms = Math.round(s * 1000);
  const p = (n: number, l = 2) => String(n).padStart(l, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
}

export function writePublishPack(
  outDir: string,
  project: Project,
  brand: Brand,
  lines: CaptionLine[],
  sceneStarts: number[],
): string[] {
  mkdirSync(outDir, { recursive: true });
  const files: string[] = [];

  const srt = lines
    .map((l, i) => `${i + 1}\n${srtTime(l.start)} --> ${srtTime(l.end + 0.2)}\n${l.words.map((w) => w.text).join(' ')}\n`)
    .join('\n');
  writeFileSync(join(outDir, `${project.id}.srt`), srt);
  files.push(`${project.id}.srt`);

  const transcript = project.scenes.map((s) => s.narration.trim()).join('\n\n');
  writeFileSync(join(outDir, `${project.id}-transcricao.txt`), transcript + '\n');
  files.push(`${project.id}-transcricao.txt`);

  const tags = (project.publish?.hashtags ?? brand.hashtags).map((t) => (t.startsWith('#') ? t : `#${t}`));
  const site = project.site ?? brand.site;
  const cta = project.cta ?? brand.cta;
  const description =
    project.publish?.description ??
    `${project.title}\n\n${project.scenes[0].narration.trim()}\n\n${cta}: ${site}`;
  const credits = [project.music?.attribution, ...(project.credits ?? [])].filter((c): c is string => Boolean(c && c.trim()));
  const creditBlock = credits.length ? `\n\n${credits.join('\n')}` : '';
  const chapters = project.scenes
    .map((s, i) => `${srtTime(sceneStarts[i] ?? 0).slice(3, 8)} ${s.title ?? s.id}`)
    .join('\n');
  writeFileSync(
    join(outDir, `${project.id}-publicacao.md`),
    `# ${project.title}\n\n## Descrição\n\n${description}${creditBlock}\n\n## Hashtags\n\n${tags.join(' ')}\n\n## Capítulos\n\n${chapters}\n`,
  );
  files.push(`${project.id}-publicacao.md`);
  return files;
}
