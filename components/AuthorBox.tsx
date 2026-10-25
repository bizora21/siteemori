import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Author } from '@/lib/authors';
import { localizedPath } from '@/lib/seo';

// Caixa de autoria no fim do artigo: foto, nome, especialidade e link para o perfil (E-E-A-T).
export default function AuthorBox({ author, lang }: { author: Author; lang: Locale }) {
  const t = author.text[lang];
  const href = localizedPath(lang, author.path);
  return (
    <aside
      aria-label={t.boxTitle}
      className="mt-12 flex gap-4 rounded-2xl border border-clay-100 bg-cream-50 p-5 sm:items-center sm:gap-5 sm:p-6"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static export */}
      <img
        src={author.imageSquare}
        alt={t.photoAlt}
        width={88}
        height={88}
        loading="lazy"
        className="h-[72px] w-[72px] shrink-0 rounded-full object-cover sm:h-[88px] sm:w-[88px]"
      />
      <div>
        <p className="eyebrow">{t.boxTitle}</p>
        <p className="mt-1 font-serif text-xl text-ink-900">
          <Link href={href} rel="author" className="hover:text-clay-700">
            {author.name}
          </Link>
        </p>
        <p className="mt-1 text-sm leading-relaxed text-ink-700">{t.tagline}</p>
        <Link href={href} className="mt-2 inline-block text-sm font-medium text-clay-600 hover:text-clay-700">
          {t.boxCta} →
        </Link>
      </div>
    </aside>
  );
}
