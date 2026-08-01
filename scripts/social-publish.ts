// Fase 4 — publica as peças sociais via API do Zernio.
//
//   npm run social:publish -- --slug=diario-de-gratidao --lang=pt-br            (DRY-RUN)
//   npm run social:publish -- --slug=diario-de-gratidao --lang=pt-br --live     (publica)
//   ... --schedule=2026-08-05T09:00:00Z                                          (agenda)
//
// Por defeito NÃO publica: mostra exatamente o que seria enviado. Só com --live
// é que algo chega às contas reais.
//
// Contrato (verificado no OpenAPI do Zernio):
//   POST /v1/media/upload-direct   multipart {file}          → { url }
//   POST /v1/posts                 { content, mediaItems[], platforms[], publishNow|scheduledFor }
//     platforms[].platformSpecificData (Pinterest): { title(≤100), boardId, link }
//   Idempotência: header x-request-id (UUID) + dedup por hash de conteúdo (409 em 24h).

import { readFileSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { buildPieces } from '../lib/social/adapt';
import type { SocialManifestEntry } from '../lib/social/types';

const BASE = 'https://zernio.com/api/v1';

const KEY = process.env.ZERNIO_API_KEY;
const ACCOUNTS: Record<string, string> = JSON.parse(process.env.ZERNIO_ACCOUNTS ?? '{}');
const BOARD_ID = process.env.ZERNIO_PINTEREST_BOARD_ID;

const args: Record<string, string | boolean> = Object.fromEntries(
  process.argv.slice(2).map((a): [string, string | boolean] => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const LIVE = args.live === true;
const SCHEDULE = typeof args.schedule === 'string' ? args.schedule : undefined;
/** --platform=pinterest limita a publicação a uma plataforma (omitir = todas). */
const ONLY = typeof args.platform === 'string' ? args.platform : undefined;
const wants = (p: string) => !ONLY || ONLY === p;

if (!KEY) {
  console.error('❌ Falta ZERNIO_API_KEY (usa: node --env-file=.env.local, ou secret no CI).');
  process.exit(1);
}

const manifest: SocialManifestEntry[] = JSON.parse(readFileSync('content/blog/manifest.json', 'utf8'));
let targets = manifest;
if (args.slug) targets = targets.filter((e) => e.slug === args.slug);
if (args.lang) targets = targets.filter((e) => e.lang === args.lang);
if (targets.length === 0) {
  console.error('Nenhum artigo corresponde aos filtros.');
  process.exit(1);
}

function logRate(res: Response) {
  const rem = res.headers.get('X-RateLimit-Remaining');
  if (rem && Number(rem) < 10) console.warn(`  ⚠ rate limit a esgotar: ${rem} pedidos restantes`);
}

/** Faz upload de um ficheiro local e devolve o URL público. */
async function uploadMedia(path: string, mime: string): Promise<string> {
  const form = new FormData();
  form.append('file', new Blob([readFileSync(path)], { type: mime }), path.split('/').pop());
  const res = await fetch(`${BASE}/media/upload-direct`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}` },
    body: form,
  });
  logRate(res);
  if (!res.ok) throw new Error(`upload falhou (${res.status}): ${await res.text()}`);
  const json = (await res.json()) as { url: string };
  return json.url;
}

async function createPost(body: unknown): Promise<void> {
  const res = await fetch(`${BASE}/posts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      'x-request-id': randomUUID(), // idempotência: retries não duplicam
    },
    body: JSON.stringify(body),
  });
  logRate(res);
  const text = await res.text();

  if (res.status === 409) {
    console.warn('  ⏭  já publicado nas últimas 24h (dedup do Zernio) — ignorado.');
    return;
  }
  if (!res.ok) throw new Error(`POST /posts falhou (${res.status}): ${text}`);

  const json = JSON.parse(text) as {
    post?: { platforms?: { platform: string; platformPostUrl?: string }[] };
  };
  const urls = json.post?.platforms?.map((p) => p.platformPostUrl).filter(Boolean) ?? [];
  console.log(`  ✅ publicado${urls.length ? `: ${urls.join(', ')}` : ' (URL resolve em breve)'}`);
}

