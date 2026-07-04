import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n';
import { localizedPath } from '@/lib/seo';

interface Props {
  lang: Locale;
  dict: Dictionary;
}

export default function Footer({ lang, dict }: Props) {
  const year = new Date().getFullYear();

  const cols = [
    {
      title: dict.footer.product,
      links: [
        { href: localizedPath(lang, 'produto'), label: dict.nav.produto },
        { href: localizedPath(lang, 'pro'), label: dict.nav.pro },
        { href: localizedPath(lang, 'blog'), label: dict.nav.blog },
      ],
    },
    {
      title: dict.footer.legal,
      links: [
        { href: localizedPath(lang, 'privacidade'), label: dict.nav.privacidade },
        { href: localizedPath(lang, 'termos'), label: dict.nav.termos },
      ],
    },
  ];

  return (
    <footer className="mt-20 border-t border-clay-100 bg-cream-100">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <Link
              href={localizedPath(lang, '')}
              className="font-serif text-xl font-semibold text-clay-700"
            >
              Emori
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-700">
              {dict.footer.description}
            </p>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <h2 className="mb-3 text-sm font-semibold text-ink-900">{col.title}</h2>
              <ul className="space-y-2 text-sm">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-ink-700 hover:text-clay-600">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-clay-100 pt-6 text-sm text-ink-700 md:flex-row md:items-center">
          <p>
            © {year} Emori. {dict.footer.rights}
          </p>
          <p className="italic">{dict.footer.madeWith}</p>
        </div>
      </div>
    </footer>
  );
}
