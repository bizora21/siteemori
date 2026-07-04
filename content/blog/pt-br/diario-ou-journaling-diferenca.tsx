import type { ArticleModule } from '../types';

const meta = {
  slug: 'diario-ou-journaling-diferenca',
  title: 'Diário ou journaling: qual a diferença e qual escolher',
  description:
    'Diário e journaling não são exatamente a mesma coisa. Entenda a diferença entre registrar o dia e usar a escrita como ferramenta — e qual combina com você.',
  tldr: 'Na prática, “diário” costuma significar registrar o que aconteceu no dia, enquanto “journaling” é usar a escrita como ferramenta intencional para pensar, sentir e crescer (com técnicas, prompts e temas). Se você quer memória, escolha o diário; se quer transformação, escolha o journaling — e nada impede juntar os dois.',
  datePublished: '2026-07-04',
  readingMinutes: 5,
};

function Body() {
  return (
    <>
      <p>
        As palavras são usadas quase como sinônimos, mas há uma diferença útil de
        entender. Ela não é sobre certo e errado — é sobre <strong>intenção</strong>. Saber
        qual você quer ajuda a escolher a prática (e o app) que realmente serve ao seu
        objetivo.
      </p>

      <h2>O que é um diário, no sentido clássico?</h2>
      <p>
        Um diário é, tradicionalmente, um registro do que aconteceu: o dia, os fatos, os
        acontecimentos, às vezes acompanhados do que você sentiu. O foco é{' '}
        <strong>documentar</strong>. O valor está na memória — poder voltar e reler quem
        você era, o que viveu, como as coisas mudaram.
      </p>

      <h2>O que é journaling?</h2>
      <p>
        Journaling é usar a escrita como <strong>ferramenta</strong>, não só como registro.
        Em vez de apenas contar o dia, você escreve para pensar melhor, processar emoções,
        tomar decisões ou desenvolver hábitos. Costuma envolver métodos: prompts, gratidão,
        escrita expressiva, morning pages, journaling emocional. O foco é a transformação,
        não o arquivo.
      </p>

      <h2>Qual é a diferença prática entre os dois?</h2>
      <ul>
        <li>
          <strong>Diário</strong> → “o que aconteceu?”. Orientado ao passado e à memória.
        </li>
        <li>
          <strong>Journaling</strong> → “o que isso significa e o que eu faço com isso?”.
          Orientado à reflexão e ao presente/futuro.
        </li>
        <li>
          <strong>Diário</strong> é mais livre e narrativo; <strong>journaling</strong>{' '}
          costuma ser mais guiado, com técnica.
        </li>
      </ul>

      <h2>Qual devo escolher?</h2>
      <p>Depende do que você procura:</p>
      <ol>
        <li>
          Quer <strong>guardar a sua vida</strong> e reler no futuro? Diário.
        </li>
        <li>
          Quer <strong>entender e mudar</strong> algo em você? Journaling.
        </li>
        <li>
          Quer <strong>lidar com emoções</strong> do dia a dia? Journaling emocional — o
          meio-termo mais procurado.
        </li>
      </ol>
      <p>
        A boa notícia: você não precisa escolher para sempre. Muita gente registra o dia
        <em> e</em> usa prompts para refletir. O importante é que a prática combine com a
        sua intenção do momento.
      </p>

      <h2>Onde entra um app com IA?</h2>
      <p>
        Um app como a Emori borra a fronteira entre os dois — no bom sentido. Você
        registra o dia (diário) e, ao mesmo tempo, ela faz perguntas que transformam esse
        registro em reflexão (journaling). Como ela lembra do seu contexto, a memória do
        diário alimenta a profundidade do journaling: dois valores num só hábito.
      </p>
    </>
  );
}

const faq = [
  {
    q: 'Diário e journaling são a mesma coisa?',
    a: 'Quase, mas não exatamente. “Diário” tende a significar registrar o que aconteceu; “journaling” é usar a escrita de forma intencional para refletir, processar emoções ou crescer. A diferença está na intenção.',
  },
  {
    q: 'Journaling é melhor do que diário?',
    a: 'Nenhum é melhor — servem a objetivos diferentes. O diário é ótimo para memória; o journaling, para transformação. O “melhor” é o que combina com o que você quer agora.',
  },
  {
    q: 'Posso fazer os dois ao mesmo tempo?',
    a: 'Sim, e é comum. Você pode registrar o dia e, na mesma sessão, responder a um prompt de reflexão. Apps de diário com IA facilitam justamente essa combinação.',
  },
  {
    q: 'Journaling emocional é journaling ou diário?',
    a: 'É um meio-termo: registra o que você sentiu (como um diário) usando técnicas e perguntas para aprofundar (como journaling). É a forma mais procurada por quem quer lidar melhor com as emoções.',
  },
];

const article: ArticleModule = { meta, Body, faq };
export default article;
