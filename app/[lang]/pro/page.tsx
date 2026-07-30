import type { Metadata } from 'next';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n';
import { buildMetadata } from '@/lib/seo';
import PageShell from '@/components/PageShell';
import PageHeader from '@/components/PageHeader';
import CtaButton from '@/components/CtaButton';
import TldrBlock from '@/components/TldrBlock';
import FAQ from '@/components/FAQ';

export function generateStaticParams() {
  return [{ lang: 'pt-br' }, { lang: 'pt-pt' }];
}

export function generateMetadata({ params }: { params: { lang: Locale } }): Metadata {
  const dict = getDictionary(params.lang);
  return buildMetadata({
    lang: params.lang,
    path: 'pro',
    title: dict.pro.metaTitle,
    description: dict.pro.metaDescription,
  });
}

export default function ProPage({ params }: { params: { lang: Locale } }) {
  const lang = params.lang;
  const dict = getDictionary(lang);
  const t = dict.pro;

  return (
    <PageShell lang={lang} path="pro">
      <article className="mx-auto max-w-3xl">
        <PageHeader eyebrow={dict.nav.pro} title={t.h1} />
        <TldrBlock label={dict.common.tldrLabel}>{t.tldr}</TldrBlock>

        <p className="text-lg leading-relaxed text-ink-700">{t.intro}</p>

        {/* Benefícios */}
        <section className="mt-12">
          <h2 className="font-serif text-2xl text-ink-900">{t.benefitsTitle}</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {t.benefits.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-clay-100 bg-cream-50 p-6"
              >
                <h3 className="font-serif text-xl text-ink-900">{b.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-700">{b.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Justificação de valor */}
        <section className="mt-12 rounded-2xl bg-cream-100 p-6 md:p-8">
          <h2 className="font-serif text-2xl text-ink-900">{t.valueTitle}</h2>
          <p className="mt-3 text-lg leading-relaxed text-ink-800">{t.valueBody}</p>
        </section>

        {/* CTA */}
        <div className="mt-12 flex flex-col items-start gap-3">
          <CtaButton
            label={dict.cta.download}
            betaLabel={dict.waitlist.buttonLabel}
            campaign="pro"
          />
          <p className="text-sm text-ink-700">{dict.common.androidNote}</p>
        </div>

        <FAQ title={dict.common.faqTitle} items={t.faq} />
      </article>
    </PageShell>
  );
}
