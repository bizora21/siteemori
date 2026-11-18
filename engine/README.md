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
| `reportagem` | Reportagem | livre | vídeo pessoal em locais diferentes (ver abaixo); 9:16 por defeito |

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

## Reportagem pessoal (você em locais diferentes)

Para vídeos personalizados sem depender de lençol nem de recorte: grava-se nos locais verdadeiros, ou em voz off
sobre imagens do local. O template junta tudo com acabamento fixo:

- Cena com `"presenter"`: você em ecrã inteiro (a voz é a do vídeo, com sincronia labial).
- Cena com `"media"` (imagem ou vídeo do local) e voz off humana ou sintética.
- `"location"`: etiqueta do local na cena (só locais verdadeiros; ao apresentar um local falso engana quem vê).
- `"cutaways": [{ "media": "media/porto.jpg", "at": 1.2, "duration": 1.6 }]`: corta para imagens do local enquanto
  a voz continua (`at` = segundos desde o início da fala da cena).
- `"host": { "name", "role" }`: etiqueta de nome nos primeiros segundos. Legendas karaoke dentro da zona segura,
  barra de progresso, logótipo da marca e cartão final com a chamada para ação.
- Modelo em `projects/modelo-reportagem/` (o build é bloqueado enquanto tiver o nome ou os locais de exemplo).

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

## Telemóvel, imagens do local e música

**Gravar com o telemóvel** (duplo clique em `iniciar-estudio.bat`, ou `npm run studio -- --lan`): abre o estúdio com um QR
no ecrã; lê-se com a câmara do telemóvel (mesmo Wi-Fi). A página do telemóvel é um guia passo a passo: escolhe-se o vídeo, vê-se
o progresso e as cenas, e em cada cena define-se o **local** e uma **nota** (em reportagem também "Quem aparece").
Grava-se **dentro da página, com o texto por cima da câmara** (teleprompter com tamanho e rolagem), revê-se e envia-se; segue
sozinho para a cena seguinte. Isto precisa de HTTPS: o estúdio gera um certificado autoassinado com o `openssl` (vem com o Git), em
`.engine-cache/tls/`, e escuta em HTTPS na porta 4174 só para a rede local. Na 1.ª vez o telemóvel avisa "ligação não privada":
é o próprio PC, tocar em Avançado → Continuar. Sem `openssl` cai para HTTP e o telemóvel usa a câmara normal (o texto sai do ecrã).
Também envia fotos/vídeos do local, que entram como cortes na cena. Segurança: só IPs privados + código gerado a cada arranque;
só Wi-Fi de confiança. No computador, o botão "Carregar vídeo (telemóvel)" faz o mesmo por ficheiro.

**Imagens do local:** carregar ficheiros próprios ou procurar no Pexels (usa `PEXELS_API_KEY` de `.env.local`; a chave nunca vai
para o navegador). O crédito fica em `credits` e entra na descrição de publicação. O Pexels NÃO tem música. Uma foto de arquivo
não é o seu local: não a use sob uma etiqueta de local como se fosse real.

**Música:** só com licença que permita uso comercial. `music: { file, license, source, attribution }`; sem `license` e `source`
o motor recusa. O ficheiro vai em `projects/<id>/music/` (fora do Git: algumas licenças proíbem redistribuir as faixas).
`attribution` entra sozinha na descrição. FiftySounds (lido em 15/11/2026): uso pessoal e comercial, **atribuição obrigatória**
com link para o site, proibido revender/redistribuir; não refere TikTok/Instagram nem vídeos de governo — confirmar caso a caso.

**Fluxo no telemóvel:** vídeo → guião (progresso, quem aparece, cenas) → cena (texto, local, nota) → gravar. "Guardar e próxima
cena →" guarda o que estiver escrito e avança. Dentro do gravador, "‹ Anterior / Seguinte ›" muda de cena sem sair, e depois de
enviar fica no gravador na cena seguinte por gravar (modo contínuo). Tudo o que se envia fica no PC, em
`projects/<id>/presenter/` (vídeo), `voice/` (áudio) e `media/` (imagens do local); `project.json` guarda os textos, locais e notas.
No estúdio do PC, o cartão "Passo a passo" mostra o que falta: texto, gravações, imagens do local, música e gerar o vídeo.

## Vídeo personalizado (o tipo recomendado)

