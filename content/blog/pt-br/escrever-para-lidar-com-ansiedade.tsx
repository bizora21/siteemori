import type { ArticleModule } from '../types';

const meta = {
  slug: 'escrever-para-lidar-com-ansiedade',
  title: 'Como a escrita ajuda a lidar com a ansiedade',
  description:
    'Escrever tira a ansiedade do loop mental e a coloca em palavras concretas. Entenda por que isso acalma e como usar o diário nos momentos de ansiedade.',
  tldr: 'Escrever ajuda na ansiedade porque tira os pensamentos do loop mental e os transforma em palavras concretas, o que reduz a ruminação e devolve senso de controle. Nos picos, funciona um “despejo” de tudo que está na cabeça; no dia a dia, escrever regularmente ajuda a identificar gatilhos antes que eles cresçam.',
  datePublished: '2026-07-04',
  readingMinutes: 6,
  hero: {
    src: 'https://images.unsplash.com/photo-1736819341395-15591452a54c?ixid=M3w4MjU2NjZ8MHwxfHNlYXJjaHw0fHxjYWxtJTIwdGVhJTIwY3VwJTIwaGFuZHMlMjB3aW5kb3d8ZW58MXwwfHx8MTc4NTE1ODI1NXww&ixlib=rb-4.1.0&w=1600&q=80&auto=format&fit=crop',
    alt: 'Pessoa segurando uma xícara em frente a uma janela',
    credit: 'Leiada Krözjhen',
    creditUrl: 'https://unsplash.com/@leiadakrozjhen?utm_source=aemori&utm_medium=referral',
  },
};

function Body() {
  return (
    <>
      <p>
        A ansiedade adora o escuro da mente — onde os pensamentos se repetem, se
        misturam e crescem sem controle. Escrever acende a luz. Ao passar o que está na
        cabeça para o papel (ou a tela), você faz algo que a ansiedade odeia: transforma
        névoa em objeto, e objeto a gente consegue olhar de frente.
      </p>

      <h2>Por que escrever acalma a ansiedade?</h2>
      <p>
        Por três razões principais:
      </p>
      <ul>
        <li>
          <strong>Quebra a ruminação:</strong> pensamentos ansiosos rodam em loop porque
          nunca “terminam”. No papel, eles terminam — têm começo, meio e fim.
        </li>
        <li>
          <strong>Nomear reduz a intensidade:</strong> dar nome a uma emoção (“isso é
          medo de falhar”) diminui a ativação. O ato de rotular já é regulação.
        </li>
        <li>
          <strong>Devolve controle:</strong> ansiedade é, no fundo, a sensação de que
          algo está fora de controle. Organizar o problema em palavras devolve uma dose
          de agência.
        </li>
      </ul>

      <h2>O que fazer num pico de ansiedade?</h2>
      <p>
        Faça um <strong>despejo mental</strong> (brain dump): escreva tudo que está na sua
        cabeça, sem ordem, sem filtro, sem parar para corrigir. Não organize — esvazie. O
        objetivo não é um texto bonito, é tirar o peso de dentro. Depois de esvaziar,
        muitas pessoas conseguem enxergar que dois ou três pensamentos estavam se
        disfarçando de vinte.
      </p>

      <h2>Como escrever quando estou ansioso demais para escrever?</h2>
      <p>
        Baixe a régua. Nos picos, não tente redigir bonito — faça um despejo em frases
        curtas, palavras soltas, tópicos. Não precisa de ordem nem de sentido. Se nem isso
        vier, escreva “não consigo escrever agora” e descreva por que está difícil. Um app
        que te faz uma pergunta simples (“o que está mais pesado agora?”) também ajuda a
        dar o primeiro passo quando a página em branco paralisa.
      </p>

      <h2>Escrita para o dia a dia: prevenir, não só apagar incêndio</h2>
      <p>
        O maior ganho não vem só nos picos, mas na regularidade. Escrever um pouco todo
        dia cria um mapa dos seus gatilhos: você começa a notar que a ansiedade sobe
        antes de certas reuniões, em certos horários, com certas pessoas. Ver o padrão é
        o primeiro passo para não ser pego de surpresa por ele.
      </p>
      <p>Alguns prompts úteis para a ansiedade:</p>
      <ul>
        <li>“Do que exatamente eu tenho medo aqui?”</li>
        <li>“Qual é a pior coisa realista que pode acontecer — e eu daria conta?”</li>
        <li>“O que está sob meu controle nisso? E o que não está?”</li>
        <li>“O que eu diria a um amigo sentindo isso?”</li>
      </ul>

      <h2>Escrever substitui tratamento para ansiedade?</h2>
      <p>
        Não. Escrever é uma ferramenta de apoio poderosa, mas ansiedade intensa,
        persistente ou incapacitante pede acompanhamento profissional. Pense no diário
        como um aliado do dia a dia — algo que caminha ao lado da terapia e do cuidado
        médico, nunca no lugar deles. Se a ansiedade está te dominando, procure ajuda
        especializada.
      </p>
    </>
  );
}

const faq = [
  {
    q: 'Escrever realmente ajuda com ansiedade?',
    a: 'Sim, como ferramenta de apoio. Colocar pensamentos ansiosos em palavras reduz a ruminação, ajuda a nomear a emoção e devolve senso de controle. Não substitui tratamento, mas é um recurso acessível e eficaz no dia a dia.',
  },
  {
    q: 'O que escrever durante uma crise de ansiedade?',
    a: 'Faça um despejo mental: escreva tudo que está na cabeça, sem ordem nem filtro. O objetivo é esvaziar, não redigir. Depois, se conseguir, releia para separar o que é real do que é catastrofização.',
  },
  {
    q: 'Preciso escrever muito para aliviar a ansiedade?',
    a: 'Não. Nos picos, poucas frases ou um despejo desorganizado já tiram parte do peso da cabeça. A regularidade importa mais do que a extensão — escrever pouco, mas com frequência, funciona melhor.',
  },
  {
    q: 'Com que frequência escrever para reduzir a ansiedade?',
    a: 'Um pouco todos os dias funciona melhor do que sessões longas e raras. A regularidade é o que revela seus gatilhos e permite agir antes que a ansiedade cresça.',
  },
];

const article: ArticleModule = { meta, Body, faq };
export default article;
