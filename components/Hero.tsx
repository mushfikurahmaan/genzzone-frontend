'use client';

import { useEffect, useState } from 'react';
import { heroImageApi, getImageUrl, type HeroImage as HeroImageType } from '@/lib/api';

export function Hero() {
  const [hero, setHero] = useState<HeroImageType | null>(null);

  useEffect(() => {
    heroImageApi.getActive().then(setHero);
  }, []);

  const imageUrl = hero?.image ? getImageUrl(hero.image) : null;

  return (
    <section className="relative w-full overflow-hidden bg-black" aria-label="Hero banner">
      {/* Image defines height — full width, no cropping, no black bars */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Hero banner"
          className="block w-full h-auto"
        />
      ) : (
        <div
          className="w-full min-h-[320px] bg-gradient-to-b from-gray-900 to-black"
          style={{ aspectRatio: '16/9' }}
        />
      )}
    </section>
  );
}


