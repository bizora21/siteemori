import type { ArticleHero } from '@/content/blog/types';

// Imagem de capa do artigo (hotlink Unsplash) com a atribuição exigida pelas
// regras do Unsplash: link para o fotógrafo e para o Unsplash (ambos com utm).
const UNSPLASH_REF = 'https://unsplash.com/?utm_source=aemori&utm_medium=referral';

export default function ArticleHeroImage({ hero }: { hero: ArticleHero }) {
  return (
    <figure className="my-6 overflow-hidden rounded-2xl border border-clay-100 bg-cream-100">
      {/* eslint-disable-next-line @next/next/no-img-element -- static export, imagem externa (Unsplash) */}
      <img
        src={hero.src}
        alt={hero.alt}
        width={1600}
        height={900}
        loading="eager"
        className="aspect-[16/9] w-full object-cover"
      />
      <figcaption className="px-4 py-2 text-xs text-ink-700/80">
        Foto de{' '}
        <a href={hero.creditUrl} rel="noopener nofollow" className="underline hover:text-clay-600">
          {hero.credit}
        </a>{' '}
        no{' '}
        <a href={UNSPLASH_REF} rel="noopener nofollow" className="underline hover:text-clay-600">
          Unsplash
        </a>
        .
      </figcaption>
    </figure>
  );
}