Template `reportagem`, na interface chamado "Vídeo personalizado". Em cada cena: **① o que diz** (texto), **② gravar** (opcional: no
telemóvel com o texto no ecrã, ou carregar vídeo/áudio; sem gravação usa voz sintética), **③ cenários** (imagens ou vídeos que se vêem:
carregar ou procurar no Pexels, p. ex. paisagens e animais). Regras simples:
- Vários cenários numa cena dividem-na em **partes iguais**, pela ordem (tempos à mão só no JSON avançado: `at`/`duration`).
- Com cenário, o **rosto passa a uma bolha** por cima (esconde o fundo de onde gravou, sem recortar a pessoa); sem cenário o rosto
  ocupa o ecrã; sem rosto, a voz fala sobre os cenários.
- Um vídeo 3D pode virar personalizado com "✨ Criar versão personalizada" (copia texto, vozes e música).

**Ouvir, ver e aprovar:** "🔊 Ouvir a voz" (segundos) → "🎬 Ver rascunho" → "✅ Aprovar e gerar o vídeo final". O final só se
gera a partir de um rascunho **atual** (gerado depois da última alteração); se mudar algo, o rascunho fica "desatualizado".

**Legendas de voz humana:** os tempos das palavras ancoram-se nas pausas reais da gravação (limiar adaptável ao ruído de fundo),
cada pausa ligada a uma pontuação do texto; o ar morto do início e do fim é cortado. Medido contra tempos verdadeiros numa
narração de 41 s: erro médio por palavra 0,50 s → 0,12 s. Limite: as legendas mostram o texto ESCRITO; se disser palavras
diferentes, edite o texto para coincidir (transcrever o que foi dito exigiria um modelo de reconhecimento de voz).

## Versões do mesmo vídeo

Um projeto pode ser gerado de várias maneiras, cada uma com o seu rascunho, a sua aprovação e o seu ficheiro final
(`video3d/out/<id>--<versão>.mp4`). O texto, as gravações e os cenários são partilhados (a voz não é processada outra vez).

```
npm run engine -- build meu-video --version=foto --draft      # rascunho da versão "foto"
npm run engine -- build meu-video --version=voz --no-render   # só voz + props da versão "voz"
```

| versão | o que muda |
|---|---|
| `rosto` | o rosto gravado (bolha sobre os cenários, ou ecrã inteiro) |
| `foto` | a sua **foto numa bolha que pulsa com a voz** (só precisa de gravar a voz) |
| `voz` | sem rosto nem foto: voz e legendas sobre os cenários |
| `horizontal` | formato 16:9 |

Em `project.json` pode acrescentar ou alterar versões: `"versions": { "curto": { "label": "…", "faceMode": "none", "aspect": "1:1" } }`.
No estúdio, o seletor "Versão" fica ao lado dos botões Ouvir / Rascunho / Aprovar, e cada versão é aprovada à parte.

**Foto animada pela voz** (`faceMode: "photo"` + `avatar`): a foto reage ao volume da voz com anéis e um pequeno movimento. Não anima
a boca nem finge que a pessoa fala (não é um avatar de IA). A foto fica em `projects/<id>/avatar.*`, fora do Git. O volume da voz
segue a fala (medido: 0,54 nas palavras contra 0,08 nas pausas numa gravação real).

## Vídeo institucional ou de campanha (cartazes + rosto + dados do evento)

Para promover um evento (marcha, campanha, formação) com cartazes seus e o rosto de quem convida:
- **Cartazes e imagens com texto:** em cada imagem marque "Cartaz (inteira)" (`"fit": "contain"` num cenário, ou `mediaFit` no fundo da
  cena). A imagem aparece INTEIRA, sem corte nem zoom, numa zona própria; enquanto está no ecrã, o rosto encolhe e desce para não a tapar
  (vertical 9:16). Cada cartaz precisa de ≈ 3 s para ser lido (o motor avisa se aparecer menos). Desenhe-os em 4:5 (1080×1350) ou 9:16.
- **Cartão do evento:** `"event": { "title", "date", "time", "place", "contact", "note" }` mostra, nos últimos ~5 s, um cartão com
  título, data e hora, local, contacto e a chamada para a ação. Escreva só o que está confirmado.
- Estrutura sugerida: ① rosto em ecrã inteiro (convite, 5–8 s) → ② cartazes com o rosto em bolha (porquê / vantagens) → ③ rosto + cartão do evento.
- Limite: o arranjo "cartaz + bolha" está afinado para vertical; em horizontal o cartaz aparece inteiro mas a bolha não se reposiciona.
- Conteúdo sensível (violência, saúde, política): nada de números sem fonte, e uma pessoa responsável da organização deve aprovar o rascunho antes do final.

