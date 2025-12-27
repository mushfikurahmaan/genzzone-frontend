'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Product, productApi, getImageUrl } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = parseInt(params.id as string);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const data = await productApi.getById(productId);
        setProduct(data);
      } catch (err) {
        setError('Product not found');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-lg text-gray-600">Loading product...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-lg text-red-600 mb-4">{error || 'Product not found'}</div>
        <button
          onClick={() => router.push('/')}
          className="mx-auto block px-6 py-2 border-2 border-black text-black hover:bg-black hover:text-white transition-colors rounded"
        >
          Back to Products
        </button>
      </div>
    );
  }

  const isOutOfStock = product.stock === 0;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-black hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="bg-white rounded-lg overflow-hidden">
            {getImageUrl(product.image) ? (
              <div className="relative w-full aspect-square">
                <Image
                  src={getImageUrl(product.image)!}
                  alt={product.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-full aspect-square bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                <span className="text-gray-500 text-lg">No Image</span>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">
                {product.name}
              </h1>
              
              {isOutOfStock && (
                <div className="inline-block bg-black text-white px-3 py-1 rounded text-sm font-bold uppercase mb-4">
                  Sold Out
                </div>
              )}
            </div>

            <div className="space-y-2 border-b border-gray-200 pb-6">
              {product.has_offer && product.offer_price ? (
                <>
                  <div className="text-sm text-gray-500 line-through font-mono">
                    Regular price Tk {parseFloat(product.regular_price).toFixed(0)}.00 BDT
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-black font-mono">
                      Tk {parseFloat(product.offer_price).toFixed(0)}.00 BDT
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-black font-mono">
                    Tk {parseFloat(product.regular_price).toFixed(0)}.00 BDT
                  </span>
                </div>
              )}
              <div className="text-sm text-gray-500">Unit price / per</div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-black mb-2">Category</h3>
                <p className="text-gray-700 capitalize">{product.category}</p>
              </div>

              <div>
                <h3 className="font-semibold text-black mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Stock:</span>
                <span className={`font-medium font-mono ${isOutOfStock ? 'text-red-600' : 'text-green-600'}`}>
                  {product.stock} {isOutOfStock && '(Out of Stock)'}
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                className="flex-1 py-4 px-6 rounded border-2 border-gray-300 text-base font-medium transition-opacity opacity-30 cursor-not-allowed bg-gray-100 text-gray-400"
                disabled={true}
              >
                Add to Cart
              </button>
              <button
                className={`flex-1 py-4 px-6 rounded border-2 border-black text-base font-medium transition-colors ${
                  isOutOfStock
                    ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                    : 'bg-white text-black hover:bg-black hover:text-white'
                }`}
                disabled={isOutOfStock}
                onClick={() => {
                  if (!isOutOfStock) {
                    router.push(`/order?productId=${product.id}`);
                  }
                }}
              >
                {isOutOfStock ? 'Sold Out' : 'Order now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

