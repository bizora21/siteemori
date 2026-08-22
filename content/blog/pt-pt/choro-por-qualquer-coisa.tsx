import type { ArticleModule } from '../types';
import InlineLink from '@/components/InlineLink';

const meta = {
  slug: 'choro-por-qualquer-coisa',
  title: 'Porque é que choro por tudo e por nada?',
  description:
    'Choras com um anúncio, com uma música, com um elogio. Percebe porque o choro fácil quase nunca é fraqueza — é um sistema emocional sobrecarregado a pedir espaço.',
  tldr: 'Chorar por tudo e por nada raramente significa que és sensível demais. Na maior parte das vezes significa que há emoção acumulada sem saída, e o choro passa a transbordar em situações pequenas porque são as únicas em que a guarda baixa. O choro não é o problema: é o sinal de que faltou processar o que veio antes.',
  datePublished: '2026-08-22',
  readingMinutes: 7,
  hero: {
    src: 'https://images.unsplash.com/photo-1616824726805-1c991ae55757?ixid=M3w4MjU2NjZ8MHwxfHNlYXJjaHwyfHxwZXJzb24lMjBjcnlpbmclMjBhbG9uZSUyMHNvZnQlMjB3aW5kb3clMjBsaWdodCUyMGVtb3Rpb25hbHxlbnwxfDB8fHwxNzg3Mzk1MTAxfDA&ixlib=rb-4.1.0&w=1600&q=80&auto=format&fit=crop',
    alt: 'Pessoa de camisola branca a olhar pela janela enquanto neva lá fora',
    credit: 'Daniil Onischenko',
    creditUrl: 'https://unsplash.com/@flyvk?utm_source=aemori&utm_medium=referral',
  },
};

function Body() {
  return (
    <>
      <p>
        Um anúncio de banco. Uma música que deu no supermercado. Alguém a dizer obrigado
        meio sem querer. E vem aquela pressão nos olhos que tentas disfarçar, na
        esperança de que ninguém veja.
      </p>
      <p>
        Depois vem a pior parte: a vergonha. "Porque é que sou assim?" Ficas com raiva de
        ti próprio por teres chorado com uma coisa tão parva — como se o choro estivesse
        desproporcionado ao motivo.
      </p>
      <p>Está mesmo. Mas provavelmente não pela razão que imaginas.</p>

      <h2>O choro não está a reagir ao que julgas</h2>
      <p>
        O anúncio não te fez chorar. Abriu uma porta que já tinha pressão do outro lado.
      </p>
      <p>
        Emoção que não é processada não desaparece — fica em espera. E emoção em espera
        precisa de saída. Raramente escolhe a situação certa, porque na situação certa
        estavas ocupado a segurar-te: na reunião, na conversa difícil, no hospital, à
        frente dos miúdos. Ali tinhas uma função a cumprir.
      </p>
      <p>
        Então sai onde a guarda baixa. E a guarda baixa justamente nos momentos sem
        importância — sozinho no carro, a ver um filme, a ouvir alguém elogiar-te. É por
        isso que o choro parece vir do nada: <strong>não vem do que está a acontecer, vem
        do que ficou acumulado</strong>.
      </p>

      <h2>Porque é quase sempre com coisas pequenas</h2>
      <p>
        Repara no padrão do que te faz chorar. Quase nunca é tragédia. É gentileza,
        reencontro, alguém a cuidar de alguém, um final feliz.
      </p>
      <p>
        Isto tem uma explicação específica: essas cenas não te pedem que sejas forte.
        Perante uma dificuldade, o corpo entra em modo de resolver. Perante uma gentileza,
        não há nada a resolver — e é aí que a guarda baixa.
      </p>
      <p>
        Ou seja: não choras porque a cena é triste. Choras porque, durante alguns
        segundos, ninguém está a exigir nada de ti.
      </p>

      <h2>Os motivos comuns do choro fácil</h2>
      <ul>
        <li><strong>Acumulação.</strong> Semanas ou meses a sentir sem tempo de olhar</li>
        <li><strong>Cansaço.</strong> Dormir mal derruba o controlo emocional antes de derrubar o corpo</li>
        <li><strong>Autocontrolo prolongado.</strong> Quem se segura muito tempo, transborda</li>
        <li><strong>Ciclo hormonal, gravidez, pós-parto</strong></li>
        <li><strong>Luto</strong>, incluindo de coisas que não são morte — mudanças, fins de ciclo</li>
        <li><strong>Ser mais sensível</strong>, que é traço de personalidade, não defeito</li>
      </ul>
      <p>
        Repara que só o último é sobre "ser assim". Todos os outros são estados —
        temporários, e com causa.
      </p>

      <h2>O que não ajuda</h2>
      <p>
        Segurares-te mais. É o instinto de toda a gente e é exatamente o que aumenta a
        pressão do outro lado da porta. Quem chora mais facilmente costuma ser justamente
        quem mais tenta não chorar.
      </p>
      <p>
        Também não ajuda tratar o choro como o problema a resolver. Ele é o alarme, não o
        incêndio. Desligar o alarme não apaga nada.
      </p>

      <h2>O que ajuda mesmo</h2>
      <ol>
        <li>
          <strong>Deixar acontecer quando dá.</strong> Chorar não é perder o controlo: é
          o corpo a terminar um processo. Interromper deixa-o a meio.
        </li>
        <li>
          <strong>Perguntar "o que mais?" em vez de "porquê?".</strong> "Porque é que
          estou a chorar com isto" não tem boa resposta. "O que mais está em aberto esta
          semana?" tem — e costuma explicar o choro inteiro.
        </li>
        <li>
          <strong>Dar saída antes do transbordo.</strong> Emoção processada não precisa de
          esperar pelo anúncio de banco. É aqui que escrever entra.
        </li>
        <li>
          <strong>Olhar primeiro para o sono e o cansaço.</strong> Muito choro fácil é
          exaustão disfarçada. Vale ler sobre{' '}
          <InlineLink href="/pt-pt/blog/cansaco-que-dormir-nao-resolve/">
            o cansaço que dormir não resolve
          </InlineLink>
          .
        </li>
      </ol>

      <h2>Porque é que escrever funciona aqui</h2>
      <p>
        O choro fácil é um problema de vazão: entra mais do que sai. Escrever é uma saída
        que controlas — acontece à hora que escolhes, e não a meio de uma reunião.
      </p>
      <p>
        Não precisa de ser bonito nem organizado. Cinco minutos a escrever o que ficou por
        dizer do dia já baixam a pressão o suficiente para a próxima gentileza não te
        derrubar.
      </p>
      <p>
        Foi para isto que a Emori foi feita: um sítio para esvaziar sem teres de explicar
        nada a ninguém. Faz uma pergunta quando travas, lembra-se do teu contexto para não
        recomeçares do zero, e ao fim de algumas semanas mostra os padrões — inclusive o
        que costuma vir antes das semanas em que choras por tudo.
      </p>

      <h2>Quando procurar ajuda</h2>
      <p>
        Tenho de ser honesto quanto ao limite disto. Se o choro dura semanas quase todos
        os dias, se vem com falta de vontade para tudo, se te impede de trabalhar ou
        conviver, ou se aparece sem emoção nenhuma associada — vale procurar um psicólogo.
        Choro fácil persistente é um dos sinais mais comuns de depressão e de perturbação
        de ansiedade, e nenhuma delas melhora só com hábitos.
      </p>
      <p>
        Vale também um médico se começou de repente sem mudança de vida, ou a par de
        alterações de sono, apetite ou peso — questões da tiroide e hormonais entram aqui.
      </p>
      <p>
        Se a certa altura pensares em magoar-te, procura ajuda imediata. Em Portugal, a
        SOS Voz Amiga atende pelo <strong>213 544 545</strong>. No Brasil, o CVV atende 24
        horas pelo <strong>188</strong>, gratuitamente e em sigilo.
      </p>
      <p>
        E se for o choro comum, o de quem anda a carregar demais há tempo demais: não te
        está a pedir que sejas mais forte. Está a pedir espaço.
      </p>
    </>
  );
}

