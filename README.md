# aemori.com — site institucional da Emori

Site estático (marketing + páginas legais) da **Emori**, um diário emocional com IA
para o mercado lusófono. Bilingue **PT-BR** (primária) e **PT-PT**, otimizado para SEO
tradicional e para motores de resposta com IA (AI Overviews, ChatGPT, Perplexity).

- **Stack:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Export:** estático (`output: 'export'` → pasta `out/`)
- **Deploy alvo:** Cloudflare Pages
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

## ⚙️ Placeholders a preencher antes do deploy

| O quê | Onde | Notas |
|------|------|------|
| **Link da Play Store** | `lib/constants.ts` › `PLAY_STORE_URL` | UTM por página são acrescentados automaticamente. |
| **Fingerprint SHA-256** | `public/.well-known/assetlinks.json` › `<SHA256_FINGERPRINT>` | Copie do Play Console → *App signing* (Play App Signing). Pode ter mais de uma. |
| **Token Cloudflare Web Analytics** | `lib/constants.ts` › `CLOUDFLARE_ANALYTICS_TOKEN` | Privacy-first, sem cookies. Vazio = script não carrega. |
| **Imagem Open Graph** | `public/og/og-default.png` (1200×630) | Referenciada em `lib/constants.ts` › `DEFAULT_OG_IMAGE`. |
| **Logo** | `public/icon-512.png` | Usada no JSON-LD (`Organization`, `Article`). |

O favicon já vem como `public/favicon.svg` (substitua se quiser).

---

## Deploy no Cloudflare Pages

1. Faça push do repositório para o GitHub/GitLab.
2. No dashboard Cloudflare → **Workers & Pages** → **Create** → **Pages** → *Connect to Git*.
3. Configuração de build:
   - **Framework preset:** Next.js (Static HTML Export) — ou "None".
   - **Build command:** `next build`
   - **Build output directory:** `out`
   - **Environment variable:** `NODE_VERSION = 20`
4. Deploy. O Cloudflare aplica automaticamente `public/_redirects` e `public/_headers`.
5. **Domínio:** em *Custom domains*, adicione `aemori.com` (e `www` se quiser). Se o
   DNS já está na Cloudflare, o registo é criado automaticamente; confirme que
   `aemori.com` aponta para o projeto Pages.
6. **Cloudflare Web Analytics:** ative em *Analytics → Web Analytics*, copie o token do
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
