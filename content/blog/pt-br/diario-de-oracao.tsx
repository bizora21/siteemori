import type { ArticleModule } from '../types';
import InlineLink from '@/components/InlineLink';

const meta = {
  slug: 'diario-de-oracao',
  title: 'Diário de oração: como fazer e o que escrever',
  description:
    'O que é um diário de oração, por que escrever suas orações ajuda a fé, um modelo pronto de página e ideias do que anotar, inclusive as orações respondidas.',
  tldr: 'Um diário de oração é um caderno (ou aplicativo) onde você registra o que apresenta a Deus, o que agradece e o que percebe com o tempo. Para começar, anote a data, como você está, uma gratidão, um pedido e um versículo; depois deixe um espaço para completar quando algo acontecer. Reler essas páginas ajuda a lembrar o que Deus já fez.',
  datePublished: '2026-10-22',
  readingMinutes: 7,
  hero: {
    src: 'https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?ixid=M3w4MjU2NjZ8MHwxfHNlYXJjaHwxfHxoYW5kd3JpdHRlbiUyMGpvdXJuYWwlMjBwZW4lMjBub3RlYm9va3xlbnwxfDB8fHwxNzkyNjkzMjk3fDA&ixlib=rb-4.1.0&w=1600&q=80&auto=format&fit=crop',
    alt: 'Caneta-tinteiro sobre um caderno de espiral',
    credit: 'Aaron Burden',
    creditUrl: 'https://unsplash.com/@aaronburden?utm_source=aemori&utm_medium=referral',
  },
};

