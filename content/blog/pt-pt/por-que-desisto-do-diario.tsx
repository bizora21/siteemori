import type { ArticleModule } from '../types';
import InlineLink from '@/components/InlineLink';

const meta = {
  slug: 'por-que-desisto-do-diario',
  title: 'Porque é que desisto sempre do diário',
  description:
    'Começas entusiasmado e paras na segunda semana. Não é falta de disciplina — é que o diário te faz recomeçar do zero de cada vez. Percebe o mecanismo e como contorná-lo.',
  tldr: 'Quase ninguém desiste do diário por preguiça. Desiste porque cada sessão começa do zero: página em branco, nenhuma memória do que escreveste antes e nenhum retorno visível pelo esforço. O que sustenta o hábito não é disciplina nem sequências de dias — é baixar o custo de começar e conseguir ver algo de volta.',
  datePublished: '2026-08-23',
  readingMinutes: 7,
  hero: {
    src: 'https://images.unsplash.com/photo-1556970181-98e37c414e87?ixid=M3w4MjU2NjZ8MHwxfHNlYXJjaHwxfHxjbG9zZWQlMjBub3RlYm9vayUyMHBlbiUyMGRlc2slMjBtb3JuaW5nJTIwbGlnaHR8ZW58MXwwfHx8MTc4NzUwNzcwN3ww&ixlib=rb-4.1.0&w=1600&q=80&auto=format&fit=crop',
    alt: 'Caderno fechado sobre uma mesa de madeira com luz da manhã',
    credit: 'Ellen Tanner',
    creditUrl: 'https://unsplash.com/@ellentanner?utm_source=aemori&utm_medium=referral',
  },
};

function Body() {
  return (
    <>
      <p>
        Já começaste um diário. Provavelmente mais do que uma vez. Escreveste com vontade
        nos primeiros dias, falhaste um, falhaste dois, e três semanas depois o caderno
        estava numa gaveta com sete páginas usadas.
      </p>
      <p>
        A conclusão que quase toda a gente tira é "não tenho disciplina". É uma conclusão
        confortável porque explica tudo — e é precisamente por isso que atrapalha: quem
        acredita nela tenta resolver com mais força de vontade, que é exatamente o recurso
        que já faltou da última vez.
      </p>
      <p>Vale a pena olhar para o mecanismo real.</p>

      <h2>O diário faz-te recomeçar do zero de cada vez</h2>
      <p>Abre um caderno hoje. O que está lá? Uma página em branco.</p>
      <p>
        Ela não sabe que discutiste com alguém na terça. Não sabe que andas a dormir mal
        há três semanas. Não sabe que aquele assunto do trabalho já apareceu quatro vezes.{' '}
        <strong>Cada sessão começa sem contexto</strong>, e és tu que tens de carregar
        tudo outra vez para dentro da página.
      </p>
      <p>
        Isto tem um custo que ninguém contabiliza. Antes de escreveres seja o que for,
        tens de decidir sobre o que escrever, lembrar-te de onde ficaste e reconstruir o
        assunto. Num dia bom, tudo bem. Num dia cansado — que é quando mais precisarias —
        esse custo é maior do que a energia disponível. E deixas para amanhã.
      </p>

      <h2>A página em branco não é liberdade</h2>
      <p>
        Crescemos a ouvir que o diário é livre: escreve o que quiseres. Só que "escreve o
        que quiseres" transfere-te mais uma decisão, num momento em que já não sabes o que
        sentes.
      </p>
      <p>
        Repara que ninguém trava quando alguém pergunta "como foi o teu dia?". Trava
        quando tem de começar do nada. A pergunta não é um limite — é um apoio.
      </p>

      <h2>A armadilha da sequência de dias</h2>
      <p>
        Muitas apps põem um contador de dias seguidos. Parece motivação, e resulta durante
        uns dias. O problema aparece na primeira falha.
      </p>
      <p>
        Quando o valor está na sequência, quebrá-la apaga o valor. Não perdes um dia:
        perdes o progresso inteiro. E a conta muda de "escrevi 11 dias" — que é ótimo —
        para "falhei", que é motivo para largar.
      </p>
      <p>Onze dias de escrita continuam a ser onze dias. O contador é que mentiu.</p>

      <h2>O motivo mais silencioso: não acontece nada com o que escreves</h2>
      <p>É o que menos aparece nos artigos e provavelmente o mais decisivo.</p>
      <p>
        Escreves, fechas o caderno, e aquilo nunca mais é lido — nem por ti. O esforço
        existiu, o retorno não. Nenhum hábito sobrevive muito tempo assim: o cérebro deixa
        de investir em coisas que não devolvem nada.
      </p>
      <p>
        E o retorno do diário não está no ato de escrever. Está em <strong>ver o que se
        repete</strong>. Só descobres que ficas sempre em baixo depois das reuniões com
        determinada pessoa quando vês isso escrito quatro vezes. Quem nunca relê nunca
        chega a essa parte — e desiste antes do único momento em que o diário compensa
        mesmo.
      </p>

      <h2>O que sustenta o hábito</h2>
      <ol>
        <li>
          <strong>Baixa a fasquia até parecer ridículo.</strong> Uma frase conta. "Hoje foi
          pesado" é uma entrada válida. O objetivo não é o texto, é não quebrar o contacto.
        </li>
        <li>
          <strong>Escreve quando acontece alguma coisa, não a horas fixas.</strong> Rotina
          de horário resulta para o ginásio. A emoção não tem hora marcada.
        </li>
        <li>
          <strong>Começa por uma pergunta, nunca pela página vazia.</strong> "O que é que
          ficou atravessado hoje?" tira-te do zero.
        </li>
        <li>
          <strong>Relê uma vez por semana.</strong> Cinco minutos. É aqui que o diário
          deixa de ser tarefa e passa a ferramenta.
        </li>
        <li>
          <strong>Esquece a sequência.</strong> Voltar ao fim de duas semanas parado não é
          recomeçar: é continuar.
        </li>
      </ol>

      <h2>Porque é que uma app muda esta conta</h2>
      <p>
        Não é por ser digital em vez de papel — o papel resulta muito bem para quem gosta.
        É pelos dois custos que o caderno não resolve: não se lembra do teu contexto, e não
        relê por ti.
      </p>
      <p>
        Foi para isto que a Emori foi feita. Faz uma pergunta quando travas, para nunca
        encarares a página vazia. Lembra-se do que já contaste, para não teres de
        reconstruir tudo de cada vez. E ao fim de algumas semanas mostra os padrões — a
        parte que dá retorno e que quase ninguém alcança sozinho, porque exigiria reler
        meses de caderno.
      </p>
      <p>
        Se estás a voltar agora, o guia de{' '}
        <InlineLink href="/pt-pt/blog/o-que-escrever-no-diario/">
          o que escrever quando não sabes o que estás a sentir
        </InlineLink>{' '}
        ajuda no primeiro dia.
      </p>

      <h2>Quando não é sobre o diário</h2>
      <p>
        Uma ressalva honesta: se não consegues manter nada — nem diário, nem trabalho, nem
        contacto com as pessoas — e isso vem com falta de vontade para tudo, o problema
        provavelmente não é o método. Falta de iniciativa persistente é um sinal comum de
        depressão, e nesse caso vale procurar um psicólogo. Escrever ajuda, mas caminha ao
        lado desse cuidado, nunca no lugar dele.
      </p>
      <p>
        E se for só o diário que não pega: não é carácter. É que ele te pedia esforço todos
        os dias e devolvia pouco. Essa conta dá para mudar.
      </p>
    </>
  );
}

