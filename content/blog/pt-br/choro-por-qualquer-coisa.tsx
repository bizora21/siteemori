import type { ArticleModule } from '../types';
import InlineLink from '@/components/InlineLink';

const meta = {
  slug: 'choro-por-qualquer-coisa',
  title: 'Por que eu choro por qualquer coisa?',
  description:
    'Você chora com propaganda, com música, com um elogio. Entenda por que o choro fácil quase nunca é fraqueza — é um sistema emocional sobrecarregado pedindo espaço.',
  tldr: 'Chorar por qualquer coisa raramente significa que você é sensível demais. Na maior parte das vezes significa que há emoção acumulada sem saída, e o choro passa a transbordar em situações pequenas porque são as únicas em que a guarda baixa. O choro não é o problema: é o sintoma de que faltou processar o que veio antes.',
  datePublished: '2026-08-22',
  readingMinutes: 7,
  hero: {
    src: 'https://images.unsplash.com/photo-1616824726805-1c991ae55757?ixid=M3w4MjU2NjZ8MHwxfHNlYXJjaHwyfHxwZXJzb24lMjBjcnlpbmclMjBhbG9uZSUyMHNvZnQlMjB3aW5kb3clMjBsaWdodCUyMGVtb3Rpb25hbHxlbnwxfDB8fHwxNzg3Mzk1MTAxfDA&ixlib=rb-4.1.0&w=1600&q=80&auto=format&fit=crop',
    alt: 'Pessoa de suéter branco olhando pela janela enquanto neva lá fora',
    credit: 'Daniil Onischenko',
    creditUrl: 'https://unsplash.com/@flyvk?utm_source=aemori&utm_medium=referral',
  },
};

function Body() {
  return (
    <>
      <p>
        Uma propaganda de banco. Uma música que tocou no mercado. Alguém falando um
        obrigado meio sem querer. E lá vem aquela pressão nos olhos que você tenta
        disfarçar, torcendo para ninguém ver.
      </p>
      <p>
        Depois vem a parte pior: a vergonha. "Por que eu sou assim?" Você fica com raiva
        de si mesmo por ter chorado com uma coisa tão boba — como se o choro estivesse
        desproporcional ao motivo.
      </p>
      <p>
        Ele está mesmo. Mas provavelmente não pelo motivo que você imagina.
      </p>

      <h2>O choro não está reagindo ao que você acha</h2>
      <p>
        A propaganda não te fez chorar. Ela abriu uma porta que já estava com pressão do
        outro lado.
      </p>
      <p>
        Emoção que não é processada não desaparece — fica em espera. E emoção em espera
        precisa de uma saída. Ela raramente escolhe a situação certa, porque na situação
        certa você estava ocupado se segurando: na reunião, na conversa difícil, no
        hospital, na frente das crianças. Ali você tinha função a cumprir.
      </p>
      <p>
        Então ela sai onde a guarda baixa. E a guarda baixa justamente nos momentos sem
        importância — sozinho no carro, vendo um filme, ouvindo alguém elogiar você. É
        por isso que o choro parece vir do nada: <strong>ele não vem do que está
        acontecendo, vem do que ficou acumulado</strong>.
      </p>

      <h2>Por que quase sempre é com coisa pequena</h2>
      <p>
        Repare no padrão do que te faz chorar. Quase nunca é tragédia. É gentileza,
        reencontro, alguém cuidando de alguém, um final feliz.
      </p>
      <p>
        Isso tem uma explicação bem específica: essas cenas não pedem que você seja
        forte. Diante de uma dificuldade, o corpo entra em modo de resolver. Diante de
        uma gentileza, ele não precisa resolver nada — e é aí que baixa a guarda.
      </p>
      <p>
        Ou seja: você não chora porque a cena é triste. Você chora porque, por alguns
        segundos, ninguém está exigindo nada de você.
      </p>

      <h2>Os motivos comuns do choro fácil</h2>
      <ul>
        <li><strong>Acúmulo.</strong> Semanas ou meses sentindo sem tempo de olhar</li>
        <li><strong>Cansaço.</strong> Sono ruim derruba o controle emocional antes de derrubar o corpo</li>
        <li><strong>Autocontrole prolongado.</strong> Quem se segura muito tempo, transborda</li>
        <li><strong>Ciclo hormonal, gravidez, pós-parto</strong></li>
        <li><strong>Luto</strong>, inclusive de coisas que não são morte — mudanças, fim de ciclos</li>
        <li><strong>Ser mais sensível</strong>, o que é traço de personalidade, não defeito</li>
      </ul>
      <p>
        Note que só o último é sobre "ser assim". Todos os outros são estados —
        temporários, e com causa.
      </p>

      <h2>O que não ajuda</h2>
      <p>
        Se segurar mais. É o instinto de todo mundo e é exatamente o que aumenta a
        pressão do outro lado da porta. Quem chora mais fácil costuma ser justamente
        quem mais tenta não chorar.
      </p>
      <p>
        Também não ajuda tratar o choro como o problema a resolver. Ele é o alarme, não
        o incêndio. Desligar o alarme não apaga nada.
      </p>

      <h2>O que ajuda de verdade</h2>
      <ol>
        <li>
          <strong>Deixar acontecer quando dá.</strong> Chorar não é perder o controle: é
          o corpo terminando um processo. Interromper deixa pela metade.
        </li>
        <li>
          <strong>Perguntar "o que mais?" em vez de "por quê?".</strong> "Por que estou
          chorando com isso" não tem resposta boa. "O que mais está aberto essa semana?"
          tem — e costuma explicar o choro inteiro.
        </li>
        <li>
          <strong>Dar saída antes do transbordo.</strong> Emoção processada não precisa
          esperar a propaganda de banco. É aqui que escrever entra, e é a parte mais
          prática deste texto.
        </li>
        <li>
          <strong>Olhar o sono e o cansaço primeiro.</strong> Muito choro fácil é
          exaustão disfarçada. Vale ler sobre{' '}
          <InlineLink href="/pt-br/blog/cansaco-que-dormir-nao-resolve/">
            o cansaço que dormir não resolve
          </InlineLink>
          .
        </li>
      </ol>

      <h2>Por que escrever funciona aqui</h2>
      <p>
        O choro fácil é um problema de vazão: entra mais do que sai. Escrever é uma
        saída que você controla — acontece na hora que você escolhe, e não no meio de
        uma reunião.
      </p>
      <p>
        Não precisa ser bonito nem organizado. Cinco minutos escrevendo o que ficou por
        dizer do dia já baixa a pressão o suficiente para a próxima gentileza não te
        derrubar.
      </p>
      <p>
        Foi para isso que a Emori foi feita: um lugar para esvaziar sem ter que explicar
        nada a ninguém. Ela faz uma pergunta quando você trava, lembra do seu contexto
        para você não recomeçar do zero, e depois de algumas semanas mostra os padrões —
        inclusive o que costuma vir antes das semanas em que você chora por tudo.
      </p>

      <h2>Quando procurar ajuda</h2>
      <p>
        Preciso ser honesto sobre o limite disto. Se o choro dura semanas quase todos os
        dias, se vem junto com falta de vontade de tudo, se você não consegue trabalhar
        ou conviver por causa dele, ou se aparece sem nenhuma emoção junto — vale
        procurar um psicólogo. Choro fácil persistente é um dos sinais mais comuns de
        depressão e de transtorno de ansiedade, e nenhum dos dois melhora só com hábito.
      </p>
      <p>
        Também vale um médico se começou de repente sem mudança de vida, ou junto com
        alterações de sono, apetite ou peso — questões de tireoide e hormonais entram
        aqui.
      </p>
      <p>
        Se em algum momento você pensar em se machucar, procure ajuda imediata. No
        Brasil, o CVV atende 24 horas pelo <strong>188</strong>, de graça e em sigilo. Em
        Portugal, a SOS Voz Amiga atende pelo <strong>213 544 545</strong>.
      </p>
      <p>
        E se for o choro comum, o de quem está carregando demais há tempo demais: ele não
        está pedindo que você seja mais forte. Está pedindo espaço.
      </p>
    </>
  );
}

