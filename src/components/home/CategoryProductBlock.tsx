import Link from "next/link";
import type { StorefrontProductList } from "@/types/akkho";
import { ProductCard } from "@/components/ProductCard";

const DISPLAY_LIMIT = 12;

interface CategoryProductBlockProps {
  categoryPublicId: string;
  categorySlug: string;
  products: StorefrontProductList[];
}

export function CategoryProductBlock({
  categoryPublicId,
  categorySlug,
  products,
}: CategoryProductBlockProps) {
  const displayed = products.slice(0, DISPLAY_LIMIT);
  const hasMore = products.length > DISPLAY_LIMIT;
  const viewMoreHref = categorySlug
    ? `/products?category=${encodeURIComponent(categorySlug)}`
    : "/products";

  return (
    <section
      className="homepage-category-block container-main border-b border-gray-100 py-10 md:py-12 last:border-b-0"
      aria-label="Product group"
      data-category-id={categoryPublicId}
    >
      <div className="homepage-category-product-grid">
        {displayed.map((product) => (
          <ProductCard key={product.public_id} product={product} />
        ))}
      </div>
      {hasMore ? (
        <div className="view-more-wrap">
          <Link href={viewMoreHref} className="btn-outline inline-block">
            View More
          </Link>
        </div>
      ) : null}
    </section>
  );
}
