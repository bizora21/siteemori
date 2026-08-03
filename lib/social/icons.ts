// Vocabulário visual: mapeia conceitos falados na narração para um símbolo.
// A ideia é simples e determinística (sem IA): quando a frase menciona "mente",
// aparece um cérebro; quando fala de "escrever", aparece uma caneta. Isto dá ao
// espectador uma âncora visual do que está a ser dito — o que retém muito mais
// do que texto sozinho.
//
// Os paths são traçados no estilo lucide (viewBox 24×24, só stroke).

export interface IconDef {
  path: string;
  /** raízes de palavras (sem acentos, minúsculas) que ativam este símbolo */
  keys: string[];
}

/** Ordem importa: o primeiro que casar ganha (os mais específicos vêm antes). */
export const ICON_VOCAB: Record<string, IconDef> = {
  brain: {
    path: 'M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2zM14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z',
    keys: ['mente', 'cerebr', 'pensa', 'razao', 'racional', 'cognit', 'inteligen', 'saber', 'aprend'],
  },
  heart: {
    path: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z',
    keys: ['emoc', 'sent', 'coracao', 'amor', 'afet', 'carinho', 'empat', 'compaix'],
  },
  pen: {
    path: 'M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3zM15 5l4 4',
    keys: ['escrev', 'anot', 'regist', 'diario', 'palavra', 'texto', 'papel', 'caderno', 'journal'],
  },
  eye: {
    path: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    keys: ['perceb', 'not', 'ver', 'enxerg', 'olh', 'observ', 'consciencia', 'reconhec', 'ident'],
  },
  clock: {
    path: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
    keys: ['tempo', 'semana', 'dia', 'mes', 'hora', 'minuto', 'rotina', 'frequen', 'sempre', 'demora'],
  },
  users: {
    path: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    keys: ['outro', 'pessoa', 'gente', 'social', 'relaci', 'amigo', 'famil', 'alguem', 'conviv'],
  },
  message: {
    path: 'M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z',
    keys: ['conversa', 'fala', 'dizer', 'desabaf', 'contar', 'pergunt', 'respost', 'comunic'],
  },
  wind: {
    path: 'M12.8 19.6A2 2 0 1 0 14 16H2M17.5 8a2.5 2.5 0 1 1 2 4H2M9.8 4.4A2 2 0 1 1 11 8H2',
    keys: ['respir', 'calma', 'acalm', 'relax', 'paz', 'sereno', 'tranquil', 'onda', 'passa'],
  },
  trending: {
    path: 'M22 7l-8.5 8.5-5-5L2 17M16 7h6v6',
    keys: ['cresc', 'desenvolv', 'melhor', 'evolu', 'progress', 'treina', 'pratic', 'habito', 'mudan'],
  },
  shield: {
    path: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    keys: ['privad', 'segur', 'protec', 'confian', 'intim', 'julga', 'sozinh'],
  },
  alert: {
    path: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
    keys: ['ansied', 'medo', 'stress', 'estress', 'preocup', 'dificil', 'sofr', 'crise', 'raiva', 'triste'],
  },
  repeat: {
    path: 'M17 2l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3',
    keys: ['padr', 'repet', 'ciclo', 'gatilh', 'volta', 'sempre que', 'recome'],
  },
  sparkle: {
    path: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z',
    keys: ['gratid', 'grato', 'bom', 'positiv', 'bem-estar', 'alivi', 'melhora', 'luz'],
  },
  moon: {
    path: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
    keys: ['noite', 'dormir', 'sono', 'emori', 'fim do dia'],
  },
  compass: {
    path: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM16.2 7.8l-2.9 6.4-6.4 2.9 2.9-6.4 6.4-2.9z',
    keys: ['escolh', 'decid', 'direc', 'caminho', 'rumo', 'control', 'gerir', 'regul'],
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
 * Escolhe o símbolo que melhor representa a frase. Devolve `null` quando nada
 * casa — nesse caso o chamador mantém o símbolo anterior (evita piscar).
 */
export function iconForText(text: string): string | null {
  const t = normalize(text);
  let best: { name: string; at: number } | null = null;

  for (const [name, def] of Object.entries(ICON_VOCAB)) {
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
