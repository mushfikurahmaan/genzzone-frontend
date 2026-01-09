'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { Product, getImageUrl } from '@/lib/api';

interface ProductCardProps {
  product: Product;
}

// Generate random rating between 2-5 stars
function getRandomRating() {
  const ratings = [2, 2.5, 3, 3.5, 4, 4.5, 5];
  return ratings[Math.floor(Math.random() * ratings.length)];
}

// Generate random sold count
function getRandomSoldCount() {
  return Math.floor(Math.random() * 10000000) + 1000000;
}

export function ProductCard({ product }: ProductCardProps) {
  const isOutOfStock = product.stock === 0;
  const rating = getRandomRating();
  const soldCount = getRandomSoldCount();
  const hasDiscount = product.has_offer && product.offer_price;
  const discountPercent = hasDiscount 
    ? Math.round(((parseFloat(product.regular_price) - parseFloat(product.offer_price!)) / parseFloat(product.regular_price)) * 100)
    : 0;

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-red-500 text-red-500" />);
    }
    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 fill-red-500 text-red-500" style={{ clipPath: 'inset(0 50% 0 0)' }} />);
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }
    return stars;
  };

  return (
    <div className="group bg-white rounded-lg border border-gray-200 overflow-hidden transition-transform hover:scale-105 flex flex-col h-full">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-[4/5] bg-gray-200 overflow-hidden">
          {getImageUrl(product.image) ? (
            <Image
              src={getImageUrl(product.image)!}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
              <span className="text-gray-500 text-sm">No Image</span>
            </div>
          )}

          {/* Discount Badge */}
          {hasDiscount && discountPercent > 0 && (
            <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
              {discountPercent}% OFF
            </div>
          )}

          {/* Sold Out Badge */}
          {isOutOfStock && (
            <div className="absolute top-4 right-4 bg-black text-white px-3 py-1 rounded text-xs font-bold uppercase">
              Sold Out
            </div>
          )}
        </div>
      </Link>

      <div className="p-3 flex flex-col flex-1">
        <Link href={`/products/${product.id}`} className="block">
          <div className="text-sm font-normal text-black mb-1.5 line-clamp-2 min-h-[2.5rem] hover:underline">
            {product.name}
          </div>
        </Link>
        
        {/* Star Rating */}
        <div className="flex items-center gap-0.5 mb-1.5">
          {renderStars(rating)}
        </div>
        
        <div className="space-y-0.5 mb-2">
          {hasDiscount && product.offer_price ? (
            <>
              <div className="text-xs text-gray-500 line-through font-mono">
                {parseFloat(product.regular_price).toFixed(0)}৳
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-normal text-black font-mono">
                  {parseFloat(product.offer_price).toFixed(0)} ৳
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-base font-normal text-black font-mono">
                {parseFloat(product.regular_price).toFixed(0)} ৳
              </span>
            </div>
          )}
        </div>

        <Link
          href={`/order?productId=${product.id}`}
          className={`w-full py-2 px-4 rounded border-2 border-black text-sm font-medium transition-colors block text-center mt-auto ${
            isOutOfStock
              ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed pointer-events-none'
              : 'bg-white text-black hover:bg-black hover:text-white'
          }`}
          onClick={(e) => {
            if (isOutOfStock) {
              e.preventDefault();
            }
          }}
        >
          {isOutOfStock ? 'Sold Out' : 'Order now'}
        </Link>
      </div>
    </div>
  );
}

