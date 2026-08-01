# Pipeline de distribuição de conteúdo (Emori)

Transforma cada **artigo** (a peça-mãe) em **variações por formato** para redes sociais,
com **links rastreáveis (UTM)** e **atribuição de instalação** — vive dentro do repo
`siteemori`, reaproveitando o `meta` dos artigos já commitados. Sem LLM, sem custo variável.

## Objetivo
Trazer **utilizadores que instalem a Emori** — não alcance. Por isso cada peça termina
num CTA + link rastreável, e o botão da Play propaga o UTM para o *install referrer*.

---

## Fluxo

```
Artigo (content/blog/**.tsx)  ──►  manifest.json  ──►  adapt (templates)  ──►  social/<slug>/<lang>/
       meta: title/tldr/faq/hero        fonte limpa        determinístico          assets prontos a publicar
```

### Comandos
```bash
npm run social:manifest   # gera content/blog/manifest.json a partir do registo de artigos
npm run social:assets     # gera social/<slug>/<lang>/ (todos os artigos)
npm run social            # os dois acima

# um artigo/idioma:
npm run social:assets -- --slug=diario-de-gratidao --lang=pt-br
```

### O que sai por artigo/idioma (`social/<slug>/<lang>/`)
- `tiktok.txt`, `youtube.txt` — **script de vídeo 30–60s** (gancho 3s + 3 pontos da FAQ + CTA) + legenda
- `pinterest.txt` — título curto + descrição keyword + imagem do Pin (capa Unsplash)
- `facebook.txt` — post curto (2–3 frases originais, nunca o artigo inteiro) + link
- `links.json` — links com UTM por plataforma
- `README.md` — o que publicar onde

> A pasta `social/` é **gitignored** (derivada) — regenera com `npm run social`.
> O `manifest.json` **é** versionado (fonte estável).

---

## UTM e atribuição de instalação

**Links sociais (medido no GA4):**
```
utm_source   = plataforma (tiktok | youtube | facebook | pinterest)
utm_medium   = social
utm_campaign = slug do artigo        ← que artigo converte
utm_content  = formato (video | pin | post)
```

**Instalações por canal (o que interessa):** quando o visitante chega por um link social,
o `CtaButton` lê o UTM da URL e **propaga-o para o parâmetro `referrer` do link da Play**
(`lib/play.ts`) — que é o que o Google Play lê via *Install Referrer API*. Assim consegues
ver, no **Play Console → Aquisição**, que canal/artigo trouxe cada instalação (não só visitas).

> ⚙️ Do lado da app (Expo), é preciso implementar a **Play Install Referrer API** para ler
> esse referrer. O site já o envia; a app tem de o capturar.

---

## Plano faseado

| Fase | O quê | Estado |
|---|---|---|
| **1** | manifest + adaptação determinística + assets + UTM + atribuição | ✅ feito |
| **2** | **Pin em PNG** in-house (SVG→PNG via resvg + fonte empacotada) | ✅ feito |
| **3** | **Disparo automático** (GitHub Action no push a `content/blog/**/*.tsx`) | ✅ feito |
| **4** | **Publicação** via API do Zernio (dry-run por defeito) | ✅ feito |
| **5** | **Vídeo in-house** (SVG→cenas→ffmpeg, 1080×1920) | ✅ feito |

**Fase 5 — vídeo sem serviços externos.** `npm run social:video -- --slug=… --lang=…`
gera `video.mp4` (vertical, ~32s): gancho → 3 perguntas da FAQ → CTA, na paleta da marca,
com fades e música de fundo. Optámos por vídeo de texto em vez de avatar-IA (HeyGen):
zero custo, sem limites de tier, e mais autêntico para o nicho de bem-estar.

> 🎵 **Música:** coloca a tua faixa em `assets/audio/calm.mp3`. Está **gitignored** —
> a Pixabay Content License permite *usar* a faixa, mas **não redistribuir o ficheiro**
> autonomamente (o que um repo público faria). Sem o ficheiro, o vídeo gera-se em silêncio.
> Por isso o vídeo é gerado **localmente**, não no CI.

**Fase 2/3 na prática:** a Action `\.github/workflows/social.yml` corre `npm run social`
em cada artigo novo e publica `social/` como **artefacto descarregável** (30 dias). A fonte
serifada vive em `assets/fonts/` (OFL) para o Pin renderizar igual no CI.

---

## Fase 4 — integração Zernio (notas da API real)

Base: `https://zernio.com/api/v1` · Auth: `Authorization: Bearer <ZERNIO_API_KEY>`

- **Criar/agendar post:** `POST /post` com
  `{ profileId, text, socialAccountIds: [...], scheduledAt?, media? }`.
- **Multi-plataforma numa só chamada** via `socialAccountIds` (cada ID = conta ligada
  a uma plataforma). Mas como os **formatos diferem** (vídeo vs pin vs post), agrupar
  **uma chamada por formato** (ex.: vídeo → contas TikTok+YouTube; pin → Pinterest;
  post → Facebook).
- **Media:** `POST /media` (upload/presign de imagem/vídeo) → anexar ao post.
- **Rate limits a respeitar:** 60 req/min (0–2 contas); velocidade 25 posts/h por conta;
  caps diários por plataforma (Pinterest 25/dia, FB/IG 100/dia). Publicamos ~1 artigo por
  vez → folgado, mas o adaptador deve ler os headers `X-RateLimit-*` e recuar se preciso.
- **TikTok:** o URL público resolve-se de forma assíncrona (webhook `post.tiktok.url_resolved`).

### Publisher (`npm run social:publish`)

```bash
# DRY-RUN (por defeito) — mostra o que seria publicado, sem publicar:
npm run social:publish -- --slug=diario-de-gratidao --lang=pt-br

# publicar a sério:
npm run social:publish -- --slug=diario-de-gratidao --lang=pt-br --live

# agendar:
npm run social:publish -- --slug=… --lang=… --live --schedule=2026-08-05T09:00:00Z
```

Contrato real (verificado no OpenAPI):
- `POST /media/upload-direct` (multipart) → `{ url }` — máx. 25 MB, expira em 7 dias.
- `POST /posts` → `{ content, mediaItems[], platforms[], publishNow | scheduledFor }`
  - `platforms[].platformSpecificData` (Pinterest): `{ title (≤100), boardId, link }` —
    o `link` é o **destino do Pin**, onde entra o nosso URL com UTM.
- **Idempotência:** header `x-request-id` (UUID por chamada) + dedup por hash de conteúdo
  (HTTP **409** se repetires o mesmo conteúdo em 24h — o publisher trata isso como "ignorado").
- Lê `X-RateLimit-Remaining` e avisa quando está a esgotar.

**Segredos** (`.env.local` local · GitHub Secrets no CI): `ZERNIO_API_KEY`,
`ZERNIO_ACCOUNTS` (JSON plataforma→id), `ZERNIO_PINTEREST_BOARD_ID`.

---

## O que configuras (fora do código)
- **Contas Business:** Pinterest, TikTok, Facebook (Página), YouTube (canal) — ligadas no Zernio (OAuth).
- **Secrets no GitHub (`bizora21/siteemori`):** `ZERNIO_API_KEY`, `ZERNIO_PROFILE_ID`,
  os `socialAccountIds` por plataforma, e (Fase 5) `HEYGEN_API_KEY`.
- **GA4/Play Console:** confirmar o esquema de UTM acima (aprovado).
- **App (Expo):** Play Install Referrer API para ler o `referrer` (fecha a atribuição).
