'use client';

import { useEffect, useState } from 'react';
import { Moon } from 'lucide-react';
import { CLOSED_BETA } from '@/lib/constants';
import { buildPlayHref } from '@/lib/play';
import { WAITLIST_DIALOG_ID } from './WaitlistDialog';

// CTA principal do site. Em teste fechado (CLOSED_BETA) abre o diálogo de fila de
// espera; caso contrário aponta para a Google Play com UTM por página.
interface Props {
  /** rótulo quando a app está pública (link Play Store) */
  label: string;
  /** rótulo durante o teste fechado (abre a fila de espera) */
  betaLabel: string;
  campaign: string;
  variant?: 'primary' | 'secondary';
  className?: string;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

function styles(variant: 'primary' | 'secondary') {
  return variant === 'primary'
    ? 'bg-clay-600 text-cream-50 hover:bg-clay-700 shadow-sm'
    : 'bg-cream-100 text-clay-700 border border-clay-200 hover:bg-cream-200';
}

export default function CtaButton({
  label,
  betaLabel,
  campaign,
  variant = 'primary',
  className = '',
}: Props) {
  // Link da Play com referrer; no SSR usa o fallback site/organic, e no cliente
  // enriquece com o UTM de entrada (para atribuir instalações ao canal social).
  const [href, setHref] = useState(() => buildPlayHref(campaign));
  useEffect(() => {
    setHref(buildPlayHref(campaign, window.location.search));
  }, [campaign]);

  if (CLOSED_BETA) {
    return (
      <button
        type="button"
        onClick={() => {
          const d = document.getElementById(WAITLIST_DIALOG_ID) as HTMLDialogElement | null;
          d?.showModal();
        }}
        data-cta-campaign={campaign}
        className={`${base} ${styles(variant)} ${className}`}
      >
        <Moon size={18} strokeWidth={2.2} aria-hidden="true" />
        {betaLabel}
      </button>
    );
  }

  // App publicada → badge OFICIAL da Google Play (cores e logótipo oficiais).
  return (
    <a
      href={href}
      rel="noopener"
      aria-label={label}
      className={`inline-block ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static export; asset oficial da Google */}
      <img
        src="/badges/google-play-pt.png"
        alt={label}
        width={646}
        height={250}
        className="h-14 w-auto md:h-[60px]"
      />
    </a>
  );
}
