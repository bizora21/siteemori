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
      <p>
        Durante séculos, journaling foi uma conversa contigo mesmo. A IA acrescenta uma
        segunda voz — uma que responde, pergunta e ajuda a puxar o fio. Mas nem toda a IA de
        journaling é igual. A diferença entre um brinquedo e uma ferramenta a sério está
        numa palavra: <strong>memória</strong>.
      </p>

      <h2>O que é journaling com IA?</h2>
      <p>
        É a prática de manter um diário numa aplicação onde uma inteligência artificial
        interage com o que escreves. Em vez de encarares uma página em branco, recebes
        perguntas, reflexos e provocações gentis que ajudam a chegar mais fundo do que
        chegarias sozinho. A escrita torna-se conversa.
      </p>

      <h2>Porque é que a memória muda tudo?</h2>
      <p>
        A maioria das apps de journaling com IA sofre de amnésia: cada sessão começa do
        zero, como se fosses um estranho. É como fazer terapia com alguém que se esquece de
        ti todas as semanas. Uma app com memória a sério é o oposto — lembra-se de quem são
        as pessoas da tua vida, do que te preocupa, do que disseste no mês passado. Aí a
        reflexão deixa de ser genérica e passa a ser <strong>tua</strong>.
      </p>
      <p>
        É essa a ideia central da Emori: não é um chatbot que responde e esquece. Guarda o
        contexto do que importa e traz de volta quando faz sentido — “da última vez falaste
        disto, mudou alguma coisa?”. A memória transforma registos soltos num fio contínuo.
      </p>

      <h2>O que a IA acrescenta que o papel não tem?</h2>
      <ul>
        <li>
          <strong>Perguntas na hora certa:</strong> quebra a página em branco puxando o
          próximo passo quando travas.
        </li>
        <li>
          <strong>Padrões que não verias:</strong> ao ligar semanas de registos, a IA
          aponta repetições que passariam despercebidas.
        </li>
        <li>
          <strong>Memória que continua:</strong> ao contrário do papel, uma boa app
          lembra-se do que escreveste e liga uma entrada à outra ao longo do tempo.
        </li>
        <li>
          <strong>Companhia sem julgamento:</strong> um espaço para dizer o que talvez não
          dirias a ninguém, ao teu ritmo.
        </li>
      </ul>

      <h2>Journaling com IA substitui escrever “a sério”?</h2>
      <p>
        Não substitui — expande. Continuas a ser o autor; a IA é quem faz as boas
        perguntas. Quem gosta do caderno pode manter o caderno. Mas para quem sempre travou
        na página em branco ou nunca conseguiu manter o hábito, a conversa é o empurrão que
        faltava.
      </p>

      <h2>O que observar ao escolher uma app de journaling com IA?</h2>
      <ol>
        <li>
          <strong>Tem memória a sério?</strong> Lembra-se do que contaste antes, ou recomeça
          do zero?
        </li>
        <li>
          <strong>Respeita a tua privacidade?</strong> Lê a política. O teu diário é íntimo
          e deve ser tratado como tal.
        </li>
        <li>
          <strong>Reconhece padrões?</strong> Liga os teus registos ao longo do tempo e
          ajuda a ver o que se repete, ou guarda tudo solto?
        </li>
        <li>
          <strong>Conversa ou interroga?</strong> As perguntas soam humanas e gentis, ou
          parecem um formulário?
        </li>
      </ol>

      <h2>E os limites?</h2>
      <p>
        Uma IA de journaling é uma ferramenta de autoconhecimento, não uma terapeuta. Não
        diagnostica nem trata. Para sofrimento intenso ou persistente, procura um
        profissional — a app pode ser um bom complemento entre as sessões, jamais um
        substituto do cuidado humano.
      </p>
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
    a: 'Não. Aplicações como a Emori fazem perguntas simples que te guiam. O foco é a honestidade e a reflexão, não a qualidade da escrita.',
  },
];

const article: ArticleModule = { meta, Body, faq };
export default article;
