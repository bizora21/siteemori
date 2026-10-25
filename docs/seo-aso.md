# SEO + ASO da Emori — plano de tráfego

Objetivo: transformar o blog em máquina de aquisição: **busca/Discover → artigo → Google Play (app.emori)**.

## 1. O funil

| Etapa | Peça | Medição |
|---|---|---|
| Descoberta | Artigos de intenção alta (Salmo 91, Salmo 23, “como orar”) + Google Discover + Pinterest/TikTok | Search Console (impressões, CTR), Discover |
| Confiança | Autora (Ana Branca Cardoso), método editorial, fontes bíblicas à vista | Tempo na página, páginas/sessão |
| Conversão | CTA no fim do artigo + CTA na página da autora, UTM `blog_<slug>` | GA4: clique → Play Store |
| Instalação | Ficha da Play alinhada com as palavras dos artigos (ASO) | Play Console: aquisição por UTM, taxa de conversão da ficha |

## 2. O que já está feito no código

- **E-E-A-T**: página da autora `/pt-br|pt-pt/autora/ana-branca-cardoso/`, byline com `rel="author"` em todos os artigos, caixa de autora no fim, `Person` + `ProfilePage` + `ItemList` em JSON-LD, `Article.author` passou de Organization para Person (`@id` estável).
- **Discover**: `max-image-preview:large` (já havia), capas ≥1200px de largura, `article:author`, `article:modified_time` quando existe `dateModified`.
- **Indexação**: página da autora no sitemap (hreflang pt-BR/pt-PT/x-default), blog e artigos com prioridade maior, `ItemList` + breadcrumb no índice do blog, `llms.txt` para motores de resposta com IA.
- **ASO ↔ site**: `site.webmanifest` com `related_applications` (Play, `app.emori`) e `prefer_related_applications:false`, para o Chrome Android poder sugerir a app sem bloquear a PWA. Digital Asset Links já validado.

## 3. Alinhamento ASO ↔ SEO (a regra de ouro)

A Play indexa título, descrição curta e descrição longa. As **mesmas palavras** que trazem tráfego ao blog devem estar na ficha. Mapa:

| Intenção de pesquisa | Artigo (SEO) | Onde aparece na ficha da Play |
|---|---|---|
| salmo 91, salmo 23, salmos | salmo-91-explicado, salmo-23-explicado | Descrição longa: “Salmos explicados” |
| como orar, oração da manhã/noite | como-orar-iniciantes, oracao-da-manha, oracao-da-noite | Título/short description: “oração” |
| versículos de conforto/ansiedade | versiculos-* | Descrição longa: bloco “versículo do dia” |
| diário de oração | diario-de-oracao | Short description: “registre as suas orações” |
| grupo/corrente de oração | grupo-de-oracao-comunidade, intercessao-o-que-e | Descrição longa: “comunidade de oração” |

Sugestão de textos (ajustar ao que a app faz **hoje**; não prometer voz/áudio, que a app não tem):

- **Título (30 car.)**: `Emori: Oração e Versículos`
- **Descrição curta (80 car.)**: `Ore todos os dias, receba versículos e ore com uma comunidade cristã.`
- **Descrição longa**: abrir com as palavras “oração”, “versículos bíblicos”, “Salmos”, “comunidade cristã”, “diário de oração”; repetir cada uma 3-5 vezes de forma natural; citar `aemori.com` e o blog; terminar com chamada à ação.
- **Palavras-chave a cobrir**: oração, orar, versículo do dia, bíblia, salmos, devocional, diário de oração, comunidade cristã, intercessão.

## 4. Passos manuais (fora do código)

1. **Search Console**: submeter `https://aemori.com/sitemap.xml`, pedir indexação de `/pt-br/blog/salmo-91-explicado/` e da página da autora.
2. **Play Console → Ficha**: aplicar os textos acima; no campo “Site” usar `https://aemori.com/pt-br/`; criar variantes de ficha (Custom Store Listings) para tráfego do blog com a URL `&listing=` e screenshots dos Salmos/versículos.
3. **Play Console → Estatísticas de aquisição**: ver instalações por UTM `blog_*`.
4. **Pinterest/TikTok**: cada artigo novo = 1 pin com a capa + 1 vídeo curto (pipeline `npm run go`), sempre com link para o artigo, não direto para a Play.
5. **Perfil Google da autora**: criar perfis reais (Instagram, etc.) e acrescentar a `sameAs` em `lib/schema.ts` → `personSchema`.

## 5. Ritmo editorial (para manter o Discover)

- 2 artigos/semana, capa horizontal ≥1200px, título curioso mas honesto (nada de clickbait: o Discover penaliza).
- Cluster por Salmo: 91 ✅, 23 ✅, a seguir 121, 46, 27, 51, 139, 150 + “Salmos para cada emoção”.
- Atualizar `dateModified` ao rever artigos antigos (o sitemap usa-o).

## 6. Aviso importante sobre a autora

A foto de Ana Branca Cardoso é uma imagem gerada por IA (StyleGAN2; a marca d'água foi cortada) e o perfil é uma persona editorial. As políticas do Google sobre autoria falsa e a confiança dos leitores pedem **transparência**: assim que houver uma pessoa real a assinar (ou revisar) os textos, trocar a foto/bio em `lib/authors.ts` e `public/autores/`. Não acrescentámos diplomas, livros, anos de ministério ou ordenação inventados.
