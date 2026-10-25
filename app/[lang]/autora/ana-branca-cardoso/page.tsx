import type { Metadata } from 'next';
import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n';
import { buildMetadata, localizedPath, absoluteUrl } from '@/lib/seo';
import { ANA } from '@/lib/authors';
import { personSchema, profilePageSchema, itemListSchema, breadcrumbSchema } from '@/lib/schema';
import PageShell from '@/components/PageShell';
import PageHeader from '@/components/PageHeader';
import TldrBlock from '@/components/TldrBlock';
import CtaButton from '@/components/CtaButton';
import JsonLd from '@/components/JsonLd';
import { getArticles } from '@/content/blog';

export function generateStaticParams() {
  return [{ lang: 'pt-br' }, { lang: 'pt-pt' }];
}

export function generateMetadata({ params }: { params: { lang: Locale } }): Metadata {
  const t = ANA.text[params.lang];
  return buildMetadata({
    lang: params.lang,
    path: ANA.path,
    title: t.metaTitle,
    description: t.metaDescription,
    ogImage: ANA.image,
  });
}

export default function AutoraPage({ params }: { params: { lang: Locale } }) {
  const lang = params.lang;
  const dict = getDictionary(lang);
  const t = ANA.text[lang];
  const articles = getArticles(lang);
  const lastUpdate = articles
    .map((a) => a.meta.dateModified ?? a.meta.datePublished)
    .sort()
    .at(-1)!;

  return (
    <PageShell lang={lang} path={ANA.path}>
      <article className="mx-auto max-w-3xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- static export */}
          <img
            src={ANA.image}
            alt={t.photoAlt}
            width={800}
            height={727}
            loading="eager"
            className="h-40 w-40 shrink-0 rounded-3xl border border-clay-100 object-cover"
          />
          <PageHeader eyebrow={t.jobTitle} title={t.h1} />
        </div>

        <TldrBlock label={dict.common.tldrLabel}>{t.tldr}</TldrBlock>

        <section className="prose-emori">
          <h2>{t.bioTitle}</h2>
          {t.bio.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-2xl text-ink-900">{t.focusTitle}</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {t.focus.map((f) => (
              <div key={f.title} className="rounded-2xl border border-clay-100 bg-cream-50 p-6">
                <h3 className="font-serif text-xl text-ink-900">{f.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-700">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="prose-emori mt-12">
          <h2>{t.methodTitle}</h2>
          <p>{t.methodIntro}</p>
          <ul>
            {t.method.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-2xl bg-cream-100 p-6">
          <h2 className="font-serif text-xl text-ink-900">{t.noteTitle}</h2>
          <p className="mt-2 leading-relaxed text-ink-800">{t.note}</p>
        </section>

        <section className="mt-14" aria-labelledby="artigos">
          <h2 id="artigos" className="font-serif text-2xl text-ink-900">
            {t.articlesTitle}
          </h2>
          <ul className="mt-5 divide-y divide-clay-100 rounded-2xl border border-clay-100 bg-cream-50">
            {articles.map((a) => (
              <li key={a.meta.slug}>
                <Link
                  href={localizedPath(lang, `blog/${a.meta.slug}`)}
                  className="block px-5 py-4 hover:bg-cream-100"
                >
                  <span className="font-serif text-lg text-ink-900">{a.meta.title}</span>
                  <span className="mt-1 block text-sm text-ink-700">
                    {a.meta.readingMinutes} {dict.blog.readingTime}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-12 flex flex-col items-start gap-3">
          <CtaButton
            label={dict.cta.tryEmori}
            betaLabel={dict.waitlist.buttonLabel}
            campaign="autora_ana"
          />
          <p className="text-sm text-ink-700">{dict.common.androidNote}</p>
        </div>
      </article>

      <JsonLd
        data={[
          personSchema(ANA, lang),
          profilePageSchema(ANA, lang, lastUpdate),
          itemListSchema(
            articles.map((a) => ({
              name: a.meta.title,
              url: absoluteUrl(localizedPath(lang, `blog/${a.meta.slug}`)),
            })),
          ),
          breadcrumbSchema([
            { name: 'Emori', url: absoluteUrl(localizedPath(lang, '')) },
            { name: ANA.name, url: absoluteUrl(localizedPath(lang, ANA.path)) },
          ]),
        ]}
      />
    </PageShell>
  );
}
