"use client";

import Link from "next/link";
import Image from "next/image";
import type { StorefrontProductList } from "@/types/akkho";
import { getImageUrl } from "@/lib/api";

interface ProductCardProps {
  product: StorefrontProductList;
}

function getCategoryDisplayName(product: StorefrontProductList): string {
  return product.category_name || product.category_slug || "";
}

function parsePrice(s: string): number {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export function ProductCard({ product }: ProductCardProps) {
  const isOutOfStock = product.stock_status === "out_of_stock";
  const price = parsePrice(product.price);
  const original = product.original_price
    ? parsePrice(product.original_price)
    : null;
  const hasDiscount =
    original != null && original > price && original > 0;
  const discountPercent = hasDiscount
    ? Math.round(((original! - price) / original!) * 100)
    : 0;

  return (
    <div className="product-card product-card-group group w-full">
      <Link href={`/products/${encodeURIComponent(product.slug)}`} className="block w-full">
        <div className="product-card-image-wrap relative">
          {getImageUrl(product.image_url) ? (
            <Image
              src={getImageUrl(product.image_url)!}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="product-card-image object-cover"
              unoptimized
            />
          ) : (
            <div className="product-card-placeholder">
              <span className="product-card-placeholder-text">No Image</span>
            </div>
          )}

          {hasDiscount && discountPercent > 0 && (
            <div className="badge-discount">{discountPercent}% OFF</div>
          )}

          {isOutOfStock && (
            <div className="badge-soldout">Sold Out</div>
          )}
        </div>
      </Link>

      <div className="product-card-body">
        <Link href={`/products/${encodeURIComponent(product.slug)}`} className="block">
          <div className="product-card-title">{product.name}</div>
          <div className="product-card-category">{getCategoryDisplayName(product)}</div>
        </Link>

        <div className="space-y-0.5 mb-1.5 md:mb-2">
          {hasDiscount && original != null ? (
            <>
              <div className="product-card-price-old">
                {original.toFixed(0)}৳
              </div>
              <div className="flex items-baseline gap-2">
                <span className="product-card-price-current font-mono">
                  {price.toFixed(0)} ৳
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="product-card-price-current font-mono">
                {price.toFixed(0)} ৳
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
