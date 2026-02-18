'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface PromoBlock {
  title: string;
  emoji: string;
  image: string;
  href: string;
}

const promotionalBlocks: PromoBlock[] = [
  {
    title: 'New Drops',
    emoji: '🔥',
    image: '/api/placeholder/400/500',
    href: '/products?filter=new',
  },
  {
    title: 'Premium Stone Wash',
    emoji: '✨',
    image: '/api/placeholder/400/500',
    href: '/products?filter=stone-wash',
  },
  {
    title: 'Flash Sale',
    emoji: '⚡',
    image: '/api/placeholder/400/500',
    href: '/products?filter=sale',
  },
];

export function PromotionalBlocks() {
  return (
    <section className="section-alt section-default">
      <div className="container-main">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {promotionalBlocks.map((block, index) => (
            <Link
              key={index}
              href={block.href}
              className="group relative overflow-hidden bg-white rounded-lg transition-transform hover:scale-105"
            >
              <div className="aspect-[4/5] bg-gray-200 relative overflow-hidden">
                <div className="product-card-placeholder w-full h-full">
                  <span className="product-card-placeholder-text">Product Image</span>
                </div>
              </div>
              <div className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-black font-medium text-lg group-hover:gap-4 transition-all">
                  <span>{block.title}</span>
                  <span>{block.emoji}</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

