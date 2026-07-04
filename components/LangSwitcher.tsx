import Link from 'next/link';
import { locales, localeLabel, type Locale } from '@/i18n/config';
import { localizedPath } from '@/lib/seo';

// Alterna entre pt-br e pt-pt mantendo a mesma página (path sem idioma).
interface Props {
  current: Locale;
  path: string;
  langLabel: string;
}

export default function LangSwitcher({ current, path, langLabel }: Props) {
  return (
    <div className="flex items-center gap-1 text-sm" aria-label={langLabel}>
      {locales.map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span className="text-clay-200">·</span>}
          {l === current ? (
            <span className="font-semibold text-clay-700" aria-current="true">
              {localeLabel[l]}
            </span>
          ) : (
            <Link
              href={localizedPath(l, path)}
              className="text-ink-700 hover:text-clay-600"
              hrefLang={l}
            >
              {localeLabel[l]}
            </Link>
          )}
        </span>
      ))}
    </div>
  );
}
