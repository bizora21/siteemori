import type { Metadata } from 'next';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n';
import { buildMetadata } from '@/lib/seo';
import PageShell from '@/components/PageShell';
import CtaButton from '@/components/CtaButton';
import TldrBlock from '@/components/TldrBlock';
import FAQ from '@/components/FAQ';
import JsonLd from '@/components/JsonLd';
import { softwareApplicationSchema } from '@/lib/schema';

export function generateStaticParams() {
  return [{ lang: 'pt-br' }, { lang: 'pt-pt' }];
}

export function generateMetadata({ params }: { params: { lang: Locale } }): Metadata {
  const dict = getDictionary(params.lang);
  return buildMetadata({
    lang: params.lang,
    path: 'produto',
    title: dict.produto.metaTitle,
    description: dict.produto.metaDescription,
  });
}

export default function ProdutoPage({ params }: { params: { lang: Locale } }) {
  const lang = params.lang;
  const dict = getDictionary(lang);
  const t = dict.produto;

  return (
    <PageShell lang={lang} path="produto">
      <article className="mx-auto max-w-3xl">
        <h1 className="font-serif text-3xl leading-tight text-ink-900 md:text-4xl">
          {t.h1}
        </h1>
        <TldrBlock label={dict.common.tldrLabel}>{t.tldr}</TldrBlock>

        <div className="prose-emori">
          {t.sections.map((s) => (
            <section key={s.h2}>
              <h2>{s.h2}</h2>
              <p>{s.body}</p>
            </section>
          ))}
        </div>

        {/* Lista de recursos */}
        <section className="mt-12">
          <h2 className="font-serif text-2xl text-ink-900">{t.featuresTitle}</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {t.features.map((f) => (
              <li
                key={f}
                className="flex items-start gap-2 rounded-xl border border-clay-100 bg-cream-50 px-4 py-3 text-ink-800"
              >
                <span aria-hidden="true" className="mt-0.5 text-clay-600">
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <div className="mt-12 flex flex-col items-start gap-3">
          <CtaButton
            label={dict.cta.download}
            betaLabel={dict.waitlist.buttonLabel}
            campaign="produto"
          />
          <p className="text-sm text-ink-700">{dict.common.androidNote}</p>
        </div>

        <FAQ title={dict.common.faqTitle} items={t.faq} />
      </article>

      {/* SoftwareApplication JSON-LD */}
      <JsonLd data={softwareApplicationSchema(lang, t.metaDescription)} />
    </PageShell>
  );
}
