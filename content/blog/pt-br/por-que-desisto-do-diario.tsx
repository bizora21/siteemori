import type { ArticleModule } from '../types';
import InlineLink from '@/components/InlineLink';

const meta = {
  slug: 'por-que-desisto-do-diario',
  title: 'Por que eu sempre desisto do diário',
  description:
    'Você começa animado e para na segunda semana. Não é falta de disciplina — é que o diário te faz recomeçar do zero toda vez. Entenda o mecanismo e como contorná-lo.',
  tldr: 'Quase ninguém desiste do diário por preguiça. Desiste porque cada sessão começa do zero: página em branco, nenhuma memória do que você escreveu antes, e nenhum retorno visível pelo esforço. O que sustenta o hábito não é disciplina nem sequência de dias — é reduzir o custo de começar e conseguir enxergar algo de volta.',
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
        Você já começou um diário. Provavelmente mais de uma vez. Escreveu com vontade
        nos primeiros dias, falhou um, falhou dois, e três semanas depois o caderno
        estava numa gaveta com sete páginas usadas.
      </p>
      <p>
        A conclusão que quase todo mundo tira é "eu não tenho disciplina". Essa
        conclusão é confortável porque explica tudo — e é justamente por isso que ela
        atrapalha: quem acredita nela tenta resolver com mais força de vontade, que é
        exatamente o recurso que já faltou da última vez.
      </p>
      <p>Vale olhar o mecanismo real.</p>

      <h2>O diário te faz recomeçar do zero toda vez</h2>
      <p>
        Abra um caderno hoje. O que tem lá? Uma página em branco.
      </p>
      <p>
        Ela não sabe que você brigou com alguém na terça. Não sabe que você anda dormindo
        mal há três semanas. Não sabe que aquele assunto do trabalho já apareceu quatro
        vezes. <strong>Toda sessão começa sem contexto</strong>, e é você quem tem que
        carregar tudo de novo para dentro da página.
      </p>
      <p>
        Isso tem um custo que ninguém contabiliza. Antes de escrever qualquer coisa, você
        precisa decidir sobre o que escrever, lembrar onde parou e reconstruir o assunto.
        Num dia bom, tudo bem. Num dia cansado — que é quando você mais precisaria — esse
        custo é maior do que a energia disponível. E você deixa para amanhã.
      </p>

      <h2>A página em branco não é liberdade</h2>
      <p>
        A gente cresceu ouvindo que o diário é livre: escreva o que quiser. Só que
        "escreva o que quiser" transfere para você uma decisão a mais, num momento em que
        você já está sem saber o que sente.
      </p>
      <p>
        Repare que ninguém trava quando alguém pergunta "como foi seu dia?". Trava quando
        precisa começar do nada. A pergunta não é um limite — é um apoio.
      </p>

      <h2>A armadilha da sequência de dias</h2>
      <p>
        Muitos apps colocam um contador de dias seguidos. Parece motivação, e funciona por
        uns dias. O problema aparece na primeira falha.
      </p>
      <p>
        Quando o valor está na sequência, quebrar a sequência apaga o valor. Você não
        perde um dia: perde o progresso inteiro. E aí a conta muda de "escrevi 11 dias" —
        que é ótimo — para "eu falhei", que é motivo para largar.
      </p>
      <p>
        Onze dias de escrita continuam sendo onze dias de escrita. O contador é que
        mentiu.
      </p>

      <h2>O motivo mais silencioso: nada acontece com o que você escreve</h2>
      <p>
        Este é o que menos aparece nos artigos e provavelmente o mais decisivo.
      </p>
      <p>
        Você escreve, fecha o caderno, e aquilo nunca mais é lido — nem por você. O
        esforço existiu, o retorno não. Nenhum hábito sobrevive muito tempo assim: o
        cérebro para de investir em coisas que não devolvem nada.
      </p>
      <p>
        E o retorno do diário não está no ato de escrever. Está em <strong>ver o que se
        repete</strong>. Você só descobre que sempre desanda depois de reunião com
        determinada pessoa quando enxerga isso escrito quatro vezes. Quem nunca relê,
        nunca chega nessa parte — e desiste antes do único momento em que o diário
        realmente paga.
      </p>

      <h2>O que sustenta o hábito</h2>
      <ol>
        <li>
          <strong>Baixe a régua até parecer ridículo.</strong> Uma frase conta. "Hoje foi
          pesado" é uma entrada válida. O objetivo não é o texto, é não quebrar o
          contato.
        </li>
        <li>
          <strong>Escreva quando algo acontece, não em horário fixo.</strong> Rotina de
          horário funciona para academia. Emoção não tem hora marcada.
        </li>
        <li>
          <strong>Comece por uma pergunta, nunca pela página vazia.</strong> "O que ficou
          atravessado hoje?" tira você do zero.
        </li>
        <li>
          <strong>Releia uma vez por semana.</strong> Cinco minutos. É aqui que o diário
          deixa de ser tarefa e vira ferramenta.
        </li>
        <li>
          <strong>Esqueça a sequência.</strong> Voltar depois de duas semanas parado não é
          recomeçar: é continuar.
        </li>
      </ol>

      <h2>Por que uma app muda essa conta</h2>
      <p>
        Não é sobre ser digital em vez de papel — papel funciona muito bem para quem
        gosta. É sobre os dois custos que o caderno não resolve: ele não lembra do seu
        contexto, e não relê por você.
      </p>
      <p>
        Foi para isso que a Emori foi feita. Ela faz uma pergunta quando você trava, então
        você nunca encara a página vazia. Lembra do que você já contou, então não precisa
        reconstruir tudo toda vez. E depois de algumas semanas mostra os padrões — a parte
        que dá retorno e que quase ninguém alcança sozinho, porque exigiria reler meses de
        caderno.
      </p>
      <p>
        Se você está voltando agora, o guia de{' '}
        <InlineLink href="/pt-br/blog/o-que-escrever-no-diario/">
          o que escrever quando não sabe o que está sentindo
        </InlineLink>{' '}
        ajuda no primeiro dia.
      </p>

      <h2>Quando não é sobre o diário</h2>
      <p>
        Uma ressalva honesta: se você não consegue manter nada — nem diário, nem trabalho,
        nem contato com as pessoas — e isso vem junto com falta de vontade de tudo, o
        problema provavelmente não é o método. Falta de iniciativa persistente é um sinal
        comum de depressão, e nesse caso vale procurar um psicólogo. Escrever ajuda, mas
        caminha ao lado desse cuidado, nunca no lugar dele.
      </p>
      <p>
        E se for só o diário que não pega: não é caráter. É que ele estava te pedindo
        esforço todo dia e devolvendo pouco. Dá para mudar essa conta.
      </p>
    </>
  );
}

