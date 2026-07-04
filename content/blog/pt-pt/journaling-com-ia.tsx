import type { ArticleModule } from '../types';

const meta = {
  slug: 'journaling-com-ia',
  title: 'Journaling com IA: como uma aplicação que se lembra muda a experiência',
  description:
    'Journaling com IA transforma o diário numa conversa. Percebe como uma aplicação que se lembra do teu contexto muda a prática — e o que observar ao escolher uma.',
  tldr: 'Journaling com IA é escrever numa aplicação onde uma inteligência artificial responde, faz perguntas e — no melhor caso — se lembra do teu contexto. A memória é o que muda tudo: em vez de recomeçar do zero a cada dia, a aplicação liga o que viveste ao longo do tempo, tornando a reflexão mais profunda e pessoal.',
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
    q: 'O que é journaling com IA?',
    a: 'É manter um diário numa aplicação onde uma inteligência artificial responde ao que escreves, faz perguntas e ajuda a refletir. A escrita torna-se uma conversa em vez de uma página em branco.',
  },
  {
    q: 'Porque é que a memória importa numa aplicação de journaling com IA?',
    a: 'Porque sem memória cada sessão recomeça do zero, e a reflexão fica genérica. Uma aplicação que se lembra do teu contexto liga o que viveste ao longo do tempo, tornando as respostas pessoais e mais profundas. É o diferencial da Emori.',
  },
  {
    q: 'O journaling com IA substitui terapia?',
    a: 'Não. É uma ferramenta de autoconhecimento e escrita, não um serviço de saúde. Pode complementar o cuidado entre as sessões, mas não substitui acompanhamento profissional.',
  },
  {
    q: 'Preciso de saber escrever bem para usar?',
    a: 'Não. Aplicações como a Emori aceitam voz e fazem perguntas simples que te guiam. O foco é a honestidade e a reflexão, não a qualidade da escrita.',
  },
];

const article: ArticleModule = { meta, Body, faq };
export default article;
