import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n';
import Header from './Header';
import Footer from './Footer';
import WaitlistDialog from './WaitlistDialog';

// Estrutura comum de página: Header + main + Footer.
// `path` é o caminho sem idioma (ex.: '' | 'produto' | 'blog/slug'),
// usado pelo LangSwitcher para alternar variante mantendo a página.
interface Props {
  lang: Locale;
  path: string;
  children: React.ReactNode;
}

export default function PageShell({ lang, path, children }: Props) {
  const dict = getDictionary(lang);
  return (
    <>
      <Header lang={lang} dict={dict} path={path} />
      <main id="conteudo" className="mx-auto max-w-5xl px-4 py-10 md:py-14">
        {children}
      </main>
      <Footer lang={lang} dict={dict} />
      {/* Diálogo da lista de espera do iOS — aberto pelo IosWaitlistLink */}
      <WaitlistDialog t={dict.waitlist} />
    </>
  );
}