// ---- execução ----------------------------------------------------------------

async function main() {
console.log(LIVE ? '🚀 MODO LIVE — vai publicar a sério.\n' : '🧪 DRY-RUN — nada será publicado. Usa --live para publicar.\n');

for (const entry of targets) {
  const dir = `social/${entry.slug}/${entry.lang}`;
  const pieces = buildPieces(entry);
  console.log(`── ${entry.slug} [${entry.lang}]`);

  // --- Pinterest (imagem) ---
  const pin = pieces.find((p) => p.format === 'pin');
  const pinFile = `${dir}/pin.png`;
  if (pin && ACCOUNTS.pinterest && wants('pinterest')) {
    if (!existsSync(pinFile)) {
      console.warn(`  ⏭  pinterest: falta ${pinFile} (corre \`npm run social\`) — ignorado.`);
    } else {
      const [title, ...rest] = pin.caption.split('\n\n');
      const body = {
        content: rest.join('\n\n'),
        mediaItems: [
          { type: 'image', url: '<upload>', altText: entry.title.slice(0, 500), mimeType: 'image/png' },
        ],
        platforms: [
          {
            platform: 'pinterest',
            accountId: ACCOUNTS.pinterest,
            platformSpecificData: {
              title: title.slice(0, 100),
              ...(BOARD_ID ? { boardId: BOARD_ID } : {}),
              link: pin.link,
            },
          },
        ],
        ...(SCHEDULE ? { scheduledFor: SCHEDULE } : { publishNow: true }),
      };

      if (!LIVE) {
        console.log('  📌 pinterest (dry-run):');
        console.log(`     imagem: ${pinFile}`);
        console.log(`     título: ${body.platforms[0].platformSpecificData.title}`);
        console.log(`     link:   ${pin.link}`);
        console.log(`     board:  ${BOARD_ID ?? '(primeiro disponível)'}`);
      } else {
        console.log('  📌 pinterest: a enviar imagem…');
        body.mediaItems[0].url = await uploadMedia(pinFile, 'image/png');
        await createPost(body);
      }
    }
  }

  // --- TikTok (vídeo) ---
  const vid = pieces.find((p) => p.format === 'video' && p.platform === 'tiktok');
  const vidFile = `${dir}/video.mp4`;
  if (vid && ACCOUNTS.tiktok && wants('tiktok')) {
    if (!existsSync(vidFile)) {
      console.warn(`  ⏭  tiktok: falta ${vidFile} (corre \`npm run social:video\`) — ignorado.`);
    } else {
      const body = {
        content: vid.caption,
        mediaItems: [{ type: 'video', url: '<upload>', mimeType: 'video/mp4' }],
        platforms: [{ platform: 'tiktok', accountId: ACCOUNTS.tiktok }],
        ...(SCHEDULE ? { scheduledFor: SCHEDULE } : { publishNow: true }),
      };

      if (!LIVE) {
        console.log('  🎬 tiktok (dry-run):');
        console.log(`     vídeo:  ${vidFile}`);
        console.log(`     legenda: ${vid.caption.split('\n')[0]}…`);
        console.log(`     link:   ${vid.link}`);
      } else {
        console.log('  🎬 tiktok: a enviar vídeo…');
        body.mediaItems[0].url = await uploadMedia(vidFile, 'video/mp4');
        await createPost(body);
      }
    }
  }
  console.log('');
}

console.log(LIVE ? '✓ Concluído.' : '✓ Dry-run concluído. Repete com --live para publicar.');
}

main().catch((err) => {
  console.error('❌', err instanceof Error ? err.message : err);
  process.exit(1);
});
