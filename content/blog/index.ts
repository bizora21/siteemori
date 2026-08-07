import type { Locale } from '@/i18n/config';
import type { ArticleModule, LocalizedArticle } from './types';

// PT-BR (fonte completa)
import brCansaco from './pt-br/cansaco-que-dormir-nao-resolve';
import brAutoestima from './pt-br/como-melhorar-autoestima';
import brInteligencia from './pt-br/inteligencia-emocional';
import brDesabafar from './pt-br/como-desabafar';
import brControlar from './pt-br/como-controlar-as-emocoes';
import brAfirmacoes from './pt-br/afirmacoes-positivas';
import brGratidao from './pt-br/diario-de-gratidao';
import brHumor from './pt-br/diario-de-humor';
import brComecar from './pt-br/como-comecar-diario-emocional';
import brEscolher from './pt-br/como-escolher-app-diario-emocional';
import brOQue from './pt-br/o-que-escrever-no-diario';
import brDiff from './pt-br/diario-ou-journaling-diferenca';
import brAnsiedade from './pt-br/escrever-para-lidar-com-ansiedade';
import brIa from './pt-br/journaling-com-ia';

// PT-PT
import ptCansaco from './pt-pt/cansaco-que-dormir-nao-resolve';
import ptAutoestima from './pt-pt/como-melhorar-autoestima';
import ptInteligencia from './pt-pt/inteligencia-emocional';
import ptDesabafar from './pt-pt/como-desabafar';
import ptControlar from './pt-pt/como-controlar-as-emocoes';
import ptAfirmacoes from './pt-pt/afirmacoes-positivas';
import ptGratidao from './pt-pt/diario-de-gratidao';
import ptHumor from './pt-pt/diario-de-humor';
import ptComecar from './pt-pt/como-comecar-diario-emocional';
import ptEscolher from './pt-pt/como-escolher-app-diario-emocional';
import ptOQue from './pt-pt/o-que-escrever-no-diario';
import ptDiff from './pt-pt/diario-ou-journaling-diferenca';
import ptAnsiedade from './pt-pt/escrever-para-lidar-com-ansiedade';
import ptIa from './pt-pt/journaling-com-ia';

// Ordem de exibição no índice do blog (mais recente/estratégico primeiro).
export const postOrder = [
  'cansaco-que-dormir-nao-resolve',
  'como-melhorar-autoestima',
  'inteligencia-emocional',
  'como-desabafar',
  'como-controlar-as-emocoes',
  'afirmacoes-positivas',
  'diario-de-gratidao',
  'diario-de-humor',
  'como-comecar-diario-emocional',
  'como-escolher-app-diario-emocional',
  'o-que-escrever-no-diario',
  'diario-ou-journaling-diferenca',
  'escrever-para-lidar-com-ansiedade',
  'journaling-com-ia',
] as const;

const registry: Record<string, LocalizedArticle> = {
  'cansaco-que-dormir-nao-resolve': { 'pt-br': brCansaco, 'pt-pt': ptCansaco },
  'como-melhorar-autoestima': { 'pt-br': brAutoestima, 'pt-pt': ptAutoestima },
  'inteligencia-emocional': { 'pt-br': brInteligencia, 'pt-pt': ptInteligencia },
  'como-desabafar': { 'pt-br': brDesabafar, 'pt-pt': ptDesabafar },
  'como-controlar-as-emocoes': { 'pt-br': brControlar, 'pt-pt': ptControlar },
  'afirmacoes-positivas': { 'pt-br': brAfirmacoes, 'pt-pt': ptAfirmacoes },
  'diario-de-gratidao': { 'pt-br': brGratidao, 'pt-pt': ptGratidao },
  'diario-de-humor': { 'pt-br': brHumor, 'pt-pt': ptHumor },
  'como-comecar-diario-emocional': { 'pt-br': brComecar, 'pt-pt': ptComecar },
  'como-escolher-app-diario-emocional': { 'pt-br': brEscolher, 'pt-pt': ptEscolher },
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
