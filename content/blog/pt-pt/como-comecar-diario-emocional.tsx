import type { ArticleModule } from '../types';

const meta = {
  slug: 'como-comecar-diario-emocional',
  title: 'Como começar um diário emocional (guia para iniciantes)',
  description:
    'Um guia prático para começares um diário emocional hoje: o que é, por onde começar, quanto escrever e como manter o hábito mesmo sem saber por onde ir.',
  tldr: 'Para começar um diário emocional, escolhe um sítio fixo (aplicação ou caderno), escreve durante 5 minutos sobre como te sentes agora — sem te preocupares com a forma — e repete à mesma hora todos os dias. O segredo não é escrever bonito, é escrever com frequência e honestidade.',
  datePublished: '2026-07-04',
  readingMinutes: 6,
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
