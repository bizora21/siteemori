# aemori.com — site institucional da Emori

Site estático (marketing + páginas legais) da **Emori**, um diário emocional com IA
para o mercado lusófono. Bilingue **PT-BR** (primária) e **PT-PT**, otimizado para SEO
tradicional e para motores de resposta com IA (AI Overviews, ChatGPT, Perplexity).

- **Stack:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Export:** estático (`output: 'export'` → pasta `out/`)
- **Deploy:** Cloudflare Workers (Static Assets, via `wrangler.jsonc`)
- **Domínio:** aemori.com · **Package Android:** app.emori

---

## Desenvolvimento local

```bash
npm install
npm run dev      # http://localhost:3000 (redireciona / → /pt-br)
npm run build    # gera a pasta out/ (site estático)
```

O `next build` já faz o export estático (não é preciso `next export`). O resultado
fica em **`out/`**.

> **Node:** use Node **18.18+** ou **20 LTS** (recomendado 20). Definido em
> `package.json` › `engines`.

---

## Estrutura

```
app/
  [lang]/            # pt-br | pt-pt (generateStaticParams); layout = raiz <html lang>
    page.tsx         # Home
    produto/ pro/ privacidade/ termos/
    blog/ + blog/[slug]/
  sitemap.ts         # sitemap.xml (todas as rotas × 2 variantes, com hreflang)
  robots.ts          # robots.txt (permite Googlebot, GPTBot, ClaudeBot, Perplexity…)
i18n/                # config + dicionários pt-br.ts / pt-pt.ts
content/blog/        # artigos em TSX (pt-br completos; pt-pt com TODO de localização)
components/          # Header, Footer, FAQ, PlayStoreButton, TldrBlock, JsonLd…
lib/                 # constants, seo (metadata/hreflang), schema (JSON-LD)
public/              # _redirects, _headers, .well-known/assetlinks.json, favicon
```

### i18n (armadilha importante)
O `i18n` nativo do Next **não** funciona com `output: 'export'`. Aqui a localização é
feita **por segmento de rota** (`app/[lang]/…`) + dicionários + `hreflang` manual via
`alternates` no `generateMetadata`. A raiz `/` é redirecionada por
`public/_redirects` (não há página em `/`).

---

## SEO / AEO já implementado

- **HTML-first:** todo o texto é renderizado no servidor (RSC), presente no HTML estático.
- **Answer-first:** cada página tem H1 = tema, TL;DR logo abaixo, H2 = sub-perguntas e FAQ no fim.
- **Metadata por página:** title, description, canonical, Open Graph, Twitter e `hreflang` (pt-BR, pt-PT, x-default).
- **JSON-LD:** `Organization` + `WebSite` (layout); `SoftwareApplication` (produto); `Article` + `FAQPage` + `BreadcrumbList` (artigos).
- **sitemap.xml** e **robots.txt** gerados no build.

---

## ⚙️ Placeholders a preencher

| O quê | Onde | Notas |
|------|------|------|
| **Endpoint da fila de espera** | `lib/constants.ts` › `WAITLIST_ENDPOINT` | Recebe os e-mails (POST JSON `{email}`). Ver secção *Fila de espera* abaixo. |
| **Link da Play Store** | `lib/constants.ts` › `PLAY_STORE_URL` | Só é usado quando `CLOSED_BETA = false`. UTM por página automáticos. |
| **Fingerprint SHA-256** | `public/.well-known/assetlinks.json` › `<SHA256_FINGERPRINT>` | Copie do Play Console → *App signing* (Play App Signing). Pode ter mais de uma. |
| **Token Cloudflare Web Analytics** | `lib/constants.ts` › `CLOUDFLARE_ANALYTICS_TOKEN` | Privacy-first, sem cookies. Vazio = script não carrega. |
| **Imagem Open Graph (PNG)** | `public/og/og-default.png` (1200×630) | Já existe um `og-default.svg`; ver *Open Graph* abaixo. |

O favicon, o ícone e a imagem OG já vêm como SVG (a lua da marca). Substitua se quiser.

---

## 🌙 Fase de teste fechado (closed beta)

Enquanto a app está em teste fechado, **todos os CTAs abrem um diálogo de fila de
espera** (recolha de e-mail) em vez de apontarem para a Google Play. Isto é controlado
por uma única flag:

```ts
// lib/constants.ts
export const CLOSED_BETA = true;   // false → CTAs voltam a apontar para a Play Store
```