## Flexibilidade: o que bloqueia e o que só avisa

Regra de ouro: **o rascunho nunca é bloqueado**; serve para rever. O motor avisa e segue.
- **Só bloqueiam o vídeo FINAL** (num rascunho viram avisos): afirmações proibidas da marca, texto de exemplo por preencher
  ("Escreva aqui…", etiqueta "Local 1", entidade de exemplo), dados sem fonte em institucionais.
- **Nunca bloqueiam, só avisam:** cena sem gravação (usa voz sintética), nome de exemplo ("Seu nome", é ignorado), cenário, foto, rosto ou
  música cujo ficheiro foi apagado ou mudou de sítio (o vídeo sai sem eles).
- **Voz:** `human` = preferir gravações (as cenas sem gravação usam sintética); `human-only` = exigir gravações em todas as cenas (só
  se for mesmo isso que quer). `auto` e `synthetic` como antes.
- Uma falha aparece **na página**, em vermelho, com o motivo e o que fazer; um trabalho que gerou com avisos mostra-os a amarelo.
- "Aprovar" fica bloqueado enquanto houver ✗ por corrigir (e sem um rascunho atual).

## Legendas: ligar e desligar

O interruptor **"Legendas"** (ao lado de Guardar, no estúdio) liga/desliga as legendas no vídeo (`"captions": false` no projeto). O
ficheiro `.srt` e a transcrição continuam a ser gerados, para as plataformas. A versão predefinida **"Sem legendas"** gera o mesmo
vídeo sem elas, à parte (`--version=semlegendas`), para comparar. Vale para todos os tipos de vídeo, incluindo os 3D.

## Cenários que entram numa palavra, vídeos e descarregamentos

- **"Quando digo esta palavra":** em cada cenário, o botão ⏱ abre o texto da cena e escolhe-se a palavra em que ele entra
  (`"atWord": n` no JSON). Cada cenário fica até o seguinte entrar; o último, até ao fim da fala da cena. Os tempos vêm das palavras
  reais da voz (medido: diferença de 0,00 s). Sem escolha, os cenários dividem a cena em partes iguais. O motor avisa se um cenário
  ficar menos de 1,2 s (palavra demasiado perto do fim) ou se um cartaz ficar menos de 3 s.
- **Vídeos como cenário:** tocam **sem o som deles** (a voz é sempre a faixa principal), enchem o ecrã (cortam as margens, ou ficam inteiros
  com "Cartaz"), repetem-se se forem curtos e podem começar a partir de um segundo (`"startFrom": s`). Um vídeo de uma pessoa a caminhar
  é só mais um clip mudo por baixo da voz; o rosto de quem fala vem do ② Gravar.
- **Pexels em segundo plano:** os vídeos descarregam a poucos KB/s (um de 14 MB levou ~12 min). O estúdio responde logo (202), mostra a
  percentagem e deixa continuar a trabalhar; se falhar, diz porquê. As fotos descarregam em segundos. O projeto é relido no fim, por isso
  edições feitas durante o descarregamento não se perdem (a versão anterior apagava-as).
- **Render:** usa uma pasta `public` mínima em `.engine-cache/render-public/<id>/` (fontes, logótipos e só os ficheiros do vídeo) e um limite de
  3 min para abrir o navegador. Antes, o Remotion copiava dezenas de MB de todos os vídeos e falhava com "Timed out after 30000 while setting
  up the headless browser". Nada se apaga de `video3d/public`.

## Tipos de cena (como o motor percebe cada cena)

O tipo escolhe-se no cartão da cena ("Tipo de cena") e determina de onde vem o som e o que aparece:

| tipo | o que é | som | texto e legendas |
|---|---|---|---|
| 🎙 **Narrada** (por defeito) | texto + voz + cenários por baixo | a sua gravação (②), ou a voz **sintética** se não houver gravação | sim |
| 🎬 **Cena real** (`"kind": "clip"`) | um vídeo seu, em ecrã inteiro | o **som original do vídeo** (só se acerta o volume a −16 LUFS; sem limpar ruído) | não |

- Num vídeo carregado em **③ Cenários** o som é sempre retirado (serve de imagem por baixo da voz). Para manter o som, use "Cena real".
- Numa cena real sem vídeo, a cena fica 1,5 s em silêncio e há um aviso; um vídeo sem pista de áudio fica em silêncio, com aviso.
- Em "Cena real" não entram a foto animada nem o rosto em bolha: o vídeo ocupa o ecrã.
- Em `project.json`: `{ "id": "marcha", "kind": "clip", "presenter": "presenter/marcha.mp4" }` (a narração é opcional e ignorada).

