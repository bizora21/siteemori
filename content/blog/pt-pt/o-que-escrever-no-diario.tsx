import type { ArticleModule } from '../types';

const meta = {
  slug: 'o-que-escrever-no-diario',
  title: 'O que escrever no diário quando não sabes o que estás a sentir',
  description:
    'Quando não sabes o que sentes, escreve sobre o corpo, sobre o dia e responde a perguntas simples. Um guia com sugestões para destravar o diário.',
  tldr: 'Quando não sabes o que estás a sentir, não tentes nomear a emoção logo. Começa por descrever o corpo (“tenho o peito apertado”), o que aconteceu no dia e o que evitas pensar. A emoção costuma aparecer sozinha quando deixas de a tentar forçar.',
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
    q: 'É normal não saber o que estou a sentir?',
    a: 'Totalmente. As emoções raramente vêm nomeadas e muitas vezes são misturas. Identificar sentimentos é uma competência que se desenvolve com a prática — inclusive a escrever.',
  },
  {
    q: 'Como transformar “não sei” em algo escrito?',
    a: 'Começa pelo corpo (onde há tensão, como está a respiração) e pelo dia (o que aconteceu, por ordem). Essas pistas concretas costumam revelar a emoção sem teres de a adivinhar.',
  },
  {
    q: 'As sugestões ajudam ou viciam?',
    a: 'Ajudam, sobretudo no início. Reduzem o atrito da página em branco. Com o tempo precisas cada vez menos delas, mas não há problema em usá-las sempre que travares.',
  },
  {
    q: 'Escrever “não sei o que sinto” conta como diário?',
    a: 'Conta. Descrever a ausência ou a confusão é um registo emocional legítimo. O objetivo é a honestidade, não uma emoção “interessante”.',
  },
];

const article: ArticleModule = { meta, Body, faq };
export default article;
