/** @type {import('next').NextConfig} */

// IMPORTANTE: NÃO usar a opção `i18n` nativa do Next — é incompatível com
// `output: 'export'`. A localização é feita por segmento de rota (app/[lang]/...).
const nextConfig = {
  output: 'export',
  images: {
    // Obrigatório com static export (não há servidor a otimizar imagens).
    unoptimized: true,
  },
  // URLs com barra final → geram /pagina/index.html (melhor para hosting estático).
  trailingSlash: true,
  reactStrictMode: true,
};

export default nextConfig;
