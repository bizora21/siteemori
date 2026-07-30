import type { Metadata } from 'next';
import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n';
import { buildMetadata, localizedPath } from '@/lib/seo';
import PageShell from '@/components/PageShell';
import PageHeader from '@/components/PageHeader';
import { getArticles } from '@/content/blog';

export function generateStaticParams() {
  return [{ lang: 'pt-br' }, { lang: 'pt-pt' }];
}

export function generateMetadata({ params }: { params: { lang: Locale } }): Metadata {
  const dict = getDictionary(params.lang);
  return buildMetadata({
    lang: params.lang,
    path: 'blog',
    title: dict.blog.metaTitle,
    description: dict.blog.metaDescription,
  });
}

export default function BlogIndex({ params }: { params: { lang: Locale } }) {
  const lang = params.lang;
  const dict = getDictionary(lang);
  const articles = getArticles(lang);

  return (
    <PageShell lang={lang} path="blog">
      <div className="mx-auto max-w-3xl">
        <PageHeader eyebrow={dict.nav.blog} title={dict.blog.h1} />
        <p className="mt-4 text-lg leading-relaxed text-ink-700">{dict.blog.tldr}</p>

        <div className="mt-10 space-y-5">
          {articles.map((a) => (
            <Link
              key={a.meta.slug}
              href={localizedPath(lang, `blog/${a.meta.slug}`)}
              className="block overflow-hidden rounded-2xl border border-clay-100 bg-cream-50 transition-colors hover:border-clay-200 hover:bg-cream-100"
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
              <div className="p-6">
                <h2 className="font-serif text-xl text-ink-900">{a.meta.title}</h2>
                <p className="mt-2 leading-relaxed text-ink-700">{a.meta.description}</p>
                <p className="mt-3 text-sm text-clay-600">
                  {a.meta.readingMinutes} {dict.blog.readingTime} · {dict.common.readMore} →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
