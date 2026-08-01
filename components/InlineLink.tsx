import Link from 'next/link';

// Link interno contextual para usar DENTRO do corpo dos artigos.
// Links no meio do texto valem mais para SEO do que listas de "leia também",
// porque o Google lê a frase à volta como contexto do destino.
//
//   <InlineLink lang={lang} slug="diario-de-gratidao">diário de gratidão</InlineLink>
//
// Nota: os artigos são componentes sem acesso ao `lang`, por isso o caminho é
// construído com um idioma explícito ou relativo à raiz do idioma corrente.
export default function InlineLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="text-clay-600 underline underline-offset-2 hover:text-clay-700">
      {children}
    </Link>
  );
}
