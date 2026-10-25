import type { Locale } from '@/i18n/config';
import type { ArticleModule, LocalizedArticle } from './types';

// PT-BR
import br_comoOrarIniciantes from './pt-br/como-orar-iniciantes';
import br_versiculosSobreAnsiedade from './pt-br/versiculos-sobre-ansiedade';
import br_salmo23Explicado from './pt-br/salmo-23-explicado';
import br_paiNossoSignificado from './pt-br/pai-nosso-significado';
import br_oracaoDaNoite from './pt-br/oracao-da-noite';
import br_oracaoDaManha from './pt-br/oracao-da-manha';
import br_oracaoDiariaHabito from './pt-br/oracao-diaria-habito';
import br_porQueDeusNaoResponde from './pt-br/por-que-deus-nao-responde';
import br_versiculosDeConforto from './pt-br/versiculos-de-conforto';
import br_comoLerABibliaIniciantes from './pt-br/como-ler-a-biblia-iniciantes';
import br_diarioDeOracao from './pt-br/diario-de-oracao';
import br_oracaoDeGratidao from './pt-br/oracao-de-gratidao';
import br_oracaoQuandoNaoSeiOQueDizer from './pt-br/oracao-quando-nao-sei-o-que-dizer';
import br_orarPelaFamilia from './pt-br/orar-pela-familia';
import br_intercessaoOQueE from './pt-br/intercessao-o-que-e';
import br_grupoDeOracaoComunidade from './pt-br/grupo-de-oracao-comunidade';
import br_salmo91Explicado from './pt-br/salmo-91-explicado';

// PT-PT
import pt_comoOrarIniciantes from './pt-pt/como-orar-iniciantes';
import pt_versiculosSobreAnsiedade from './pt-pt/versiculos-sobre-ansiedade';
import pt_salmo23Explicado from './pt-pt/salmo-23-explicado';
import pt_paiNossoSignificado from './pt-pt/pai-nosso-significado';
import pt_oracaoDaNoite from './pt-pt/oracao-da-noite';
import pt_oracaoDaManha from './pt-pt/oracao-da-manha';
import pt_oracaoDiariaHabito from './pt-pt/oracao-diaria-habito';
import pt_porQueDeusNaoResponde from './pt-pt/por-que-deus-nao-responde';
import pt_versiculosDeConforto from './pt-pt/versiculos-de-conforto';
import pt_comoLerABibliaIniciantes from './pt-pt/como-ler-a-biblia-iniciantes';
import pt_diarioDeOracao from './pt-pt/diario-de-oracao';
import pt_oracaoDeGratidao from './pt-pt/oracao-de-gratidao';
import pt_oracaoQuandoNaoSeiOQueDizer from './pt-pt/oracao-quando-nao-sei-o-que-dizer';
import pt_orarPelaFamilia from './pt-pt/orar-pela-familia';
import pt_intercessaoOQueE from './pt-pt/intercessao-o-que-e';
import pt_grupoDeOracaoComunidade from './pt-pt/grupo-de-oracao-comunidade';
import pt_salmo91Explicado from './pt-pt/salmo-91-explicado';

// Ordem de exibição no índice do blog (mais pesquisado/estratégico primeiro).
export const postOrder = [
  'salmo-91-explicado',
  'como-orar-iniciantes',
  'versiculos-sobre-ansiedade',
  'salmo-23-explicado',
  'pai-nosso-significado',
  'oracao-da-noite',
  'oracao-da-manha',
  'oracao-diaria-habito',
  'por-que-deus-nao-responde',
  'versiculos-de-conforto',
  'como-ler-a-biblia-iniciantes',
  'diario-de-oracao',
  'oracao-de-gratidao',
  'oracao-quando-nao-sei-o-que-dizer',
  'orar-pela-familia',
  'intercessao-o-que-e',
  'grupo-de-oracao-comunidade',
] as const;

const registry: Record<string, LocalizedArticle> = {
  'salmo-91-explicado': { 'pt-br': br_salmo91Explicado, 'pt-pt': pt_salmo91Explicado },
  'como-orar-iniciantes': { 'pt-br': br_comoOrarIniciantes, 'pt-pt': pt_comoOrarIniciantes },
  'versiculos-sobre-ansiedade': { 'pt-br': br_versiculosSobreAnsiedade, 'pt-pt': pt_versiculosSobreAnsiedade },
  'salmo-23-explicado': { 'pt-br': br_salmo23Explicado, 'pt-pt': pt_salmo23Explicado },
  'pai-nosso-significado': { 'pt-br': br_paiNossoSignificado, 'pt-pt': pt_paiNossoSignificado },
  'oracao-da-noite': { 'pt-br': br_oracaoDaNoite, 'pt-pt': pt_oracaoDaNoite },
  'oracao-da-manha': { 'pt-br': br_oracaoDaManha, 'pt-pt': pt_oracaoDaManha },
  'oracao-diaria-habito': { 'pt-br': br_oracaoDiariaHabito, 'pt-pt': pt_oracaoDiariaHabito },
  'por-que-deus-nao-responde': { 'pt-br': br_porQueDeusNaoResponde, 'pt-pt': pt_porQueDeusNaoResponde },
  'versiculos-de-conforto': { 'pt-br': br_versiculosDeConforto, 'pt-pt': pt_versiculosDeConforto },
  'como-ler-a-biblia-iniciantes': { 'pt-br': br_comoLerABibliaIniciantes, 'pt-pt': pt_comoLerABibliaIniciantes },
  'diario-de-oracao': { 'pt-br': br_diarioDeOracao, 'pt-pt': pt_diarioDeOracao },
  'oracao-de-gratidao': { 'pt-br': br_oracaoDeGratidao, 'pt-pt': pt_oracaoDeGratidao },
  'oracao-quando-nao-sei-o-que-dizer': { 'pt-br': br_oracaoQuandoNaoSeiOQueDizer, 'pt-pt': pt_oracaoQuandoNaoSeiOQueDizer },
  'orar-pela-familia': { 'pt-br': br_orarPelaFamilia, 'pt-pt': pt_orarPelaFamilia },
  'intercessao-o-que-e': { 'pt-br': br_intercessaoOQueE, 'pt-pt': pt_intercessaoOQueE },
  'grupo-de-oracao-comunidade': { 'pt-br': br_grupoDeOracaoComunidade, 'pt-pt': pt_grupoDeOracaoComunidade },
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
