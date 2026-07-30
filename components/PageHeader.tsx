// Cabeçalho editorial partilhado pelas páginas internas — rótulo (eyebrow) +
// título serifado em escala grande, para todas falarem a mesma língua visual da home.
export default function PageHeader({
  eyebrow,
  title,
  meta,
}: {
  eyebrow?: string;
  title: string;
  meta?: React.ReactNode;
}) {
  return (
    <header className="mb-2">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="mt-3 font-serif text-[2.3rem] leading-[1.05] text-ink-900 md:text-5xl">
        {title}
      </h1>
      {meta && <div className="mt-3 text-sm text-ink-700">{meta}</div>}
    </header>
  );
}
