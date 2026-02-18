"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Product,
  ProductColor,
  getImageUrl,
} from "@/lib/api";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ChevronDown,
  ChevronUp,
  Eye,
  X,
} from "lucide-react";
import Image from "next/image";
import { ProductCard } from "@/components/ProductCard";
import clsx from "clsx";

function ImagePreviewModal({
  isOpen,
  onClose,
  imageUrl,
  altText,
}: {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText: string;
}) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
        aria-label="Close preview"
      >
        <X className="h-6 w-6 text-white" />
      </button>
      <div
        className="relative max-h-[90vh] max-w-[90vw] animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={imageUrl}
          alt={altText}
          width={800}
          height={1000}
          className="h-auto max-h-[90vh] w-auto object-contain"
          unoptimized
        />
      </div>
    </div>
  );
}

function ColorSelector({
  colors,
  selectedColor,
  onColorSelect,
}: {
  colors: ProductColor[];
  selectedColor: ProductColor | null;
  onColorSelect: (color: ProductColor) => void;
}) {
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggered = useRef(false);
  const activeColors = colors
    .filter((c) => c.is_active)
    .sort((a, b) => a.order - b.order);

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
    if (!longPressTriggered.current) onColorSelect(color);
    longPressTriggered.current = false;
  };

  return (
    <>
      <div className="mb-5">
        <p className="mb-2 text-sm font-medium text-gray-700">
          <span className="tracking-wider uppercase">Colour:</span>{" "}
          <span className="uppercase">
            {selectedColor?.name || activeColors[0]?.name}
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {activeColors.map((color) => (
            <div key={color.id} className="relative group">
              <button
                onClick={() => handleColorClick(color)}
                onTouchStart={() => handleTouchStart(color)}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                className={clsx(
                  "relative h-20 w-16 select-none overflow-hidden transition-all",
                  (selectedColor?.id || activeColors[0]?.id) === color.id
                    ? "ring-2 ring-black ring-offset-1"
                    : "border border-gray-200 hover:border-gray-400"
                )}
                aria-label={`Select ${color.name} color. Long press to preview.`}
              >
                <Image
                  src={getImageUrl(color.image)!}
                  alt={color.name}
                  fill
                  className="pointer-events-none object-cover"
                  unoptimized
                />
              </button>
              <button
                onClick={(e) => handlePreviewClick(e, color)}
                className="absolute top-1 right-1 flex hidden h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow-sm opacity-0 transition-opacity hover:bg-white group-hover:opacity-100 md:flex"
                aria-label={`View ${color.name} full image`}
              >
                <Eye className="h-3.5 w-3.5 text-gray-700" />
              </button>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-400 md:hidden">
          Long press to preview image
        </p>
      </div>
      <ImagePreviewModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage?.url || ""}
        altText={previewImage?.name || ""}
      />
    </>
  );
}

function ProductImageGallery({
  product,
  selectedColor,
  onImageChange,
}: {
  product: Product;
  selectedColor?: ProductColor | null;
  onImageChange?: (index: number) => void;
}) {
  const baseImages = [
    product.image,
    product.image2,
    product.image3,
    product.image4,
  ].filter(Boolean) as string[];

  const images = selectedColor?.image
    ? [
        selectedColor.image,
        ...baseImages.filter((img) => img !== selectedColor.image),
      ]
    : baseImages;

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (selectedColor?.image) setActiveIndex(0);
  }, [selectedColor?.image]);

  const handleImageChange = (index: number) => {
    setActiveIndex(index);
    onImageChange?.(index);
  };

  const isLowStock = product.stock > 0 && product.stock <= 5;

  if (images.length === 0) {
    return (
      <div className="flex aspect-[3/4] w-full items-center justify-center bg-gray-100">
        <span className="text-lg text-gray-400">No Image</span>
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
      {images.length > 1 && (
        <div className="hidden w-16 flex-shrink-0 flex-col gap-2 md:flex">
          {images.map((img, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleImageChange(index)}
              className={clsx(
                "relative aspect-[3/4] overflow-hidden transition-all",
                activeIndex === index ? "ring-2 ring-black" : "hover:opacity-75"
              )}
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
      <div className="relative flex-1">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-50">
          <Image
            src={getImageUrl(images[activeIndex])!}
            alt={product.name}
            fill
            className="object-cover"
            unoptimized
            priority
          />
          {isLowStock && (
            <div className="badge-selling-fast">SELLING FAST</div>
          )}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevious}
                className="image-gallery-nav-btn left-3"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5 text-gray-700" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="image-gallery-nav-btn right-3"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5 text-gray-700" />
              </button>
            </>
          )}
        </div>
        {images.length > 1 && (
          <div className="-mx-4 mt-3 flex justify-center gap-2 px-4 md:hidden">
            {images.map((img, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleImageChange(index)}
                className={clsx(
                  "relative h-16 w-16 flex-shrink-0 overflow-hidden transition-all",
                  activeIndex === index
                    ? "ring-2 ring-black ring-offset-1"
                    : "opacity-70 hover:opacity-100"
                )}
              >
                <Image
                  src={getImageUrl(img)!}
                  alt={`View ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
                {activeIndex === index && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-xs font-semibold text-white">
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

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-gray-200">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="collapsible-trigger"
      >
        <span className="text-sm font-semibold tracking-wide">{title}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="pb-4 text-sm leading-relaxed text-gray-600">
          {children}
        </div>
      )}
    </div>
  );
}

interface ProductDetailClientProps {
  product: Product;
  availableProducts: Product[];
}

export function ProductDetailClient({
  product,
  availableProducts,
}: ProductDetailClientProps) {
  const router = useRouter();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);

  const activeColors = product.colors
    ?.filter((c) => c.is_active)
    .sort((a, b) => a.order - b.order);
  useEffect(() => {
    if (activeColors?.length && !selectedColor) {
      setSelectedColor(activeColors[0]);
    }
  }, [activeColors, selectedColor]);

  const isOutOfStock = product.stock === 0;
  const hasOffer = product.has_offer && product.offer_price;
  const regularPrice = parseFloat(product.regular_price);
  const offerPrice = product.offer_price
    ? parseFloat(product.offer_price)
    : null;
  const discountPercentage =
    hasOffer && offerPrice
      ? Math.round((1 - offerPrice / regularPrice) * 100)
      : 0;

  const handleOrder = () => {
    if (!isOutOfStock) {
      const params = new URLSearchParams({
        productId: product.id.toString(),
      });
      if (selectedColor) {
        params.append("colorId", selectedColor.id.toString());
      }
      router.push(`/order?${params.toString()}`);
    }
  };

  return (
    <div className="detail-page">
      <div className="container-main py-6 max-w-7xl mx-auto">
        <nav className="detail-breadcrumb">
          <Link href="/" className="detail-breadcrumb-link">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="detail-breadcrumb-link">
            Products
          </Link>
          <span>/</span>
          <span className="max-w-[200px] truncate text-gray-400">
            {product.name}
          </span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <ProductImageGallery
              product={product}
              selectedColor={selectedColor}
              onImageChange={setSelectedImageIndex}
            />
          </div>

          <div className="lg:max-w-md">
            <p className="mb-1 text-sm uppercase tracking-wider text-gray-500">
              {product.category?.parent_name ||
                product.category?.name ||
                "GEN-Z ZONE"}
            </p>
            <h1 className="mb-4 text-2xl font-semibold leading-tight text-gray-900 md:text-3xl">
              {product.name}
            </h1>

            <div className="mb-4">
              {hasOffer ? (
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-lg font-bold text-brand">
                    Now ৳{offerPrice?.toFixed(0)}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    Was ৳{regularPrice.toFixed(0)}
                  </span>
                  <span className="text-sm font-medium text-brand">
                    (-{discountPercentage}%)
                  </span>
                </div>
              ) : (
                <span className="text-lg font-bold text-gray-900">
                  ৳{regularPrice.toFixed(0)}
                </span>
              )}
            </div>

            {product.colors && product.colors.length > 0 && (
              <ColorSelector
                colors={product.colors}
                selectedColor={selectedColor}
                onColorSelect={setSelectedColor}
              />
            )}

            <div className="mb-6 flex gap-3">
              <button
                type="button"
                onClick={handleOrder}
                disabled={isOutOfStock}
                className="btn-order-now"
              >
                {isOutOfStock ? "OUT OF STOCK" : "ORDER NOW"}
              </button>
              <button
                type="button"
                onClick={() => setIsWishlisted(!isWishlisted)}
                disabled
                className="btn-wishlist opacity-50 cursor-not-allowed"
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart className="h-5 w-5 transition-colors text-gray-600" />
              </button>
            </div>

            {product.stock > 0 && product.stock <= 10 && (
              <p className="mb-4 text-sm text-orange-600">
                Only {product.stock} left in stock - order soon
              </p>
            )}

            <div className="border-b border-gray-200">
              <CollapsibleSection title="PRODUCT DETAILS" defaultOpen>
                <p className="mb-3">{product.description}</p>
                <ul className="space-y-1.5 text-gray-600">
                  <li>
                    • Category:{" "}
                    {product.category?.name || product.category_slug}
                  </li>
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

        {availableProducts.length > 0 && (
          <div className="mt-16 lg:mt-24">
            <h2 className="section-title mb-8 text-center font-heading">
              You Might Also Like
            </h2>
            <div className="-mx-4 overflow-x-auto pb-4 px-4 lg:hidden">
              <div className="flex min-w-max gap-4">
                {availableProducts.map((p) => (
                  <div key={p.id} className="w-[160px] flex-shrink-0">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden lg:grid lg:grid-cols-4 lg:gap-6">
              {availableProducts.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
