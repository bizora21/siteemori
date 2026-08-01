'use client';

import { useState } from 'react';
import { Link2, Check, Share2 } from 'lucide-react';

// Partilha do artigo. Usa a partilha nativa do sistema no telemóvel (Web Share API)
// e, em desktop, links diretos + copiar. Cada link leva utm_source próprio para
// medirmos que canal de partilha traz tráfego.
interface Props {
  url: string;
  title: string;
  labels: { share: string; copy: string; copied: string };
}

function withUtm(url: string, source: string): string {
  const u = new URL(url);
  u.searchParams.set('utm_source', source);
  u.searchParams.set('utm_medium', 'share');
  return u.toString();
}

export default function ShareButtons({ url, title, labels }: Props) {
  const [copied, setCopied] = useState(false);

  const targets = [
    {
      name: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${withUtm(url, 'whatsapp')}`)}`,
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(withUtm(url, 'facebook'))}`,
    },
    {
      name: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(withUtm(url, 'twitter'))}`,
    },
    {
      name: 'Pinterest',
      href: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(withUtm(url, 'pinterest'))}&description=${encodeURIComponent(title)}`,
    },
  ];

  async function copy() {
    await navigator.clipboard.writeText(withUtm(url, 'copy'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: withUtm(url, 'native') });
      } catch {
        /* utilizador cancelou */
      }
    }
  }

  return (
    <section className="mt-12 border-t border-clay-100 pt-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="eyebrow text-clay-500">{labels.share}</span>

        {/* Telemóvel: partilha nativa do sistema */}
        <button
          type="button"
          onClick={nativeShare}
          className="inline-flex items-center gap-1.5 rounded-full border border-clay-200 px-4 py-1.5 text-sm text-ink-700 transition-colors hover:border-clay-500 hover:text-clay-700 sm:hidden"
        >
          <Share2 size={15} />
          {labels.share}
        </button>

        {/* Desktop: destinos diretos */}
        <div className="hidden flex-wrap items-center gap-2 sm:flex">
          {targets.map((t) => (
            <a
              key={t.name}
              href={t.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-clay-200 px-4 py-1.5 text-sm text-ink-700 transition-colors hover:border-clay-500 hover:text-clay-700"
            >
              {t.name}
            </a>
          ))}
        </div>

        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-full border border-clay-200 px-4 py-1.5 text-sm text-ink-700 transition-colors hover:border-clay-500 hover:text-clay-700"
        >
          {copied ? <Check size={15} className="text-sage-700" /> : <Link2 size={15} />}
          {copied ? labels.copied : labels.copy}
        </button>
      </div>
    </section>
  );
}
