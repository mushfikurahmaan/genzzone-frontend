'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Product, ProductColor, productApi, getImageUrl } from '@/lib/api';
import { ChevronLeft, ChevronRight, Heart, ChevronDown, ChevronUp, Eye, X } from 'lucide-react';
import Image from 'next/image';
import { ProductCard } from '@/components/ProductCard';

// Image Preview Modal Component
function ImagePreviewModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  altText 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  imageUrl: string; 
  altText: string;
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
        aria-label="Close preview"
      >
        <X className="w-6 h-6 text-white" />
      </button>
      
      {/* Image container */}
      <div 
        className="relative max-w-[90vw] max-h-[90vh] animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={imageUrl}
          alt={altText}
          width={800}
          height={1000}
          className="object-contain max-h-[90vh] w-auto"
          unoptimized
        />
      </div>
    </div>
  );
}

// Color Selector Component
function ColorSelector({ 
  colors, 
  selectedColor, 
  onColorSelect 
}: { 
  colors: ProductColor[]; 
  selectedColor: ProductColor | null;
  onColorSelect: (color: ProductColor) => void;
}) {
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggered = useRef(false);
  const activeColors = colors.filter(c => c.is_active).sort((a, b) => a.order - b.order);
  
  if (activeColors.length === 0) return null;

  const handlePreviewClick = (e: React.MouseEvent, color: ProductColor) => {
    e.stopPropagation();
    setPreviewImage({ url: getImageUrl(color.image)!, name: color.name });
  };

  const handleTouchStart = (color: ProductColor) => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setPreviewImage({ url: getImageUrl(color.image)!, name: color.name });
    }, 1000);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleColorClick = (color: ProductColor) => {
    // Only select color if long press wasn't triggered
    if (!longPressTriggered.current) {
      onColorSelect(color);
    }
    longPressTriggered.current = false;
  };

  return (
    <>
      <div className="mb-5">
        <p className="text-sm font-medium text-gray-700 mb-2">
          <span className="uppercase tracking-wider">Colour:</span>{' '}
          <span className="uppercase">{selectedColor?.name || activeColors[0]?.name}</span>
        </p>
        <div className="flex gap-2 flex-wrap">
          {activeColors.map((color) => (
            <div key={color.id} className="relative group">
              <button
                onClick={() => handleColorClick(color)}
                onTouchStart={() => handleTouchStart(color)}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                className={`relative w-16 h-20 overflow-hidden transition-all select-none ${
                  (selectedColor?.id || activeColors[0]?.id) === color.id
                    ? 'ring-2 ring-black ring-offset-1'
                    : 'border border-gray-200 hover:border-gray-400'
                }`}
                aria-label={`Select ${color.name} color. Long press to preview.`}
              >
                <Image
                  src={getImageUrl(color.image)!}
                  alt={color.name}
                  fill
                  className="object-cover pointer-events-none"
                  unoptimized
                />
              </button>
              {/* Eye icon overlay - hidden on touch devices */}
              <button
                onClick={(e) => handlePreviewClick(e, color)}
                className="absolute top-1 right-1 w-6 h-6 bg-white/90 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm hidden md:flex"
                aria-label={`View ${color.name} full image`}
              >
                <Eye className="w-3.5 h-3.5 text-gray-700" />
              </button>
            </div>
          ))}
        </div>
        {/* Mobile hint */}
        <p className="text-xs text-gray-400 mt-2 md:hidden">Long press to preview image</p>
      </div>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage?.url || ''}
        altText={previewImage?.name || ''}
      />
    </>
  );
}

