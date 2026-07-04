import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n';
import { buildMetadata, localizedPath, absoluteUrl } from '@/lib/seo';
import PageShell from '@/components/PageShell';
import Prose from '@/components/Prose';
import TldrBlock from '@/components/TldrBlock';
import FAQ from '@/components/FAQ';
import PlayStoreButton from '@/components/PlayStoreButton';
import JsonLd from '@/components/JsonLd';
import { articleSchema, breadcrumbSchema } from '@/lib/schema';
import { getAllSlugs, getArticle } from '@/content/blog';

export const dynamicParams = false;

// Slugs para cada variante (combinados com [lang] pelo Next).
export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({
  params,
}: {
  params: { lang: Locale; slug: string };
}): Metadata {
  const article = getArticle(params.slug, params.lang);
  if (!article) return {};
  return buildMetadata({
    lang: params.lang,
    path: `blog/${params.slug}`,
    title: `${article.meta.title} — Emori`,
    description: article.meta.description,
    type: 'article',
    publishedTime: article.meta.datePublished,
    ogImage: article.meta.ogImage,
  });
}

export default function ArticlePage({
  params,
}: {
  params: { lang: Locale; slug: string };
}) {
  const lang = params.lang;
  const dict = getDictionary(lang);
  const article = getArticle(params.slug, lang);
  if (!article) notFound();

  const { meta, Body, faq } = article;
  const url = absoluteUrl(localizedPath(lang, `blog/${meta.slug}`));

  return (
    <PageShell lang={lang} path={`blog/${meta.slug}`}>
      <article className="mx-auto max-w-3xl">
        <Link
          href={localizedPath(lang, 'blog')}
          className="text-sm text-clay-600 hover:text-clay-700"
        >
          ← {dict.blog.backToBlog}
        </Link>

        <h1 className="mt-4 font-serif text-3xl leading-tight text-ink-900 md:text-4xl">
          {meta.title}
        </h1>
        <p className="mt-3 text-sm text-ink-700">
          {dict.blog.publishedOn} {meta.datePublished} · {meta.readingMinutes}{' '}
          {dict.blog.readingTime}
        </p>

        <TldrBlock label={dict.common.tldrLabel}>{meta.tldr}</TldrBlock>

        <Prose>
          <Body />
        </Prose>

        {/* CTA discreto */}
        <div className="mt-12 rounded-2xl bg-cream-100 p-6 text-center">
          <p className="mb-4 text-ink-800">{dict.meta.tagline}</p>
          <PlayStoreButton
            label={dict.cta.tryEmori}
            campaign={`blog_${meta.slug.replace(/-/g, '_')}`}
          />
        </div>

        <FAQ title={dict.common.faqTitle} items={faq} />
      </article>

      {/* JSON-LD: Article + Breadcrumb (FAQPage é emitido pelo componente FAQ) */}
      <JsonLd
        data={[
          articleSchema({
            lang,
            title: meta.title,
            description: meta.description,
            url,
            datePublished: meta.datePublished,
            dateModified: meta.dateModified,
            image: meta.ogImage,
          }),
          breadcrumbSchema([
            { name: 'Emori', url: absoluteUrl(localizedPath(lang, '')) },
            { name: dict.nav.blog, url: absoluteUrl(localizedPath(lang, 'blog')) },
            { name: meta.title, url },
          ]),
        ]}
      />
    </PageShell>
  );
}
