'use client';

import { useEffect, useState } from 'react';
import { GA_MEASUREMENT_ID } from '@/lib/constants';
import type { Dictionary } from '@/i18n';

const STORAGE_KEY = 'emori-consent-v1';

// Carrega o gtag.js dinamicamente — só é chamado depois do consentimento.
function loadGoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return;
  if (document.getElementById('ga4-src')) return; // já carregado
  const s = document.createElement('script');
  s.id = 'ga4-src';
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(s);

  const w = window as unknown as { dataLayer: unknown[] };
  w.dataLayer = w.dataLayer || [];
  // Forma canónica do gtag: empurra o próprio objeto `arguments` para o dataLayer.
  function gtag(..._args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments);
  }
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID);
}

export default function ConsentBanner({
  t,
  privacyHref,
}: {
  t: Dictionary['consent'];
  privacyHref: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const choice = localStorage.getItem(STORAGE_KEY);
    if (choice === 'granted') loadGoogleAnalytics();
    else if (choice !== 'denied') setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'granted');
    loadGoogleAnalytics();
    setVisible(false);
  }

  function reject() {
    localStorage.setItem(STORAGE_KEY, 'denied');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label={t.aria}
      className="fixed inset-x-0 bottom-0 z-[9990] p-3 md:p-4"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-clay-200 bg-cream-50 p-4 shadow-[0_18px_50px_-20px_rgba(84,57,27,0.5)] md:flex-row md:items-center md:gap-4 md:p-5">
        <p className="flex-1 text-sm leading-relaxed text-ink-700">
          {t.text}{' '}
          <a
            href={privacyHref}
            className="text-clay-600 underline underline-offset-2 hover:text-clay-700"
          >
            {t.privacy}
          </a>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={reject}
            className="rounded-full border border-clay-200 px-5 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-cream-200"
          >
            {t.reject}
          </button>
          <button
            type="button"
            onClick={accept}
            className="rounded-full bg-clay-600 px-5 py-2 text-sm font-semibold text-cream-50 transition-colors hover:bg-clay-700"
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
