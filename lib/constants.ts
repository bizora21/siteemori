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

// Imagem Open Graph por defeito (1200x630). Substitui pelo asset final.
export const DEFAULT_OG_IMAGE = '/og/og-default.png';

// E-mail de contacto (opcional, usado em metadados/estruturados).
export const CONTACT_EMAIL = 'ola@aemori.com';
