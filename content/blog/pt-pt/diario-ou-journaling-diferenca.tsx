import type { ArticleModule } from '../types';

const meta = {
  slug: 'diario-ou-journaling-diferenca',
  title: 'Diário ou journaling: qual a diferença e qual escolher',
  description:
    'Diário e journaling não são exatamente a mesma coisa. Percebe a diferença entre registar o dia e usar a escrita como ferramenta — e qual combina contigo.',
  tldr: 'Na prática, “diário” costuma significar registar o que aconteceu no dia, enquanto “journaling” é usar a escrita como ferramenta intencional para pensar, sentir e crescer (com técnicas, sugestões e temas). Se queres memória, escolhe o diário; se queres transformação, escolhe o journaling — e nada impede juntar os dois.',
  datePublished: '2026-07-04',
  readingMinutes: 5,
};

function Body() {
  return (
    <>
      <p>
        As palavras são usadas quase como sinónimos, mas há uma diferença útil de
        compreender. Não é sobre certo e errado — é sobre <strong>intenção</strong>. Saber
        qual queres ajuda a escolher a prática (e a app) que realmente serve o teu
        objetivo.
      </p>

      <h2>O que é um diário, no sentido clássico?</h2>
      <p>
        Um diário é, tradicionalmente, um registo do que aconteceu: o dia, os factos, os
        acontecimentos, por vezes acompanhados do que sentiste. O foco é{' '}
        <strong>documentar</strong>. O valor está na memória — poder voltar e reler quem
        eras, o que viveste, como as coisas mudaram.
      </p>

      <h2>O que é journaling?</h2>
      <p>
        Journaling é usar a escrita como <strong>ferramenta</strong>, não só como registo.
        Em vez de apenas contar o dia, escreves para pensar melhor, processar emoções,
        tomar decisões ou desenvolver hábitos. Costuma envolver métodos: sugestões,
        gratidão, escrita expressiva, morning pages, journaling emocional. O foco é a
        transformação, não o arquivo.
      </p>

      <h2>Qual é a diferença prática entre os dois?</h2>
      <ul>
        <li>
          <strong>Diário</strong> → “o que aconteceu?”. Orientado ao passado e à memória.
        </li>
        <li>
          <strong>Journaling</strong> → “o que isto significa e o que faço com isto?”.
          Orientado à reflexão e ao presente/futuro.
        </li>
        <li>
          <strong>Diário</strong> é mais livre e narrativo; <strong>journaling</strong>{' '}
          costuma ser mais guiado, com técnica.
        </li>
      </ul>

      <h2>Qual devo escolher?</h2>
      <p>Depende do que procuras:</p>
      <ol>
        <li>
          Queres <strong>guardar a tua vida</strong> e reler no futuro? Diário.
        </li>
        <li>
          Queres <strong>compreender e mudar</strong> algo em ti? Journaling.
        </li>
        <li>
          Queres <strong>lidar com emoções</strong> do dia a dia? Journaling emocional — o
          meio-termo mais procurado.
        </li>
      </ol>
      <p>
        A boa notícia: não precisas de escolher para sempre. Muita gente regista o dia
        <em> e</em> usa sugestões para refletir. O importante é que a prática combine com a
        tua intenção do momento.
      </p>

      <h2>Onde entra uma app com IA?</h2>
      <p>
        Uma app como a Emori esbate a fronteira entre os dois — no bom sentido. Registas o
        dia (diário) e, ao mesmo tempo, ela faz perguntas que transformam esse registo em
        reflexão (journaling). Como se lembra do teu contexto, a memória do diário alimenta
        a profundidade do journaling: dois valores num só hábito.
      </p>
    </>
  );
}

const faq = [
  {
    q: 'Diário e journaling são a mesma coisa?',
    a: 'Quase, mas não exatamente. “Diário” tende a significar registar o que aconteceu; “journaling” é usar a escrita de forma intencional para refletir, processar emoções ou crescer. A diferença está na intenção.',
  },
  {
    q: 'O journaling é melhor do que o diário?',
    a: 'Nenhum é melhor — servem objetivos diferentes. O diário é ótimo para memória; o journaling, para transformação. O “melhor” é o que combina com o que queres agora.',
  },
  {
    q: 'Posso fazer os dois ao mesmo tempo?',
    a: 'Sim, e é comum. Podes registar o dia e, na mesma sessão, responder a uma sugestão de reflexão. As aplicações de diário com IA facilitam precisamente essa combinação.',
  },
  {
    q: 'O journaling emocional é journaling ou diário?',
    a: 'É um meio-termo: regista o que sentiste (como um diário) usando técnicas e perguntas para aprofundar (como journaling). É a forma mais procurada por quem quer lidar melhor com as emoções.',
  },
];

const article: ArticleModule = { meta, Body, faq };
export default article;
