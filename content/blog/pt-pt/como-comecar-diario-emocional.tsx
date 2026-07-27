import type { ArticleModule } from '../types';

const meta = {
  slug: 'como-comecar-diario-emocional',
  title: 'Como começar um diário emocional (guia para iniciantes)',
  description:
    'Um guia prático para começares um diário emocional hoje: o que é, por onde começar, quanto escrever e como manter o hábito mesmo sem saber por onde ir.',
  tldr: 'Para começar um diário emocional, escolhe um sítio fixo (aplicação ou caderno), escreve durante 5 minutos sobre como te sentes agora — sem te preocupares com a forma — e repete à mesma hora todos os dias. O segredo não é escrever bonito, é escrever com frequência e honestidade.',
  datePublished: '2026-07-04',
  readingMinutes: 6,
  hero: {
    src: 'https://images.unsplash.com/photo-1769794370990-614f765fa360?ixid=M3w4MjU2NjZ8MHwxfHNlYXJjaHw1fHxvcGVuJTIwYmxhbmslMjBub3RlYm9vayUyMHBlbiUyMHdhcm0lMjBkZXNrfGVufDF8MHx8fDE3ODUxNTgyNDd8MA&ixlib=rb-4.1.0&w=1600&q=80&auto=format&fit=crop',
    alt: 'Uma vela acesa ao lado de um caderno aberto e um portátil',
    credit: 'Yen Vu',
    creditUrl: 'https://unsplash.com/@yenvu2410?utm_source=aemori&utm_medium=referral',
  },
};

function Body() {
  return (
    <>
      <p>
        Um diário emocional é um espaço onde registas o que sentes, não apenas o que
        acontece. Ao contrário de uma agenda ou de um diário de factos, o foco está nas
        emoções: o que sentiste, quando, e o que pode ter provocado aquilo. Começar é mais
        simples do que parece — e a parte mais difícil, manter o hábito, tem soluções
        concretas.
      </p>

      <h2>O que é um diário emocional e para que serve?</h2>
      <p>
        Um diário emocional é a prática de escrever regularmente sobre as tuas emoções para
        as compreenderes melhor. Serve para dar nome ao que sentes, notar padrões (o que te
        tira do sério, o que te acalma) e criar uma distância saudável de pensamentos que,
        na cabeça, andam às voltas. A investigação sobre escrita expressiva associa este
        hábito a menos ruminação e mais clareza emocional.
      </p>

      <h2>Por onde começar quando não sei o que escrever?</h2>
      <p>
        Começa pelo presente. A pergunta mais útil é: <strong>“como estou agora?”</strong>{' '}
        Escreve a primeira resposta que vier, mesmo que seja “não sei” ou “cansado”. A
        partir daí, puxa o fio: porquê cansado? Desde quando? O que aconteceu hoje? Não
        precisas de um tema — precisas de um ponto de partida, e o presente está sempre
        disponível.
      </p>
      <ul>
        <li>“Hoje senti… porque…”</li>
        <li>“A coisa que mais pesou hoje foi…”</li>
        <li>“Se pudesse mudar uma coisa do meu dia, seria…”</li>
        <li>“Uma coisa boa, por menor que seja, foi…”</li>
      </ul>

      <h2>Quanto tempo e com que frequência devo escrever?</h2>
      <p>
        Começa com <strong>5 minutos por dia</strong>. É pouco o suficiente para não
        adiares, e o bastante para chegares a algo real. A frequência importa mais do que a
        duração: escrever 5 minutos todos os dias vale mais do que uma hora uma vez por
        mês. Se cinco minutos parecerem demais num dia difícil, escreve uma frase. Uma
        frase também conta.
      </p>

      <h2>Caderno ou aplicação: o que é melhor para iniciantes?</h2>
      <p>
        Os dois funcionam — o melhor é o que vais mesmo usar. O caderno tem o encanto do
        analógico e zero distração. A aplicação tem uma vantagem prática enorme para quem
        está a começar: está sempre no teu telemóvel, lembra-te de escrever e, no caso de
        uma app com IA como a Emori, ainda conversa contigo e guarda o contexto, o que
        ajuda quando a página em branco trava.
      </p>

      <h2>Como manter o hábito sem desistir na segunda semana?</h2>
      <p>
        A maioria das pessoas desiste porque tenta ser perfeita. Evita isso com três
        regras:
      </p>
      <ol>
        <li>
          <strong>Ancora num gatilho:</strong> escreve sempre a seguir a algo que já fazes
          (lavar os dentes, deitar-te na cama). O hábito antigo puxa o novo.
        </li>
        <li>
          <strong>Baixa a fasquia:</strong> a meta é escrever, não escrever bem. Rabisco,
          desabafo, lista solta — tudo vale.
        </li>
        <li>
          <strong>Não falhes duas vezes:</strong> saltar um dia acontece. Só não saltes
          dois seguidos. É a falha em série que mata o hábito, não o deslize isolado.
        </li>
      </ol>

      <h2>E se escrever mexer com emoções difíceis?</h2>
      <p>
        É normal e, muitas vezes, é o objetivo. Mas respeita o teu limite: se um assunto
        for pesado demais, escreve sobre ele de longe (“hoje não consigo falar disto, mas
        sei que está aqui”) e volta quando estiveres pronto. Um diário é autoconhecimento,
        não terapia. Se a dor for intensa ou constante, procura um profissional de saúde —
        o diário pode caminhar ao lado desse cuidado, nunca no lugar dele.
      </p>
    </>
  );
}

const faq = [
  {
    q: 'Preciso de escrever todos os dias?',
    a: 'Não é obrigatório, mas a frequência ajuda muito. Escrever poucos minutos todos os dias cria o hábito mais depressa do que sessões longas e esporádicas. Se falhares um dia, evita apenas falhar dois seguidos.',
  },
  {
    q: 'Existe uma forma certa de escrever no diário emocional?',
    a: 'Não. Não precisas de gramática, ordem ou tema. O objetivo é ser honesto, não ser bonito. Frases soltas, listas ou desabafos valem tanto como textos organizados.',
  },
  {
    q: 'O diário emocional funciona mesmo?',
    a: 'A escrita expressiva sobre emoções está associada a menos ruminação e mais clareza. Não substitui terapia, mas é uma ferramenta simples e acessível de autoconhecimento com evidências a favor.',
  },
  {
    q: 'Quanto tempo até sentir diferença?',
    a: 'Muitas pessoas notam alívio logo nas primeiras sessões, ao “tirar da cabeça”. Os padrões emocionais, porém, costumam aparecer após duas a quatro semanas de registos regulares.',
  },
];

const article: ArticleModule = { meta, Body, faq };
export default article;
