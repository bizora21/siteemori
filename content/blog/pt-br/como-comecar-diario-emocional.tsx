import type { ArticleModule } from '../types';

const meta = {
  slug: 'como-comecar-diario-emocional',
  title: 'Como começar um diário emocional (guia para iniciantes)',
  description:
    'Um guia prático para começar um diário emocional hoje: o que é, por onde começar, quanto escrever e como manter o hábito mesmo sem saber por onde ir.',
  tldr: 'Para começar um diário emocional, escolha um lugar fixo (app ou caderno), escreva por 5 minutos sobre como você se sente agora — sem se preocupar com forma — e repita no mesmo horário todos os dias. O segredo não é escrever bonito, é escrever com frequência e honestidade.',
  datePublished: '2026-07-04',
  readingMinutes: 6,
  hero: {
    src: 'https://images.unsplash.com/photo-1769794370990-614f765fa360?ixid=M3w4MjU2NjZ8MHwxfHNlYXJjaHw1fHxvcGVuJTIwYmxhbmslMjBub3RlYm9vayUyMHBlbiUyMHdhcm0lMjBkZXNrfGVufDF8MHx8fDE3ODUxNTgyNDd8MA&ixlib=rb-4.1.0&w=1600&q=80&auto=format&fit=crop',
    alt: 'Uma vela acesa ao lado de um caderno aberto e um laptop',
    credit: 'Yen Vu',
    creditUrl: 'https://unsplash.com/@yenvu2410?utm_source=aemori&utm_medium=referral',
  },
};

function Body() {
  return (
    <>
      <p>
        Um diário emocional é um espaço onde você registra o que sente, não apenas o
        que acontece. Diferente de uma agenda ou de um diário de fatos, o foco está nas
        emoções: o que você sentiu, quando, e o que pode ter provocado aquilo. Começar é
        mais simples do que parece — e a parte mais difícil, manter o hábito, tem
        soluções concretas.
      </p>

      <h2>O que é um diário emocional e para que serve?</h2>
      <p>
        Um diário emocional é uma prática de escrever regularmente sobre as suas emoções
        para entendê-las melhor. Ele serve para dar nome ao que você sente, notar padrões
        (o que te tira do sério, o que te acalma) e criar distância saudável de
        pensamentos que, na cabeça, giram em círculo. Pesquisas sobre escrita expressiva
        associam esse hábito a menos ruminação e mais clareza emocional.
      </p>

      <h2>Por onde começar quando eu não sei o que escrever?</h2>
      <p>
        Comece pelo presente. A pergunta mais útil é: <strong>“como eu estou agora?”</strong>{' '}
        Escreva a primeira resposta que vier, mesmo que seja “não sei” ou “cansado”. A
        partir daí, puxe o fio: por que cansado? Desde quando? O que aconteceu hoje? Você
        não precisa de um tema — precisa de um ponto de partida, e o presente sempre está
        disponível.
      </p>
      <ul>
        <li>“Hoje eu senti… porque…”</li>
        <li>“A coisa que mais pesou hoje foi…”</li>
        <li>“Se eu pudesse mudar uma coisa do meu dia, seria…”</li>
        <li>“Uma coisa boa, por menor que seja, foi…”</li>
      </ul>

      <h2>Quanto tempo e com que frequência devo escrever?</h2>
      <p>
        Comece com <strong>5 minutos por dia</strong>. É pouco o suficiente para você não
        adiar, e o bastante para chegar a algo real. Frequência importa mais do que
        duração: escrever 5 minutos todos os dias vale mais do que uma hora uma vez por
        mês. Se cinco minutos parecer muito num dia difícil, escreva uma frase. Uma frase
        também conta.
      </p>

      <h2>Caderno ou aplicativo: o que é melhor para iniciantes?</h2>
      <p>
        Os dois funcionam — o melhor é o que você vai usar. O caderno tem o charme do
        analógico e zero distração. O aplicativo tem uma vantagem prática enorme para
        quem está começando: está sempre no seu celular, lembra você de escrever e, no
        caso de um app com IA como a Emori, ainda conversa com você e guarda o contexto,
        o que ajuda quando a página em branco trava.
      </p>

      <h2>Como manter o hábito sem desistir na segunda semana?</h2>
      <p>
        A maioria das pessoas para porque tenta ser perfeita. Evite isso com três regras:
      </p>
      <ol>
        <li>
          <strong>Ancore num gatilho:</strong> escreva sempre depois de algo que você já
          faz (escovar os dentes, deitar na cama). O hábito antigo puxa o novo.
        </li>
        <li>
          <strong>Baixe a régua:</strong> a meta é escrever, não escrever bem. Rabisco,
          desabafo, lista solta — tudo vale.
        </li>
        <li>
          <strong>Não quebre duas vezes:</strong> pular um dia acontece. Só não pule
          dois seguidos. É a falha em série que mata o hábito, não o deslize isolado.
        </li>
      </ol>

      <h2>E se escrever mexer com emoções difíceis?</h2>
      <p>
        É normal e, muitas vezes, é o ponto. Mas respeite seu limite: se um assunto for
        pesado demais, escreva sobre ele de longe (“hoje não consigo falar disso, mas
        sei que está aqui”) e volte quando estiver pronto. Um diário é autoconhecimento,
        não terapia. Se a dor for intensa ou constante, procure um profissional de saúde
        — o diário pode caminhar ao lado desse cuidado, nunca no lugar dele.
      </p>
    </>
  );
}

const faq = [
  {
    q: 'Preciso escrever todos os dias?',
    a: 'Não é obrigatório, mas a frequência ajuda muito. Escrever poucos minutos todos os dias cria o hábito mais rápido do que sessões longas e esporádicas. Se falhar um dia, apenas evite falhar dois seguidos.',
  },
  {
    q: 'Existe um jeito certo de escrever no diário emocional?',
    a: 'Não. Não precisa de gramática, ordem ou tema. O objetivo é ser honesto, não ser bonito. Frases soltas, listas ou desabafos valem tanto quanto textos organizados.',
  },
  {
    q: 'Diário emocional funciona mesmo?',
    a: 'A escrita expressiva sobre emoções está associada a menos ruminação e mais clareza. Não substitui terapia, mas é uma ferramenta simples e acessível de autoconhecimento com evidências a favor.',
  },
  {
    q: 'Quanto tempo até sentir diferença?',
    a: 'Muitas pessoas notam alívio já nas primeiras sessões, ao “tirar da cabeça”. Os padrões emocionais, porém, costumam aparecer depois de duas a quatro semanas de registros regulares.',
  },
];

const article: ArticleModule = { meta, Body, faq };
export default article;
