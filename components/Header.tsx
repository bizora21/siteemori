import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n';
import { localizedPath } from '@/lib/seo';
import LangSwitcher from './LangSwitcher';
import Logo from './Logo';

interface Props {
  lang: Locale;
  dict: Dictionary;
  /** caminho atual sem idioma, para o LangSwitcher */
  path: string;
}

export default function Header({ lang, dict, path }: Props) {
  const nav = [
    { href: localizedPath(lang, 'produto'), label: dict.nav.produto },
    { href: localizedPath(lang, 'pro'), label: dict.nav.pro },
    { href: localizedPath(lang, 'blog'), label: dict.nav.blog },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-clay-100/70 bg-cream-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href={localizedPath(lang, '')} aria-label="Emori — início">
          <Logo />
        </Link>

        <nav
          aria-label="Principal"
          className="hidden items-center gap-6 text-sm text-ink-700 md:flex"
        >
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-clay-600">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <LangSwitcher current={lang} path={path} langLabel={dict.footer.langLabel} />
        </div>
      </div>

      {/* Nav mobile simples (links sempre no HTML, sem JS) */}
      <nav
        aria-label="Principal (móvel)"
        className="flex items-center justify-center gap-5 border-t border-clay-100/70 px-4 py-2 text-sm text-ink-700 md:hidden"
      >
        {nav.map((item) => (
          <Link key={item.href} href={item.href} className="hover:text-clay-600">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
