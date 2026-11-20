// Contrato de dados do motor de vídeo. Um vídeo = um "projeto" (JSON) + uma
// "marca" (JSON). Nada de roteiro ou cores dentro de código: o dashboard futuro
// é apenas um editor destes ficheiros.

export type Locale = 'pt-br' | 'pt-pt';
export type Aspect = '9:16' | '16:9' | '1:1';
import { TEMPLATES, TEMPLATE_IDS, type TemplateId } from './templates';
export type { TemplateId };

/** Regras de conteúdo da marca: o que se pode e o que nunca se pode afirmar. */
export interface Claims {
  /** Afirmações verificadas (documentação; o roteiro deve limitar-se a elas). */
  approved: string[];
  /** Expressões proibidas (regex, sem distinguir maiúsculas). Bloqueiam o build. */
  forbidden: { pattern: string; reason: string }[];
}

export interface Brand {
  id: string;
  name: string;
  locale: Locale;
  site: string;
  cta: string;
  colors: { bg: string; accent: string; text: string };
  /** Ficheiro em video3d/public/ (opcional). */
  logo?: string;
  hashtags: string[];
  claims: Claims;
}

export interface Scene {
  /** Identificador estável: dá nome ao ficheiro de gravação (voice/<id>.wav). */
  id: string;
  narration: string;
  /** Título curto no ecrã (institucional). */
  title?: string;
  /** Fonte do dado ou da afirmação (obrigatória em institucional se houver números). */
  source?: string;
  /** Gravação humana desta cena (caminho relativo à pasta do projeto). */
  audio?: string;
  /**
   * "clip" = CENA REAL: o vídeo (em `presenter`) entra com o SEU PRÓPRIO som, sem narração nem legendas (ex.: imagens
   * de uma marcha, uma entrevista). Por defeito a cena é narrada: texto + voz (gravada ou sintética).
   */
  kind?: 'clip';
  /** Voz sintética só desta cena (ex.: pt-PT-DuarteNeural); sem isto usa a do projeto. */
  voiceName?: string;
  /** Como a pessoa aparece nesta cena (sobrepõe o `person` do projeto). */
  person?: PersonLayout;
  /**
   * Assinatura no ecrã, SÓ nesta cena (opcional, para onde a pessoa aparece a falar): nome, função e uma linha extra
   * (ex.: o registo profissional). Escreva só o que é verdade e o que quer mostrar. `at` (s desde o início da cena,
   * por defeito 0,3) e `seconds` (por defeito 5) ajustam quando entra e quanto dura.
   */
  signature?: { name: string; role?: string; extra?: string; at?: number; seconds?: number };
  /** Nome da pessoa que grava (informativo: aparece na folha de gravação). */
  voice?: string;
  /**
   * Apresentador: vídeo da pessoa a falar (relativo à pasta do projeto). A voz
   * da cena passa a ser o áudio deste vídeo e o vídeo aparece no ecrã, em
   * sincronia labial garantida. Só no template institucional.
   */
  presenter?: string;
  /** Imagem ou vídeo ilustrativo da cena (relativo à pasta do projeto). Só no institucional. */
  media?: string;
  /** Como mostrar o cenário de fundo da cena (ver Cutaway.fit). */
  mediaFit?: 'cover' | 'contain';
  /** Reportagem: local mostrado na etiqueta desta cena (ex.: "Maputo · Baixa"). Só afirme locais verdadeiros. */
  location?: string;
  /** Nota de gravação: onde, que plano, o que mostrar. Aparece na folha de gravação, no teleprompter e no telemóvel. */
  shot?: string;
  /** Reportagem: imagens/vídeos do local que cobrem o ecrã enquanto a voz continua. */
  cutaways?: Cutaway[];
}

