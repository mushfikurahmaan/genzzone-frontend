'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Product, productApi, getImageUrl } from '@/lib/api';
import { ArrowLeft, Share2, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { ProductCard } from '@/components/ProductCard';

// Image Gallery Component
function ProductImageGallery({ product, onImageChange }: { product: Product; onImageChange?: (index: number) => void }) {
  const images = [
    product.image,
    product.image2,
    product.image3,
    product.image4,
  ].filter(Boolean) as string[];

  const [activeIndex, setActiveIndex] = useState(0);

  const handleImageChange = (index: number) => {
    setActiveIndex(index);
    onImageChange?.(index);
  };

  if (images.length === 0) {
    return (
      <div className="w-full aspect-square bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center rounded-lg">
        <span className="text-gray-500 text-lg">No Image</span>
      </div>
    );
  }

  const handlePrevious = () => {
    const newIndex = activeIndex === 0 ? images.length - 1 : activeIndex - 1;
    handleImageChange(newIndex);
  };

  const handleNext = () => {
    const newIndex = activeIndex === images.length - 1 ? 0 : activeIndex + 1;
    handleImageChange(newIndex);
  };

  return (
    <div className="flex gap-4">
      {/* Thumbnails - Left side on desktop */}
      {images.length > 1 && (
        <div className="hidden md:flex flex-col gap-2 w-20">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => handleImageChange(index)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                activeIndex === index
                  ? 'border-black'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <Image
                src={getImageUrl(img)!}
                alt={`${product.name} thumbnail ${index + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Image */}
      <div className="flex-1 relative">
        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-white">
          <Image
            src={getImageUrl(images[activeIndex])!}
            alt={product.name}
            fill
            className="object-cover"
            unoptimized
          />
          
          {/* Navigation arrows for mobile and when multiple images */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6 text-black" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6 text-black" />
              </button>
            </>
          )}
        </div>

        {/* Mobile thumbnails - Below main image */}
        {images.length > 1 && (
          <div className="flex md:hidden gap-2 mt-3 justify-center">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => handleImageChange(index)}
                className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  activeIndex === index
                    ? 'border-black'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <Image
                  src={getImageUrl(img)!}
                  alt={`${product.name} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </button>
            ))}
          </div>
        )}

        {/* Image counter for mobile */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:hidden bg-black/60 text-white text-sm px-3 py-1 rounded-full">
            {activeIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
}

// Share Button Component
function ShareButton({ product }: { product: Product }) {
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const productUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `Check out ${product.name} on GEN-Z ZONE!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: shareText,
          url: productUrl,
        });
      } catch (err) {
        // User cancelled or share failed
        console.log('Share cancelled');
      }
    } else {
      // Fallback to showing share menu
      setShowShareMenu(!showShareMenu);
    }
  };

  const shareLinks = [
    {
      name: 'Facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'WhatsApp',
      url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + productUrl)}`,
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      name: 'Twitter',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(productUrl)}`,
      color: 'bg-sky-500 hover:bg-sky-600',
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Share product"
      >
        <Share2 className="w-5 h-5" />
        <span className="hidden sm:inline">Share</span>
      </button>

      {/* Share menu dropdown (for desktop without native share) */}
      {showShareMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowShareMenu(false)}
          />
          <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 min-w-[200px]">
            <div className="space-y-2">
              {shareLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block w-full text-center text-white py-2 px-4 rounded-lg text-sm font-medium ${link.color}`}
                  onClick={() => setShowShareMenu(false)}
                >
                  {link.name}
                </a>
              ))}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = parseInt(params.id as string);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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

  useEffect(() => {
    async function fetchAvailableProducts() {
      if (!product) return;
      
      try {
        setLoadingProducts(true);
        // Fetch products from the same category
        const categoryProducts = await productApi.getAll(undefined, product.category_slug || product.category?.slug);
        // Filter out the current product
        const filteredProducts = categoryProducts.filter(p => p.id !== productId);
        setAvailableProducts(filteredProducts);
      } catch (err) {
        console.error('Failed to load available products:', err);
      } finally {
        setLoadingProducts(false);
      }
    }
    if (product) {
      fetchAvailableProducts();
    }
  }, [product, productId]);

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
          {/* Product Image Gallery */}
          <div className="bg-white rounded-lg p-4">
            <ProductImageGallery product={product} onImageChange={setSelectedImageIndex} />
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">
                  {product.name}
                </h1>
                
                {isOutOfStock && (
                  <div className="inline-block bg-black text-white px-3 py-1 rounded text-sm font-bold uppercase mb-4">
                    Sold Out
                  </div>
                )}
              </div>
              
              {/* Share Button */}
              <ShareButton product={product} />
            </div>

            <div className="space-y-2 border-b border-gray-200 pb-6">
              {product.has_offer && product.offer_price ? (
                <>
                  <div className="text-sm text-gray-500 line-through font-mono">
                    Regular price ৳{parseFloat(product.regular_price).toFixed(0)}.00
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-normal text-black font-mono">
                      ৳{parseFloat(product.offer_price).toFixed(0)}.00
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-normal text-black font-mono">
                    ৳{parseFloat(product.regular_price).toFixed(0)}.00
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-black mb-2">Category</h3>
                <p className="text-gray-700 capitalize">
                  {product.category?.parent_name 
                    ? `${product.category.parent_name} - ${product.category.name}` 
                    : product.category?.name || product.category_slug}
                </p>
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
                    router.push(`/order?productId=${product.id}&imageIndex=${selectedImageIndex}`);
                  }
                }}
              >
                {isOutOfStock ? 'Sold Out' : 'Order now'}
              </button>
            </div>
          </div>
        </div>

        {/* Available Products Section */}
        {availableProducts.length > 0 && (
          <div className="mt-16 md:mt-24">
            <h2 className="text-2xl md:text-3xl font-bold text-black text-center mb-8 md:mb-12" style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}>
              You Might Also Like
            </h2>
            {/* Mobile: Horizontal Scroll */}
            <div className="overflow-x-auto pb-4 -mx-4 px-4 lg:hidden">
              <div className="flex gap-4 md:gap-6 min-w-max">
                {availableProducts.map((availableProduct) => (
                  <div key={availableProduct.id} className="w-[180px] md:w-[240px] flex-shrink-0">
                    <ProductCard product={availableProduct} />
                  </div>
                ))}
              </div>
            </div>
            {/* Desktop: Grid with max 4 columns */}
            <div className="hidden lg:grid lg:grid-cols-4 gap-4 md:gap-6">
              {availableProducts.map((availableProduct) => (
                <div key={availableProduct.id}>
                  <ProductCard product={availableProduct} />
                </div>
              ))}
            </div>
          </div>
        )}

        {loadingProducts && availableProducts.length === 0 && (
          <div className="mt-16 md:mt-24 text-center text-gray-600">
            Loading available products...
          </div>
        )}
      </div>
    </div>
  );
}

