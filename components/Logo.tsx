import { Moon } from 'lucide-react';

// Marca da Emori: lua crescente + wordmark. Usada no Header e Footer.
interface Props {
  className?: string;
  /** tamanho do ícone em px */
  size?: number;
}

export default function Logo({ className = '', size = 22 }: Props) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className="inline-flex items-center justify-center rounded-lg bg-clay-500 text-cream-50"
        style={{ width: size + 12, height: size + 12 }}
        aria-hidden="true"
      >
        <Moon size={size} strokeWidth={2.2} />
      </span>
      <span className="font-serif text-xl font-semibold text-clay-700">Emori</span>
    </span>
  );
}