export interface Cutaway {
  /** Ficheiro na pasta do projeto. */
  media: string;
  /**
   * Segundos desde o início da fala da cena em que entra, e quanto dura. Opcionais: se NENHUM
   * cenário da cena tiver `at`, o motor reparte a cena em partes iguais (o mais simples).
   */
  at?: number;
  duration?: number;
  /**
   * "cover" (por defeito) enche o ecrã e corta as margens; "contain" mostra a imagem INTEIRA (para
   * cartazes e imagens com texto), sem zoom, e arruma o rosto e as legendas fora dela.
   */
  fit?: 'cover' | 'contain';
  /**
   * O cenário entra quando a pessoa diz esta palavra (posição da palavra no texto da cena, a partir de 0) e
   * fica até ao cenário seguinte. É a forma mais natural: "mostro a montanha quando digo montanha".
   */
  atWord?: number;
  /** Se for um vídeo: começa a tocar a partir deste segundo do ficheiro (por defeito 0). */
  startFrom?: number;
  /** Como este cenário entra (sobrepõe a transição do vídeo todo); 'corte' = sem transição. */
  transition?: 'fade' | 'deslizar' | 'zoom' | 'cortina' | 'empurrar' | 'iris' | 'diagonal' | 'giro' | 'flash' | 'persiana' | 'corte';
}

/** Dados de um evento (marcha, campanha…): aparecem num cartão no fim do vídeo. */
export interface EventInfo {
  title: string;
  date?: string;
  time?: string;
  place?: string;
  contact?: string;
  /** Uma linha extra (ex.: "Entrada livre"). */
  note?: string;
}

/**
 * Origem da voz.
 *  - auto:      usa a gravação humana de cada cena se existir; senão sintetiza.
 *  - auto:       usa a gravação humana de cada cena se existir; senão sintetiza.
 *  - human:      prefere a voz humana; cenas sem gravação usam voz sintética, com um aviso (não bloqueia).
 *  - human-only: exige gravação humana em TODAS as cenas (erro se faltar alguma). Só para quem quer mesmo isso.
 *  - synthetic:  ignora gravações e sintetiza (Edge TTS → Piper).
 */
export type VoiceMode = 'auto' | 'human' | 'human-only' | 'synthetic';

export interface Music {
  /** Ficheiro em projects/<id>/music/ (ou, em alternativa, em video3d/public/). */
  file: string;
  /** Crédito obrigatório da faixa (ex.: "Música: FiftySounds — www.fiftysounds.com/pt/"). Entra sozinho na descrição. */
  attribution?: string;
  /** Sem licença documentada o motor recusa a faixa (já houve bloqueio por Content ID). */
  license: string;
  source: string;
}

export interface Institutional {
  /** Entidade que assina o vídeo (aparece no cabeçalho). */
  entity: string;
  department?: string;
  /** Aviso legal/rodapé permanente. */
  disclaimer?: string;
}

/** Autorização de conteúdo. Obrigatória para renderizar vídeos institucionais. */
export interface Approval {
  by: string;
  date: string;
  reference?: string;
}

/**
 * Instante-chave ancorado a uma palavra da voz (ver cues.ts). Dá valor a uma prop
 * da composição (aceita caminhos com ponto, ex.: "hook.reveal").
 */
export interface Cue {
  prop: string;
  /** Palavra falada a procurar (sem distinguir acentos/maiúsculas). */
  word?: string;
  /** Alternativa à palavra: o início de uma cena (índice, a partir de 0). */
  atScene?: number;
  /** Procurar só depois do início de uma cena ou do valor de um cue anterior. */
  after?: { scene?: number; cue?: string };
  /** Procurar só antes do início de uma cena. */
  before?: { scene?: number };
  /** Se há várias ocorrências: a primeira (por defeito) ou a última. */
  pick?: 'first' | 'last';
  /** Início (por defeito) ou fim da palavra. */
  edge?: 'start' | 'end';
  /** Segundos somados ao instante encontrado. */
  offset?: number;
  /** Valor de reserva se a palavra não aparecer: absoluto, ou base (cena/cue) + segundos. */
  fallback?: { abs?: number; scene?: number; cue?: string; seconds?: number };
}

