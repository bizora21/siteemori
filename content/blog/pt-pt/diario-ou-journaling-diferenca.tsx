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
      {/* TODO: localizar PT-PT — traduzir o corpo completo a partir da variante pt-br. */}
      <p>{meta.tldr}</p>
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
