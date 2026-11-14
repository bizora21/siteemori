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
}

/**
 * Origem da voz.
 *  - auto:      usa a gravação humana de cada cena se existir; senão sintetiza.
 *  - human:     exige gravação humana em TODAS as cenas (erro se faltar alguma).
 *  - synthetic: ignora gravações e sintetiza (Edge TTS → Piper).
 */
export type VoiceMode = 'auto' | 'human' | 'synthetic';

export interface Music {
  file: string;
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
  voice?: { mode?: VoiceMode; rate?: string; pauseSeconds?: number };
  scenes: Scene[];
  cta?: string;
  site?: string;
  music?: Music;
  institutional?: Institutional;
  approval?: Approval;
  aspect?: Aspect;
  publish?: { description?: string; hashtags?: string[] };
}

export interface Issue {
  level: 'error' | 'warn';
  scene?: string;
  message: string;
}

const LOCALES = ['pt-br', 'pt-pt'];
const ASPECTS = ['9:16', '16:9', '1:1'];

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
  if (!Array.isArray(x.scenes) || x.scenes.length === 0) {
    out.push({ level: 'error', message: 'projeto: precisa de pelo menos uma cena' });
    return out;
  }
  const ids = new Set<string>();
  for (const s of x.scenes) {
    if (!isStr(s?.id) || !/^[a-z0-9][a-z0-9-]*$/.test(s.id)) out.push({ level: 'error', message: 'cena sem id válido (minúsculas, números, hífens)' });
    else if (ids.has(s.id)) out.push({ level: 'error', scene: s.id, message: 'id de cena repetido' });
    else ids.add(s.id);
    if (!isStr(s?.narration)) out.push({ level: 'error', scene: s?.id, message: 'cena sem narração' });
  }
  const def = x.template ? TEMPLATES[x.template] : undefined;
  if (def?.scenes && x.scenes.length !== def.scenes) {
    out.push({ level: 'error', message: `${def.id} precisa de exatamente ${def.scenes} cenas (${def.sceneRoles?.join(', ')})` });
  }
  if (x.template !== 'institucional') {
    for (const s of x.scenes) {
      if (s.presenter || s.media) {
        out.push({ level: 'error', scene: s.id, message: '"presenter" e "media" só existem no template institucional' });
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
