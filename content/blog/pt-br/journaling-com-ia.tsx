import type { ArticleModule } from '../types';

const meta = {
  slug: 'journaling-com-ia',
  title: 'Journaling com IA: como uma app que lembra muda a experiência',
  description:
    'Journaling com IA transforma o diário numa conversa. Entenda como uma app que lembra do seu contexto muda a prática — e o que observar ao escolher uma.',
  tldr: 'Journaling com IA é escrever num app onde uma inteligência artificial responde, faz perguntas e — no melhor caso — lembra do seu contexto. A memória é o que muda tudo: em vez de recomeçar do zero a cada dia, o app conecta o que você viveu ao longo do tempo, tornando a reflexão mais profunda e pessoal.',
  datePublished: '2026-07-04',
  readingMinutes: 6,
};

function Body() {
  return (
    <>
      <p>
        Durante séculos, journaling foi uma conversa com você mesmo. A IA acrescenta uma
        segunda voz — uma que responde, pergunta e ajuda a puxar o fio. Mas nem toda IA de
        journaling é igual. A diferença entre um brinquedo e uma ferramenta real está numa
        palavra: <strong>memória</strong>.
      </p>

      <h2>O que é journaling com IA?</h2>
      <p>
        É a prática de manter um diário num aplicativo onde uma inteligência artificial
        interage com o que você escreve. Em vez de encarar uma página em branco, você
        recebe perguntas, reflexos e provocações gentis que ajudam a chegar mais fundo do
        que você chegaria sozinho. A escrita vira conversa.
      </p>

      <h2>Por que a memória muda tudo?</h2>
      <p>
        A maioria dos apps de journaling com IA sofre de amnésia: cada sessão começa do
        zero, como se você fosse um estranho. É como fazer terapia com alguém que esquece
        de você toda semana. Um app com memória real é o oposto — ele lembra quem são as
        pessoas da sua vida, o que te preocupa, o que você disse mês passado. Aí a
        reflexão deixa de ser genérica e passa a ser <strong>sua</strong>.
      </p>
      <p>
        É essa a ideia central da Emori: ela não é um chatbot que responde e esquece. Ela
        guarda o contexto do que importa e traz de volta quando faz sentido — “da última
        vez você falou disso, mudou alguma coisa?”. A memória transforma registros soltos
        num fio contínuo.
      </p>

      <h2>O que a IA acrescenta que o papel não tem?</h2>
      <ul>
        <li>
          <strong>Perguntas na hora certa:</strong> ela quebra a página em branco puxando
          o próximo passo quando você trava.
        </li>
        <li>
          <strong>Padrões que você não veria:</strong> conectando semanas de registros, a
          IA aponta repetições que passariam despercebidas.
        </li>
        <li>
          <strong>Voz, não só texto:</strong> você desabafa falando e a IA transcreve e
          entende — útil nos dias sem energia para escrever.
        </li>
        <li>
          <strong>Companhia sem julgamento:</strong> um espaço para dizer o que talvez não
          diria a ninguém, no seu ritmo.
        </li>
      </ul>

      <h2>Journaling com IA substitui escrever “de verdade”?</h2>
      <p>
        Não substitui — expande. Você continua sendo o autor; a IA é quem faz as boas
        perguntas. Quem gosta do caderno pode manter o caderno. Mas para quem sempre
        travou na página em branco ou nunca conseguiu manter o hábito, a conversa é o
        empurrão que faltava.
      </p>

      <h2>O que observar ao escolher um app de journaling com IA?</h2>
      <ol>
        <li>
          <strong>Tem memória de verdade?</strong> Ele lembra do que você contou antes, ou
          recomeça do zero?
        </li>
        <li>
          <strong>Respeita sua privacidade?</strong> Leia a política. Seu diário é íntimo
          e deve ser tratado como tal.
        </li>
        <li>
          <strong>Aceita voz?</strong> Poder falar amplia muito os momentos em que você
          consegue usar.
        </li>
        <li>
          <strong>Conversa ou interroga?</strong> As perguntas soam humanas e gentis, ou
          parecem um formulário?
        </li>
      </ol>

      <h2>E os limites?</h2>
      <p>
        Uma IA de journaling é uma ferramenta de autoconhecimento, não uma terapeuta. Ela
        não diagnostica nem trata. Para sofrimento intenso ou persistente, procure um
        profissional — o app pode ser um bom complemento entre as sessões, jamais um
        substituto do cuidado humano.
      </p>
    </>
  );
}

const faq = [
  {
    q: 'O que é journaling com IA?',
    a: 'É manter um diário num app onde uma inteligência artificial responde ao que você escreve, faz perguntas e ajuda a refletir. A escrita se torna uma conversa em vez de uma página em branco.',
  },
  {
    q: 'Por que a memória importa num app de journaling com IA?',
    a: 'Porque sem memória cada sessão recomeça do zero, e a reflexão fica genérica. Um app que lembra do seu contexto conecta o que você viveu ao longo do tempo, tornando as respostas pessoais e mais profundas. É o diferencial da Emori.',
  },
  {
    q: 'Journaling com IA substitui terapia?',
    a: 'Não. É uma ferramenta de autoconhecimento e escrita, não um serviço de saúde. Pode complementar o cuidado entre as sessões, mas não substitui acompanhamento profissional.',
  },
  {
    q: 'Preciso saber escrever bem para usar?',
    a: 'Não. Apps como a Emori aceitam voz e fazem perguntas simples que guiam você. O foco é a honestidade e a reflexão, não a qualidade da escrita.',
  },
];

const article: ArticleModule = { meta, Body, faq };
export default article;
