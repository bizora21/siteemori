import { PLAY_STORE_URL } from './constants';

// Constrói o link da Google Play com o parâmetro `referrer` — o mecanismo que o
// Google Play lê para ATRIBUIÇÃO DE INSTALAÇÕES (via Play Install Referrer API).
//
// Se o visitante chegou por um link social (com utm_source na URL), esse UTM é
// PROPAGADO para o referrer, para conseguires medir instalações por canal
// (não só visitas). Sem UTM de entrada, usa site/organic com a campanha da página.
export function buildPlayHref(campaign: string, search?: string): string {
  const utm = new URLSearchParams();
  const inc = search ? new URLSearchParams(search) : null;

  if (inc && inc.get('utm_source')) {
    utm.set('utm_source', inc.get('utm_source') as string);
    utm.set('utm_medium', inc.get('utm_medium') ?? 'social');
    utm.set('utm_campaign', inc.get('utm_campaign') ?? campaign);
    const content = inc.get('utm_content');
    if (content) utm.set('utm_content', content);
  } else {
    utm.set('utm_source', 'site');
    utm.set('utm_medium', 'organic');
    utm.set('utm_campaign', campaign);
  }

  const sep = PLAY_STORE_URL.includes('?') ? '&' : '?';
  return `${PLAY_STORE_URL}${sep}referrer=${encodeURIComponent(utm.toString())}`;
}
