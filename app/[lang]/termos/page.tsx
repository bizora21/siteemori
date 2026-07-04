import type { Metadata } from 'next';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n';
import { buildMetadata } from '@/lib/seo';
import PageShell from '@/components/PageShell';
import TldrBlock from '@/components/TldrBlock';

export function generateStaticParams() {
  return [{ lang: 'pt-br' }, { lang: 'pt-pt' }];
}

export function generateMetadata({ params }: { params: { lang: Locale } }): Metadata {
  const dict = getDictionary(params.lang);
  return buildMetadata({
    lang: params.lang,
    path: 'termos',
    title: dict.termos.metaTitle,
    description: dict.termos.metaDescription,
  });
}

export default function TermosPage({ params }: { params: { lang: Locale } }) {
  const lang = params.lang;
  const dict = getDictionary(lang);
  const t = dict.termos;

  return (
    <PageShell lang={lang} path="termos">
      <article className="mx-auto max-w-3xl">
        <h1 className="font-serif text-3xl leading-tight text-ink-900 md:text-4xl">
          {t.h1}
        </h1>
        <p className="mt-2 text-sm text-ink-700">
          {t.lastUpdatedLabel}: {t.lastUpdated}
        </p>
        <TldrBlock label={dict.common.tldrLabel}>{t.tldr}</TldrBlock>

        <div className="prose-emori">
          {t.sections.map((s) => (
            <section key={s.h2}>
              <h2>{s.h2}</h2>
              <p>{s.body}</p>
            </section>
          ))}
        </div>
      </article>
    </PageShell>
  );
}