export interface Project {
  id: string;
  brand: string;
  template: TemplateId;
  title: string;
  /** Sobrepõe o idioma da marca (ex.: marca pt-br com um vídeo em pt-pt). */
  locale?: Locale;
  /** Sobrepõem os valores do template (segundos antes da 1ª palavra e depois da última). */
  lead?: number;
  tail?: number;
  /** Props fixas da composição (música, título 3D, versão…). Tudo o que não depende da voz. */
  props?: Record<string, unknown>;
  /** Props que dependem do que a voz diz (ver Cue). */
  cues?: Cue[];
  /** `name`: voz sintética escolhida (ex.: pt-PT-DuarteNeural); sem nome usa a da marca/idioma. */
  voice?: { mode?: VoiceMode; rate?: string; pauseSeconds?: number; name?: string };
  scenes: Scene[];
  cta?: string;
  site?: string;
  music?: Music;
  institutional?: Institutional;
  /** Reportagem: quem aparece (etiqueta de nome no início). */
  host?: { name: string; role?: string };
  /** Créditos de imagens/vídeos de terceiros (ex.: Pexels). Entram na descrição de publicação. */
  credits?: string[];
  /** Evento a promover: o fim do vídeo mostra um cartão com título, data, hora, local e contacto. */
  event?: EventInfo;
  approval?: Approval;
  aspect?: Aspect;
  /**
   * Como mostrar a pessoa (reportagem): "video" (o rosto gravado), "photo" (a foto, animada pela voz,
   * sem fingir lábios) ou "none" (só a voz sobre os cenários). Por defeito "video".
   */
  faceMode?: 'video' | 'photo' | 'none';
  /** Legendas no vídeo: ligadas por defeito; false desliga-as (o ficheiro .srt continua a ser gerado). */
  captions?: boolean;
  /** A foto da pessoa (ficheiro na pasta do projeto), para faceMode "photo". */
  avatar?: string;
  /** Enquadramento da foto na bolha: y = posição vertical (0 = topo, 100 = fundo; por defeito 25) e zoom (1 = normal, até 3). */
  avatarFocus?: { y?: number; zoom?: number };
  /** Como se mostram as imagens dos cenários: 'cover' preenche o ecrã (pode cortar), 'contain' mostra-as inteiras. */
  imageFit?: 'cover' | 'contain';
  /** Como a pessoa aparece sobre os cenários (por defeito bolha). */
  person?: PersonLayout;
  /** Estabiliza os vídeos tremidos (telemóvel na mão): 'leve' ou 'forte'. Demora mais a preparar. */
  stabilize?: 'leve' | 'forte';
  /** Textos, emojis e imagens por cima do vídeo (reportagem). */
  overlays?: Overlay[];
  /**
   * Acabamento visual (reportagem): "look" (filtro de cor), transição entre cenários, estilo das legendas,
   * vinheta e grão de filme. Tudo leve para máquinas sem GPU.
   */
  style?: VideoStyle;
  /** Som: masterizar a -14 LUFS (por defeito sim) e baixar a música enquanto se fala (por defeito sim). */
  audio?: { master?: boolean; ducking?: boolean };
  /** Versões extra deste vídeo: alterações sobre o projeto base (além das predefinidas em versions.ts). */
  versions?: Record<string, VersionOverrides>;
  publish?: { description?: string; hashtags?: string[] };
}

export interface Issue {
  level: 'error' | 'warn';
  scene?: string;
  message: string;
  /**
   * Erro que só bloqueia o vídeo FINAL: num rascunho vira aviso. Rascunho serve para rever, por isso
   * nunca é bloqueado por texto de exemplo, afirmações a corrigir, etc.
   */
  finalOnly?: boolean;
}

const LOCALES = ['pt-br', 'pt-pt'];
const ASPECTS = ['9:16', '16:9', '1:1'];
const FACE_MODES = ['video', 'photo', 'none'];

/** O que uma versão pode mudar em relação ao projeto base. */
/**
 * Texto, emoji ou imagem por cima do vídeo, durante alguns segundos de uma cena (linha do tempo do estúdio).
 * O tempo é relativo ao início da fala da cena, por isso acompanha a voz mesmo que esta mude.
 */
export interface Overlay {
  kind: 'text' | 'emoji' | 'image';
  /** id da cena onde aparece */
  scene: string;
  /** segundos desde o início da fala da cena (por defeito 0,5) */
  at?: number;
  /** quanto tempo fica (por defeito 3) */
  seconds?: number;
  text?: string;
  /** imagem (relativa à pasta do projeto) */
  media?: string;
  /** posição do centro, em % do ecrã (por defeito 50 / 30) */
  x?: number;
  y?: number;
  /** tamanho: 1 = normal */
  size?: number;
  style?: 'destaque' | 'simples' | 'caixa' | 'gradiente';
  anim?: 'pop' | 'fade' | 'deslizar';
}

