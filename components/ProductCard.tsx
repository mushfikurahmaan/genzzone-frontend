'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Product, getImageUrl } from '@/lib/api';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const isOutOfStock = product.stock === 0;

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

          {/* Sold Out Badge */}
          {isOutOfStock && (
            <div className="absolute top-4 right-4 bg-black text-white px-3 py-1 rounded text-xs font-bold uppercase">
              Sold Out
            </div>
          )}
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <Link href={`/products/${product.id}`} className="block">
          <div className="text-base font-normal text-black mb-2 line-clamp-2 min-h-[2.5rem] hover:underline">
            {product.name}
          </div>
        </Link>
        
        <div className="space-y-1 mb-2">
          {product.has_offer && product.offer_price ? (
            <>
              <div className="text-xs text-gray-500 line-through font-mono">
                Regular price ৳{parseFloat(product.regular_price).toFixed(0)}.00
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-normal text-black font-mono">
                  ৳{parseFloat(product.offer_price).toFixed(0)}.00
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-normal text-black font-mono">
                ৳{parseFloat(product.regular_price).toFixed(0)}.00
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

