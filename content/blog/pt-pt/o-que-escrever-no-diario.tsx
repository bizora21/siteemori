import type { ArticleModule } from '../types';

const meta = {
  slug: 'o-que-escrever-no-diario',
  title: 'O que escrever no diário quando não sabes o que estás a sentir',
  description:
    'Quando não sabes o que sentes, escreve sobre o corpo, sobre o dia e responde a perguntas simples. Um guia com sugestões para destravar o diário.',
  tldr: 'Quando não sabes o que estás a sentir, não tentes nomear a emoção logo. Começa por descrever o corpo (“tenho o peito apertado”), o que aconteceu no dia e o que evitas pensar. A emoção costuma aparecer sozinha quando deixas de a tentar forçar.',
  datePublished: '2026-07-04',
  readingMinutes: 6,
};

function Body() {
  return (
    <>
      <p>
        “Não sei o que estou a sentir” é um dos motivos mais comuns para travar diante do
        diário — e, ironicamente, já é um ótimo ponto de partida. Não saber é um estado
        legítimo. O caminho não é adivinhar a emoção certa, mas criar pistas até ela ficar
        visível. Abaixo ficam formas concretas de o fazer.
      </p>

      <h2>Porque é que às vezes não sabemos o que sentimos?</h2>
      <p>
        Porque a emoção não vem etiquetada. Muitas vezes sentimos uma mistura (alívio +
        culpa, cansaço + raiva) e o cérebro, sem palavra pronta, regista só um desconforto
        difuso. Há até um nome para a dificuldade de identificar emoções: alexitimia. Não
        saber nomear não é um defeito teu — é uma competência que se treina, e o diário é
        precisamente o treino.
      </p>

      <h2>Começa pelo corpo, não pela emoção</h2>
      <p>
        O corpo quase sempre sabe antes da mente. Em vez de “o que sinto?”, pergunta{' '}
        <strong>“onde e como isto aparece em mim?”</strong>:
      </p>
      <ul>
        <li>Onde está a tensão? (peito, ombros, estômago, mandíbula)</li>
        <li>A tua respiração está curta ou solta?</li>
        <li>Estás agitado, pesado, bloqueado, elétrico?</li>
      </ul>
      <p>
        Descrever a sensação física dá ao sentimento um contorno. “Um nó no estômago desde
        a reunião” já aponta para ansiedade sem precisares de ter usado a palavra.
      </p>

      <h2>Descreve o dia sem interpretar</h2>
      <p>
        Enumera o que aconteceu, por ordem, como uma câmara: “acordei tarde, discuti no
        trânsito, o chefe não respondeu à minha mensagem”. Ao reler, percebes onde o humor
        virou. O facto guarda a emoção; recontar o dia devolve o sentimento ao contexto que
        o gerou.
      </p>

      <h2>Sugestões para quando a página trava</h2>
      <p>Escolhe uma e escreve sem pensar demasiado:</p>
      <ul>
        <li>“O que estou a evitar pensar agora?”</li>
        <li>“Se esta sensação falasse, diria…”</li>
        <li>“O que gostava que alguém compreendesse sobre o meu dia?”</li>
        <li>“De que preciso agora e não estou a ter?”</li>
        <li>“O que mudou entre hoje de manhã e agora?”</li>
      </ul>

      <h2>Deixa uma pergunta guiar-te</h2>
      <p>
        Escrever sozinho, do zero, é difícil precisamente porque és tu a perguntar e a
        responder. Quando algo (ou alguém) faz a pergunta certa, responder fica muito mais
        fácil. É por isso que a Emori conversa contigo em vez de mostrar uma página vazia:
        puxa o fio com perguntas gentis e, como se lembra do teu contexto, a pergunta
        seguinte já vem mais afiada.
      </p>

      <h2>E se não vier mesmo nada?</h2>
      <p>
        Escreve “não está a vir nada” e descreve esse nada. Vazio, entorpecimento e
        indiferença também são estados emocionais — muitas vezes de cansaço ou proteção.
        Nomear o vazio é escrever sobre o que sentes. Nunca estás verdadeiramente sem
        assunto.
      </p>
    </>
  );
}

const faq = [
  {
    q: 'É normal não saber o que estou a sentir?',
    a: 'Totalmente. As emoções raramente vêm nomeadas e muitas vezes são misturas. Identificar sentimentos é uma competência que se desenvolve com a prática — inclusive a escrever.',
  },
  {
    q: 'Como transformar “não sei” em algo escrito?',
    a: 'Começa pelo corpo (onde há tensão, como está a respiração) e pelo dia (o que aconteceu, por ordem). Essas pistas concretas costumam revelar a emoção sem teres de a adivinhar.',
  },
  {
    q: 'As sugestões ajudam ou viciam?',
    a: 'Ajudam, sobretudo no início. Reduzem o atrito da página em branco. Com o tempo precisas cada vez menos delas, mas não há problema em usá-las sempre que travares.',
  },
  {
    q: 'Escrever “não sei o que sinto” conta como diário?',
    a: 'Conta. Descrever a ausência ou a confusão é um registo emocional legítimo. O objetivo é a honestidade, não uma emoção “interessante”.',
  },
];

const article: ArticleModule = { meta, Body, faq };
export default article;