function Body() {
  return (
    <>
      <p>
        Orar e esquecer é um ciclo comum: você apresenta um pedido numa semana difícil e,
        meses depois, já não se lembra do que pediu nem de como as coisas se resolveram. O
        diário de oração é uma resposta simples a esse problema. Ele não substitui a oração,
        e sim a acompanha, guardando o que foi dito a Deus e o que aconteceu depois.
      </p>

      <h2>O que é um diário de oração?</h2>
      <p>
        É um caderno, ou um aplicativo, em que você escreve suas orações e o que está
        vivendo com elas: pedidos, gratidões, versículos que lhe falaram, intercessões por
        outras pessoas e, mais tarde, as respostas que percebeu. Não é um diário de fatos do
        dia inteiro: é um registro da sua conversa com Deus.
      </p>

      <h2>Há base bíblica para escrever e lembrar?</h2>
      <p>
        A Bíblia não manda ninguém manter um diário, mas valoriza muito a memória e o
        registro escrito, e isso ajuda a entender por que a prática faz sentido.
      </p>
      <ul>
        <li>
          <strong>Lembrar o que Deus fez.</strong> O salmista decide: “Recordarei os feitos
          do Senhor; sim, me lembrarei das tuas maravilhas da antiguidade. Meditarei também
          em todas as tuas obras, e ponderarei os teus feitos poderosos” (Salmos 77:11-12).
          Lembrar é um ato espiritual, e escrever é uma boa maneira de não deixar a memória
          falhar.
        </li>
        <li>
          <strong>Escrever para quem vem depois.</strong> Outro salmo diz: “Escreva-se isto
          para a geração futura, para que um povo que está por vir louve ao Senhor” (Salmos
          102:18). O registro escrito serve de testemunho, inclusive para os seus filhos e
          netos.
        </li>
        <li>
          <strong>Escrever para não perder o que foi dito.</strong> O profeta Habacuque, que
          tinha feito perguntas duras a Deus, recebe esta orientação: “Escreve a visão”
          (Habacuque 2:2). O texto continua dizendo que ela deve ficar clara o bastante para
          ser lida com facilidade.
        </li>
        <li>
          <strong>Não esquecer.</strong> Em Deuteronômio, o povo é avisado: “guarda-te, que
          não te esqueças do Senhor, que te tirou da terra do Egito, da casa da servidão”
          (Deuteronômio 6:12). O esquecimento é tratado como um risco real.
        </li>
      </ul>

      <h2>Como começar um diário de oração</h2>
      <ol>
        <li>
          <strong>Escolha o formato.</strong> Um caderno simples, uma agenda ou um aplicativo
          no celular. O melhor é o que você vai realmente abrir.
        </li>
        <li>
          <strong>Defina quando.</strong> Logo depois da oração do dia costuma funcionar,
          porque a conversa ainda está fresca. Cinco minutos bastam.
        </li>
        <li>
          <strong>Use sempre a mesma estrutura.</strong> Uma estrutura fixa tira a ansiedade
          da página em branco. Veja o modelo a seguir.
        </li>
        <li>
          <strong>Escreva com honestidade.</strong> Dúvida, cansaço e raiva também são
          orações. O diário é só entre você e Deus.
        </li>
      </ol>

      <h2>Modelo de página pronta</h2>
      <ul>
        <li>
          <strong>Data e como estou:</strong> “3 de novembro. Cansado e preocupado com o
          exame de amanhã.”
        </li>
        <li>
          <strong>Versículo do dia:</strong> a referência e uma frase que chamou a atenção.
        </li>
        <li>
          <strong>Gratidão:</strong> uma a três coisas específicas.
        </li>
        <li>
          <strong>Pedidos:</strong> por mim, por alguém que amo, por uma situação concreta.
        </li>
        <li>
          <strong>O que percebi:</strong> uma frase sobre algo que sentiu ou entendeu.
        </li>
        <li>
          <strong>Resposta (preencher depois):</strong> um espaço em branco para completar
          quando algo acontecer.
        </li>
      </ul>

      <h2>Como registrar as orações respondidas</h2>
      <p>
        Esse é o hábito que mais transforma o diário. Quando algo mudar, volte à página do
        pedido, escreva a data e o que aconteceu. Seja honesto: às vezes a resposta chega
        diferente do que você pediu, ou muito mais tarde, ou de um modo que só se entende
        olhando para trás. Registrar assim ajuda a ver o conjunto, porque o que você
        pediu e o que aconteceu ficam lado a lado. Se uma oração parece
        sem resposta, leia também{' '}
        <InlineLink href="/pt-br/blog/por-que-deus-nao-responde/">
          por que Deus parece não responder
        </InlineLink>
        .
      </p>

      <h2>Quando reler</h2>
      <p>
        Reserve um momento por mês, ou ao fim de uma fase difícil, para reler as páginas. É
        nessa releitura que o diário mostra o seu valor: você vê o que mudou, o que
        continua aberto e quantas vezes agradeceu por algo que antes era só uma preocupação.
        Muitos usam esse momento para uma{' '}
        <InlineLink href="/pt-br/blog/oracao-de-gratidao/">oração de gratidão</InlineLink>.
      </p>

      <h2>Erros comuns</h2>
      <ul>
        <li>
          <strong>Querer escrever muito.</strong> Duas ou três frases por dia já são um
          diário.
        </li>
        <li>
          <strong>Escrever só quando se sente bem.</strong> Os dias difíceis são os que mais
          valem a pena registrar.
        </li>
        <li>
          <strong>Abandonar por ter faltado.</strong> Volte à próxima página, sem rasgar nem
          se culpar. Para ligar o diário a uma rotina, veja{' '}
          <InlineLink href="/pt-br/blog/oracao-diaria-habito/">
            como criar o hábito da oração diária
          </InlineLink>
          .
        </li>
      </ul>

      <p>
        No Emori, você registra sua oração do dia, vê o histórico num calendário e acompanha
        os marcos da sua constância. Se ainda está começando a orar, o guia{' '}
        <InlineLink href="/pt-br/blog/como-orar-iniciantes/">como orar</InlineLink> pode ser
        um bom ponto de partida.
      </p>

      <p>
        <em>Citações bíblicas: tradução João Ferreira de Almeida (domínio público).</em>
      </p>
    </>
  );
}

const faq = [
  {
    q: 'O que escrever em um diário de oração?',
    a: 'A data, como você está, uma ou mais gratidões, seus pedidos (por você e pelos outros), um versículo que lhe falou e um espaço para anotar depois a resposta. Duas ou três frases por dia já são suficientes.',
  },
  {
    q: 'A Bíblia fala em escrever as orações?',
    a: 'Não há um mandamento de manter um diário, mas a Bíblia valoriza lembrar e registrar o que Deus faz: o salmista decide recordar os feitos do Senhor (Salmos 77:11-12), e há o registro “para a geração futura” (Salmos 102:18). O diário é uma forma prática de seguir esse espírito.',
  },
  {
    q: 'Como registrar orações respondidas?',
    a: 'Volte à página do pedido, anote a data e o que aconteceu, com honestidade. Se a resposta veio diferente do que você pediu, escreva isso também. Ver os dois lado a lado ajuda a perceber o que mudou ao longo do tempo.',
  },
  {
    q: 'Prefiro digitar: um aplicativo serve como diário de oração?',
    a: 'Serve, se você abrir com regularidade. O mais importante é manter o hábito: o suporte, caderno ou aplicativo, é secundário.',
  },
  {
    q: 'Com que frequência devo reler o diário?',
    a: 'Uma vez por mês, ou ao fim de uma fase difícil, é um bom ritmo. A releitura mostra o que mudou, o que continua aberto e por que você tem a agradecer.',
  },
];

const article: ArticleModule = { meta, Body, faq };
export default article;
