// Bloco TL;DR answer-first: aparece logo abaixo do H1 e é o texto que a IA extrai.
// Renderizado no HTML estático, autossuficiente.

interface Props {
  label: string;
  children: React.ReactNode;
}

export default function TldrBlock({ label, children }: Props) {
  return (
    <div className="my-6 rounded-2xl border border-clay-100 bg-cream-100 p-5 md:p-6">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-clay-600">
        {label}
      </p>
      <p className="text-lg leading-relaxed text-ink-800">{children}</p>
    </div>
  );
}
