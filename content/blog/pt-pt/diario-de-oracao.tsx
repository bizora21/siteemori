import type { ArticleModule } from '../types';
import InlineLink from '@/components/InlineLink';

const meta = {
  slug: 'diario-de-oracao',
  title: 'Diário de oração: como fazer e o que escrever',
  description:
    'O que é um diário de oração, porque escrever as tuas orações ajuda a fé, um modelo pronto de página e ideias do que anotar, incluindo as orações respondidas.',
  tldr: 'Um diário de oração é um caderno (ou aplicação) onde registas o que apresentas a Deus, o que agradeces e o que vais percebendo com o tempo. Para começar, anota a data, como estás, uma gratidão, um pedido e um versículo; depois deixa um espaço para completar quando algo acontecer. Reler estas páginas ajuda a lembrar o que Deus já fez.',
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
        Orar e esquecer é um ciclo comum: apresentas um pedido numa semana difícil e, meses
        depois, já não te lembras do que pediste nem de como as coisas se resolveram. O diário
        de oração é uma resposta simples a este problema. Não substitui a oração, acompanha-a,
        guardando o que foi dito a Deus e o que aconteceu depois.
      </p>

      <h2>O que é um diário de oração?</h2>
      <p>
        É um caderno, ou uma aplicação, onde escreves as tuas orações e o que vais vivendo com
        elas: pedidos, gratidões, versículos que te falaram, intercessões por outras pessoas
        e, mais tarde, as respostas que fores percebendo. Não é um diário de factos do dia
        inteiro: é um registo da tua conversa com Deus.
      </p>

      <h2>Há base bíblica para escrever e lembrar?</h2>
      <p>
        A Bíblia não manda ninguém manter um diário, mas valoriza muito a memória e o registo
        escrito, e isso ajuda a perceber porque a prática faz sentido.
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
          102:18). O registo escrito serve de testemunho, inclusive para os teus filhos e
          netos.
        </li>
        <li>
          <strong>Escrever para não perder o que foi dito.</strong> O profeta Habacuque, que
          tinha feito perguntas duras a Deus, recebe esta orientação: “Escreve a visão”
          (Habacuque 2:2). O texto continua a dizer que ela deve ficar clara o bastante para
          ser lida com facilidade.
        </li>
        <li>
          <strong>Não esquecer.</strong> No Deuteronómio, o povo é avisado: “guarda-te, que
          não te esqueças do Senhor, que te tirou da terra do Egito, da casa da servidão”
          (Deuteronómio 6:12). O esquecimento é tratado como um risco real.
        </li>
      </ul>

      <h2>Como começar um diário de oração</h2>
      <ol>
        <li>
          <strong>Escolhe o formato.</strong> Um caderno simples, uma agenda ou uma aplicação
          no telemóvel. O melhor é aquele que vais mesmo abrir.
        </li>
        <li>
          <strong>Define quando.</strong> Logo a seguir à oração do dia costuma resultar,
          porque a conversa ainda está fresca. Cinco minutos chegam.
        </li>
        <li>
          <strong>Usa sempre a mesma estrutura.</strong> Uma estrutura fixa tira a ansiedade
          da página em branco. Vê o modelo que se segue.
        </li>
        <li>
          <strong>Escreve com honestidade.</strong> Dúvida, cansaço e zanga também são
          orações. O diário é só entre ti e Deus.
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
          <strong>Pedidos:</strong> por mim, por alguém de quem gosto, por uma situação
          concreta.
        </li>
        <li>
          <strong>O que percebi:</strong> uma frase sobre algo que senti ou entendi.
        </li>
        <li>
          <strong>Resposta (preencher depois):</strong> um espaço em branco para completar
          quando algo acontecer.
        </li>
      </ul>

      <h2>Como registar as orações respondidas</h2>
      <p>
        Este é o hábito que mais transforma o diário. Quando algo mudar, volta à página do
        pedido, escreve a data e o que aconteceu. Sê honesto: às vezes a resposta chega
        diferente do que pediste, ou muito mais tarde, ou de um modo que só se percebe a olhar
        para trás. Registar assim ajuda a ver o conjunto, porque o que pediste e o que
        aconteceu ficam lado a lado. Se uma oração parece sem resposta, lê também{' '}
        <InlineLink href="/pt-pt/blog/por-que-deus-nao-responde/">
          porque é que Deus parece não responder
        </InlineLink>
        .
      </p>

      <h2>Quando reler</h2>
      <p>
        Reserva um momento por mês, ou no fim de uma fase difícil, para reler as páginas. É
        nessa releitura que o diário mostra o seu valor: vês o que mudou, o que continua em
        aberto e quantas vezes agradeceste por algo que antes era só uma preocupação. Muita
        gente aproveita esse momento para uma{' '}
        <InlineLink href="/pt-pt/blog/oracao-de-gratidao/">oração de gratidão</InlineLink>.
      </p>

      <h2>Erros comuns</h2>
      <ul>
        <li>
          <strong>Querer escrever demais.</strong> Duas ou três frases por dia já são um
          diário.
        </li>
        <li>
          <strong>Escrever só quando se está bem.</strong> Os dias difíceis são os que mais
          vale a pena registar.
        </li>
        <li>
          <strong>Abandonar por ter faltado.</strong> Volta à página seguinte, sem rasgar nem
          te culpares. Para ligar o diário a uma rotina, vê{' '}
          <InlineLink href="/pt-pt/blog/oracao-diaria-habito/">
            como criar o hábito da oração diária
          </InlineLink>
          .
        </li>
      </ul>

      <p>
        Na Emori, registas a tua oração do dia, vês o histórico num calendário e acompanhas
        os marcos da tua constância. Se ainda estás a começar a orar, o guia{' '}
        <InlineLink href="/pt-pt/blog/como-orar-iniciantes/">como orar</InlineLink> pode ser
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
    q: 'O que escrever num diário de oração?',
    a: 'A data, como estás, uma ou mais gratidões, os teus pedidos (por ti e pelos outros), um versículo que te falou e um espaço para anotar depois a resposta. Duas ou três frases por dia já são suficientes.',
  },
  {
    q: 'A Bíblia fala em escrever as orações?',
    a: 'Não há um mandamento de manter um diário, mas a Bíblia valoriza lembrar e registar o que Deus faz: o salmista decide recordar os feitos do Senhor (Salmos 77:11-12), e há o registo “para a geração futura” (Salmos 102:18). O diário é uma forma prática de seguir esse espírito.',
  },
  {
    q: 'Como registar orações respondidas?',
    a: 'Volta à página do pedido, anota a data e o que aconteceu, com honestidade. Se a resposta veio diferente do que pediste, escreve isso também. Ver os dois lado a lado ajuda a perceber o que mudou ao longo do tempo.',
  },
  {
    q: 'Prefiro escrever no telemóvel: uma aplicação serve como diário de oração?',
    a: 'Serve, se a abrires com regularidade. O mais importante é manter o hábito: o suporte, caderno ou aplicação, é secundário.',
  },
  {
    q: 'Com que frequência devo reler o diário?',
    a: 'Uma vez por mês, ou no fim de uma fase difícil, é um bom ritmo. A releitura mostra o que mudou, o que continua em aberto e o que tens para agradecer.',
  },
];

const article: ArticleModule = { meta, Body, faq };
export default article;
