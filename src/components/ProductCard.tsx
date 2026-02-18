"use client";

import Link from "next/link";
import Image from "next/image";
import { Product, getImageUrl } from "@/lib/api";

interface ProductCardProps {
  product: Product;
}

// Get category display name from product
function getCategoryDisplayName(product: Product): string {
  // Use new nested category object if available
  if (product.category && typeof product.category === 'object') {
    if (product.category.parent_name) {
      return `${product.category.parent_name} - ${product.category.name}`;
    }
    return product.category.name;
  }
  // Fallback to category_slug for backward compatibility
  return product.category_slug || '';
}

export function ProductCard({ product }: ProductCardProps) {
  const isOutOfStock = product.stock === 0;
  const hasDiscount = product.has_offer && product.offer_price;
  const discountPercent = hasDiscount 
    ? Math.round(((parseFloat(product.regular_price) - parseFloat(product.offer_price!)) / parseFloat(product.regular_price)) * 100)
    : 0;

  return (
    <div className="product-card product-card-group group w-full">
      <Link href={`/products/${product.id}`} className="block w-full">
        <div className="product-card-image-wrap relative">
          {getImageUrl(product.image) ? (
            <Image
              src={getImageUrl(product.image)!}
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
        <Link href={`/products/${product.id}`} className="block">
          <div className="product-card-title">{product.name}</div>
          <div className="product-card-category">{getCategoryDisplayName(product)}</div>
        </Link>

        <div className="space-y-0.5 mb-1.5 md:mb-2">
          {hasDiscount && product.offer_price ? (
            <>
              <div className="product-card-price-old">
                {parseFloat(product.regular_price).toFixed(0)}৳
              </div>
              <div className="flex items-baseline gap-2">
                <span className="product-card-price-current font-mono">
                  {parseFloat(product.offer_price).toFixed(0)} ৳
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="product-card-price-current font-mono">
                {parseFloat(product.regular_price).toFixed(0)} ৳
              </span>
            </div>
          )}
        </div>

        <Link
          href={`/order?productId=${product.id}`}
          className={isOutOfStock ? "product-card-cta-disabled" : "product-card-cta"}
          onClick={(e) => {
            if (isOutOfStock) e.preventDefault();
          }}
        >
          {isOutOfStock ? "Sold Out" : "Order now"}
        </Link>
      </div>
    </div>
  );
}

