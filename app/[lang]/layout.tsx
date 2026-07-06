import type { Metadata, Viewport } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import '../globals.css';
import { locales, bcp47, isLocale, type Locale } from '@/i18n/config';
import { SITE_URL, CLOUDFLARE_ANALYTICS_TOKEN } from '@/lib/constants';
import JsonLd from '@/components/JsonLd';
import { organizationSchema, websiteSchema } from '@/lib/schema';

// Fontes self-hosted no build (zero layout shift, sem chamadas externas em runtime).
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});
const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600'],
  variable: '--font-serif',
});

// Gera as duas variantes estáticas. Qualquer outro idioma → 404 (dynamicParams=false).
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Emori — app de diário emocional com IA que lembra de você',
    template: '%s',
  },
  applicationName: 'Emori',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-512.svg', type: 'image/svg+xml', sizes: 'any' },
    ],
    apple: '/icon-512.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#c0532e',
  colorScheme: 'light',
};

export default function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  const lang: Locale = isLocale(params.lang) ? params.lang : 'pt-br';

  return (
    <html lang={bcp47[lang]} className={`${inter.variable} ${fraunces.variable}`}>
      <body className="font-sans">
        {/* Skip link acessível */}
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-clay-600 focus:px-3 focus:py-2 focus:text-cream-50"
        >
          Ir para o conteúdo
        </a>

        {children}

        {/* JSON-LD global: Organization + WebSite */}
        <JsonLd data={[organizationSchema(), websiteSchema()]} />

        {/* Cloudflare Web Analytics (privacy-first, sem cookies). Só carrega com token. */}
        {CLOUDFLARE_ANALYTICS_TOKEN && (
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={`{"token": "${CLOUDFLARE_ANALYTICS_TOKEN}"}`}
          />
        )}
      </body>
    </html>
  );
}
