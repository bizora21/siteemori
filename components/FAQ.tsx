import JsonLd from './JsonLd';
import { faqSchema } from '@/lib/schema';

// Secção FAQ answer-first. Renderiza as perguntas/respostas em HTML puro
// (usa <details> nativo, sem JS) e emite FAQPage JSON-LD.

export interface FaqItem {
  q: string;
  a: string;
}

interface Props {
  title: string;
  items: readonly FaqItem[];
  /** emitir JSON-LD FAQPage (padrão: true) */
  jsonLd?: boolean;
}

export default function FAQ({ title, items, jsonLd = true }: Props) {
  return (
    <section className="mt-14" aria-labelledby="faq-heading">
      <h2
        id="faq-heading"
        className="font-serif text-2xl md:text-3xl text-ink-900 mb-6"
      >
        {title}
      </h2>
      <div className="divide-y divide-clay-100 rounded-2xl border border-clay-100 bg-cream-50">
        {items.map((item, i) => (
          <details key={i} className="group px-5 py-4 md:px-6">
            <summary className="cursor-pointer list-none font-medium text-ink-900 marker:hidden [&::-webkit-details-marker]:hidden flex items-center justify-between gap-4">
              <span>{item.q}</span>
              <span
                aria-hidden="true"
                className="text-clay-500 transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 leading-relaxed text-ink-700">{item.a}</p>
          </details>
        ))}
      </div>
      {jsonLd && <JsonLd data={faqSchema(items)} />}
    </section>
  );
}