const faq = [
  {
    q: 'Por que eu choro por qualquer coisa?',
    a: 'Porque quase sempre há emoção acumulada sem saída. O choro não reage ao que está acontecendo agora: transborda numa situação pequena porque foi ali que a sua guarda baixou. Nas situações difíceis você estava ocupado se segurando.',
  },
  {
    q: 'Chorar fácil é sinal de fraqueza?',
    a: 'Não. Costuma ser o contrário: quem chora com facilidade normalmente é quem mais se segurou por mais tempo. O choro é vazão de pressão acumulada, não falta de força.',
  },
  {
    q: 'Por que choro com coisas boas, como gentileza e reencontros?',
    a: 'Porque essas cenas não exigem que você seja forte. Diante de uma dificuldade o corpo entra em modo de resolver; diante de uma gentileza não há nada a resolver, e é aí que a guarda baixa e o acumulado sai.',
  },
  {
    q: 'Como parar de chorar por qualquer coisa?',
    a: 'Não segurando mais — isso aumenta a pressão. O que reduz é dar saída antes do transbordo: escrever o que ficou por dizer do dia, perguntar "o que mais está aberto essa semana?" em vez de "por que estou chorando com isso", e tratar o cansaço, que derruba o controle emocional antes de derrubar o corpo.',
  },
  {
    q: 'Chorar demais é sinal de depressão?',
    a: 'Pode ser, mas nem sempre. Se o choro dura semanas quase todos os dias, vem com perda de vontade de tudo, atrapalha trabalhar ou conviver, ou aparece sem emoção junto, procure um psicólogo. Se começou de repente com alterações de sono, apetite ou peso, vale também um médico.',
  },
  {
    q: 'O que fazer na hora em que a vontade de chorar aparece?',
    a: 'Se o contexto permitir, deixe acontecer: chorar é o corpo terminando um processo, e interromper deixa pela metade. Se não permitir, respire devagar e marque para voltar ao assunto depois, escrevendo — o que fica sem saída volta a transbordar na próxima situação pequena.',
  },
];

const article: ArticleModule = { meta, Body, faq };
export default article;
