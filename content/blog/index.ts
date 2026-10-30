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
import br_salmo121Explicado from './pt-br/salmo-121-explicado';
import br_salmo46Explicado from './pt-br/salmo-46-explicado';
import br_feEConfiancaEmDeus from './pt-br/fe-e-confianca-em-deus';
import br_salmo139Explicado from './pt-br/salmo-139-explicado';
import br_proverbiosParaODiaADia from './pt-br/proverbios-para-o-dia-a-dia';
import br_jejumNaBiblia from './pt-br/jejum-na-biblia';
import br_oracaoPeloTrabalho from './pt-br/oracao-pelo-trabalho';
import br_perdaoNaBiblia from './pt-br/perdao-na-biblia';
import br_frutosDoEspiritoSanto from './pt-br/frutos-do-espirito-santo';
import br_armaduraDeDeusEfesios6 from './pt-br/armadura-de-deus-efesios-6';
import br_versiculosSobreAmor from './pt-br/versiculos-sobre-amor';
import br_oracaoDeProtecao from './pt-br/oracao-de-protecao';
import br_deusTemUmPlano from './pt-br/deus-tem-um-plano';
import br_comoOuvirAVozDeDeus from './pt-br/como-ouvir-a-voz-de-deus';
import br_salmo37Explicado from './pt-br/salmo-37-explicado';
import br_bibliaSobrePaciencia from './pt-br/biblia-sobre-paciencia';
import br_gratidaoNaBiblia from './pt-br/gratidao-na-biblia';
import br_oracaoPorCura from './pt-br/oracao-por-cura';
import br_versiculosSobreForca from './pt-br/versiculos-sobre-forca';
import br_dezMandamentosExplicados from './pt-br/dez-mandamentos-explicados';
import br_bemAventurancasSignificado from './pt-br/bem-aventurancas-significado';
import br_oracaoParaDecisoes from './pt-br/oracao-para-decisoes';

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
import pt_salmo121Explicado from './pt-pt/salmo-121-explicado';
import pt_salmo46Explicado from './pt-pt/salmo-46-explicado';
import pt_feEConfiancaEmDeus from './pt-pt/fe-e-confianca-em-deus';
import pt_salmo139Explicado from './pt-pt/salmo-139-explicado';
import pt_proverbiosParaODiaADia from './pt-pt/proverbios-para-o-dia-a-dia';
import pt_jejumNaBiblia from './pt-pt/jejum-na-biblia';
import pt_oracaoPeloTrabalho from './pt-pt/oracao-pelo-trabalho';
import pt_perdaoNaBiblia from './pt-pt/perdao-na-biblia';
import pt_frutosDoEspiritoSanto from './pt-pt/frutos-do-espirito-santo';
import pt_armaduraDeDeusEfesios6 from './pt-pt/armadura-de-deus-efesios-6';
import pt_versiculosSobreAmor from './pt-pt/versiculos-sobre-amor';
import pt_oracaoDeProtecao from './pt-pt/oracao-de-protecao';
import pt_deusTemUmPlano from './pt-pt/deus-tem-um-plano';
import pt_comoOuvirAVozDeDeus from './pt-pt/como-ouvir-a-voz-de-deus';
import pt_salmo37Explicado from './pt-pt/salmo-37-explicado';
import pt_bibliaSobrePaciencia from './pt-pt/biblia-sobre-paciencia';
import pt_gratidaoNaBiblia from './pt-pt/gratidao-na-biblia';
import pt_oracaoPorCura from './pt-pt/oracao-por-cura';
import pt_versiculosSobreForca from './pt-pt/versiculos-sobre-forca';
import pt_dezMandamentosExplicados from './pt-pt/dez-mandamentos-explicados';
import pt_bemAventurancasSignificado from './pt-pt/bem-aventurancas-significado';
import pt_oracaoParaDecisoes from './pt-pt/oracao-para-decisoes';

