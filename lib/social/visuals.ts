// Vocabulário visual: mapeia conceitos falados na narração para IMAGEM REAL.
//
// Substitui o vocabulário de ícones. Um símbolo de linha desenhado é uma
// abstração — o espectador tem de o descodificar antes de o sentir, e num
// vídeo de 3 segundos por frase não há tempo para isso. Filmagem real do que
// está a ser dito ("fala em água, mostra água") é lida instantaneamente e é o
// que sustenta a atenção.
//
// As consultas são deliberadamente calmas e sem pessoas em primeiro plano
// quando possível: o rosto de um estranho rouba a atenção ao texto.

export interface VisualDef {
  /** consulta ao Pexels — inglês, que é onde o catálogo está indexado */
  query: string;
  /** raízes de palavras (sem acentos, minúsculas) que ativam este visual */
  keys: string[];
}

/** Ordem importa: o primeiro que casar ganha (os mais específicos vêm antes). */
export const VISUAL_VOCAB: Record<string, VisualDef> = {
  // Pensamento a girar sem sair do sítio.
  mente: {
    query: 'water ripples concentric slow motion',
    keys: ['mente', 'cerebr', 'pensa', 'razao', 'racional', 'cognit', 'rumina'],
  },
  emocao: {
    query: 'warm sunlight through sheer curtain slow',
    keys: ['emoc', 'sent', 'coracao', 'amor', 'afet', 'carinho', 'empat', 'compaix'],
  },
  // Literal de propósito: é o gesto que a app pede.
  escrever: {
    query: 'writing in notebook by hand close up',
    keys: ['escrev', 'anot', 'regist', 'diario', 'palavra', 'texto', 'papel', 'caderno', 'journal'],
  },
  perceber: {
    query: 'looking out window rain reflection',
    keys: ['perceb', 'not', 'ver', 'enxerg', 'olh', 'observ', 'consciencia', 'reconhec', 'ident'],
  },
  tempo: {
    query: 'clouds time lapse sky calm',
    keys: ['tempo', 'semana', 'dia', 'mes', 'hora', 'minuto', 'rotina', 'frequen', 'sempre', 'demora'],
  },
  pessoas: {
    query: 'people walking street slow motion blurred',
    keys: ['outro', 'pessoa', 'gente', 'social', 'relaci', 'amigo', 'famil', 'alguem', 'conviv'],
  },
  conversa: {
    query: 'phone screen typing at night hands',
    keys: ['conversa', 'fala', 'dizer', 'desabaf', 'contar', 'pergunt', 'respost', 'comunic'],
  },
  calma: {
    query: 'calm ocean waves slow motion',
    keys: ['respir', 'calma', 'acalm', 'relax', 'paz', 'sereno', 'tranquil', 'onda', 'passa'],
  },
  crescer: {
    query: 'sunrise horizon time lapse golden',
    keys: ['cresc', 'desenvolv', 'melhor', 'evolu', 'progress', 'treina', 'pratic', 'habito', 'mudan'],
  },
  privado: {
    query: 'closed curtains soft light empty room',
    keys: ['privad', 'segur', 'protec', 'confian', 'intim', 'julga', 'sozinh'],
  },
  // Luzes desfocadas: agitação sem mostrar sofrimento (que afasta em vez de reter).
  ansiedade: {
    query: 'city lights night bokeh out of focus',
    keys: ['ansied', 'medo', 'stress', 'estress', 'preocup', 'dificil', 'sofr', 'crise', 'raiva', 'triste'],
  },
  padrao: {
    query: 'waves repeating shore aerial slow',
    keys: ['padr', 'repet', 'ciclo', 'gatilh', 'volta', 'recome'],
  },
  bom: {
    query: 'sunlight through leaves golden hour',
    keys: ['gratid', 'grato', 'bom', 'positiv', 'bem-estar', 'alivi', 'luz'],
  },
  noite: {
    query: 'night sky stars time lapse',
    keys: ['noite', 'dormir', 'sono', 'cansac', 'exaust', 'fim do dia'],
  },
  escolha: {
    query: 'walking forest path morning light',
    keys: ['escolh', 'decid', 'direc', 'caminho', 'rumo', 'control', 'gerir', 'regul'],
  },
  corpo: {
    query: 'slow breathing chest calm morning light',
    keys: ['corpo', 'peito', 'ombro', 'musculo', 'fisic', 'tensao'],
  },
};

/** Remove acentos e baixa para minúsculas, para casar as raízes de forma robusta. */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * Escolhe o visual que melhor representa a frase — o que casar mais cedo no
 * texto, que é tipicamente o assunto da frase. Devolve `null` quando nada casa;
 * nesse caso o chamador mantém o visual anterior, para o fundo não saltar.
 */
export function visualForText(text: string): string | null {
  const t = normalize(text);
  let best: { name: string; at: number } | null = null;

  for (const [name, def] of Object.entries(VISUAL_VOCAB)) {
    for (const key of def.keys) {
      const at = t.indexOf(key);
      if (at !== -1 && (best === null || at < best.at)) {
        best = { name, at };
        break;
      }
    }
  }
  return best?.name ?? null;
}

/** Consulta Pexels de um visual do vocabulário. */
export function visualQuery(name: string): string {
  return VISUAL_VOCAB[name]?.query ?? 'calm nature slow motion minimal';
}
