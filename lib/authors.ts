// Autores do blog (E-E-A-T). Fonte única para a página de autora, o byline dos
// artigos e o JSON-LD (Person / ProfilePage).
//
// Regra editorial: nada aqui pode afirmar credenciais verificáveis que não existam
// (diplomas, ordenação, livros, anos de ministério). Só descrevemos método e foco.

import { SITE_URL } from './constants';
import type { Locale } from '@/i18n/config';

export interface AuthorText {
  jobTitle: string;
  /** frase curta para o byline e meta description */
  tagline: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  tldr: string;
  bioTitle: string;
  bio: string[];
  focusTitle: string;
  focus: { title: string; body: string }[];
  methodTitle: string;
  methodIntro: string;
  method: string[];
  noteTitle: string;
  note: string;
  articlesTitle: string;
  bylinePrefix: string;
  boxTitle: string;
  boxCta: string;
  navLabel: string;
  photoAlt: string;
}

export interface Author {
  slug: string;
  name: string;
  /** caminho (sem idioma) da página da autora */
  path: string;
  image: string;
  imageSquare: string;
  knowsAbout: string[];
  text: Record<Locale, AuthorText>;
}

const ANA_METHOD_BR = [
  'Todo versículo citado é conferido na tradução João Ferreira de Almeida (domínio público), com a referência exata para você ler no seu próprio exemplar.',
  'Primeiro o contexto (quem escreveu, para quem, em que situação), depois a aplicação. Um versículo solto não vira promessa pessoal sem passar pelo texto à sua volta.',
  'Sem fórmulas de prosperidade, sem “palavras mágicas” e sem prometer o que a Bíblia não promete.',
  'Em sofrimento intenso (luto, depressão, pensamentos de se ferir), a Palavra caminha junto com o apoio de um pastor, de uma comunidade e de um profissional de saúde. Oração não substitui cuidado.',
];

const ANA_METHOD_PT = [
  'Todo o versículo citado é conferido na tradução João Ferreira de Almeida (domínio público), com a referência exata para ser lido no próprio exemplar.',
  'Primeiro o contexto (quem escreveu, para quem, em que situação), depois a aplicação. Um versículo solto não se torna promessa pessoal sem passar pelo texto à sua volta.',
  'Sem fórmulas de prosperidade, sem «palavras mágicas» e sem prometer o que a Bíblia não promete.',
  'Em sofrimento intenso (luto, depressão, pensamentos de se magoar), a Palavra caminha a par do apoio de um pastor, de uma comunidade e de um profissional de saúde. A oração não substitui o cuidado.',
];

