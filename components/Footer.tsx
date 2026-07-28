import Link from 'next/link';
import { Linkedin, Instagram, Music2 } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n';
import { localizedPath } from '@/lib/seo';
import { CONTACT_EMAIL, SOCIAL_LINKS, FOUNDER } from '@/lib/constants';
import Logo from './Logo';

const SOCIAL_ICON = { LinkedIn: Linkedin, Instagram, TikTok: Music2 } as const;

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
      title: dict.footer.company,
      links: [
        { href: localizedPath(lang, 'sobre'), label: dict.nav.sobre },
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
            <Link href={localizedPath(lang, '')} aria-label="Emori — início">
              <Logo />
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-700">
              {dict.footer.description}
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-3 inline-block text-sm text-clay-600 hover:text-clay-700"
            >
              {CONTACT_EMAIL}
            </a>
            <p className="mt-3 text-xs text-ink-700/70">a Emori · aemori.com</p>

            {SOCIAL_LINKS.length > 0 && (
              <div className="mt-4 flex items-center gap-2">
                {SOCIAL_LINKS.map((s) => {
                  const Icon = SOCIAL_ICON[s.name];
                  return (
                    <a
                      key={s.name}
                      href={s.href}
                      target="_blank"
                      rel="noopener"
                      aria-label={s.name}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-clay-200 text-ink-700 transition-colors hover:bg-cream-200 hover:text-clay-600"
                    >
                      <Icon size={18} />
                    </a>
                  );
                })}
              </div>
            )}
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
          <p className="italic">
            {dict.footer.madeWith}{' '}
            <a
              href={FOUNDER.linkedin}
              target="_blank"
              rel="noopener"
              className="not-italic text-clay-600 hover:text-clay-700"
            >
              por {FOUNDER.name}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
