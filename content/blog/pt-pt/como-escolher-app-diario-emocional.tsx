import type { ArticleModule } from '../types';

const meta = {
  slug: 'como-escolher-app-diario-emocional',
  title: 'Como escolher uma aplicação de diário emocional (guia 2026)',
  description:
    'Que aplicação de diário emocional escolher? Vê os critérios que importam mesmo — memória, voz, privacidade e preço — para encontrares a app certa para ti.',
  tldr: 'Para escolher uma aplicação de diário emocional, avalia cinco coisas: se ela se lembra do teu contexto, se aceita voz além de texto, como trata a tua privacidade, se é fácil de manter como hábito e o preço. A memória é o critério que mais muda a experiência: uma app que se lembra do que contaste torna a reflexão pessoal em vez de genérica.',
  datePublished: '2026-07-05',
  readingMinutes: 7,
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
    q: 'Qual é a melhor aplicação de diário emocional?',
    a: 'Não existe uma única "melhor" — depende do que valorizas. Mas o critério que mais diferencia é a memória: uma app que se lembra do teu contexto torna a reflexão pessoal em vez de genérica. Avalia também voz, privacidade, facilidade de hábito e preço.',
  },
  {
    q: 'Vale a pena usar uma aplicação de diário com IA?',
    a: 'Vale, se a IA fizer boas perguntas e, sobretudo, se se lembrar do que já contaste. Uma IA sem memória recomeça do zero a cada dia e ajuda pouco. Com memória, liga o que viveste ao longo do tempo.',
  },
  {
    q: 'As aplicações de diário emocional são seguras?',
    a: 'Depende da app. Lê sempre a política de privacidade: o que é recolhido, se há cifragem, se os dados são vendidos e se podes exportar ou apagar tudo. Um diário é íntimo e merece uma app que trate a privacidade como prioridade.',
  },
  {
    q: 'Preciso de pagar por uma aplicação de diário emocional?',
    a: 'Nem sempre. Muitas, como a Emori, são gratuitas para começar e usar no dia a dia, com um plano pago opcional para funcionalidades avançadas como memória alargada e voz sem limite.',
  },
];

const article: ArticleModule = { meta, Body, faq };
export default article;
