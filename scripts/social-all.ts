// Pipeline completo num só comando: gera tudo e distribui em todos os canais.
//
//   npm run go -- --slug=como-desabafar --lang=pt-br            (DRY-RUN)
//   npm run go -- --slug=como-desabafar --lang=pt-br --live     (publica a sério)
//   npm run go -- --slug=… --lang=… --live --public             (YouTube público)
//
// Ordem: manifest → Pin (PNG) → vídeo (voz + legendas) → publicação
// (Pinterest e TikTok via Zernio; YouTube pela API nativa).
//
// Cada etapa é isolada: se uma falhar, as seguintes continuam e o resumo final
// diz o que passou e o que não passou.

import { spawnSync } from 'node:child_process';

const argv = process.argv.slice(2);
const args: Record<string, string | boolean> = Object.fromEntries(
  argv.map((a): [string, string | boolean] => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);

const LIVE = args.live === true;
const slug = typeof args.slug === 'string' ? args.slug : undefined;
const lang = typeof args.lang === 'string' ? args.lang : undefined;

const filters: string[] = [];
if (slug) filters.push(`--slug=${slug}`);
if (lang) filters.push(`--lang=${lang}`);

const tsx = 'node_modules/tsx/dist/cli.mjs';

interface Step {
  name: string;
  script: string;
  extra?: string[];
}

const steps: Step[] = [
  { name: 'Manifest (peça-mãe)', script: 'scripts/build-social-manifest.ts', extra: [] },
  { name: 'Imagem do Pin', script: 'scripts/build-social-images.ts' },
  { name: 'Vídeo (voz + legendas)', script: 'scripts/build-social-video.ts' },
];

const results: { name: string; ok: boolean }[] = [];

function run(name: string, script: string, extra: string[]): boolean {
  console.log(`\n▸ ${name}`);
  const res = spawnSync('node', ['--env-file=.env.local', tsx, script, ...extra], {
    stdio: 'inherit',
  });
  const ok = res.status === 0;
  results.push({ name, ok });
  return ok;
}

console.log(
  LIVE
    ? '🚀 PIPELINE COMPLETO — MODO LIVE (vai publicar)\n'
    : '🧪 PIPELINE COMPLETO — DRY-RUN (nada será publicado)\n',
);

// 1-3: geração de assets
for (const step of steps) {
  run(step.name, step.script, step.extra ?? filters);
}

// 4: distribuição em todos os canais
const publishArgs = [...filters];
if (LIVE) publishArgs.push('--live');
if (args.public === true) publishArgs.push('--public');
if (args.draft === true) publishArgs.push('--draft');
if (typeof args.schedule === 'string') publishArgs.push(`--schedule=${args.schedule}`);

run('Distribuição (Pinterest · TikTok · YouTube)', 'scripts/social-publish.ts', publishArgs);

// Resumo
console.log('\n──────── RESUMO ────────');
for (const r of results) console.log(`${r.ok ? '✅' : '❌'} ${r.name}`);
const failed = results.filter((r) => !r.ok).length;
console.log(
  failed === 0
    ? `\n✓ Tudo concluído${LIVE ? '' : ' (dry-run — repete com --live)'}.`
    : `\n⚠ ${failed} etapa(s) falharam — vê o detalhe acima.`,
);
process.exit(failed > 0 ? 1 : 0);
