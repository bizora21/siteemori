// Autorização OAuth do YouTube (corre uma vez). Abre o browser, recebe o código
// num servidor local e guarda o refresh token em .env.local.
//
//   node --env-file=.env.local scripts/youtube-auth.mjs
//
// Requer que http://localhost:8788/callback esteja nos "URIs de redirecionamento
// autorizados" do cliente OAuth (Google Cloud Console → Credenciais).

import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { exec } from 'node:child_process';

const PORT = 8788;
const REDIRECT = `http://localhost:${PORT}/callback`;
const SCOPE = 'https://www.googleapis.com/auth/youtube.upload';

const id = process.env.YOUTUBE_CLIENT_ID;
const secret = process.env.YOUTUBE_CLIENT_SECRET;
if (!id || !secret) {
  console.error('❌ Falta YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET em .env.local');
  process.exit(1);
}

const authUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?' +
  new URLSearchParams({
    client_id: id,
    redirect_uri: REDIRECT,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent', // força devolver refresh_token
  });

const code = await new Promise((resolve, reject) => {
  const server = createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    if (url.pathname !== '/callback') {
      res.writeHead(404).end();
      return;
    }
    const c = url.searchParams.get('code');
    const err = url.searchParams.get('error');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(
      `<body style="font-family:system-ui;background:#faf5ec;color:#2a2420;display:grid;place-items:center;height:100vh;margin:0">
        <div style="text-align:center">
          <h1 style="font-family:Georgia,serif;color:#a2481f">${c ? 'Autorizado ✓' : 'Falhou'}</h1>
          <p>${c ? 'Podes fechar esta janela e voltar ao terminal.' : err}</p>
        </div>
      </body>`,
    );
    server.close();
    if (c) resolve(c);
    else reject(new Error(err ?? 'sem código'));
  });
  server.listen(PORT, () => {
    console.log('\n🔗 A abrir o browser para autorizares o YouTube…');
    console.log(`   Se não abrir, cola este endereço:\n   ${authUrl}\n`);
    const open =
      process.platform === 'win32' ? 'start ""' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    exec(`${open} "${authUrl}"`);
  });
});

// Troca o código por tokens
const res = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    code,
    client_id: id,
    client_secret: secret,
    redirect_uri: REDIRECT,
    grant_type: 'authorization_code',
  }),
});

const tokens = await res.json();
if (!res.ok || !tokens.refresh_token) {
  console.error('❌ Falha ao obter tokens:', JSON.stringify(tokens, null, 2));
  process.exit(1);
}

// Guarda o refresh token em .env.local (gitignored)
const envPath = '.env.local';
const env = readFileSync(envPath, 'utf8');
const updated = env.includes('YOUTUBE_REFRESH_TOKEN=')
  ? env.replace(/YOUTUBE_REFRESH_TOKEN=.*/, `YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`)
  : `${env}\nYOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}\n`;
writeFileSync(envPath, updated);

console.log('\n✅ Autorizado. Refresh token guardado em .env.local');
console.log('   (nunca é commitado — .env*.local está no .gitignore)');
