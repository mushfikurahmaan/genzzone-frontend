"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { StorefrontProductDetail, StorefrontProductList } from "@/types/akkho";
import { getImageUrl } from "@/lib/api";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import Image from "next/image";
import { ProductCard } from "@/components/ProductCard";
import clsx from "clsx";
import {
  defaultVariantSelection,
  findVariantForSelection,
  matrixAttributeSlugs,
  requiresVariant,
} from "@/lib/variants";

function parsePrice(s: string): number {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

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
  product: StorefrontProductDetail;
  relatedProducts: StorefrontProductList[];
}

export function ProductDetailClient({
  product,
  relatedProducts,
}: ProductDetailClientProps) {
  const router = useRouter();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selection, setSelection] = useState<Record<string, string>>(() =>
    defaultVariantSelection(product)
  );

  useEffect(() => {
    setSelection(defaultVariantSelection(product));
  }, [product.public_id]);

  const selectedVariant = useMemo(
    () => findVariantForSelection(product, selection),
    [product, selection]
  );

  const imageList = useMemo(() => {
    const sorted = [...(product.images ?? [])].sort(
      (a, b) => a.order - b.order
    );
    const urls = sorted
      .map((i) => i.image_url)
      .filter(Boolean) as string[];
    if (urls.length === 0 && product.image_url) {
      return [product.image_url];
    }
    return urls;
  }, [product]);

  const displayPrice = selectedVariant
    ? parsePrice(selectedVariant.price)
    : parsePrice(product.price);
  const original = product.original_price
    ? parsePrice(product.original_price)
    : null;
  const hasDiscount =
    original != null && original > displayPrice && original > 0;
  const discountPercentage =
    hasDiscount && original
      ? Math.round((1 - displayPrice / original) * 100)
      : 0;

  const stockStatus = selectedVariant
    ? selectedVariant.stock_status
    : product.stock_status;
  const availableQty = selectedVariant
    ? selectedVariant.available_quantity
    : product.available_quantity;
  const isOutOfStock = stockStatus === "out_of_stock";
  const isLowStock =
    !isOutOfStock && (stockStatus === "low" || availableQty <= 5);

  const variantReady =
    !requiresVariant(product) ||
    (selectedVariant != null &&
      matrixAttributeSlugs(product).every((s) => selection[s]));

  const matrix = product.variant_matrix;
  const matrixEntries = matrix
    ? Object.values(matrix).sort((a, b) => a.slug.localeCompare(b.slug))
    : [];

  const handleOrder = () => {
    if (isOutOfStock || !variantReady) return;
    const params = new URLSearchParams({
      product: product.slug,
    });
    if (selectedVariant) {
      params.set("variant", selectedVariant.public_id);
    }
    router.push(`/order?${params.toString()}`);
  };

  const breadcrumbItems = product.breadcrumbs?.length
    ? product.breadcrumbs
    : ["Home", product.category_name || "Products", product.name];

  return (
    <div className="detail-page">
      <div className="container-main py-6 max-w-7xl mx-auto">
        <nav className="detail-breadcrumb">
          {breadcrumbItems.map((label, i) => (
            <span key={`${i}-${label}`} className="inline-flex items-center gap-1">
              {i > 0 && <span>/</span>}
              {i === 0 ? (
                <Link href="/" className="detail-breadcrumb-link">
                  {label}
                </Link>
              ) : i < breadcrumbItems.length - 1 ? (
                <Link href="/products" className="detail-breadcrumb-link">
                  {label}
                </Link>
              ) : (
                <span className="max-w-[200px] truncate text-gray-400">
                  {label}
                </span>
              )}
            </span>
          ))}
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            {imageList.length === 0 ? (
              <div className="flex aspect-[3/4] w-full items-center justify-center bg-gray-100">
                <span className="text-lg text-gray-400">No Image</span>
              </div>
            ) : (
              <div className="flex gap-3">
                {imageList.length > 1 && (
                  <div className="hidden w-16 flex-shrink-0 flex-col gap-2 md:flex">
                    {imageList.map((img, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedImageIndex(index)}
                        className={clsx(
                          "relative aspect-[3/4] overflow-hidden transition-all",
                          selectedImageIndex === index
                            ? "ring-2 ring-black"
                            : "hover:opacity-75"
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
                    <button
                      type="button"
                      className="relative block h-full w-full"
                      onClick={() =>
                        setPreviewUrl(getImageUrl(imageList[selectedImageIndex])!)
                      }
                    >
                      <Image
                        src={getImageUrl(imageList[selectedImageIndex])!}
                        alt={product.name}
                        fill
                        className="object-cover"
                        unoptimized
                        priority
                      />
                    </button>
                    {isLowStock && (
                      <div className="badge-selling-fast">SELLING FAST</div>
                    )}
                    {imageList.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedImageIndex((i) =>
                              i === 0 ? imageList.length - 1 : i - 1
                            )
                          }
                          className="image-gallery-nav-btn left-3"
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="h-5 w-5 text-gray-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedImageIndex((i) =>
                              i === imageList.length - 1 ? 0 : i + 1
                            )
                          }
                          className="image-gallery-nav-btn right-3"
                          aria-label="Next image"
                        >
                          <ChevronRight className="h-5 w-5 text-gray-700" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:max-w-md">
            <p className="mb-1 text-sm uppercase tracking-wider text-gray-500">
              {product.category_name || "GEN-Z ZONE"}
            </p>
            <h1 className="mb-4 text-2xl font-semibold leading-tight text-gray-900 md:text-3xl">
              {product.name}
            </h1>

            <div className="mb-4">
              {hasDiscount ? (
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-lg font-bold text-brand">
                    Now ৳{displayPrice.toFixed(0)}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    Was ৳{original!.toFixed(0)}
                  </span>
                  <span className="text-sm font-medium text-brand">
                    (-{discountPercentage}%)
                  </span>
                </div>
              ) : (
                <span className="text-lg font-bold text-gray-900">
                  ৳{displayPrice.toFixed(0)}
                </span>
              )}
            </div>

            {matrixEntries.length > 0 && (
              <div className="mb-6 space-y-4">
                {matrixEntries.map((attr) => (
                  <div key={attr.slug}>
                    <p className="mb-2 text-sm font-medium text-gray-700">
                      {attr.attribute_name}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {attr.values.map((v) => {
                        const active = selection[attr.slug] === v.value_public_id;
                        return (
                          <button
                            key={v.value_public_id}
                            type="button"
                            onClick={() =>
                              setSelection((prev) => ({
                                ...prev,
                                [attr.slug]: v.value_public_id,
                              }))
                            }
                            className={clsx(
                              "rounded border px-3 py-1.5 text-sm transition-colors",
                              active
                                ? "border-black bg-black text-white"
                                : "border-gray-300 hover:border-gray-500"
                            )}
                          >
                            {v.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {requiresVariant(product) && !selectedVariant && (
                  <p className="text-sm text-amber-600">
                    Select all options to continue.
                  </p>
                )}
              </div>
            )}

            <div className="mb-6 flex gap-3">
              <button
                type="button"
                onClick={handleOrder}
                disabled={isOutOfStock || !variantReady}
                className="btn-order-now"
              >
                {isOutOfStock
                  ? "OUT OF STOCK"
                  : !variantReady
                    ? "SELECT OPTIONS"
                    : "ORDER NOW"}
              </button>
              <button
                type="button"
                onClick={() => setIsWishlisted(!isWishlisted)}
                disabled
                className="btn-wishlist opacity-50 cursor-not-allowed"
                aria-label={
                  isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                }
              >
                <Heart className="h-5 w-5 transition-colors text-gray-600" />
              </button>
            </div>

            {isLowStock && !isOutOfStock && (
              <p className="mb-4 text-sm text-orange-600">
                Only {availableQty} left in stock — order soon
              </p>
            )}

            <div className="border-b border-gray-200">
              <CollapsibleSection title="PRODUCT DETAILS" defaultOpen>
                <p className="mb-3 whitespace-pre-wrap">{product.description}</p>
                <ul className="space-y-1.5 text-gray-600">
                  <li>• Category: {product.category_name}</li>
                  {product.brand ? <li>• Brand: {product.brand}</li> : null}
                  {product.sku ? <li>• SKU: {product.sku}</li> : null}
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

        {relatedProducts.length > 0 && (
          <div className="mt-16 lg:mt-24">
            <h2 className="section-title mb-8 text-center font-heading">
              You Might Also Like
            </h2>
            <div className="-mx-4 overflow-x-auto pb-4 px-4 lg:hidden">
              <div className="flex min-w-max gap-4">
                {relatedProducts.map((p) => (
                  <div key={p.public_id} className="w-[160px] flex-shrink-0">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden lg:grid lg:grid-cols-4 lg:gap-6">
              {relatedProducts.slice(0, 4).map((p) => (
                <ProductCard key={p.public_id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      <ImagePreviewModal
        isOpen={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        imageUrl={previewUrl || ""}
        altText={product.name}
      />
    </div>
  );
}
