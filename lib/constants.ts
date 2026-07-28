// Constantes globais do site. Coloca aqui os valores reais antes do deploy.

// URL canónico do site (sem barra final).
export const SITE_URL = 'https://aemori.com';

// Package Android.
export const ANDROID_PACKAGE = 'app.emori';

// >>> COLA AQUI o link real da Google Play quando a app sair de teste fechado.
// Os parâmetros UTM são acrescentados por página em PlayStoreButton.
export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=app.emori';

// >>> COLA AQUI o token do beacon do Cloudflare Web Analytics (privacy-first, sem cookies).
// Deixa vazio para não carregar o script.
export const CLOUDFLARE_ANALYTICS_TOKEN = '';

// Google Analytics 4 (gtag.js). Vazio = não carrega. Nota: usa cookies —
// para visitantes da UE/PT pode ser exigido um aviso de consentimento (LGPD/RGPD).
export const GA_MEASUREMENT_ID = 'G-DBJXCJ0SWG';

// Imagem Open Graph por defeito (1200x630, PNG raster — renderiza em redes sociais
// e é elegível para o Google Discover).
export const DEFAULT_OG_IMAGE = '/og/og-default.png';

// E-mail de contacto (opcional, usado em metadados/estruturados e na fila de espera).
export const CONTACT_EMAIL = 'ola@aemori.com';

// Pessoa por trás da Emori (E-E-A-T: usado no rodapé, na página Sobre e no
// schema Organization.founder). Antonio é psicólogo — sinal de credibilidade forte.
export const FOUNDER = {
  name: 'Antonio Chauque',
  role: 'Psicólogo',
  linkedin: 'https://www.linkedin.com/in/antonio-chauque-1b05531b2',
};

// Redes sociais mostradas no rodapé. Para acrescentar (Instagram, TikTok…),
// adiciona uma entrada aqui — o rodapé mostra automaticamente o ícone.
export const SOCIAL_LINKS: { name: 'LinkedIn' | 'Instagram' | 'TikTok'; href: string }[] = [
  { name: 'LinkedIn', href: FOUNDER.linkedin },
];

// A app já está publicada na Google Play → CTAs apontam para o download real.
// (A antiga flag de teste fechado deixou de fazer sentido.)
export const CLOSED_BETA = false;

// Lista de espera do iOS: a versão para iPhone ainda não saiu. O diálogo
// recolhe e-mails para avisar no lançamento iOS. Formspree recebe o POST JSON.
export const WAITLIST_ENDPOINT = 'https://formspree.io/f/xnjkebbr';

// E-mail de reserva usado quando WAITLIST_ENDPOINT está vazio.
export const WAITLIST_EMAIL = CONTACT_EMAIL;
