// Localização por segmento de rota (app/[lang]/...).
// NÃO usamos o i18n nativo do Next porque é incompatível com output:'export'.

export const locales = ['pt-br', 'pt-pt'] as const;
export type Locale = (typeof locales)[number];

// Variante primária. A raiz "/" redireciona para esta (ver public/_redirects)
// e o hreflang x-default aponta para ela.
export const defaultLocale: Locale = 'pt-br';

// Mapeia o segmento de rota para o código BCP-47 usado em <html lang>, og:locale e hreflang.
export const bcp47: Record<Locale, string> = {
  'pt-br': 'pt-BR',
  'pt-pt': 'pt-PT',
};

export const ogLocale: Record<Locale, string> = {
  'pt-br': 'pt_BR',
  'pt-pt': 'pt_PT',
};

export const localeLabel: Record<Locale, string> = {
  'pt-br': 'Brasil',
  'pt-pt': 'Portugal',
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
