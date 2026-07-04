import type { Config } from 'tailwindcss';

// Paleta terrosa quente — íntima e humana. "A Emori conhece-te."
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './content/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Fundo creme quente
        cream: {
          50: '#fdfbf7',
          100: '#faf5ec',
          200: '#f3e8d6',
        },
        // Terracota / âmbar (acento principal, CTAs)
        clay: {
          50: '#fbf1ec',
          100: '#f6ddd0',
          200: '#eab99f',
          300: '#dd9470',
          400: '#cf7449',
          500: '#c05a2e',
          600: '#a2481f', // acento principal
          700: '#84391b',
          800: '#6b301a',
          900: '#582a1a',
        },
        // Tom de texto quente (não preto puro)
        ink: {
          700: '#4a3f38',
          800: '#38302b',
          900: '#2a2420',
        },
        // Verde salvia suave (acento secundário)
        sage: {
          100: '#e9efe6',
          300: '#b4c6ab',
          500: '#7d9a6f',
          700: '#556b49',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'ui-serif', 'Georgia', 'serif'],
      },
      maxWidth: {
        prose: '68ch',
      },
      typography: {},
    },
  },
  plugins: [],
};

export default config;