// Image Gallery Component - ASOS Style
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

  const isLowStock = product.stock > 0 && product.stock <= 5;

  if (images.length === 0) {
    return (
      <div className="w-full aspect-[3/4] bg-gray-100 flex items-center justify-center">
        <span className="text-gray-400 text-lg">No Image</span>
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
    <div className="flex gap-3">
      {/* Thumbnails - Left side */}
      {images.length > 1 && (
        <div className="hidden md:flex flex-col gap-2 w-16 flex-shrink-0">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => handleImageChange(index)}
              className={`relative aspect-[3/4] overflow-hidden transition-all ${
                activeIndex === index
                  ? 'ring-2 ring-black'
                  : 'hover:opacity-75'
              }`}
            >
              <Image
                src={getImageUrl(img)!}
                alt={`View ${index + 1}`}
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
        <div className="relative w-full aspect-[3/4] bg-gray-50 overflow-hidden">
          <Image
            src={getImageUrl(images[activeIndex])!}
            alt={product.name}
            fill
            className="object-cover"
            unoptimized
            priority
          />
          
          {/* SELLING FAST Badge */}
          {isLowStock && (
            <div className="absolute bottom-4 right-4 bg-black/80 text-white text-xs font-semibold px-3 py-1.5 tracking-wide">
              SELLING FAST
            </div>
          )}

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center shadow-lg transition-all"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center shadow-lg transition-all"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </>
          )}
        </div>

        {/* Mobile thumbnails - Image style like reference */}
        {images.length > 1 && (
          <div className="flex md:hidden gap-2 mt-3 justify-center px-4">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => handleImageChange(index)}
                className={`relative w-16 h-16 overflow-hidden flex-shrink-0 transition-all ${
                  activeIndex === index
                    ? 'ring-2 ring-black ring-offset-1'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={getImageUrl(img)!}
                  alt={`View ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
                {/* Image counter overlay on active thumbnail */}
                {activeIndex === index && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {index + 1}/{images.length}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Collapsible Section Component
function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-sm tracking-wide">{title}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="pb-4 text-sm text-gray-600 leading-relaxed">
          {children}
        </div>
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
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);

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
        const categoryProducts = await productApi.getAll(undefined, product.category_slug || product.category?.slug);
        const filteredProducts = categoryProducts.filter(p => p.id !== productId);
        setAvailableProducts(filteredProducts.slice(0, 8));
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">{error || 'Product not found'}</p>
        <button
          onClick={() => router.push('/products')}
          className="text-sm underline hover:no-underline"
        >
          Continue shopping
        </button>
      </div>
    );
  }

  const isOutOfStock = product.stock === 0;
  const hasOffer = product.has_offer && product.offer_price;
  const regularPrice = parseFloat(product.regular_price);
  const offerPrice = product.offer_price ? parseFloat(product.offer_price) : null;
  const discountPercentage = hasOffer && offerPrice ? Math.round((1 - offerPrice / regularPrice) * 100) : 0;

  const handleOrder = () => {
    if (!isOutOfStock) {
      router.push(`/order?productId=${product.id}`);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 mb-6 flex items-center gap-2">
          <button onClick={() => router.push('/')} className="hover:text-black transition-colors">
            Home
          </button>
          <span>/</span>
          <button onClick={() => router.push('/products')} className="hover:text-black transition-colors">
            Products
          </button>
          <span>/</span>
          <span className="text-gray-400 truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image Gallery */}
          <div>
            <ProductImageGallery product={product} onImageChange={setSelectedImageIndex} />
          </div>

          {/* Product Info */}
          <div className="lg:max-w-md">
            {/* Brand/Category */}
            <p className="text-sm text-gray-500 mb-1 uppercase tracking-wider">
              {product.category?.parent_name || product.category?.name || 'GEN-Z ZONE'}
            </p>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4 leading-tight">
              {product.name}
            </h1>

            {/* Price */}
            <div className="mb-4">
              {hasOffer ? (
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-lg font-bold text-pink-600">
                    Now ৳{offerPrice?.toFixed(0)}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    Was ৳{regularPrice.toFixed(0)}
                  </span>
                  <span className="text-sm font-medium text-pink-600">
                    (-{discountPercentage}%)
                  </span>
                </div>
              ) : (
                <span className="text-lg font-bold text-gray-900">
                  ৳{regularPrice.toFixed(0)}
                </span>
              )}
            </div>

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <ColorSelector
                colors={product.colors}
                selectedColor={selectedColor}
                onColorSelect={setSelectedColor}
              />
            )}

            {/* Add to Bag / Order Button */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleOrder}
                disabled={isOutOfStock}
                className={`flex-1 py-4 text-sm font-bold tracking-wide transition-all ${
                  isOutOfStock
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#018849] hover:bg-[#016d3a] text-white'
                }`}
              >
                {isOutOfStock ? 'OUT OF STOCK' : 'ORDER NOW'}
              </button>
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`w-14 flex items-center justify-center border transition-all ${
                  isWishlisted 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart 
                  className={`w-5 h-5 transition-colors ${
                    isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'
                  }`} 
                />
              </button>
            </div>

            {/* Stock Status */}
            {product.stock > 0 && product.stock <= 10 && (
              <p className="text-sm text-orange-600 mb-4">
                Only {product.stock} left in stock - order soon
              </p>
            )}

            {/* Collapsible Sections */}
            <div className="border-b border-gray-200">
              <CollapsibleSection title="PRODUCT DETAILS" defaultOpen={true}>
                <p className="mb-3">{product.description}</p>
                <ul className="space-y-1.5 text-gray-600">
                  <li>• Category: {product.category?.name || product.category_slug}</li>
                  {product.category?.parent_name && (
                    <li>• Type: {product.category.parent_name}</li>
                  )}
                </ul>
              </CollapsibleSection>

              <CollapsibleSection title="CARE INSTRUCTIONS">
                <ul className="space-y-1.5">
                  <li>• Machine wash at 30°C</li>
                  <li>• Do not tumble dry</li>
                  <li>• Iron on low heat</li>
                </ul>
              </CollapsibleSection>
            </div>

          </div>
        </div>

        {/* You Might Also Like */}
        {availableProducts.length > 0 && (
          <div className="mt-16 lg:mt-24">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8" style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}>
              You Might Also Like
            </h2>
            
            {/* Mobile: Horizontal Scroll */}
            <div className="overflow-x-auto pb-4 -mx-4 px-4 lg:hidden">
              <div className="flex gap-4 min-w-max">
                {availableProducts.map((availableProduct) => (
                  <div key={availableProduct.id} className="w-[160px] flex-shrink-0">
                    <ProductCard product={availableProduct} />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Desktop: Grid */}
            <div className="hidden lg:grid lg:grid-cols-4 gap-6">
              {availableProducts.slice(0, 4).map((availableProduct) => (
                <ProductCard key={availableProduct.id} product={availableProduct} />
              ))}
            </div>
          </div>
        )}

        {loadingProducts && availableProducts.length === 0 && (
          <div className="mt-16 flex justify-center">
            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
