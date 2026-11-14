# Motor de vídeo

Um vídeo = uma pasta `projects/<id>/` com um `project.json`. Uma marca = `projects/brands/<marca>.json`.
Nada de roteiro, cores ou regras dentro de código. O dashboard (`studio/`) é só um editor destes ficheiros
que chama a MESMA CLI abaixo: não há um caminho de render paralelo, por isso o 3D sai com a qualidade de sempre.

```
npm run studio                                 # dashboard local: http://127.0.0.1:4173
npm run engine -- list
npm run engine -- check  movago-anuncio        # valida + verifica as regras da marca
npm run engine -- sheet  movago-anuncio        # folha de gravação para a voz humana
npm run engine -- build  movago-anuncio --draft       # rascunho: meia resolução, 1 processo
npm run engine -- build  movago-anuncio --no-render   # só voz + props + pacote de publicação
npm run engine -- build  movago-anuncio               # render final (qualidade total)
```

Saídas em `video3d/out/<id>/`: `.srt`, transcrição, `-publicacao.md` (descrição, hashtags, capítulos) e o `.mp4`.

## Templates

Cada template aponta para uma composição Remotion existente (registo em `engine/templates.ts`).
As composições 3D **não foram alteradas**.

| template | composição | cenas | uso |
|---|---|---|---|
| `anuncio3d` | Anuncio3D | 6 | anúncio MOVAGO (gancho, problema, solução, funcionalidades, oferta, CTA) |
| `anuncio3db` | Anuncio3DB | 7 | anúncio B (percurso e painel) |
| `rastreio3d` | Rastreio3D | 7 | rastreio para clientes finais |
| `comboio3d` | RastreioComboio3D | 7 | rastreio por comboio (TOACA) |
| `aprender3d` | Aprender3D | 7 | produto "Aprender a Bíblia" (Emori) |
| `verse3d` | Verse3D | livre | versículo 3D, narração contínua |
| `institucional` | Institucional | livre | entidades públicas e organizações; 16:9, 9:16 ou 1:1 |

Para um template novo: compor no Remotion, registar em `templates.ts`. O resto do motor não muda.

## Props e cues (o que torna o 3D reprodutível)

- `props`: valores fixos da composição (título 3D, `version`, `musicStart`…).
- `cues`: instantes que dependem do que a voz diz, ancorados a uma palavra. Ex.: no "Aprender a Bíblia"
  o toque na resposta certa acontece quando a voz diz "escolheu":

```json
{ "prop": "tapRight", "word": "escolheu", "after": { "cue": "tapHint" }, "offset": 0.15,
  "fallback": { "cue": "tapHint", "seconds": 3 } }
```

`after`/`before` limitam a procura a uma cena ou a um cue anterior; `pick: "last"`, `edge: "end"`,
`atScene` e props com ponto (`hook.reveal`) também existem. Se a palavra não aparecer, usa-se o `fallback`
e o build avisa. Como os cues seguem os tempos reais da voz, acompanham também a voz humana.

## Voz humana (sem orçamento para ElevenLabs)

1. Gravar no dashboard (botão "Gravar voz", ou "Teleprompter") ou, por ficheiro: `engine sheet <projeto>`
   gera `FOLHA-DE-GRAVACAO.md`; cada pessoa grava a(s) cena(s) e guarda em `projects/<id>/voice/<cena>.wav`.
2. `build` limpa o áudio (ffmpeg: ruído, silêncios, volume −16 LUFS), alinha as palavras e junta tudo.

`voice.mode`: `auto` (humano onde existir, senão sintético), `human` (exige todas as cenas gravadas),
`synthetic` (ignora gravações). Vozes diferentes por cena = gravações de pessoas diferentes.
Cada cena é independente: regravar uma não refaz as outras (cache em `.engine-cache/`).
A voz sintética tem o silêncio final cortado para manter o ritmo; `voice.pauseSeconds` regula a pausa entre cenas.
As gravações ficam fora do Git (`projects/*/voice/`): são voz de pessoas.

## Apresentador e mídia por cena (template institucional)

- `"presenter": "apresentador.mp4"`: vídeo da pessoa a falar. A voz da cena passa a ser o áudio desse vídeo
  (sincronia labial garantida) e o vídeo aparece no ecrã. Não se corta silêncio nesta cena, para a duração igualar a do vídeo.
  Se a cena ficar com voz sintética (`--voice=synthetic` ou ficheiro em falta), o apresentador NÃO é mostrado.
- `"media": "media/foto.jpg"`: imagem (movimento lento) ou vídeo curto (repete-se), sem áudio próprio.
- Os ficheiros ficam na pasta do projeto; o motor prepara-os em `video3d/public/media/` (fora do Git).

## Dashboard (`studio/`)

`npm run studio` e abrir http://127.0.0.1:4173. Sem dependências novas (Node `http` + HTML/JS).

- Lista de projetos, criação a partir de um template, edição de narração por cena, verificação das regras ao vivo.
- Gravação de voz (ou de apresentador em vídeo) no navegador, com medidor de nível e teleprompter.
- Fila de renders de um trabalho de cada vez (a máquina é fraca), com registo e progresso em tempo real.
- Vídeo, descrição e hashtags prontas a copiar, `.srt` e transcrição.
- Segurança: só escuta em 127.0.0.1, valida `Host` e `Origin`, ids só `[a-z0-9-]`.
- A gravação no navegador precisa de permissão de microfone/câmara (localhost conta como contexto seguro).

## Proteções (bloqueiam o build)

- `claims.forbidden` da marca: expressões que nunca se podem dizer (ex.: a Emori não tem entrada por voz/áudio).
- Institucional: números/dados numa cena exigem `source`; `entity` não pode ser o texto de exemplo;
  o render final exige `approval` (quem autorizou o conteúdo). Rascunho e `--no-render` não exigem.
- Música exige `license` e `source` documentadas; sem música o vídeo sai só com voz.
  Os vídeos 3D migrados saem sem música até haver faixa licenciada (as antigas deram Content ID).

## Limitações conhecidas

- Tempos por palavra de áudio humano são **proporcionais** (texto conhecido + duração). Bons para
  legendas curtas; se desalinharem, o ponto de troca é `alignProportional` em `voice.ts` (whisper.cpp tiny).
- O motor social (`scripts/build-social-video.ts`, vídeos 2D com filmagem do Pexels) ainda não passa pelo motor.
  Os scripts `scripts/build-*-video.ts` de 3D ficam como histórico; os projetos equivalentes estão em `projects/`.
- Edição de marcas no dashboard ainda não existe (são JSON em `projects/brands/`).