### Ligar a fila de espera a um serviço
Cole um endpoint em `WAITLIST_ENDPOINT`. O diálogo faz `POST` com `{ email, source, list }`.
Compatível com, por exemplo:
- **Formspree** — `https://formspree.io/f/xxxxxx`
- **Tally / Google Forms** — endpoint do formulário
- **Um Worker teu** que grava em KV/D1 ou reencaminha para e-mail

Se `WAITLIST_ENDPOINT` ficar **vazio**, o botão cai automaticamente para um `mailto:`
(`WAITLIST_EMAIL`) — funciona, mas o ideal é um endpoint que guarde a lista.

> Dica: mantenha esta lista sincronizada com a **lista de testadores** do teste fechado
> na Google Play Console (Testes internos/fechados → lista de e-mails).

---

## 🔎 Open Graph

A imagem de partilha vem como `public/og/og-default.svg`. **A maioria das redes sociais
não renderiza SVG** em `og:image`. Para pré-visualizações ricas, exporte um **PNG 1200×630**
(por ex. abrindo o SVG no navegador e capturando, ou via Figma/Canva), guarde em
`public/og/og-default.png` e mude a extensão em `lib/constants.ts` › `DEFAULT_OG_IMAGE`.

---

## 📈 ASO — ligação site ↔ app (Google Play)

O site foi pensado para reforçar a presença da app nas buscas e nas lojas:

- **Consistência de marca/keywords:** o site usa os mesmos termos do público-alvo
  ("diário emocional", "journaling", "diário com IA", "app para lidar com ansiedade").
  Reaproveite estes termos no **título e descrição curta/longa** da ficha da Play Store.
- **Digital Asset Links:** `public/.well-known/assetlinks.json` liga o domínio ao package
  `app.emori` (App Links). Preencha a fingerprint para os links `aemori.com` abrirem na app.
- **Deep links:** quando a app for pública, os botões passam a apontar para a Play Store
  com **UTM por página** (`utm_source=site&utm_medium=organic&utm_campaign=<pagina>`),
  o que ajuda a medir que páginas convertem em instalações.
- **Ficha da Play Store:** aponte a página de privacidade (`/pt-br/privacidade/`) no campo
  *Política de Privacidade* exigido pela Play Console.
- **Reviews/conteúdo:** os artigos do blog atraem tráfego de topo de funil (pessoas a
  pesquisar sobre journaling/ansiedade) e encaminham para a app — reforço mútuo de SEO e ASO.

---

## Deploy no Cloudflare (Workers · Static Assets)

O projeto está configurado como **Cloudflare Worker com Static Assets** (ver
`wrangler.jsonc`, que serve a pasta `./out`).

- **Comando da build:** `npm run build` *(evita o erro `next: not found`; corre o script
  que coloca `node_modules/.bin` no PATH)*
- **Comando de implantação:** `npx wrangler deploy`
- **Env var:** `NODE_VERSION = 22`
- **`name` no `wrangler.jsonc`** deve ser igual ao nome do Worker no painel.

> **Lockfile:** o `package-lock.json` **não** é versionado (é gerado no Windows e o CI do
> Cloudflare corre em Linux; `npm ci` rejeitava o lock cruzado de SO). Sem lock, o Cloudflare
> usa `npm install`, que resolve as dependências nativamente no Linux.

`public/_redirects` (raiz `/` → `/pt-br/`) e `public/_headers` são respeitados pelo
Workers Static Assets. Ligue o domínio `aemori.com` em *Custom domains* do Worker.

**Cloudflare Web Analytics:** ative em *Analytics → Web Analytics*, copie o token do
beacon e cole em `CLOUDFLARE_ANALYTICS_TOKEN`.

### Android App Links
Após colar a fingerprint em `assetlinks.json`, valide em:
`https://aemori.com/.well-known/assetlinks.json` (deve devolver JSON, HTTP 200).
Use o *Statement List Generator and Tester* da Google para confirmar.

---

## Adicionar um artigo ao blog

1. Crie `content/blog/pt-br/<slug>.tsx` exportando `{ meta, Body, faq }` (copie um existente).
2. Crie o par `content/blog/pt-pt/<slug>.tsx` (pode começar como stub com `{/* TODO: localizar PT-PT */}`).
3. Registe-o em `content/blog/index.ts` (imports + `registry` + `postOrder`).

Sitemap, hreflang e JSON-LD passam a incluí-lo automaticamente.

---

## Regra de marca
A **Emori** é sempre referida no feminino — "a Emori", "ela". Mantenha isto em todo o conteúdo.
