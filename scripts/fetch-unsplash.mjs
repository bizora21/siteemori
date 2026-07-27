// Script de autoria (corre localmente): busca imagens no Unsplash para ilustrar artigos.
// A chave vem de .env.local (gitignored) via: node --env-file=.env.local scripts/fetch-unsplash.mjs "<query>" [indice]
//
//   node --env-file=.env.local scripts/fetch-unsplash.mjs "morning journaling"      → lista candidatos
//   node --env-file=.env.local scripts/fetch-unsplash.mjs "morning journaling" 2    → escolhe o índice 2,
//        dispara o endpoint de "download" (exigido pelas regras do Unsplash) e imprime o objeto `hero`
//        pronto para colar no meta do artigo.
//
// A imagem é usada por HOTLINK (images.unsplash.com) com atribuição — nada é re-hospedado.

const APP = 'aemori'; // utm_source exigido pela atribuição do Unsplash

const key = process.env.UNSPLASH_ACCESS_KEY;
if (!key) {
  console.error('❌ Falta UNSPLASH_ACCESS_KEY (usa: node --env-file=.env.local ...)');
  process.exit(1);
}

const query = process.argv[2];
const chosen = process.argv[3] != null ? Number(process.argv[3]) : null;
if (!query) {
  console.error('Uso: fetch-unsplash.mjs "<query>" [indice]');
  process.exit(1);
}

const url =
  `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}` +
  `&orientation=landscape&per_page=10&content_filter=high`;

const res = await fetch(url, {
  headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' },
});
if (!res.ok) {
  console.error('❌ Unsplash', res.status, await res.text());
  process.exit(1);
}
const data = await res.json();
const results = data.results ?? [];
if (results.length === 0) {
  console.error('Sem resultados para:', query);
  process.exit(1);
}

const utm = `utm_source=${APP}&utm_medium=referral`;
function heroOf(p) {
  return {
    src: `${p.urls.raw}&w=1600&q=80&auto=format&fit=crop`,
    alt: p.alt_description || query,
    credit: p.user.name,
    creditUrl: `${p.user.links.html}?${utm}`,
    id: p.id,
  };
}

if (chosen == null) {
  console.log(`\n${results.length} candidatos para "${query}":\n`);
  results.forEach((p, i) => {
    console.log(`[${i}] ${p.user.name} — cor ${p.color}`);
    console.log(`    alt: ${p.alt_description || '(sem descrição)'}`);
    console.log(`    https://unsplash.com/photos/${p.id}\n`);
  });
  console.log('→ Escolhe: node --env-file=.env.local scripts/fetch-unsplash.mjs "' + query + '" <indice>');
  process.exit(0);
}

const p = results[chosen];
if (!p) {
  console.error('Índice inválido:', chosen);
  process.exit(1);
}
// Regra do Unsplash: disparar o endpoint de download quando a foto é usada.
try {
  await fetch(`${p.links.download_location}?client_id=${key}`, {
    headers: { 'Accept-Version': 'v1' },
  });
} catch {
  /* não bloquear por causa da telemetria */
}
console.log(JSON.stringify(heroOf(p), null, 2));
