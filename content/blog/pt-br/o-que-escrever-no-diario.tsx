import type { ArticleModule } from '../types';

const meta = {
  slug: 'o-que-escrever-no-diario',
  title: 'O que escrever no diário quando você não sabe o que está sentindo',
  description:
    'Quando você não sabe o que sente, escreva sobre o corpo, sobre o dia e responda perguntas simples. Um guia com prompts para destravar o diário.',
  tldr: 'Quando você não sabe o que está sentindo, não tente nomear a emoção de cara. Comece descrevendo o corpo (“meu peito está apertado”), o que aconteceu no dia e o que você evita pensar. A emoção costuma aparecer sozinha quando você para de tentar forçá-la.',
  datePublished: '2026-07-04',
  readingMinutes: 6,
  hero: {
    src: 'https://images.unsplash.com/photo-1509029032154-54ba8b3216d4?ixid=M3w4MjU2NjZ8MHwxfHNlYXJjaHwzfHxwZXJzb24lMjB0aG91Z2h0ZnVsJTIwd2luZG93JTIwbW9ybmluZyUyMGxpZ2h0fGVufDF8MHx8fDE3ODUxNTgyNTF8MA&ixlib=rb-4.1.0&w=1600&q=80&auto=format&fit=crop',
    alt: 'Um homem de óculos olhando pela janela, pensativo',
    credit: 'Laurenz Kleinheider',
    creditUrl: 'https://unsplash.com/@laurlenz?utm_source=aemori&utm_medium=referral',
  },
};

function Body() {
  return (
    <>
      <p>
        “Não sei o que estou sentindo” é um dos motivos mais comuns para travar diante do
        diário — e, ironicamente, já é um ótimo ponto de partida. Não saber é um estado
        legítimo. O caminho não é adivinhar a emoção certa, mas criar pistas até ela ficar
        visível. Abaixo estão formas concretas de fazer isso.
      </p>

      <h2>Por que às vezes não sabemos o que sentimos?</h2>
      <p>
        Porque emoção não vem etiquetada. Muitas vezes sentimos uma mistura (alívio +
        culpa, cansaço + raiva) e o cérebro, sem palavra pronta, registra só um
        desconforto difuso. Há até um nome para a dificuldade de identificar emoções:
        alexitimia. Não saber nomear não é um defeito seu — é uma habilidade que se treina,
        e o diário é justamente o treino.
      </p>

      <h2>Comece pelo corpo, não pela emoção</h2>
      <p>
        O corpo quase sempre sabe antes da mente. Em vez de “o que eu sinto?”, pergunte{' '}
        <strong>“onde e como isso aparece em mim?”</strong>:
      </p>
      <ul>
        <li>Onde está a tensão? (peito, ombros, estômago, mandíbula)</li>
        <li>Sua respiração está curta ou solta?</li>
        <li>Você está agitado, pesado, travado, elétrico?</li>
      </ul>
      <p>
        Descrever a sensação física dá ao sentimento um contorno. “Um nó no estômago desde
        a reunião” já aponta para ansiedade sem você precisar ter usado a palavra.
      </p>

      <h2>Descreva o dia sem interpretar</h2>
      <p>
        Liste o que aconteceu, em ordem, como uma câmera: “acordei tarde, briguei no
        trânsito, o chefe não respondeu minha mensagem”. Ao reler, você percebe onde o
        humor virou. O fato guarda a emoção; recontar o dia devolve o sentimento ao
        contexto que o gerou.
      </p>

      <h2>Prompts para quando a página trava</h2>
      <p>Escolha um e escreva sem pensar demais:</p>
      <ul>
        <li>“O que eu estou evitando pensar agora?”</li>
        <li>“Se essa sensação falasse, ela diria…”</li>
        <li>“O que eu queria que alguém entendesse sobre o meu dia?”</li>
        <li>“Do que eu preciso agora e não estou tendo?”</li>
        <li>“O que mudou entre hoje de manhã e agora?”</li>
      </ul>

      <h2>Deixe uma pergunta te guiar</h2>
      <p>
        Escrever sozinho, do zero, é difícil justamente porque você é quem pergunta e
        quem responde. Quando algo (ou alguém) faz a pergunta certa, responder fica bem
        mais fácil. É por isso que a Emori conversa com você em vez de mostrar uma página
        vazia: ela puxa o fio com perguntas gentis e, como lembra do seu contexto, a
        pergunta seguinte já vem mais afiada.
      </p>

      <h2>E se nada vier mesmo?</h2>
      <p>
        Escreva “nada está vindo” e descreva esse nada. Vazio, entorpecimento e
        indiferença também são estados emocionais — muitas vezes de cansaço ou proteção.
        Nomear o vazio é escrever sobre o que você sente. Você nunca está realmente sem
        assunto.
      </p>
    </>
  );
}

const faq = [
  {
    q: 'É normal não saber o que estou sentindo?',
    a: 'Totalmente. Emoções raramente vêm nomeadas e muitas vezes são misturas. Identificar sentimentos é uma habilidade que se desenvolve com a prática — inclusive escrevendo.',
  },
  {
    q: 'Como transformar “não sei” em algo escrito?',
    a: 'Comece pelo corpo (onde há tensão, como está a respiração) e pelo dia (o que aconteceu, em ordem). Essas pistas concretas costumam revelar a emoção sem que você precise adivinhá-la.',
  },
  {
    q: 'Prompts ajudam ou viciam?',
    a: 'Ajudam, principalmente no início. Eles reduzem o atrito da página em branco. Com o tempo você precisa deles cada vez menos, mas não há problema em usá-los sempre que travar.',
  },
  {
    q: 'Escrever “não sei o que sinto” conta como diário?',
    a: 'Conta. Descrever a ausência ou a confusão é um registro emocional legítimo. O objetivo é honestidade, não uma emoção “interessante”.',
  },
];

const article: ArticleModule = { meta, Body, faq };
export default article;
