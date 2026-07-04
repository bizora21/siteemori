import type { ArticleModule } from '../types';

const meta = {
  slug: 'escrever-para-lidar-com-ansiedade',
  title: 'Como a escrita ajuda a lidar com a ansiedade',
  description:
    'Escrever tira a ansiedade do ciclo mental e coloca-a em palavras concretas. Percebe porque isso acalma e como usar o diário nos momentos de ansiedade.',
  tldr: 'Escrever ajuda na ansiedade porque tira os pensamentos do ciclo mental e transforma-os em palavras concretas, o que reduz a ruminação e devolve a sensação de controlo. Nos picos, funciona um “despejo” de tudo o que está na cabeça; no dia a dia, escrever regularmente ajuda a identificar gatilhos antes que cresçam.',
  datePublished: '2026-07-04',
  readingMinutes: 6,
};

function Body() {
  return (
    <>
      {/* TODO: localizar PT-PT — traduzir o corpo completo a partir da variante pt-br. */}
      <p>{meta.tldr}</p>
    </>
  );
}

const faq = [
  {
    q: 'Escrever ajuda mesmo com a ansiedade?',
    a: 'Sim, como ferramenta de apoio. Colocar pensamentos ansiosos em palavras reduz a ruminação, ajuda a nomear a emoção e devolve a sensação de controlo. Não substitui tratamento, mas é um recurso acessível e eficaz no dia a dia.',
  },
  {
    q: 'O que escrever durante uma crise de ansiedade?',
    a: 'Faz um despejo mental: escreve ou grava tudo o que está na cabeça, sem ordem nem filtro. O objetivo é esvaziar, não redigir. Depois, se conseguires, relê para separar o que é real do que é catastrofização.',
  },
  {
    q: 'É melhor escrever ou gravar áudio quando estou ansioso?',
    a: 'Nos picos, muitas pessoas acham o áudio mais fácil, porque acompanha o ritmo acelerado do pensamento e não exige concentração para escrever. No dia a dia mais calmo, escrever ajuda a organizar melhor.',
  },
  {
    q: 'Com que frequência escrever para reduzir a ansiedade?',
    a: 'Um pouco todos os dias funciona melhor do que sessões longas e raras. A regularidade é o que revela os teus gatilhos e permite agir antes que a ansiedade cresça.',
  },
];

const article: ArticleModule = { meta, Body, faq };
export default article;
