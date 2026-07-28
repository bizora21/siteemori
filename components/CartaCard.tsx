import { Moon } from 'lucide-react';

// Ilustração da "carta da Emori" — o resumo emocional que a app devolve.
// É um elemento de marca desenhado (não um screenshot), que dá um vislumbre
// do produto e ancora o diferencial da memória.
export default function CartaCard({ label, body }: { label: string; body: string }) {
  return (
    <div className="relative mx-auto max-w-sm md:mr-0">
      {/* halo quente por trás do cartão */}
      <div
        aria-hidden="true"
        className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-clay-100/50 blur-2xl"
      />
      <figure className="rotate-[-1.5deg] rounded-[1.75rem] border border-clay-100 bg-cream-50 p-6 shadow-[0_24px_60px_-24px_rgba(84,57,27,0.45)] md:p-7">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-clay-500 text-cream-50">
            <Moon size={16} strokeWidth={2.2} />
          </span>
          <span className="eyebrow text-clay-500">{label}</span>
        </div>
        <p className="mt-5 font-serif text-[1.05rem] leading-relaxed text-ink-800">
          {body}
        </p>
        {/* linha de "assinatura" que sugere continuação */}
        <div className="mt-6 flex items-center gap-2 text-clay-300">
          <span className="h-px flex-1 bg-clay-100" />
          <Moon size={13} strokeWidth={2.2} />
        </div>
      </figure>
    </div>
  );
}