/**
 * Como a pessoa (vídeo do rosto) aparece sobre os cenários:
 *  - bolha (por defeito): o rosto num círculo no canto;
 *  - recorte: a pessoa "de pé" à frente do cenário, sem o fundo. Precisa de um fundo de uma só cor atrás dela
 *    (pano verde ou azul, ou uma parede lisa): o motor tira essa cor. `key` 'auto' lê a cor dos cantos do vídeo.
 */
export interface PersonLayout {
  mode?: 'bolha' | 'recorte';
  side?: 'esquerda' | 'centro' | 'direita';
  /** altura que o vídeo ocupa, em % da altura do ecrã (por defeito 78) */
  size?: number;
  /** cor do fundo a tirar: 'auto' (lê os cantos), 'verde', 'azul' ou um valor como #1fa84a */
  key?: string;
  /** quanto varia a cor do fundo (0,05 a 0,45; por defeito 0,15) */
  tolerance?: number;
}

export interface VideoStyle {
  look?: 'natural' | 'cinema' | 'quente' | 'frio' | 'vivo' | 'suave';
  transition?: 'fade' | 'deslizar' | 'zoom' | 'cortina' | 'empurrar' | 'iris' | 'diagonal' | 'giro' | 'flash' | 'persiana';
  /** Velocidade das transições (por defeito 'normal'). */
  transitionSpeed?: 'rapida' | 'normal' | 'lenta';
  /** Paleta de gradiente: cores do fundo, destaques, legendas e botões. */
  palette?: 'ouro' | 'oceano' | 'por-do-sol' | 'floresta' | 'rosa' | 'aurora' | 'noite' | 'terra';
  /** Película de cor (duotone) por cima das imagens, na paleta escolhida. */
  wash?: 'suave' | 'forte';
  captionStyle?: 'karaoke' | 'limpo' | 'destaque';
  /** Legendas à medida: tamanho, posição, letra, cores, fundo, destaque da palavra. */
  caption?: {
    size?: 'pequena' | 'media' | 'grande' | 'enorme';
    position?: 'baixo' | 'meio' | 'cima';
    font?: 'moderna' | 'classica' | 'compacta' | 'redonda';
    /** cor do texto e da palavra em destaque (#rrggbb); sem isto usa as da marca/paleta */
    color?: string;
    highlight?: string;
    /** fundo atrás do texto */
    box?: 'nenhuma' | 'escura' | 'cor';
    /** como se destaca a palavra que está a ser dita */
    hl?: 'cor' | 'pilula' | 'nenhum';
    caps?: boolean;
    outline?: boolean;
  };
  vignette?: boolean;
  grain?: boolean;
}

export interface VersionOverrides {
  style?: VideoStyle;
  label?: string;
  faceMode?: 'video' | 'photo' | 'none';
  captions?: boolean;
  aspect?: Aspect;
  cta?: string;
  site?: string;
}

const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

export function validateBrand(b: unknown): Issue[] {
  const out: Issue[] = [];
  const x = b as Partial<Brand> | null;
  if (!x || typeof x !== 'object') return [{ level: 'error', message: 'marca inválida' }];
  for (const k of ['id', 'name', 'site', 'cta'] as const) {
    if (!isStr(x[k])) out.push({ level: 'error', message: `marca: campo "${k}" em falta` });
  }
  if (!x.locale || !LOCALES.includes(x.locale)) out.push({ level: 'error', message: 'marca: locale deve ser pt-br ou pt-pt' });
  if (!x.colors || !isStr(x.colors.bg) || !isStr(x.colors.accent) || !isStr(x.colors.text)) {
    out.push({ level: 'error', message: 'marca: colors precisa de bg, accent e text' });
  }
  if (!x.claims || !Array.isArray(x.claims.forbidden)) out.push({ level: 'error', message: 'marca: claims.forbidden em falta' });
  else {
    for (const f of x.claims.forbidden) {
      try {
        new RegExp(f.pattern, 'iu');
      } catch {
        out.push({ level: 'error', message: `marca: regex inválida "${f.pattern}"` });
      }
    }
  }
  return out;
}