const faq = [
  {
    q: 'Por que eu sempre desisto do diário?',
    a: 'Porque cada sessão começa do zero: página em branco, nenhum registro do contexto do que você já escreveu e nenhum retorno visível pelo esforço. Isso cria um custo de começar que, num dia cansado, é maior que a energia disponível — e não é falta de disciplina.',
  },
  {
    q: 'Como manter o hábito de escrever no diário?',
    a: 'Baixe a régua até uma frase por dia, escreva quando algo acontece em vez de em horário fixo, comece sempre por uma pergunta em vez da página vazia, releia uma vez por semana e ignore contadores de dias seguidos.',
  },
  {
    q: 'Preciso escrever no diário todos os dias?',
    a: 'Não. A frequência importa menos que o retorno. Escrever três vezes numa semana difícil vale mais que escrever todos os dias por obrigação, e voltar depois de semanas parado é continuar, não recomeçar.',
  },
  {
    q: 'Por que perco a motivação depois de alguns dias?',
    a: 'Normalmente porque nada acontece com o que você escreveu. O esforço existe e o retorno não, e o cérebro para de investir no que não devolve nada. O retorno do diário está em ver o que se repete — e isso só aparece relendo.',
  },
  {
    q: 'Contador de dias seguidos ajuda a manter o diário?',
    a: 'Costuma atrapalhar. Quando o valor está na sequência, quebrá-la apaga o valor: você deixa de ter "onze dias escritos" e passa a ter "falhei", que é motivo para largar. Os onze dias continuam valendo — o contador é que mente.',
  },
  {
    q: 'Diário no papel ou em aplicativo?',
    a: 'Papel funciona bem para quem gosta do gesto. A diferença prática de um app é resolver dois custos que o caderno não resolve: lembrar do seu contexto, para você não reconstruir tudo a cada sessão, e mostrar padrões sem que você precise reler meses de anotações.',
  },
];

const article: ArticleModule = { meta, Body, faq };
export default article;
