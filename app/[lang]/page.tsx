import type { Metadata } from 'next';
import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n';
import { buildMetadata, localizedPath } from '@/lib/seo';
import PageShell from '@/components/PageShell';
import CtaButton from '@/components/CtaButton';
import IosWaitlistLink from '@/components/IosWaitlistLink';
import CartaCard from '@/components/CartaCard';
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
    path: '',
    title: dict.home.metaTitle,
    description: dict.home.metaDescription,
  });
}

// Lua-motivo, usada como marca-d'água discreta em algumas secções.
function MoonGlyph({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 200"
      className={`pointer-events-none absolute ${className}`}
    >
      <path
        d="M150 108A56 56 0 1 1 94 52 44 44 0 0 0 150 108Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
      />
    </svg>
  );
}

export default function HomePage({ params }: { params: { lang: Locale } }) {
  const lang = params.lang;
  const dict = getDictionary(lang);
  const t = dict.home;

  return (
    <PageShell lang={lang} path="">
      {/* HERO editorial e assimétrico */}
      <section className="relative">
        <MoonGlyph className="-right-10 -top-20 h-64 w-64 text-clay-100 md:-right-4 md:h-96 md:w-96" />
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-10">
          <div>
            <p className="eyebrow">{t.eyebrow}</p>
            <h1 className="mt-4 font-serif text-[2.6rem] leading-[1.03] text-ink-900 md:text-6xl">
              {t.h1}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-700">{t.tldr}</p>
            <div className="mt-8 flex flex-col items-start gap-3">
              <CtaButton
                label={dict.cta.download}
                betaLabel={dict.waitlist.buttonLabel}
                campaign="home"
              />
              <p className="text-sm text-ink-700">{t.primaryCtaNote}</p>
              <p className="text-xs text-ink-700/80">{dict.common.androidNote}</p>
              <IosWaitlistLink label={dict.waitlist.triggerIos} className="mt-1" />
            </div>
          </div>
          <div className="md:pl-6">
            <CartaCard label={t.cartaLabel} body={t.cartaBody} />
          </div>
        </div>
      </section>

      {/* VALORES — layout editorial de duas colunas com filetes */}
      <section className="mt-24 md:mt-36" aria-labelledby="valores">
        <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
          <div className="md:sticky md:top-28 md:self-start">
            <p className="eyebrow text-clay-300">01</p>
            <h2
              id="valores"
              className="mt-3 font-serif text-3xl leading-tight text-ink-900 md:text-[2.6rem]"
            >
              {t.valueTitle}
            </h2>
          </div>
          <ul className="border-t border-clay-100">
            {t.values.map((v) => (
              <li key={v.title} className="border-b border-clay-100 py-7">
                <h3 className="font-serif text-xl text-ink-900">{v.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-700">{v.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* COMO FUNCIONA — numerais serifados, sem "bolhas" */}
      <section className="mt-24 md:mt-36" aria-labelledby="como">
        <h2 id="como" className="font-serif text-3xl text-ink-900 md:text-[2.6rem]">
          {t.howTitle}
        </h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-12">
          {t.howSteps.map((s, i) => (
            <li key={s.title} className="border-t border-clay-100 pt-5">
              <span className="serif-num text-5xl md:text-6xl">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-4 font-serif text-lg text-ink-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-700">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ALIADA DA TERAPIA — painel salvia com filete */}
      <section
        className="mt-24 overflow-hidden rounded-[2rem] border border-sage-300/50 bg-sage-100/70 p-8 md:mt-36 md:p-12"
        aria-labelledby="terapia"
      >
        <h2
          id="terapia"
          className="max-w-2xl font-serif text-2xl text-ink-900 md:text-[2rem]"
        >
          {t.therapyTitle}
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-800">{t.therapyBody}</p>
        <p className="mt-4 text-sm italic text-sage-700">{t.therapyNote}</p>
      </section>

      {/* CTA final — painel quente com a lua, não uma faixa sólida */}
      <section className="relative mt-24 overflow-hidden rounded-[2rem] border border-clay-100 bg-cream-100 px-6 py-16 text-center md:mt-36">
        <MoonGlyph className="left-1/2 top-6 h-40 w-40 -translate-x-1/2 text-clay-100" />
        <div className="relative">
          <h2 className="font-serif text-3xl text-ink-900 md:text-[2.6rem]">
            {dict.cta.tryEmori}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-ink-700">{t.primaryCtaNote}</p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <CtaButton
              label={dict.cta.download}
              betaLabel={dict.waitlist.buttonLabel}
              campaign="home_footer"
            />
            <IosWaitlistLink label={dict.waitlist.triggerIos} />
            <p className="mt-1 text-sm">
              <Link
                href={localizedPath(lang, 'produto')}
                className="text-clay-600 underline underline-offset-2 hover:text-clay-700"
              >
                {dict.common.readMore}
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ + FAQPage JSON-LD */}
      <FAQ title={dict.common.faqTitle} items={t.faq} />

      {/* SoftwareApplication — ajuda a app a aparecer como rich result */}
      <JsonLd data={softwareApplicationSchema(lang, t.metaDescription)} />
    </PageShell>
  );
}
