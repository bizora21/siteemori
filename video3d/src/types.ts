export interface Word {
  text: string;
  start: number;
  end: number;
}

export interface CaptionLine {
  words: Word[];
  start: number;
  end: number;
}

export interface VerseProps {
  /** linhas do título em 3D */
  title: string[];
  /** caminho do áudio da voz em public/ */
  audio: string;
  lines: CaptionLine[];
  durationInFrames: number;
  leadSeconds: number;
  voiceEndSeconds: number;
  cta: string;
  site: string;
  /** Seta "↑" a apontar para a bio; desligar quando o CTA não é "link na bio". */
  ctaArrow?: boolean;
  /** Título e livro já assentes no primeiro quadro (sem animação de entrada). */
  skipIntro?: boolean;
}

/** Vídeo de produto "Rastreio3D" — para os donos das encomendas. */
export interface RastreioProps {
  audio: string;
  lines: CaptionLine[];
  durationInFrames: number;
  leadSeconds: number;
  voiceEndSeconds: number;
  /** Início de cada cena (s), calculado a partir do tempo real das palavras da voz. */
  sceneStarts: number[];
  cta: string;
  site: string;
  /** Música de fundo em public/ (omitido = music.mp3) e segundo onde começar. */
  music?: string;
  musicStart?: number;
}

/** Anúncio "Anuncio3D" — para donos de transportadoras (objectivo: clique em "Saiba mais"). */
export interface AnuncioProps {
  audio: string;
  music: string;
  lines: CaptionLine[];
  durationInFrames: number;
  leadSeconds: number;
  voiceEndSeconds: number;
  /** [gancho, problema, solução, funcionalidades, oferta, CTA] (criativo B: 7 cenas) */
  sceneStarts: number[];
  /** Segundo da faixa de música onde começar (omitido = 0). */
  musicStart?: number;
  cta: string;
  site: string;
}

/** Vídeo de produto "Aprender3D" — aba "Aprender a Bíblia" da app Emori (TikTok). */
export interface AprenderProps {
  audio: string;
  music: string;
  lines: CaptionLine[];
  durationInFrames: number;
  leadSeconds: number;
  voiceEndSeconds: number;
  /** [gancho, app, níveis, pergunta, erro, próximo nível, CTA] */
  sceneStarts: number[];
  /** Instante (s) em que o dedo toca na resposta certa / errada. */
  tapRight: number;
  tapWrong: number;
  cta: string;
  site: string;
  /** Versão 2 (app v23): ecrãs novos, dica, rever erros, conquistas e lembrete. */
  version?: 2;
  /** Duas linhas do título 3D do gancho (omitido = "POR ONDE" / "COMEÇAR?"). */
  title?: [string, string];
  tapHint?: number;
  badgesAt?: number;
  remindAt?: number;
  /** Gancho-desafio (pergunta + contagem 3-2-1 + resposta) logo no primeiro quadro. */
  hook?: { countFrom: number; reveal: number };
}

/**
 * Vídeo institucional "Institucional" — entidades públicas e organizações.
 * Sóbrio por desenho: sem 3D, sem efeitos de anúncio, com entidade, fonte do
 * dado e aviso legal sempre visíveis. Gerado pelo motor (engine/).
 */
/** Imagem, vídeo ou apresentador de uma cena (preparado pelo motor em public/media/). */
export interface SceneMediaProps {
  src: string;
  type: 'image' | 'video' | 'presenter';
  /** Segundo do vídeo em que entra e quanto tempo fica. */
  from: number;
  duration: number;
  /** Duração do clip (vídeos curtos repetem-se). */
  clipSeconds?: number;
  /** "contain": mostrar inteira (cartaz com texto), sem cortar nem fazer zoom. */
  fit?: 'cover' | 'contain';
}

export interface InstitucionalProps {
  audio: string;
  lines: CaptionLine[];
  durationInFrames: number;
  leadSeconds: number;
  voiceEndSeconds: number;
  /** Início de cada cena (s), exato (vem dos áudios por cena). */
  sceneStarts: number[];
  scenes: { title: string; source?: string; media?: SceneMediaProps }[];
  entity: string;
  department?: string;
  disclaimer?: string;
  site: string;
  cta: string;
  colors: { bg: string; accent: string; text: string };
  /** Ficheiro em public/ (opcional). */
  logo?: string;
  aspect: '9:16' | '16:9' | '1:1';
  /** Música em public/ (só se tiver licença documentada no projeto). */
  music?: string;
}

/**
 * "Reportagem" — vídeo pessoal em locais diferentes. A pessoa aparece em ecrã
 * inteiro (apresentador) ou em voz off sobre imagens do local; as imagens do
 * local também podem cortar o ecrã enquanto a voz continua (cutaways).
 */
export interface ReportagemProps {
  audio: string;
  lines: CaptionLine[];
  durationInFrames: number;
  leadSeconds: number;
  voiceEndSeconds: number;
  sceneStarts: number[];
  scenes: {
    title: string;
    /** Etiqueta do local desta cena (só locais verdadeiros). */
    location?: string;
    /** Cenário de fundo da cena (imagem ou vídeo). */
    media?: SceneMediaProps;
    /** O rosto: vídeo do apresentador. Ecrã inteiro sem cenário; bolha com cenário. */
    face?: SceneMediaProps;
    cutaways?: SceneMediaProps[];
  }[];
  host?: { name: string; role?: string };
  /** Foto da pessoa (versão "foto animada"): numa bolha que pulsa com a voz. */
  avatar?: { src: string };
  /** Volume da voz (0–1), uma amostra por levelStep segundos desde o início da faixa de voz. */
  voiceLevels?: number[];
  levelStep?: number;
  brandName: string;
  colors: { bg: string; accent: string; text: string };
  logo?: string;
  cta: string;
  site: string;
  aspect: '9:16' | '16:9' | '1:1';
  music?: string;
  /** Evento a promover: cartão final com os dados. */
  event?: { title: string; date?: string; time?: string; place?: string; contact?: string; note?: string };
}
