// Lista os profiles e as contas sociais ligadas no Zernio (só leitura), para
// obter o profileId e os socialAccountIds necessários à publicação (Fase 4).
//
//   node --env-file=.env.local scripts/zernio-accounts.mjs
//
// A chave (ZERNIO_API_KEY) vem de .env.local (gitignored) — nunca é commitada.

const BASE = 'https://zernio.com/api/v1';
const key = process.env.ZERNIO_API_KEY;
if (!key) {
  console.error('❌ Falta ZERNIO_API_KEY (usa: node --env-file=.env.local ...)');
  process.exit(1);
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, json };
}

console.log('== GET /profiles ==');
const profiles = await get('/profiles');
console.log(profiles.status, JSON.stringify(profiles.json, null, 2));

console.log('\n== GET /accounts ==');
const accounts = await get('/accounts');
console.log(accounts.status, JSON.stringify(accounts.json, null, 2));