export function validateProject(p: unknown): Issue[] {
  const out: Issue[] = [];
  const x = p as Partial<Project> | null;
  if (!x || typeof x !== 'object') return [{ level: 'error', message: 'projeto inválido' }];
  for (const k of ['id', 'brand', 'title'] as const) {
    if (!isStr(x[k])) out.push({ level: 'error', message: `projeto: campo "${k}" em falta` });
  }
  if (isStr(x.id) && !/^[a-z0-9][a-z0-9-]*$/.test(x.id)) {
    out.push({ level: 'error', message: 'projeto: id só pode ter minúsculas, números e hífens' });
  }
  if (!x.template || !TEMPLATE_IDS.includes(x.template)) {
    out.push({ level: 'error', message: `projeto: template deve ser um de ${TEMPLATE_IDS.join(', ')}` });
  }
  if (x.aspect && !ASPECTS.includes(x.aspect)) out.push({ level: 'error', message: 'projeto: aspect inválido' });
  if (x.faceMode && !FACE_MODES.includes(x.faceMode)) out.push({ level: 'error', message: 'projeto: faceMode deve ser video, photo ou none' });
  for (const [k, v] of Object.entries(x.versions ?? {})) {
    if (!/^[a-z0-9]+$/.test(k)) out.push({ level: 'error', message: `versão "${k}": o nome só pode ter minúsculas e números` });
    if (v.faceMode && !FACE_MODES.includes(v.faceMode)) out.push({ level: 'error', message: `versão "${k}": faceMode inválido` });
    if (v.aspect && !ASPECTS.includes(v.aspect)) out.push({ level: 'error', message: `versão "${k}": aspect inválido` });
  }
  if (!Array.isArray(x.scenes) || x.scenes.length === 0) {
    out.push({ level: 'error', message: 'projeto: precisa de pelo menos uma cena' });
    return out;
  }
  const ids = new Set<string>();
  for (const s of x.scenes) {
    if (!isStr(s?.id) || !/^[a-z0-9][a-z0-9-]*$/.test(s.id)) out.push({ level: 'error', message: 'cena sem id válido (minúsculas, números, hífens)' });
    else if (ids.has(s.id)) out.push({ level: 'error', scene: s.id, message: 'id de cena repetido' });
    else ids.add(s.id);
    if (s?.kind !== 'clip' && !isStr(s?.narration)) out.push({ level: 'error', scene: s?.id, message: 'cena sem narração (ou escolha o tipo "cena real")' });
    if (s?.kind === 'clip' && x.template !== 'reportagem') out.push({ level: 'error', scene: s?.id, message: '"cena real" só existe no vídeo personalizado' });
  }
  const def = x.template ? TEMPLATES[x.template] : undefined;
  if (def?.scenes && x.scenes.length !== def.scenes) {
    out.push({ level: 'error', message: `${def.id} precisa de exatamente ${def.scenes} cenas (${def.sceneRoles?.join(', ')})` });
  }
  const rich = x.template === 'institucional' || x.template === 'reportagem';
  for (const s of x.scenes) {
    if (!rich && (s.presenter || s.media)) {
      out.push({ level: 'error', scene: s.id, message: '"presenter" e "media" só existem nos templates institucional e reportagem' });
    }
    if (x.template !== 'reportagem' && (s.cutaways?.length || s.location)) {
      out.push({ level: 'error', scene: s.id, message: '"cutaways" e "location" só existem no template reportagem' });
    }
    for (const c of s.cutaways ?? []) {
      if (!isStr(c.media) || (c.at !== undefined && !(c.at >= 0)) || (c.duration !== undefined && !(c.duration > 0))) {
        out.push({ level: 'error', scene: s.id, message: 'cenário precisa de ficheiro; se indicar "at" deve ser >= 0 e "duration" > 0' });
      }
    }
  }
  if (x.template === 'institucional') {
    if (!x.institutional || !isStr(x.institutional.entity)) {
      out.push({ level: 'error', message: 'institucional: falta institutional.entity (quem assina o vídeo)' });
    }
    if (x.scenes.length < 2) out.push({ level: 'error', message: 'institucional: precisa de pelo menos 2 cenas' });
  }
  if (x.music && !(isStr(x.music.license) && isStr(x.music.source))) {
    out.push({ level: 'error', message: 'música sem license/source documentadas — o motor recusa faixas sem licença' });
  }
  return out;
}