## Acabamento comercial (reportagem)

Tudo opcional, leve (sem GPU) e escolhido no cartão "✨ Acabamento" do estúdio, ou no `project.json`:

```json
"style": { "look": "cinema", "transition": "zoom", "captionStyle": "destaque", "vignette": true, "grain": true },
"audio": { "master": true, "ducking": true }
```

- `look`: natural, cinema, quente, frio, vivo, suave (filtro de cor só nas imagens/vídeos, nunca no texto).
- `transition`: fade (por defeito), deslizar, zoom, cortina.
- `captionStyle`: karaoke (por defeito), limpo (caixa escura), destaque (palavra em cápsula).
- `vignette` e `grain`: aspeto de cinema (o grão usa `video3d/public/grain.png`, criado sozinho e ignorado pelo Git).
- Som: a música baixa enquanto se fala e sobe nas pausas (`ducking`); no fim, o som é masterizado a −14 LUFS (2 passagens, voz limpa e compressão suave) e fica um `<id>-qualidade.md` com resolução, débito, volume e pico.
- Final renderizado com CRF 17 e som a 192 kb/s.
- Assinatura (identificação profissional): só na cena onde a pessoa fala, com `signature.at`/`seconds` manuais.

Limites honestos: sem avatar com lábios sincronizados, sem recorte de pessoa e sem vídeo gerado por IA (exigem GPU).

## Treinador de qualidade

`engine/coach.ts` analisa o projeto (reportagem) e devolve uma pontuação e uma lista do que falta: cenários por cena (um a cada ~4 s), cenas sem imagens, cartazes com pouco tempo, imagens pequenas ou que vão ser cortadas, voz sintética, rosto, música, acabamento, legendas e duração. Aparece no topo da página do estúdio ("Qualidade do vídeo") e nunca bloqueia nada.

## Editor com linha do tempo e estabilização

- O estúdio abre os vídeos de reportagem num **editor**: barra de cima (desfazer/refazer, guardar, qualidade, ver rascunho, publicar), ferramentas à esquerda, ecrã com pré-visualização, painel do que está escolhido e a linha do tempo por baixo (cenas e voz, vídeo e fotos, texto e emojis, música, efeitos). A página antiga continua em "Modo lista".
- Arrastar e soltar: mover blocos, puxar as pontas (início e duração), trocar a ordem das cenas; os blocos "colam" nas bordas dos outros e no cursor.
- `stabilize: 'leve' | 'forte'` no projeto estabiliza os vídeos tremidos (filtro `deshake` do ffmpeg, uma passagem). O `vidstab` não é usado porque no Windows corrompe o ficheiro de movimento. 'leve' ≈ 1× a duração do vídeo, 'forte' ≈ 1,7×.

## Transi��es premium e paletas de gradiente

- `style.transition`: fade (fundido cruzado), deslizar, empurrar, zoom, cortina, iris (c�rculo), diagonal, persiana, giro, flash. O plano novo entra **por cima** do anterior (sobreposi��o), por isso n�o h� "buracos" pretos. `style.transitionSpeed`: rapida (0,2 s), normal (0,33 s), lenta (0,6 s).
- `style.palette`: ouro, oceano, por-do-sol, floresta, rosa, aurora, noite, terra. Muda o fundo (gradiente), os destaques, as legendas, a barra de progresso e os bot�es. `style.wash`: 'suave' | 'forte' = pel�cula de cor (duotone) por cima das imagens.
- Os textos da linha do tempo t�m o estilo `gradiente` (letras com o gradiente da paleta).
- O editor mostra a paleta, a pel�cula e a transi��o (ao tocar) na pr�-visualiza��o.

## Escolher a voz sint�tica

`voice.name` no projeto (ex.: `pt-PT-DuarteNeural`) escolhe a voz do Edge TTS; sem nome usa a da marca/idioma. `voice.rate` (ex.: `+10%`) muda a velocidade. O est�dio lista as vozes (`GET /api/voices`, vindas da Microsoft: portugu�s de Portugal e do Brasil e as multilingues) e toca amostras (`GET /api/voices/preview`). As grava��es suas t�m sempre prioridade; sem internet o motor cai na voz offline Piper.
