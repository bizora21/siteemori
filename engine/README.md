# Motor de vídeo

Um vídeo = uma pasta `projects/<id>/` com um `project.json`. Uma marca = `projects/brands/<marca>.json`.
Nada de roteiro, cores ou regras dentro de código — o dashboard futuro será só um editor destes ficheiros.

```
npm run engine -- list
npm run engine -- check  movago-anuncio        # valida + verifica as regras da marca
npm run engine -- sheet  movago-anuncio        # folha de gravação para a voz humana
npm run engine -- build  movago-anuncio --draft       # rascunho: meia resolução, 1 processo
npm run engine -- build  movago-anuncio --no-render   # só voz + props + pacote de publicação
npm run engine -- build  movago-anuncio               # render final
```

Saídas em `video3d/out/<id>/`: `.srt`, transcrição, `-publicacao.md` (descrição, hashtags, capítulos) e o `.mp4`.

## Voz humana (sem orçamento para ElevenLabs)

1. `engine sheet <projeto>` gera `FOLHA-DE-GRAVACAO.md` com o texto de cada cena e o nome do ficheiro.
2. Cada pessoa grava a(s) sua(s) cena(s) no telemóvel e guarda em `projects/<id>/voice/<cena>.wav` (ou m4a/mp3).
3. `build` limpa o áudio (ffmpeg: ruído, silêncios, volume −16 LUFS), alinha as palavras e junta tudo.

`voice.mode` no projeto: `auto` (humano onde existir, senão sintético), `human` (exige todas as cenas
gravadas), `synthetic` (ignora gravações). Vozes diferentes por cena: gravações de pessoas diferentes.
Cada cena é independente: regravar uma não refaz as outras (cache em `.engine-cache/`).

As gravações ficam fora do Git (`projects/*/voice/`): são voz de pessoas.

## Apresentador e mídia por cena (template institucional)

- `"presenter": "apresentador.mp4"`: vídeo da pessoa a falar. A voz da cena passa a ser o áudio desse vídeo
  (sincronia labial garantida) e o vídeo aparece no ecrã. Não se corta silêncio nesta cena, para a duração igualar a do vídeo.
  Se a cena ficar com voz sintética (`--voice=synthetic` ou ficheiro em falta), o apresentador NÃO é mostrado.
- `"media": "media/foto.jpg"`: imagem (movimento lento) ou vídeo curto (repete-se), sem áudio próprio.
- Os ficheiros ficam na pasta do projeto; o motor prepara-os em `video3d/public/media/` (fora do Git).

## Templates

| template | uso | notas |
|---|---|---|
| `anuncio3d` | anúncios 9:16 (MOVAGO, TOACA) | exatamente 6 cenas |
| `institucional` | entidades públicas e organizações | 16:9, 9:16 ou 1:1; sóbrio; fonte e aviso legal sempre visíveis |

## Proteções (bloqueiam o build)

- `claims.forbidden` da marca: expressões que nunca se podem dizer (ex.: a Emori não tem voz/áudio).
- Institucional: números/dados numa cena exigem `source`; `entity` não pode ser o texto de exemplo;
  o render final exige `approval` (quem autorizou o conteúdo). Rascunho e `--no-render` não exigem.
- Música exige `license` e `source` documentadas; sem música o vídeo sai só com voz.

## Limitações conhecidas

- Tempos por palavra de áudio humano são **proporcionais** (texto conhecido + duração). Bons para
  legendas curtas; se desalinharem, o ponto de troca é `alignProportional` em `voice.ts` (whisper.cpp tiny).
- Só os templates `anuncio3d` e `institucional` passam pelo motor. Os scripts `scripts/build-*-video.ts`
  e o motor social (`build-social-video.ts`) continuam a funcionar e ainda não foram migrados.
