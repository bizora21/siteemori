import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';

export const dynamic = 'force-static';

// Permite explicitamente crawlers de busca tradicional E motores de resposta com IA.
export default function robots(): MetadataRoute.Robots {
  const allowAll = { allow: '/' };
  return {
    rules: [
      // Busca tradicional
      { userAgent: 'Googlebot', ...allowAll },
      { userAgent: 'Bingbot', ...allowAll },
      // Motores de resposta com IA / crawlers de LLM
      { userAgent: 'GPTBot', ...allowAll },
      { userAgent: 'OAI-SearchBot', ...allowAll },
      { userAgent: 'ChatGPT-User', ...allowAll },
      { userAgent: 'ClaudeBot', ...allowAll },
      { userAgent: 'PerplexityBot', ...allowAll },
      { userAgent: 'Google-Extended', ...allowAll },
      // Padrão para os restantes
      { userAgent: '*', allow: '/' },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
