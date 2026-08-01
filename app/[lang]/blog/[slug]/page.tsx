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
import CtaButton from '@/components/CtaButton';
import ArticleHeroImage from '@/components/ArticleHeroImage';
import ShareButtons from '@/components/ShareButtons';
import JsonLd from '@/components/JsonLd';
import { articleSchema, breadcrumbSchema } from '@/lib/schema';
import { getAllSlugs, getArticle, getArticles } from '@/content/blog';

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
    ogImage: article.meta.hero?.src ?? article.meta.ogImage,
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
  // Links internos: até 3 outros artigos (reforça SEO e navegação).
  const related = getArticles(lang)
    .filter((a) => a.meta.slug !== meta.slug)
    .slice(0, 3);

  return (
    <PageShell lang={lang} path={`blog/${meta.slug}`}>
      <article className="mx-auto max-w-3xl">
        <Link
          href={localizedPath(lang, 'blog')}
          className="text-sm text-clay-600 hover:text-clay-700"
        >
          ← {dict.blog.backToBlog}
        </Link>

        <h1 className="mt-4 font-serif text-[2.3rem] leading-[1.06] text-ink-900 md:text-5xl">
          {meta.title}
        </h1>
        <p className="mt-3 text-sm text-ink-700">
          {dict.blog.by} <span className="font-medium text-ink-800">{dict.blog.author}</span> ·{' '}
          {dict.blog.publishedOn} {meta.datePublished} · {meta.readingMinutes}{' '}
          {dict.blog.readingTime}
        </p>

        {meta.hero && <ArticleHeroImage hero={meta.hero} />}

        <TldrBlock label={dict.common.tldrLabel}>{meta.tldr}</TldrBlock>

        <Prose>
          <Body />
        </Prose>

        {/* CTA discreto */}
        <div className="mt-12 rounded-2xl bg-cream-100 p-6 text-center">
          <p className="mb-4 text-ink-800">{dict.meta.tagline}</p>
          <CtaButton
            label={dict.cta.tryEmori}
            betaLabel={dict.waitlist.buttonLabel}
            campaign={`blog_${meta.slug.replace(/-/g, '_')}`}
          />
        </div>

        <ShareButtons
          url={url}
          title={meta.title}
          labels={{
            share: dict.blog.share,
            copy: dict.blog.copyLink,
            copied: dict.blog.copied,
          }}
        />

        <FAQ title={dict.common.faqTitle} items={faq} />

        {/* Leia também — links internos */}
        {related.length > 0 && (
          <section className="mt-16" aria-labelledby="related">
            <h2 id="related" className="font-serif text-2xl text-ink-900">
              {dict.blog.related}
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              {related.map((a) => (
                <Link
                  key={a.meta.slug}
                  href={localizedPath(lang, `blog/${a.meta.slug}`)}
                  className="group block overflow-hidden rounded-2xl border border-clay-100 bg-cream-50 transition-colors hover:border-clay-200 hover:bg-cream-100"
                >
                  {a.meta.hero && (
                    // eslint-disable-next-line @next/next/no-img-element -- static export, imagem externa
                    <img
                      src={a.meta.hero.src}
                      alt={a.meta.hero.alt}
                      width={1600}
                      height={900}
                      loading="lazy"
                      className="aspect-[16/9] w-full object-cover"
                    />
                  )}
                  <h3 className="p-4 font-serif text-base leading-snug text-ink-900 group-hover:text-clay-700">
                    {a.meta.title}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}
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
            image: meta.hero?.src ?? meta.ogImage,
            authorName: dict.blog.author,
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
