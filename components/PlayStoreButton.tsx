import { PLAY_STORE_URL } from '@/lib/constants';

// Botão CTA principal para a Google Play, com UTM por página.
// `campaign` deve identificar a página de origem (ex.: 'home', 'produto', 'blog_slug').

interface Props {
  label: string;
  campaign: string;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function playStoreHref(campaign: string): string {
  const params = new URLSearchParams({
    utm_source: 'site',
    utm_medium: 'organic',
    utm_campaign: campaign,
  });
  const sep = PLAY_STORE_URL.includes('?') ? '&' : '?';
  return `${PLAY_STORE_URL}${sep}${params.toString()}`;
}

export default function PlayStoreButton({
  label,
  campaign,
  variant = 'primary',
  className = '',
}: Props) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
  const styles =
    variant === 'primary'
      ? 'bg-clay-600 text-cream-50 hover:bg-clay-700 shadow-sm'
      : 'bg-cream-100 text-clay-700 border border-clay-200 hover:bg-cream-200';

  return (
    <a
      href={playStoreHref(campaign)}
      className={`${base} ${styles} ${className}`}
      rel="noopener"
    >
      {/* Ícone Play simples inline para evitar dependências extra no botão principal */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="currentColor"
      >
        <path d="M3.6 2.3c-.2.2-.3.5-.3.9v17.6c0 .4.1.7.3.9l.1.1L13.5 12v-.1L3.7 2.2l-.1.1z" />
        <path d="M17 15.3l-3.3-3.3v-.1L17 8.7l.1.1 3.9 2.2c1.1.6 1.1 1.7 0 2.3L17.1 15.2l-.1.1z" opacity=".9" />
        <path d="M17.1 15.2 13.5 11.9 3.6 21.8c.4.4 1 .4 1.7 0l11.8-6.6" />
        <path d="M17.1 8.7 5.3 2.1c-.7-.4-1.3-.4-1.7 0l9.9 9.8 3.6-3.2z" opacity=".7" />
      </svg>
      {label}
    </a>
  );
}
