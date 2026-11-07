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
