// Publicação nativa no YouTube (Data API v3) — grátis e sem limite de contas,
// ao contrário dos agregadores. Quota: 10.000 unidades/dia; um upload custa
// 1.600 → ~6 vídeos/dia, folgado para 1 artigo de cada vez.

import { readFileSync } from 'node:fs';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const UPLOAD_URL =
  'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status';

export async function getAccessToken(): Promise<string> {
  const { YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN } = process.env;
  if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !YOUTUBE_REFRESH_TOKEN) {
    throw new Error('Faltam credenciais do YouTube (corre `npm run youtube:auth`).');
  }
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: YOUTUBE_CLIENT_ID,
      client_secret: YOUTUBE_CLIENT_SECRET,
      refresh_token: YOUTUBE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const json = (await res.json()) as { access_token?: string; error_description?: string };
  if (!json.access_token) throw new Error(`OAuth falhou: ${json.error_description ?? 'sem token'}`);
  return json.access_token;
}

export interface YouTubeUpload {
  file: string;
  title: string;
  description: string;
  tags?: string[];
  /** 'private' por defeito — publicas manualmente depois de rever. */
  privacyStatus?: 'private' | 'unlisted' | 'public';
}

export async function uploadVideo(opts: YouTubeUpload): Promise<{ id: string; url: string }> {
  const token = await getAccessToken();

  const metadata = {
    snippet: {
      title: opts.title.slice(0, 100),
      description: opts.description.slice(0, 5000),
      tags: opts.tags?.slice(0, 15),
      categoryId: '22', // People & Blogs
    },
    status: {
      privacyStatus: opts.privacyStatus ?? 'private',
      selfDeclaredMadeForKids: false,
    },
  };

  // Corpo multipart/related: JSON dos metadados + bytes do vídeo.
  const boundary = `emori-${Date.now()}`;
  const head = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\nContent-Type: video/mp4\r\n\r\n`,
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([head, readFileSync(opts.file), tail]);

  const res = await fetch(UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
      'Content-Length': String(body.length),
    },
    body,
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Upload falhou (${res.status}): ${text.slice(0, 500)}`);

  const json = JSON.parse(text) as { id: string };
  return { id: json.id, url: `https://youtube.com/watch?v=${json.id}` };
}