// Ordem de exibição no índice do blog (mais pesquisado/estratégico primeiro).
export const postOrder = [
  'salmo-46-explicado',
  'salmo-121-explicado',
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
  'fe-e-confianca-em-deus',
  'salmo-139-explicado',
  'proverbios-para-o-dia-a-dia',
  'jejum-na-biblia',
  'oracao-pelo-trabalho',
  'perdao-na-biblia',
  'frutos-do-espirito-santo',
  'armadura-de-deus-efesios-6',
  'versiculos-sobre-amor',
  'oracao-de-protecao',
  'deus-tem-um-plano',
  'como-ouvir-a-voz-de-deus',
  'salmo-37-explicado',
  'biblia-sobre-paciencia',
  'gratidao-na-biblia',
  'oracao-por-cura',
  'versiculos-sobre-forca',
  'dez-mandamentos-explicados',
  'bem-aventurancas-significado',
  'oracao-para-decisoes',
] as const;

const registry: Record<string, LocalizedArticle> = {
  'salmo-46-explicado': { 'pt-br': br_salmo46Explicado, 'pt-pt': pt_salmo46Explicado },
  'salmo-121-explicado': { 'pt-br': br_salmo121Explicado, 'pt-pt': pt_salmo121Explicado },
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
  'fe-e-confianca-em-deus': { 'pt-br': br_feEConfiancaEmDeus, 'pt-pt': pt_feEConfiancaEmDeus },
  'salmo-139-explicado': { 'pt-br': br_salmo139Explicado, 'pt-pt': pt_salmo139Explicado },
  'proverbios-para-o-dia-a-dia': { 'pt-br': br_proverbiosParaODiaADia, 'pt-pt': pt_proverbiosParaODiaADia },
  'jejum-na-biblia': { 'pt-br': br_jejumNaBiblia, 'pt-pt': pt_jejumNaBiblia },
  'oracao-pelo-trabalho': { 'pt-br': br_oracaoPeloTrabalho, 'pt-pt': pt_oracaoPeloTrabalho },
  'perdao-na-biblia': { 'pt-br': br_perdaoNaBiblia, 'pt-pt': pt_perdaoNaBiblia },
  'frutos-do-espirito-santo': { 'pt-br': br_frutosDoEspiritoSanto, 'pt-pt': pt_frutosDoEspiritoSanto },
  'armadura-de-deus-efesios-6': { 'pt-br': br_armaduraDeDeusEfesios6, 'pt-pt': pt_armaduraDeDeusEfesios6 },
  'versiculos-sobre-amor': { 'pt-br': br_versiculosSobreAmor, 'pt-pt': pt_versiculosSobreAmor },
  'oracao-de-protecao': { 'pt-br': br_oracaoDeProtecao, 'pt-pt': pt_oracaoDeProtecao },
  'deus-tem-um-plano': { 'pt-br': br_deusTemUmPlano, 'pt-pt': pt_deusTemUmPlano },
  'como-ouvir-a-voz-de-deus': { 'pt-br': br_comoOuvirAVozDeDeus, 'pt-pt': pt_comoOuvirAVozDeDeus },
  'salmo-37-explicado': { 'pt-br': br_salmo37Explicado, 'pt-pt': pt_salmo37Explicado },
  'biblia-sobre-paciencia': { 'pt-br': br_bibliaSobrePaciencia, 'pt-pt': pt_bibliaSobrePaciencia },
  'gratidao-na-biblia': { 'pt-br': br_gratidaoNaBiblia, 'pt-pt': pt_gratidaoNaBiblia },
  'oracao-por-cura': { 'pt-br': br_oracaoPorCura, 'pt-pt': pt_oracaoPorCura },
  'versiculos-sobre-forca': { 'pt-br': br_versiculosSobreForca, 'pt-pt': pt_versiculosSobreForca },
  'dez-mandamentos-explicados': { 'pt-br': br_dezMandamentosExplicados, 'pt-pt': pt_dezMandamentosExplicados },
  'bem-aventurancas-significado': { 'pt-br': br_bemAventurancasSignificado, 'pt-pt': pt_bemAventurancasSignificado },
  'oracao-para-decisoes': { 'pt-br': br_oracaoParaDecisoes, 'pt-pt': pt_oracaoParaDecisoes },
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
