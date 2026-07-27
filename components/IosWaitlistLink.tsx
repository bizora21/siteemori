'use client';

import { WAITLIST_DIALOG_ID } from './WaitlistDialog';

// Link discreto que abre a lista de espera do iOS (a app já está no Android).
export default function IosWaitlistLink({
  label,
  className = '',
}: {
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        const d = document.getElementById(WAITLIST_DIALOG_ID) as HTMLDialogElement | null;
        d?.showModal();
      }}
      className={`text-sm text-clay-600 underline underline-offset-2 hover:text-clay-700 ${className}`}
    >
      {label}
    </button>
  );
}
