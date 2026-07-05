'use client';

import { useRef, useState } from 'react';
import { X, Moon } from 'lucide-react';
import { WAITLIST_ENDPOINT, WAITLIST_EMAIL } from '@/lib/constants';
import type { Dictionary } from '@/i18n';

// id partilhado — os CtaButton abrem este diálogo via showModal().
export const WAITLIST_DIALOG_ID = 'waitlist-dialog';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function WaitlistDialog({ t }: { t: Dictionary['waitlist'] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [email, setEmail] = useState('');

  function close() {
    dialogRef.current?.close();
    // reset após fechar para o próximo uso
    setTimeout(() => setStatus('idle'), 200);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    setStatus('submitting');
    try {
      if (WAITLIST_ENDPOINT) {
        const res = await fetch(WAITLIST_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ email, source: 'aemori.com', list: 'waitlist' }),
        });
        if (!res.ok) throw new Error('request failed');
      } else {
        // Sem endpoint configurado: cai para um mailto de reserva.
        const subject = encodeURIComponent('Fila de espera Emori');
        const body = encodeURIComponent(`Quero entrar na fila de espera. Meu e-mail: ${email}`);
        window.location.href = `mailto:${WAITLIST_EMAIL}?subject=${subject}&body=${body}`;
      }
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  return (
    <dialog
      ref={dialogRef}
      id={WAITLIST_DIALOG_ID}
      aria-labelledby="waitlist-title"
      className="w-[min(92vw,30rem)] rounded-3xl border border-clay-100 bg-cream-50 p-0 text-ink-800 shadow-xl backdrop:bg-ink-900/40"
      onClick={(e) => {
        // fecha ao clicar fora do conteúdo (no backdrop)
        if (e.target === dialogRef.current) close();
      }}
    >
      <div className="p-6 md:p-8">
        <button
          type="button"
          onClick={close}
          aria-label={t.close}
          className="absolute right-4 top-4 rounded-full p-1 text-ink-700 hover:bg-cream-200"
        >
          <X size={20} />
        </button>

        {status === 'success' ? (
          <div className="text-center">
            <span className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-clay-500 text-cream-50">
              <Moon size={26} strokeWidth={2.2} />
            </span>
            <h2 className="font-serif text-2xl text-ink-900">{t.successTitle}</h2>
            <p className="mt-2 leading-relaxed text-ink-700">{t.successBody}</p>
            <button
              type="button"
              onClick={close}
              className="mt-6 rounded-full bg-clay-600 px-6 py-2.5 font-semibold text-cream-50 hover:bg-clay-700"
            >
              {t.close}
            </button>
          </div>
        ) : (
          <>
            <span className="inline-block rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold text-sage-700">
              {t.badge}
            </span>
            <h2 id="waitlist-title" className="mt-3 font-serif text-2xl text-ink-900">
              {t.dialogTitle}
            </h2>
            <p className="mt-2 leading-relaxed text-ink-700">{t.dialogIntro}</p>

            <form onSubmit={handleSubmit} className="mt-5">
              <label htmlFor="waitlist-email" className="block text-sm font-medium text-ink-800">
                {t.emailLabel}
              </label>
              <input
                id="waitlist-email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="mt-1.5 w-full rounded-xl border border-clay-200 bg-cream-50 px-4 py-3 text-ink-900 outline-none placeholder:text-ink-700/50 focus:border-clay-500"
              />

              {status === 'error' && (
                <p className="mt-2 text-sm text-clay-700">
                  {t.errorBody}{' '}
                  <a className="underline" href={`mailto:${WAITLIST_EMAIL}`}>
                    {WAITLIST_EMAIL}
                  </a>
                  .
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="mt-4 w-full rounded-full bg-clay-600 px-6 py-3 font-semibold text-cream-50 transition-colors hover:bg-clay-700 disabled:opacity-70"
              >
                {status === 'submitting' ? t.submitting : t.submit}
              </button>
              <p className="mt-3 text-center text-xs text-ink-700/80">{t.privacyNote}</p>
            </form>
          </>
        )}
      </div>
    </dialog>
  );
}