const faq = [
  {
    q: 'Porque é que desisto sempre do diário?',
    a: 'Porque cada sessão começa do zero: página em branco, nenhum registo do contexto do que já escreveste e nenhum retorno visível pelo esforço. Isso cria um custo de começar que, num dia cansado, é maior do que a energia disponível — e não é falta de disciplina.',
  },
  {
    q: 'Como manter o hábito de escrever no diário?',
    a: 'Baixa a fasquia até uma frase por dia, escreve quando acontece alguma coisa em vez de a horas fixas, começa sempre por uma pergunta em vez da página vazia, relê uma vez por semana e ignora contadores de dias seguidos.',
  },
  {
    q: 'É preciso escrever no diário todos os dias?',
    a: 'Não. A frequência importa menos do que o retorno. Escrever três vezes numa semana difícil vale mais do que escrever todos os dias por obrigação, e voltar ao fim de semanas parado é continuar, não recomeçar.',
  },
  {
    q: 'Porque é que perco a motivação ao fim de alguns dias?',
    a: 'Normalmente porque não acontece nada com o que escreveste. O esforço existe e o retorno não, e o cérebro deixa de investir no que não devolve nada. O retorno do diário está em ver o que se repete — e isso só aparece a reler.',
  },
  {
    q: 'Contadores de dias seguidos ajudam a manter o diário?',
    a: 'Costumam atrapalhar. Quando o valor está na sequência, quebrá-la apaga o valor: deixas de ter "onze dias escritos" e passas a ter "falhei", que é motivo para largar. Os onze dias continuam a valer — o contador é que mente.',
  },
  {
    q: 'Diário em papel ou em aplicação?',
    a: 'O papel resulta bem para quem gosta do gesto. A diferença prática de uma app é resolver dois custos que o caderno não resolve: lembrar-se do teu contexto, para não reconstruíres tudo a cada sessão, e mostrar padrões sem teres de reler meses de anotações.',
  },
];

const article: ArticleModule = { meta, Body, faq };
export default article;
