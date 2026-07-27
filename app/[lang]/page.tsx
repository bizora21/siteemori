import type { Metadata } from 'next';
import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n';
import { buildMetadata } from '@/lib/seo';
import PageShell from '@/components/PageShell';
import CtaButton from '@/components/CtaButton';
import IosWaitlistLink from '@/components/IosWaitlistLink';
import FAQ from '@/components/FAQ';
import JsonLd from '@/components/JsonLd';
import { softwareApplicationSchema } from '@/lib/schema';
import { localizedPath } from '@/lib/seo';
import { CLOSED_BETA } from '@/lib/constants';

export function generateStaticParams() {
  return [{ lang: 'pt-br' }, { lang: 'pt-pt' }];
}

export function generateMetadata({ params }: { params: { lang: Locale } }): Metadata {
  const dict = getDictionary(params.lang);
  return buildMetadata({
    lang: params.lang,
    path: '',
    title: dict.home.metaTitle,
    description: dict.home.metaDescription,
  });
}

export default function HomePage({ params }: { params: { lang: Locale } }) {
  const lang = params.lang;
  const dict = getDictionary(lang);
  const t = dict.home;

  return (
    <PageShell lang={lang} path="">
      {/* HERO — answer-first: H1 = tema, TL;DR logo abaixo */}
      <section className="mx-auto max-w-3xl text-center">
        <span className="inline-block rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold text-sage-700">
          {CLOSED_BETA ? dict.waitlist.badge : dict.common.freeBadge}
        </span>
        <h1 className="mt-5 font-serif text-4xl leading-tight text-ink-900 md:text-5xl">
          {t.h1}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-ink-700">
          {t.tldr}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <CtaButton
            label={dict.cta.download}
            betaLabel={dict.waitlist.buttonLabel}
            campaign="home"
          />
          <p className="text-sm text-ink-700">
            {CLOSED_BETA ? dict.common.betaNote : t.primaryCtaNote}
          </p>
          <p className="text-xs text-ink-700/80">{dict.common.androidNote}</p>
          <IosWaitlistLink label={dict.waitlist.triggerIos} className="mt-1" />
        </div>
      </section>

      {/* VALORES */}
      <section className="mt-20" aria-labelledby="valores">
        <h2
          id="valores"
          className="text-center font-serif text-2xl text-ink-900 md:text-3xl"
        >
          {t.valueTitle}
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
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

      {/* COMO FUNCIONA */}
      <section className="mt-20" aria-labelledby="como">
        <h2
          id="como"
          className="text-center font-serif text-2xl text-ink-900 md:text-3xl"
        >
          {t.howTitle}
        </h2>
        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {t.howSteps.map((s, i) => (
            <li
              key={s.title}
              className="rounded-2xl bg-cream-100 p-6"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-clay-600 font-serif text-cream-50">
                {i + 1}
              </div>
              <h3 className="mt-4 font-serif text-lg text-ink-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-700">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Aliada da terapia — vantagem em destaque */}
      <section
        className="mt-20 rounded-3xl bg-sage-100 px-6 py-12 md:px-10"
        aria-labelledby="terapia"
      >
        <h2 id="terapia" className="font-serif text-2xl text-ink-900 md:text-3xl">
          {t.therapyTitle}
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-800">
          {t.therapyBody}
        </p>
        <p className="mt-3 text-sm italic text-sage-700">{t.therapyNote}</p>
      </section>

      {/* TL;DR reforço + CTA */}
      <section className="mt-20 rounded-3xl bg-clay-600 px-6 py-12 text-center text-cream-50">
        <h2 className="font-serif text-2xl md:text-3xl">{dict.cta.tryEmori}</h2>
        <div className="mt-6 flex justify-center">
          <CtaButton
            label={dict.cta.download}
            betaLabel={dict.waitlist.buttonLabel}
            campaign="home_footer"
            variant="secondary"
          />
        </div>
        <p className="mt-4 text-sm text-cream-100/90">
          <Link href={localizedPath(lang, 'produto')} className="underline">
            {dict.common.readMore}
          </Link>
        </p>
      </section>

      {/* FAQ + FAQPage JSON-LD */}
      <FAQ title={dict.common.faqTitle} items={t.faq} />

      {/* SoftwareApplication — ajuda a app a aparecer como rich result */}
      <JsonLd data={softwareApplicationSchema(lang, t.metaDescription)} />
    </PageShell>
  );
}
