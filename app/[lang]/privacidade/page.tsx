import type { Metadata } from 'next';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n';
import { buildMetadata } from '@/lib/seo';
import PageShell from '@/components/PageShell';
import PageHeader from '@/components/PageHeader';
import TldrBlock from '@/components/TldrBlock';

export function generateStaticParams() {
  return [{ lang: 'pt-br' }, { lang: 'pt-pt' }];
}

export function generateMetadata({ params }: { params: { lang: Locale } }): Metadata {
  const dict = getDictionary(params.lang);
  return buildMetadata({
    lang: params.lang,
    path: 'privacidade',
    title: dict.privacidade.metaTitle,
    description: dict.privacidade.metaDescription,
  });
}

export default function PrivacidadePage({ params }: { params: { lang: Locale } }) {
  const lang = params.lang;
  const dict = getDictionary(lang);
  const t = dict.privacidade;

  return (
    <PageShell lang={lang} path="privacidade">
      <article className="mx-auto max-w-3xl">
        <PageHeader
          eyebrow={dict.nav.privacidade}
          title={t.h1}
          meta={`${t.lastUpdatedLabel}: ${t.lastUpdated}`}
        />
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
