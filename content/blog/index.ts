import type { Locale } from '@/i18n/config';
import type { ArticleModule, LocalizedArticle } from './types';

// PT-BR (fonte completa)
import brComecar from './pt-br/como-comecar-diario-emocional';
import brOQue from './pt-br/o-que-escrever-no-diario';
import brDiff from './pt-br/diario-ou-journaling-diferenca';
import brAnsiedade from './pt-br/escrever-para-lidar-com-ansiedade';
import brIa from './pt-br/journaling-com-ia';

// PT-PT (stubs localizados — corpo por traduzir)
import ptComecar from './pt-pt/como-comecar-diario-emocional';
import ptOQue from './pt-pt/o-que-escrever-no-diario';
import ptDiff from './pt-pt/diario-ou-journaling-diferenca';
import ptAnsiedade from './pt-pt/escrever-para-lidar-com-ansiedade';
import ptIa from './pt-pt/journaling-com-ia';

// Ordem de exibição no índice do blog (mais recente/estratégico primeiro).
export const postOrder = [
  'como-comecar-diario-emocional',
  'o-que-escrever-no-diario',
  'diario-ou-journaling-diferenca',
  'escrever-para-lidar-com-ansiedade',
  'journaling-com-ia',
] as const;

const registry: Record<string, LocalizedArticle> = {
  'como-comecar-diario-emocional': { 'pt-br': brComecar, 'pt-pt': ptComecar },
  'o-que-escrever-no-diario': { 'pt-br': brOQue, 'pt-pt': ptOQue },
  'diario-ou-journaling-diferenca': { 'pt-br': brDiff, 'pt-pt': ptDiff },
  'escrever-para-lidar-com-ansiedade': { 'pt-br': brAnsiedade, 'pt-pt': ptAnsiedade },
  'journaling-com-ia': { 'pt-br': brIa, 'pt-pt': ptIa },
};

export function getAllSlugs(): string[] {
  return [...postOrder];
}

export function getArticle(slug: string, lang: Locale): ArticleModule | undefined {
  return registry[slug]?.[lang];
}

// Lista ordenada de artigos para uma variante (para o índice).
export function getArticles(lang: Locale): ArticleModule[] {
  return postOrder.map((slug) => registry[slug][lang]);
}
