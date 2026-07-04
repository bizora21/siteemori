import type { Locale } from './config';
import ptBR, { type Dictionary } from './pt-br';
import ptPT from './pt-pt';

const dictionaries: Record<Locale, Dictionary> = {
  'pt-br': ptBR,
  'pt-pt': ptPT,
};

export function getDictionary(lang: Locale): Dictionary {
  return dictionaries[lang];
}

export type { Dictionary };
