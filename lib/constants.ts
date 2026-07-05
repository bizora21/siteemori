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

// Imagem Open Graph por defeito (1200x630).
// SVG funciona como placeholder; para melhor suporte em redes sociais, exporta um PNG
// e troca a extensão aqui (ver README › Open Graph).
export const DEFAULT_OG_IMAGE = '/og/og-default.svg';

// E-mail de contacto (opcional, usado em metadados/estruturados e na fila de espera).
export const CONTACT_EMAIL = 'ola@aemori.com';

// --- Fase de teste fechado (closed beta) --------------------------------------
// Enquanto TRUE, todos os CTAs abrem o diálogo de fila de espera em vez de
// apontarem para a Google Play. Muda para FALSE quando a app for pública.
export const CLOSED_BETA = true;

// >>> COLA AQUI o endpoint que recebe os e-mails da fila de espera (POST).
// Ex.: Formspree (https://formspree.io/f/xxxx), Tally, Google Forms (formResponse),
// ou um Worker teu. Se ficar vazio, o botão de envio cai para um mailto de reserva.
export const WAITLIST_ENDPOINT = '';

// E-mail de reserva usado quando WAITLIST_ENDPOINT está vazio.
export const WAITLIST_EMAIL = CONTACT_EMAIL;
