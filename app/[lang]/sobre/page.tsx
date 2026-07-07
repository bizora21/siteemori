import type { Metadata } from 'next';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n';
import { buildMetadata } from '@/lib/seo';
import PageShell from '@/components/PageShell';
import TldrBlock from '@/components/TldrBlock';
import CtaButton from '@/components/CtaButton';
import { CONTACT_EMAIL } from '@/lib/constants';

export function generateStaticParams() {
  return [{ lang: 'pt-br' }, { lang: 'pt-pt' }];
}

export function generateMetadata({ params }: { params: { lang: Locale } }): Metadata {
  const dict = getDictionary(params.lang);
  return buildMetadata({
    lang: params.lang,
    path: 'sobre',
    title: dict.sobre.metaTitle,
    description: dict.sobre.metaDescription,
  });
}

export default function SobrePage({ params }: { params: { lang: Locale } }) {
  const lang = params.lang;
  const dict = getDictionary(lang);
  const t = dict.sobre;

  return (
    <PageShell lang={lang} path="sobre">
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

        {/* Valores */}
        <section className="mt-14">
          <h2 className="font-serif text-2xl text-ink-900">{t.valuesTitle}</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {t.values.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-clay-100 bg-cream-50 p-6"
              >
                <h3 className="font-serif text-xl text-ink-900">{v.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-700">{v.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contacto */}
        <section className="mt-14 rounded-2xl bg-cream-100 p-6 md:p-8">
          <h2 className="font-serif text-2xl text-ink-900">{t.contactTitle}</h2>
          <p className="mt-2 leading-relaxed text-ink-800">
            {t.contactIntro}{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-clay-600 underline underline-offset-2 hover:text-clay-700"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        {/* CTA */}
        <div className="mt-12 flex flex-col items-start gap-3">
          <CtaButton
            label={dict.cta.download}
            betaLabel={dict.waitlist.buttonLabel}
            campaign="sobre"
          />
          <p className="text-sm text-ink-700">{dict.common.androidNote}</p>
        </div>
      </article>
    </PageShell>
  );
}
