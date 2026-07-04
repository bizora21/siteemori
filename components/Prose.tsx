// Wrapper de prosa answer-first para artigos e páginas legais.
// Os estilos vivem em globals.css (.prose-emori).

export default function Prose({ children }: { children: React.ReactNode }) {
  return <div className="prose-emori max-w-prose">{children}</div>;
}