export const ANA: Author = {
  slug: 'ana-branca-cardoso',
  name: 'Ana Branca Cardoso',
  path: 'autora/ana-branca-cardoso',
  image: '/autores/ana-branca-cardoso.jpg',
  imageSquare: '/autores/ana-branca-cardoso-sq.jpg',
  knowsAbout: [
    'Estudo bíblico',
    'Livro dos Salmos',
    'Oração cristã',
    'Leitura devocional da Bíblia',
    'Intercessão',
    'Vida de fé em comunidade',
  ],
  text: {
    'pt-br': {
      jobTitle: 'Cristã e estudiosa da Palavra de Deus',
      tagline: 'Cristã, estudiosa da Palavra de Deus. Escreve sobre oração, Salmos e leitura da Bíblia.',
      metaTitle: 'Ana Branca Cardoso — cristã e estudiosa da Palavra de Deus | Emori',
      metaDescription:
        'Conheça Ana Branca Cardoso, cristã e estudiosa da Palavra de Deus que escreve na Emori sobre oração, Salmos e leitura da Bíblia, com método e fontes à vista.',
      h1: 'Ana Branca Cardoso',
      tldr:
        'Ana Branca Cardoso é cristã e estudiosa da Palavra de Deus. Escreve na Emori sobre oração, Salmos e leitura da Bíblia, sempre partindo do texto bíblico e do seu contexto, e não de frases soltas.',
      bioTitle: 'Quem é Ana',
      bio: [
        'Ana Branca Cardoso é uma cristã que dedicou a sua vida de fé ao estudo da Palavra de Deus. O que a move não é a curiosidade acadêmica, e sim uma pergunta simples: o que este texto dizia às pessoas que o ouviram primeiro, e o que ele diz a quem ora hoje, de madrugada, sem saber o que pedir?',
        'Na Emori, Ana escreve os guias de oração e leitura bíblica para quem está começando e para quem voltou a orar depois de um tempo difícil. O estilo é o de quem conversa à mesa: claro, sem jargão teológico, mas sem simplificar o que a Bíblia realmente diz.',
        'O seu estudo passa especialmente pelo livro dos Salmos, a coleção de orações que o povo de Deus usa há milênios, e pelas palavras de Jesus sobre oração. É por aí que ela costuma começar quando alguém lhe pergunta como orar.',
      ],
      focusTitle: 'Áreas de estudo e escrita',
      focus: [
        { title: 'Salmos', body: 'A oração honesta: lamento, gratidão, medo e confiança, lidos no contexto original.' },
        { title: 'Oração no dia a dia', body: 'Como criar o hábito de orar, o que dizer quando faltam palavras e como orar pela família.' },
        { title: 'Leitura da Bíblia', body: 'Por onde começar, como ler sem se perder e como conferir o que você ouve.' },
        { title: 'Comunidade e intercessão', body: 'Orar uns pelos outros, grupos de oração e a fé vivida em conjunto.' },
      ],
      methodTitle: 'Como Ana escreve',
      methodIntro: 'Todo artigo assinado por Ana segue o mesmo compromisso editorial:',
      method: ANA_METHOD_BR,
      noteTitle: 'Uma nota de transparência',
      note:
        'Ana escreve como cristã estudiosa da Bíblia, não como autoridade eclesiástica. Os artigos não substituem o aconselhamento pastoral nem o cuidado de um profissional de saúde, e convidam sempre o leitor a ler o texto bíblico por conta própria.',
      articlesTitle: 'Artigos de Ana',
      bylinePrefix: 'Por',
      boxTitle: 'Sobre a autora',
      boxCta: 'Ver perfil e método de estudo',
      navLabel: 'Autora',
      photoAlt: 'Retrato de Ana Branca Cardoso, sorrindo, com um lenço azul na cabeça',
    },
    'pt-pt': {
      jobTitle: 'Cristã e estudiosa da Palavra de Deus',
      tagline: 'Cristã, estudiosa da Palavra de Deus. Escreve sobre oração, Salmos e leitura da Bíblia.',
      metaTitle: 'Ana Branca Cardoso — cristã e estudiosa da Palavra de Deus | Emori',
      metaDescription:
        'Conheça Ana Branca Cardoso, cristã e estudiosa da Palavra de Deus que escreve na Emori sobre oração, Salmos e leitura da Bíblia, com método e fontes à vista.',
      h1: 'Ana Branca Cardoso',
      tldr:
        'Ana Branca Cardoso é cristã e estudiosa da Palavra de Deus. Escreve na Emori sobre oração, Salmos e leitura da Bíblia, sempre a partir do texto bíblico e do seu contexto, e não de frases soltas.',
      bioTitle: 'Quem é a Ana',
      bio: [
        'Ana Branca Cardoso é uma cristã que dedicou a sua vida de fé ao estudo da Palavra de Deus. O que a move não é a curiosidade académica, mas uma pergunta simples: o que dizia este texto às pessoas que o ouviram primeiro, e o que diz hoje a quem ora de madrugada sem saber o que pedir?',
        'Na Emori, a Ana escreve os guias de oração e de leitura bíblica para quem está a começar e para quem voltou a orar depois de um tempo difícil. O estilo é o de quem conversa à mesa: claro, sem jargão teológico, mas sem simplificar o que a Bíblia realmente diz.',
        'O seu estudo passa em especial pelo livro dos Salmos, a coleção de orações que o povo de Deus usa há milénios, e pelas palavras de Jesus sobre a oração. É por aí que costuma começar quando alguém lhe pergunta como orar.',
      ],
      focusTitle: 'Áreas de estudo e escrita',
      focus: [
        { title: 'Salmos', body: 'A oração honesta: lamento, gratidão, medo e confiança, lidos no contexto original.' },
        { title: 'Oração no dia a dia', body: 'Como criar o hábito de orar, o que dizer quando faltam palavras e como orar pela família.' },
        { title: 'Leitura da Bíblia', body: 'Por onde começar, como ler sem se perder e como confirmar o que se ouve.' },
        { title: 'Comunidade e intercessão', body: 'Orar uns pelos outros, grupos de oração e a fé vivida em conjunto.' },
      ],
      methodTitle: 'Como a Ana escreve',
      methodIntro: 'Todos os artigos assinados pela Ana seguem o mesmo compromisso editorial:',
      method: ANA_METHOD_PT,
      noteTitle: 'Uma nota de transparência',
      note:
        'A Ana escreve como cristã estudiosa da Bíblia, não como autoridade eclesiástica. Os artigos não substituem o aconselhamento pastoral nem o cuidado de um profissional de saúde, e convidam sempre o leitor a ler o texto bíblico por si.',
      articlesTitle: 'Artigos da Ana',
      bylinePrefix: 'Por',
      boxTitle: 'Sobre a autora',
      boxCta: 'Ver perfil e método de estudo',
      navLabel: 'Autora',
      photoAlt: 'Retrato de Ana Branca Cardoso, a sorrir, com um lenço azul na cabeça',
    },
  },
};

export const DEFAULT_AUTHOR = ANA;

export const authorId = (a: Author) => `${SITE_URL}/#${a.slug}`;