const faq = [
  {
    q: 'Porque é que choro por tudo e por nada?',
    a: 'Porque quase sempre há emoção acumulada sem saída. O choro não reage ao que está a acontecer agora: transborda numa situação pequena porque foi aí que a tua guarda baixou. Nas situações difíceis estavas ocupado a segurar-te.',
  },
  {
    q: 'Chorar com facilidade é sinal de fraqueza?',
    a: 'Não. Costuma ser o contrário: quem chora com facilidade normalmente é quem mais se segurou durante mais tempo. O choro é vazão de pressão acumulada, não falta de força.',
  },
  {
    q: 'Porque é que choro com coisas boas, como gentileza e reencontros?',
    a: 'Porque essas cenas não exigem que sejas forte. Perante uma dificuldade o corpo entra em modo de resolver; perante uma gentileza não há nada a resolver, e é aí que a guarda baixa e o acumulado sai.',
  },
  {
    q: 'Como deixar de chorar por tudo?',
    a: 'Não te segurando mais — isso aumenta a pressão. O que reduz é dar saída antes do transbordo: escrever o que ficou por dizer do dia, perguntar "o que mais está em aberto esta semana?" em vez de "porque estou a chorar com isto", e tratar o cansaço, que derruba o controlo emocional antes de derrubar o corpo.',
  },
  {
    q: 'Chorar demais é sinal de depressão?',
    a: 'Pode ser, mas nem sempre. Se o choro dura semanas quase todos os dias, vem com perda de vontade para tudo, atrapalha trabalhar ou conviver, ou aparece sem emoção associada, procura um psicólogo. Se começou de repente com alterações de sono, apetite ou peso, vale também um médico.',
  },
  {
    q: 'O que fazer no momento em que a vontade de chorar aparece?',
    a: 'Se o contexto permitir, deixa acontecer: chorar é o corpo a terminar um processo, e interromper deixa-o a meio. Se não permitir, respira devagar e marca para voltares ao assunto depois, a escrever — o que fica sem saída volta a transbordar na próxima situação pequena.',
  },
];

const article: ArticleModule = { meta, Body, faq };
export default article;
